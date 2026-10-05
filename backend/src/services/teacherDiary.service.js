import mongoose from "mongoose";
import Diary from "../models/diary.model.js";
import { StudentDiary } from "../models/studentPortal.model.js";
import { getTeacherAssignedClasses, resolveTeacherUser } from "./teacherAssignment.service.js";

/**
 * 1. Get assigned classes for the diary dropdown.
 */
export async function getTeacherDiaryClasses(campusId, teacherUserId) {
  return await getTeacherAssignedClasses(campusId, teacherUserId);
}

/**
 * 2. Get list of diary entries with filtering and search.
 */
export async function getTeacherDiaryEntries(campusId, teacherUserId, filters = {}) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;

  const query = { campusId };

  if (filters.teacherOnly !== false) {
    query.$or = [{ teacherId: uId }, { teacherName: resolved?.name }];
  }

  if (filters.classId && filters.classId !== "All") {
    query.$or = [
      { classId: filters.classId },
      { className: filters.classId },
    ];
  }

  if (filters.className && filters.className !== "All") {
    query.className = new RegExp(`^${filters.className}$`, "i");
  }

  if (filters.section && filters.section !== "All") {
    query.section = new RegExp(`^${filters.section}$`, "i");
  }

  if (filters.date) {
    query.date = String(filters.date).slice(0, 10);
  }

  if (filters.search) {
    const q = String(filters.search).trim();
    const regex = new RegExp(q, "i");
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { title: regex },
        { recap: regex },
        { homework: regex },
        { resources: regex },
        { className: regex },
        { subject: regex },
      ],
    });
  }

  const entries = await Diary.find(query)
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const formatted = entries.map((e) => ({
    ...e,
    _id: e._id.toString(),
    id: e._id.toString(),
  }));

  return formatted;
}

/**
 * 3. Get single diary entry by ID.
 */
export async function getDiaryEntryById(campusId, entryId) {
  if (!mongoose.isValidObjectId(entryId)) {
    throw new Error("Invalid diary entry ID.");
  }
  const entry = await Diary.findOne({ _id: entryId, campusId }).lean();
  if (!entry) throw new Error("Diary entry not found.");
  return { ...entry, id: entry._id.toString() };
}

/**
 * 4. Create a new diary entry.
 */
export async function createDiaryEntry(campusId, teacherUserId, data) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;
  const teacherName = resolved?.name || data.teacherName || "Teacher";

  const title = (data.title || "").trim();
  const recap = (data.recap || "").trim();
  const date = data.date ? String(data.date).slice(0, 10) : new Date().toISOString().split("T")[0];

  if (!title) throw new Error("Lecture topic / title is required.");
  if (!recap) throw new Error("Lecture recap / summary is required.");

  const className = data.className || data.gradeOrClass || "Class 10";
  const section = data.section || "A";
  const subject = data.subject || "General";

  let dateObj;
  try {
    dateObj = new Date(`${date}T00:00:00.000Z`);
  } catch {
    dateObj = new Date();
  }

  const payload = {
    campusId,
    teacherId: uId,
    teacherName,
    classId: data.classId || null,
    className,
    gradeOrClass: className,
    section,
    subject,
    date,
    dateObj,
    title,
    recap,
    homework: (data.homework || "").trim(),
    resources: (data.resources || "").trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    publicationStatus: data.publicationStatus || "Published",
  };

  const created = await Diary.create(payload);

  // Also sync to StudentDiary for student portal
  try {
    await StudentDiary.create({
      campusId,
      classId: data.classId && mongoose.isValidObjectId(data.classId) ? data.classId : new mongoose.Types.ObjectId(),
      date,
      title,
      recap,
      homework: payload.homework,
      resources: payload.resources,
      publicationStatus: payload.publicationStatus,
    });
  } catch (err) {
    // non-fatal
    console.warn("StudentDiary sync notice:", err.message);
  }

  return { ...created.toObject(), id: created._id.toString() };
}

/**
 * 5. Update an existing diary entry.
 */
export async function updateDiaryEntry(campusId, teacherUserId, entryId, data) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;

  if (!mongoose.isValidObjectId(entryId)) {
    throw new Error("Invalid diary entry ID.");
  }

  const existing = await Diary.findOne({ _id: entryId, campusId });
  if (!existing) throw new Error("Diary entry not found.");

  // Check authorization
  if (resolved?.role !== "super_admin" && resolved?.role !== "campus_admin") {
    if (String(existing.teacherId) !== String(uId)) {
      throw new Error("Unauthorized to edit this diary entry.");
    }
  }

  const updateFields = {};
  if (data.title !== undefined) updateFields.title = data.title.trim();
  if (data.recap !== undefined) updateFields.recap = data.recap.trim();
  if (data.homework !== undefined) updateFields.homework = data.homework.trim();
  if (data.resources !== undefined) updateFields.resources = data.resources.trim();
  if (data.className !== undefined) {
    updateFields.className = data.className;
    updateFields.gradeOrClass = data.className;
  }
  if (data.section !== undefined) updateFields.section = data.section;
  if (data.subject !== undefined) updateFields.subject = data.subject;
  if (data.classId !== undefined) updateFields.classId = data.classId;
  if (data.publicationStatus !== undefined) updateFields.publicationStatus = data.publicationStatus;
  if (data.date) {
    updateFields.date = String(data.date).slice(0, 10);
    try {
      updateFields.dateObj = new Date(`${updateFields.date}T00:00:00.000Z`);
    } catch {
      updateFields.dateObj = new Date();
    }
  }

  const updated = await Diary.findOneAndUpdate(
    { _id: entryId, campusId },
    { $set: updateFields },
    { new: true, runValidators: true }
  ).lean();

  return { ...updated, id: updated._id.toString() };
}

/**
 * 6. Delete a diary entry.
 */
export async function deleteDiaryEntry(campusId, teacherUserId, entryId) {
  const resolved = await resolveTeacherUser(teacherUserId);
  const uId = resolved?._id || teacherUserId;

  if (!mongoose.isValidObjectId(entryId)) {
    throw new Error("Invalid diary entry ID.");
  }

  const existing = await Diary.findOne({ _id: entryId, campusId });
  if (!existing) throw new Error("Diary entry not found.");

  if (resolved?.role !== "super_admin" && resolved?.role !== "campus_admin") {
    if (String(existing.teacherId) !== String(uId)) {
      throw new Error("Unauthorized to delete this diary entry.");
    }
  }

  await Diary.findOneAndDelete({ _id: entryId, campusId });
  return { success: true, message: "Diary entry deleted successfully." };
}
