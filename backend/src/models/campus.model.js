/**
 * Campus Model
 * Represents an individual branch/campus belonging to an Institute.
 * Overseen by a Campus Manager and isolated by instituteId.
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

const campusSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: [true, "instituteId is required — campus must belong to an institute"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Campus name is required"],
      trim: true,
      maxlength: [150, "Campus name cannot exceed 150 characters"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Campus =
  mongoose.models.Campus || mongoose.model("Campus", campusSchema);

export default Campus;
