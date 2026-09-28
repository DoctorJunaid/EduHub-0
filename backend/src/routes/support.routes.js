/**
 * Support Routes
 * API endpoints for Help & Support tickets, threaded messaging, assignments, and SLAs.
 */
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  rateLimitTicketCreate,
  rateLimitTicketReply,
} from "../middleware/rateLimit.middleware.js";
import * as controller from "../controllers/support.controller.js";

const router = express.Router();

// All support routes require authentication
router.use(protect);

// 1. Meta & Stats
router.get("/stats", controller.getStats);
router.get("/categories", controller.getCategories);
router.get("/contacts", controller.getContacts);

// 2. Ticket Management
router.post("/tickets", rateLimitTicketCreate, controller.createTicket);
router.get("/tickets", controller.listTickets);
router.get("/tickets/:id", controller.getTicket);
router.put("/tickets/:id/assign", controller.assignTicket);
router.put("/tickets/:id/status", controller.changeStatus);
router.put("/tickets/:id/escalate", controller.escalateTicket);
router.post("/tickets/:id/close", controller.closeTicket);
router.post("/tickets/:id/rate", controller.rateTicket);

// 3. Threaded Messages & Replies
router.post("/tickets/:id/messages", rateLimitTicketReply, controller.replyToTicket);
router.get("/tickets/:id/messages", controller.getTicketMessages);

export default router;
