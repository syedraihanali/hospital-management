const bcrypt = require('bcryptjs');
const { execute, transaction } = require('../database/query');

// Persists a new patient with a securely hashed password.
async function createPatient({
  fullName,
  birthDate,
  gender,
  phoneNumber,
  email,
  password,
  address,
  doctorId,
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return transaction(async (connection) => {
    const [patientResult] = await connection.execute(
      `INSERT INTO patients (FullName, BirthDate, PhoneNumber, Email, Gender, PasswordHash, Address, DoctorID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, birthDate, phoneNumber, email, gender, passwordHash, address, doctorId]
    );

    const patientId = patientResult.insertId;

    await connection.execute(
      `INSERT INTO users (Email, PasswordHash, Role, PatientID)
       VALUES (?, ?, 'patient', ?)`,
      [email, passwordHash, patientId]
    );

    return { id: patientId, fullName, email };
  });
}

// Returns the full list of patients.
async function listPatients() {
  return execute(
    `SELECT PatientID, FullName, BirthDate, PhoneNumber, Email, Gender, Address, DoctorID
     FROM patients`
  );
}

// Retrieves a patient by identifier.
async function findPatientById(id) {
  const patients = await execute(
    `SELECT PatientID, FullName, BirthDate, PhoneNumber, Email, Gender, Address, DoctorID
     FROM patients WHERE PatientID = ?`,
    [id]
  );
  return patients[0];
}

// Returns the doctor assigned to a patient, if any.
async function getDoctorIdForPatient(patientId) {
  const patients = await execute('SELECT DoctorID FROM patients WHERE PatientID = ?', [patientId]);
  return patients[0]?.DoctorID;
}

module.exports = {
  createPatient,
  listPatients,
  findPatientById,
  getDoctorIdForPatient,
};
