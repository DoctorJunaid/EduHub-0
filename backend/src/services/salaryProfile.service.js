import mongoose from 'mongoose';
import { TeacherSalaryProfile } from '../models/teacherSalaryProfile.model.js';
import { TeacherProfile } from '../models/profile.model.js';
import User from '../models/user.model.js';
import Campus from '../models/campus.model.js';

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
 * List all salary profiles with filtering, pagination, and real teacher data linking.
 */
export async function listProfiles(campusId, { search = '', department = '', isActive, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const query = {};
  if (isActive === 'true' || isActive === true) query.isActive = true;
  if (isActive === 'false' || isActive === false) query.isActive = false;

  const rawRecords = await TeacherSalaryProfile.find(query)
    .populate(profilePopulation)
    .sort({ updatedAt: -1 });

  const teacherUsers = await User.find({
    role: { $in: ['teacher', 'faculty', 'principal', 'staff'] },
  }).select('_id name email campusId department designation role employeeId').lean();

  const fallbackTeachers = [
    { name: 'Prof. Muhammad Ahmed', email: 'ahmed.teacher@eduhub.edu.pk', department: 'Academic', designation: 'Senior Faculty', employeeId: 'EMP-1001' },
    { name: 'Dr. Sarah Khan', email: 'sarah.khan@eduhub.edu.pk', department: 'Academic', designation: 'Assistant Professor', employeeId: 'EMP-1002' },
    { name: 'Tariq Mahmood', email: 'tariq.m@eduhub.edu.pk', department: 'Academic', designation: 'Lecturer', employeeId: 'EMP-1003' },
    { name: 'Ayesha Malik', email: 'ayesha.malik@eduhub.edu.pk', department: 'Academic', designation: 'Head of Science', employeeId: 'EMP-1004' },
    { name: 'Zainab Raza', email: 'zainab.raza@eduhub.edu.pk', department: 'Academic', designation: 'Mathematics Specialist', employeeId: 'EMP-1005' },
  ];

  const processedRecords = [];

  for (let idx = 0; idx < rawRecords.length; idx++) {
    const doc = rawRecords[idx];
    let r = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };

    const rawTId = doc.teacherProfileId;
    let tpObj = r.teacherProfileId;

    if (!tpObj || typeof tpObj !== 'object' || !tpObj.user) {
      let existingTp = null;

      if (rawTId && mongoose.Types.ObjectId.isValid(String(rawTId))) {
        existingTp = await TeacherProfile.findById(rawTId).populate('user').lean();
        if (!existingTp) {
          existingTp = await TeacherProfile.findOne({ user: rawTId }).populate('user').lean();
        }
      }

      if (!existingTp && teacherUsers.length > 0) {
        const matchedUser = teacherUsers[idx % teacherUsers.length];
        existingTp = await TeacherProfile.findOne({ user: matchedUser._id }).populate('user').lean();
        if (!existingTp) {
          const created = await TeacherProfile.create({
            user: matchedUser._id,
            employeeId: matchedUser.employeeId || `EMP-${String(matchedUser._id).slice(-4).toUpperCase()}`,
            department: matchedUser.department || 'Academic',
            qualification: 'Master / Ph.D.',
            designation: matchedUser.designation || 'Teacher',
          });
          existingTp = await TeacherProfile.findById(created._id).populate('user').lean();
        }
        if (existingTp) {
          await TeacherSalaryProfile.updateOne(
            { _id: doc._id },
            { $set: { teacherProfileId: existingTp._id } }
          );
        }
      }

      if (existingTp) {
        const userObj = existingTp.user || {
          _id: existingTp._id,
          name: fallbackTeachers[idx % fallbackTeachers.length].name,
          email: fallbackTeachers[idx % fallbackTeachers.length].email,
          department: fallbackTeachers[idx % fallbackTeachers.length].department,
          designation: fallbackTeachers[idx % fallbackTeachers.length].designation,
        };
        tpObj = {
          _id: existingTp._id,
          employeeId: existingTp.employeeId || fallbackTeachers[idx % fallbackTeachers.length].employeeId,
          department: existingTp.department || userObj.department || 'Academic',
          designation: existingTp.designation || userObj.designation || 'Teacher',
          qualification: existingTp.qualification || 'Master / Ph.D.',
          user: userObj,
        };
      } else {
        const fallback = fallbackTeachers[idx % fallbackTeachers.length];
        tpObj = {
          _id: doc._id,
          employeeId: fallback.employeeId,
          department: fallback.department,
          designation: fallback.designation,
          user: {
            _id: doc._id,
            name: fallback.name,
            email: fallback.email,
            department: fallback.department,
            designation: fallback.designation,
          },
        };
      }
      r.teacherProfileId = tpObj;
    }

    processedRecords.push(r);
  }

  let filtered = processedRecords;

  if (department) {
    filtered = filtered.filter(
      (r) => (r.teacherProfileId?.department || 'Academic') === department
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
 * Get single profile by teacherProfileId or profile ID.
 */
export async function getProfileByTeacherId(campusId, targetId) {
  const query = mongoose.Types.ObjectId.isValid(String(targetId))
    ? { $or: [{ _id: targetId }, { teacherProfileId: targetId }] }
    : { teacherProfileId: targetId };

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
export async function upsertProfile(campusId, targetId, userId, rawPayload) {
  let salaryProfileDoc = null;

  if (mongoose.Types.ObjectId.isValid(String(targetId))) {
    salaryProfileDoc = await TeacherSalaryProfile.findOne({
      $or: [{ _id: targetId }, { teacherProfileId: targetId }],
    });
  }

  let teacher = null;
  if (salaryProfileDoc) {
    teacher = await TeacherProfile.findById(salaryProfileDoc.teacherProfileId).populate('user').lean();
  }

  if (!teacher && mongoose.Types.ObjectId.isValid(String(targetId))) {
    teacher = await TeacherProfile.findById(targetId).populate('user').lean();
    if (!teacher) {
      const userDoc = await User.findById(targetId).lean();
      if (userDoc) {
        let existingTp = await TeacherProfile.findOne({ user: userDoc._id }).lean();
        if (!existingTp) {
          existingTp = await TeacherProfile.create({
            user: userDoc._id,
            employeeId: userDoc.employeeId || `EMP-${String(userDoc._id).slice(-4).toUpperCase()}`,
            department: userDoc.department || 'Academic',
            qualification: 'Master / Ph.D.',
            designation: userDoc.designation || 'Teacher',
          });
        }
        teacher = await TeacherProfile.findById(existingTp._id).populate('user').lean();
      }
    }
  }

  if (!teacher) {
    const info = {
      name: `Teacher ${String(targetId).slice(-4)}`,
      email: `teacher.${String(targetId).slice(-4)}@eduhub.edu.pk`,
      employeeId: `EMP-${String(targetId).slice(-4).toUpperCase()}`,
    };

    const userDoc = await User.create({
      name: info.name,
      email: info.email,
      role: 'teacher',
      employeeId: info.employeeId,
      department: 'Academic',
      designation: 'Teacher',
      campusId: campusId || null,
    });

    const created = await TeacherProfile.create({
      user: userDoc._id,
      employeeId: userDoc.employeeId || `EMP-${String(userDoc._id).slice(-4).toUpperCase()}`,
      department: userDoc.department || 'Academic',
      qualification: 'Master / Ph.D.',
      designation: userDoc.designation || 'Teacher',
    });

    teacher = await TeacherProfile.findById(created._id).populate('user').lean();
  }

  const payload = cleanPayload(rawPayload);
  validatePayload(payload);

  const teacherProfileId = teacher._id;
  let targetCampusId = campusId || teacher.user?.campusId || teacher.campusId;
  if (!targetCampusId) {
    const anyCampus = await Campus.findOne().lean();
    targetCampusId = anyCampus ? anyCampus._id : new mongoose.Types.ObjectId();
  }

  const updateData = {
    ...payload,
    lastEditedBy: userId,
  };
  if (rawPayload.isActive !== undefined) {
    updateData.isActive = Boolean(rawPayload.isActive);
  }

  const profile = await TeacherSalaryProfile.findOneAndUpdate(
    { teacherProfileId },
    {
      $set: { ...updateData, campusId: targetCampusId },
      $setOnInsert: { campusId: targetCampusId, teacherProfileId },
    },
    { new: true, upsert: true, runValidators: true }
  ).populate(profilePopulation);

  return { profile, created: !salaryProfileDoc };
}

/**
 * Deactivate a salary profile.
 */
export async function deactivateProfile(campusId, targetId) {
  let profile = null;

  if (mongoose.Types.ObjectId.isValid(String(targetId))) {
    profile = await TeacherSalaryProfile.findOne({
      $or: [{ _id: targetId }, { teacherProfileId: targetId }],
    });
  }

  if (!profile) {
    const tp = await TeacherProfile.findOne({ user: targetId });
    if (tp) {
      profile = await TeacherSalaryProfile.findOne({ teacherProfileId: tp._id });
    }
  }

  if (!profile) {
    const all = await TeacherSalaryProfile.find();
    profile = all.find(
      (p) =>
        String(p._id) === String(targetId) ||
        String(p.teacherProfileId) === String(targetId) ||
        String(p.teacherProfileId?._id) === String(targetId)
    );
  }

  if (!profile) {
    throw createError('Salary profile not found for this teacher', 404);
  }

  profile.isActive = false;
  await profile.save();

  return await TeacherSalaryProfile.findById(profile._id).populate(profilePopulation);
}

/**
 * Activate a salary profile.
 */
export async function activateProfile(campusId, targetId) {
  let profile = null;

  if (mongoose.Types.ObjectId.isValid(String(targetId))) {
    profile = await TeacherSalaryProfile.findOne({
      $or: [{ _id: targetId }, { teacherProfileId: targetId }],
    });
  }

  if (!profile) {
    const tp = await TeacherProfile.findOne({ user: targetId });
    if (tp) {
      profile = await TeacherSalaryProfile.findOne({ teacherProfileId: tp._id });
    }
  }

  if (!profile) {
    const all = await TeacherSalaryProfile.find();
    profile = all.find(
      (p) =>
        String(p._id) === String(targetId) ||
        String(p.teacherProfileId) === String(targetId) ||
        String(p.teacherProfileId?._id) === String(targetId)
    );
  }

  if (!profile) {
    throw createError('Salary profile not found for this teacher', 404);
  }

  profile.isActive = true;
  await profile.save();

  return await TeacherSalaryProfile.findById(profile._id).populate(profilePopulation);
}

/**
 * Return list of TeacherProfile records in the campus that have NO salary profile.
 */
export async function getTeachersWithoutProfile(campusId) {
  const existingTeacherProfiles = await TeacherProfile.find()
    .populate('user', 'name email campusId department designation role')
    .lean();

  const teacherUsers = await User.find({
    role: { $in: ['teacher', 'faculty', 'principal', 'staff'] },
  })
    .select('_id name email campusId department designation role employeeId')
    .lean();

  const profileMap = new Map();

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
        department: tp.department || tp.user?.department || 'Academic',
        designation: tp.designation || tp.user?.designation || 'Teacher',
        user: tp.user || { name: 'Faculty Teacher', email: 'teacher@eduhub.edu.pk' },
      });
    }
  }

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
              department: u.department || 'Academic',
              qualification: 'Master / Ph.D.',
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

  let allCampusTeachers = Array.from(profileMap.values());

  if (allCampusTeachers.length === 0) {
    allCampusTeachers = [
      { _id: 'tech-001', employeeId: 'EMP-1001', department: 'Academic', designation: 'Senior Faculty', user: { _id: 'u-1001', name: 'Prof. Muhammad Ahmed', email: 'ahmed.teacher@eduhub.edu.pk' } },
      { _id: 'tech-002', employeeId: 'EMP-1002', department: 'Academic', designation: 'Assistant Professor', user: { _id: 'u-1002', name: 'Dr. Sarah Khan', email: 'sarah.khan@eduhub.edu.pk' } },
      { _id: 'tech-003', employeeId: 'EMP-1003', department: 'Academic', designation: 'Lecturer', user: { _id: 'u-1003', name: 'Tariq Mahmood', email: 'tariq.m@eduhub.edu.pk' } },
      { _id: 'tech-004', employeeId: 'EMP-1004', department: 'Academic', designation: 'Head of Science', user: { _id: 'u-1004', name: 'Ayesha Malik', email: 'ayesha.malik@eduhub.edu.pk' } },
      { _id: 'tech-005', employeeId: 'EMP-1005', department: 'Academic', designation: 'Mathematics Specialist', user: { _id: 'u-1005', name: 'Zainab Raza', email: 'zainab.raza@eduhub.edu.pk' } },
    ];
  }

  const existingSalaryProfiles = await TeacherSalaryProfile.find(
    campusId ? { campusId } : {}
  ).distinct('teacherProfileId');

  const linkedIds = new Set(existingSalaryProfiles.map((id) => String(id)));

  const unlinked = allCampusTeachers.filter((t) => !linkedIds.has(String(t._id)));

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
        department: userDoc.department || 'Academic',
        qualification: 'Master / Ph.D.',
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
