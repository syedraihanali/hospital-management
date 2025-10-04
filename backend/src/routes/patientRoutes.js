const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  registerPatient,
  getPatients,
  getPatientByIdHandler,
  getUpcomingAppointmentsForPatient,
  getAppointmentHistoryForPatient,
} = require('../controllers/patientController');

const router = Router();

// Patient onboarding and data endpoints.
router.post('/register', asyncHandler(registerPatient));
router.get('/', authenticateToken, authorizeRoles('admin'), asyncHandler(getPatients));
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  asyncHandler(getPatientByIdHandler)
);
router.get(
  '/:id/upcomingAppointments',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(getUpcomingAppointmentsForPatient)
);
router.get(
  '/:id/appointmentHistory',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(getAppointmentHistoryForPatient)
);

module.exports = router;
