/**
 * React Query Hook for Support Tickets
 * Handles list fetching, detail queries, and all ticket mutations with automatic cache invalidation.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as api from "../api/support.api";

export const qk = {
  supportTickets: (params) => ["support-tickets", params],
  supportTicket: (id) => ["support-ticket", id],
  supportStats: () => ["support-stats"],
  supportCategories: () => ["support-categories"],
  supportContacts: () => ["support-contacts"],
};

export function useSupportTickets(params = {}, options = {}) {
  const queryClient = useQueryClient();

  // 1. List query
  const ticketsQuery = useQuery({
    queryKey: qk.supportTickets(params),
    queryFn: async () => {
      const res = await api.listTicketsApi(params);
      return {
        tickets: res.data || [],
        total: res.total || 0,
        page: res.page || 1,
        limit: res.limit || 20,
        pageCount: res.pageCount || 1,
      };
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });

  // 2. Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: (payload) => api.createTicketApi(payload),
    onSuccess: (data) => {
      toast.success(data?.message || "Ticket created successfully!");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to create ticket";
      toast.error(msg);
    },
  });

  // 3. Assign Ticket Mutation
  const assignTicketMutation = useMutation({
    mutationFn: ({ ticketId, assigneeId }) => api.assignTicketApi(ticketId, assigneeId),
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Ticket assigned successfully");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to assign ticket";
      toast.error(msg);
    },
  });

  // 4. Change Status Mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }) => api.changeTicketStatusApi(ticketId, status),
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Status updated successfully");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to update status";
      toast.error(msg);
    },
  });

  // 5. Escalate Mutation
  const escalateMutation = useMutation({
    mutationFn: ({ ticketId, reason }) => api.escalateTicketApi(ticketId, reason),
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Ticket escalated successfully");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to escalate ticket";
      toast.error(msg);
    },
  });

  // 6. Close Ticket Mutation
  const closeTicketMutation = useMutation({
    mutationFn: (ticketId) => api.closeTicketApi(ticketId),
    onSuccess: (data, ticketId) => {
      toast.success(data?.message || "Ticket closed successfully");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to close ticket";
      toast.error(msg);
    },
  });

  // 7. Rate Ticket Mutation
  const rateTicketMutation = useMutation({
    mutationFn: ({ ticketId, rating, comment }) => api.rateTicketApi(ticketId, rating, comment),
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Thank you for your rating!");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to submit rating";
      toast.error(msg);
    },
  });

  return {
    ...ticketsQuery,
    tickets: ticketsQuery.data?.tickets || [],
    total: ticketsQuery.data?.total || 0,
    pageCount: ticketsQuery.data?.pageCount || 1,

    // Mutations
    createTicket: createTicketMutation.mutateAsync,
    isCreating: createTicketMutation.isPending,

    assignTicket: assignTicketMutation.mutateAsync,
    isAssigning: assignTicketMutation.isPending,

    changeStatus: changeStatusMutation.mutateAsync,
    isChangingStatus: changeStatusMutation.isPending,

    escalateTicket: escalateMutation.mutateAsync,
    isEscalating: escalateMutation.isPending,

    closeTicket: closeTicketMutation.mutateAsync,
    isClosing: closeTicketMutation.isPending,

    rateTicket: rateTicketMutation.mutateAsync,
    isRating: rateTicketMutation.isPending,
  };
}

export function useSupportTicketDetail(ticketId) {
  const queryClient = useQueryClient();

  const ticketQuery = useQuery({
    queryKey: qk.supportTicket(ticketId),
    queryFn: async () => {
      const res = await api.getTicketApi(ticketId);
      return res.data;
    },
    enabled: Boolean(ticketId),
    staleTime: 5 * 60 * 1000,
  });

  const replyMutation = useMutation({
    mutationFn: (payload) => api.replyTicketApi(ticketId, payload),
    onSuccess: () => {
      toast.success("Reply posted");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to post reply";
      toast.error(msg);
    },
  });

  return {
    ...ticketQuery,
    ticket: ticketQuery.data?.ticket || null,
    messages: ticketQuery.data?.messages || [],
    replyTicket: replyMutation.mutateAsync,
    isReplying: replyMutation.isPending,
  };
}

export default useSupportTickets;
