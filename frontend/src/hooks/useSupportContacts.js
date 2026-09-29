/**
 * React Query Hook for Support Contacts
 */
import { useQuery } from "@tanstack/react-query";
import { getSupportContactsApi } from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportContacts(options = {}) {
  const query = useQuery({
    queryKey: qk.supportContacts(),
    queryFn: async () => {
      const res = await getSupportContactsApi();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

export default useSupportContacts;
