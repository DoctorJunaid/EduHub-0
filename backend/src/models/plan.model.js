/**
 * SaaS Subscription Plan Model
 * Defines configurable tiered plans, operational quotas (campuses, students, staff),
 * and trial settings. Managed completely by Super Admin.
 */
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: [true, "Plan tier identifier is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    priceMonthly: {
      type: Number,
      default: 0,
      min: [0, "Monthly price cannot be negative"],
    },
    priceYearly: {
      type: Number,
      default: 0,
      min: [0, "Yearly price cannot be negative"],
    },
    currency: {
      type: String,
      default: "PKR",
      trim: true,
      uppercase: true,
    },
    maxCampuses: {
      type: Number,
      default: 1,
      min: [1, "At least 1 campus must be allowed"],
    },
    maxStudents: {
      type: Number,
      default: 50,
      min: [1, "At least 1 student must be allowed"],
    },
    maxStaff: {
      type: Number,
      default: 10,
      min: [1, "At least 1 staff member must be allowed"],
    },
    features: {
      type: [String],
      default: [],
    },
    trialDays: {
      type: Number,
      default: 0,
      min: [0, "Trial days cannot be negative"],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const DEFAULT_PLANS = [
  {
    tier: "free",
    name: "Free Community Tier",
    description: "Ideal for single-branch institutions, pilot programs, and small schools.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "PKR",
    maxCampuses: 1,
    maxStudents: 50,
    maxStaff: 10,
    features: [
      "single_campus",
      "multi_campus",
      "basic_attendance",
      "gradebook",
      "daily_diary",
      "advanced_fees",
      "salary_payroll",
      "broadcast_alerts",
      "standard_support",
    ],
    trialDays: 0,
    isPopular: false,
    isActive: true,
  },
  {
    tier: "pro",
    name: "Pro Institution Plan",
    description: "Designed for established educational institutions with multiple branches.",
    priceMonthly: 15000,
    priceYearly: 150000,
    currency: "PKR",
    maxCampuses: 5,
    maxStudents: 1000,
    maxStaff: 100,
    features: [
      "single_campus",
      "multi_campus",
      "basic_attendance",
      "gradebook",
      "daily_diary",
      "advanced_fees",
      "salary_payroll",
      "broadcast_alerts",
      "priority_support",
    ],
    trialDays: 14,
    isPopular: true,
    isActive: true,
  },
  {
    tier: "enterprise",
    name: "Enterprise Network Tier",
    description: "Uncapped scale, custom quotas, and dedicated account governance for large networks.",
    priceMonthly: 45000,
    priceYearly: 450000,
    currency: "PKR",
    maxCampuses: 9999,
    maxStudents: 99999,
    maxStaff: 9999,
    features: [
      "single_campus",
      "multi_campus",
      "basic_attendance",
      "gradebook",
      "daily_diary",
      "advanced_fees",
      "salary_payroll",
      "broadcast_alerts",
      "priority_support",
      "custom_branding",
      "audit_compliance",
    ],
    trialDays: 30,
    isPopular: false,
    isActive: true,
  },
];

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plan;
