import asyncHandler from "../utils/asyncHandler.js";
import * as svc from "../services/teacherAttendance.service.js";

const getCampusId = (req) => {
  const campusId = req.user?.campusId;
  if (!campusId) {
    const error = new Error("Campus context is required. No campus assigned to user.");
    error.statusCode = 400;
    throw error;
  }
  return campusId;
};

// @desc    Get KPI attendance statistics for a campus on a specific date
// @route   GET /api/v1/campus/attendance/teachers/stats?date=YYYY-MM-DD
// @access  Private (campus_admin, campus_manager)
export const getStats = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  const data = await svc.getStats(campusId, req.query.date);
  return res.status(200).json({
    success: true,
    message: "Faculty attendance statistics retrieved successfully",
    data,
  });
});

// @desc    List all teachers with merged attendance for a specific date
// @route   GET /api/v1/campus/attendance/teachers?date=&status=&department=&search=
// @access  Private (campus_admin, campus_manager)
export const listAttendance = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  const data = await svc.getAttendanceByDate(campusId, req.query.date, {
    status: req.query.status,
    department: req.query.department,
    search: req.query.search,
  });

  return res.status(200).json({
    success: true,
    message: "Faculty attendance records retrieved successfully",
    count: data.length,
    data,
  });
});

// @desc    Get weekly attendance grid for a campus
// @route   GET /api/v1/campus/attendance/teachers/weekly?date=
// @access  Private (campus_admin, campus_manager)
export const getWeekly = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  const data = await svc.getWeekly(campusId, req.query.date);

  return res.status(200).json({
    success: true,
    message: "Weekly faculty attendance grid retrieved successfully",
    data,
  });
});

// @desc    Get paginated attendance history
// @route   GET /api/v1/campus/attendance/teachers/history?page=&limit=
// @access  Private (campus_admin, campus_manager)
export const getHistory = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  const data = await svc.getHistory(campusId, {
    page: req.query.page,
    limit: req.query.limit,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    status: req.query.status,
    department: req.query.department,
    search: req.query.search,
  });

  return res.status(200).json({
    success: true,
    message: "Attendance history retrieved successfully",
    data: data.items,
    pagination: {
      total: data.total,
      page: data.page,
      limit: data.limit,
      pages: data.pages,
    },
  });
});

// @desc    Record (upsert) attendance for a teacher
// @route   POST /api/v1/campus/attendance/teachers
// @access  Private (campus_admin, campus_manager)
export const markAttendance = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  try {
    const data = await svc.markAttendance(
      campusId,
      req.user?._id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Attendance recorded successfully",
      data,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already recorded for this teacher on this date",
      });
    }
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
});

// @desc    Update an existing attendance record
// @route   PUT /api/v1/campus/attendance/teachers/:id
// @access  Private (campus_admin, campus_manager)
export const updateAttendance = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  try {
    const data = await svc.updateAttendance(
      req.params.id,
      campusId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
});

// @desc    Delete an attendance record
// @route   DELETE /api/v1/campus/attendance/teachers/:id
// @access  Private (campus_admin, campus_manager)
export const deleteAttendance = asyncHandler(async (req, res) => {
  const campusId = getCampusId(req);
  try {
    await svc.deleteAttendance(req.params.id, campusId);

    return res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
});