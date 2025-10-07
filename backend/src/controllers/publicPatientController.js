const {
  findPatientByNid,
  listPatientDocuments,
  listPatientReports,
  listPatientLabReports,
} = require('../services/patientService');
const { listAppointmentsForPatient } = require('../services/appointmentService');

function sanitizeNid(nid) {
  return String(nid || '').trim();
}

function formatPatientSummary(patient) {
  return {
    id: patient.PatientID,
    fullName: patient.FullName,
    email: patient.Email,
    phoneNumber: patient.PhoneNumber,
    nidNumber: patient.NidNumber,
  };
}

async function getAppointmentsByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  const patient = await findPatientByNid(nid);
  if (!patient) {
    return res.status(404).json({ message: 'No patient found for the provided NID number.' });
  }

  const [appointments, labReports] = await Promise.all([
    listAppointmentsForPatient(patient.PatientID),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  return res.json({
    patient: formatPatientSummary(patient),
    appointments,
    labReports,
  });
}

async function getMedicalHistoryByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  const patient = await findPatientByNid(nid);
  if (!patient) {
    return res.status(404).json({ message: 'No patient found for the provided NID number.' });
  }

  const [documents, doctorReports, labReports] = await Promise.all([
    listPatientDocuments(patient.PatientID, { sort: 'desc' }),
    listPatientReports(patient.PatientID, { sort: 'desc' }),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  const prescriptions = documents.filter((doc) => /prescription/i.test(doc.DocumentName || ''));
  const otherDocuments = documents.filter((doc) => !/prescription/i.test(doc.DocumentName || ''));

  return res.json({
    patient: formatPatientSummary(patient),
    documents: otherDocuments,
    prescriptions,
    doctorReports,
    labReports,
  });
}

async function getAppointmentAssetsByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);
  const appointmentId = Number.parseInt(req.params.appointmentId, 10);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  if (!Number.isInteger(appointmentId)) {
    return res.status(400).json({ message: 'A valid appointment identifier is required.' });
  }

  const patient = await findPatientByNid(nid);
  if (!patient) {
    return res.status(404).json({ message: 'No patient found for the provided NID number.' });
  }

  const appointments = await listAppointmentsForPatient(patient.PatientID);
  const appointment = appointments.find(
    (item) => Number.parseInt(item.AppointmentID, 10) === appointmentId
  );

  if (!appointment) {
    return res
      .status(404)
      .json({ message: 'No appointment was found for this patient using the provided identifier.' });
  }

  const [documents, doctorReports, labReports] = await Promise.all([
    listPatientDocuments(patient.PatientID, { sort: 'desc', appointmentId }),
    listPatientReports(patient.PatientID, { sort: 'desc', appointmentId }),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  return res.json({
    patient: formatPatientSummary(patient),
    appointment,
    documents,
    doctorReports,
    labReports,
  });
}

module.exports = {
  getAppointmentsByNid,
  getMedicalHistoryByNid,
  getAppointmentAssetsByNid,
};
