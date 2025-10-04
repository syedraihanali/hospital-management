const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getDoctors, getDoctorAppointments } = require('../controllers/doctorController');

const router = Router();

// Doctor catalog endpoints.
router.get('/', asyncHandler(getDoctors));
router.get(
  '/:id/appointments',
  authenticateToken,
  authorizeRoles('doctor'),
  asyncHandler(getDoctorAppointments)
);

module.exports = router;
