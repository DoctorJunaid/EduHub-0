import mongoose from "mongoose";
import { Grade, Section } from "../models/academic.model.js";
import {
  TeacherProfile,
  StudentProfile,
  StudentAttendance,
} from "../models/profile.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.service.js";

/**
 * 1. Assign Class Teacher to a Class / Section (Campus Admin Only)
 */
export async function assignClassTeacher(
  campusId,
  classId,
  teacherProfileId,
  assignedByUserId,
  note = ""
) {
  if (!mongoose.isValidObjectId(classId)) {
    throw new Error("Invalid Class/Section ID.");
  }
  if (!mongoose.isValidObjectId(teacherProfileId)) {
    throw new Error("Invalid Teacher Profile ID.");
  }

  // 1. Verify section belongs to campus
  const section = await Section.findOne({ _id: classId, campusId }).populate(
    "gradeId",
    "name"
  );
  if (!section) {
    throw new Error("Class section not found in this campus.");
  }

  // 2. Verify teacher profile belongs to campus
  const teacher = await TeacherProfile.findById(teacherProfileId).populate(
    "user",
    "_id name email campusId role"
  );
  if (!teacher) {
    throw new Error("Teacher profile not found.");
  }
  const teacherCampus = teacher.user?.campusId;
  if (teacherCampus && String(teacherCampus) !== String(campusId)) {
    throw new Error(
      "Teacher does not belong to this campus (cross-campus assignment rejected)."
    );
  }

  // 3. Enforce CT-02: If teacher is already class teacher of another section, unassign or block
  if (
    teacher.isClassTeacher &&
    teacher.classTeacherOf &&
    String(teacher.classTeacherOf) !== String(classId)
  ) {
    // Unassign old section
    await Section.findByIdAndUpdate(teacher.classTeacherOf, {
      $set: {
        classTeacherId: null,
        classTeacherAssignedAt: null,
        classTeacherAssignedBy: null,
        classTeacherNote: "",
      },
    });
  }

  // 4. If current section already has another teacher, unassign that teacher profile
  if (
    section.classTeacherId &&
    String(section.classTeacherId) !== String(teacherProfileId)
  ) {
    await TeacherProfile.findByIdAndUpdate(section.classTeacherId, {
      $set: {
        isClassTeacher: false,
        classTeacherOf: null,
      },
    });
  }

  const now = new Date();

  // 5. Update Section
  section.classTeacherId = teacherProfileId;
  section.classTeacherAssignedAt = now;
  section.classTeacherAssignedBy = assignedByUserId;
  section.classTeacherNote = note || "";
  await section.save();

  // 6. Update TeacherProfile
  teacher.isClassTeacher = true;
  teacher.classTeacherOf = section._id;
  await teacher.save();

  const className = `${section.gradeId?.name || "Class"} - ${section.name}`;
  const adminUser = assignedByUserId
    ? await User.findById(assignedByUserId).select("name").lean()
    : null;
  const adminName = adminUser?.name || "Campus Admin";

  // 7. Send In-App Notification to Ms./Mr. Teacher
  if (teacher.user?._id) {
    await createNotification({
      userId: teacher.user._id,
      title: "Assigned as Class Teacher",
      message: `You have been appointed as the Class Teacher for ${className} by ${adminName}.`,
      type: "info",
      severity: "info",
      link: "/teacher/my-class",
      metadata: {
        classId: section._id.toString(),
        className,
        assignedBy: adminName,
      },
      sendEmail: false,
    });
  }

  return {
    classId: section._id,
    className,
    gradeId: section.gradeId?._id,
    gradeName: section.gradeId?.name,
    sectionName: section.name,
    teacherProfileId: teacher._id,
    teacherUserId: teacher.user?._id,
    teacherName: teacher.user?.name || "Teacher",
    teacherEmail: teacher.user?.email || "",
    department: teacher.department || "",
    designation: teacher.designation || "Teacher",
    assignedAt: now,
    assignedBy: adminName,
    note,
  };
}

/**
 * 2. Remove Class Teacher from Class / Section
 */
