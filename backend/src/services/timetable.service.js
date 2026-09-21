import Timetable from "../models/timetable.model.js";
import { timesOverlap } from "../utils/timetableTime.js";
import {
  getMatrixConfig,
  institutionTypeOptions,
} from "../data/timetableMatrix.config.js";

export class TimetableConflictError extends Error {
  constructor(conflicts) {
    super("Schedule conflict detected.");
    this.name = "TimetableConflictError";
    this.statusCode = 409;
    this.conflicts = conflicts;
  }
}

const CELL_EDIT_FIELDS = new Set([
  "institutionType",
  "program",
  "section",
  "subject",
  "instructor",
  "instructorId",
  "room",
  "dayOfWeek",
  "startTime",
  "endTime",
  "isBreak",
  "breakTitle",
  "colorTag",
  "status",
]);

function buildScopeFilter(campusId, query = {}) {
  const filter = { campusId };
  const directFilters = [
    "institutionType",
    "program",
    "section",
    "instructor",
    "room",
    "dayOfWeek",
    "isBreak",
    "status",
  ];
  for (const key of directFilters) {
    if (query[key] !== undefined && query[key] !== "") {
      filter[key] =
        key === "isBreak" ? query[key] === "true" || query[key] === true : query[key];
    }
  }
  return filter;
}

function conflictMessage(type, existing, candidate) {
  return {
    type,
    message: `${type.replace(/_/g, " ")} with existing entry "${existing.subject}" (${existing.startTime}–${existing.endTime}).`,
    existingId: existing._id,
    candidate,
  };
}

/**
 * Detects room, instructor, and section overlaps for the same campus/day.
 */
export async function findScheduleConflicts(
  campusId,
  candidate,
  excludeId = null,
) {
  if (candidate.isBreak) return [];

  const sameDay = await Timetable.find({
    campusId,
    dayOfWeek: candidate.dayOfWeek,
    status: { $ne: "Cancelled" },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  const conflicts = [];
  for (const existing of sameDay) {
    if (existing.isBreak) continue;
    if (
      !timesOverlap(
        candidate.startTime,
        candidate.endTime,
        existing.startTime,
        existing.endTime,
      )
    ) {
      continue;
    }

    if (
      candidate.room &&
      existing.room &&
      candidate.room.toLowerCase() === existing.room.toLowerCase()
    ) {
      conflicts.push(conflictMessage("ROOM_CONFLICT", existing, candidate));
    }

    if (
      candidate.instructor &&
      existing.instructor &&
      candidate.instructor.toLowerCase() === existing.instructor.toLowerCase()
    ) {
      conflicts.push(
        conflictMessage("INSTRUCTOR_CONFLICT", existing, candidate),
      );
    }

    if (
      candidate.program &&
      candidate.section &&
      existing.program &&
      existing.section &&
      candidate.program.toLowerCase() === existing.program.toLowerCase() &&
      candidate.section.toLowerCase() === existing.section.toLowerCase()
    ) {
      conflicts.push(conflictMessage("SECTION_CONFLICT", existing, candidate));
    }
  }

  const seen = new Set();
  return conflicts.filter((item) => {
    const key = `${item.type}-${item.existingId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function assertNoConflicts(campusId, payload, excludeId = null) {
  const conflicts = await findScheduleConflicts(campusId, payload, excludeId);
  if (conflicts.length) throw new TimetableConflictError(conflicts);
}

const timetableService = {
  listForCampus(campusId, query) {
    const filter = buildScopeFilter(campusId, query);
    return Timetable.find(filter).sort({ dayOfWeek: 1, startTime: 1 });
  },

  async getById(campusId, id) {
    const record = await Timetable.findOne({ _id: id, campusId });
    if (!record) throw new Error("Timetable entry not found.");
    return record;
  },

  async create(campusId, instituteId, body) {
    const payload = {
      ...body,
      campusId,
      instituteId: instituteId ?? body.instituteId ?? null,
    };
    await assertNoConflicts(campusId, payload);
    return Timetable.create(payload);
  },

  async update(campusId, id, body) {
    const existing = await this.getById(campusId, id);
    const merged = { ...existing.toObject(), ...body, campusId };
    await assertNoConflicts(campusId, merged, id);
    Object.assign(existing, body);
    await existing.save();
    return existing;
  },

  async patchCell(campusId, id, body) {
    const patch = {};
    for (const [key, value] of Object.entries(body)) {
      if (CELL_EDIT_FIELDS.has(key)) patch[key] = value;
    }
    if (!Object.keys(patch).length) {
      throw new Error("No valid timetable fields provided for cell update.");
    }
    return this.update(campusId, id, patch);
  },

  async remove(campusId, id) {
    const record = await Timetable.findOneAndDelete({ _id: id, campusId });
    if (!record) throw new Error("Timetable entry not found.");
    return record;
  },

  checkConflicts(campusId, body, excludeId = null) {
    return findScheduleConflicts(campusId, body, excludeId);
  },

  getInstitutionTypes() {
    return institutionTypeOptions;
  },

  getMatrix(institutionType) {
    return getMatrixConfig(institutionType);
  },
};

export default timetableService;
