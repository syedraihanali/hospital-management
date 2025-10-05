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

module.exports = {
  getOverview,
  getDoctorApplications,
  reviewDoctorApplicationHandler,
  searchDoctorsDirectoryHandler,
  getDoctorDirectoryProfile,
  getDoctorAppointmentsForAdminHandler,
};