export async function removeClassTeacher(campusId, classId, removedByUserId) {
  if (!mongoose.isValidObjectId(classId)) {
    throw new Error("Invalid Class/Section ID.");
  }

  const section = await Section.findOne({ _id: classId, campusId }).populate(
    "gradeId",
    "name"
  );
  if (!section) {
    throw new Error("Class section not found.");
  }

  const prevTeacherProfileId = section.classTeacherId;
  let prevTeacherUser = null;

  if (prevTeacherProfileId) {
    const teacher = await TeacherProfile.findById(prevTeacherProfileId).populate(
      "user",
      "_id name email"
    );
    if (teacher) {
      teacher.isClassTeacher = false;
      teacher.classTeacherOf = null;
      await teacher.save();
      prevTeacherUser = teacher.user;
    }
  }

  section.classTeacherId = null;
  section.classTeacherAssignedAt = null;
  section.classTeacherAssignedBy = null;
  section.classTeacherNote = "";
  await section.save();

  const className = `${section.gradeId?.name || "Class"} - ${section.name}`;

  // Notify unassigned teacher
  if (prevTeacherUser?._id) {
    await createNotification({
      userId: prevTeacherUser._id,
      title: "Class Teacher Role Relieved",
      message: `You have been relieved of Class Teacher responsibilities for ${className}.`,
      type: "info",
      severity: "info",
      link: "/teacher",
      sendEmail: false,
    });
  }

  return {
    success: true,
    message: `Class teacher removed from ${className} successfully.`,
    classId: section._id,
    className,
  };
}

/**
 * 3. Get Class Teacher for a given Class
 */
export async function getClassTeacher(campusId, classId) {
  if (!mongoose.isValidObjectId(classId)) {
    throw new Error("Invalid Class/Section ID.");
  }

  const section = await Section.findOne({ _id: classId, campusId })
    .populate("gradeId", "name")
    .populate({
      path: "classTeacherId",
      populate: {
        path: "user",
        select: "name email phone avatar role isActive employeeId",
      },
    })
    .populate("classTeacherAssignedBy", "name email")
    .lean();

  if (!section) {
    throw new Error("Class section not found.");
  }

  const className = `${section.gradeId?.name || "Class"} - ${section.name}`;
  const teacher = section.classTeacherId;

  return {
    classId: section._id,
    className,
    gradeId: section.gradeId?._id,
    gradeName: section.gradeId?.name,
    sectionName: section.name,
    hasClassTeacher: !!teacher,
    teacher: teacher
      ? {
          profileId: teacher._id,
          userId: teacher.user?._id,
          name: teacher.user?.name || "Teacher",
          email: teacher.user?.email || "",
          phone: teacher.user?.phone || "",
          avatar: teacher.user?.avatar || "",
          department: teacher.department || "",
          designation: teacher.designation || "Teacher",
          qualification: teacher.qualification || "",
          assignedAt: section.classTeacherAssignedAt,
          assignedBy: section.classTeacherAssignedBy?.name || "Campus Admin",
          note: section.classTeacherNote || "",
        }
      : null,
  };
}

/**
 * 4. Get all classes with their Class Teacher assignments & status in a Campus
 */
