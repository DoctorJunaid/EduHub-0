/**
 * React Query Hook for Support Dashboard KPIs & Badge Count
 */
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportStats() {
  const query = useQuery({
    queryKey: qk.supportStats(),
    queryFn: async () => {
      const res = await api.getSupportStatsApi();
      return res.data || {
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        total: 0,
        badgeCount: 0,
        sla: {
          ticketsWithinSLA: 0,
          ticketsOverdue: 0,
          avgFirstResponseHours: 0,
          avgResolutionHours: 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    stats: query.data || {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      total: 0,
      badgeCount: 0,
      sla: {
        ticketsWithinSLA: 0,
        ticketsOverdue: 0,
        avgFirstResponseHours: 0,
        avgResolutionHours: 0,
      },
    },
  };
}

export default useSupportStats;
