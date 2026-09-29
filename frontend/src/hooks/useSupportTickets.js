/**
 * React Query Hooks for Support Tickets
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
  supportMessages: (ticketId) => ["support-messages", ticketId],
};

// 1. List Tickets Query Hook
export function useSupportTickets(params = {}, options = {}) {
  return useQuery({
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
}

// 2. Single Ticket Hook
export function useSupportTicket(id, options = {}) {
  return useQuery({
    queryKey: qk.supportTicket(id),
    queryFn: async () => {
      const res = await api.getTicketApi(id);
      return res.data; // { ticket, messages }
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// 3. Create Ticket Mutation Hook
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.createTicketApi(payload),
    onSuccess: (data) => {
      toast.success(data?.message || "Conversation started successfully!");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to start conversation";
      toast.error(msg);
    },
  });
}

// 4. Reply to Ticket Mutation Hook
export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, payload }) => api.replyTicketApi(ticketId, payload),
    onSuccess: (data, variables) => {
      toast.success("Message sent");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(msg);
    },
  });
}

// 5. Assign Ticket Mutation Hook
export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
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
}

// 6. Change Ticket Status Mutation Hook
export function useChangeTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
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
}

// 7. Escalate Ticket Mutation Hook
export function useEscalateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
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
}

// 8. Close Ticket Mutation Hook
export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId) => api.closeTicketApi(ticketId),
    onSuccess: (data, ticketId) => {
      toast.success(data?.message || "Conversation marked as solved");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: qk.supportStats() });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to close conversation";
      toast.error(msg);
    },
  });
}

// 9. Rate Ticket Mutation Hook
export function useRateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, rating, comment }) => api.rateTicketApi(ticketId, rating, comment),
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Thank you for rating!");
      queryClient.invalidateQueries({ queryKey: qk.supportTicket(variables.ticketId) });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to submit rating";
      toast.error(msg);
    },
  });
}

export default useSupportTickets;
