const bcrypt = require('bcryptjs');
const { execute, transaction } = require('../database/query');

// Retrieves all doctors from the database with their next available appointment slot.
async function listDoctors() {
  return execute(
    `SELECT
        d.DoctorID,
        d.FullName,
        d.MaxPatientNumber,
        d.CurrentPatientNumber,
        d.Email,
        d.PhoneNumber,
        d.Specialization,
        d.AvatarUrl,
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

function sanitize(value) {
  return value ? String(value).trim() : '';
}

async function createDoctorApplication({
  fullName,
  email,
  phoneNumber,
  specialization,
  licenseNumber,
  nidNumber,
  licenseDocumentUrl,
  nidDocumentUrl,
  resumeUrl,
}) {
  const sanitizedFullName = sanitize(fullName);
  const sanitizedEmail = sanitize(email).toLowerCase();
  const sanitizedPhoneNumber = sanitize(phoneNumber);
  const sanitizedSpecialization = sanitize(specialization);
  const sanitizedLicenseNumber = sanitize(licenseNumber).toUpperCase();
  const sanitizedNidNumber = sanitize(nidNumber);

  if (
    !sanitizedFullName ||
    !sanitizedEmail ||
    !sanitizedPhoneNumber ||
    !sanitizedSpecialization ||
    !sanitizedLicenseNumber ||
    !sanitizedNidNumber
  ) {
    const error = new Error('All doctor application fields are required.');
    error.statusCode = 400;
    throw error;
  }

  const [existingUser] = await execute('SELECT UserID FROM users WHERE LOWER(Email) = ?', [sanitizedEmail]);
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const [existingDoctor] = await execute('SELECT DoctorID FROM doctors WHERE LOWER(Email) = ?', [sanitizedEmail]);
  if (existingDoctor) {
    const error = new Error('A doctor profile with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const duplicateApplications = await execute(
    `SELECT ApplicationID, Status
       FROM doctor_applications
      WHERE LOWER(Email) = ? OR UPPER(LicenseNumber) = ? OR NidNumber = ?
      ORDER BY SubmittedAt DESC
      LIMIT 1`,
    [sanitizedEmail, sanitizedLicenseNumber, sanitizedNidNumber]
  );

  const existingApplication = duplicateApplications[0];
  if (existingApplication && existingApplication.Status !== 'rejected') {
    const message =
      existingApplication.Status === 'approved'
        ? 'This clinician has already been approved.'
        : 'An application with these credentials is already pending review.';
    const error = new Error(message);
    error.statusCode = 409;
    throw error;
  }

  await execute(
    `INSERT INTO doctor_applications
      (FullName, Email, PhoneNumber, Specialization, LicenseNumber, NidNumber, LicenseDocumentUrl, NidDocumentUrl, ResumeUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sanitizedFullName,
      sanitizedEmail,
      sanitizedPhoneNumber,
      sanitizedSpecialization,
      sanitizedLicenseNumber,
      sanitizedNidNumber,
      licenseDocumentUrl,
      nidDocumentUrl,
      resumeUrl,
    ]
  );
}

async function listDoctorApplications(status = 'pending') {
  if (status === 'all') {
    return execute(
      `SELECT ApplicationID, FullName, Email, PhoneNumber, Specialization, LicenseNumber, NidNumber, LicenseDocumentUrl,
              NidDocumentUrl, ResumeUrl, Status, SubmittedAt, ReviewedAt, ReviewNotes, DoctorID
       FROM doctor_applications
       ORDER BY SubmittedAt DESC`
    );
  }

  return execute(
    `SELECT ApplicationID, FullName, Email, PhoneNumber, Specialization, LicenseNumber, NidNumber, LicenseDocumentUrl,
            NidDocumentUrl, ResumeUrl, Status, SubmittedAt, ReviewedAt, ReviewNotes, DoctorID
     FROM doctor_applications
     WHERE Status = ?
     ORDER BY SubmittedAt DESC`,
    [status]
  );
}

