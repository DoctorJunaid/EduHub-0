import mongoose from "mongoose";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { StudentProfile } from "../models/profile.model.js";

/**
 * Helper to resolve student and linked user document from id parameter.
 * Handles Student._id, Student.userId, User._id, or roll/rollNo.
 */
const resolveStudentDocuments = async (identifier) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
  let studentDoc = null;
  let userDoc = null;

  if (isValidObjectId) {
    // 1. Try finding in Student collection by _id
    studentDoc = await Student.findById(identifier);
    if (!studentDoc) {
      // 2. Try finding in Student collection by userId
      studentDoc = await Student.findOne({ userId: identifier });
    }

    // 3. Find linked User document
    if (studentDoc?.userId) {
      userDoc = await User.findById(studentDoc.userId);
    } else {
      userDoc = await User.findOne({ _id: identifier, role: "student" });
    }
  }

  // Fallback: search by roll / rollNo
  if (!studentDoc && !userDoc) {
    studentDoc = await Student.findOne({ rollNo: identifier });
    if (!studentDoc) {
      userDoc = await User.findOne({ roll: identifier, role: "student" });
    }
  }

  // If studentDoc still null but userDoc exists, create/upsert StudentDoc to ensure MongoDB persistence
  if (!studentDoc && userDoc) {
    const campusDoc = userDoc.campusId ? await Campus.findById(userDoc.campusId).lean() : null;
    const instituteDoc = userDoc.instituteId ? await Institute.findById(userDoc.instituteId).lean() : null;

    const classProgramValue =
      userDoc.classProgram ||
      (userDoc.gradeOrClass
        ? `${userDoc.gradeOrClass}${userDoc.section ? ` • Section ${userDoc.section}` : ""}`
        : userDoc.program || "Class 9 • Section A");

    const rollNoValue =
      userDoc.rollNo ||
      userDoc.roll ||
      `ROLL-${String(userDoc._id).slice(-5).toUpperCase()}`;

    // Upsert Student document
    studentDoc = await Student.findOneAndUpdate(
      { userId: userDoc._id },
      {
        $setOnInsert: {
          userId: userDoc._id,
          campusId: userDoc.campusId,
          instituteName: userDoc.instituteName || instituteDoc?.name || campusDoc?.name || "EduHub Global Institute",
          instituteLogo: userDoc.instituteLogo || instituteDoc?.logo || "",
          name: userDoc.name || "Student",
          classProgram: classProgramValue,
          rollNo: rollNoValue,
          fatherName: userDoc.fatherName || userDoc.guardian || "",
          guardianPhone: userDoc.guardianPhone || userDoc.phone || "",
          address: userDoc.address || "",
          avatar: userDoc.avatar || "",
          qrCodeData: userDoc.qrCodeData || `EDUHUB-STUDENT-${rollNoValue}`,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return { studentDoc, userDoc };
};

/**
 * @desc    Get Student ID Card Data
 * @route   GET /api/students/:id/id-card
 * @access  Private - Authenticated Students (own record) & Campus Managers/Admins (their campus)
 */
export const getStudentIdCard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { id } = req.params;
    const { studentDoc, userDoc } = await resolveStudentDocuments(id);

    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Role-Based Access Control Checks
    if (req.user.role === "student") {
      // Students can ONLY view their own record
      const reqUserId = req.user._id.toString();
      const studentUserId = (studentDoc.userId?._id || studentDoc.userId || userDoc?._id)?.toString();

      if (reqUserId !== studentUserId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Students can only view their own Student ID Card.",
        });
      }
    } else if (
      ["campus_manager", "campus_admin", "admin", "principal", "accountant"].includes(req.user.role)
    ) {
      // Campus Managers / Campus Admins can only view students belonging to their campus
      if (req.user.role !== "super_admin") {
        const managerCampusId = (req.user.campusId?._id || req.user.campusId)?.toString();
        const studentCampusId = (studentDoc.campusId?._id || studentDoc.campusId || userDoc?.campusId)?.toString();

        if (managerCampusId && studentCampusId && managerCampusId !== studentCampusId) {
          return res.status(403).json({
            success: false,
            message: "Access denied. You can only view Student ID Cards belonging to your assigned campus.",
          });
        }
      }
    } else if (req.user.role === "super_admin" || req.user.role === "institute_admin") {
      // Super admin / institute admin allowed
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to access Student ID Card.",
      });
    }

    // Populate campus and institute details
    const campusDoc = studentDoc.campusId
      ? await Campus.findById(studentDoc.campusId).select("name location code address phone email logo").lean()
      : null;

    const instituteDoc = userDoc?.instituteId
      ? await Institute.findById(userDoc.instituteId).select("name logo type board").lean()
      : null;

    const payload = {
      _id: studentDoc._id,
      id: studentDoc._id,
      userId: studentDoc.userId,
      campusId: studentDoc.campusId,
      campusName: campusDoc?.name || "",
      campusAddress: campusDoc?.address || campusDoc?.location || "",
      instituteName: studentDoc.instituteName || instituteDoc?.name || campusDoc?.name || "EduHub Global Institute",
      instituteLogo: studentDoc.instituteLogo || instituteDoc?.logo || "",
      name: studentDoc.name,
      classProgram: studentDoc.classProgram,
      rollNo: studentDoc.rollNo,
      fatherName: studentDoc.fatherName || "",
      guardianPhone: studentDoc.guardianPhone || "",
      address: studentDoc.address || "",
      avatar: studentDoc.avatar || "",
      qrCodeData: studentDoc.qrCodeData || `EDUHUB-STUDENT-${studentDoc.rollNo || studentDoc._id}`,
      createdAt: studentDoc.createdAt,
      updatedAt: studentDoc.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error("Get Student ID Card Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve Student ID Card data.",
    });
  }
};

