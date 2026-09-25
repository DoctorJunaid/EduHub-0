import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { StudentProfile, TeacherProfile } from "../models/profile.model.js";
import { logActivity } from "../models/activityLog.model.js";
import feeService from "../services/fee.service.js";

// @desc    Get students belonging to campus admin/manager's campus
// @route   GET /api/v1/campus-admin/students
// @access  Private / Campus Admin & Campus Manager
export const getCampusStudents = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "campus_admin" &&
      req.user.role !== "campus_manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Campus Manager/Admin only.",
      });
    }

    const { campusId } = req.user;

    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "Campus Manager/Admin is not assigned to a campus",
      });
    }

    const students = await User.find({
      role: "student",
      campusId: campusId,
    })
      .select("-passwordHash")
      .populate("campusId", "name location code")
      .populate("instituteId", "name type board")
      .sort({ createdAt: -1 });

    const formatted = students.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      return {
        ...obj,
        campus: obj.campusId?.name || obj.campus || "",
        institute: obj.instituteId?.name || obj.institute || "",
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get Campus Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve campus students",
    });
  }
};

// @desc    Assign existing student to campus admin/manager's campus
// @route   POST /api/v1/campus-admin/students
// @access  Private / Campus Admin & Campus Manager
export const addStudentToCampus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      req.user.role !== "campus_admin" &&
      req.user.role !== "campus_manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Campus Manager/Admin only.",
      });
    }

    let { campusId, instituteId } = req.user;

    if (!campusId) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to a campus",
      });
    }

    if (!instituteId) {
      const campus = await Campus.findById(campusId);
      if (campus) instituteId = campus.instituteId;
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (
      student.instituteId &&
      instituteId &&
      student.instituteId.toString() !== instituteId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Student does not belong to your institute",
      });
    }

    if (
      student.campusId &&
      student.campusId.toString() === campusId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Student already belongs to this campus",
      });
    }

    if (instituteId) student.instituteId = instituteId;
    student.campusId = campusId;

    await student.save();

    const studentResponse = student.toObject();
    delete studentResponse.passwordHash;
    delete studentResponse.resetPasswordToken;
    delete studentResponse.resetPasswordExpires;
    delete studentResponse.emailVerificationToken;

    return res.status(200).json({
      success: true,
      message: "Student assigned to campus successfully",
      data: studentResponse,
    });
  } catch (error) {
    console.error("Add Student To Campus Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign student to campus",
    });
  }
};

// @desc    Create a new student for the campus
// @route   POST /api/v1/campus-admin/students/new
// @access  Private / Campus Admin & Campus Manager
export const createStudentForCampus = async (req, res) => {
  try {
    let { campusId, instituteId } = req.user;

    if (!campusId) {
      return res
        .status(400)
        .json({ success: false, message: "Admin lacking campus context" });
    }

    if (!instituteId && campusId) {
      const campus = await Campus.findById(campusId);
      if (campus) instituteId = campus.instituteId;
    }

    const {
      name,
      email,
      roll,
      program,
      gradeOrClass,
      admissionNo,
      section,
      semester,
      subjects,
      phone,
      studentPhone,
      guardian,
      guardianPhone,
      status,
      password,
    } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const student = await User.create({
      name: name.trim(),
      email: cleanEmail,
      role: "student",
      campusId,
      instituteId: instituteId || null,
      roll: roll
        ? roll.trim()
        : `ROLL-${Math.floor(1000 + Math.random() * 9000)}`,
      program: program ? program.trim() : (gradeOrClass ? gradeOrClass.trim() : "Unassigned"),
      gradeOrClass: gradeOrClass ? gradeOrClass.trim() : "",
      admissionNo: admissionNo ? admissionNo.trim() : "",
      section: section ? section.trim() : "",
      semester: semester ? semester.trim() : "",
      subjects: subjects ? subjects.trim() : "",
      phone: studentPhone ? studentPhone.trim() : phone ? phone.trim() : "",
      guardian: guardian ? guardian.trim() : "",
      guardianPhone: guardianPhone ? guardianPhone.trim() : "",
      status: status || "Active",
      passwordHash: password || "student123",
      baseFee: req.body.baseFee ? Number(req.body.baseFee) : 0,
    });

    await student.populate([
      { path: "campusId", select: "name location code" },
      { path: "instituteId", select: "name type board" },
    ]);

    const studentResponse = student.toObject();
    delete studentResponse.passwordHash;
    studentResponse.campus = student.campusId?.name || "";
    studentResponse.institute = student.instituteId?.name || "";

    // Sync StudentProfile so downstream services (attendance, fees, payroll) find the profile
    try {
      await StudentProfile.findOneAndUpdate(
        { user: student._id },
        {
          user: student._id,
          studentId: student.roll || String(student._id),
          gradeOrClass: student.gradeOrClass || student.program || "Grade 10",
          section: student.section || "A",
          rollNumber: student.roll || "1",
          guardianDetails: {
            name: student.guardian || "Guardian",
            phone: student.guardianPhone || student.phone || "N/A",
            relation: "Parent",
          },
          isActive: student.status !== "Inactive",
        },
        { upsert: true, new: true }
      );
    } catch (profileErr) {
      console.warn("Could not sync StudentProfile:", profileErr.message);
    }

    // Auto-generate admission fee voucher if configured
    try {
      await feeService.generateAdmissionFee(campusId, instituteId, student, req.body, req.user);
    } catch (feeErr) {
      console.warn("Could not generate admission fee voucher:", feeErr.message);
    }

    logActivity({
      campus: campusId,
      action: "student_created",
      category: "students",
      title: "Student Enrolled",
      description: `${student.name} enrolled in ${student.gradeOrClass || student.program || 'campus'}`,
      entityType: "student",
      entityId: student._id,
      performedBy: req.user?._id,
      metadata: { name: student.name, program: student.program, roll: student.roll, gradeOrClass: student.gradeOrClass },
    });

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: studentResponse,
    });
  } catch (error) {
    console.error("Create Student Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create student",
    });
  }
};

