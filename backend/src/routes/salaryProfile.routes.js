import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/salaryProfile.controller.js';

const router = express.Router();

const readers = ['campus_admin', 'campus_manager', 'institute_admin', 'accountant', 'super_admin', 'admin', 'principal', 'faculty', 'teacher', 'staff'];
const editors = ['campus_admin', 'campus_manager', 'institute_admin', 'super_admin', 'admin', 'principal', 'accountant'];

// Protect all routes with auth middleware
router.use(protect);

// Specific GET routes before param route /:teacherId
router.get(
  '/teachers-without-profile',
  restrictTo(...readers),
  controller.getTeachersWithoutProfile
);

router.get(
  '/my-profile',
  controller.getMyProfile
);

// General list route
router.get('/', restrictTo(...readers), controller.listProfiles);

// Specific action routes BEFORE /:teacherId param route
router.patch('/:teacherId/deactivate', restrictTo(...editors), controller.deactivateProfile);
router.put('/:teacherId/deactivate', restrictTo(...editors), controller.deactivateProfile);
router.post('/:teacherId/deactivate', restrictTo(...editors), controller.deactivateProfile);

router.patch('/:teacherId/activate', restrictTo(...editors), controller.activateProfile);
router.put('/:teacherId/activate', restrictTo(...editors), controller.activateProfile);
router.post('/:teacherId/activate', restrictTo(...editors), controller.activateProfile);

// Single profile routes
router.get('/:teacherId', restrictTo(...readers), controller.getProfile);
router.put('/:teacherId', restrictTo(...editors), controller.upsertProfile);
router.post('/:teacherId', restrictTo(...editors), controller.upsertProfile);

export default router;
