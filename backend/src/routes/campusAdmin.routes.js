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
  getFeeRecordById,
  updateFeeRecord,
  deleteFeeRecord,
  createPerformanceRecord,
  getPerformanceRecords,
  getPerformanceRecordById,
  updatePerformanceRecord,
  deletePerformanceRecord,
  getDashboardStats,
  createBulkStudentAttendance,
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

// Fee Records
router.route("/fees").get(getFeeRecords).post(createFeeRecord);
router
  .route("/fees/:id")
  .get(getFeeRecordById)
  .put(updateFeeRecord)
  .delete(deleteFeeRecord);

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

export default router;
