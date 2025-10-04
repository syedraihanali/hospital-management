const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  getAvailableTimesForPatient,
  bookAppointmentForPatient,
} = require('../controllers/appointmentController');

const router = Router();

// Appointment scheduling endpoints.
router.get(
  '/available-times',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(getAvailableTimesForPatient)
);
router.post(
  '/book',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(bookAppointmentForPatient)
);

module.exports = router;
