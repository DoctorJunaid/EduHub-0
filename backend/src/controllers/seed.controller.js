import seedService from "../services/seed.service.js";

function getEffectiveCampusId(req) {
  return (
    req.body.campusId ||
    req.query.campusId ||
    req.user?.campusId?._id ||
    req.user?.campusId ||
    req.headers["x-campus-id"]
  );
}

export const clearTeachers = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const result = await seedService.clearTeachers(campusId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const clearStudents = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const result = await seedService.clearStudents(campusId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const clearAll = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const result = await seedService.clearTeachersAndStudents(campusId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const seedFullStructure = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const teachers = Number(req.body.teachers) || 60;
    const studentsPerClass = Number(req.body.studentsPerClass) || 30;

    const result = await seedService.seedFullStructure(
      campusId,
      { teachers, studentsPerClass },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message && error.message.includes("already running")) {
      return res.status(429).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const seedTeachers = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const count = Number(req.body.count) || 60;
    const clearFirst = req.body.clearFirst === true || req.body.clearFirst === "true";

    const result = await seedService.seedTeachers(
      campusId,
      { count, clearFirst },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const seedStudents = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const studentsPerClass = Number(req.body.studentsPerClass) || 30;
    const clearFirst = req.body.clearFirst === true || req.body.clearFirst === "true";

    const result = await seedService.seedStudents(
      campusId,
      { studentsPerClass, clearFirst },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const seedAttendance = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const days = Number(req.body.days) || 30;

    const result = await seedService.seedAttendance(campusId, { days });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const seedSubstitutes = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const days = Number(req.body.days) || 7;

    const result = await seedService.seedSubstitutes(campusId, { days });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetAll = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const teachers = Number(req.body.teachers) || 60;
    const studentsPerClass = Number(req.body.studentsPerClass) || 30;

    const result = await seedService.resetAll(
      campusId,
      { teachers, studentsPerClass },
      req.user
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message && error.message.includes("already running")) {
      return res.status(429).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const campusId = getEffectiveCampusId(req);
    if (!campusId) {
      return res.status(400).json({ success: false, message: "Campus ID is required" });
    }
    const stats = await seedService.getStats(campusId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export default {
  clearTeachers,
  clearStudents,
  clearAll,
  seedFullStructure,
  seedTeachers,
  seedStudents,
  seedAttendance,
  seedSubstitutes,
  resetAll,
  getStats,
};
