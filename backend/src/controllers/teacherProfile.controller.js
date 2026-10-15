/**
 * Teacher Profile Controller
 * Strictly delegates data queries to teacherProfile.service.js.
 * Handles role scoping and standard JSON response envelopes.
 */
import * as teacherProfileService from "../services/teacherProfile.service.js";

const getCampusId = (req) => {
  return (
    req.user?.campusId?._id ||
    req.user?.campusId ||
    req.user?.campus ||
    req.query?.campusId ||
    req.headers?.["x-campus-id"] ||
    null
  );
};

const resolveEffectiveTeacherId = (req) => {
  if (req.user?.role === "teacher" || req.user?.role === "faculty") {
    return req.user._id.toString();
  }
  if (req.params.teacherId === "me") {
    return req.user._id.toString();
  }
  return req.params.teacherId;
};

export const getTeacherProfile = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const data = await teacherProfileService.getTeacherFullProfile(campusId, teacherId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherClasses = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const result = await teacherProfileService.getTeacherClasses(campusId, teacherId);

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherTimetable = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const result = await teacherProfileService.getTeacherTimetable(campusId, teacherId, req.query);

    res.status(200).json({
      success: true,
      count: result.count ?? (result.data?.length || 0),
      data: result.data || result,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherAttendance = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const { days } = req.query;
    const data = await teacherProfileService.getTeacherAttendance(campusId, teacherId, days);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherPayroll = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const data = await teacherProfileService.getTeacherPayroll(campusId, teacherId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherSubstitutes = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const data = await teacherProfileService.getTeacherSubstitutes(campusId, teacherId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherActivity = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const teacherId = resolveEffectiveTeacherId(req);
    const data = await teacherProfileService.getTeacherActivity(campusId, teacherId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTeacherClass = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const { teacherId } = req.params;
    const assignment = await teacherProfileService.assignTeacherClass(
      campusId,
      teacherId,
      req.body,
      req.user?._id
    );

    res.status(201).json({
      success: true,
      message: "Class assigned successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const unassignTeacherClass = async (req, res, next) => {
  try {
    const campusId = getCampusId(req);
    const { teacherId, assignmentId } = req.params;
    const result = await teacherProfileService.unassignTeacherClass(
      campusId,
      teacherId,
      assignmentId,
      req.user?._id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
