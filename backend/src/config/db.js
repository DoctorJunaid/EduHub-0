import mongoose from "mongoose";
import dns from "node:dns";

const configureMongoDns = () => {
  const mongoUri = process.env.MONGO_URI || "";
  if (!mongoUri.startsWith("mongodb+srv://")) return;

  const configuredServers = process.env.MONGO_DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (configuredServers?.length) {
    dns.setServers(configuredServers);
  } else {
    try {
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    } catch {
      // Ignore if setServers fails in constrained environments
    }
  }
};

/**
 * Connect to MongoDB using Mongoose with connection caching for serverless environments (Vercel)
 */
const connectDB = async (retries = 5, delay = 3000) => {
  // If already connected or connecting, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      configureMongoDns();
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("Database connected successfully.");
      return conn;
    } catch (error) {
      console.error(`Database Connection Error (attempt ${attempt}/${retries}): ${error.message}`);
      if (error.message?.includes("queryTxt") || error.message?.includes("querySrv")) {
        console.error(
          "Tip: Your network / ISP is timing out on DNS SRV/TXT lookups. Use a direct replica-set MongoDB URI or specify MONGO_DNS_SERVERS in .env"
        );
      }
      if (attempt < retries) {
        console.log(`Retrying database connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Only exit process in non-serverless local development after all retries fail
        if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
          process.exit(1);
        }
        throw error;
      }
    }
  }
};

// Optional: Log connection events for runtime stability
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected! Attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB runtime error: ${err}`);
});

export default connectDB;
