/**
 * React Query Hook for Authorized Contacts (Who this user can message/tag)
 */
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportContacts() {
  const query = useQuery({
    queryKey: qk.supportContacts(),
    queryFn: async () => {
      const res = await api.getSupportContactsApi();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    contacts: query.data || [],
  };
}

export default useSupportContacts;
