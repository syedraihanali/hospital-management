const { execute, transaction } = require('../database/query');

// Retrieves upcoming appointments for a patient.
async function getUpcomingAppointments(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        d.FullName AS doctor,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS startTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS endTime,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN doctors d ON a.DoctorID = d.DoctorID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.PatientID = ? AND at.ScheduleDate >= CURDATE()
      ORDER BY at.ScheduleDate ASC, at.StartTime ASC`,
    [patientId]
  );
}

// Retrieves historical appointments for a patient.
async function getAppointmentHistory(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        d.FullName AS doctor,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS time,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN doctors d ON a.DoctorID = d.DoctorID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.PatientID = ? AND at.ScheduleDate < CURDATE()
      ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [patientId]
  );
}

// Retrieves upcoming appointments for a doctor including patient details.
async function getUpcomingAppointmentsForDoctor(doctorId) {
  return execute(
    `SELECT
        a.AppointmentID,
        p.FullName AS patient,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS startTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS endTime,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN patients p ON a.PatientID = p.PatientID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.DoctorID = ? AND at.ScheduleDate >= CURDATE()
      ORDER BY at.ScheduleDate ASC, at.StartTime ASC`,
    [doctorId]
  );
}

// Lists available appointment slots for a specific doctor.
async function getAvailableTimes(doctorId) {
  return execute(
    `SELECT
        AvailableTimeID,
        DoctorID,
        DATE_FORMAT(ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        TIME_FORMAT(StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(EndTime, '%H:%i') AS EndTime
      FROM available_time
      WHERE DoctorID = ? AND IsAvailable = 1 AND ScheduleDate >= CURDATE()
      ORDER BY ScheduleDate ASC, StartTime ASC`,
    [doctorId]
  );
}

// Books an appointment within a database transaction to avoid double booking.
async function bookAppointment({ patientId, availableTimeId }) {
  return transaction(async (connection) => {
    const [timeSlots] = await connection.execute(
      'SELECT * FROM available_time WHERE AvailableTimeID = ? AND IsAvailable = 1 FOR UPDATE',
      [availableTimeId]
    );
    const timeSlot = timeSlots[0];

    if (!timeSlot) {
      const error = new Error('Selected time slot is no longer available');
      error.statusCode = 400;
      throw error;
    }

    const [appointmentResult] = await connection.execute(
      `INSERT INTO appointments (PatientID, DoctorID, AvailableTimeID, Status)
       VALUES (?, ?, ?, 'pending')`,
      [patientId, timeSlot.DoctorID, availableTimeId]
    );

    await connection.execute('UPDATE available_time SET IsAvailable = 0 WHERE AvailableTimeID = ?', [
      availableTimeId,
    ]);

    return {
      appointmentId: appointmentResult.insertId,
      doctorId: timeSlot.DoctorID,
      scheduleDate: timeSlot.ScheduleDate,
      startTime: timeSlot.StartTime,
      endTime: timeSlot.EndTime,
    };
  });
}

async function createAvailabilitySlots(doctorId, slots) {
  if (!slots.length) {
    return;
  }

  const values = slots.map(({ date, startTime, endTime }) => [doctorId, date, startTime, endTime]);
  await execute(
    `INSERT INTO available_time (DoctorID, ScheduleDate, StartTime, EndTime, IsAvailable)
     VALUES ${values.map(() => '(?, ?, ?, ?, 1)').join(', ')}`,
    values.flat()
  );
}

async function listAppointmentsForDoctor(doctorId) {
  return execute(
    `SELECT
        a.AppointmentID,
        a.Status,
        a.Notes,
        a.CreatedAt,
        p.PatientID,
        p.FullName AS PatientName,
        p.PhoneNumber,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        TIME_FORMAT(at.StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS EndTime
     FROM appointments a
     JOIN patients p ON a.PatientID = p.PatientID
     JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
     WHERE a.DoctorID = ?
     ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [doctorId]
  );
}

async function listAppointmentsForPatient(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        a.Status,
        a.Notes,
        a.CreatedAt,
        d.DoctorID,
        d.FullName AS DoctorName,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        TIME_FORMAT(at.StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS EndTime
     FROM appointments a
     JOIN doctors d ON a.DoctorID = d.DoctorID
     JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
     WHERE a.PatientID = ?
     ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [patientId]
  );
}

async function updateAppointmentStatus(appointmentId, status, notes = null) {
  await execute(
    `UPDATE appointments SET Status = ?, Notes = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE AppointmentID = ?`,
    [status, notes, appointmentId]
  );
}

async function getAppointmentById(appointmentId) {
  const appointments = await execute('SELECT * FROM appointments WHERE AppointmentID = ?', [appointmentId]);
  return appointments[0];
}

async function reopenAvailabilitySlot(availableTimeId) {
  await execute('UPDATE available_time SET IsAvailable = 1 WHERE AvailableTimeID = ?', [availableTimeId]);
}

module.exports = {
  getUpcomingAppointments,
  getAppointmentHistory,
  getAvailableTimes,
  bookAppointment,
  getUpcomingAppointmentsForDoctor,
  createAvailabilitySlots,
  listAppointmentsForDoctor,
  listAppointmentsForPatient,
  updateAppointmentStatus,
  getAppointmentById,
  reopenAvailabilitySlot,
};
