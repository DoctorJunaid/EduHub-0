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
    return;
  }

  // Node's SRV resolver can fail when a local DNS proxy refuses SRV queries.
  // In that case, use public resolvers for this process only.
  const activeServers = dns.getServers();
  const localResolverOnly = activeServers.length > 0 && activeServers.every(
    (server) => server === "::1" || server.startsWith("127.")
  );

  if (localResolverOnly) {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    console.warn("Local DNS proxy detected; using fallback DNS for MongoDB Atlas SRV lookup.");
  }
};

/**
 * Connect to MongoDB using Mongoose with connection caching for serverless environments (Vercel)
 */
const connectDB = async () => {
  // If already connected or connecting, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    configureMongoDns();
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Only exit process in non-serverless local development
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
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
