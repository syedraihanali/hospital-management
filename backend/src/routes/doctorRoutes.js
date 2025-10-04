const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const upload = require('../middleware/upload');
const {
  getDoctors,
  getDoctorAvailability,
  getDoctorAppointments,
  applyAsDoctor,
  addAvailability,
  updateAppointmentStatusHandler,
  uploadAppointmentReport,
  updateDoctorProfileHandler,
  changeDoctorPassword,
  getDoctorProfile,
} = require('../controllers/doctorController');

const router = Router();

// Doctor catalog endpoints.
router.get('/', asyncHandler(getDoctors));
router.post(
  '/apply',
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'nid', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  asyncHandler(applyAsDoctor)
);
router.get('/:id/available-times', asyncHandler(getDoctorAvailability));
router.get(
  '/:id/appointments',
  authenticateToken,
  authorizeRoles('doctor'),
  asyncHandler(getDoctorAppointments)
);
router.get(
  '/:id/profile',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  asyncHandler(getDoctorProfile)
);
router.post(
  '/:id/availability',
  authenticateToken,
  authorizeRoles('doctor'),
  asyncHandler(addAvailability)
);
router.patch(
  '/appointments/:appointmentId/status',
  authenticateToken,
  authorizeRoles('doctor'),
  asyncHandler(updateAppointmentStatusHandler)
);
router.post(
  '/appointments/:appointmentId/report',
  authenticateToken,
  authorizeRoles('doctor'),
  upload.single('report'),
  asyncHandler(uploadAppointmentReport)
);
router.patch(
  '/:id/profile',
  authenticateToken,
  authorizeRoles('doctor'),
  upload.single('avatar'),
  asyncHandler(updateDoctorProfileHandler)
);
router.patch(
  '/:id/password',
  authenticateToken,
  authorizeRoles('doctor'),
  asyncHandler(changeDoctorPassword)
);

module.exports = router;
