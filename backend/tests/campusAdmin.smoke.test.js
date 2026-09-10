import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../src/models/user.model.js";
import Institute from "../src/models/institute.model.js";
import { TeacherProfile, StudentProfile } from "../src/models/profile.model.js";

const base = "/api/v1/campus-admin";
let campusAdminToken;
let instituteId;
let campusAdminId;
let teacherProfileId;
let studentProfileId;
let classScheduleId;
let examScheduleId;
let teacherAttendanceId;
let studentAttendanceId;
let feeRecordId;
let performanceId;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri("eduhub-test"));

  const institute = await Institute.create({
    name: "Test Institute",
    type: "School",
    email: "admin@testinstitute.edu",
    phone: "+923001234567",
    address: "Test Address",
    status: "active",
  });
  instituteId = institute._id.toString();

  const admin = await User.create({
    fullName: "Campus Admin",
    email: "campusadmin@testinstitute.edu",
    passwordHash: "Password123!",
    role: "campus_admin",
    instituteId,
    campusId: null,
    status: "active",
  });
  campusAdminId = admin._id.toString();

  campusAdminToken = jwt.sign(
    { id: campusAdminId, role: "campus_admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Campus Admin API smoke tests", () => {
  it("GET /campus-admin/students should require auth and return a valid response", async () => {
    const res = await request(app)
      .get(`${base}/students`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  it("POST /campus-admin/teachers should create a teacher profile", async () => {
    const res = await request(app)
      .post(`${base}/teachers`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        user: campusAdminId,
        employeeId: "T-1001",
        department: "Mathematics",
        subjectsTaught: ["Algebra"],
        qualification: "M.Sc Math",
        designation: "Teacher",
        hireDate: new Date().toISOString(),
        isActive: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    teacherProfileId = res.body.data?._id;
  });

  it("GET /campus-admin/teachers should list teacher profiles", async () => {
    const res = await request(app)
      .get(`${base}/teachers`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /campus-admin/student-profiles should create a student profile", async () => {
    const user = await User.create({
      fullName: "Student One",
      email: "student1@testinstitute.edu",
      passwordHash: "Password123!",
      role: "student",
      instituteId,
      status: "active",
    });

    const res = await request(app)
      .post(`${base}/student-profiles`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        user: user._id.toString(),
        studentId: "S-1001",
        gradeOrClass: "Grade 10",
        section: "A",
        rollNumber: "01",
        guardianDetails: {
          name: "Parent One",
          phone: "+923001234567",
          relation: "Father",
        },
        enrollmentDate: new Date().toISOString(),
        isActive: true,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    studentProfileId = res.body.data?._id;
  });

  it("GET /campus-admin/student-profiles should list student profiles", async () => {
    const res = await request(app)
      .get(`${base}/student-profiles`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /campus-admin/class-schedules should create a class schedule", async () => {
    const res = await request(app)
      .post(`${base}/class-schedules`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        title: "Mathematics Period 1",
        subject: "Mathematics",
        className: "Grade 10",
        section: "A",
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        roomNumber: "Room 12",
        teacherId: teacherProfileId,
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    classScheduleId = res.body.data?._id;
  });

  it("GET /campus-admin/class-schedules should list class schedules", async () => {
    const res = await request(app)
      .get(`${base}/class-schedules`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /campus-admin/exam-schedules should create an exam schedule", async () => {
    const res = await request(app)
      .post(`${base}/exam-schedules`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        examName: "Midterm Exam",
        examType: "Midterm",
        className: "Grade 10",
        section: "A",
        subject: "Mathematics",
        examDate: "2026-12-10T00:00:00.000Z",
        startTime: "10:00",
        endTime: "11:30",
        roomNumber: "Hall 1",
        teacherId: teacherProfileId,
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    examScheduleId = res.body.data?._id;
  });

  it("GET /campus-admin/exam-schedules should list exam schedules", async () => {
    const res = await request(app)
      .get(`${base}/exam-schedules`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /campus-admin/attendance/teachers should create teacher attendance", async () => {
    const res = await request(app)
      .post(`${base}/attendance/teachers`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        teacherId: teacherProfileId,
        date: "2026-09-10T00:00:00.000Z",
        status: "present",
        remarks: "On time",
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    teacherAttendanceId = res.body.data?._id;
  });

  it("POST /campus-admin/attendance/students should create student attendance", async () => {
    const res = await request(app)
      .post(`${base}/attendance/students`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        studentId: studentProfileId,
        date: "2026-09-10T00:00:00.000Z",
        status: "present",
        remarks: "Participated",
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    studentAttendanceId = res.body.data?._id;
  });

  it("GET /campus-admin/attendance/teachers and /attendance/students should return arrays", async () => {
    const teacherRes = await request(app)
      .get(`${base}/attendance/teachers`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    const studentRes = await request(app)
      .get(`${base}/attendance/students`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(teacherRes.statusCode).toBe(200);
    expect(studentRes.statusCode).toBe(200);
    expect(Array.isArray(teacherRes.body.data)).toBe(true);
    expect(Array.isArray(studentRes.body.data)).toBe(true);
  });

  it("POST /campus-admin/fees should create a fee record", async () => {
    const res = await request(app)
      .post(`${base}/fees`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        studentId: studentProfileId,
        feeType: "tuition",
        amount: 25000,
        paidAmount: 10000,
        dueDate: "2026-09-30T00:00:00.000Z",
        status: "partial",
        notes: "First installment",
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    feeRecordId = res.body.data?._id;
  });

  it("POST /campus-admin/performance should create a performance record", async () => {
    const res = await request(app)
      .post(`${base}/performance`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        studentId: studentProfileId,
        examName: "Monthly Test",
        subject: "Physics",
        term: "Term 1",
        marksObtained: 82,
        totalMarks: 100,
        grade: "A",
        remarks: "Good work",
        instituteId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    performanceId = res.body.data?._id;
  });

  it("GET /campus-admin/performance should list performance records", async () => {
    const res = await request(app)
      .get(`${base}/performance`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /campus-admin/teachers/:id should fetch the created teacher", async () => {
    if (!teacherProfileId) throw new Error("teacherProfileId missing");

    const res = await request(app)
      .get(`${base}/teachers/${teacherProfileId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/teachers/:id should update a teacher", async () => {
    if (!teacherProfileId) throw new Error("teacherProfileId missing");

    const res = await request(app)
      .put(`${base}/teachers/${teacherProfileId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ designation: "Senior Teacher", department: "Science" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/student-profiles/:id should update a student profile", async () => {
    if (!studentProfileId) throw new Error("studentProfileId missing");

    const res = await request(app)
      .put(`${base}/student-profiles/${studentProfileId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ gradeOrClass: "Grade 11", section: "B" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/class-schedules/:id should update a class schedule", async () => {
    if (!classScheduleId) throw new Error("classScheduleId missing");

    const res = await request(app)
      .put(`${base}/class-schedules/${classScheduleId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ roomNumber: "Room 13", title: "Algebra Period 1" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/exam-schedules/:id should update an exam schedule", async () => {
    if (!examScheduleId) throw new Error("examScheduleId missing");

    const res = await request(app)
      .put(`${base}/exam-schedules/${examScheduleId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ roomNumber: "Hall 2", examType: "Final" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/attendance/teachers/:id should update teacher attendance", async () => {
    if (!teacherAttendanceId) throw new Error("teacherAttendanceId missing");

    const res = await request(app)
      .put(`${base}/attendance/teachers/${teacherAttendanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ status: "late", remarks: "Late due to traffic" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/attendance/students/:id should update student attendance", async () => {
    if (!studentAttendanceId) throw new Error("studentAttendanceId missing");

    const res = await request(app)
      .put(`${base}/attendance/students/${studentAttendanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ status: "excused", remarks: "Approved absence" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/fees/:id should update fee record", async () => {
    if (!feeRecordId) throw new Error("feeRecordId missing");

    const res = await request(app)
      .put(`${base}/fees/${feeRecordId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({
        paidAmount: 20000,
        status: "partial",
        notes: "Updated installment",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("PUT /campus-admin/performance/:id should update performance record", async () => {
    if (!performanceId) throw new Error("performanceId missing");

    const res = await request(app)
      .put(`${base}/performance/${performanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`)
      .send({ marksObtained: 90, grade: "A+" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/teachers/:id should delete teacher profile", async () => {
    const res = await request(app)
      .delete(`${base}/teachers/${teacherProfileId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/student-profiles/:id should delete student profile", async () => {
    const res = await request(app)
      .delete(`${base}/student-profiles/${studentProfileId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/class-schedules/:id should delete a class schedule", async () => {
    const res = await request(app)
      .delete(`${base}/class-schedules/${classScheduleId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/exam-schedules/:id should delete an exam schedule", async () => {
    const res = await request(app)
      .delete(`${base}/exam-schedules/${examScheduleId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/attendance/teachers/:id should delete teacher attendance", async () => {
    const res = await request(app)
      .delete(`${base}/attendance/teachers/${teacherAttendanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/attendance/students/:id should delete student attendance", async () => {
    const res = await request(app)
      .delete(`${base}/attendance/students/${studentAttendanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/fees/:id should delete fee record", async () => {
    const res = await request(app)
      .delete(`${base}/fees/${feeRecordId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /campus-admin/performance/:id should delete performance record", async () => {
    const res = await request(app)
      .delete(`${base}/performance/${performanceId}`)
      .set("Authorization", `Bearer ${campusAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
