import mongoose from "mongoose";

/**
 * Middleware: Validate studentId in request body.
 *
 * Ensures:
 *  1. studentId is present in req.body
 *  2. studentId is a valid MongoDB ObjectId
 *
 * Must be used AFTER the `protect` middleware.
 *
 * Usage in routes:
 *   router.post("/students", protect, isCampusAdmin, validateStudentId, addStudentToCampus);
 */
export const validateStudentId = (req, res, next) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "studentId is required in the request body",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({
      success: false,
      message: "studentId must be a valid MongoDB ObjectId",
    });
  }

  next();
};

export default validateStudentId;
