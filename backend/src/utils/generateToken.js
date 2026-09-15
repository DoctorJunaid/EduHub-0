/**
 * JWT Token Generation Utility
 * Signs a JSON Web Token containing the user's id, role, instituteId, and campusId.
 */
import jwt from "jsonwebtoken";

const generateToken = (payload, expiresIn = "7d") => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? undefined : "default_jwt_secret_key");
  if (!secret) throw new Error("JWT_SECRET is missing in production");
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export default generateToken;
