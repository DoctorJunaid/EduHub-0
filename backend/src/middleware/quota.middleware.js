/**
 * Multi-Tenant Quota & Subscription Enforcement Middleware
 * Protects against over-allocation of campus branches, students, and staff per plan tier.
 */
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
import Plan, { DEFAULT_PLANS } from "../models/plan.model.js";

// Fast in-memory plan cache fallback
const PLAN_LIMITS = {
  free: { maxCampuses: 1, maxStudents: 50, maxStaff: 10, name: "Free Tier" },
  pro: { maxCampuses: 5, maxStudents: 1000, maxStaff: 100, name: "Pro Plan" },
  enterprise: { maxCampuses: 9999, maxStudents: 99999, maxStaff: 9999, name: "Enterprise Tier" },
};

/**
 * Helper to resolve active institute plan limits
 */
const getInstitutePlan = async (instituteId) => {
  const institute = await Institute.findById(instituteId).populate("planId");
  if (!institute) return null;

  const tier = institute.planTier || "free";
  const planFromDb = institute.planId;

  return {
    tier,
    maxCampuses: planFromDb?.maxCampuses ?? PLAN_LIMITS[tier]?.maxCampuses ?? 1,
    maxStudents: planFromDb?.maxStudents ?? PLAN_LIMITS[tier]?.maxStudents ?? 50,
    maxStaff: planFromDb?.maxStaff ?? PLAN_LIMITS[tier]?.maxStaff ?? 10,
    name: planFromDb?.name ?? PLAN_LIMITS[tier]?.name ?? "Free Tier",
  };
};

/**
 * Enforce Campus branch limit before creating a new campus
 */
export const checkCampusQuota = async (req, res, next) => {
  try {
    // Super Admin can bypass quotas if needed
    if (req.user?.role === "super_admin") {
      return next();
    }

    const instituteId = req.instituteId || req.user?.instituteId;
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: "Institute context required for quota verification.",
      });
    }

    const plan = await getInstitutePlan(instituteId);
    if (!plan || plan.tier === "enterprise") {
      return next();
    }

    const currentCampuses = await Campus.countDocuments({ instituteId });

    if (currentCampuses >= plan.maxCampuses) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `Campus branch quota reached for your current plan (${plan.name} allows max ${plan.maxCampuses} campus). Please upgrade your subscription to add more campuses.`,
        data: {
          currentCount: currentCampuses,
          maxAllowed: plan.maxCampuses,
          tier: plan.tier,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Campus quota check error:", error);
    next(); // Fail open for resilience if quota check encounters internal error
  }
};

/**
 * Enforce Student enrollment limit before creating a new student
 */
export const checkStudentQuota = async (req, res, next) => {
  try {
    if (req.user?.role === "super_admin") {
      return next();
    }

    const instituteId = req.instituteId || req.user?.instituteId;
    if (!instituteId) {
      return res.status(400).json({
        success: false,
        message: "Institute context required for quota verification.",
      });
    }

    const plan = await getInstitutePlan(instituteId);
    if (!plan || plan.tier === "enterprise") {
      return next();
    }

    const currentStudents = await User.countDocuments({
      instituteId,
      role: "student",
    });

    if (currentStudents >= plan.maxStudents) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `Student enrollment quota reached for your current plan (${plan.name} allows max ${plan.maxStudents} students). Please upgrade your plan to enroll additional students.`,
        data: {
          currentCount: currentStudents,
          maxAllowed: plan.maxStudents,
          tier: plan.tier,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Student quota check error:", error);
    next();
  }
};

export default { checkCampusQuota, checkStudentQuota };
