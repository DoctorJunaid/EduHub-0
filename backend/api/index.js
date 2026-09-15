import app from "../src/app.js";
import connectDB from "../src/config/db.js";

/**
 * Vercel Serverless Function Handler for EduHub Express Backend
 */
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Vercel Serverless Handler Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection or serverless execution error.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
}
