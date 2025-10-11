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

async function listPatientLabReports(patientId, { search = '', sort = 'desc' } = {}) {
  const order = sort === 'asc' ? 'ASC' : 'DESC';
  const like = `%${search}%`;

  return execute(
    `SELECT
        lr.LabReportID,
        lr.Title,
        lr.Description,
        lr.FileUrl,
        lr.TestName,
        lr.BaseCharge,
        lr.DiscountAmount,
        lr.FinalCharge,
        lr.PackageID,
        lr.CreatedAt,
        a.FullName AS AdminName,
        sp.PackageName
     FROM lab_reports lr
     JOIN admins a ON lr.AdminID = a.AdminID
     LEFT JOIN service_packages sp ON lr.PackageID = sp.PackageID
     WHERE lr.PatientID = ? AND (lr.Title LIKE ? OR lr.Description LIKE ? OR lr.TestName LIKE ?)
     ORDER BY lr.CreatedAt ${order}`,
    [patientId, like, like, like]
  );
}

async function listPatientPackageOrders(patientId) {
  const rows = await execute(
    `SELECT
        po.PackageOrderID,
        po.PackageID,
        po.PatientID,
        po.FullName,
        po.Email,
        po.PhoneNumber,
        po.NidNumber,
        po.Notes,
        po.OriginalPrice,
        po.DiscountedPrice,
        po.Savings,
        po.Status,
        po.IsActive,
        po.PackageSnapshot,
        po.CreatedAt,
        sp.PackageName,
        sp.DiscountedPrice AS CurrentDiscountedPrice,
        sp.OriginalPrice AS CurrentOriginalPrice
     FROM package_orders po
     LEFT JOIN service_packages sp ON po.PackageID = sp.PackageID
     WHERE po.PatientID = ?
     ORDER BY po.CreatedAt DESC, po.PackageOrderID DESC`,
    [patientId]
  );

  return rows.map((row) => {
    let snapshot = {};
    if (row.PackageSnapshot) {
      try {
        snapshot = JSON.parse(row.PackageSnapshot);
      } catch (error) {
        snapshot = {};
      }
    }

    const originalPrice = Number.parseFloat(row.OriginalPrice ?? snapshot.originalPrice ?? 0) || 0;
    const discountedPrice =
      Number.parseFloat(row.DiscountedPrice ?? snapshot.discountedPrice ?? row.CurrentDiscountedPrice ?? 0) || 0;
    const savings = Number.parseFloat(row.Savings ?? snapshot.savings ?? (originalPrice - discountedPrice)) || 0;
    const discountRate = originalPrice > 0 ? Math.max(0, Math.min(1, 1 - discountedPrice / originalPrice)) : 0;

    return {
      id: row.PackageOrderID,
      packageId: row.PackageID,
      packageName: snapshot.name || row.PackageName || '',
      status: row.Status || 'pending',
      isActive: row.IsActive === null ? true : row.IsActive === 1,
      purchasedAt: row.CreatedAt,
      originalPrice,
      discountedPrice,
      savings: Number.parseFloat(savings.toFixed(2)),
      discountRate,
      fullName: row.FullName,
      email: row.Email,
      phoneNumber: row.PhoneNumber,
      nidNumber: row.NidNumber,
      notes: row.Notes,
      items: Array.isArray(snapshot.items) ? snapshot.items : [],
    };
  });
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
  listPatientLabReports,
  listPatientPackageOrders,
};
