/**
 * React Query Hook for Support Categories based on current user role
 */
import { useQuery } from "@tanstack/react-query";
import * as api from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportCategories() {
  const query = useQuery({
    queryKey: qk.supportCategories(),
    queryFn: async () => {
      const res = await api.getSupportCategoriesApi();
      return res.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    ...query,
    categories: query.data || [
      "Technical Issue",
      "Academic",
      "Attendance",
      "Fees & Payments",
      "Library",
      "Transport",
      "Discipline",
      "Other",
    ],
  };
}

export default useSupportCategories;
