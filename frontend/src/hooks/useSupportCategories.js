/**
 * React Query Hook for Support Categories
 */
import { useQuery } from "@tanstack/react-query";
import { getSupportCategoriesApi } from "../api/support.api";
import { qk } from "./useSupportTickets";

export function useSupportCategories(options = {}) {
  const query = useQuery({
    queryKey: qk.supportCategories(),
    queryFn: async () => {
      const res = await getSupportCategoriesApi();
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

export default useSupportCategories;
