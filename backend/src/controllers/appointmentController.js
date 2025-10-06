const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getAvailableTimes, bookAppointment } = require('../services/appointmentService');
const { createPatient, savePatientDocument } = require('../services/patientService');
const { storeFile } = require('../services/storageService');
async function getAvailableTimesHandler(req, res) {
  const doctorIdParam = req.query.doctorId;
  const doctorId = Number.parseInt(doctorIdParam, 10);

  if (Number.isNaN(doctorId)) {
    return res.status(400).json({ error: 'A valid doctorId query parameter is required.' });
  }

  const availableTimes = await getAvailableTimes(doctorId);
  return res.json(availableTimes);
}

function validateGuestPayload(payload) {
  const requiredFields = [
    'fullName',
    'birthdate',
    'gender',
    'phoneNumber',
    'email',
    'password',
    'address',
    'nidNumber',
  ];

  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    const error = new Error(`Field ${missingField} is required.`);
    error.statusCode = 400;
    throw error;
  }

  const bangladeshPhoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
  if (!bangladeshPhoneRegex.test(payload.phoneNumber)) {
    const error = new Error('Phone number must be a valid Bangladeshi number.');
    error.statusCode = 400;
    throw error;
  }
}

async function persistDocuments(patientId, appointmentId, files = []) {
  if (!files.length) {
    return [];
  }

  const stored = [];
  for (const file of files) {
    const url = await storeFile(file, 'patient-documents');
    if (url) {
      stored.push({ name: file.originalname, url });
      await savePatientDocument(patientId, file.originalname, url, appointmentId);
    }
  }

  return stored;
}
async function bookAppointmentHandler(req, res) {
  const { availableTimeID, notes = '' } = req.body;
  const slotId = Number.parseInt(availableTimeID, 10);

  if (Number.isNaN(slotId)) {
    return res.status(400).json({ error: 'availableTimeID is required.' });
  }

  const files = req.files || [];

  if (req.user) {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can book appointments.' });
    }

    const appointment = await bookAppointment({
      patientId: req.user.id,
      availableTimeId: slotId,
      notes,
    });

    await persistDocuments(req.user.id, appointment.appointmentId, files);

    return res.json({
      message: 'Appointment booked successfully',
      appointment: {
        AppointmentID: appointment.appointmentId,
        DoctorID: appointment.doctorId,
        ScheduleDate: appointment.scheduleDate,
        StartTime: appointment.startTime,
        EndTime: appointment.endTime,
        Status: 'pending',
        Notes: appointment.notes,
      },
    });
  }

  try {
    validateGuestPayload(req.body);
  } catch (error) {
    return res
      .status(error.statusCode || 400)
      .json({ error: error.message || 'Invalid booking request.' });
  }

  const patient = await createPatient({
    fullName: req.body.fullName,
    birthDate: req.body.birthdate,
    gender: req.body.gender,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    password: req.body.password,
    address: req.body.address,
    nidNumber: req.body.nidNumber,
    documents: [],
  });

  const appointment = await bookAppointment({
    patientId: patient.id,
    availableTimeId: slotId,
    notes,
  });

  await persistDocuments(patient.id, appointment.appointmentId, files);

  const tokenPayload = {
    userId: patient.userId,
    id: patient.id,
    role: 'patient',
    email: patient.email,
    ...(patient.fullName ? { fullName: patient.fullName } : {}),
  };

  const token = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  return res.status(201).json({
    message: 'Account created and appointment booked successfully',
    token,
    user: {
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      role: 'patient',
    },
    appointment: {
      AppointmentID: appointment.appointmentId,
      DoctorID: appointment.doctorId,
      ScheduleDate: appointment.scheduleDate,
      StartTime: appointment.startTime,
      EndTime: appointment.endTime,
      Status: 'pending',
      Notes: appointment.notes,
    },
  });
}

module.exports = {
  getAvailableTimesHandler,
  bookAppointmentHandler,
};
