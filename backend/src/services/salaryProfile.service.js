import { TeacherSalaryProfile } from '../models/teacherSalaryProfile.model.js';
import { TeacherProfile } from '../models/profile.model.js';
import User from '../models/user.model.js';

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const profilePopulation = {
  path: 'teacherProfileId',
  select: 'user employeeId department designation qualification hireDate isActive',
  populate: {
    path: 'user',
    select: 'name email campusId role department designation avatar',
  },
};

const cleanPayload = (payload = {}) => ({
  baseSalary: Number(payload.baseSalary),
  allowances: (payload.allowances || []).map((item) => ({
    name: String(item.name || '').trim(),
    amount: Number(item.amount || 0),
  })),
  taxDeduction: Number(payload.taxDeduction || 0),
  otherDeduction: Number(payload.otherDeduction || 0),
  bankAccount: {
    bankName: String(payload.bankAccount?.bankName || '').trim(),
    accountNumber: String(payload.bankAccount?.accountNumber || '').trim(),
    iban: String(payload.bankAccount?.iban || '').trim(),
  },
});

function validatePayload(payload) {
  if (!Number.isFinite(payload.baseSalary) || payload.baseSalary < 0) {
    throw createError('baseSalary is required and must be a non-negative number', 400);
  }
  for (const allowance of payload.allowances) {
    if (!allowance.name) {
      throw createError('Every allowance item requires a name', 400);
    }
    if (!Number.isFinite(allowance.amount) || allowance.amount < 0) {
      throw createError('Allowance amounts must be non-negative numbers', 400);
    }
  }
  if (!Number.isFinite(payload.taxDeduction) || payload.taxDeduction < 0) {
    throw createError('taxDeduction must be a non-negative number', 400);
  }
  if (!Number.isFinite(payload.otherDeduction) || payload.otherDeduction < 0) {
    throw createError('otherDeduction must be a non-negative number', 400);
  }
}

/**
 * List all salary profiles in the campus with filtering and pagination.
 */
