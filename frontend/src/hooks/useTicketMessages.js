/**
 * React Query Hook for Support Ticket Messages
 */
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/support.api";

export function useTicketMessages(ticketId) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const res = await api.getTicketMessagesApi(ticketId);
      return res.data || [];
    },
    enabled: Boolean(ticketId),
    staleTime: 5 * 60 * 1000,
  });
}

export default useTicketMessages;
