const bcrypt = require('bcryptjs');
const { execute } = require('./query');
const { migrateMissingPatientUsers } = require('../services/userService');

async function ensureSchema() {
  await createDoctorsTable();
  await createPatientsTable();
  await createAdminsTable();
  await createUsersTable();
  await createAvailabilityTable();
  await createAppointmentsTable();
  await createDoctorApplicationsTable();
  await createPatientDocumentsTable();
  await createDoctorReportsTable();
  await createLabReportsTable();
  await createSiteContentTable();
  await createServicePackagesTable();
  await createServicePackageItemsTable();
  await createLabTestsTable();
  await migrateMissingPatientUsers();
  await seedAdminUser();
}

async function addColumnIfMissing(table, column, definition) {
  const columns = await execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );

  if (!columns.length) {
    await execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function createDoctorsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS doctors (
      DoctorID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(255) NOT NULL,
      MaxPatientNumber INT NOT NULL,
      CurrentPatientNumber INT NOT NULL DEFAULT 0,
      Email VARCHAR(255) NULL,
      PhoneNumber VARCHAR(50) NULL,
      Specialization VARCHAR(255) NULL,
      AvatarUrl TEXT NULL
    )`
  );

  await addColumnIfMissing('doctors', 'Email', 'VARCHAR(255) NULL');
  await addColumnIfMissing('doctors', 'PhoneNumber', 'VARCHAR(50) NULL');
  await addColumnIfMissing('doctors', 'Specialization', 'VARCHAR(255) NULL');
  await addColumnIfMissing('doctors', 'AvatarUrl', 'TEXT NULL');
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
      NidNumber VARCHAR(100) NOT NULL,
      AvatarUrl TEXT NULL,
      Address VARCHAR(255) NOT NULL,
      DoctorID INT NULL,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    )`
  );

  await addColumnIfMissing('patients', 'NidNumber', 'VARCHAR(100) NOT NULL DEFAULT ""');
  await addColumnIfMissing('patients', 'AvatarUrl', 'TEXT NULL');
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
      Status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      Notes TEXT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

  await addColumnIfMissing('appointments', 'Status', "ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing('appointments', 'Notes', 'TEXT NULL');
  await addColumnIfMissing('appointments', 'CreatedAt', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing(
    'appointments',
    'UpdatedAt',
    'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  );
}

async function createDoctorApplicationsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS doctor_applications (
      ApplicationID INT PRIMARY KEY AUTO_INCREMENT,
      FullName VARCHAR(255) NOT NULL,
      Email VARCHAR(255) NOT NULL,
      PhoneNumber VARCHAR(50) NOT NULL,
      Specialization VARCHAR(255) NOT NULL,
      LicenseNumber VARCHAR(100) NOT NULL,
      NidNumber VARCHAR(100) NOT NULL,
      LicenseDocumentUrl TEXT NOT NULL,
      NidDocumentUrl TEXT NOT NULL,
      ResumeUrl TEXT NULL,
      Status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      SubmittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      ReviewedAt DATETIME NULL,
      ReviewerID INT NULL,
      ReviewNotes TEXT NULL,
      DoctorID INT NULL,
      FOREIGN KEY (ReviewerID) REFERENCES users(UserID) ON DELETE SET NULL,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID) ON DELETE SET NULL
    )`
  );

  await addColumnIfMissing('doctor_applications', 'DoctorID', 'INT NULL');
}

async function createPatientDocumentsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS patient_documents (
      DocumentID INT PRIMARY KEY AUTO_INCREMENT,
      PatientID INT NOT NULL,
      DocumentName VARCHAR(255) NOT NULL,
      FileUrl TEXT NOT NULL,
      UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (PatientID) REFERENCES patients(PatientID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );

  await addColumnIfMissing('patient_documents', 'AppointmentID', 'INT NULL');
}

async function createDoctorReportsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS doctor_reports (
      ReportID INT PRIMARY KEY AUTO_INCREMENT,
      AppointmentID INT NOT NULL,
      DoctorID INT NOT NULL,
      PatientID INT NOT NULL,
      Title VARCHAR(255) NOT NULL,
      Description TEXT NULL,
      FileUrl TEXT NOT NULL,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (AppointmentID) REFERENCES appointments(AppointmentID) ON DELETE CASCADE,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID) ON DELETE CASCADE,
      FOREIGN KEY (PatientID) REFERENCES patients(PatientID) ON DELETE CASCADE
    )`
  );
}

async function createLabReportsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS lab_reports (
      LabReportID INT PRIMARY KEY AUTO_INCREMENT,
      PatientID INT NOT NULL,
      AdminID INT NOT NULL,
      PackageID INT NULL,
      Title VARCHAR(255) NOT NULL,
      Description TEXT NULL,
      FileUrl TEXT NOT NULL,
      TestName VARCHAR(255) NULL,
      BaseCharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
      DiscountAmount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      FinalCharge DECIMAL(10, 2) NOT NULL DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (PatientID) REFERENCES patients(PatientID) ON DELETE CASCADE,
      FOREIGN KEY (AdminID) REFERENCES admins(AdminID) ON DELETE CASCADE,
      FOREIGN KEY (PackageID) REFERENCES service_packages(PackageID) ON DELETE SET NULL
    )`
  );
}

async function createSiteContentTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS site_content (
      ContentKey VARCHAR(100) PRIMARY KEY,
      ContentValue LONGTEXT NOT NULL,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
}

async function createServicePackagesTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS service_packages (
      PackageID INT PRIMARY KEY AUTO_INCREMENT,
      PackageName VARCHAR(255) NOT NULL,
      Subtitle VARCHAR(255) NULL,
      OriginalPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
      DiscountedPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
      SortOrder INT NOT NULL DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  );
}

async function createServicePackageItemsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS service_package_items (
      PackageItemID INT PRIMARY KEY AUTO_INCREMENT,
      PackageID INT NOT NULL,
      ItemName VARCHAR(255) NOT NULL,
      ItemPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
      SortOrder INT NOT NULL DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (PackageID) REFERENCES service_packages(PackageID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );
}

async function createLabTestsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS lab_tests (
      LabTestID INT PRIMARY KEY AUTO_INCREMENT,
      TestName VARCHAR(255) NOT NULL,
      Description TEXT NULL,
      BasePrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
      PackageID INT NULL,
      SortOrder INT NOT NULL DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (PackageID) REFERENCES service_packages(PackageID) ON DELETE SET NULL
    )`
  );
}

async function seedAdminUser() {
  const adminName = 'Primary Administrator';
  const adminEmail = 'admin@mail.com';
  const adminPassword = '123456';

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

module.exports = {
  ensureSchema,
};
