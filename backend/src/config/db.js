import mongoose from "mongoose";

/**
 * Connect to MongoDB using Mongoose with connection caching for serverless environments (Vercel)
 */
const connectDB = async () => {
  // If already connected or connecting, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
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

