import TeacherAttendance from "../models/teacherAttendance.model.js";
import User from "../models/user.model.js";

// ---- Date Helpers ----
export function normalizeDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(d) {
  const date = normalizeDate(d);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ---- KPI Stats ----
export async function getStats(campusId, dateStr) {
  const date = normalizeDate(dateStr || new Date());

  const total = await User.countDocuments({
    campusId,
    role: { $in: ["teacher", "faculty"] },
  });

  const [present, late, absent, onLeave] = await Promise.all([
    TeacherAttendance.countDocuments({ campusId, date, status: "Present" }),
    TeacherAttendance.countDocuments({ campusId, date, status: "Late" }),
    TeacherAttendance.countDocuments({ campusId, date, status: "Absent" }),
    TeacherAttendance.countDocuments({ campusId, date, status: "On Leave" }),
  ]);

  return { total, present, late, absent, onLeave, date };
}

// ---- List today's attendance for a campus ----
export async function getAttendanceByDate(campusId, dateStr, filters = {}) {
  const date = normalizeDate(dateStr || new Date());

  // Load teachers for the given campus
  const teachers = await User.find({
    campusId,
    role: { $in: ["teacher", "faculty"] },
  })
    .select("name email phone department designation subjects status")
    .sort({ name: 1 })
    .lean();

  // Load attendance records for this date
  const records = await TeacherAttendance.find({ campusId, date })
    .populate("markedBy", "name email")
    .lean();

  const byTeacher = new Map(
    records.map((r) => [String(r.teacherProfileId), r])
  );

  let results = teachers.map((t) => {
    const att = byTeacher.get(String(t._id));
    return {
      teacherProfileId: t._id,
      userId: t._id,
      name: t.name || "Unknown Staff",
      email: t.email || "",
      phone: t.phone || "",
      department: t.department || "General",
      designation: t.designation || "Lecturer",
      subjects: t.subjects || "",
      attendanceId: att?._id || null,
      status: att?.status || null,
      checkInTime: att?.checkInTime || null,
      checkOutTime: att?.checkOutTime || null,
      remarks: att?.remarks || "",
      markedBy: att?.markedBy || null,
      date,
    };
  });

  // Apply filters
  if (filters.status && filters.status !== "All Status") {
    if (filters.status === "Unrecorded") {
      results = results.filter((r) => !r.status);
    } else {
      results = results.filter((r) => r.status === filters.status);
    }
  }

  if (filters.department && filters.department !== "All Departments") {
    results = results.filter(
      (r) => r.department?.toLowerCase() === filters.department.toLowerCase()
    );
  }

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.designation?.toLowerCase().includes(q)
    );
  }

  return results;
}

// ---- Weekly view ----
export async function getWeekly(campusId, dateStr) {
  const start = startOfWeek(dateStr || new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [teachers, records] = await Promise.all([
    User.find({
      campusId,
      role: { $in: ["teacher", "faculty"] },
    })
      .select("name email department designation")
      .sort({ name: 1 })
      .lean(),
    TeacherAttendance.find({
      campusId,
      date: { $gte: start, $lt: end },
    })
      .populate("markedBy", "name")
      .lean(),
  ]);

  // Build a lookup map by teacherProfileId + dateKey
  const recordsMap = {};
  for (const rec of records) {
    const d = new Date(rec.date);
    const key = `${rec.teacherProfileId}_${d.toISOString().slice(0, 10)}`;
    recordsMap[key] = rec;
  }

  // Generate 7 days of the week starting from Monday
  const days = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }

  const grid = teachers.map((teacher) => {
    const dailyRecords = {};
    for (const day of days) {
      const rec = recordsMap[`${teacher._id}_${day}`] || null;
      dailyRecords[day] = rec
        ? {
            attendanceId: rec._id,
            status: rec.status,
            checkInTime: rec.checkInTime || "",
            checkOutTime: rec.checkOutTime || "",
            remarks: rec.remarks || "",
          }
        : null;
    }

    return {
      teacherProfileId: teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || "General",
      designation: teacher.designation || "Lecturer",
      dailyRecords,
    };
  });

  return {
    weekStart: start.toISOString().slice(0, 10),
    days,
    grid,
    records,
  };
}

