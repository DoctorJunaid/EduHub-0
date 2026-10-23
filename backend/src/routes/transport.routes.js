import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  assignStudentToRoute,
  getTransportStudents,
  getMyTransport,
  getTransportStats,
  seedTransportPreset,
} from "../controllers/transport.controller.js";

const router = express.Router();

// Require authentication for all transport endpoints
router.use(protect);

/**
 * 4. Visibility endpoint: For students and parents to see their bus, driver, and stop info
 * GET /api/v1/transport/my-transport
 */
router.get("/my-transport", getMyTransport);

// Administrative operations - Campus Admin, Manager, Institute Admin, Super Admin
const adminRoles = [
  "campus_admin",
  "campus_manager",
  "principal",
  "institute_admin",
  "super_admin",
];

// 1. Drivers Management
router
  .route("/drivers")
  .get(authorize(...adminRoles), getDrivers)
  .post(authorize(...adminRoles), createDriver);

router
  .route("/drivers/:id")
  .put(authorize(...adminRoles), updateDriver)
  .delete(authorize(...adminRoles), deleteDriver);

// 2. Vehicles Management
router
  .route("/vehicles")
  .get(authorize(...adminRoles), getVehicles)
  .post(authorize(...adminRoles), createVehicle);

router
  .route("/vehicles/:id")
  .put(authorize(...adminRoles), updateVehicle)
  .delete(authorize(...adminRoles), deleteVehicle);

// 3. Routes Management
router
  .route("/routes")
  .get(authorize(...adminRoles), getRoutes)
  .post(authorize(...adminRoles), createRoute);

router
  .route("/routes/:id")
  .put(authorize(...adminRoles), updateRoute)
  .delete(authorize(...adminRoles), deleteRoute);

// 4. Student Transport Mapping
router.post("/assign-student", authorize(...adminRoles), assignStudentToRoute);
router.get("/students", authorize(...adminRoles), getTransportStudents);
router.get("/stats", authorize(...adminRoles), getTransportStats);
router.post("/seed-preset", authorize(...adminRoles), seedTransportPreset);

export default router;