// @desc    Remove a student from the campus
// @route   DELETE /api/v1/campus-admin/students/:id
// @access  Private / Campus Admin & Campus Manager
export const removeStudentFromCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const studentId = req.params.id;

    const student = await User.findOne({
      _id: studentId,
      role: "student",
      campusId,
    });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found in this campus" });
    }

    await User.findByIdAndDelete(studentId);

    logActivity({
      campus: campusId,
      action: "student_removed",
      category: "students",
      title: "Student Removed",
      description: `${student.name || 'Student'} removed from campus`,
      entityType: "student",
      entityId: student._id,
      performedBy: req.user?._id,
      metadata: { name: student.name, roll: student.roll },
    });

    return res
      .status(200)
      .json({ success: true, message: "Student removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all faculty for the campus
// @route   GET /api/v1/campus-admin/faculty
// @access  Private / Campus Admin & Campus Manager
export const getCampusFaculty = async (req, res) => {
  try {
    const { campusId } = req.user;
    if (!campusId)
      return res
        .status(400)
        .json({ success: false, message: "No campus assigned" });

    const faculty = await User.find({
      role: { $in: ["faculty", "teacher", "class_teacher", "subject_teacher"] },
      campusId,
    })
      .select("-passwordHash")
      .populate("campusId", "name location code")
      .populate("instituteId", "name type board")
      .sort({ createdAt: -1 });

    const formatted = faculty.map((f) => {
      const obj = f.toObject ? f.toObject() : { ...f };
      return {
        ...obj,
        campus: obj.campusId?.name || obj.campus || "",
        institute: obj.instituteId?.name || obj.institute || "",
      };
    });

    return res
      .status(200)
      .json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new faculty/teacher for the campus
// @route   POST /api/v1/campus-admin/faculty/new
// @access  Private / Campus Admin & Campus Manager
export const createFacultyForCampus = async (req, res) => {
  try {
    let { campusId, instituteId } = req.user;

    if (!campusId) {
      return res
        .status(400)
        .json({ success: false, message: "Admin lacking campus context" });
    }

    if (!instituteId && campusId) {
      const campus = await Campus.findById(campusId);
      if (campus) instituteId = campus.instituteId;
    }

    const {
      name,
      email,
      department,
      designation,
      phone,
      qualification,
      subjects,
      status,
      password,
    } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const faculty = await User.create({
      name: name.trim(),
      email: cleanEmail,
      role: "faculty",
      campusId,
      instituteId: instituteId || null,
      department: department ? department.trim() : "General",
      designation: designation ? designation.trim() : "Lecturer",
      phone: phone ? phone.trim() : "",
      qualification: qualification ? qualification.trim() : "",
      subjects: subjects ? subjects.trim() : "",
      status: status || "Active",
      passwordHash: password || "teacher123",
    });

    await faculty.populate([
      { path: "campusId", select: "name location code" },
      { path: "instituteId", select: "name type board" },
    ]);

    const facultyResponse = faculty.toObject();
    delete facultyResponse.passwordHash;
    facultyResponse.campus = faculty.campusId?.name || "";
    facultyResponse.institute = faculty.instituteId?.name || "";

    // Sync TeacherProfile for timetable, payroll, and substitute modules
    try {
      const empId = `EMP-${faculty._id.toString().slice(-4).toUpperCase()}`;
      await TeacherProfile.findOneAndUpdate(
        { user: faculty._id },
        {
          user: faculty._id,
          employeeId: empId,
          department: faculty.department || "General",
          subjectsTaught: faculty.subjects
            ? faculty.subjects.split(",").map((s) => s.trim())
            : [],
          qualification: faculty.qualification || "Bachelor",
          designation: faculty.designation || "Teacher",
          isActive: faculty.status !== "Inactive",
        },
        { upsert: true, new: true }
      );
    } catch (profileErr) {
      console.warn("Could not sync TeacherProfile:", profileErr.message);
    }

    logActivity({
      campus: campusId,
      action: "faculty_created",
      category: "staff",
      title: "Teacher Appointed",
      description: `${faculty.name} appointed as ${faculty.designation || 'Faculty'} in ${faculty.department || 'department'}`,
      entityType: "faculty",
      entityId: faculty._id,
      performedBy: req.user?._id,
      metadata: { name: faculty.name, designation: faculty.designation, department: faculty.department },
    });

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: facultyResponse,
    });
  } catch (error) {
    console.error("Create Faculty Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create faculty",
    });
  }
};

// @desc    Remove a faculty from the campus
// @route   DELETE /api/v1/campus-admin/faculty/:id
// @access  Private / Campus Admin & Campus Manager
export const removeFacultyFromCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const facultyId = req.params.id;

    const faculty = await User.findOne({
      _id: facultyId,
      role: { $in: ["faculty", "teacher"] },
      campusId,
    });

    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found in this campus" });
    }

    await User.findByIdAndDelete(facultyId);

    logActivity({
      campus: campusId,
      action: "faculty_removed",
      category: "staff",
      title: "Faculty Removed",
      description: `${faculty.name || 'Faculty'} removed from campus`,
      entityType: "faculty",
      entityId: faculty._id,
      performedBy: req.user?._id,
      metadata: { name: faculty.name, department: faculty.department },
    });

    return res
      .status(200)
      .json({ success: true, message: "Faculty removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a student in the campus
// @route   PUT /api/v1/campus-admin/students/:id
// @access  Private / Campus Admin & Campus Manager
export const updateStudentInCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const studentId = req.params.id;

    // Strict whitelist to prevent privilege escalation / mass assignment
    const allowedFields = [
      "name",
      "phone",
      "studentPhone",
      "roll",
      "program",
      "gradeOrClass",
      "admissionNo",
      "section",
      "semester",
      "subjects",
      "guardian",
      "guardianPhone",
      "status",
      "isActive",
      "baseFee",
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
      }
    }

    if (updateData.studentPhone && !updateData.phone) {
      updateData.phone = updateData.studentPhone;
    }

    // Automatically synchronize isActive when student status changes
    if (updateData.status) {
      if (["Inactive", "Withdrawn", "Graduated", "Suspended"].includes(updateData.status)) {
        updateData.isActive = false;
      } else if (updateData.status === "Active") {
        updateData.isActive = true;
      }
    }

    const student = await User.findOneAndUpdate(
      { _id: studentId, role: "student", campusId },
      updateData,
      { new: true, runValidators: true },
    )
      .select("-passwordHash")
      .populate("campusId", "name location code")
      .populate("instituteId", "name type board");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found in this campus" });
    }

    logActivity({
      campus: campusId,
      action: "student_updated",
      category: "students",
      title: "Student Profile Updated",
      description: `${student.name || 'Student'} profile information updated`,
      entityType: "student",
      entityId: student._id,
      performedBy: req.user?._id,
      metadata: { name: student.name, updatedFields: Object.keys(updateData) },
    });

    const studentResponse = student.toObject();
    studentResponse.campus = student.campusId?.name || "";
    studentResponse.institute = student.instituteId?.name || "";

    return res.status(200).json({ success: true, data: studentResponse });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a faculty in the campus
