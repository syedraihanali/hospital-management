const {
  createPatient,
  listPatients,
  findPatientById,
  listPatientDocuments,
  listPatientReports,
  savePatientDocument,
  updatePatientProfile,
  updatePatientPassword,
} = require('../services/patientService');
const { listAppointmentsForPatient } = require('../services/appointmentService');
const { storeFile } = require('../services/storageService');

// Registers a new patient and associates them with a doctor if capacity allows.
async function registerPatient(req, res) {
  const { fullName, birthdate, gender, phoneNumber, email, password, address, nidNumber } = req.body;

  if (!fullName || !birthdate || !gender || !phoneNumber || !email || !password || !address || !nidNumber) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const bangladeshPhoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
  if (!bangladeshPhoneRegex.test(phoneNumber)) {
    return res.status(400).json({ error: 'Phone number must be a valid Bangladeshi number.' });
  }

  try {
    const uploadedRecords = [];
    const files = req.files?.medicalRecords || [];
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const url = await storeFile(file, 'patient-documents');
      uploadedRecords.push({ name: file.originalname, url });
    }

    const patient = await createPatient({
      fullName,
      birthDate: birthdate,
      gender,
      phoneNumber,
      email,
      password,
      address,
      nidNumber,
      documents: uploadedRecords,
    });

    return res.status(201).json({ message: 'Patient registered successfully', patientId: patient.id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    throw error;
  }
}

// Lists all registered patients. Requires authentication via middleware.
async function getPatients(_req, res) {
  const patients = await listPatients();
  return res.json(patients);
}

// Retrieves a single patient record by identifier.
async function getPatientByIdHandler(req, res) {
  const { id } = req.params;

  if (req.user.role === 'patient' && Number.parseInt(id, 10) !== req.user.id) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  if (req.user.role !== 'patient' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const patient = await findPatientById(id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found.' });
  }
  return res.json(patient);
}

async function getPatientDocumentsHandler(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role === 'patient' && req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { search = '', sort = 'desc' } = req.query;
  const documents = await listPatientDocuments(patientId, { search, sort });
  return res.json(documents);
}

async function getPatientReportsHandler(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role === 'patient' && req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { search = '', sort = 'desc' } = req.query;
  const reports = await listPatientReports(patientId, { search, sort });
  return res.json(reports);
}

async function uploadPatientDocumentHandler(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role !== 'patient' || req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Document file is required.' });
  }

  const url = await storeFile(file, 'patient-documents');
  await savePatientDocument(patientId, file.originalname, url);

  return res.status(201).json({ message: 'Document uploaded successfully.', url });
}

async function updatePatientProfileHandler(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role !== 'patient' || req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { fullName, phoneNumber, email, address, nidNumber } = req.body;

  if (!fullName || !phoneNumber || !email || !address || !nidNumber) {
    return res.status(400).json({ message: 'All profile fields are required.' });
  }

  const bangladeshPhoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
  if (!bangladeshPhoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number must be a valid Bangladeshi number.' });
  }

  const existingPatient = await findPatientById(patientId);
  if (!existingPatient) {
    return res.status(404).json({ message: 'Patient not found.' });
  }

  const newAvatar = await storeFile(req.file, 'patient-avatars');
  const avatarUrl = newAvatar || existingPatient.AvatarUrl;

  await updatePatientProfile(patientId, {
    fullName,
    phoneNumber,
    email,
    address,
    nidNumber,
    avatarUrl,
  });

  return res.json({ message: 'Profile updated successfully.', avatarUrl });
}

async function changePatientPasswordHandler(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role !== 'patient' || req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  await updatePatientPassword(patientId, newPassword);
  return res.json({ message: 'Password updated successfully.' });
}

async function getPatientTimeline(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (req.user.role !== 'patient' || req.user.id !== patientId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const [appointments, documents, reports] = await Promise.all([
    listAppointmentsForPatient(patientId),
    listPatientDocuments(patientId),
    listPatientReports(patientId),
  ]);

  return res.json({ appointments, documents, reports });
}

module.exports = {
  registerPatient,
  getPatients,
  getPatientByIdHandler,
  getPatientDocumentsHandler,
  getPatientReportsHandler,
  uploadPatientDocumentHandler,
  updatePatientProfileHandler,
  changePatientPasswordHandler,
  getPatientTimeline,
};
