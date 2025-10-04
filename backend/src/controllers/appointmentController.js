const { getAvailableTimes, bookAppointment } = require('../services/appointmentService');

// Lists available appointment slots for the authenticated patient.
async function getAvailableTimesForPatient(req, res) {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can view available times.' });
  }

  const doctorIdParam = req.query.doctorId;
  const doctorId = Number.parseInt(doctorIdParam, 10);

  if (Number.isNaN(doctorId)) {
    return res.status(400).json({ error: 'A valid doctorId query parameter is required.' });
  }

  const availableTimes = await getAvailableTimes(doctorId);
  return res.json(availableTimes);
}

// Books an appointment for the authenticated patient using a transactional workflow.
async function bookAppointmentForPatient(req, res) {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can book appointments.' });
  }

  const patientId = req.user.id;
  const { availableTimeID } = req.body;
  const slotId = Number.parseInt(availableTimeID, 10);

  if (Number.isNaN(slotId)) {
    return res.status(400).json({ error: 'availableTimeID is required.' });
  }

  const appointment = await bookAppointment({ patientId, availableTimeId: slotId });

  return res.json({
    message: 'Appointment booked successfully',
    appointment: {
      AppointmentID: appointment.appointmentId,
      DoctorID: appointment.doctorId,
      ScheduleDate: appointment.scheduleDate,
      StartTime: appointment.startTime,
      EndTime: appointment.endTime,
      Status: 'pending',
    },
  });
}

module.exports = {
  getAvailableTimesForPatient,
  bookAppointmentForPatient,
};
