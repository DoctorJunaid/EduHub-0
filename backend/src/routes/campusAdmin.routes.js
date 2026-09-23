import express from "express";
import {
  getCampusStudents,
  addStudentToCampus,
  createStudentForCampus,
  removeStudentFromCampus,
  updateStudentInCampus,
  getCampusFaculty,
  createFacultyForCampus,
  removeFacultyFromCampus,
  updateFacultyInCampus,
} from "../controllers/campusStudent.controller.js";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createClassSchedule,
  getClassSchedules,
  getClassScheduleById,
  updateClassSchedule,
  deleteClassSchedule,
  createExamSchedule,
  getExamSchedules,
  getExamScheduleById,
  updateExamSchedule,
  deleteExamSchedule,
  createTeacherAttendance,
  getTeacherAttendance,
  getTeacherAttendanceById,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  createStudentAttendance,
  getStudentAttendance,
  getStudentAttendanceById,
  updateStudentAttendance,
  deleteStudentAttendance,
  createFeeRecord,
  getFeeRecords,
  getStudentPayments,
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
  getPendingPayments,
  getFeePayments,
  recordPayment,
  confirmPayment,
  rejectPayment,
  generateMonthlyFees,
  getFeeStructures,
  saveFeeStructure,
  deleteFeeStructure,
  createPerformanceRecord,
  getPerformanceRecords,
  getPerformanceRecordById,
  updatePerformanceRecord,
  deletePerformanceRecord,
  getDashboardStats,
  createBulkStudentAttendance,
  getActivityLogs,
  createActivityLogEntry,
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
} from "../controllers/campusAdmin.controller.js";
import { validateStudentId } from "../middleware/campusStudent.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("campus_admin", "campus_manager"));

// Real-time Aggregated Campus / School Dashboard Statistics
router.get("/dashboard/stats", getDashboardStats);

router
  .route("/students")
  .get(getCampusStudents)
  .post(validateStudentId, addStudentToCampus);

router.post("/students/new", createStudentForCampus);
router.delete("/students/:id", removeStudentFromCampus);
router.put("/students/:id", updateStudentInCampus);
router.get("/students/:id/payments", getStudentPayments);

router.route("/faculty").get(getCampusFaculty);

router.post("/faculty/new", createFacultyForCampus);
router.delete("/faculty/:id", removeFacultyFromCampus);
router.put("/faculty/:id", updateFacultyInCampus);

// Teachers & Staff Profiles
router.route("/teachers").get(getTeachers).post(createTeacher);
router
  .route("/teachers/:id")
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

// Class Schedules & Routines (School Periods)
router.route("/schedules").get(getClassSchedules).post(createClassSchedule);
router
  .route("/schedules/:id")
  .get(getClassScheduleById)
  .put(updateClassSchedule)
  .delete(deleteClassSchedule);

// Timetables alias (for timetable matrix & schedules - supports plural and singular)
router.route("/timetables").get(getClassSchedules).post(createClassSchedule);
router
  .route("/timetables/:id")
  .get(getClassScheduleById)
  .put(updateClassSchedule)
  .delete(deleteClassSchedule);

router.route("/timetable").get(getClassSchedules).post(createClassSchedule);
router
  .route("/timetable/:id")
  .get(getClassScheduleById)
  .put(updateClassSchedule)
  .delete(deleteClassSchedule);

// Examination Schedules
router.route("/exams").get(getExamSchedules).post(createExamSchedule);
router
  .route("/exams/:id")
  .get(getExamScheduleById)
  .put(updateExamSchedule)
  .delete(deleteExamSchedule);

// Teacher Attendance
router
  .route("/attendance/teachers")
  .get(getTeacherAttendance)
  .post(createTeacherAttendance);
router
  .route("/attendance/teachers/:id")
  .get(getTeacherAttendanceById)
  .put(updateTeacherAttendance)
  .delete(deleteTeacherAttendance);

// Student Attendance
router
  .route("/attendance/students")
  .get(getStudentAttendance)
  .post(createStudentAttendance);
router.post("/attendance/students/bulk", createBulkStudentAttendance);
router
  .route("/attendance/students/:id")
  .get(getStudentAttendanceById)
  .put(updateStudentAttendance)
  .delete(deleteStudentAttendance);

// Fee Records & School Monthly Fee System
router.post("/fees/generate-monthly", generateMonthlyFees);
router.route("/fees/structures").get(getFeeStructures).post(saveFeeStructure);
router.delete("/fees/structures/:id", deleteFeeStructure);
router.route("/fees").get(getFeeRecords).post(createFeeRecord);
router.route("/fees/:id")
  .get(getFeeRecordById)
  .put(updateFeeRecord)
  .delete(deleteFeeRecord);
router.get("/fees/payments/pending", getPendingPayments);
router.route("/fees/:id/payments").get(getFeePayments).post(recordPayment);
router.post("/fees/payments/:paymentId/confirm", confirmPayment);
router.post("/fees/payments/:paymentId/reject", rejectPayment);

// Performance / Exam Results Records
router
  .route("/performance")
  .get(getPerformanceRecords)
  .post(createPerformanceRecord);
router
  .route("/performance/:id")
  .get(getPerformanceRecordById)
  .put(updatePerformanceRecord)
  .delete(deletePerformanceRecord);

// Activity Logs (Audit Trail)
router.route("/activity-logs").get(getActivityLogs).post(createActivityLogEntry);

// Assignments (Campus-admin created, teacher/student visible)
router.route("/assignments").get(getAssignments).post(createAssignment);
router
  .route("/assignments/:id")
  .get(getAssignmentById)
  .put(updateAssignment)
  .delete(deleteAssignment);
router.post("/assignments/:id/submit", submitAssignment);
router.post("/assignments/:id/grade", gradeAssignmentSubmission);

export default router;