export async function getAllClassTeachers(campusId) {
  const sections = await Section.find({ campusId })
    .populate("gradeId", "name")
    .populate({
      path: "classTeacherId",
      populate: {
        path: "user",
        select: "name email phone avatar employeeId",
      },
    })
    .populate("classTeacherAssignedBy", "name")
    .sort({ "gradeId.name": 1, name: 1 })
    .lean();

  const today = new Date().toISOString().split("T")[0];

  const results = [];
  for (const s of sections) {
    const className = `${s.gradeId?.name || "Class"} - ${s.name}`;
    const gradeName = s.gradeId?.name || "";
    const sectionName = s.name || "";

    // Count enrolled students
    const studentCount = await User.countDocuments({
      campusId,
      role: "student",
      $or: [
        {
          $and: [
            {
              $or: [
                { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
                { program: new RegExp(`^${gradeName}$`, "i") },
              ],
            },
            {
              section: {
                $in: [
                  sectionName,
                  `Section ${sectionName}`,
                  sectionName.toUpperCase(),
                  sectionName.toLowerCase(),
                ],
              },
            },
          ],
        },
      ],
    });

    // Check today's attendance count
    const attendanceCount = await StudentAttendance.countDocuments({
      campusId,
      dateStr: today,
      $or: [
        { className: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
        { gradeOrClass: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
      ],
    });

    results.push({
      _id: s._id.toString(),
      classId: s._id.toString(),
      gradeId: s.gradeId?._id,
      gradeName,
      sectionName,
      className,
      studentCount,
      isAttendanceMarkedToday: attendanceCount > 0,
      todayAttendanceCount: attendanceCount,
      classTeacher: s.classTeacherId
        ? {
            _id: s.classTeacherId._id.toString(),
            profileId: s.classTeacherId._id.toString(),
            userId: s.classTeacherId.user?._id?.toString(),
            name: s.classTeacherId.user?.name || "Teacher",
            email: s.classTeacherId.user?.email || "",
            avatar: s.classTeacherId.user?.avatar || "",
            department: s.classTeacherId.department || "",
            designation: s.classTeacherId.designation || "Teacher",
            assignedAt: s.classTeacherAssignedAt,
            assignedBy: s.classTeacherAssignedBy?.name || "Campus Admin",
            note: s.classTeacherNote || "",
          }
        : null,
    });
  }

  return results;
}

/**
 * 5. Get current logged-in teacher's Class Teacher assignment
 */
export async function getMyClassAssignment(campusId, teacherUserId) {
  const teacherProfile = await TeacherProfile.findOne({
    user: teacherUserId,
  }).populate("user", "name email phone avatar");

  if (!teacherProfile) {
    return { isClassTeacher: false, classInfo: null };
  }

  let sectionDoc = null;

  if (teacherProfile.classTeacherOf) {
    sectionDoc = await Section.findById(teacherProfile.classTeacherOf)
      .populate("gradeId", "name")
      .lean();
  }

  if (!sectionDoc) {
    sectionDoc = await Section.findOne({
      classTeacherId: teacherProfile._id,
      campusId,
    })
      .populate("gradeId", "name")
      .lean();
  }

  if (!sectionDoc) {
    return {
      isClassTeacher: false,
      teacherProfileId: teacherProfile._id,
      classInfo: null,
    };
  }

  const gradeName = sectionDoc.gradeId?.name || "Class 5";
  const sectionName = sectionDoc.name || "A";
  const className = `${gradeName} - ${sectionName}`;

  // Count enrolled students
  const studentCount = await User.countDocuments({
    campusId,
    role: "student",
    $or: [
      {
        $and: [
          {
            $or: [
              { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
              { program: new RegExp(`^${gradeName}$`, "i") },
            ],
          },
          {
            section: {
              $in: [
                sectionName,
                `Section ${sectionName}`,
                sectionName.toUpperCase(),
                sectionName.toLowerCase(),
              ],
            },
          },
        ],
      },
    ],
  });

  return {
    isClassTeacher: true,
    teacherProfileId: teacherProfile._id,
    classInfo: {
      _id: sectionDoc._id.toString(),
      classId: sectionDoc._id.toString(),
      gradeId: sectionDoc.gradeId?._id,
      gradeName,
      sectionName,
      className,
      studentCount,
      assignedAt: sectionDoc.classTeacherAssignedAt,
    },
  };
}

/**
 * 6. Get Students of the Class Teacher's class
 */
export async function getMyClassStudents(campusId, teacherUserId, options = {}) {
  const myClass = await getMyClassAssignment(campusId, teacherUserId);
  if (!myClass.isClassTeacher || !myClass.classInfo) {
    throw new Error("You are not currently assigned as a Class Teacher.");
  }

  const { gradeName, sectionName, className, classId } = myClass.classInfo;

  const users = await User.find({
    campusId,
    role: "student",
    $or: [
      {
        $and: [
          {
            $or: [
              { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
              { program: new RegExp(`^${gradeName}$`, "i") },
            ],
          },
          {
            section: {
              $in: [
                sectionName,
                `Section ${sectionName}`,
                sectionName.toUpperCase(),
                sectionName.toLowerCase(),
              ],
            },
          },
        ],
      },
    ],
  })
    .select(
      "_id name email phone roll rollNo rollNumber gradeOrClass program section avatar guardianName guardianPhone guardianRelation isActive createdAt"
    )
    .sort({ rollNumber: 1, name: 1 })
    .lean();

  const students = users.map((u, idx) => ({
    _id: u._id.toString(),
    id: u._id.toString(),
    studentId: u._id.toString(),
    rollNo: u.rollNumber || u.rollNo || u.roll || `${sectionName}-${String(idx + 1).padStart(3, "0")}`,
    name: u.name || "Student",
    email: u.email || "",
    phone: u.phone || "",
    avatar: u.avatar || "",
    className,
    gradeName,
    sectionName,
    guardianDetails: {
      name: u.guardianName || "Guardian",
      phone: u.guardianPhone || "—",
      relation: u.guardianRelation || "Parent",
    },
    isActive: u.isActive !== false,
  }));

  return {
    classInfo: myClass.classInfo,
    count: students.length,
    students,
  };
}

/**
 * 7. Mark Class Attendance (Daily bulk upsert)
 */
export async function markClassAttendance(
  campusId,
  teacherUserId,
  { date, records = [], classId, userRole }
) {
  let targetClassId = classId;
  let gradeName = "";
  let sectionName = "";

  if (targetClassId) {
    const sec = await Section.findById(targetClassId).populate("gradeId", "name");
    if (sec) {
      gradeName = sec.gradeId?.name || "";
      sectionName = sec.name || "";
    }
  }

  if (!gradeName) {
    const myClass = await getMyClassAssignment(campusId, teacherUserId);
    if (!myClass.isClassTeacher && !["campus_admin", "principal"].includes(userRole)) {
      throw new Error("You are not authorized to mark attendance for this class.");
    }
    if (myClass.classInfo) {
      targetClassId = myClass.classInfo.classId;
      gradeName = myClass.classInfo.gradeName;
      sectionName = myClass.classInfo.sectionName;
    }
  }

  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split("T")[0];

  // Enforce CT-08: Cannot edit attendance older than 7 days unless admin
  const today = new Date();
  const diffTime = Math.abs(today - targetDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isAdmin = ["campus_admin", "campus_manager", "principal", "super_admin"].includes(
    userRole
  );

  if (diffDays > 7 && !isAdmin) {
    throw new Error(
      "Attendance older than 7 days is locked. Please contact Campus Admin for override."
    );
  }

  const savedRecords = [];
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  for (const rec of records) {
    const studentId = rec.studentId || rec._id || rec.id;
    if (!studentId || !mongoose.isValidObjectId(studentId)) continue;

    const rawStatus = (rec.status || "Present").trim();
    // Normalize status
    let status = "Present";
    if (/absent/i.test(rawStatus)) status = "Absent";
    else if (/late/i.test(rawStatus)) status = "Late";
    else if (/excuse/i.test(rawStatus)) status = "Excused";
    else if (/leave/i.test(rawStatus)) status = "On Leave";

    if (status === "Present") presentCount++;
    else if (status === "Absent") absentCount++;
    else if (status === "Late") lateCount++;
    else if (status === "Excused" || status === "On Leave") excusedCount++;

    const attendanceDoc = await StudentAttendance.findOneAndUpdate(
      {
        campusId,
        studentId,
        dateStr,
      },
      {
        $set: {
          campusId,
          studentId,
          date: targetDate,
          dateStr,
          status,
          className: gradeName,
          gradeOrClass: gradeName,
          section: sectionName,
          remarks: rec.remarks || "",
          markedBy: teacherUserId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    savedRecords.push(attendanceDoc);
  }

  const summary = {
    totalStudents: records.length,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    excused: excusedCount,
    attendanceRate:
      records.length > 0
        ? Math.round(((presentCount + lateCount) / records.length) * 100)
        : 100,
    date: dateStr,
    markedAt: new Date(),
  };

  return {
    success: true,
    message: `Attendance for ${dateStr} saved successfully (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late, ${excusedCount} Excused).`,
    summary,
    records: savedRecords,
  };
}

/**
 * 8. Get Class Attendance for a specific date
 */
export async function getMyClassAttendance(
  campusId,
  teacherUserId,
  date,
  customClassId = null
) {
  let gradeName = "";
  let sectionName = "";
  let className = "";
  let classId = customClassId;

  if (classId) {
    const sec = await Section.findById(classId).populate("gradeId", "name");
    if (sec) {
      gradeName = sec.gradeId?.name || "";
      sectionName = sec.name || "";
      className = `${gradeName} - ${sectionName}`;
    }
  }

  if (!gradeName) {
    const myClass = await getMyClassAssignment(campusId, teacherUserId);
    if (!myClass.isClassTeacher) {
      return {
        isClassTeacher: false,
        attendance: [],
        summary: { present: 0, absent: 0, late: 0, excused: 0, total: 0 },
      };
    }
    gradeName = myClass.classInfo.gradeName;
    sectionName = myClass.classInfo.sectionName;
    className = myClass.classInfo.className;
    classId = myClass.classInfo.classId;
  }

  const targetDate = date ? new Date(date) : new Date();
  const dateStr = targetDate.toISOString().split("T")[0];

  // Fetch all enrolled students
  const students = await User.find({
    campusId,
    role: "student",
    $or: [
      {
        $and: [
          {
            $or: [
              { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
              { program: new RegExp(`^${gradeName}$`, "i") },
            ],
          },
          {
            section: {
              $in: [
                sectionName,
                `Section ${sectionName}`,
                sectionName.toUpperCase(),
                sectionName.toLowerCase(),
              ],
            },
          },
        ],
      },
    ],
  })
    .select("_id name email roll rollNo rollNumber avatar")
    .sort({ rollNumber: 1, name: 1 })
    .lean();

  // Fetch recorded attendance for the day
  const recorded = await StudentAttendance.find({
    campusId,
    dateStr,
    $or: [
      { className: new RegExp(`^${gradeName}$`, "i") },
      { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
    ],
  }).lean();

  const recordMap = new Map();
  for (const r of recorded) {
    recordMap.set(String(r.studentId), r);
  }

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let markedCount = 0;

  const attendanceList = students.map((s, idx) => {
    const rec = recordMap.get(String(s._id));
    const status = rec ? rec.status : "Present";
    if (rec) {
      markedCount++;
      if (status === "Present" || status === "present") present++;
      else if (status === "Absent" || status === "absent") absent++;
      else if (status === "Late" || status === "late") late++;
      else excused++;
    }

    return {
      _id: s._id.toString(),
      studentId: s._id.toString(),
      name: s.name || "Student",
      rollNo: s.rollNumber || s.rollNo || s.roll || `${sectionName}-${String(idx + 1).padStart(3, "0")}`,
      avatar: s.avatar || "",
      status: rec ? rec.status : "Present",
      remarks: rec ? rec.remarks || "" : "",
      markedAt: rec?.updatedAt || rec?.createdAt || null,
      isMarked: !!rec,
    };
  });

  const isMarked = markedCount > 0;
  if (!isMarked) {
    // Default preview counts
    present = students.length;
  }

  return {
    isClassTeacher: true,
    classId,
    className,
    date: dateStr,
    isMarkedToday: isMarked,
    summary: {
      total: students.length,
      present,
      absent,
      late,
      excused,
      percentage:
        students.length > 0
          ? Math.round(((present + late) / students.length) * 100)
          : 100,
    },
    students: attendanceList,
  };
}

/**
 * 9. Get Monthly Attendance Breakdown for Class
 */
export async function getMyClassAttendanceMonthly(
  campusId,
  teacherUserId,
  { classId, month, year }
) {
  let gradeName = "";
  let sectionName = "";

  if (classId) {
    const sec = await Section.findById(classId).populate("gradeId", "name");
    if (sec) {
      gradeName = sec.gradeId?.name || "";
      sectionName = sec.name || "";
    }
  }

  if (!gradeName) {
    const myClass = await getMyClassAssignment(campusId, teacherUserId);
    if (!myClass.isClassTeacher) {
      throw new Error("Not a Class Teacher.");
    }
    gradeName = myClass.classInfo.gradeName;
    sectionName = myClass.classInfo.sectionName;
  }

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || String(new Date().getMonth() + 1).padStart(2, "0");
  const prefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const records = await StudentAttendance.find({
    campusId,
    dateStr: new RegExp(`^${prefix}`),
    $or: [
      { className: new RegExp(`^${gradeName}$`, "i") },
      { gradeOrClass: new RegExp(`^${gradeName}$`, "i") },
    ],
  }).lean();

  const totalSessions = new Set(records.map((r) => r.dateStr)).size;

  let totalP = 0;
  let totalA = 0;
  let totalL = 0;
  let totalE = 0;

  for (const r of records) {
    const st = r.status || "Present";
    if (/present/i.test(st)) totalP++;
    else if (/absent/i.test(st)) totalA++;
    else if (/late/i.test(st)) totalL++;
    else totalE++;
  }

  const totalLogs = totalP + totalA + totalL + totalE;
  const overallAvg =
    totalLogs > 0 ? Math.round(((totalP + totalL) / totalLogs) * 100) : 100;

  return {
    month: prefix,
    totalWorkingDays: totalSessions,
    overallAttendancePercentage: overallAvg,
    stats: {
      present: totalP,
      absent: totalA,
      late: totalL,
      excused: totalE,
    },
  };
}

/**
 * 10. Get Class KPIs & Dashboard Stats for Class Teacher
 */
export async function getMyClassStats(campusId, teacherUserId) {
  const myClass = await getMyClassAssignment(campusId, teacherUserId);
  if (!myClass.isClassTeacher || !myClass.classInfo) {
    return {
      isClassTeacher: false,
      message: "No class assigned.",
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const attendanceToday = await getMyClassAttendance(
    campusId,
    teacherUserId,
    today,
    myClass.classInfo.classId
  );

  return {
    isClassTeacher: true,
    classInfo: myClass.classInfo,
    todayAttendance: {
      isMarked: attendanceToday.isMarkedToday,
      summary: attendanceToday.summary,
    },
  };
}

/**
 * 11. Get classes that haven't marked attendance today (Admin Alert & Cron support)
 */
export async function getUnmarkedClassesToday(campusId) {
  const sections = await Section.find({ campusId })
    .populate("gradeId", "name")
    .populate({
      path: "classTeacherId",
      populate: { path: "user", select: "name email phone" },
    })
    .lean();

  const today = new Date().toISOString().split("T")[0];
  const unmarked = [];

  for (const s of sections) {
    const gradeName = s.gradeId?.name || "";
    const sectionName = s.name || "";
    const className = `${gradeName} - ${sectionName}`;

    const count = await StudentAttendance.countDocuments({
      campusId,
      dateStr: today,
      $or: [
        { className: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
        { gradeOrClass: new RegExp(`^${gradeName}$`, "i"), section: new RegExp(`^${sectionName}$`, "i") },
      ],
    });

    if (count === 0) {
      unmarked.push({
        classId: s._id.toString(),
        className,
        gradeName,
        sectionName,
        classTeacher: s.classTeacherId
          ? {
              name: s.classTeacherId.user?.name || "Teacher",
              email: s.classTeacherId.user?.email || "",
            }
          : null,
      });
    }
  }

  return {
    date: today,
    totalClasses: sections.length,
    unmarkedCount: unmarked.length,
    unmarkedClasses: unmarked,
  };
}

export default {
  assignClassTeacher,
  removeClassTeacher,
  getClassTeacher,
  getAllClassTeachers,
  getMyClassAssignment,
  getMyClassStudents,
  markClassAttendance,
  getMyClassAttendance,
  getMyClassAttendanceMonthly,
  getMyClassStats,
  getUnmarkedClassesToday,
};
