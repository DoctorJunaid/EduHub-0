import jwt from "jsonwebtoken";

/**
 * Generate a signed JWT token
 * @param {Object} payload - { id, role }
 * @param {string} [expiresIn="7d"]
 * @returns {string} signed JWT
 */
const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
    expiresIn,
  });
};

export default generateToken;
