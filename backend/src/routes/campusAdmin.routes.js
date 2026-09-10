import campusAdminService from "../services/campusAdmin.service.js";
// src/routes/campusAdminRoutes.js
import express from "express";
import {
  getCampusStudents,
  addStudentToCampus,
} from "../controllers/campusAdminStudent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes require authentication
// and Campus Admin role
router.use(protect);
router.use(authorize("campus_admin"));

router.route("/students").get(getCampusStudents).post(addStudentToCampus);

// Profile routes (related to campus)

// Helper for HTTP response error handling
const handleError = (res, error, status = 400) => {
  res.status(status).json({ success: false, message: error.message });
};

// --- Teacher Controllers ---
export const createTeacher = async (req, res) => {
  try {
    const profile = await campusAdminService.createTeacherProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const getTeachers = async (req, res) => {
  try {
    const profiles = await campusAdminService.getAllTeacherProfiles(req.query);
    res
      .status(200)
      .json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const profile = await campusAdminService.getTeacherProfileById(
      req.params.id,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const profile = await campusAdminService.updateTeacherProfile(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    await campusAdminService.deleteTeacherProfile(req.params.id);
    res.status(200).json({
      success: true,
      message: "Teacher profile deleted successfully.",
    });
  } catch (error) {
    handleError(res, error, 404);
  }
};

// --- Student Controllers ---
export const createStudent = async (req, res) => {
  try {
    const profile = await campusAdminService.createStudentProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const getStudents = async (req, res) => {
  try {
    const profiles = await campusAdminService.getAllStudentProfiles(req.query);
    res
      .status(200)
      .json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    handleError(res, error, 500);
  }
};

export const getStudentById = async (req, res) => {
  try {
    const profile = await campusAdminService.getStudentProfileById(
      req.params.id,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const profile = await campusAdminService.updateStudentProfile(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteStudent = async (req, res) => {
  try {
    await campusAdminService.deleteStudentProfile(req.params.id);
    res.status(200).json({
      success: true,
      message: "Student profile deleted successfully.",
    });
  } catch (error) {
    handleError(res, error, 404);
  }
};

export default router;
