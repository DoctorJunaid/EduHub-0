/**
 * SaaS Subscription Plan Model
 * Defines tiered plans and operational quotas (campuses, students, staff).
 */
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: true,
      unique: true,
      enum: ["free", "pro", "enterprise"],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    priceMonthly: {
      type: Number,
      default: 0,
    },
    priceYearly: {
      type: Number,
      default: 0,
    },
    maxCampuses: {
      type: Number,
      default: 1, // Free: 1, Pro: 5, Enterprise: unlimited (9999)
    },
    maxStudents: {
      type: Number,
      default: 50, // Free: 50, Pro: 1000, Enterprise: unlimited (99999)
    },
    maxStaff: {
      type: Number,
      default: 10, // Free: 10, Pro: 100, Enterprise: unlimited (9999)
    },
    features: {
      type: [String],
      default: [],
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
    maxCampuses: 1,
    maxStudents: 50,
    maxStaff: 10,
    features: ["single_campus", "basic_attendance", "gradebook", "standard_support"],
  },
  {
    tier: "pro",
    name: "Pro Institution Plan",
    description: "Designed for established educational institutions with multiple branches.",
    priceMonthly: 99,
    priceYearly: 990,
    maxCampuses: 5,
    maxStudents: 1000,
    maxStaff: 100,
    features: ["multi_campus", "advanced_fees", "salary_payroll", "broadcast_alerts", "priority_support"],
  },
  {
    tier: "enterprise",
    name: "Enterprise Network Tier",
    description: "Uncapped scale, custom quotas, and dedicated account governance for large networks.",
    priceMonthly: 299,
    priceYearly: 2990,
    maxCampuses: 9999,
    maxStudents: 99999,
    maxStaff: 9999,
    features: ["unlimited_campuses", "unlimited_students", "custom_branding", "dedicated_support", "audit_compliance"],
  },
];

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plan;
