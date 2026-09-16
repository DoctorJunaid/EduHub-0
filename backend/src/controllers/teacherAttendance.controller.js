import * as svc from "../services/teacherAttendance.service.js";

const getCampusId = (req) => req.user?.campusId;

export const getStats = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId)
      return res.status(400).json({ success: false, message: "No campus assigned" });

    const data = await svc.getStats(campusId, req.query.date);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listAttendance = async (req, res) => {
  try {
    const campusId = getCampusId(req);
    if (!campusId)
      return res.status(400).json({ success: false, message: "No campus assigned" });

    const data = await svc.getAttendanceByDate(campusId, req.query.date, {
      status: req.query.status,
      department: req.query.department,
      search: req.query.search,
    });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWeekly = async (req, res) => {
  try {
    const data = await svc.getWeekly(getCampusId(req), req.query.date);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const data = await svc.getHistory(getCampusId(req), {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const data = await svc.markAttendance(
      getCampusId(req),
      req.user._id,
      req.body
    );
    res.status(201).json({ success: true, message: "Attendance recorded", data });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, message: "Attendance already recorded for this teacher today" });
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const data = await svc.updateAttendance(
      req.params.id,
      getCampusId(req),
      req.body
    );
    res.json({ success: true, message: "Updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    await svc.deleteAttendance(req.params.id, getCampusId(req));
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};