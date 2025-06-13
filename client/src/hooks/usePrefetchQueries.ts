import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Performance optimization hook for intelligent query prefetching
 * Reduces perceived load times by prefetching likely-to-be-needed data
 */
export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  // Prefetch project data when user hovers over project links
  const prefetchProject = useCallback((projectId: number) => {
    const projectQueries = [
      `/api/projects/${projectId}/compensation-events`,
      `/api/projects/${projectId}/early-warnings`,
      `/api/projects/${projectId}/rfis`,
      `/api/projects/${projectId}/non-conformance-reports`,
      `/api/projects/${projectId}/chat-messages`,
    ];

    projectQueries.forEach(queryKey => {
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });
  }, [queryClient]);

  // Prefetch RFI details when hovering over RFI list items
  const prefetchRfiDetails = useCallback((projectId: number, rfiId: number) => {
    queryClient.prefetchQuery({
      queryKey: [`/api/projects/${projectId}/rfis/${rfiId}`],
      staleTime: 10 * 60 * 1000, // RFI details change less frequently
    });
  }, [queryClient]);

  // Prefetch equipment data for procurement workflows
  const prefetchEquipmentData = useCallback((projectId: number) => {
    const equipmentQueries = [
      `/api/projects/${projectId}/equipment-hire`,
      `/api/projects/${projectId}/purchase-orders`,
      `/api/projects/${projectId}/inventory`,
    ];

    equipmentQueries.forEach(queryKey => {
      queryClient.prefetchQuery({
        queryKey: [queryKey],
        staleTime: 15 * 60 * 1000, // Equipment data is more stable
      });
    });
  }, [queryClient]);

  // Prefetch user and project context for faster navigation
  const prefetchUserContext = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['/api/user'],
      staleTime: 30 * 60 * 1000, // User data rarely changes during session
    });

    queryClient.prefetchQuery({
      queryKey: ['/api/projects'],
      staleTime: 10 * 60 * 1000, // Project list updates occasionally
    });
  }, [queryClient]);

  // Intelligent background refresh for critical alerts
  const refreshCriticalData = useCallback((projectId: number) => {
    const criticalQueries = [
      `/api/projects/${projectId}/agent-alerts`,
      `/api/projects/${projectId}/notifications`,
    ];

    criticalQueries.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  }, [queryClient]);

  return {
    prefetchProject,
    prefetchRfiDetails,
    prefetchEquipmentData,
    prefetchUserContext,
    refreshCriticalData,
  };
}