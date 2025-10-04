const { execute } = require('../database/query');

async function findUserByEmail(email) {
  const users = await execute(
    `SELECT
        u.UserID AS userId,
        u.Email AS email,
        u.PasswordHash AS passwordHash,
        u.Role AS role,
        u.AdminID AS adminId,
        u.DoctorID AS doctorId,
        u.PatientID AS patientId,
        a.FullName AS adminName,
        d.FullName AS doctorName,
        p.FullName AS patientName
      FROM users u
      LEFT JOIN admins a ON u.AdminID = a.AdminID
      LEFT JOIN doctors d ON u.DoctorID = d.DoctorID
      LEFT JOIN patients p ON u.PatientID = p.PatientID
      WHERE u.Email = ?`,
    [email]
  );

  return users[0];
}

async function findUserById(userId) {
  const users = await execute(
    `SELECT
        u.UserID AS userId,
        u.Email AS email,
        u.Role AS role,
        u.AdminID AS adminId,
        u.DoctorID AS doctorId,
        u.PatientID AS patientId
      FROM users u
      WHERE u.UserID = ?`,
    [userId]
  );

  return users[0];
}

async function migrateMissingPatientUsers() {
  const patients = await execute(
    `SELECT p.PatientID, p.Email, p.PasswordHash
      FROM patients p
      WHERE p.PatientID NOT IN (
        SELECT COALESCE(PatientID, 0) FROM users WHERE PatientID IS NOT NULL
      )`
  );

  await Promise.all(
    patients.map((patient) =>
      execute(
        `INSERT INTO users (Email, PasswordHash, Role, PatientID)
         VALUES (?, ?, 'patient', ?)
         ON DUPLICATE KEY UPDATE Email = Email`,
        [patient.Email, patient.PasswordHash, patient.PatientID]
      )
    )
  );
}

module.exports = {
  findUserByEmail,
  findUserById,
  migrateMissingPatientUsers,
};
