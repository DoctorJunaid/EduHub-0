import express from "express";
import apiRoutes from "./routes/index.routes.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Parse incoming JSON body data
app.use(express.json());

// Set up __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load openapi.yml from /docs/openapi.yml
const swaggerDocument = YAML.load(path.join(__dirname, "../docs/openapi.yml"));

// Serve Interactive Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
