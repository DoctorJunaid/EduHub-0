/**
 * User Model
 * Represents all platform actors: super_admin, institute_admin, campus_admin, campus_manager, teacher, student.
 * Encapsulates password hashing and verification.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "institute_admin",
        "campus_admin",
        "campus_manager",
        "principal",
        "accountant",
        "teacher",
        "faculty",
        "student",
      ],
      default: "student",
      required: true,
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      required: function () {
        return this.role === "institute_admin";
      },
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
      required: function () {
        return (
          this.role === "campus_manager" ||
          this.role === "campus_admin" ||
          this.role === "principal" ||
          this.role === "accountant" ||
          this.role === "teacher" ||
          this.role === "faculty" ||
          this.role === "student"
        );
      },
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    program: {
      type: String,
      trim: true,
      default: "",
    },
    gradeOrClass: {
      type: String,
      trim: true,
      default: "",
    },
    admissionNo: {
      type: String,
      trim: true,
      default: "",
    },
    roll: {
      type: String,
      trim: true,
      default: "",
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    semester: {
      type: String,
      trim: true,
      default: "",
    },
    subjects: {
      type: String,
      trim: true,
      default: "",
    },
    qualification: {
      type: String,
      trim: true,
      default: "",
    },
    guardian: {
      type: String,
      trim: true,
      default: "",
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive", "Suspended", "Graduated", "On Leave"],
      default: "Active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash passwordHash before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== "string" || !this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;