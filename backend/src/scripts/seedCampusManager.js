import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const seedCampusManager = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Find or create an Institute
    let institute = await Institute.findOne({ name: "PakTech Nation" });
    if (!institute) {
      institute = await Institute.create({
        name: "PakTech Nation",
        type: "university",
        email: "contact@paktech.edu.pk",
        status: "Active"
      });
      console.log("Created Institute:", institute.name);
    } else {
      console.log("Found Institute:", institute.name);
    }

    // 2. Find or create a Campus
    let campus = await Campus.findOne({ name: "Islamabad Main Campus", instituteId: institute._id });
    if (!campus) {
      campus = await Campus.create({
        instituteId: institute._id,
        name: "Islamabad Main Campus",
        email: "campus.islamabad@paktech.edu.pk",
        phone: "+92 51 1234567",
        address: {
          street: "Sector H-12",
          city: "Islamabad",
          province: "Islamabad Capital Territory",
          postalCode: "44000",
          country: "Pakistan"
        },
        status: "Active"
      });
      console.log("Created Campus:", campus.name);
    } else {
      console.log("Found Campus:", campus.name);
    }

    // 3. Find or create the Campus Manager user
    const managerEmail = "manager@eduhub.com";
    let user = await User.findOne({ email: managerEmail });
    if (!user) {
      user = await User.create({
        name: "Campus Manager",
        email: managerEmail,
        passwordHash: "manager123", // Will be hashed by pre-save hook
        role: "campus_manager",
        instituteId: institute._id,
        campusId: campus._id,
        isActive: true
      });
      console.log(`Created Campus Manager: ${user.email} with password: manager123`);
    } else {
      // Update existing user just in case
      user.role = "campus_manager";
      user.instituteId = institute._id;
      user.campusId = campus._id;
      user.passwordHash = "manager123"; // Reset password to be sure
      await user.save();
      console.log(`Updated Campus Manager: ${user.email} with password: manager123`);
    }

    // 4. Link manager to campus
    if (campus.managerId?.toString() !== user._id.toString()) {
      campus.managerId = user._id;
      await campus.save();
      console.log("Linked Manager to Campus");
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedCampusManager();
