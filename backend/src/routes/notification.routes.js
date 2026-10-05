import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/notification.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", controller.getNotifications);
router.put("/read-all", controller.markAllRead);
router.put("/:id/read", controller.markRead);
router.delete("/:id", controller.deleteNotification);
router.post("/test", controller.sendTestNotification);

export default router;
