const { getOverviewMetrics } = require('../services/adminService');
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

module.exports = {
  getOverview,
  getDoctorApplications,
  reviewDoctorApplicationHandler,
};
