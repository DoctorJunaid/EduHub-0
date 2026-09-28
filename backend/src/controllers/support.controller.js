/**
 * Support Controller Layer
 * Handles incoming HTTP requests and delegates strictly to support.service.js.
 */
import * as supportService from "../services/support.service.js";

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await supportService.createTicket(req.user, req.body);
    res.status(201).json({
      success: true,
      message: `Support ticket ${ticket.ticketNumber} created successfully`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const listTickets = async (req, res, next) => {
  try {
    const result = await supportService.listTickets(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.tickets,
      total: result.total,
      page: result.page,
      limit: result.limit,
      pageCount: result.pageCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await supportService.getTicket(req.user, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    if (!assigneeId) {
      return res.status(400).json({
        success: false,
        message: "assigneeId is required",
      });
    }
    const ticket = await supportService.assignTicket(req.user, id, assigneeId);
    res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }
    const ticket = await supportService.changeStatus(req.user, id, status);
    res.status(200).json({
      success: true,
      message: `Ticket status updated to "${status}"`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const escalateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ticket = await supportService.escalateTicket(req.user, id, reason);
    res.status(200).json({
      success: true,
      message: `Ticket escalated to Level ${ticket.escalationLevel}`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await supportService.replyToTicket(req.user, id, req.body);
    res.status(201).json({
      success: true,
      message: "Reply posted successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await supportService.getTicket(req.user, id);
    res.status(200).json({
      success: true,
      data: result.messages,
      count: result.messages.length,
    });
  } catch (error) {
    next(error);
  }
};

export const closeTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await supportService.closeTicket(req.user, id);
    res.status(200).json({
      success: true,
      message: "Ticket marked as closed",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const rateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const ticket = await supportService.rateTicket(req.user, id, rating, comment);
    res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await supportService.getStats(req.user);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = supportService.getCategoriesForRole(req.user.role);
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req, res, next) => {
  try {
    const contacts = await supportService.getContacts(req.user);
    res.status(200).json({
      success: true,
      data: contacts,
      count: contacts.length,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createTicket,
  listTickets,
  getTicket,
  assignTicket,
  changeStatus,
  escalateTicket,
  replyToTicket,
  getTicketMessages,
  closeTicket,
  rateTicket,
  getStats,
  getCategories,
  getContacts,
};
