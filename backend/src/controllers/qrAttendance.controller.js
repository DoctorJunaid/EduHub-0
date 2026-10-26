import {
  processQrAttendanceScan,
  getAttendanceSystemDiagnostics,
} from "../services/qrAttendance.service.js";

/**
 * @desc    Record Student Attendance via QR Code Scan
 * @route   POST /api/v1/campus-admin/attendance/qr-scan
 * @route   POST /api/v1/teacher/attendance/qr-scan
 * @access  Private (Campus Managers, Admins, Teachers)
 */
export const recordQrScanAttendance = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to scan attendance.",
      });
    }

    const result = await processQrAttendanceScan(req.user, req.body, req);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      code: err.code || "SCAN_ERROR",
      message: err.message || "Failed to process QR attendance scan.",
      matches: err.matches || undefined,
    });
  }
};

/**
 * @desc    Get Attendance & QR Code System Health Check
 * @route   GET /api/v1/campus-admin/attendance/health-check
 * @access  Private (Campus Admin, Super Admin, Principal)
 */
export const getAttendanceHealthCheck = async (req, res) => {
  try {
    const campusId = req.user?.campusId?._id || req.user?.campusId || req.query?.campusId;
    const diagnostics = await getAttendanceSystemDiagnostics(campusId);

    return res.status(200).json({
      success: true,
      data: diagnostics,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to execute attendance health check.",
    });
  }
};

export default {
  recordQrScanAttendance,
  getAttendanceHealthCheck,
};
