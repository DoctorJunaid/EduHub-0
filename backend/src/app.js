import express from "express";
import apiRoutes from "./routes/index.js";

const app = express();

// Parse incoming JSON body data
app.use(express.json());

// Also health
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Health Check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// API Routes
app.use("/api/v1", apiRoutes);

// Simple 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Simple global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;
