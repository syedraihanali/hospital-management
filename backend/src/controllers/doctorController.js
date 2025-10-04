const { listDoctors, getDoctorById } = require('../services/doctorService');
const { getUpcomingAppointmentsForDoctor, getAvailableTimes } = require('../services/appointmentService');

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
  getDoctorAvailability,
  getDoctorAppointments,
};
