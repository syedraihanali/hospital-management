const {
  getOverviewMetrics,
  searchDoctorsDirectory,
  getDoctorProfileForAdmin,
  listDoctorAppointmentsForAdmin,
} = require('../services/adminService');
const {
  listDoctorApplications,
  reviewDoctorApplication,
  createDoctorFromApplication,
} = require('../services/doctorService');
const { findPatientById } = require('../services/patientService');
const { createLabReport } = require('../services/reportService');
const { getServicePackageById } = require('../services/contentService');
const { storeFile } = require('../services/storageService');

async function getOverview(_req, res) {
  const overview = await getOverviewMetrics();
  return res.json(overview);
}

async function getDoctorApplications(req, res) {
  const { status = 'pending' } = req.query;
  const applications = await listDoctorApplications(status);
  return res.json(applications);
}

async function reviewDoctorApplicationHandler(req, res) {
  const applicationId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(applicationId)) {
    return res.status(400).json({ message: 'Invalid application identifier.' });
  }

  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  const reviewerUserId = req.user?.userId || null;
  await reviewDoctorApplication({ applicationId, status, reviewerUserId, notes });

  let doctorId = null;
  if (status === 'approved') {
    doctorId = await createDoctorFromApplication(applicationId);
  }

  return res.json({ message: 'Application reviewed successfully.', doctorId });
}

async function searchDoctorsDirectoryHandler(req, res) {
  const { search = '' } = req.query;
  const doctors = await searchDoctorsDirectory(search);
  return res.json(doctors);
}

async function getDoctorDirectoryProfile(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(doctorId)) {
    return res.status(400).json({ message: 'Invalid doctor identifier.' });
  }

  const doctor = await getDoctorProfileForAdmin(doctorId);
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found.' });
  }

  return res.json(doctor);
}

async function getDoctorAppointmentsForAdminHandler(req, res) {
  const doctorId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(doctorId)) {
    return res.status(400).json({ message: 'Invalid doctor identifier.' });
  }

  const scope = ['upcoming', 'history', 'all'].includes(req.query.scope) ? req.query.scope : 'all';
  const appointments = await listDoctorAppointmentsForAdmin(doctorId, scope);
  return res.json(appointments);
}

async function sendLabReportToPatient(req, res) {
  const patientId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(patientId)) {
    return res.status(400).json({ message: 'Invalid patient identifier.' });
  }

  const patient = await findPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found.' });
  }

  const { title, description = '', testName = '', baseCharge, packageId: rawPackageId } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Report title is required.' });
  }

  const baseChargeValue = Number.parseFloat(baseCharge);
  if (!Number.isFinite(baseChargeValue) || baseChargeValue <= 0) {
    return res.status(400).json({ message: 'A valid base charge is required for the lab report.' });
  }

  let normalizedPackageId = null;
  let discountRate = 0;

  if (rawPackageId) {
    const parsedPackageId = Number.parseInt(rawPackageId, 10);
    if (!Number.isNaN(parsedPackageId)) {
      const servicePackage = await getServicePackageById(parsedPackageId);
      if (!servicePackage) {
        return res.status(400).json({ message: 'Selected package could not be found.' });
      }
      normalizedPackageId = servicePackage.id;
      const packageValue = Number.parseFloat(servicePackage.totalPrice ?? servicePackage.originalPrice ?? 0) || 0;
      const packageDiscounted = Number.parseFloat(servicePackage.discountedPrice ?? 0) || 0;
      discountRate = packageValue > 0 ? Math.max(0, Math.min(1, 1 - packageDiscounted / packageValue)) : 0;
    }
  }

  const discountAmount = Number.parseFloat((baseChargeValue * discountRate).toFixed(2));
  const finalCharge = Number.parseFloat((baseChargeValue - discountAmount).toFixed(2));

  const reportFile = req.file;
  if (!reportFile) {
    return res.status(400).json({ message: 'A lab report file is required.' });
  }

  const fileUrl = await storeFile(reportFile, 'lab-reports');

  await createLabReport({
    patientId,
    adminId: req.user.id,
    title,
    description,
    fileUrl,
    testName,
    packageId: normalizedPackageId,
    baseCharge: baseChargeValue,
    discountAmount,
    finalCharge,
  });

  return res.status(201).json({
    message: 'Lab report shared with the patient.',
    fileUrl,
    discountAmount,
    finalCharge,
  });
}

module.exports = {
  getOverview,
  getDoctorApplications,
  reviewDoctorApplicationHandler,
  searchDoctorsDirectoryHandler,
  getDoctorDirectoryProfile,
  getDoctorAppointmentsForAdminHandler,
  sendLabReportToPatient,
};
