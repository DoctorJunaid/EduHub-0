/**
 * Middleware: requireDev
 * Restricts seed endpoints in production unless explicitly permitted via ALLOW_SEED=true
 */
export const requireDev = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const allowSeed = process.env.ALLOW_SEED === "true";

  if (isProduction && !allowSeed) {
    return res.status(403).json({
      success: false,
      message: "Seeding is strictly disabled in production environments.",
    });
  }

  next();
};

export default requireDev;
