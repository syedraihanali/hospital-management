const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateOptional = require('../middleware/authenticateOptional');
const upload = require('../middleware/upload');
const {
  getAvailableTimesHandler,
  bookAppointmentHandler,
} = require('../controllers/appointmentController');

const router = Router();

// Appointment scheduling endpoints.
router.get('/available-times', authenticateOptional, asyncHandler(getAvailableTimesHandler));
router.post(
  '/book',
  authenticateOptional,
  upload.array('documents', 5),
  asyncHandler(bookAppointmentHandler)
);

module.exports = router;
