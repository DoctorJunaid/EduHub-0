import mongoose from "mongoose";

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institute name is required"],
      trim: true,
      unique: true,
      maxlength: [150, "Institute name cannot exceed 150 characters"],
    },
    type: {
      type: String,
      required: [true, "Institute type is required"],
      enum: ["School", "College", "University", "Coaching / Academy", "Other"],
    },
    email: {
      type: String,
      required: [true, "Institute contact email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Institute contact phone is required"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Institute =
  mongoose.models.Institute || mongoose.model("Institute", instituteSchema);

export default Institute;
