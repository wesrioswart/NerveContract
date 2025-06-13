import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false
): Promise<Response> {
  const headers: Record<string, string> = {};
  let body: string | FormData | undefined = undefined;
  
  if (data) {
    if (isFormData) {
      // If data is FormData, pass it directly
      body = data as FormData;
    } else {
      // Otherwise, stringify as JSON and set Content-Type
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - data kept in cache
      retry: (failureCount, error: any) => {
        // Don't retry on 404s - resource doesn't exist
        if (error?.message?.includes('404')) return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchInterval: false, // No automatic polling
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry client errors (400-499)
        if (error?.message && /^4\d\d/.test(error.message)) return false;
        // Retry server errors up to 2 times
        return failureCount < 2;
      },
    },
  },
});
