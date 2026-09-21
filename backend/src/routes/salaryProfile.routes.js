import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/salaryProfile.controller.js';

const router = express.Router();

const readers = ['campus_admin', 'campus_manager', 'institute_admin', 'accountant', 'super_admin', 'admin'];
const editors = ['campus_admin', 'campus_manager', 'institute_admin', 'super_admin', 'admin'];

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
  restrictTo('teacher', 'faculty'),
  controller.getMyProfile
);

// General list route
router.get('/', restrictTo(...readers), controller.listProfiles);

// Single profile routes
router.get('/:teacherId', restrictTo(...readers), controller.getProfile);
router.put('/:teacherId', restrictTo(...editors), controller.upsertProfile);
router.patch('/:teacherId/deactivate', restrictTo(...editors), controller.deactivateProfile);
router.patch('/:teacherId/activate', restrictTo(...editors), controller.activateProfile);

export default router;
