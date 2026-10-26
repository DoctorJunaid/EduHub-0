import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import { StudentAttendance } from "../models/profile.model.js";
import Campus from "../models/campus.model.js";
import {
  createStudentQrPayload,
  generateStudentSignature,
  resolveStudentFromPayload,
  parseQrPayload,
} from "../utils/qrAttendance.js";
import {
  processQrAttendanceScan,
  getAttendanceSystemDiagnostics,
} from "../services/qrAttendance.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTests() {
  console.log("=================================================");
  console.log("STARTING FULL END-TO-END QR ATTENDANCE VERIFICATION");
  console.log("=================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduhub";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully.\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Pick a test campus and sample student
    const sampleStudent = await Student.findOne({ rollNo: { $exists: true, $ne: "" } }).populate("userId");
    if (!sampleStudent) {
      throw new Error("No students found in database for testing.");
    }

    const campusId = sampleStudent.campusId;
    const testDate = "2026-10-24";
    const testStaffUser = {
      _id: new mongoose.Types.ObjectId(),
      role: "campus_admin",
      campusId: campusId,
      name: "Test Admin",
    };

    console.log(`Test Subject Student: ${sampleStudent.name} (Roll: ${sampleStudent.rollNo}, Class: ${sampleStudent.classProgram})`);
    console.log(`Test Campus ID: ${campusId}\n`);

    // --- TEST 1: QR Code Generation & Signature Verification ---
    console.log("--- TEST 1: QR Payload Generation & Cryptographic Integrity ---");
    const payload = createStudentQrPayload(sampleStudent);
    assert(payload.includes("STUDENT_ATTENDANCE"), "QR payload contains STUDENT_ATTENDANCE type descriptor");
    const parsed = parseQrPayload(payload);
    assert(parsed.success === true && parsed.studentId && parsed.isSigned, "QR payload parses successfully with verified signature");
    const expectedSig = generateStudentSignature(parsed.studentId, parsed.campusId);
    const parsedJson = JSON.parse(payload);
    assert(parsedJson.sig === expectedSig, "HMAC-SHA256 signature is authentic and verified");

    // Tampered payload test
    const tamperedPayload = payload.replace(sampleStudent.rollNo, "999999");
    const tamperedJson = JSON.parse(tamperedPayload);
    tamperedJson.studentId = new mongoose.Types.ObjectId().toString();
    const tamperedParsed = parseQrPayload(JSON.stringify(tamperedJson));
    assert(tamperedParsed.isSigned === false, "Tampered QR payload signature mismatch is detected");

    // --- TEST 2: Student Resolution & Campus Multi-Tenancy ---
    console.log("\n--- TEST 2: Student Resolution & Campus Multi-Tenancy ---");
    const resolved = await resolveStudentFromPayload(payload, { campusId });
    assert(
      resolved && resolved.student && resolved.student._id.toString() === sampleStudent._id.toString(),
      "Payload resolves accurately to canonical student record"
    );

    // Cross-tenant protection test
    const foreignCampusId = new mongoose.Types.ObjectId();
    let foreignTenantRejected = false;
    try {
      await resolveStudentFromPayload(payload, { campusId: foreignCampusId });
    } catch (e) {
      foreignTenantRejected = true;
    }
    assert(foreignTenantRejected, "Cross-campus resolution is blocked by multi-tenant boundary");

    // --- TEST 3: Fresh Attendance Recording via QR Scan ---
    console.log("\n--- TEST 3: Attendance Recording via QR Scan ---");
    // Clean up any test attendance on this date first
    await StudentAttendance.deleteMany({
      studentId: sampleStudent.userId?._id || sampleStudent._id,
      dateStr: testDate,
    });

    const scanResult1 = await processQrAttendanceScan(testStaffUser, {
      qrPayload: payload,
      date: testDate,
      status: "Present",
    });

    assert(scanResult1.success === true, "Scan successfully records attendance");
    assert(scanResult1.alreadyMarked === false, "First scan is flagged as new record (alreadyMarked: false)");
    assert(scanResult1.record && scanResult1.record.method === "qr_scan", "Attendance method is recorded as 'qr_scan'");
    assert(scanResult1.record.status === "Present", "Attendance status is recorded as 'Present'");

    // Verify in database
    const dbRecord = await StudentAttendance.findOne({
      campusId,
      studentId: scanResult1.student.id,
      dateStr: testDate,
    });
    assert(dbRecord !== null, "Attendance document persists in MongoDB");

    // --- TEST 4: Duplicate Prevention & Idempotency ---
    console.log("\n--- TEST 4: Duplicate Prevention & Re-scan Handling ---");
    const scanResult2 = await processQrAttendanceScan(testStaffUser, {
      qrPayload: payload,
      date: testDate,
      status: "Present",
    });

    assert(scanResult2.success === true, "Re-scan returns response without server error");
    assert(scanResult2.alreadyMarked === true, "Duplicate scan is caught with alreadyMarked: true");
    assert(scanResult2.message.toLowerCase().includes("already"), "User-facing message indicates already marked/recorded");

    // Verify no second document was created
    const countAfter = await StudentAttendance.countDocuments({
      campusId,
      studentId: scanResult1.student.id,
      dateStr: testDate,
    });
    assert(countAfter === 1, "Database constraint guarantees exactly 1 record (count === 1)");

    // --- TEST 5: Manual Roll Number Fallback ---
    console.log("\n--- TEST 5: Manual Roll Number Fallback ---");
    const testRollFallbackStudent = await Student.findOne({
      campusId,
      rollNo: { $exists: true, $ne: "" },
    }).populate("userId");

    if (testRollFallbackStudent) {
      await StudentAttendance.deleteMany({
        studentId: testRollFallbackStudent.userId?._id || testRollFallbackStudent._id,
        dateStr: testDate,
      });

      const testClass =
        testRollFallbackStudent.userId?.gradeOrClass ||
        testRollFallbackStudent.classProgram?.split("•")[0]?.trim() ||
        "Class 9";
      const testSec =
        testRollFallbackStudent.userId?.section ||
        testRollFallbackStudent.classProgram?.split("•")[1]?.replace(/Section\s*/i, "")?.trim() ||
        "Section B";

      const manualScanResult = await processQrAttendanceScan(testStaffUser, {
        qrPayload: testRollFallbackStudent.rollNo,
        date: testDate,
        status: "Late",
        className: testClass,
        section: testSec,
      });

      assert(manualScanResult.success === true, "Manual roll number entry succeeds");
      const expectedId = String(testRollFallbackStudent.userId?._id || testRollFallbackStudent.userId || testRollFallbackStudent._id);
      assert(
        String(manualScanResult.student.id) === expectedId,
        "Manual roll resolves to the correct student"
      );
      assert(manualScanResult.record.status === "Late", "Manual roll status is recorded as 'Late'");
    }

    // --- TEST 6: Class-Scoped Teacher Attendance Validation ---
    console.log("\n--- TEST 6: Teacher Class Scope Enforcement ---");
    let classMismatchCaught = false;
    try {
      await processQrAttendanceScan(
        { _id: new mongoose.Types.ObjectId(), role: "teacher", campusId },
        {
          qrPayload: payload,
          date: testDate,
          status: "Present",
          className: "Nonexistent Class 999",
          section: "Z",
        }
      );
    } catch (err) {
      console.log("TEST 6 Error Caught:", err.message);
      if (
        err.message.includes("outside your assigned teaching roster") ||
        err.message.includes("belongs to") ||
        err.message.includes("Access Denied") ||
        err.code === "TEACHER_NOT_AUTHORIZED_FOR_CLASS"
      ) {
        classMismatchCaught = true;
      }
    }
    assert(classMismatchCaught, "Teacher scanner prevents student from being scanned into wrong class");

    // --- TEST 7: Inactive / Ineligible Student Guard ---
    console.log("\n--- TEST 7: Inactive Student Guard ---");
    const originalStatus = sampleStudent.userId?.status || "Active";
    await User.updateOne({ _id: sampleStudent.userId._id }, { $set: { status: "Suspended" } });
    let inactiveBlocked = false;
    try {
      await processQrAttendanceScan(testStaffUser, {
        qrPayload: payload,
        date: testDate,
        status: "Present",
      });
    } catch (e) {
      if (e.message.includes("Suspended") || e.message.includes("inactive") || e.message.includes("ineligible")) {
        inactiveBlocked = true;
      }
    }
    // Restore user status
    await User.updateOne({ _id: sampleStudent.userId._id }, { $set: { status: originalStatus } });
    assert(inactiveBlocked, "Suspended student is rejected with eligibility error");

    // --- TEST 8: Attendance System Diagnostics & Health Check ---
    console.log("\n--- TEST 8: Attendance System Diagnostics ---");
    const diag = await getAttendanceSystemDiagnostics(campusId);
    console.log("Diagnostics result:", JSON.stringify(diag.metrics, null, 2));
    assert(diag.status === "healthy", "System diagnostics reports status 'healthy'");
    assert(diag.metrics.coverageRate === 100, "100% of enrolled students have valid QR cards");
    assert(diag.metrics.duplicateRecordsToday === 0, "0 duplicate attendance records exist in the database");

    // --- TEST 9: Faculty & Institute Admin Permission Verification ---
    console.log("\n--- TEST 9: Multi-Role RBAC (Faculty & Institute Admin) ---");
    const facultyUser = {
      _id: new mongoose.Types.ObjectId(),
      role: "faculty",
      campusId,
      name: "Test Faculty Member",
    };
    const facultyResult = await processQrAttendanceScan(facultyUser, {
      qrPayload: payload,
      date: "2026-10-25",
      status: "Present",
      overrideIfMarked: true,
    });
    assert(facultyResult.success === true, "User with 'faculty' role is authorized to record attendance");

    const instAdminUser = {
      _id: new mongoose.Types.ObjectId(),
      role: "institute_admin",
      campusId,
      name: "Test Institute Admin",
    };
    const instAdminResult = await processQrAttendanceScan(instAdminUser, {
      qrPayload: payload,
      date: "2026-10-25",
      status: "Present",
      overrideIfMarked: true,
    });
    assert(instAdminResult.success === true, "User with 'institute_admin' role is authorized to record attendance");

    // Clean up test attendance records
    await StudentAttendance.deleteMany({
      studentId: sampleStudent.userId?._id || sampleStudent._id,
      dateStr: { $in: [testDate, "2026-10-25"] },
    });
    if (testRollFallbackStudent) {
      await StudentAttendance.deleteMany({
        studentId: testRollFallbackStudent.userId?._id || testRollFallbackStudent._id,
        dateStr: testDate,
      });
    }

    console.log("\n=================================================");
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
}

runTests();
