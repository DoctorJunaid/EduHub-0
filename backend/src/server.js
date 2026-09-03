import "dotenv/config"; // Loads .env BEFORE importing relative modules
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

/**
 * Start the application server
 */
const startServer = async () => {
  try {
    // 1. Connect to the database first
    await connectDB();

    // 2. Start listening on the configured port
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
    });

    // 3. Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // 4. Handle uncaught exceptions
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