async function reviewDoctorApplication({ applicationId, status, reviewerUserId, notes }) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid review status provided.');
  }

  const reviewerId = reviewerUserId ?? null;
  const reviewNotes = typeof notes === 'string' ? notes : notes ?? null;

  await execute(
    `UPDATE doctor_applications
     SET Status = ?, ReviewedAt = CURRENT_TIMESTAMP, ReviewerID = ?, ReviewNotes = ?
     WHERE ApplicationID = ?`,
    [status, reviewerId, reviewNotes, applicationId]
  );
}

async function createDoctorFromApplication(applicationId, defaultPassword = 'Doctor@123') {
  return transaction(async (connection) => {
    const [applications] = await connection.execute(
      'SELECT * FROM doctor_applications WHERE ApplicationID = ? FOR UPDATE',
      [applicationId]
    );
    const application = applications[0];

    if (!application) {
      throw new Error('Application not found.');
    }

    if (application.Status !== 'approved') {
      throw new Error('Application must be approved before creating a doctor profile.');
    }

    if (application.DoctorID) {
      return application.DoctorID;
    }

    const [result] = await connection.execute(
      `INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber, Email, PhoneNumber, Specialization)
       VALUES (?, ?, 0, ?, ?, ?)`,
      [
        application.FullName,
        100,
        application.Email,
        application.PhoneNumber,
        application.Specialization,
      ]
    );

    const doctorId = result.insertId;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await connection.execute(
      `INSERT INTO users (Email, PasswordHash, Role, DoctorID)
       VALUES (?, ?, 'doctor', ?)`,
      [application.Email, passwordHash, doctorId]
    );

    await connection.execute('UPDATE doctor_applications SET DoctorID = ? WHERE ApplicationID = ?', [doctorId, applicationId]);

    return doctorId;
  });
}

async function updateDoctorProfile(doctorId, { fullName, email, phoneNumber, specialization, avatarUrl }) {
  const sanitizedFullName = sanitize(fullName);
  const sanitizedEmail = sanitize(email).toLowerCase();
  const sanitizedPhoneNumber = sanitize(phoneNumber);
  const sanitizedSpecialization =
    specialization === undefined || specialization === null ? null : String(specialization).trim();

  if (!sanitizedFullName || !sanitizedEmail || !sanitizedPhoneNumber) {
    const error = new Error('Full name, email, and phone number are required.');
    error.statusCode = 400;
    throw error;
  }

  const duplicateUserEmail = await execute(
    `SELECT UserID
       FROM users
      WHERE LOWER(Email) = ? AND (DoctorID IS NULL OR DoctorID <> ?)`,
    [sanitizedEmail, doctorId]
  );

  if (duplicateUserEmail.length) {
    const error = new Error('Another account already uses this email.');
    error.statusCode = 409;
    throw error;
  }

  const duplicateDoctorEmail = await execute(
    `SELECT DoctorID
       FROM doctors
      WHERE LOWER(Email) = ? AND DoctorID <> ?`,
    [sanitizedEmail, doctorId]
  );

  if (duplicateDoctorEmail.length) {
    const error = new Error('Another doctor profile already uses this email.');
    error.statusCode = 409;
    throw error;
  }

  await execute(
    `UPDATE doctors
     SET FullName = ?, Email = ?, PhoneNumber = ?, Specialization = ?, AvatarUrl = ?
     WHERE DoctorID = ?`,
    [sanitizedFullName, sanitizedEmail, sanitizedPhoneNumber, sanitizedSpecialization, avatarUrl, doctorId]
  );

  await execute('UPDATE users SET Email = ? WHERE DoctorID = ?', [sanitizedEmail, doctorId]);
}

async function updateDoctorPassword(doctorId, password) {
  const hash = await bcrypt.hash(password, 10);
  await execute('UPDATE users SET PasswordHash = ? WHERE DoctorID = ?', [hash, doctorId]);
}

module.exports = {
  listDoctors,
  getDoctorById,
  incrementDoctorPatientCount,
  createDoctorApplication,
  listDoctorApplications,
  reviewDoctorApplication,
  createDoctorFromApplication,
  updateDoctorProfile,
  updateDoctorPassword,
};
