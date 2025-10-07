const { execute } = require('../database/query');

async function createDoctorReport({ appointmentId, doctorId, patientId, title, description, fileUrl }) {
  await execute(
    `INSERT INTO doctor_reports (AppointmentID, DoctorID, PatientID, Title, Description, FileUrl)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [appointmentId, doctorId, patientId, title, description, fileUrl]
  );
}

async function createLabReport({
  patientId,
  adminId,
  title,
  description,
  fileUrl,
  testName,
  packageId = null,
  baseCharge = 0,
  discountAmount = 0,
  finalCharge = 0,
}) {
  await execute(
    `INSERT INTO lab_reports (
       PatientID,
       AdminID,
       PackageID,
       Title,
       Description,
       FileUrl,
       TestName,
       BaseCharge,
       DiscountAmount,
       FinalCharge
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      adminId,
      packageId,
      title,
      description,
      fileUrl,
      testName,
      baseCharge,
      discountAmount,
      finalCharge,
    ]
  );
}

module.exports = {
  createDoctorReport,
  createLabReport,
};
