import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

/**
 * Enhanced query hook with performance optimizations for NEC4 platform
 * Provides intelligent caching and error handling for contract management data
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey'>
) {
  // Memoize query key to prevent unnecessary re-renders
  const stableQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);

  // Enhanced error handling for common platform scenarios
  const retryFn = useCallback((failureCount: number, error: any) => {
    // Don't retry on authentication errors
    if (error?.message?.includes('401') || error?.message?.includes('403')) {
      return false;
    }
    
    // Don't retry on validation errors (400, 422)
    if (error?.message?.includes('400') || error?.message?.includes('422')) {
      return false;
    }
    
    // Retry network errors and server errors up to 3 times
    return failureCount < 3;
  }, []);

  return useQuery({
    queryKey: stableQueryKey,
    retry: retryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes - good for contract data
    gcTime: 15 * 60 * 1000, // 15 minutes - keep project data longer
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Optimized query for frequently accessed project data
 * Extended cache time for stable contract information
 */
export function useProjectQuery<TData = unknown>(
  projectId: number,
  endpoint: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey'>
) {
  return useOptimizedQuery(
    [`/api/projects/${projectId}/${endpoint}`],
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - project data changes less frequently
      gcTime: 30 * 60 * 1000, // 30 minutes - keep project context longer
      ...options,
    }
  );
}

/**
 * Optimized query for real-time data like alerts and notifications
 * Shorter cache times for dynamic content
 */
export function useRealTimeQuery<TData = unknown>(
  queryKey: QueryKey,
  options?: Omit<UseQueryOptions<TData>, 'queryKey'>
) {
  return useOptimizedQuery(queryKey, {
    staleTime: 30 * 1000, // 30 seconds - real-time data
    gcTime: 2 * 60 * 1000, // 2 minutes - don't keep stale alerts long
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
}