/**
 * Express Application Setup
 * Configures middleware, API routes, swagger documentation, and centralized error handling.
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/index.routes.js";

const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set("trust proxy", 1);

// Security HTTP headers
app.use(helmet());

// CORS middleware supporting local dev, Vercel deployments, and configured FRONTEND_URL
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Request logger for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});


// Rate limiting (skip in development/localhost to prevent accidental blocking)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 3000 : 100000,
  skip: (req) => {
    if (process.env.NODE_ENV !== "production") return true;
    const ip = req.ip || req.socket?.remoteAddress || "";
    return ip === "127.0.0.1" || ip === "::1" || ip.endsWith("127.0.0.1");
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "50kb" })); // 50kb to handle populated timetable record payloads
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
// Disabled temporarily: express-mongo-sanitize v2.2.0 crashes in Express 5.0 because req.query is read-only.
// app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Set up __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional Swagger UI documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, "../docs/openapi.yml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  // Swagger file missing or invalid; continue without crashing
}

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EduHub API Server is live.",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy.",
  });
});

// Redirect /set-password to the frontend SetPassword page
app.get("/set-password", (req, res) => {
  const token = req.query.token;
  const frontendUrl = (process.env.FRONTEND_URL || "https://edu-hub0-frontend.vercel.app").replace(/\/+$/, "");
  if (!token) {
    return res.redirect(`${frontendUrl}/login`);
  }
  return res.redirect(`${frontendUrl}/set-password?token=${encodeURIComponent(token)}`);
});

// Mount Versioned API Routes
app.use("/api/v1", apiRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`,
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // 1. Mongoose Duplicate Key Error (E11000) -> 409 Conflict
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    message = `Duplicate value '${value}' entered for ${field}. Please use another value.`;
  }

  // 2. Mongoose Schema Validation Error -> 400 Bad Request
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // 3. Mongoose CastError (Invalid ObjectId) -> 400 Bad Request
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // 4. JWT Token Expired -> 401 Unauthorized
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired. Please log in again.";
  }

  // 5. JWT Invalid -> 401 Unauthorized
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
