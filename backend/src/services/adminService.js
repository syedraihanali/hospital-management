const { execute } = require('../database/query');

async function getOverviewMetrics() {
  const [patientCountRows, doctorCountRows, appointmentCountRows, upcomingAppointmentsRows] = await Promise.all([
    execute('SELECT COUNT(*) AS totalPatients FROM patients'),
    execute('SELECT COUNT(*) AS totalDoctors FROM doctors'),
    execute('SELECT COUNT(*) AS totalAppointments FROM appointments'),
    execute(
      `SELECT COUNT(*) AS upcomingAppointments
         FROM appointments a
         JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
         WHERE at.ScheduleDate >= CURDATE()`
    ),
  ]);

  const patientCountRow = patientCountRows[0] || {};
  const doctorCountRow = doctorCountRows[0] || {};
  const appointmentCountRow = appointmentCountRows[0] || {};
  const upcomingAppointmentsRow = upcomingAppointmentsRows[0] || {};

  const topDoctors = await execute(
    `SELECT DoctorID, FullName, CurrentPatientNumber, MaxPatientNumber
       FROM doctors
       ORDER BY CurrentPatientNumber DESC, FullName ASC
       LIMIT 5`
  );

  const recentPatients = await execute(
    `SELECT PatientID, FullName, Email, PhoneNumber
       FROM patients
       ORDER BY PatientID DESC
       LIMIT 5`
  );

  return {
    metrics: {
      totalPatients: patientCountRow.totalPatients || 0,
      totalDoctors: doctorCountRow.totalDoctors || 0,
      totalAppointments: appointmentCountRow.totalAppointments || 0,
      upcomingAppointments: upcomingAppointmentsRow.upcomingAppointments || 0,
    },
    topDoctors,
    recentPatients,
  };
}

module.exports = {
  getOverviewMetrics,
};
