/**
 * React Query Hook for Support Stats & KPIs
 */
import { useQuery } from "@tanstack/react-query";
import { getSupportStatsApi } from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportStats(options = {}) {
  const query = useQuery({
    queryKey: qk.supportStats(),
    queryFn: async () => {
      const res = await getSupportStatsApi();
      return (
        res.data || {
          badgeCount: 0,
          waiting: 0,
          lookingAt: 0,
          answered: 0,
          done: 0,
          escalated: 0,
          overdue: 0,
          avgResolutionHours: 0,
          avgFirstResponseHours: 0,
        }
      );
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useSupportStats;