// @route   PUT /api/v1/campus-admin/faculty/:id
// @access  Private / Campus Admin & Campus Manager
export const updateFacultyInCampus = async (req, res) => {
  try {
    const { campusId } = req.user;
    const facultyId = req.params.id;

    // Strict whitelist to prevent privilege escalation
    const allowedFields = [
      "name",
      "phone",
      "department",
      "designation",
      "qualification",
      "subjects",
      "status",
      "isActive",
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
      }
    }

    const faculty = await User.findOneAndUpdate(
      { _id: facultyId, role: { $in: ["faculty", "teacher"] }, campusId },
      updateData,
      { new: true, runValidators: true },
    )
      .select("-passwordHash")
      .populate("campusId", "name location code")
      .populate("instituteId", "name type board");

    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found in this campus" });
    }

    logActivity({
      campus: campusId,
      action: "faculty_updated",
      category: "staff",
      title: "Faculty Profile Updated",
      description: `${faculty.name || 'Faculty'} profile information updated`,
      entityType: "faculty",
      entityId: faculty._id,
      performedBy: req.user?._id,
      metadata: { name: faculty.name, updatedFields: Object.keys(updateData) },
    });

    const facultyResponse = faculty.toObject();
    facultyResponse.campus = faculty.campusId?.name || "";
    facultyResponse.institute = faculty.instituteId?.name || "";

    return res.status(200).json({ success: true, data: facultyResponse });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
