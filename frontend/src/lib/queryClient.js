import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds — fresh data without holding stale data for 5+ min
      gcTime: 5 * 60 * 1000, // 5 min garbage collection
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always ensure fresh fetch on component mount
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
