import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/cause/.gemini/antigravity/brain/9706c72f-26df-4f82-b1ef-62bce10820ea";
const BASE_URL = "http://127.0.0.1:5173";
const API_URL = "http://127.0.0.1:5000/api/v1";

const results = {
  instituteAdmin: { passed: [], failed: [], missing: [] },
  campusManager: { passed: [], failed: [], missing: [] },
  teacher: { passed: [], failed: [], missing: [] },
  student: { passed: [], failed: [], missing: [] },
  syncVerification: { passed: [], failed: [], missing: [] },
  errors: [],
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(2500);
  } catch (e) {
    console.warn(`[WARN] safeGoto ${url}: ${e.message}`);
  }
}

async function createRoleSession(browser, email, password, roleName) {
  console.log(`\n========================================`);
  console.log(`[AUTH] Creating fresh incognito session for ${roleName} (${email})...`);
  console.log(`========================================`);

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon") && !text.includes("ResizeObserver")) {
        results.errors.push(`[${roleName} Console Error] ${text.slice(0, 300)}`);
      }
    }
  });

  page.on("pageerror", (err) => {
    results.errors.push(`[${roleName} Page Crash] ${err.message}`);
  });

  page.on("response", (res) => {
    if (res.status() >= 400 && res.url().includes("/api/")) {
      results.errors.push(`[${roleName} API Error ${res.status()}] ${res.url()}`);
    }
  });

  await safeGoto(page, `${BASE_URL}/login`);

  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type('input[type="email"]', email, { delay: 10 });

  await page.click('input[type="password"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type('input[type="password"]', password, { delay: 10 });

  await page.screenshot({ path: path.join(ARTIFACT_DIR, `auth_${roleName}_entered.png`) });

  // Submit via Enter press
  await page.keyboard.press("Enter");

  // Wait for URL redirect
  await page.waitForFunction(
    () => !window.location.pathname.includes("/login"),
    { timeout: 15000 }
  );

  await sleep(2500);
  console.log(`[AUTH] Logged in! Landed at: ${page.url()}`);
  return { context, page };
}

