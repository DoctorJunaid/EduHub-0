/**
 * JWT Token Generation Utility
 * Signs a JSON Web Token containing the user's id, role, instituteId, and campusId.
 */
import jwt from "jsonwebtoken";

const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET || "default_jwt_secret_key", {
    expiresIn,
  });
};

export default generateToken;
