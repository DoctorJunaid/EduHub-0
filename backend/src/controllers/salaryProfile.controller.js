import * as salaryProfileService from '../services/salaryProfile.service.js';

const getCampusId = (req) => req.user?.campusId;

const handleControllerError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A salary profile already exists for this teacher profile.',
    });
  }
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error processing salary profile request',
  });
};

/**
 * GET /campus/salary/profiles
 */
export async function listProfiles(req, res) {
  try {
    const campusId = getCampusId(req);
    const result = await salaryProfileService.listProfiles(campusId, req.query);
    return res.status(200).json({
      success: true,
      message: 'Salary profiles retrieved successfully',
      data: result.records,
      count: result.total,
      summary: result.summary,
      pagination: {
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * GET /campus/salary/profiles/:teacherId
 */
export async function getProfile(req, res) {
  try {
    const campusId = getCampusId(req);
    const profile = await salaryProfileService.getProfileByTeacherId(
      campusId,
      req.params.teacherId
    );
    return res.status(200).json({
      success: true,
      message: 'Salary profile retrieved successfully',
      data: profile,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * PUT /campus/salary/profiles/:teacherId
 */
export async function upsertProfile(req, res) {
  try {
    const campusId = getCampusId(req);
    const userId = req.user._id;
    const result = await salaryProfileService.upsertProfile(
      campusId,
      req.params.teacherId,
      userId,
      req.body
    );
    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? 'Salary profile created successfully'
        : 'Salary profile updated successfully',
      data: result.profile,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * PATCH /campus/salary/profiles/:teacherId/deactivate
 */
export async function deactivateProfile(req, res) {
  try {
    const campusId = getCampusId(req);
    const profile = await salaryProfileService.deactivateProfile(
      campusId,
      req.params.teacherId
    );
    return res.status(200).json({
      success: true,
      message: 'Salary profile deactivated successfully',
      data: profile,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * PATCH /campus/salary/profiles/:teacherId/activate
 */
export async function activateProfile(req, res) {
  try {
    const campusId = getCampusId(req);
    const profile = await salaryProfileService.activateProfile(
      campusId,
      req.params.teacherId
    );
    return res.status(200).json({
      success: true,
      message: 'Salary profile activated successfully',
      data: profile,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * GET /campus/salary/profiles/teachers-without-profile
 */
export async function getTeachersWithoutProfile(req, res) {
  try {
    const campusId = getCampusId(req);
    const teachers = await salaryProfileService.getTeachersWithoutProfile(campusId);
    return res.status(200).json({
      success: true,
      message: 'Teachers without salary profile retrieved successfully',
      data: teachers,
      count: teachers.length,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

/**
 * GET /campus/salary/my-profile
 */
export async function getMyProfile(req, res) {
  try {
    const userId = req.user._id;
    const profile = await salaryProfileService.getMyProfile(userId);
    return res.status(200).json({
      success: true,
      message: 'Personal salary profile retrieved successfully',
      data: profile,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export default {
  listProfiles,
  getProfile,
  upsertProfile,
  deactivateProfile,
  activateProfile,
  getTeachersWithoutProfile,
  getMyProfile,
};
