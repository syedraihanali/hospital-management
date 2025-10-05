const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  getAppointmentsByNid,
  getMedicalHistoryByNid,
  getAppointmentAssetsByNid,
} = require('../controllers/publicPatientController');

const router = Router();

router.get('/appointments', asyncHandler(getAppointmentsByNid));
router.get('/medical-history', asyncHandler(getMedicalHistoryByNid));
router.get('/appointments/:appointmentId/assets', asyncHandler(getAppointmentAssetsByNid));

module.exports = router;
