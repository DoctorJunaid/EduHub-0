import mongoose from "mongoose";

/**
 * Connect to MongoDB using Mongoose
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected successfully.");
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Exit process with failure code if unable to establish initial connection
    process.exit(1);
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