// ---- History with pagination and filters ----
export async function getHistory(campusId, queryOptions = {}) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    status,
    department,
    search,
  } = queryOptions;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const query = { campusId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = normalizeDate(startDate);
    }
    if (endDate) {
      const end = normalizeDate(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  if (status && status !== "All Status") {
    query.status = status;
  }

  if (department && department !== "All Departments") {
    const matchingTeachers = await User.find({
      campusId,
      role: { $in: ["teacher", "faculty"] },
      department,
    }).select("_id");
    query.teacherProfileId = { $in: matchingTeachers.map((t) => t._id) };
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    const matchingTeachers = await User.find({
      campusId,
      role: { $in: ["teacher", "faculty"] },
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
      ],
    }).select("_id");

    if (query.teacherProfileId) {
      const existingIds = new Set(
        query.teacherProfileId.$in.map((id) => String(id))
      );
      query.teacherProfileId = {
        $in: matchingTeachers
          .filter((t) => existingIds.has(String(t._id)))
          .map((t) => t._id),
      };
    } else {
      query.teacherProfileId = { $in: matchingTeachers.map((t) => t._id) };
    }
  }

  const [items, total] = await Promise.all([
    TeacherAttendance.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("teacherProfileId", "name email department designation")
      .populate("markedBy", "name email")
      .lean(),
    TeacherAttendance.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum) || 1,
  };
}

// ---- Upsert single attendance record ----
export async function markAttendance(campusId, markedBy, payload) {
  const {
    teacherProfileId,
    date,
    status,
    checkInTime,
    checkOutTime,
    remarks,
  } = payload;

  if (!teacherProfileId || !status) {
    const err = new Error("teacherProfileId and status are required");
    err.statusCode = 400;
    throw err;
  }

  const normalized = normalizeDate(date || new Date());

  const record = await TeacherAttendance.findOneAndUpdate(
    { teacherProfileId, date: normalized },
    {
      campusId,
      teacherProfileId,
      date: normalized,
      status,
      checkInTime: checkInTime?.trim() || "",
      checkOutTime: checkOutTime?.trim() || "",
      remarks: remarks?.trim() || "",
      markedBy,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate("teacherProfileId", "name email department designation")
    .populate("markedBy", "name email");

  return record;
}

// ---- Update existing record ----
export async function updateAttendance(id, campusId, payload) {
  const allowed = ["status", "checkInTime", "checkOutTime", "remarks"];
  const updateData = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      updateData[key] = payload[key];
    }
  }

  const record = await TeacherAttendance.findOneAndUpdate(
    { _id: id, campusId },
    updateData,
    { new: true, runValidators: true }
  )
    .populate("teacherProfileId", "name email department designation")
    .populate("markedBy", "name email");

  if (!record) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }

  return record;
}

// ---- Delete ----
export async function deleteAttendance(id, campusId) {
  const record = await TeacherAttendance.findOneAndDelete({
    _id: id,
    campusId,
  });

  if (!record) {
    const err = new Error("Attendance record not found");
    err.statusCode = 404;
    throw err;
  }

  return record;
}

// ---- Check-in (record UTC check-in time) ----
export async function checkIn(campusId, markedBy, teacherProfileId) {
  const teacher = await User.findOne({
    _id: teacherProfileId,
    campusId,
    role: { $in: ["teacher", "faculty"] },
  }).select("_id").lean();
  if (!teacher) {
    const error = new Error("Teacher or staff member was not found for this campus.");
    error.statusCode = 404;
    throw error;
  }

  const date = normalizeDate(new Date());
  const existing = await TeacherAttendance.findOne({ campusId, teacherProfileId, date });
  if (existing?.checkInTime) {
    const error = new Error("This teacher has already checked in today.");
    error.statusCode = 409;
    throw error;
  }

  const checkInTime = new Date().toISOString();
  const record = await TeacherAttendance.findOneAndUpdate(
    { campusId, teacherProfileId, date },
    {
      $set: { status: "Present", checkInTime, markedBy },
      $setOnInsert: { campusId, teacherProfileId, date },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .populate("teacherProfileId", "name email department designation")
    .populate("markedBy", "name email");
  return record;
}

// ---- Check-out (record UTC check-out time) ----
export async function checkOut(campusId, markedBy, teacherProfileId) {
  const date = normalizeDate(new Date());
  const existing = await TeacherAttendance.findOne({ campusId, teacherProfileId, date });
  if (!existing?.checkInTime) {
    const error = new Error("Check-in must be recorded before check-out.");
    error.statusCode = 400;
    throw error;
  }
  if (existing.checkOutTime) {
    const error = new Error("This teacher has already checked out today.");
    error.statusCode = 409;
    throw error;
  }

  const checkOutTime = new Date().toISOString();
  const record = await TeacherAttendance.findOneAndUpdate(
    // Older attendance documents may store an unset checkout as null or omit
    // the field entirely. Both are valid "not checked out" states.
    { _id: existing._id, campusId, checkOutTime: { $in: ["", null] } },
    { $set: { checkOutTime, markedBy } },
    { new: true, runValidators: true }
  )
    .populate("teacherProfileId", "name email department designation")
    .populate("markedBy", "name email");
  if (!record) {
    const error = new Error("Attendance changed before check-out could be recorded. Please refresh and try again.");
    error.statusCode = 409;
    throw error;
  }
  return record;
}
