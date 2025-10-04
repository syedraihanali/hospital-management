const { execute } = require('../database/query');

// Retrieves all doctors from the database with their next available appointment slot.
async function listDoctors() {
  return execute(
    `SELECT
        d.DoctorID,
        d.FullName,
        d.MaxPatientNumber,
        d.CurrentPatientNumber,
        (
          SELECT DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d')
          FROM available_time at
          WHERE at.DoctorID = d.DoctorID AND at.IsAvailable = 1 AND at.ScheduleDate >= CURDATE()
          ORDER BY at.ScheduleDate ASC, at.StartTime ASC
          LIMIT 1
        ) AS NextScheduleDate,
        (
          SELECT TIME_FORMAT(at.StartTime, '%H:%i')
          FROM available_time at
          WHERE at.DoctorID = d.DoctorID AND at.IsAvailable = 1 AND at.ScheduleDate >= CURDATE()
          ORDER BY at.ScheduleDate ASC, at.StartTime ASC
          LIMIT 1
        ) AS NextStartTime,
        (
          SELECT TIME_FORMAT(at.EndTime, '%H:%i')
          FROM available_time at
          WHERE at.DoctorID = d.DoctorID AND at.IsAvailable = 1 AND at.ScheduleDate >= CURDATE()
          ORDER BY at.ScheduleDate ASC, at.StartTime ASC
          LIMIT 1
        ) AS NextEndTime,
        (
          SELECT COUNT(*)
          FROM available_time at
          WHERE at.DoctorID = d.DoctorID AND at.IsAvailable = 1 AND at.ScheduleDate >= CURDATE()
        ) AS AvailableSlotCount
      FROM doctors d
      ORDER BY d.FullName ASC`
  );
}

// Finds a doctor by identifier.
async function getDoctorById(doctorId) {
  const doctors = await execute('SELECT * FROM doctors WHERE DoctorID = ?', [doctorId]);
  return doctors[0];
}

// Increments the active patient count for a doctor.
async function incrementDoctorPatientCount(doctorId) {
  await execute('UPDATE doctors SET CurrentPatientNumber = CurrentPatientNumber + 1 WHERE DoctorID = ?', [doctorId]);
}

module.exports = {
  listDoctors,
  getDoctorById,
  incrementDoctorPatientCount,
};