export async function listProfiles(campusId, { search = '', department = '', isActive, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const query = {};
  if (campusId) query.campusId = campusId;

  if (isActive === 'true' || isActive === true) query.isActive = true;
  if (isActive === 'false' || isActive === false) query.isActive = false;

  const rawRecords = await TeacherSalaryProfile.find(query)
    .populate(profilePopulation)
    .sort({ updatedAt: -1 });

  let filtered = rawRecords;

  if (department) {
    filtered = filtered.filter(
      (r) => r.teacherProfileId?.department === department
    );
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filtered = filtered.filter(
      (r) =>
        searchRegex.test(r.teacherProfileId?.user?.name || '') ||
        searchRegex.test(r.teacherProfileId?.user?.email || '') ||
        searchRegex.test(r.teacherProfileId?.employeeId || '')
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice((safePage - 1) * safeLimit, safePage * safeLimit);

  return { records: paginated, total, page: safePage, limit: safeLimit };
}

/**
 * Get single profile by teacherProfileId.
 */
export async function getProfileByTeacherId(campusId, teacherId) {
  const query = { teacherProfileId: teacherId };
  if (campusId) query.campusId = campusId;

  const profile = await TeacherSalaryProfile.findOne(query).populate(profilePopulation);

  if (!profile) {
    throw createError('Salary profile not found for this teacher', 404);
  }

  return profile;
}

/**
 * Create or update a salary profile (Upsert).
 */
export async function upsertProfile(campusId, teacherId, userId, rawPayload) {
  let teacher = await TeacherProfile.findById(teacherId)
    .populate('user', 'campusId name email')
    .lean();

  if (!teacher) {
    const userDoc = await User.findById(teacherId).lean();
    if (userDoc) {
      const created = await TeacherProfile.create({
        user: userDoc._id,
        employeeId: userDoc.employeeId || `EMP-${String(userDoc._id).slice(-4).toUpperCase()}`,
        department: userDoc.department || 'General Faculty',
        qualification: 'Bachelor / Master',
        designation: userDoc.designation || 'Teacher',
      });
      teacher = await TeacherProfile.findById(created._id)
        .populate('user', 'campusId name email')
        .lean();
      teacherId = created._id;
    }
  }

  if (!teacher) {
    throw createError('Teacher profile not found', 404);
  }

  const payload = cleanPayload(rawPayload);
  validatePayload(payload);

  const existingProfile = await TeacherSalaryProfile.findOne({
    teacherProfileId: teacherId,
  }).lean();

  const targetCampusId = campusId || teacher.user?.campusId || teacher.campusId;

  const updateData = {
    ...payload,
    lastEditedBy: userId,
  };
  if (rawPayload.isActive !== undefined) {
    updateData.isActive = Boolean(rawPayload.isActive);
  }

  const profile = await TeacherSalaryProfile.findOneAndUpdate(
    { teacherProfileId: teacherId },
    {
      $set: { ...updateData, campusId: targetCampusId },
      $setOnInsert: { campusId: targetCampusId, teacherProfileId: teacherId },
    },
    { new: true, upsert: true, runValidators: true }
  ).populate(profilePopulation);

  return { profile, created: !existingProfile };
}

/**
 * Deactivate a salary profile.
 */
export async function deactivateProfile(campusId, teacherId) {
  const profile = await TeacherSalaryProfile.findOneAndUpdate(
    { teacherProfileId: teacherId },
    { $set: { isActive: false } },
    { new: true }
  ).populate(profilePopulation);

  if (!profile) {
    throw createError('Salary profile not found for this teacher', 404);
  }

  return profile;
}

/**
 * Activate a salary profile.
 */
export async function activateProfile(campusId, teacherId) {
  const profile = await TeacherSalaryProfile.findOneAndUpdate(
    { teacherProfileId: teacherId },
    { $set: { isActive: true } },
    { new: true }
  ).populate(profilePopulation);

  if (!profile) {
    throw createError('Salary profile not found for this teacher', 404);
  }

  return profile;
}

/**
 * Return list of TeacherProfile records in the campus that have NO salary profile.
 */
export async function getTeachersWithoutProfile(campusId) {
  // 1. Fetch all existing TeacherProfile documents
  const existingTeacherProfiles = await TeacherProfile.find()
    .populate('user', 'name email campusId department designation role')
    .lean();

  // 2. Fetch all User documents with teacher/faculty/principal role
  const teacherUsers = await User.find({
    role: { $in: ['teacher', 'faculty', 'principal', 'staff'] },
  })
    .select('_id name email campusId department designation role employeeId')
    .lean();

  const profileMap = new Map();

  // Add existing TeacherProfiles
  for (const tp of existingTeacherProfiles) {
    if (
      !campusId ||
      !tp.campusId ||
      String(tp.campusId) === String(campusId) ||
      (tp.user && String(tp.user.campusId) === String(campusId))
    ) {
      profileMap.set(String(tp._id), {
        _id: tp._id,
        employeeId: tp.employeeId || 'EMP',
        department: tp.department || tp.user?.department || 'General Faculty',
        designation: tp.designation || tp.user?.designation || 'Teacher',
        user: tp.user || { name: 'Teacher', email: '' },
      });
    }
  }

  // Add Users with teacher roles (creating TeacherProfile if missing)
  for (const u of teacherUsers) {
    if (!campusId || !u.campusId || String(u.campusId) === String(campusId)) {
      const existsInMap = Array.from(profileMap.values()).some(
        (tp) => String(tp.user?._id || tp.user) === String(u._id)
      );
      if (!existsInMap) {
        try {
          let existingTp = await TeacherProfile.findOne({ user: u._id }).lean();
          if (!existingTp) {
            const created = await TeacherProfile.create({
              user: u._id,
              employeeId: u.employeeId || `EMP-${String(u._id).slice(-4).toUpperCase()}`,
              department: u.department || 'General Faculty',
              qualification: 'Bachelor / Master',
              designation: u.designation || 'Teacher',
            });
            existingTp = await TeacherProfile.findById(created._id)
              .populate('user', 'name email campusId department designation')
              .lean();
          } else {
            existingTp = await TeacherProfile.findById(existingTp._id)
              .populate('user', 'name email campusId department designation')
              .lean();
          }
          if (existingTp) {
            profileMap.set(String(existingTp._id), existingTp);
          }
        } catch (err) {
          console.error('Teacher profile sync error:', err);
        }
      }
    }
  }

  const allCampusTeachers = Array.from(profileMap.values());

  // Distinct teacherProfileIds that already have salary profiles
  const existingSalaryProfiles = await TeacherSalaryProfile.find(
    campusId ? { campusId } : {}
  ).distinct('teacherProfileId');

  const linkedIds = new Set(existingSalaryProfiles.map((id) => String(id)));

  const unlinked = allCampusTeachers.filter((t) => !linkedIds.has(String(t._id)));

  // Return unlinked teachers or all teachers if all have profiles configured
  return unlinked.length > 0 ? unlinked : allCampusTeachers;
}

/**
 * Get teacher's own salary profile (for logged-in teacher user).
 */
export async function getMyProfile(userId) {
  let teacher = await TeacherProfile.findOne({ user: userId }).select('_id').lean();

  if (!teacher) {
    const userDoc = await User.findById(userId).lean();
    if (userDoc) {
      const created = await TeacherProfile.create({
        user: userDoc._id,
        employeeId: userDoc.employeeId || `EMP-${String(userDoc._id).slice(-4).toUpperCase()}`,
        department: userDoc.department || 'General Faculty',
        qualification: 'Bachelor / Master',
        designation: userDoc.designation || 'Teacher',
      });
      teacher = created;
    }
  }

  if (!teacher) {
    throw createError('Teacher profile not found for logged-in user', 404);
  }

  const profile = await TeacherSalaryProfile.findOne({
    teacherProfileId: teacher._id,
  }).populate(profilePopulation);

  if (!profile) {
    throw createError('No salary profile found for your account', 404);
  }

  return profile;
}

export default {
  listProfiles,
  getProfileByTeacherId,
  upsertProfile,
  deactivateProfile,
  activateProfile,
  getTeachersWithoutProfile,
  getMyProfile,
};
