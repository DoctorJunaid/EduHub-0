/**
 * Multi-Tenant Quota & Subscription Enforcement Middleware
 * Protects against over-allocation of campus branches, students, and staff per plan tier,
 * verifies active subscription status, and gates advanced features based on the institution's plan.
 */
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
import Plan, { DEFAULT_PLANS } from "../models/plan.model.js";

// Fast in-memory plan cache fallback
const PLAN_LIMITS = {
  free: { maxCampuses: 1, maxStudents: 50, maxStaff: 10, name: "Free Tier", features: ["single_campus", "basic_attendance", "gradebook", "daily_diary", "standard_support"] },
  pro: { maxCampuses: 5, maxStudents: 1000, maxStaff: 100, name: "Pro Plan", features: ["single_campus", "multi_campus", "basic_attendance", "gradebook", "daily_diary", "advanced_fees", "salary_payroll", "broadcast_alerts", "priority_support"] },
  enterprise: { maxCampuses: 9999, maxStudents: 99999, maxStaff: 9999, name: "Enterprise Tier", features: ["single_campus", "multi_campus", "basic_attendance", "gradebook", "daily_diary", "advanced_fees", "salary_payroll", "broadcast_alerts", "priority_support", "custom_branding", "audit_compliance"] },
};

/**
 * Resolves the calling user's institute and its active plan
 */
export const resolveInstituteAndPlan = async (req) => {
  let instituteId = req.instituteId || req.user?.instituteId;

  // If user belongs to a campus, derive institute from campus
  if (!instituteId && req.user?.campusId) {
    const campusId = typeof req.user.campusId === "object" ? req.user.campusId._id : req.user.campusId;
    const campus = await Campus.findById(campusId).select("instituteId");
    if (campus?.instituteId) {
      instituteId = campus.instituteId;
      req.instituteId = instituteId;
    }
  }

  if (!instituteId) return null;

  const institute = await Institute.findById(instituteId).populate("planId");
  if (!institute) return null;

  const tier = institute.planTier || "free";
  const planFromDb = institute.planId;

  const resolvedPlan = {
    id: planFromDb?._id,
    tier,
    name: planFromDb?.name ?? PLAN_LIMITS[tier]?.name ?? "Free Tier",
    maxCampuses: planFromDb?.maxCampuses ?? PLAN_LIMITS[tier]?.maxCampuses ?? 1,
    maxStudents: planFromDb?.maxStudents ?? PLAN_LIMITS[tier]?.maxStudents ?? 50,
    maxStaff: planFromDb?.maxStaff ?? PLAN_LIMITS[tier]?.maxStaff ?? 10,
    features: planFromDb?.features ?? PLAN_LIMITS[tier]?.features ?? [],
  };

  return { institute, plan: resolvedPlan };
};

/**
 * Check if the caller's institution has an active subscription
 */
export const checkActiveSubscription = async (req, res, next) => {
  try {
    if (req.user?.role === "super_admin") {
      return next();
    }

    const context = await resolveInstituteAndPlan(req);
    if (!context) {
      return next(); // If no institute context, proceed to next handler
    }

    const { institute } = context;
    const status = institute.subscriptionStatus || "Active";

    if (status === "Suspended" || status === "Canceled") {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: `Your institution's subscription is currently ${status}. System modifications are restricted. Please contact Super Admin.`,
      });
    }

    if (institute.subscriptionEndDate && new Date(institute.subscriptionEndDate) < new Date()) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message: "Your institution's subscription has expired. Please contact Super Admin to renew your plan.",
      });
    }

    next();
  } catch (error) {
    console.error("[SubscriptionCheck] Error:", error);
    next();
  }
};

/**
 * Enforce Campus branch limit before creating a new campus
 */
export const checkCampusQuota = async (req, res, next) => {
  try {
    if (req.user?.role === "super_admin") {
      return next();
    }

    const context = await resolveInstituteAndPlan(req);
    if (!context) {
      return res.status(400).json({
        success: false,
        message: "Institute context required for quota verification.",
      });
    }

    const { institute, plan } = context;
    if (plan.tier === "enterprise") {
      return next();
    }

    const currentCampuses = await Campus.countDocuments({ instituteId: institute._id });

    if (currentCampuses >= plan.maxCampuses) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `Campus branch quota reached for your current plan (${plan.name} allows max ${plan.maxCampuses} branch${plan.maxCampuses > 1 ? "es" : ""}). Please contact Super Admin to upgrade your plan.`,
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
    next();
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

    const context = await resolveInstituteAndPlan(req);
    if (!context) {
      return res.status(400).json({
        success: false,
        message: "Institute context required for quota verification.",
      });
    }

    const { institute, plan } = context;
    if (plan.tier === "enterprise") {
      return next();
    }

    const currentStudents = await User.countDocuments({
      instituteId: institute._id,
      role: "student",
    });

    if (currentStudents >= plan.maxStudents) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `Student enrollment quota reached for your current plan (${plan.name} allows max ${plan.maxStudents} students). Please contact Super Admin to upgrade your plan.`,
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

/**
 * Enforce Staff member limit before creating a new teacher/staff
 */
export const checkStaffQuota = async (req, res, next) => {
  try {
    if (req.user?.role === "super_admin") {
      return next();
    }

    const context = await resolveInstituteAndPlan(req);
    if (!context) {
      return res.status(400).json({
        success: false,
        message: "Institute context required for quota verification.",
      });
    }

    const { institute, plan } = context;
    if (plan.tier === "enterprise") {
      return next();
    }

    const currentStaff = await User.countDocuments({
      instituteId: institute._id,
      role: { $in: ["teacher", "staff", "campus_admin", "campus_manager"] },
    });

    if (currentStaff >= plan.maxStaff) {
      return res.status(403).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `Staff quota reached for your current plan (${plan.name} allows max ${plan.maxStaff} staff members). Please contact Super Admin to upgrade your plan.`,
        data: {
          currentCount: currentStaff,
          maxAllowed: plan.maxStaff,
          tier: plan.tier,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Staff quota check error:", error);
    next();
  }
};

/**
 * Higher-order middleware factory - feature locking is bypassed as per requirements.
 * All modules/features remain accessible across plans; tier differences are strictly count/quota based (students, staff, campuses).
 */
export const requireFeature = (featureKey) => {
  return (req, res, next) => {
    // Pass-through: No features are locked
    next();
  };
};

export default {
  resolveInstituteAndPlan,
  checkActiveSubscription,
  checkCampusQuota,
  checkStudentQuota,
  checkStaffQuota,
  requireFeature,
};
