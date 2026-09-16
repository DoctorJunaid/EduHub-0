import TeacherAttendance from "../models/teacherAttendance.model.js";
import TeacherProfile from "../models/teacherProfile.model.js";

// ---- Helpers ----
function normalizeDate(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return normalizeDate(new Date(date.setDate(diff)));
}

// ---- KPI Stats ----
export async function getStats(campusId, dateStr) {
  const date = normalizeDate(dateStr || new Date());

  const total = await TeacherProfile.countDocuments({ campusId });
  const present = await TeacherAttendance.countDocuments({
    campusId, date, status: "Present",
  });
  const late = await TeacherAttendance.countDocuments({
    campusId, date, status: "Late",
  });
  const absent = await TeacherAttendance.countDocuments({
    campusId, date, status: "Absent",
  });
  const onLeave = await TeacherAttendance.countDocuments({
    campusId, date, status: "On Leave",
  });

  return { total, present, late, absent, onLeave, date };
}

// ---- List today's attendance for a campus ----
export async function getAttendanceByDate(campusId, dateStr, filters = {}) {
  const date = normalizeDate(dateStr || new Date());

  // Load teachers with attendance joined
  const teachers = await TeacherProfile.find({ campusId })
    .populate({ path: "userId", select: "name email phone" })
    .lean();

  const records = await TeacherAttendance.find({ campusId, date }).lean();
  const byTeacher = new Map(
    records.map((r) => [String(r.teacherProfileId), r])
  );

  let results = teachers.map((t) => {
    const att = byTeacher.get(String(t._id));
    return {
      teacherProfileId: t._id,
      userId: t.userId?._id || null,
      name: t.userId?.name || "Unknown",
      email: t.userId?.email || "",
      phone: t.userId?.phone || "",
      department: t.department || "—",
      designation: t.designation || "",
      subjects: t.subjects || [],
      attendanceId: att?._id || null,
      status: att?.status || null,
      checkInTime: att?.checkInTime || null,
      checkOutTime: att?.checkOutTime || null,
      remarks: att?.remarks || "",
    };
  });

  // Apply filters
  if (filters.status && filters.status !== "All Status") {
    results = results.filter((r) => r.status === filters.status);
  }
  if (filters.department && filters.department !== "All Departments") {
    results = results.filter((r) => r.department === filters.department);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }

  return results;
}

// ---- Weekly view ----
export async function getWeekly(campusId, dateStr) {
  const start = startOfWeek(dateStr || new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return TeacherAttendance.find({
    campusId,
    date: { $gte: start, $lt: end },
  })
    .populate({
      path: "teacherProfileId",
      populate: { path: "userId", select: "name" },
    })
    .lean();
}

// ---- History with pagination ----
export async function getHistory(campusId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    TeacherAttendance.find({ campusId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "teacherProfileId",
        populate: { path: "userId", select: "name" },
      })
      .lean(),
    TeacherAttendance.countDocuments({ campusId }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
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
    throw new Error("teacherProfileId and status are required");
  }

  const normalized = normalizeDate(date || new Date());

  const record = await TeacherAttendance.findOneAndUpdate(
    { teacherProfileId, date: normalized },
    {
      campusId,
      teacherProfileId,
      date: normalized,
      status,
      checkInTime,
      checkOutTime,
      remarks,
      markedBy,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return record;
}

// ---- Update existing record ----
export async function updateAttendance(id, campusId, payload) {
  const record = await TeacherAttendance.findOneAndUpdate(
    { _id: id, campusId },
    payload,
    { new: true, runValidators: true }
  );
  if (!record) throw new Error("Attendance record not found");
  return record;
}

// ---- Delete ----
export async function deleteAttendance(id, campusId) {
  const record = await TeacherAttendance.findOneAndDelete({ _id: id, campusId });
  if (!record) throw new Error("Attendance record not found");
  return record;
}