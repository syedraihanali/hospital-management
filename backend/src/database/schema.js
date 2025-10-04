const bcrypt = require('bcryptjs');
const { execute } = require('./query');
const { migrateMissingPatientUsers } = require('../services/userService');

// Ensures the database schema exists before the application handles requests.
async function ensureSchema() {
  await createDoctorsTable();
  await createPatientsTable();
  await createAdminsTable();
  await createUsersTable();
  await createAvailabilityTable();
  await createAppointmentsTable();
  await seedDoctors();
  await migrateMissingPatientUsers();
  await seedAdminUser();
  await seedDoctorUsers();
}

async function createDoctorsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS doctors (
      DoctorID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(255) NOT NULL,
      MaxPatientNumber INT NOT NULL,
      CurrentPatientNumber INT NOT NULL DEFAULT 0
    )`
  );
}

async function createPatientsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS patients (
      PatientID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(255) NOT NULL,
      BirthDate DATE NOT NULL,
      PhoneNumber VARCHAR(50) NOT NULL,
      Email VARCHAR(255) NOT NULL UNIQUE,
      Gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NOT NULL,
      PasswordHash VARCHAR(255) NOT NULL,
      Address VARCHAR(255) NOT NULL,
      DoctorID INT NULL,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    )`
  );
}

async function createAdminsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS admins (
      AdminID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(255) NOT NULL
    )`
  );
}

async function createUsersTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS users (
      UserID INT PRIMARY KEY AUTO_INCREMENT,
      Email VARCHAR(255) NOT NULL UNIQUE,
      PasswordHash VARCHAR(255) NOT NULL,
      Role ENUM('admin', 'doctor', 'patient') NOT NULL,
      AdminID INT NULL,
      DoctorID INT NULL,
      PatientID INT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (AdminID) REFERENCES admins(AdminID) ON DELETE CASCADE,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID) ON DELETE CASCADE,
      FOREIGN KEY (PatientID) REFERENCES patients(PatientID) ON DELETE CASCADE,
      CONSTRAINT chk_users_role_reference CHECK (
        (Role = 'admin' AND AdminID IS NOT NULL AND DoctorID IS NULL AND PatientID IS NULL) OR
        (Role = 'doctor' AND DoctorID IS NOT NULL AND AdminID IS NULL AND PatientID IS NULL) OR
        (Role = 'patient' AND PatientID IS NOT NULL AND AdminID IS NULL AND DoctorID IS NULL)
      )
    )`
  );
}

async function createAvailabilityTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS available_time (
      AvailableTimeID INT PRIMARY KEY AUTO_INCREMENT,
      DoctorID INT NOT NULL,
      ScheduleDate DATE NOT NULL,
      StartTime TIME NOT NULL,
      EndTime TIME NOT NULL,
      IsAvailable TINYINT(1) NOT NULL DEFAULT 1,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );
}

async function createAppointmentsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS appointments (
      AppointmentID INT PRIMARY KEY AUTO_INCREMENT,
      PatientID INT NOT NULL,
      DoctorID INT NOT NULL,
      AvailableTimeID INT NOT NULL,
      FOREIGN KEY (PatientID) REFERENCES patients(PatientID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
      FOREIGN KEY (AvailableTimeID) REFERENCES available_time(AvailableTimeID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );
}

async function seedDoctors() {
  const [{ count }] = await execute('SELECT COUNT(*) AS count FROM doctors');
  if (count > 0) {
    return;
  }

  const doctors = [
    ['Dr. John Smith', 100, 0],
    ['Dr. Emily Davis', 80, 0],
    ['Dr. Michael Brown', 120, 0],
  ];

  await Promise.all(
    doctors.map((doctor) =>
      execute(
        'INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber) VALUES (?, ?, ?)',
        doctor
      )
    )
  );
}

async function seedAdminUser() {
  const adminName = 'System Administrator';
  const adminEmail = 'admin@hospital.com';
  const adminPassword = 'Admin@123';

  const admins = await execute('SELECT AdminID FROM admins WHERE FullName = ?', [adminName]);
  let adminId = admins[0]?.AdminID;

  if (!adminId) {
    const result = await execute('INSERT INTO admins (FullName) VALUES (?)', [adminName]);
    adminId = result.insertId;
  }

  const existingUsers = await execute('SELECT COUNT(*) AS count FROM users WHERE Email = ?', [adminEmail]);
  if (existingUsers[0].count > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await execute(
    `INSERT INTO users (Email, PasswordHash, Role, AdminID)
     VALUES (?, ?, 'admin', ?)`,
    [adminEmail, passwordHash, adminId]
  );
}

async function seedDoctorUsers() {
  const defaultDoctorAccounts = [
    { fullName: 'Dr. John Smith', email: 'dr.john@hospital.com', password: 'Doctor@123' },
  ];

  await Promise.all(
    defaultDoctorAccounts.map(async ({ fullName, email, password }) => {
      const doctors = await execute('SELECT DoctorID FROM doctors WHERE FullName = ?', [fullName]);
      const doctor = doctors[0];
      if (!doctor) {
        return;
      }

      const existingUsers = await execute('SELECT COUNT(*) AS count FROM users WHERE Email = ?', [email]);
      if (existingUsers[0].count > 0) {
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await execute(
        `INSERT INTO users (Email, PasswordHash, Role, DoctorID)
         VALUES (?, ?, 'doctor', ?)`,
        [email, passwordHash, doctor.DoctorID]
      );
    })
  );
}

module.exports = {
  ensureSchema,
};