/**
 * @desc    Update Student ID Card Data
 * @route   PUT /api/students/:id/id-card
 * @access  Private - Restricted strictly to campus_manager or admin roles
 */
export const updateStudentIdCard = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Explicit check: Students cannot update ID card under any circumstances
    if (req.user.role === "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Students are not authorized to update ID Card data.",
      });
    }

    // Allow campus_manager, campus_admin, admin, super_admin
    const allowedRoles = ["campus_manager", "campus_admin", "admin", "super_admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Restricted strictly to Campus Managers and Admins.",
      });
    }

    const { id } = req.params;
    const { studentDoc, userDoc } = await resolveStudentDocuments(id);

    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Validate campus authorization (ensure campus manager only edits students belonging to their campus)
    if (req.user.role !== "super_admin") {
      const managerCampusId = (req.user.campusId?._id || req.user.campusId)?.toString();
      const studentCampusId = (studentDoc.campusId?._id || studentDoc.campusId || userDoc?.campusId)?.toString();

      if (managerCampusId && studentCampusId && managerCampusId !== studentCampusId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only update students belonging to your assigned campus.",
        });
      }
    }

    const {
      instituteName,
      instituteLogo,
      name,
      classProgram,
      rollNo,
      fatherName,
      guardianPhone,
      address,
      avatar,
      qrCodeData,
    } = req.body;

    // Check rollNo uniqueness if being modified
    if (rollNo && rollNo.trim() !== studentDoc.rollNo) {
      const existingRollStudent = await Student.findOne({
        rollNo: rollNo.trim(),
        _id: { $ne: studentDoc._id },
      });
      if (existingRollStudent) {
        return res.status(400).json({
          success: false,
          message: `Roll number '${rollNo.trim()}' is already assigned to another student.`,
        });
      }
    }

    // Update Student document fields
    if (instituteName !== undefined) studentDoc.instituteName = String(instituteName).trim();
    if (instituteLogo !== undefined) studentDoc.instituteLogo = String(instituteLogo).trim();
    if (name !== undefined) studentDoc.name = String(name).trim();
    if (classProgram !== undefined) studentDoc.classProgram = String(classProgram).trim();
    if (rollNo !== undefined) studentDoc.rollNo = String(rollNo).trim();
    if (fatherName !== undefined) studentDoc.fatherName = String(fatherName).trim();
    if (guardianPhone !== undefined) studentDoc.guardianPhone = String(guardianPhone).trim();
    if (address !== undefined) studentDoc.address = String(address).trim();
    if (avatar !== undefined) studentDoc.avatar = String(avatar).trim();
    if (qrCodeData !== undefined) {
      studentDoc.qrCodeData = String(qrCodeData).trim();
    } else if (!studentDoc.qrCodeData) {
      studentDoc.qrCodeData = `EDUHUB-STUDENT-${studentDoc.rollNo || studentDoc._id}`;
    }

    await studentDoc.save();

    // Synchronize linked User document if found
    if (userDoc) {
      if (name !== undefined) userDoc.name = String(name).trim();
      if (fatherName !== undefined) {
        userDoc.fatherName = String(fatherName).trim();
        userDoc.guardian = String(fatherName).trim();
      }
      if (guardianPhone !== undefined) {
        userDoc.guardianPhone = String(guardianPhone).trim();
        if (!userDoc.phone) userDoc.phone = String(guardianPhone).trim();
      }
      if (address !== undefined) userDoc.address = String(address).trim();
      if (avatar !== undefined) userDoc.avatar = String(avatar).trim();
      if (rollNo !== undefined) {
        userDoc.rollNo = String(rollNo).trim();
        userDoc.roll = String(rollNo).trim();
      }
      if (classProgram !== undefined) {
        userDoc.classProgram = String(classProgram).trim();
      }
      if (instituteName !== undefined) userDoc.instituteName = String(instituteName).trim();
      if (instituteLogo !== undefined) userDoc.instituteLogo = String(instituteLogo).trim();
      if (qrCodeData !== undefined) userDoc.qrCodeData = String(qrCodeData).trim();

      await userDoc.save();

      // Synchronize StudentProfile if present
      try {
        await StudentProfile.findOneAndUpdate(
          { user: userDoc._id },
          {
            $set: {
              rollNumber: studentDoc.rollNo,
              "guardianDetails.name": studentDoc.fatherName || "Guardian",
              "guardianDetails.phone": studentDoc.guardianPhone || "",
            },
          }
        );
      } catch (profileSyncErr) {
        console.warn("Notice: StudentProfile sync skipped:", profileSyncErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Student ID Card updated successfully.",
      data: studentDoc,
    });
  } catch (error) {
    console.error("Update Student ID Card Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update Student ID Card data.",
    });
  }
};

export default {
  getStudentIdCard,
  updateStudentIdCard,
};
