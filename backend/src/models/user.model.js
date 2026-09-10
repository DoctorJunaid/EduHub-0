import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please fill a valid email address"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["super_admin", "campus_admin", "student"],
      default: "student",
      required: true,
    },
    // Required dynamically when role is campus_admin
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
      required: function () {
        return this.role === "campus_admin";
      },
    },

    // Campus this user is assigned to (campus_admin & student)
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    // profile fields
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,20}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [150, "Bio cannot exceed 150 characters"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value) {
          // Ensure date is in the past
          return value < new Date();
        },
        message: "Date of birth must be in the past",
      }
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method for password verification
userSchema.methods.comparePassword = async function (password) {
  if (!password || typeof password !== "string" || !this.passwordHash) {
    return false;
  }
  return await bcrypt.compare(password, this.passwordHash);
};

// Prevent re-compilation of model during hot-reloads (Next.js / Express development)
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;