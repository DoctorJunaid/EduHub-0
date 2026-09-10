import mongoose from "mongoose";

/**
 * Campus Model
 *
 * A Campus belongs to an Institute. Campus Admins are assigned to a campus,
 * and Students are enrolled in a campus within that institute.
 */
const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campus name is required"],
      trim: true,
      maxlength: [150, "Campus name cannot exceed 150 characters"],
    },

    // Parent institute this campus belongs to
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: [true, "instituteId is required — a campus must belong to an institute"],
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Please enter a valid phone number"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Campus =
  mongoose.models.Campus || mongoose.model("Campus", campusSchema);

export default Campus;
