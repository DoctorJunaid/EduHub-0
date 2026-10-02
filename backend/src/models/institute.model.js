/**
 * Institute Model
 * Represents educational institutions (schools, colleges, universities, or networks).
 * Managed directly by Super Admin and assigned an Institute Admin.
 */
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "Pakistan" },
  },
  { _id: false }
);

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institute name is required"],
      unique: true,
      trim: true,
      maxlength: [150, "Institute name cannot exceed 150 characters"],
    },
    board: {
      type: String,
      required: [true, "Board affiliation is required (e.g. Federal, Punjab Board, HEC)"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Institute type is required"],
      enum: ["School", "College", "University", "Institute"],
    },
    email: {
      type: String,
      required: [true, "Institute email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid institute email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Institute phone is required"],
      trim: true,
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive", "Suspended"],
      default: "Pending",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    planTier: {
      type: String,
      default: "free",
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["Active", "Trial", "Past Due", "Canceled", "Suspended", "Expired"],
      default: "Active",
    },
    subscriptionBillingCycle: {
      type: String,
      enum: ["monthly", "yearly", "custom", "lifetime"],
      default: "yearly",
    },
    subscriptionStartDate: {
      type: Date,
      default: Date.now,
    },
    subscriptionEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from creation
    },
    subscriptionHistory: [
      {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
        planName: { type: String, default: "" },
        planTier: { type: String, default: "" },
        billingCycle: { type: String, default: "yearly" },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        status: { type: String, default: "Active" },
        action: { type: String, default: "Assigned" }, // "Assigned", "Changed", "Extended", "Suspended", "Activated", "Cancelled"
        note: { type: String, default: "" },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Institute =
  mongoose.models.Institute || mongoose.model("Institute", instituteSchema);

export default Institute;
