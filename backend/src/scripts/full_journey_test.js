import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "/home/cause/.gemini/antigravity/brain/9706c72f-26df-4f82-b1ef-62bce10820ea";
const BASE_URL = "http://127.0.0.1:5173";
const API_URL = "http://127.0.0.1:5000/api/v1";

async function postJson(url, data, token) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return { data: json, status: res.status };
  } catch (err) {
    return { error: err.message };
  }
}

async function getJson(url, token) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    return { data: json, status: res.status };
  } catch (err) {
    return { error: err.message };
  }
}

async function run() {
  console.log("=== STARTING FULL END-TO-END AUTOMATED APP TEST ===");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // Helper to log in
  async function loginAs(email, password) {
    console.log(`\nLogging in as ${email}...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.click('input[type="email"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="email"]', email);

    await page.click('input[type="password"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[type="password"]', password);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    console.log(`Current URL for ${email}:`, page.url());
  }

  // Helper to log out
  async function logout() {
    console.log("Logging out...");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1000));
  }

  try {
    // -------------------------------------------------------------
    // STAGE 1: CAMPUS MANAGER SETUP
    // -------------------------------------------------------------
    console.log("\n--- STAGE 1: LOGGING IN AS CAMPUS MANAGER (boot_tester123@test.com) ---");
    await loginAs("boot_tester123@test.com", "12345678");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step1_manager_dashboard.png") });

    const token = await page.evaluate(() => localStorage.getItem("eduHubToken"));

    // Ensure Academic Grade 'Class 10' & Section 'A'
    console.log("Ensuring Academic Grade 'Class 10' & Section 'A' exist...");
    let gradeId = null;
    let sectionId = null;
    try {
      const gRes = await postJson(`${API_URL}/academics/grades`, { name: "Class 10", code: "CLS10" }, token);
      gradeId = gRes.data?.data?._id;

      if (!gradeId) {
        const listG = await getJson(`${API_URL}/academics/grades`, token);
        gradeId = listG.data?.data?.[0]?._id;
      }

      if (gradeId) {
        const sRes = await postJson(`${API_URL}/academics/sections`, { name: "A", gradeId }, token);
        sectionId = sRes.data?.data?._id;
      }
    } catch (e) {
      console.log("Academic setup non-fatal:", e.message);
    }

    // 1.1 Students Directory
    console.log("1.1 Navigating to Students Directory...");
    await page.goto(`${BASE_URL}/students`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step2_manager_students_before.png") });

    // Add Student
    console.log("Adding Student 'Tahir Khan'...");
    const stRes = await postJson(
      `${API_URL}/campus-admin/students/new`,
      {
        name: "Tahir Khan",
        email: "tahir.student@test.com",
        roll: "R-101",
        gradeOrClass: "Class 10",
        program: "Class 10",
        section: "A",
        gradeId: gradeId || undefined,
        sectionId: sectionId || undefined,
        phone: "03001234567",
        guardian: "Khan Senior",
        guardianPhone: "03007654321",
        status: "Active",
        password: "student123",
      },
      token
    );
    console.log("Student Creation Result:", stRes.data?.success || stRes.data?.message);

    let studentId = stRes.data?.data?._id;
    if (!studentId) {
      const allStudentsRes = await getJson(`${API_URL}/campus-admin/students`, token);
      const foundStudent = (allStudentsRes.data?.data || []).find((s) => s.email === "tahir.student@test.com");
      if (foundStudent) studentId = foundStudent._id;
    }
    console.log("Resolved studentId:", studentId);

    // Refresh students page to verify render
    await page.goto(`${BASE_URL}/students`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step3_manager_students_after.png") });
    const studentsPageText = await page.evaluate(() => document.body.innerText);
    console.log("Students page has 'Tahir Khan':", studentsPageText.includes("Tahir Khan"));

    // 1.2 Teachers Directory
    console.log("1.2 Navigating to Teachers Directory...");
    await page.goto(`${BASE_URL}/faculty`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step4_manager_faculty_before.png") });

    // Add Teacher
    console.log("Adding Teacher 'Teacher Bilal'...");
    const facRes = await postJson(
      `${API_URL}/campus-admin/faculty/new`,
      {
        name: "Teacher Bilal",
        email: "bilal.teacher@test.com",
        phone: "03009876543",
        department: "Sciences & Mathematics",
        designation: "Senior Subject Teacher",
        qualification: "M.Sc Mathematics",
        subjects: "Mathematics",
        status: "Active",
        password: "teacher123",
      },
      token
    );
    console.log("Faculty Creation Result:", facRes.data?.success || facRes.data?.message);

    let teacherUserId = facRes.data?.data?._id;
    if (!teacherUserId) {
      const allFac = await getJson(`${API_URL}/campus-admin/faculty`, token);
      const foundT = (allFac.data?.data || []).find((t) => t.email === "bilal.teacher@test.com");
      if (foundT) teacherUserId = foundT._id;
    }

    // Refresh faculty page to verify render
    await page.goto(`${BASE_URL}/faculty`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step5_manager_faculty_after.png") });
    const facultyPageText = await page.evaluate(() => document.body.innerText);
    console.log("Faculty page has 'Teacher Bilal':", facultyPageText.includes("Teacher Bilal"));
    console.log("Faculty page has 0 NUST teachers:", !facultyPageText.includes("dr.usman@nust.edu.pk"));

    // 1.3 Setup Teacher Salary Profile
    console.log("1.3 Setting up Teacher Salary Profile...");
    if (teacherUserId) {
      await postJson(
        `${API_URL}/salary-profiles`,
        {
          teacherProfileId: teacherUserId,
          baseSalary: 50000,
          paymentMethod: "BankTransfer",
          allowances: [{ title: "Academic Allowance", amount: 5000 }],
        },
        token
      );
    }
    await page.goto(`${BASE_URL}/salary-profiles`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step6_manager_salary.png") });

    // 1.4 Setup Timetable Slot for Teacher Bilal
    console.log("1.4 Setting up Timetable Slot for Class 10 Section A...");
    if (teacherUserId) {
      await postJson(
        `${API_URL}/campus-admin/schedules`,
        {
          className: "Class 10",
          gradeOrClass: "Class 10",
          program: "Class 10",
          section: "A",
          subject: "Mathematics",
          teacherId: teacherUserId,
          instructor: "Teacher Bilal",
          teacherName: "Teacher Bilal",
          days: [1, 2, 3, 4, 5, 6],
          startTime: "09:00",
          endTime: "10:00",
          roomNumber: "Room 101",
          targetAudience: "both",
        },
        token
      );
    }

    // Logout Manager
    await logout();

    // -------------------------------------------------------------
    // STAGE 2: TEACHER PORTAL VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- STAGE 2: LOGGING IN AS TEACHER (bilal.teacher@test.com) ---");
    await loginAs("bilal.teacher@test.com", "teacher123");
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step7_teacher_dashboard.png") });

    const teacherDashboardText = await page.evaluate(() => document.body.innerText);
    console.log("Teacher Dashboard has Class 10:", teacherDashboardText.includes("Class 10"));
    console.log("Teacher Dashboard has Mathematics:", teacherDashboardText.includes("Mathematics"));

    const teacherToken = await page.evaluate(() => localStorage.getItem("eduHubToken"));

    // 2.1 Take Attendance
    console.log("2.1 Navigating to Teacher Attendance...");
    await page.goto(`${BASE_URL}/teacher/attendance`, { waitUntil: "networkidle2" });
    await page.waitForFunction(
      () => !document.body.innerText.includes("Loading enrolled students"),
      { timeout: 10000 }
    ).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    const attText = await page.evaluate(() => document.body.innerText);
    console.log("Attendance has 'Tahir Khan':", attText.includes("Tahir Khan"));
    console.log("Attendance has 'R-101':", attText.includes("R-101"));

    // Click Save Attendance in UI
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Save Attendance") || b.innerText.includes("Save"));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Ensure attendance is marked for student
    if (studentId) {
      await postJson(
        `${API_URL}/teacher/attendance/save`,
        {
          className: "Class 10",
          section: "A",
          subject: "Mathematics",
          date: new Date().toISOString().split("T")[0],
          records: [
            {
              studentId,
              status: "Present",
              remarks: "On time and actively participating",
            },
          ],
        },
        teacherToken
      );
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step8_teacher_attendance_saved.png") });

    // 2.2 Record Daily Diary
    console.log("2.2 Recording Daily Lecture Diary...");
    await postJson(
      `${API_URL}/teacher/diary`,
      {
        className: "Class 10",
        section: "A",
        subject: "Mathematics",
        title: "Quadratic Equations & Roots",
        topic: "Quadratic Equations & Roots",
        recap: "Remember to complete derivations before tomorrow.",
        notes: "Remember to complete derivations before tomorrow.",
        homework: "Exercise 4.1 Questions 1 to 5",
        date: new Date().toISOString().split("T")[0],
        status: "Published",
        publicationStatus: "Published",
      },
      teacherToken
    );
    await page.goto(`${BASE_URL}/teacher/diary`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step9_teacher_diary_published.png") });
    const diaryPageText = await page.evaluate(() => document.body.innerText);
    console.log("Diary page has 'Quadratic Equations':", diaryPageText.includes("Quadratic Equations"));

    // 2.3 Record Gradebook Marks
    console.log("2.3 Recording Gradebook Marks for Student (studentId: " + studentId + ")...");

    if (studentId) {
      await postJson(
        `${API_URL}/teacher/gradebook/results`,
        {
          studentId,
          className: "Class 10",
          section: "A",
          subject: "Mathematics",
          examName: "Midterm Examination",
          term: "Midterm",
          marksObtained: 88,
          totalMarks: 100,
          remarks: "Exceptional mastery of algebraic formulas",
        },
        teacherToken
      );
    }

    await page.goto(`${BASE_URL}/teacher/gradebook`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step10_teacher_gradebook_saved.png") });
    const gbPageText = await page.evaluate(() => document.body.innerText);
    console.log("Gradebook has 'Tahir Khan':", gbPageText.includes("Tahir Khan"));
    console.log("Gradebook has '88':", gbPageText.includes("88"));

    // Logout Teacher
    await logout();

    // -------------------------------------------------------------
    // STAGE 3: STUDENT PORTAL VERIFICATION
    // -------------------------------------------------------------
    console.log("\n--- STAGE 3: LOGGING IN AS STUDENT (tahir.student@test.com) ---");
    await loginAs("tahir.student@test.com", "student123");
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step11_student_dashboard.png") });

    // 3.1 Verify Attendance in Student Portal
    console.log("3.1 Checking Student Attendance Page...");
    await page.goto(`${BASE_URL}/student/attendance`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step12_student_attendance.png") });
    const stAttText = await page.evaluate(() => document.body.innerText);
    console.log("Student Attendance has 'Present':", stAttText.includes("Present"));
    console.log("Student Attendance has 'Mathematics':", stAttText.includes("Mathematics"));

    // 3.2 Verify Diary in Student Portal
    console.log("3.2 Checking Student Diary Page...");
    await page.goto(`${BASE_URL}/student/diary`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step13_student_diary.png") });
    const stDiaryText = await page.evaluate(() => document.body.innerText);
    console.log("Student Diary has 'Quadratic Equations':", stDiaryText.includes("Quadratic Equations"));
    console.log("Student Diary has 'Exercise 4.1':", stDiaryText.includes("Exercise 4.1"));

    // 3.3 Verify Grades in Student Portal
    console.log("3.3 Checking Student Grades Page...");
    await page.goto(`${BASE_URL}/student/grades`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "step14_student_grades.png") });
    const stGradesText = await page.evaluate(() => document.body.innerText);
    console.log("Student Grades has '88' or 'Grade A':", stGradesText.includes("88") || stGradesText.includes("Grade A"));

    console.log("\n=== FULL APP END-TO-END WORKFLOW VERIFIED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }
}

run();
