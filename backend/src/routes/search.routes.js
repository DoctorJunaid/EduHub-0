import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { globalSearch } from "../controllers/search.controller.js";

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (token && token !== "null" && token !== "undefined") {
      const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? undefined : "default_jwt_secret_key");
      if (secret) {
        const decoded = jwt.verify(token, secret);
        if (decoded && decoded.id) {
          const currentUser = await User.findById(decoded.id).select("-passwordHash");
          if (currentUser) {
            req.user = currentUser;
          }
        }
      }
    }
  } catch {
    // Graceful fallback for search
  }
  next();
};

const router = express.Router();

// Resilient global search endpoint (supports authenticated & optional context)
router.get("/", optionalAuth, globalSearch);

export default router;
