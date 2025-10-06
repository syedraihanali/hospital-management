const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const upload = require('../middleware/upload');
const {
  registerPatient,
  getPatients,
  getPatientByIdHandler,
  getPatientDocumentsHandler,
  getPatientReportsHandler,
  uploadPatientDocumentHandler,
  updatePatientProfileHandler,
  changePatientPasswordHandler,
  getPatientTimeline,
} = require('../controllers/patientController');

const router = Router();

router.post('/register', upload.array('medicalRecords', 6), asyncHandler(registerPatient));
router.get('/', authenticateToken, authorizeRoles('admin'), asyncHandler(getPatients));
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  asyncHandler(getPatientByIdHandler)
);
router.get(
  '/:id/documents',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  asyncHandler(getPatientDocumentsHandler)
);
router.get(
  '/:id/reports',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  asyncHandler(getPatientReportsHandler)
);
router.post(
  '/:id/documents',
  authenticateToken,
  authorizeRoles('patient'),
  upload.single('document'),
  asyncHandler(uploadPatientDocumentHandler)
);
router.patch(
  '/:id/profile',
  authenticateToken,
  authorizeRoles('patient'),
  upload.single('avatar'),
  asyncHandler(updatePatientProfileHandler)
);
router.patch(
  '/:id/password',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(changePatientPasswordHandler)
);
router.get(
  '/:id/timeline',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(getPatientTimeline)
);

module.exports = router;
