/**
 * Help & Support API Client
 * Wraps all endpoints for tickets, messaging, SLAs, and assignment.
 */
import axiosInstance from "./axiosInstance";

// 1. Create a new support ticket
export const createTicketApi = async (payload) => {
  const res = await axiosInstance.post("/support/tickets", payload);
  return res.data;
};

// 2. List tickets (paginated, role-scoped, with filters)
export const listTicketsApi = async (params = {}) => {
  const res = await axiosInstance.get("/support/tickets", { params });
  return res.data;
};

// 3. Get single ticket with details & threaded messages
export const getTicketApi = async (ticketId) => {
  const res = await axiosInstance.get(`/support/tickets/${ticketId}`);
  return res.data;
};

// 4. Assign ticket to a staff member (admin only)
export const assignTicketApi = async (ticketId, assigneeId) => {
  const res = await axiosInstance.put(`/support/tickets/${ticketId}/assign`, { assigneeId });
  return res.data;
};

// 5. Change ticket status (admin only)
export const changeTicketStatusApi = async (ticketId, status) => {
  const res = await axiosInstance.put(`/support/tickets/${ticketId}/status`, { status });
  return res.data;
};

// 6. Escalate ticket up one hierarchy level (admin only)
export const escalateTicketApi = async (ticketId, reason) => {
  const res = await axiosInstance.put(`/support/tickets/${ticketId}/escalate`, { reason });
  return res.data;
};

// 7. Close ticket (creator or admin)
export const closeTicketApi = async (ticketId) => {
  const res = await axiosInstance.post(`/support/tickets/${ticketId}/close`);
  return res.data;
};

// 8. Submit satisfaction rating & feedback (creator only)
export const rateTicketApi = async (ticketId, rating, comment) => {
  const res = await axiosInstance.post(`/support/tickets/${ticketId}/rate`, { rating, comment });
  return res.data;
};

// 9. Reply to ticket
export const replyTicketApi = async (ticketId, payload) => {
  const res = await axiosInstance.post(`/support/tickets/${ticketId}/messages`, payload);
  return res.data;
};

// 10. Get all messages for a ticket
export const getTicketMessagesApi = async (ticketId) => {
  const res = await axiosInstance.get(`/support/tickets/${ticketId}/messages`);
  return res.data;
};

// 11. Mark message as read
export const markMessageReadApi = async (messageId) => {
  const res = await axiosInstance.put(`/support/messages/${messageId}/read`);
  return res.data;
};

// 12. Get scoped dashboard KPIs & SLA stats
export const getSupportStatsApi = async () => {
  const res = await axiosInstance.get("/support/stats");
  return res.data;
};

// 13. Get category list for current user's role
export const getSupportCategoriesApi = async () => {
  const res = await axiosInstance.get("/support/categories");
  return res.data;
};

// 14. Get contacts list (who this user can message/tag)
export const getSupportContactsApi = async () => {
  const res = await axiosInstance.get("/support/contacts");
  return res.data;
};

export default {
  createTicketApi,
  listTicketsApi,
  getTicketApi,
  assignTicketApi,
  changeTicketStatusApi,
  escalateTicketApi,
  closeTicketApi,
  rateTicketApi,
  replyTicketApi,
  getTicketMessagesApi,
  markMessageReadApi,
  getSupportStatsApi,
  getSupportCategoriesApi,
  getSupportContactsApi,
};
