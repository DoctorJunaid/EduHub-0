/**
 * Server Entry Point
 * Initializes MongoDB connection and starts Express HTTP listener.
 */
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import dns from "dns";

// Set custom DNS servers (e.g., Google Public DNS)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`EduHub Backend running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // 3. Graceful rejection handling
    process.on("unhandledRejection", (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      console.error(`Uncaught Exception Error: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
