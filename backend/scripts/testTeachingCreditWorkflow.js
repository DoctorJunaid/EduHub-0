/**
 * Comprehensive End-to-End Workflow Test for
 * Teacher Class Credit, Attendance, Substitution, Bonus & Salary Adjustment System
 *
 * Validates all 22 Acceptance Criteria:
 * 1. Create teacher timetable
 * 2. System generates scheduled teaching sessions
 * 3. Teacher sees today's classes
 * 4. Teacher completes a class
 * 5. System records teaching credit
 * 6. Teacher misses another class
 * 7. System records missed class
 * 8. Deduction calculated according to configuration
 * 9. Manager reviews deduction
 * 10. Manager approves deduction
 * 11. Teacher sees approved deduction
 * 12. Manager assigns another teacher as substitute
 * 13. Substitute teacher sees the class in timetable
 * 14. Substitute completes the class
 * 15. System awards configured credit and bonus
 * 16. Manager reviews and approves the bonus
 * 17. Monthly teacher summary reflects all classes
 * 18. Salary/payroll reflects approved deductions and bonuses
 * 19. Teacher requests dispute/review of an incorrect record
 * 20. Manager resolves the review
 * 21. Historical records remain accurate
 * 22. Existing system functionality remains intact
 */

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import Institute from "../src/models/institute.model.js";
import Campus from "../src/models/campus.model.js";
import Timetable from "../src/models/timetable.model.js";
import TeacherClassSession from "../src/models/teacherClassSession.model.js";
import TeachingCreditConfig from "../src/models/teachingCreditConfig.model.js";
import { TeacherProfile } from "../src/models/profile.model.js";
import TeacherSalaryProfile from "../src/models/teacherSalaryProfile.model.js";
import { SubstituteAssignment } from "../src/models/substituteAssignment.model.js";
import { MonthlyPayroll } from "../src/models/monthlyPayroll.model.js";
import { Grade, Section, Subject } from "../src/models/academic.model.js";
import classSessionService from "../src/services/classSession.service.js";
import { generatePayroll } from "../src/services/payroll.service.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED ASSERTION: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runEndToEndTest() {
  console.log("================================================================");
  console.log("Starting End-to-End Test for Teacher Class Credit System");
  console.log("================================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas.");

  // Pick or create test institute
  let institute = await Institute.findOne({ email: "institute-e2e@eduhub.com" });
  if (!institute) {
    institute = await Institute.create({
      name: "E2E Test Institute",
      board: "Federal",
      type: "School",
      email: "institute-e2e@eduhub.com",
      phone: "+92 51 999 888 777",
    });
  }

  // Pick or create test campus
  let campus = await Campus.findOne({ name: "E2E Test Campus" });
  if (!campus) {
    campus = await Campus.create({
      instituteId: institute._id,
      name: "E2E Test Campus",
      code: "E2E-CAMP",
      location: "Sector H-12",
      address: {
        street: "Street 1",
        city: "Islamabad",
      },
      phone: "+92 51 111 222 333",
      email: "campus-e2e@eduhub.com",
    });
  }
  const campusId = campus._id;
  console.log("Using Test Campus:", campus.name, campusId.toString());

  // Create Manager
  let manager = await User.findOne({ email: "manager.e2e@eduhub.com" });
  if (!manager) {
    manager = await User.create({
      name: "Manager Zahid",
      email: "manager.e2e@eduhub.com",
      passwordHash: "dummyhash123",
      role: "campus_manager",
      campusId,
    });
  }

  // Create Teacher A (Original)
  let teacherA = await User.findOne({ email: "teacherA.e2e@eduhub.com" });
  if (!teacherA) {
    teacherA = await User.create({
      name: "Teacher Ahmad",
      email: "teacherA.e2e@eduhub.com",
      passwordHash: "dummyhash123",
      role: "faculty",
      campusId,
      department: "Mathematics",
      designation: "Senior Lecturer",
    });
  }

  // Create Teacher B (Substitute)
  let teacherB = await User.findOne({ email: "teacherB.e2e@eduhub.com" });
  if (!teacherB) {
    teacherB = await User.create({
      name: "Teacher Bilal",
      email: "teacherB.e2e@eduhub.com",
      passwordHash: "dummyhash123",
      role: "faculty",
      campusId,
      department: "Physics",
      designation: "Lecturer",
    });
  }

  // Create TeacherProfiles
  let profileA = await TeacherProfile.findOneAndUpdate(
    { user: teacherA._id },
    { employeeId: "EMP-E2E-A", department: "Mathematics", qualification: "M.Sc" },
    { upsert: true, new: true }
  );

  let profileB = await TeacherProfile.findOneAndUpdate(
    { user: teacherB._id },
    { employeeId: "EMP-E2E-B", department: "Physics", qualification: "M.Sc" },
    { upsert: true, new: true }
  );

  // Configure Salary Profiles (Teacher A = 52,000 PKR, Teacher B = 45,000 PKR)
  await TeacherSalaryProfile.findOneAndUpdate(
    { campusId, teacherProfileId: profileA._id },
    { baseSalary: 52000, isActive: true },
    { upsert: true }
  );

  await TeacherSalaryProfile.findOneAndUpdate(
    { campusId, teacherProfileId: profileB._id },
    { baseSalary: 45000, isActive: true },
    { upsert: true }
  );

  // Configure Campus TeachingCreditConfig
  const config = await TeachingCreditConfig.findOneAndUpdate(
    { campusId },
    {
      creditPerCompletedPeriod: 1.0,
      creditForSubstitution: 1.0,
      bonusPerSubstituteClass: 600,
      requireApprovalForSubstituteBonus: true,
      requireApprovalForMissedDeduction: true,
      deductionMode: "Formula",
      missedClassFormulaMultiplier: 1.0,
      expectedPeriodsPerDay: 4,
      workingDaysPerMonth: 26,
    },
    { upsert: true, new: true }
  );
  console.log("Configured Teaching Credit Rules. Bonus per sub: PKR 600. Working days: 26.");

  // Clean any previous test sessions & payroll for clean assertions
  await TeacherClassSession.deleteMany({ campusId });
  await SubstituteAssignment.deleteMany({ campusId });
  await MonthlyPayroll.deleteMany({ campusId });
  await Timetable.deleteMany({ campusId });

  // -------------------------------------------------------------
  // STEP 1: Create Teacher Timetable
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: Create Teacher Timetable ---");
  const today = new Date();
  const dayOfWeekIndex = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon..7=Sun

  // Ensure Grades, Sections, and Subjects exist
  let grade10 = await Grade.findOne({ campusId, name: "Class 10" });
  if (!grade10) {
    grade10 = await Grade.create({
      name: "Class 10",
      campusId,
      instituteId: institute._id,
    });
  }

  let grade9 = await Grade.findOne({ campusId, name: "Class 9" });
  if (!grade9) {
    grade9 = await Grade.create({
      name: "Class 9",
      campusId,
      instituteId: institute._id,
    });
  }

  let secA = await Section.findOne({ campusId, gradeId: grade10._id, name: "A" });
  if (!secA) {
    secA = await Section.create({
      name: "A",
      gradeId: grade10._id,
      campusId,
      instituteId: institute._id,
    });
  }

  let secB = await Section.findOne({ campusId, gradeId: grade9._id, name: "B" });
  if (!secB) {
    secB = await Section.create({
      name: "B",
      gradeId: grade9._id,
      campusId,
      instituteId: institute._id,
    });
  }

  let subMath = await Subject.findOne({ campusId, name: "Mathematics" });
  if (!subMath) {
    subMath = await Subject.create({
      name: "Mathematics",
      code: "MATH-10",
      campusId,
      instituteId: institute._id,
    });
  }

  let subPhysics = await Subject.findOne({ campusId, name: "Physics" });
  if (!subPhysics) {
    subPhysics = await Subject.create({
      name: "Physics",
      code: "PHY-10",
      campusId,
      instituteId: institute._id,
    });
  }

  // Period 1: Class 10-A Math (08:00 - 08:45)
  const slot1 = await Timetable.create({
    campusId,
    instituteId: institute._id,
    institutionType: "School",
    gradeId: grade10._id,
    sectionId: secA._id,
    subjectId: subMath._id,
    teacherId: teacherA._id,
    room: "Room 101",
    days: [dayOfWeekIndex],
    startTime: "08:00",
    endTime: "08:45",
    status: "Active",
  });

  // Period 2: Class 9-B Math (08:45 - 09:30)
  const slot2 = await Timetable.create({
    campusId,
    instituteId: institute._id,
    institutionType: "School",
    gradeId: grade9._id,
    sectionId: secB._id,
    subjectId: subMath._id,
    teacherId: teacherA._id,
    room: "Room 102",
    days: [dayOfWeekIndex],
    startTime: "08:45",
    endTime: "09:30",
    status: "Active",
  });

  // Period 3: Class 10-A Physics (09:30 - 10:15)
  const slot3 = await Timetable.create({
    campusId,
    instituteId: institute._id,
    institutionType: "School",
    gradeId: grade10._id,
    sectionId: secA._id,
    subjectId: subPhysics._id,
    teacherId: teacherA._id,
    room: "Lab 1",
    days: [dayOfWeekIndex],
    startTime: "09:30",
    endTime: "10:15",
    status: "Active",
  });

  assert(slot1 && slot2 && slot3, "1. Successfully created teacher timetable periods.");

  // -------------------------------------------------------------
  // STEP 2: System generates scheduled teaching sessions
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: System generates scheduled teaching sessions ---");
  const generatedSessions = await classSessionService.generateDailySessions(campusId, today);
  assert(generatedSessions.length === 3, `2. Generated 3 class sessions for today (count: ${generatedSessions.length}).`);
  assert(generatedSessions[0].status === "Scheduled", "Sessions created with status 'Scheduled'.");

  // -------------------------------------------------------------
  // STEP 3: Teacher sees today's classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: Teacher sees today's classes ---");
  const teacherASessions = await classSessionService.listTeacherSessions(campusId, teacherA._id, {
    date: today.toISOString().split("T")[0],
  });
  assert(teacherASessions.length === 3, `3. Teacher A sees all 3 assigned classes for today.`);

  // -------------------------------------------------------------
  // STEP 4: Teacher completes a class (Period 1)
  // -------------------------------------------------------------
  console.log("\n--- STEP 4 & 5: Teacher completes a class & records credit ---");
  const period1Session = teacherASessions.find((s) => s.period === 1);
  const completedSession = await classSessionService.markSessionStatus(
    period1Session._id,
    campusId,
    teacherA,
    { status: "Completed", remarks: "Conducted lecture on Quadratic Equations." }
  );

  // -------------------------------------------------------------
  // STEP 5: System records the teaching credit
  // -------------------------------------------------------------
  assert(completedSession.status === "Completed", "4. Session status updated to 'Completed'.");
  assert(completedSession.creditValue === 1.0, "5. Teaching credit of 1.0 successfully awarded.");
  assert(completedSession.deductionValue === 0, "No deduction on completed class.");

  // -------------------------------------------------------------
  // STEP 6: Teacher misses another class (Period 2)
  // -------------------------------------------------------------
  console.log("\n--- STEP 6, 7 & 8: Teacher misses another class & calculates deduction ---");
  const period2Session = teacherASessions.find((s) => s.period === 2);
  const missedSession = await classSessionService.markSessionStatus(
    period2Session._id,
    campusId,
    teacherA,
    { status: "Missed", remarks: "Teacher was unavoidably absent." }
  );

  // -------------------------------------------------------------
  // STEP 7 & 8: System records missed class and calculates deduction
  // -------------------------------------------------------------
  assert(missedSession.status === "Missed", "6 & 7. Session status updated to 'Missed'.");
  assert(missedSession.creditValue === 0, "Credit is 0 for missed class.");
  // Formula: base 52,000 / 26 days / 4 periods = 500 PKR
  assert(missedSession.deductionValue === 500, `8. Configured formula deduction calculated: PKR ${missedSession.deductionValue} (Expected: 500).`);
  assert(missedSession.adjustmentReview.status === "Pending Review", "Deduction is in 'Pending Review' status, awaiting manager review.");

  // -------------------------------------------------------------
  // STEP 9 & 10: Manager reviews and approves the deduction
  // -------------------------------------------------------------
  console.log("\n--- STEP 9, 10 & 11: Manager reviews & approves deduction ---");
  const reviewItems = await classSessionService.getSalaryReviewCenterItems(campusId, { status: "Pending" });
  assert(reviewItems.some((i) => String(i._id) === String(missedSession._id)), "9. Manager sees pending missed class deduction in Salary Review Center.");

  const approvedAdjustment = await classSessionService.reviewSessionAdjustment(
    missedSession._id,
    campusId,
    manager,
    { action: "Approve", remark: "Confirmed unexcused lecture absence." }
  );
  assert(approvedAdjustment.adjustmentReview.status === "Approved", "10. Manager successfully approved the deduction.");
  assert(approvedAdjustment.deductionValue === 500, "Approved deduction value confirmed at PKR 500.");

  // -------------------------------------------------------------
  // STEP 11: Teacher sees the approved deduction
  // -------------------------------------------------------------
  const teacherSummaryStep11 = await classSessionService.getTeacherMonthlySummary(campusId, teacherA._id);
  assert(teacherSummaryStep11.approvedDeductionsTotal === 500, `11. Teacher A summary reflects approved deduction of PKR ${teacherSummaryStep11.approvedDeductionsTotal}.`);

  // -------------------------------------------------------------
  // STEP 12: Manager assigns Teacher B as substitute for Period 3
  // -------------------------------------------------------------
  console.log("\n--- STEP 12 & 13: Manager assigns substitute Teacher B ---");
  const period3Session = teacherASessions.find((s) => s.period === 3);
  const substitutedSession = await classSessionService.assignSubstituteToSession(
    period3Session._id,
    campusId,
    manager,
    { substituteTeacherId: teacherB._id, reason: "Teacher Absent", notes: "Please supervise lab experiment." }
  );

  assert(substitutedSession.isSubstituted === true, "12. Session marked isSubstituted = true.");
  assert(String(substitutedSession.actualTeacherId) === String(teacherB._id), "Actual teacher assigned to Teacher B.");

  // -------------------------------------------------------------
  // STEP 13: Substitute teacher B sees the class in their timetable
  // -------------------------------------------------------------
  const teacherBSessions = await classSessionService.listTeacherSessions(campusId, teacherB._id, {
    date: today.toISOString().split("T")[0],
  });
  const subDutySession = teacherBSessions.find((s) => String(s._id) === String(period3Session._id));
  assert(subDutySession && subDutySession.isSubstituteDuty === true, "13. Teacher B sees Period 3 as a 'Substitution Duty' in their timetable.");

  // Also verify Teacher A sees "Substituted Out"
  const teacherASessionsAfterSub = await classSessionService.listTeacherSessions(campusId, teacherA._id, {
    date: today.toISOString().split("T")[0],
  });
  const substitutedOutSession = teacherASessionsAfterSub.find((s) => String(s._id) === String(period3Session._id));
  assert(substitutedOutSession && substitutedOutSession.isSubstitutedOut === true, "Teacher A timetable reflects 'Substituted Out / Not Teaching'.");

  // -------------------------------------------------------------
  // STEP 14: Substitute completes the class
  // -------------------------------------------------------------
  console.log("\n--- STEP 14 & 15: Substitute completes class & earns bonus ---");
  const completedSubSession = await classSessionService.markSessionStatus(
    period3Session._id,
    campusId,
    teacherB,
    { status: "Completed", remarks: "Lab experiment conducted successfully." }
  );

  // -------------------------------------------------------------
  // STEP 15: System awards substitute credit and bonus
  // -------------------------------------------------------------
  assert(completedSubSession.status === "Completed", "14. Substitute session marked 'Completed'.");
  assert(completedSubSession.creditValue === 1.0, "15. Substitute awarded 1.0 substitution credit.");
  assert(completedSubSession.bonusValue === 600, `Configured substitution bonus of PKR ${completedSubSession.bonusValue} accrued.`);
  assert(completedSubSession.adjustmentReview.status === "Pending Review", "Bonus is pending manager approval as configured.");

  // -------------------------------------------------------------
  // STEP 16: Manager reviews and approves the bonus
  // -------------------------------------------------------------
  console.log("\n--- STEP 16: Manager reviews and approves bonus ---");
  const approvedBonusSession = await classSessionService.reviewSessionAdjustment(
    period3Session._id,
    campusId,
    manager,
    { action: "Approve", remark: "Substitute duty verified." }
  );
  assert(approvedBonusSession.adjustmentReview.status === "Approved", "16. Manager approved the substitution bonus.");

  // -------------------------------------------------------------
  // STEP 17: Monthly teacher summaries reflect all classes
  // -------------------------------------------------------------
  console.log("\n--- STEP 17: Monthly teacher summaries ---");
  const monthStr = today.toISOString().slice(0, 7);
  const summaryA = await classSessionService.getTeacherMonthlySummary(campusId, teacherA._id, monthStr);
  const summaryB = await classSessionService.getTeacherMonthlySummary(campusId, teacherB._id, monthStr);

  assert(summaryA.completedCount === 1, `Teacher A completed count: 1.`);
  assert(summaryA.missedCount === 1, `Teacher A missed count: 1.`);
  assert(summaryA.substitutedOutCount === 1, `Teacher A substituted out: 1.`);
  assert(summaryA.approvedDeductionsTotal === 500, `Teacher A approved deductions: PKR 500.`);

  assert(summaryB.substituteCredits === 1, `Teacher B substitution credits: 1.`);
  assert(summaryB.totalBonusEarned === 600, `Teacher B total bonus earned: PKR 600.`);
  console.log("17. Monthly teacher summaries accurately reflect all credits, bonuses, and deductions.");

  // -------------------------------------------------------------
  // STEP 18: Salary/Payroll reflects approved deductions & bonuses
  // -------------------------------------------------------------
  console.log("\n--- STEP 18: Payroll generation integration ---");
  const payrollResult = await generatePayroll(campusId, manager._id, { month: monthStr });
  assert(payrollResult.generated >= 2, `18. Monthly payroll generated for ${payrollResult.generated} teachers.`);

  // Check Teacher A's payroll
  const payrollA = await MonthlyPayroll.findOne({ campusId, teacherProfileId: profileA._id, month: monthStr }).lean();
  assert(payrollA, "Payroll record created for Teacher A.");
  const missedDeductionLine = payrollA.deductions.find((d) => d.reason.includes("Approved Missed Period 2"));
  assert(missedDeductionLine && missedDeductionLine.amount === 500, "Teacher A payroll contains the PKR 500 approved missed class deduction line item.");

  // Check Teacher B's payroll
  const payrollB = await MonthlyPayroll.findOne({ campusId, teacherProfileId: profileB._id, month: monthStr }).lean();
  assert(payrollB, "Payroll record created for Teacher B.");
  const substituteBonusLine = payrollB.bonuses.find((b) => b.reason.includes("Approved Substitute Period 3"));
  assert(substituteBonusLine && substituteBonusLine.amount === 600, "Teacher B payroll contains the PKR 600 approved substitute class bonus line item.");

  // Verify net salary math
  assert(payrollA.netSalary === payrollA.grossSalary - payrollA.deductionsTotal + payrollA.bonusesTotal, "Teacher A Net Salary formula verified.");
  assert(payrollB.netSalary === payrollB.grossSalary - payrollB.deductionsTotal + payrollB.bonusesTotal, "Teacher B Net Salary formula verified.");

  // -------------------------------------------------------------
  // STEP 19 & 20: Teacher dispute and Manager resolution workflow
  // -------------------------------------------------------------
  console.log("\n--- STEP 19 & 20: Teacher dispute & Manager resolution ---");
  // Teacher A disputes the missed class for Period 2
  const disputedSession = await classSessionService.requestDispute(
    period2Session._id,
    campusId,
    teacherA,
    { reason: "Class was conducted in Chemistry lab with attendance recorded on paper register." }
  );
  assert(disputedSession.dispute.isDisputed === true, "19. Dispute successfully logged by teacher.");
  assert(disputedSession.dispute.disputeStatus === "Pending", "Dispute in 'Pending' status.");

  // Manager resolves dispute
  const resolvedSession = await classSessionService.resolveDispute(
    period2Session._id,
    campusId,
    manager,
    {
      decision: "Approve",
      resolutionRemark: "Paper register verified by academic coordinator. Excused and credit awarded.",
      adjustedStatus: "Approved Adjustment",
      adjustedDeduction: 0,
    }
  );
  assert(resolvedSession.dispute.disputeStatus === "Approved", "20. Manager approved teacher dispute.");
  assert(resolvedSession.status === "Approved Adjustment", "Session status changed to 'Approved Adjustment'.");
  assert(resolvedSession.deductionValue === 0, "Deduction successfully reversed to 0.");
  assert(resolvedSession.creditValue === 1.0, "Teaching credit restored to 1.0.");

  // -------------------------------------------------------------
  // STEP 21: Historical records remain accurate
  // -------------------------------------------------------------
  console.log("\n--- STEP 21: Historical integrity ---");
  const allSessions = await TeacherClassSession.find({ campusId }).lean();
  assert(allSessions.length === 3, "21. Exact 3 sessions maintained without duplicate or corrupted records.");
  assert(allSessions.every((s) => s.campusId.toString() === campusId.toString()), "All historical records maintain relational integrity.");

  // -------------------------------------------------------------
  // STEP 22: Existing system functionality remains intact
  // -------------------------------------------------------------
  console.log("\n--- STEP 22: Non-regression check ---");
  const activeTimetables = await Timetable.find({ campusId }).lean();
  assert(activeTimetables.length === 3, "22. Original Timetable matrix templates remain intact.");
  const campusTeachingSummary = await classSessionService.getCampusTeachingPerformance(campusId, { month: monthStr });
  assert(campusTeachingSummary.totalTeachers >= 2, "Campus-wide teacher performance metrics query successfully.");

  console.log("\n================================================================");
  console.log("🎉 ALL 22 ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!");
  console.log("================================================================\n");

  await mongoose.disconnect();
}

runEndToEndTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
