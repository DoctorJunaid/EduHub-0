import express from "express";
import {
  getCampusStudents,
  addStudentToCampus,
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
} from "../controllers/campusAdmin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("campus_admin"));

router.route("/students").get(getCampusStudents).post(addStudentToCampus);

router.route("/teachers").get(getTeachers).post(createTeacher);
router
  .route("/teachers/:id")
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.route("/student-profiles").get(getStudents).post(createStudent);
router
  .route("/student-profiles/:id")
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

router
  .route("/class-schedules")
  .get(getClassSchedules)
  .post(createClassSchedule);
router
  .route("/class-schedules/:id")
  .get(getClassScheduleById)
  .put(updateClassSchedule)
  .delete(deleteClassSchedule);

router.route("/exam-schedules").get(getExamSchedules).post(createExamSchedule);
router
  .route("/exam-schedules/:id")
  .get(getExamScheduleById)
  .put(updateExamSchedule)
  .delete(deleteExamSchedule);

router
  .route("/attendance/teachers")
  .get(getTeacherAttendance)
  .post(createTeacherAttendance);
router
  .route("/attendance/teachers/:id")
  .get(getTeacherAttendanceById)
  .put(updateTeacherAttendance)
  .delete(deleteTeacherAttendance);

router
  .route("/attendance/students")
  .get(getStudentAttendance)
  .post(createStudentAttendance);
router
  .route("/attendance/students/:id")
  .get(getStudentAttendanceById)
  .put(updateStudentAttendance)
  .delete(deleteStudentAttendance);

router.route("/fees").get(getFeeRecords).post(createFeeRecord);
router
  .route("/fees/:id")
  .get(getFeeRecordById)
  .put(updateFeeRecord)
  .delete(deleteFeeRecord);

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
