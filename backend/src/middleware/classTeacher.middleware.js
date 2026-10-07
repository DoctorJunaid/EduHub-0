import mongoose from "mongoose";
import { Section } from "../models/academic.model.js";
import { TeacherProfile } from "../models/profile.model.js";
import User from "../models/user.model.js";

const ADMIN_ROLES = [
  "campus_admin",
  "campus_manager",
  "principal",
  "institute_admin",
  "super_admin",
];

/**
 * Middleware: Verify user is either Campus Admin OR the assigned Class Teacher for the classId.
 */
export async function canManageClass(req, res, next) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?._id;

    if (ADMIN_ROLES.includes(userRole)) {
      return next();
    }

    const classId = req.params.classId || req.body.classId || req.query.classId;
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class / Section ID is required to verify authorization.",
      });
    }

    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID format.",
      });
    }

    // Find teacher profile for user
    const teacherProfile = await TeacherProfile.findOne({ user: userId });
    if (!teacherProfile) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have a teacher profile.",
      });
    }

    // Check if section is assigned to this teacher
    const sectionDoc = await Section.findById(classId);
    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: "Class section not found.",
      });
    }

    const isAssigned =
      String(sectionDoc.classTeacherId) === String(teacherProfile._id) ||
      String(teacherProfile.classTeacherOf) === String(sectionDoc._id);

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not the assigned Class Teacher for this class.",
      });
    }

    req.teacherProfile = teacherProfile;
    req.classSection = sectionDoc;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Authorization check error: " + err.message,
    });
  }
}

/**
 * Middleware: Verify user has an assigned Class Teacher class and attach it to req.
 */
export async function requireClassTeacher(req, res, next) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?._id;

    if (ADMIN_ROLES.includes(userRole)) {
      return next();
    }

    const teacherProfile = await TeacherProfile.findOne({ user: userId });
    if (!teacherProfile || !teacherProfile.isClassTeacher || !teacherProfile.classTeacherOf) {
      // Also check Section if teacherProfile flag wasn't synced
      const sectionDoc = await Section.findOne({ classTeacherId: teacherProfile?._id });
      if (!sectionDoc) {
        return res.status(403).json({
          success: false,
          message:
            "Access restricted. You are not currently assigned as a Class Teacher for any class.",
        });
      }
      req.teacherProfile = teacherProfile;
      req.classSection = sectionDoc;
      return next();
    }

    const sectionDoc = await Section.findById(teacherProfile.classTeacherOf);
    req.teacherProfile = teacherProfile;
    req.classSection = sectionDoc;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Class Teacher verification error: " + err.message,
    });
  }
}
