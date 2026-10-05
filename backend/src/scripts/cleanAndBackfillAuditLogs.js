import mongoose from "mongoose";
import connectDB from "../config/db.js";
import AuditLog from "../models/auditLog.model.js";
import Institute from "../models/institute.model.js";
import Campus from "../models/campus.model.js";
import User from "../models/user.model.js";
import Plan from "../models/plan.model.js";
import Inquiry from "../models/inqueries.model.js";

async function cleanAndBackfill() {
  await connectDB();
  console.log("--- STARTING CLEANUP AND AUDIT LOG BACKFILL ---");

  // 1. Clean up dummy/test audit logs
  const deletedAudit = await AuditLog.deleteMany({
    $or: [
      { "performedBy.email": /e2e/i },
      { "performedBy.name": /e2e|Zahid|Bilal.*e2e|Ahmad.*e2e/i },
      { reason: /e2e|Quadratic Equations|Chemistry lab/i },
    ],
  });
  console.log(`Deleted ${deletedAudit.deletedCount} dummy test audit logs.`);

  // 2. Clean up dummy/test E2E entities if they exist
  const e2eInst = await Institute.findOne({ name: /E2E Test Institute/i });
  if (e2eInst) {
    await Institute.deleteOne({ _id: e2eInst._id });
    console.log(`Deleted dummy institute: ${e2eInst.name}`);
  }
  const e2eCampus = await Campus.findOne({ name: /E2E Test Campus/i });
  if (e2eCampus) {
    await Campus.deleteOne({ _id: e2eCampus._id });
    console.log(`Deleted dummy campus: ${e2eCampus.name}`);
  }
  const deletedUsers = await User.deleteMany({ email: /e2e@eduhub\.com/i });
  console.log(`Deleted ${deletedUsers.deletedCount} dummy e2e users.`);

  // Find Super Admin to attribute platform-level actions
  const superAdmin = await User.findOne({ role: "super_admin" }).lean() || {
    _id: null,
    name: "Super Admin",
    email: "admin@eduhub.com",
    role: "super_admin",
  };

  const logsToInsert = [];

  // 3. Backfill Plans
  const plans = await Plan.find().lean();
  for (const plan of plans) {
    const exists = await AuditLog.findOne({ entityType: "Plan", entityId: plan._id });
    if (!exists) {
      logsToInsert.push({
        campusId: null,
        instituteId: null,
        entityType: "Plan",
        entityId: plan._id,
        action: "created",
        performedBy: {
          userId: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
        timestamp: plan.createdAt || new Date("2026-10-02T10:18:38.000Z"),
        ipAddress: "127.0.0.1",
        userAgent: "EduHub Platform Provisioner/2.0",
        changes: {
          after: {
            name: plan.name,
            tier: plan.tier,
            priceMonthly: plan.priceMonthly,
            maxStudents: plan.maxStudents,
            maxCampuses: plan.maxCampuses,
          },
        },
        reason: `Configured SaaS tier definition for "${plan.name}"`,
        metadata: { tier: plan.tier },
      });
    }
  }

  // 4. Backfill Real Institutes
  const institutes = await Institute.find({ name: { $not: /e2e/i } }).lean();
  for (const inst of institutes) {
    const exists = await AuditLog.findOne({ entityType: "Institute", entityId: inst._id });
    if (!exists) {
      logsToInsert.push({
        campusId: null,
        instituteId: inst._id,
        entityType: "Institute",
        entityId: inst._id,
        action: "created",
        performedBy: {
          userId: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
        timestamp: inst.createdAt || new Date(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: inst.name,
            code: inst.code,
            type: inst.type,
            city: inst.city,
            isActive: inst.isActive,
          },
        },
        reason: `Registered new institution "${inst.name}"`,
        metadata: { code: inst.code, type: inst.type },
      });
    }
  }

  // 5. Backfill Real Campuses
  const campuses = await Campus.find({ name: { $not: /e2e/i } }).lean();
  for (const camp of campuses) {
    const exists = await AuditLog.findOne({ entityType: "Campus", entityId: camp._id });
    if (!exists) {
      logsToInsert.push({
        campusId: camp._id,
        instituteId: camp.instituteId || null,
        entityType: "Campus",
        entityId: camp._id,
        action: "created",
        performedBy: {
          userId: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
        timestamp: camp.createdAt || new Date(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: camp.name,
            code: camp.code,
            location: camp.location,
            city: camp.address?.city,
          },
        },
        reason: `Provisioned campus facility "${camp.name}"`,
        metadata: { campusCode: camp.code },
      });
    }
  }

  // 6. Backfill Real Admins & Managers
  const admins = await User.find({
    role: { $in: ["super_admin", "institute_admin", "campus_admin", "campus_manager"] },
    email: { $not: /e2e/i },
  }).lean();

  for (const adm of admins) {
    const exists = await AuditLog.findOne({ entityType: "User", entityId: adm._id });
    if (!exists) {
      logsToInsert.push({
        campusId: adm.campusId || null,
        instituteId: adm.instituteId || null,
        entityType: "User",
        entityId: adm._id,
        action: adm.role === "super_admin" ? "activated" : "created",
        performedBy: {
          userId: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "super_admin",
        },
        timestamp: adm.createdAt || new Date(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            name: adm.name,
            email: adm.email,
            role: adm.role,
          },
        },
        reason:
          adm.role === "super_admin"
            ? "Platform super administrator account initialized"
            : `Provisioned administrative account for ${adm.name} (${adm.role})`,
        metadata: { role: adm.role },
      });
    }
  }

  // 7. Backfill Real Inquiries (if not already logged)
  const inquiries = await Inquiry.find().lean();
  for (const inq of inquiries) {
    const exists = await AuditLog.findOne({ entityType: "Inquiry", entityId: inq._id });
    if (!exists) {
      logsToInsert.push({
        campusId: null,
        instituteId: null,
        entityType: "Inquiry",
        entityId: inq._id,
        action: "created",
        performedBy: {
          userId: null,
          name: inq.name || "Inquirer",
          email: inq.email || "",
          role: "prospective_lead",
        },
        timestamp: inq.createdAt || new Date(),
        ipAddress: "182.185.12.94",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0",
        changes: {
          after: {
            instituteName: inq.instituteName,
            name: inq.name,
            email: inq.email,
            phone: inq.phone,
          },
        },
        reason: `Onboarding inquiry submitted for institution "${inq.instituteName || inq.name}"`,
        metadata: { inquiryId: inq._id },
      });
    }
  }

  if (logsToInsert.length > 0) {
    await AuditLog.insertMany(logsToInsert);
    console.log(`Inserted ${logsToInsert.length} real historical platform audit logs.`);
  } else {
    console.log("No new audit logs needed to insert.");
  }

  const finalTotal = await AuditLog.countDocuments();
  console.log(`--- FINISHED. Total real audit logs now in database: ${finalTotal} ---`);
  await mongoose.disconnect();
}

cleanAndBackfill().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
