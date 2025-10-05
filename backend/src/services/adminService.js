const { execute } = require('../database/query');

async function getOverviewMetrics() {
  const [patientCountRows, doctorCountRows, appointmentCountRows, upcomingAppointmentsRows, upcomingAppointmentsList] =
    await Promise.all([
      execute('SELECT COUNT(*) AS totalPatients FROM patients'),
      execute('SELECT COUNT(*) AS totalDoctors FROM doctors'),
      execute('SELECT COUNT(*) AS totalAppointments FROM appointments'),
      execute(
        `SELECT COUNT(*) AS upcomingAppointments
           FROM appointments a
           JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
           WHERE at.ScheduleDate >= CURDATE()`
      ),
      execute(
        `SELECT
            a.AppointmentID,
            p.FullName AS PatientName,
            d.FullName AS DoctorName,
            CONCAT(at.ScheduleDate, 'T', at.StartTime) AS AppointmentDate
         FROM appointments a
         JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
         JOIN patients p ON a.PatientID = p.PatientID
         JOIN doctors d ON a.DoctorID = d.DoctorID
         WHERE at.ScheduleDate >= CURDATE()
         ORDER BY at.ScheduleDate ASC, at.StartTime ASC
         LIMIT 10`
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
    upcomingAppointmentsList,
  };
}

async function searchDoctorsDirectory(searchTerm = '') {
  const normalized = searchTerm.trim().toLowerCase();
  const like = `%${normalized}%`;

  const doctors = await execute(
    `SELECT
        d.DoctorID,
        d.FullName,
        d.Email,
        d.PhoneNumber,
        IFNULL(d.Specialization, '') AS Specialization,
        d.MaxPatientNumber,
        d.CurrentPatientNumber,
        (SELECT COUNT(*) FROM appointments a WHERE a.DoctorID = d.DoctorID) AS TotalAppointments,
        (SELECT COUNT(*)
           FROM appointments a
           JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
          WHERE a.DoctorID = d.DoctorID AND at.ScheduleDate >= CURDATE()) AS UpcomingAppointments
     FROM doctors d
     WHERE ? = ''
        OR LOWER(d.FullName) LIKE ?
        OR LOWER(d.Email) LIKE ?
        OR LOWER(IFNULL(d.Specialization, '')) LIKE ?
     ORDER BY d.FullName ASC
     LIMIT 50`,
    [normalized, like, like, like]
  );

  return doctors;
}

async function getDoctorProfileForAdmin(doctorId) {
  const doctors = await execute(
    `SELECT
        d.DoctorID,
        d.FullName,
        d.Email,
        d.PhoneNumber,
        d.Specialization,
        d.AvatarUrl,
        d.MaxPatientNumber,
        d.CurrentPatientNumber,
        d.CreatedAt,
        (SELECT COUNT(*) FROM appointments a WHERE a.DoctorID = d.DoctorID) AS TotalAppointments
     FROM doctors d
     WHERE d.DoctorID = ?`,
    [doctorId]
  );

  return doctors[0] || null;
}

async function listDoctorAppointmentsForAdmin(doctorId, scope = 'all') {
  let condition = '';
  if (scope === 'upcoming') {
    condition = 'AND at.ScheduleDate >= CURDATE()';
  } else if (scope === 'history') {
    condition = 'AND at.ScheduleDate < CURDATE()';
  }

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
     WHERE a.DoctorID = ? ${condition}
     ORDER BY at.ScheduleDate ${scope === 'history' ? 'DESC' : 'ASC'}, at.StartTime ${
      scope === 'history' ? 'DESC' : 'ASC'
    }`,
    [doctorId]
  );
}

module.exports = {
  getOverviewMetrics,
  searchDoctorsDirectory,
  getDoctorProfileForAdmin,
  listDoctorAppointmentsForAdmin,
};
