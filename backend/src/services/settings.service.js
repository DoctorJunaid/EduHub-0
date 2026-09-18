import InstituteSettings from "../models/instituteSettings.model.js";
import CampusSettings from "../models/campusSettings.model.js";
import Campus from "../models/campus.model.js";
import Institute from "../models/institute.model.js";

const DEFAULT_SETTINGS = {
  periodsPerDay: 6,
  periodDurationMinutes: 45,
  workingDaysPerWeek: 6,
  workingDaysPerMonth: 26,
  maxSubstitutesPerDayPerTeacher: 4,
  maxSubstitutesPerWeekPerTeacher: 15,
  substituteLoadWarningThreshold: 3,
  allowSameSubstituteForWholeDay: true,
  requireApprovalForSubstitute: false,
  lateGraceMinutes: 10,
  earlyLeaveGraceMinutes: 15,
};

export const getInstituteSettings = async (instituteId) => {
  let settings = await InstituteSettings.findOne({ instituteId });
  if (!settings) {
    settings = await InstituteSettings.create({
      instituteId,
      ...DEFAULT_SETTINGS,
    });
  }
  return settings;
};

export const updateInstituteSettings = async (instituteId, payload, userId) => {
  let settings = await InstituteSettings.findOne({ instituteId });
  if (!settings) {
    settings = new InstituteSettings({ instituteId, ...DEFAULT_SETTINGS });
  }

  // Update fields
  const updatableFields = Object.keys(DEFAULT_SETTINGS);
  updatableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      settings[field] = payload[field];
    }
  });
  settings.lastEditedBy = userId;
  await settings.save();
  return settings;
};

export const getCampusSettings = async (campusId) => {
  const campus = await Campus.findById(campusId);
  if (!campus) throw new Error("Campus not found");

  let settings = await CampusSettings.findOne({ campusId });
  if (!settings) {
    settings = await CampusSettings.create({
      campusId,
      instituteId: campus.instituteId,
    });
  }
  return settings;
};

export const updateCampusSettings = async (campusId, payload, userId) => {
  const campus = await Campus.findById(campusId);
  if (!campus) throw new Error("Campus not found");

  let settings = await CampusSettings.findOne({ campusId });
  if (!settings) {
    settings = new CampusSettings({ campusId, instituteId: campus.instituteId });
  }

  // Update fields (overrides)
  const updatableFields = Object.keys(DEFAULT_SETTINGS);
  updatableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      settings[field] = payload[field];
    }
  });
  settings.lastEditedBy = userId;
  await settings.save();
  return settings;
};

export const getEffectiveSettings = async (campusId) => {
  const campus = await Campus.findById(campusId);
  if (!campus) throw new Error("Campus not found");

  const instituteSettings = await getInstituteSettings(campus.instituteId);
  const campusSettings = await CampusSettings.findOne({ campusId });

  const effectiveSettings = {};
  const inheritance = {}; // Track where the setting came from

  const fields = Object.keys(DEFAULT_SETTINGS);
  fields.forEach((field) => {
    if (campusSettings && campusSettings[field] !== undefined && campusSettings[field] !== null) {
      effectiveSettings[field] = campusSettings[field];
      inheritance[field] = "campus";
    } else if (instituteSettings && instituteSettings[field] !== undefined && instituteSettings[field] !== null) {
      effectiveSettings[field] = instituteSettings[field];
      inheritance[field] = "institute";
    } else {
      effectiveSettings[field] = DEFAULT_SETTINGS[field];
      inheritance[field] = "default";
    }
  });

  return { effectiveSettings, inheritance };
};

export const resetCampusSettings = async (campusId) => {
  await CampusSettings.findOneAndDelete({ campusId });
  return { message: "Campus settings reset to institute defaults" };
};
