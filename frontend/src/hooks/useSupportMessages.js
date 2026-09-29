/**
 * React Query Hook for Support Thread Messages
 */
import { useQuery } from "@tanstack/react-query";
import { getTicketMessagesApi } from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportMessages(ticketId, options = {}) {
  const query = useQuery({
    queryKey: qk.supportMessages(ticketId),
    queryFn: async () => {
      const res = await getTicketMessagesApi(ticketId);
      return res.data || [];
    },
    enabled: Boolean(ticketId),
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useSupportMessages;
