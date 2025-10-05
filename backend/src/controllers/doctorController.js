const {
  listDoctors,
  getDoctorById,
  createDoctorApplication,
  updateDoctorProfile,
  updateDoctorPassword,
} = require('../services/doctorService');
const {
  getAvailableTimes,
  createAvailabilitySlots,
  listAppointmentsForDoctor,
  listAppointmentsForPatient,
  updateAppointmentStatus,
  getAppointmentById,
  reopenAvailabilitySlot,
  listAvailabilityForDoctorManagement,
  updateAvailabilitySlotStatus,
  hasActiveAppointmentForSlot,
  hasDoctorSeenPatient,
} = require('../services/appointmentService');
const { createDoctorReport } = require('../services/reportService');
const { storeFile } = require('../services/storageService');
const {
  findPatientById,
  listPatientDocuments,
  listPatientReports,
} = require('../services/patientService');

// Returns the catalog of doctors available in the clinic.
async function getDoctors(_req, res) {
  const doctors = await listDoctors();
  return res.json(doctors);
}

// Returns upcoming available time slots for a specific doctor.
async function getDoctorAvailability(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(doctorId)) {
    return res.status(400).json({ message: 'Invalid doctor identifier supplied.' });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found.' });
  }

  const limitParam = req.query.limit;
  const limit = Number.parseInt(limitParam, 10);

  const availability = await getAvailableTimes(doctorId);
  const payload = Number.isNaN(limit) || limit <= 0 ? availability : availability.slice(0, limit);

  return res.json(payload);
}

async function getDoctorAvailabilityForManagement(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);

  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const availability = await listAvailabilityForDoctorManagement(doctorId);
  return res.json(availability);
}

// Provides upcoming appointments for the authenticated doctor.
async function getDoctorAppointments(req, res) {
  const { id } = req.params;

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  if (Number.parseInt(id, 10) !== req.user.id) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const appointments = await listAppointmentsForDoctor(id);
  return res.json(appointments);
}

async function getDoctorProfile(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);
  if (req.user.role === 'doctor' && req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found.' });
  }

  return res.json(doctor);
}

async function applyAsDoctor(req, res) {
  const { fullName, email, phoneNumber, specialization, licenseNumber, nidNumber } = req.body;

  if (!fullName || !email || !phoneNumber || !specialization || !licenseNumber || !nidNumber) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const licenseFile = req.files?.license?.[0];
  const nidFile = req.files?.nid?.[0];

  if (!licenseFile || !nidFile) {
    return res.status(400).json({ message: 'License and NID documents are required.' });
  }

  const licenseDocumentUrl = await storeFile(licenseFile, 'doctor-applications');
  const nidDocumentUrl = await storeFile(nidFile, 'doctor-applications');
  const resumeUrl = await storeFile(req.files?.resume?.[0], 'doctor-applications');

  await createDoctorApplication({
    fullName,
    email,
    phoneNumber,
    specialization,
    licenseNumber,
    nidNumber,
    licenseDocumentUrl,
    nidDocumentUrl,
    resumeUrl,
  });

  return res.status(201).json({ message: 'Application submitted successfully.' });
}

async function addAvailability(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);

  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { slots } = req.body;
  if (!Array.isArray(slots) || !slots.length) {
    return res.status(400).json({ message: 'At least one availability slot is required.' });
  }

  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  const validTime = /^\d{2}:\d{2}$/;

  const sanitizedSlots = slots
    .map((slot) => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }))
    .filter((slot) => validDate.test(slot.date) && validTime.test(slot.startTime) && validTime.test(slot.endTime));

  if (!sanitizedSlots.length) {
    return res.status(400).json({ message: 'Provided availability slots are invalid.' });
  }

  await createAvailabilitySlots(doctorId, sanitizedSlots);
  return res.status(201).json({ message: 'Availability updated successfully.' });
}

