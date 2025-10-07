const bcrypt = require('bcryptjs');
const { execute, transaction } = require('../database/query');
async function createPatient({
  fullName,
  birthDate,
  gender,
  phoneNumber,
  email,
  password,
  address,
  nidNumber,
  doctorId = null,
  documents = [],
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return transaction(async (connection) => {
    const [patientResult] = await connection.execute(
      `INSERT INTO patients (FullName, BirthDate, PhoneNumber, Email, Gender, PasswordHash, NidNumber, Address, DoctorID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, birthDate, phoneNumber, email, gender, passwordHash, nidNumber, address, doctorId]
    );

    const patientId = patientResult.insertId;

    const [userResult] = await connection.execute(
      `INSERT INTO users (Email, PasswordHash, Role, PatientID)
       VALUES (?, ?, 'patient', ?)`,
      [email, passwordHash, patientId]
    );

    if (documents.length) {
      const values = documents.map(({ name, url, appointmentId = null }) => [
        patientId,
        name,
        url,
        appointmentId,
      ]);
      await connection.query(
        'INSERT INTO patient_documents (PatientID, DocumentName, FileUrl, AppointmentID) VALUES ?',
        [values]
      );
    }

    return { id: patientId, userId: userResult.insertId, fullName, email };
  });
}
async function listPatients() {
  return execute(
    `SELECT PatientID, FullName, BirthDate, PhoneNumber, Email, Gender, Address, DoctorID, NidNumber, AvatarUrl
     FROM patients`
  );
}
async function findPatientById(id) {
  const patients = await execute(
    `SELECT PatientID, FullName, BirthDate, PhoneNumber, Email, Gender, Address, DoctorID, NidNumber, AvatarUrl
     FROM patients WHERE PatientID = ?`,
    [id]
  );
  return patients[0];
}
async function getDoctorIdForPatient(patientId) {
  const patients = await execute('SELECT DoctorID FROM patients WHERE PatientID = ?', [patientId]);
  return patients[0]?.DoctorID;
}

async function listPatientDocuments(patientId, { search = '', sort = 'desc', appointmentId = null } = {}) {
  const order = sort === 'asc' ? 'ASC' : 'DESC';
  const like = `%${search}%`;
  const params = [patientId, like];
  let appointmentClause = '';

  if (appointmentId) {
    appointmentClause = ' AND AppointmentID = ?';
    params.push(appointmentId);
  }

  return execute(
    `SELECT DocumentID, DocumentName, FileUrl, UploadedAt, AppointmentID
     FROM patient_documents
     WHERE PatientID = ? AND DocumentName LIKE ?${appointmentClause}
     ORDER BY UploadedAt ${order}`,
    params
  );
}

async function listPatientReports(patientId, { search = '', sort = 'desc', appointmentId = null } = {}) {
  const order = sort === 'asc' ? 'ASC' : 'DESC';
  const like = `%${search}%`;
  const params = [patientId, like, like];
  let appointmentClause = '';

  if (appointmentId) {
    appointmentClause = ' AND r.AppointmentID = ?';
    params.push(appointmentId);
  }

  return execute(
    `SELECT r.ReportID, r.AppointmentID, r.Title, r.Description, r.FileUrl, r.CreatedAt, d.FullName AS DoctorName
     FROM doctor_reports r
     JOIN doctors d ON r.DoctorID = d.DoctorID
     WHERE r.PatientID = ? AND (r.Title LIKE ? OR r.Description LIKE ?)${appointmentClause}
     ORDER BY r.CreatedAt ${order}`,
    params
  );
}

async function findPatientByNid(nidNumber) {
  const patients = await execute(
    `SELECT PatientID, FullName, BirthDate, PhoneNumber, Email, Gender, Address, DoctorID, NidNumber, AvatarUrl
     FROM patients WHERE NidNumber = ?`,
    [nidNumber]
  );
  return patients[0];
}

async function savePatientDocument(patientId, name, url, appointmentId = null) {
  await execute(
    `INSERT INTO patient_documents (PatientID, DocumentName, FileUrl, AppointmentID)
     VALUES (?, ?, ?, ?)`,
    [patientId, name, url, appointmentId]
  );
}

async function updatePatientProfile(patientId, { fullName, phoneNumber, email, address, nidNumber, avatarUrl }) {
  await execute(
    `UPDATE patients
     SET FullName = ?, PhoneNumber = ?, Email = ?, Address = ?, NidNumber = ?, AvatarUrl = ?
     WHERE PatientID = ?`,
    [fullName, phoneNumber, email, address, nidNumber, avatarUrl, patientId]
  );
  await execute('UPDATE users SET Email = ? WHERE PatientID = ?', [email, patientId]);
}

async function updatePatientPassword(patientId, password) {
  const hash = await bcrypt.hash(password, 10);
  await execute('UPDATE patients SET PasswordHash = ? WHERE PatientID = ?', [hash, patientId]);
  await execute('UPDATE users SET PasswordHash = ? WHERE PatientID = ?', [hash, patientId]);
}

module.exports = {
  createPatient,
  listPatients,
  findPatientById,
  getDoctorIdForPatient,
  listPatientDocuments,
  listPatientReports,
  savePatientDocument,
  updatePatientProfile,
  updatePatientPassword,
  findPatientByNid,
};
