const { listDoctors } = require('../services/doctorService');
const { getUpcomingAppointmentsForDoctor } = require('../services/appointmentService');

// Returns the catalog of doctors available in the clinic.
async function getDoctors(_req, res) {
  const doctors = await listDoctors();
  return res.json(doctors);
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

  const appointments = await getUpcomingAppointmentsForDoctor(id);
  return res.json(appointments);
}

module.exports = {
  getDoctors,
  getDoctorAppointments,
};
