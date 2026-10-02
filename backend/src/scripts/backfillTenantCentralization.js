/**
 * Database Migration Script: Backfill Tenant Centralization
 * Populates instituteId on any existing documents across operational models that only have campusId.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Campus from "../models/campus.model.js";
import MonthlyPayroll from "../models/monthlyPayroll.model.js";
import TeacherAttendance from "../models/teacherAttendance.model.js";
import TeacherSalaryProfile from "../models/teacherSalaryProfile.model.js";
import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runBackfill() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB!");

    // Cache campus -> institute map
    const campuses = await Campus.find().select("_id instituteId").lean();
    console.log(`Found ${campuses.length} campuses.`);
    
    let totalUpdated = 0;

    for (const campus of campuses) {
      if (!campus.instituteId) continue;

      // 1. Backfill MonthlyPayroll
      const payrollRes = await MonthlyPayroll.updateMany(
        { campusId: campus._id, instituteId: null },
        { $set: { instituteId: campus.instituteId } }
      );
      if (payrollRes.modifiedCount > 0) {
        console.log(`Updated ${payrollRes.modifiedCount} MonthlyPayroll records for campus ${campus._id}`);
        totalUpdated += payrollRes.modifiedCount;
      }

      // 2. Backfill TeacherAttendance
      const attRes = await TeacherAttendance.updateMany(
        { campusId: campus._id, instituteId: null },
        { $set: { instituteId: campus.instituteId } }
      );
      if (attRes.modifiedCount > 0) {
        console.log(`Updated ${attRes.modifiedCount} TeacherAttendance records for campus ${campus._id}`);
        totalUpdated += attRes.modifiedCount;
      }

      // 3. Backfill TeacherSalaryProfile
      const salRes = await TeacherSalaryProfile.updateMany(
        { campusId: campus._id, instituteId: null },
        { $set: { instituteId: campus.instituteId } }
      );
      if (salRes.modifiedCount > 0) {
        console.log(`Updated ${salRes.modifiedCount} TeacherSalaryProfile records for campus ${campus._id}`);
        totalUpdated += salRes.modifiedCount;
      }

      // 4. Backfill Users
      const userRes = await User.updateMany(
        { campusId: campus._id, instituteId: null },
        { $set: { instituteId: campus.instituteId } }
      );
      if (userRes.modifiedCount > 0) {
        console.log(`Updated ${userRes.modifiedCount} User records for campus ${campus._id}`);
        totalUpdated += userRes.modifiedCount;
      }
    }

    console.log(`Tenant Centralization Migration completed. Total records updated: ${totalUpdated}`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

runBackfill();