async function updateDoctorAvailabilityStatus(req, res) {
  const doctorId = Number.parseInt(req.params.doctorId, 10);
  const slotId = Number.parseInt(req.params.slotId, 10);
  const { isAvailable } = req.body;

  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  if (Number.isNaN(slotId)) {
    return res.status(400).json({ message: 'Invalid availability slot identifier.' });
  }

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({ message: 'The availability status must be provided as a boolean value.' });
  }

  if (!isAvailable) {
    const hasAppointment = await hasActiveAppointmentForSlot(slotId);
    if (hasAppointment) {
      return res
        .status(409)
        .json({ message: 'Cannot mark this slot as unavailable because an appointment is scheduled.' });
    }
  }

  const updatedRows = await updateAvailabilitySlotStatus(slotId, doctorId, isAvailable);

  if (!updatedRows) {
    return res.status(404).json({ message: 'Availability slot not found.' });
  }

  return res.json({
    message: isAvailable ? 'Availability slot restored.' : 'Availability slot marked as unavailable.',
  });
}

async function updateAppointmentStatusHandler(req, res) {
  const doctorId = req.user.id;
  const appointmentId = Number.parseInt(req.params.appointmentId, 10);
  const { status, notes } = req.body;

  if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid appointment status.' });
  }

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment || appointment.DoctorID !== doctorId) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }

  await updateAppointmentStatus(appointmentId, status, notes || appointment.Notes);

  if (status === 'cancelled') {
    await reopenAvailabilitySlot(appointment.AvailableTimeID);
  }

  return res.json({ message: 'Appointment status updated.' });
}

async function uploadAppointmentReport(req, res) {
  const doctorId = req.user.id;
  const appointmentId = Number.parseInt(req.params.appointmentId, 10);
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Report title is required.' });
  }

  const reportFile = req.file;
  if (!reportFile) {
    return res.status(400).json({ message: 'Report file is required.' });
  }

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment || appointment.DoctorID !== doctorId) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }

  const fileUrl = await storeFile(reportFile, 'doctor-reports');

  await createDoctorReport({
    appointmentId,
    doctorId,
    patientId: appointment.PatientID,
    title,
    description,
    fileUrl,
  });

  await updateAppointmentStatus(appointmentId, 'completed', appointment.Notes);

  return res.status(201).json({ message: 'Report uploaded successfully.', fileUrl });
}

async function updateDoctorProfileHandler(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);

  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { fullName, email, phoneNumber, specialization } = req.body;

  if (!fullName || !email || !phoneNumber) {
    return res.status(400).json({ message: 'Full name, email, and phone number are required.' });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found.' });
  }

  const newAvatar = await storeFile(req.file, 'doctor-avatars');
  const avatarUrl = newAvatar || doctor.AvatarUrl;

  await updateDoctorProfile(doctorId, {
    fullName,
    email,
    phoneNumber,
    specialization,
    avatarUrl,
  });

  return res.json({ message: 'Profile updated successfully.', avatarUrl });
}

async function changeDoctorPassword(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);
  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  await updateDoctorPassword(doctorId, newPassword);
  return res.json({ message: 'Password updated successfully.' });
}

async function getPatientHistoryForDoctor(req, res) {
  const doctorId = Number.parseInt(req.params.doctorId, 10);
  const patientId = Number.parseInt(req.params.patientId, 10);

  if (req.user.role !== 'doctor' || req.user.id !== doctorId) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  if (Number.isNaN(patientId)) {
    return res.status(400).json({ message: 'Invalid patient identifier.' });
  }

  const patient = await findPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found.' });
  }

  const hasRelationship = await hasDoctorSeenPatient(doctorId, patientId);
  if (!hasRelationship) {
    return res.status(404).json({ message: 'No appointments found for this patient.' });
  }

  const [appointments, documents, reports] = await Promise.all([
    listAppointmentsForPatient(patientId),
    listPatientDocuments(patientId, { sort: 'desc' }),
    listPatientReports(patientId, { sort: 'desc' }),
  ]);

  return res.json({ patient, appointments, documents, reports });
}

module.exports = {
  getDoctors,
  getDoctorAvailability,
  getDoctorAvailabilityForManagement,
  getDoctorAppointments,
  applyAsDoctor,
  addAvailability,
  updateDoctorAvailabilityStatus,
  updateAppointmentStatusHandler,
  uploadAppointmentReport,
  updateDoctorProfileHandler,
  changeDoctorPassword,
  getDoctorProfile,
  getPatientHistoryForDoctor,
};
