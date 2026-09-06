import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    instituteName: {
      type: String,
      required: [true, "Institute name is required"],
      trim: true,
      maxlength: [150, "Institute name cannot exceed 150 characters"],
    },
    instituteType: {
      type: String,
      required: [true, "Institute type is required"],
      trim: true,
      enum: {
        values: ["School", "College", "University", "Academy", "Other"],
        message: "{VALUE} is not a valid institute type",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

// Be aware of that re-registering problem, in which the runtime register it once but registering it again creates a problem
// const Inquiry = mongoose.Model("Inquiry");
// Solution, Avoid Model Re-registering
const Inquiry =
  mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);

export default Inquiry;
