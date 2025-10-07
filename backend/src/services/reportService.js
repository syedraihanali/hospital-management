const { execute } = require('../database/query');

async function createDoctorReport({ appointmentId, doctorId, patientId, title, description, fileUrl }) {
  await execute(
    `INSERT INTO doctor_reports (AppointmentID, DoctorID, PatientID, Title, Description, FileUrl)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [appointmentId, doctorId, patientId, title, description, fileUrl]
  );
}

module.exports = {
  createDoctorReport,
};