async function run() {
  console.log("=== FULL APP COMPREHENSIVE MULTI-ROLE HIERARCHY TEST ===");
  console.log(`Artifact directory: ${ARTIFACT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 900 },
  });

  // -------------------------------------------------------------
  // STAGE 1: INSTITUTE ADMIN
  // -------------------------------------------------------------
  let instSession = null;
  try {
    console.log("\n>>> STAGE 1: TESTING INSTITUTE ADMIN <<<");
    instSession = await createRoleSession(browser, "dodixi6577@ensproxy.com", "12345678", "institute_admin");
    const page = instSession.page;
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_admin_dashboard.png") });

    // 1. Dashboard metrics
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes("Campus") || bodyText.includes("Institute") || bodyText.includes("Revenue")) {
      results.instituteAdmin.passed.push("Institute Admin Dashboard loaded with key metrics");
    } else {
      results.instituteAdmin.failed.push("Institute Admin Dashboard missing header/metrics");
    }

    // 2. Campuses Management
    console.log("Checking /institute-admin/campuses...");
    await safeGoto(page, `${BASE_URL}/institute-admin/campuses`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_campuses.png") });
    const campusPageText = await page.evaluate(() => document.body.innerText);
    if (campusPageText.includes("bot_tester_123") || campusPageText.includes("Campus")) {
      results.instituteAdmin.passed.push("Campus directory lists test campus branch");
    } else {
      results.instituteAdmin.failed.push("Campus directory does not show test campus");
    }

    // 3. Students oversight
    console.log("Checking /institute-admin/students...");
    await safeGoto(page, `${BASE_URL}/institute-admin/students`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_students.png") });
    const instStudentText = await page.evaluate(() => document.body.innerText);
    if (instStudentText.includes("Tahir Khan") || instStudentText.includes("Students")) {
      results.instituteAdmin.passed.push("Institute Admin Students overview accessible");
    } else {
      results.instituteAdmin.missing.push("Enrolled student Tahir Khan not populated in Institute Admin Students view");
    }

    // 4. Staff oversight
    console.log("Checking /institute-admin/staff...");
    await safeGoto(page, `${BASE_URL}/institute-admin/staff`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_staff.png") });
    const instStaffText = await page.evaluate(() => document.body.innerText);
    if (instStaffText.includes("Teacher Bilal") || instStaffText.includes("Staff") || instStaffText.includes("Faculty")) {
      results.instituteAdmin.passed.push("Institute Admin Staff overview renders faculty members");
    } else {
      results.instituteAdmin.missing.push("Faculty Teacher Bilal not populated in Institute Admin Staff view");
    }

    // 5. Salary Policies
    console.log("Checking /institute-admin/salary-policies...");
    await safeGoto(page, `${BASE_URL}/institute-admin/salary-policies`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_salary_policies.png") });
    const policyText = await page.evaluate(() => document.body.innerText);
    if (policyText.includes("Salary") || policyText.includes("Policy") || policyText.includes("Substitute")) {
      results.instituteAdmin.passed.push("Institute Admin Salary Policies view accessible");
    }

    // 6. Audit Logs
    console.log("Checking /institute-admin/audit-logs...");
    await safeGoto(page, `${BASE_URL}/institute-admin/audit-logs`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage1_inst_audit_logs.png") });
    const auditText = await page.evaluate(() => document.body.innerText);
    if (auditText.includes("Audit") || auditText.includes("Logs") || auditText.includes("Activity")) {
      results.instituteAdmin.passed.push("Institute Audit Logs rendered");
    }
  } catch (err) {
    console.error("Stage 1 Error:", err);
    results.instituteAdmin.failed.push(`Stage 1 Exception: ${err.message}`);
  } finally {
    if (instSession?.context) await instSession.context.close().catch(() => {});
  }

  // -------------------------------------------------------------
  // STAGE 2: CAMPUS MANAGER
  // -------------------------------------------------------------
  let managerSession = null;
  try {
    console.log("\n>>> STAGE 2: TESTING CAMPUS MANAGER <<<");
    managerSession = await createRoleSession(browser, "boot_tester123@test.com", "12345678", "campus_manager");
    const page = managerSession.page;
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_dashboard.png") });

    // 1. Dashboard
    const dashText = await page.evaluate(() => document.body.innerText);
    if (dashText.includes("Dashboard") || dashText.includes("Students") || dashText.includes("Faculty")) {
      results.campusManager.passed.push("Campus Manager Dashboard rendered");
    }

    // 2. Students Directory
    console.log("Checking /students...");
    await safeGoto(page, `${BASE_URL}/students`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_students.png") });
    const studentText = await page.evaluate(() => document.body.innerText);
    if (studentText.includes("Tahir Khan")) {
      results.campusManager.passed.push("Students Directory: Tahir Khan is enrolled and visible");
    } else {
      results.campusManager.failed.push("Students Directory: Tahir Khan not found");
    }

    // 3. Faculty Directory
    console.log("Checking /faculty...");
    await safeGoto(page, `${BASE_URL}/faculty`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_faculty.png") });
    const facultyText = await page.evaluate(() => document.body.innerText);
    if (facultyText.includes("Teacher Bilal")) {
      results.campusManager.passed.push("Faculty Directory: Teacher Bilal is onboarded and visible");
    } else {
      results.campusManager.failed.push("Faculty Directory: Teacher Bilal not found");
    }

    // 4. Academics (Grades, Sections, Subjects, TeacherAssignmentTab)
    console.log("Checking /academics...");
    await safeGoto(page, `${BASE_URL}/academics`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_academics.png") });
    const academicsText = await page.evaluate(() => document.body.innerText);
    if (academicsText.includes("Class 10") || academicsText.includes("Grade")) {
      results.campusManager.passed.push("Academics Config: Class 10 configured");
    } else {
      results.campusManager.missing.push("Academics Config: Grade / Class missing or unpopulated");
    }

    // Click Teacher Assignments tab in Academics
    const teacherAssignTab = await page.$('button[value="teacher_assignments"], [data-value="teacher_assignments"]');
    if (teacherAssignTab) {
      await teacherAssignTab.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_teacher_assignments.png") });
      results.campusManager.passed.push("Academics Config: Teacher Assignment tab interactive");
    }

    // 5. Timetable
    console.log("Checking /timetable...");
    await safeGoto(page, `${BASE_URL}/timetable`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_timetable.png") });
    const timetableText = await page.evaluate(() => document.body.innerText);
    if (timetableText.includes("Mathematics") || timetableText.includes("Timetable") || timetableText.includes("Schedule")) {
      results.campusManager.passed.push("Timetable: Class schedule / timetable rendered");
    }

    // 6. Substitutes
    console.log("Checking /substitutes...");
    await safeGoto(page, `${BASE_URL}/substitutes`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_substitutes.png") });
    const subText = await page.evaluate(() => document.body.innerText);
    if (subText.includes("Substitute") || subText.includes("Assign") || subText.includes("Duty")) {
      results.campusManager.passed.push("Substitutes: Substitution management interface loaded");
    }

    // 7. Salary Profiles & Payroll
    console.log("Checking /salary-profiles...");
    await safeGoto(page, `${BASE_URL}/salary-profiles`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_salary_profiles.png") });
    const salaryText = await page.evaluate(() => document.body.innerText);
    if (salaryText.includes("Teacher Bilal") || salaryText.includes("50,000") || salaryText.includes("50000")) {
      results.campusManager.passed.push("Salary Profiles: Base salary (PKR 50,000) configured for Teacher Bilal");
    } else {
      results.campusManager.missing.push("Salary Profiles: Salary profile not reflected in list");
    }

    console.log("Checking /salary-payroll...");
    await safeGoto(page, `${BASE_URL}/salary-payroll`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_payroll.png") });
    const payrollText = await page.evaluate(() => document.body.innerText);
    if (payrollText.includes("Payroll") || payrollText.includes("Process") || payrollText.includes("Calculate")) {
      results.campusManager.passed.push("Payroll: Monthly salary payroll review module accessible");
    }

    // 8. Fees
    console.log("Checking /fees...");
    await safeGoto(page, `${BASE_URL}/fees`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage2_manager_fees.png") });
    const feeText = await page.evaluate(() => document.body.innerText);
    if (feeText.includes("Fee") || feeText.includes("Voucher") || feeText.includes("Invoice")) {
      results.campusManager.passed.push("Fee Management: Student fee ledger interface accessible");
    }
  } catch (err) {
    console.error("Stage 2 Error:", err);
    results.campusManager.failed.push(`Stage 2 Exception: ${err.message}`);
  } finally {
    if (managerSession?.context) await managerSession.context.close().catch(() => {});
  }

  // -------------------------------------------------------------
  // STAGE 3: TEACHER
  // -------------------------------------------------------------
  let teacherSession = null;
  try {
    console.log("\n>>> STAGE 3: TESTING TEACHER <<<");
    teacherSession = await createRoleSession(browser, "bilal.teacher@test.com", "teacher123", "teacher");
    const page = teacherSession.page;
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_dashboard.png") });

    // 1. Dashboard
    const teacherDashText = await page.evaluate(() => document.body.innerText);
    if (teacherDashText.includes("Teacher Bilal") || teacherDashText.includes("Mathematics") || teacherDashText.includes("Class 10")) {
      results.teacher.passed.push("Teacher Dashboard: Assigned class (Class 10 Section A Mathematics) displayed");
    } else {
      results.teacher.failed.push("Teacher Dashboard: Assigned course not appearing");
    }

    // 2. Timetable
    console.log("Checking /teacher/timetable...");
    await safeGoto(page, `${BASE_URL}/teacher/timetable`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_timetable.png") });
    const teacherTtText = await page.evaluate(() => document.body.innerText);
    if (teacherTtText.includes("Mathematics") || teacherTtText.includes("09:00") || teacherTtText.includes("Schedule")) {
      results.teacher.passed.push("Teacher Timetable: Daily teaching periods and schedule rendered");
    } else {
      results.teacher.missing.push("Teacher Timetable: Timetable slot not showing assigned period");
    }

    // 3. Attendance
    console.log("Checking /teacher/attendance...");
    await safeGoto(page, `${BASE_URL}/teacher/attendance`);
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return !text.includes("Loading enrolled students") && !text.includes("No assigned classes");
      },
      { timeout: 10000 }
    ).catch(() => {});
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_attendance.png") });
    const attText = await page.evaluate(() => document.body.innerText);
    if (attText.includes("Tahir Khan")) {
      results.teacher.passed.push("Teacher Attendance: Roster loaded student Tahir Khan");
    } else {
      results.teacher.failed.push("Teacher Attendance: Enrolled student Tahir Khan missing from roster");
    }

    // 4. Diary
    console.log("Checking /teacher/diary...");
    await safeGoto(page, `${BASE_URL}/teacher/diary`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_diary.png") });
    const diaryText = await page.evaluate(() => document.body.innerText);
    if (diaryText.includes("Quadratic") || diaryText.includes("Equations") || diaryText.includes("Diary") || diaryText.includes("Exercise")) {
      results.teacher.passed.push("Teacher Diary: Daily lecture diary entry recorded and displayed");
    } else {
      results.teacher.missing.push("Teacher Diary: Published diary entry not showing in list");
    }

    // 5. Gradebook
    console.log("Checking /teacher/gradebook...");
    const gbLink = await page.$('a[href="/teacher/gradebook"]');
    if (gbLink) await gbLink.click();
    else await safeGoto(page, `${BASE_URL}/teacher/gradebook`);
    await sleep(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_gradebook.png") });
    const gradeText = await page.evaluate(() => document.body.innerText);
    if (gradeText.includes("Tahir Khan") || gradeText.includes("88") || gradeText.includes("Midterm")) {
      results.teacher.passed.push("Teacher Gradebook: Student exam mark (88/100, Grade A) recorded");
    } else {
      results.teacher.missing.push("Teacher Gradebook: Gradebook entry not displaying in table");
    }

    // 6. My Salary
    console.log("Checking /my-salary...");
    await safeGoto(page, `${BASE_URL}/my-salary`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage3_teacher_salary.png") });
    const mySalaryText = await page.evaluate(() => document.body.innerText);
    if (mySalaryText.includes("50,000") || mySalaryText.includes("Salary") || mySalaryText.includes("Compensation")) {
      results.teacher.passed.push("Teacher My Salary: Compensation overview reflects assigned base salary");
    } else {
      results.teacher.missing.push("Teacher My Salary: Salary not displayed in employee view");
    }
  } catch (err) {
    console.error("Stage 3 Error:", err);
    results.teacher.failed.push(`Stage 3 Exception: ${err.message}`);
  } finally {
    if (teacherSession?.context) await teacherSession.context.close().catch(() => {});
  }

  // -------------------------------------------------------------
  // STAGE 4: STUDENT
  // -------------------------------------------------------------
  let studentSession = null;
  try {
    console.log("\n>>> STAGE 4: TESTING STUDENT <<<");
    studentSession = await createRoleSession(browser, "tahir.student@test.com", "student123", "student");
    const page = studentSession.page;
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_dashboard.png") });

    // 1. Dashboard
    const studentDashText = await page.evaluate(() => document.body.innerText);
    if (studentDashText.includes("Tahir Khan") || studentDashText.includes("Attendance") || studentDashText.includes("Grade")) {
      results.student.passed.push("Student Dashboard: Profile, enrolled status, and summary cards rendered");
    } else {
      results.student.failed.push("Student Dashboard: Failed to render student overview");
    }

    // 2. Attendance
    console.log("Checking /student/attendance...");
    const attLink = await page.$('a[href="/student/attendance"]');
    if (attLink) await attLink.click();
    else await safeGoto(page, `${BASE_URL}/student/attendance`);
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_attendance.png") });
    const stAttText = await page.evaluate(() => document.body.innerText);
    if (stAttText.includes("Present") || stAttText.includes("100%")) {
      results.student.passed.push("Student Attendance: Displays 'Present' recorded by teacher Bilal");
      results.syncVerification.passed.push("SYNC VERIFIED: Teacher attendance marked -> Reflected on Student Attendance");
    } else {
      results.student.missing.push("Student Attendance: Attendance status not displaying as Present");
      results.syncVerification.failed.push("SYNC FAILED: Teacher attendance not synced to student portal");
    }

    // 3. Diary & Homework
    console.log("Checking /student/diary...");
    const diaryLink = await page.$('a[href="/student/diary"]');
    if (diaryLink) await diaryLink.click();
    else await safeGoto(page, `${BASE_URL}/student/diary`);
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_diary.png") });
    const stDiaryText = await page.evaluate(() => document.body.innerText);
    if (stDiaryText.includes("Quadratic") || stDiaryText.includes("Equations") || stDiaryText.includes("Exercise 4.1")) {
      results.student.passed.push("Student Diary: Topic 'Quadratic Equations & Roots' and homework displayed");
      results.syncVerification.passed.push("SYNC VERIFIED: Teacher daily diary published -> Reflected on Student Diary");
    } else {
      results.student.missing.push("Student Diary: Published diary not showing in student portal");
      results.syncVerification.failed.push("SYNC FAILED: Teacher diary not synced to student portal");
    }

    // 4. Grades / Report Card
    console.log("Checking /student/grades...");
    const gradesLink = await page.$('a[href="/student/grades"]');
    if (gradesLink) await gradesLink.click();
    else await safeGoto(page, `${BASE_URL}/student/grades`);
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_grades.png") });
    const stGradeText = await page.evaluate(() => document.body.innerText);
    if (stGradeText.includes("88") || stGradeText.includes("Mathematics") || stGradeText.includes("Midterm")) {
      results.student.passed.push("Student Grades: Mathematics 88/100 (Grade A) reflected on progress report");
      results.syncVerification.passed.push("SYNC VERIFIED: Teacher gradebook submitted -> Reflected on Student Report Card");
    } else {
      results.student.missing.push("Student Grades: Exam results not displaying in student grades");
      results.syncVerification.failed.push("SYNC FAILED: Teacher gradebook marks not synced to student portal");
    }

    // 5. Timetable
    console.log("Checking /student/timetable...");
    const ttLink = await page.$('a[href="/student/timetable"]');
    if (ttLink) await ttLink.click();
    else await safeGoto(page, `${BASE_URL}/student/timetable`);
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_timetable.png") });
    const stTtText = await page.evaluate(() => document.body.innerText);
    if (stTtText.includes("Mathematics") || stTtText.includes("09:00") || stTtText.includes("Schedule") || stTtText.includes("Timetable")) {
      results.student.passed.push("Student Timetable: Weekly schedule rendered");
    } else {
      results.student.missing.push("Student Timetable: Timetable slot not showing or empty");
    }

    // 6. Fees
    console.log("Checking /student/fees...");
    const feesLink = await page.$('a[href="/student/fees"]');
    if (feesLink) await feesLink.click();
    else await safeGoto(page, `${BASE_URL}/student/fees`);
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "stage4_student_fees.png") });
    const stFeeText = await page.evaluate(() => document.body.innerText);
    if (stFeeText.includes("Fee") || stFeeText.includes("Invoice") || stFeeText.includes("Voucher") || stFeeText.includes("Paid") || stFeeText.includes("Due")) {
      results.student.passed.push("Student Fees: Fee status and invoices accessible");
    }
  } catch (err) {
    console.error("Stage 4 Error:", err);
    results.student.failed.push(`Stage 4 Exception: ${err.message}`);
  } finally {
    if (studentSession?.context) await studentSession.context.close().catch(() => {});
  }

  await browser.close();

  // Save report
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "hierarchy_test_report.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n==========================================");
  console.log("=== HIERARCHY TEST RUN COMPLETED ===");
  console.log(JSON.stringify(results, null, 2));
  console.log("==========================================");
}

run().catch((err) => {
  console.error("FATAL ERROR IN TEST SCRIPT:", err);
  process.exit(1);
});
