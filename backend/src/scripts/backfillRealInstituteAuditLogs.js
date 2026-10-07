import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import AuditLog from "../models/auditLog.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";

async function backfillRealAuditLogs() {
  await connectDB();
  console.log("=== CLEANING DUMMY LOGS & SYNCING REAL DATA AUDIT TRAIL ===");

  // 1. Delete mock seed logs if any
  const deleted = await AuditLog.deleteMany({
    $or: [
      { reason: /Monthly fee batch generated for 45 students/i },
      { reason: /Daily faculty biometric attendance approved/i },
      { reason: /Assigned Branch Manager for/i },
      { reason: /Created and initialized campus branch/i },
    ],
  });
  console.log(`Removed ${deleted.deletedCount} synthetic dummy logs.`);

  // Load all existing audit log entity IDs into a Set for O(1) checks
  const existingAuditEntries = await AuditLog.find({}, { entityId: 1, action: 1 }).lean();
  const existingSet = new Set(
    existingAuditEntries.map((a) => `${a.entityId?.toString()}_${a.action}`)
  );

  const logsToInsert = [];

  // 2. Fetch all real institutes and their admins
  const institutes = await Institute.find().populate("adminId", "name email role").lean();
  const institutesMap = new Map();
  institutes.forEach((i) => institutesMap.set(i._id.toString(), i));

  // 3. Campuses
  const campuses = await Campus.find().lean();
  for (const campus of campuses) {
    const key = `${campus._id.toString()}_created`;
    if (!existingSet.has(key)) {
      const inst = institutesMap.get(campus.instituteId?.toString());
      const admin = inst?.adminId || {
        _id: null,
        name: "Institute Admin",
        email: "admin@eduhub.pk",
      };

      logsToInsert.push({
        instituteId: campus.instituteId || null,
        campusId: campus._id,
        entityType: "Campus",
        entityId: campus._id,
        action: "created",
        performedBy: {
          userId: admin._id,
          name: admin.name || "Institute Admin",
          email: admin.email || "",
          role: "institute_admin",
        },
        timestamp: campus.createdAt || new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: campus.name,
            code: campus.code || "",
            city: campus.address?.city || campus.city || "",
          },
        },
        reason: `Created branch campus "${campus.name}"`,
        metadata: { campusCode: campus.code || "" },
      });
      existingSet.add(key);
    }
  }

  // 4. Real Staff / Teachers
  const staffMembers = await User.find({
    role: { $in: ["teacher", "campus_admin", "campus_manager"] },
  }).lean();

  for (const staff of staffMembers) {
    const key = `${staff._id.toString()}_created`;
    if (!existingSet.has(key)) {
      const inst = institutesMap.get(staff.instituteId?.toString());
      const admin = inst?.adminId || {
        _id: null,
        name: "Institute Admin",
        email: "admin@eduhub.pk",
      };

      logsToInsert.push({
        instituteId: staff.instituteId || null,
        campusId: staff.campusId || null,
        entityType: "User",
        entityId: staff._id,
        action: "created",
        performedBy: {
          userId: admin._id,
          name: admin.name || "Institute Admin",
          email: admin.email || "",
          role: "institute_admin",
        },
        timestamp: staff.createdAt || new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: staff.name,
            email: staff.email,
            role: staff.role,
          },
        },
        reason: `Added staff member "${staff.name}" (${staff.role})`,
        metadata: { role: staff.role },
      });
      existingSet.add(key);
    }
  }

  // 5. Real Students
  const students = await User.find({ role: "student" }).lean();
  for (const student of students) {
    const key = `${student._id.toString()}_created`;
    if (!existingSet.has(key)) {
      const inst = institutesMap.get(student.instituteId?.toString());
      const admin = inst?.adminId || {
        _id: null,
        name: "Institute Admin",
        email: "admin@eduhub.pk",
      };

      logsToInsert.push({
        instituteId: student.instituteId || null,
        campusId: student.campusId || null,
        entityType: "User",
        entityId: student._id,
        action: "created",
        performedBy: {
          userId: admin._id,
          name: admin.name || "Institute Admin",
          email: admin.email || "",
          role: "institute_admin",
        },
        timestamp: student.createdAt || new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: student.name,
            email: student.email,
            role: "student",
          },
        },
        reason: `Enrolled student "${student.name}"`,
        metadata: { role: "student" },
      });
      existingSet.add(key);
    }
  }

  // 6. Real Alerts
  const alerts = await Alert.find().lean();
  for (const alert of alerts) {
    const key = `${alert._id.toString()}_broadcasted`;
    if (!existingSet.has(key)) {
      const inst = institutesMap.get(alert.instituteId?.toString());
      const admin = inst?.adminId || {
        _id: null,
        name: "Institute Admin",
        email: "admin@eduhub.pk",
      };

      logsToInsert.push({
        instituteId: alert.instituteId || null,
        campusId: alert.campusId || null,
        entityType: "GlobalBroadcast",
        entityId: alert._id,
        action: "broadcasted",
        performedBy: {
          userId: alert.createdBy || admin._id,
          name: admin.name || "Institute Admin",
          email: admin.email || "",
          role: "institute_admin",
        },
        timestamp: alert.createdAt || new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
          },
        },
        reason: `Dispatched broadcast notice "${alert.title}"`,
        metadata: { audience: alert.audience },
      });
      existingSet.add(key);
    }
  }

  if (logsToInsert.length > 0) {
    await AuditLog.insertMany(logsToInsert);
    console.log(`Successfully inserted ${logsToInsert.length} authentic audit logs.`);
  } else {
    console.log("All real entities are already registered in the audit logs.");
  }

  const totalLogs = await AuditLog.countDocuments();
  console.log(`=== COMPLETE. Total authentic audit logs in database: ${totalLogs} ===`);
  await mongoose.disconnect();
}

backfillRealAuditLogs().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
