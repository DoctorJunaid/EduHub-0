import User from "../models/user.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";
import { StudentProfile, TeacherProfile } from "../models/profile.model.js";
import { Grade, Section, Subject, GradeSubject } from "../models/academic.model.js";
import { Route } from "../models/transport.model.js";
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

    const campusId = req.user?.campusId?._id || req.user?.campusId || req.query?.campusId;

    if (!campusId && req.user?.role !== "super_admin") {
      return res.status(400).json({
        success: false,
        message: "Campus context required. No campus assigned or specified.",
      });
    }

    const query = { role: "student" };
    if (campusId) {
      query.campusId = campusId;
    } else if (req.user?.instituteId) {
      query.instituteId = req.user.instituteId;
    }

    if (req.query?.usesTransport !== undefined) {
      query.usesTransport = req.query.usesTransport === "true" || req.query.usesTransport === true;
    }

    const students = await User.find(query)
      .select("-passwordHash")
      .populate("campusId", "name location code")
      .populate("instituteId", "name type board")
      .populate("gradeId", "name code")
      .populate("sectionId", "name code")
      .populate({
        path: "transportDetails.routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = students.map((s) => ({
      ...s,
      campus: s.campusId?.name || s.campus || "",
      institute: s.instituteId?.name || s.institute || "",
      gradeOrClass: s.gradeId?.name || s.gradeOrClass || "",
      section: s.sectionId?.name || s.section || "",
      usesTransport: Boolean(s.usesTransport),
      transportDetails: s.transportDetails || null,
    }));

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

    let {
      name,
      email,
      roll,
      program,
      gradeOrClass,
      gradeId,
      sectionId,
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

    // Resolve Grade and Section dynamically for full academic centralization
    let resolvedGradeDoc = null;
    if (gradeId) {
      resolvedGradeDoc = await Grade.findOne({ _id: gradeId, campusId });
    }
    if (!resolvedGradeDoc && (gradeOrClass || program)) {
      const gName = (gradeOrClass || program).trim();
      resolvedGradeDoc = await Grade.findOne({
        campusId,
        name: { $regex: new RegExp(`^${gName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });
    }
    if (resolvedGradeDoc) {
      gradeId = resolvedGradeDoc._id;
      gradeOrClass = resolvedGradeDoc.name;
    }

    let resolvedSectionDoc = null;
    if (sectionId) {
      resolvedSectionDoc = await Section.findOne({ _id: sectionId, campusId });
    }
    if (!resolvedSectionDoc && resolvedGradeDoc && section) {
      const sName = section.trim();
      resolvedSectionDoc = await Section.findOne({
        campusId,
        gradeId: resolvedGradeDoc._id,
        name: { $regex: new RegExp(`^${sName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });
    }
    // Auto-create default section if grade exists but no section found
    if (!resolvedSectionDoc && resolvedGradeDoc) {
      const sName = (section && section.trim()) || "A";
      resolvedSectionDoc = await Section.findOne({ campusId, gradeId: resolvedGradeDoc._id, name: sName });
      if (!resolvedSectionDoc) {
        resolvedSectionDoc = await Section.create({
          name: sName,
          gradeId: resolvedGradeDoc._id,
          campusId,
          instituteId: instituteId || null,
        });
      }
    }
    if (resolvedSectionDoc) {
      sectionId = resolvedSectionDoc._id;
      section = resolvedSectionDoc.name;
    }

    // Auto-enroll student into grade's configured subjects if none provided
    if (!subjects && resolvedGradeDoc) {
      const gradeSubjects = await GradeSubject.find({ campusId, gradeId: resolvedGradeDoc._id })
        .populate("subjectId", "name")
        .lean();
      const subjectNames = gradeSubjects.map((gs) => gs.subjectId?.name).filter(Boolean);
      if (subjectNames.length > 0) {
        subjects = subjectNames.join(", ");
      }
    }

    const isUsingTransport =
      req.body.usesTransport === true ||
      req.body.usesTransport === "true" ||
      Boolean(req.body.routeId && req.body.routeId !== "none");

    const transportRouteId =
      isUsingTransport && req.body.routeId && req.body.routeId !== "none"
        ? req.body.routeId
        : null;

    const transportStopName =
      isUsingTransport && req.body.stopName
        ? String(req.body.stopName).trim()
        : "";

    const transportDetails = isUsingTransport
      ? {
          routeId: transportRouteId,
          stopName: transportStopName,
          assignedAt: new Date(),
          assignedBy: req.user?._id || null,
        }
      : null;

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
      gradeId: gradeId || null,
      sectionId: sectionId || null,
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
      usesTransport: isUsingTransport,
      transportDetails: transportDetails,
    });

    await student.populate([
      { path: "campusId", select: "name location code" },
      { path: "instituteId", select: "name type board" },
      { path: "gradeId", select: "name code" },
      { path: "sectionId", select: "name code" },
      {
        path: "transportDetails.routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      },
    ]);

    const studentResponse = student.toObject();
    delete studentResponse.passwordHash;
    studentResponse.campus = student.campusId?.name || "";
    studentResponse.institute = student.instituteId?.name || "";
    studentResponse.gradeOrClass = student.gradeId?.name || student.gradeOrClass || "";
    studentResponse.section = student.sectionId?.name || student.section || "";
    studentResponse.usesTransport = isUsingTransport;
    studentResponse.transportDetails = transportDetails;

    // Sync StudentProfile so downstream services (attendance, fees, payroll, exams) find the profile
    try {
      await StudentProfile.findOneAndUpdate(
        { user: student._id },
        {
          user: student._id,
          userId: student._id,
          campusId: student.campusId?._id || student.campusId || campusId,
          studentId: student.roll || String(student._id),
          gradeId: student.gradeId || null,
          sectionId: student.sectionId || null,
          gradeOrClass: student.gradeOrClass || student.program || "Class 9",
          section: student.section || "A",
          rollNumber: student.roll || "1",
          guardianDetails: {
            name: student.guardian || "Guardian",
            phone: student.guardianPhone || student.phone || "",
            relation: "Parent",
          },
          usesTransport: isUsingTransport,
          transportDetails: transportDetails,
          routeId: transportRouteId,
          stopName: transportStopName,
          transportEnrolled: isUsingTransport && Boolean(transportRouteId),
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
    const campusId = req.user?.campusId?._id || req.user?.campusId || req.query?.campusId;
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
      .sort({ createdAt: -1 })
      .lean();

    const formatted = faculty.map((f) => ({
      ...f,
      campus: f.campusId?.name || f.campus || "",
      institute: f.instituteId?.name || f.institute || "",
    }));

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
          userId: faculty._id,
          campusId: faculty.campusId?._id || faculty.campusId || campusId,
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
      "gradeId",
      "sectionId",
      "admissionNo",
      "section",
      "semester",
      "subjects",
      "guardian",
      "guardianPhone",
      "status",
      "isActive",
      "baseFee",
      "usesTransport",
      "routeId",
      "stopName",
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

    let transportDetailsPayload = undefined;
    if (req.body.usesTransport !== undefined) {
      const isUsing = req.body.usesTransport === true || req.body.usesTransport === "true";
      updateData.usesTransport = isUsing;
      if (isUsing) {
        const routeId = req.body.routeId && req.body.routeId !== "none" ? req.body.routeId : null;
        const stopName = req.body.stopName ? String(req.body.stopName).trim() : "";
        transportDetailsPayload = {
          routeId,
          stopName,
          assignedAt: new Date(),
          assignedBy: req.user?._id || null,
        };
        updateData.transportDetails = transportDetailsPayload;
      } else {
        transportDetailsPayload = null;
        updateData.transportDetails = null;
      }
    }

    // Resolve Grade and Section dynamically if modified
    if (updateData.gradeId) {
      const gDoc = await Grade.findOne({ _id: updateData.gradeId, campusId });
      if (gDoc) updateData.gradeOrClass = gDoc.name;
    } else if (updateData.gradeOrClass) {
      const gDoc = await Grade.findOne({
        campusId,
        name: { $regex: new RegExp(`^${updateData.gradeOrClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });
      if (gDoc) updateData.gradeId = gDoc._id;
    }

    if (updateData.sectionId) {
      const sDoc = await Section.findOne({ _id: updateData.sectionId, campusId });
      if (sDoc) updateData.section = sDoc.name;
    } else if (updateData.section && updateData.gradeId) {
      const sDoc = await Section.findOne({
        campusId,
        gradeId: updateData.gradeId,
        name: { $regex: new RegExp(`^${updateData.section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });
      if (sDoc) updateData.sectionId = sDoc._id;
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
      .populate("instituteId", "name type board")
      .populate("gradeId", "name code")
      .populate("sectionId", "name code")
      .populate({
        path: "transportDetails.routeId",
        populate: {
          path: "vehicleId",
          populate: { path: "driverId" },
        },
      });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found in this campus" });
    }

    // Sync StudentProfile so downstream services stay updated
    try {
      const profileUpdates = {
        user: student._id,
        campusId: student.campusId,
        studentId: student.roll || String(student._id),
        gradeId: student.gradeId || null,
        sectionId: student.sectionId || null,
        gradeOrClass: student.gradeOrClass || student.program || "Class 9",
        section: student.section || "A",
        rollNumber: student.roll || "1",
        guardianDetails: {
          name: student.guardian || "Guardian",
          phone: student.guardianPhone || student.phone || "",
          relation: "Parent",
        },
        isActive: student.status !== "Inactive",
      };

      if (req.body.usesTransport !== undefined) {
        const isUsing = req.body.usesTransport === true || req.body.usesTransport === "true";
        profileUpdates.usesTransport = isUsing;
        profileUpdates.transportDetails = transportDetailsPayload;
        profileUpdates.routeId = isUsing ? transportDetailsPayload?.routeId : null;
        profileUpdates.stopName = isUsing ? transportDetailsPayload?.stopName : "";
        profileUpdates.transportEnrolled = isUsing && Boolean(transportDetailsPayload?.routeId);
      }

      await StudentProfile.findOneAndUpdate(
        { user: student._id },
        profileUpdates,
        { upsert: true, new: true }
      );
    } catch (profileErr) {
      console.warn("Could not sync StudentProfile:", profileErr.message);
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
    studentResponse.gradeOrClass = student.gradeId?.name || student.gradeOrClass || "";
    studentResponse.section = student.sectionId?.name || student.section || "";
    studentResponse.usesTransport = Boolean(student.usesTransport);
    studentResponse.transportDetails = student.transportDetails || null;

    return res.status(200).json({ success: true, data: studentResponse });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign or remove transport for a student
// @route   PUT /api/v1/campus-admin/students/:id/transport or PUT /api/v1/campus/students/:id/transport
// @access  Private / Campus Admin & Manager
export const updateStudentTransport = async (req, res) => {
  try {
    const campusId = req.user?.campusId?._id || req.user?.campusId;
    const studentId = req.params.id;
    const { usesTransport, routeId, stopName } = req.body;

    if (!campusId && req.user?.role !== "super_admin") {
      return res.status(400).json({ success: false, message: "Campus context required" });
    }

    const query = { _id: studentId, role: "student" };
    if (campusId) query.campusId = campusId;

    const student = await User.findOne(query);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found in this campus" });
    }

    const isUsing = usesTransport === true || usesTransport === "true";
    let transportDetails = null;
    let finalRouteId = null;
    let finalStopName = "";

    if (isUsing) {
      finalRouteId = routeId && routeId !== "none" ? routeId : null;
      finalStopName = (stopName || "").trim();

      if (finalRouteId) {
        const routeDoc = await Route.findOne({ _id: finalRouteId, campusId });
        if (routeDoc && !finalStopName && routeDoc.stops?.length > 0) {
          finalStopName = routeDoc.stops[0].stopName;
        }
      }

      transportDetails = {
        routeId: finalRouteId,
        stopName: finalStopName,
        assignedAt: new Date(),
        assignedBy: req.user?._id || null,
      };

      student.usesTransport = true;
      student.transportDetails = transportDetails;
    } else {
      student.usesTransport = false;
      student.transportDetails = null;
    }

    await student.save();

    // Synchronize StudentProfile
    const profile = await StudentProfile.findOneAndUpdate(
      { user: student._id },
      {
        user: student._id,
        campusId: student.campusId,
        studentId: student.roll || String(student._id),
        usesTransport: isUsing,
        transportDetails: isUsing ? transportDetails : null,
        routeId: isUsing ? finalRouteId : null,
        stopName: isUsing ? finalStopName : "",
        transportEnrolled: isUsing && Boolean(finalRouteId),
      },
      { upsert: true, new: true }
    ).populate({
      path: "transportDetails.routeId",
      populate: {
        path: "vehicleId",
        populate: { path: "driverId" },
      },
    });

    logActivity({
      campus: campusId,
      action: isUsing ? "student_transport_assigned" : "student_transport_removed",
      category: "transport",
      title: isUsing ? "Student Transport Assigned" : "Student Transport Removed",
      description: isUsing
        ? `${student.name} assigned to transport (Stop: ${finalStopName || "Default"})`
        : `Transport removed for ${student.name}`,
      entityType: "student",
      entityId: student._id,
      performedBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: isUsing
        ? "Transport assigned successfully."
        : "Transport removed successfully.",
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        usesTransport: isUsing,
        transportDetails: isUsing ? transportDetails : null,
        profile,
      },
    });
  } catch (error) {
    console.error("Update Student Transport Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update student transport",
    });
  }
};

// @desc    Dispatch POST /students: If body has name/email -> admission; else -> student assignment
export const handleStudentPost = async (req, res, next) => {
  if (req.body?.name && req.body?.email) {
    return createStudentForCampus(req, res);
  }
  return addStudentToCampus(req, res);
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
