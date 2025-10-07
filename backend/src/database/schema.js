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
  await createPaymentsTable();
  await createDoctorApplicationsTable();
  await createPatientDocumentsTable();
  await createDoctorReportsTable();
  await createLabReportsTable();
  await createSiteContentTable();
  await createServicePackagesTable();
  await createServicePackageItemsTable();
  await createLabTestsTable();
  await seedDoctors();
  await seedSiteContent();
  await seedServicePackages();
  await seedLabTests();
  await migrateMissingPatientUsers();
  await seedAdminUser();
  await seedDoctorUsers();
  await seedPatientsWithHistory();
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

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeValue(hour) {
  return `${`${hour}`.padStart(2, '0')}:00:00`;
}

async function ensureDefaultAvailabilityForDoctor(doctorId, { days = 7, startHour = 9, endHour = 17 } = {}) {
  if (!doctorId || endHour <= startHour || days <= 0) {
    return;
  }

  const [existing] = await execute(
    `SELECT COUNT(*) AS count FROM available_time WHERE DoctorID = ? AND ScheduleDate >= CURDATE()`,
    [doctorId]
  );

  if (existing?.count > 0) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = [];

  for (let offset = 0; offset < days; offset += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + offset);
    const scheduleDate = formatDateValue(current);
    const dayOfWeek = current.getDay();

    for (let hour = startHour; hour < endHour; hour += 1) {
      const startTime = formatTimeValue(hour);
      const endTime = formatTimeValue(hour + 1);
      slots.push([doctorId, scheduleDate, dayOfWeek, startTime, endTime]);
    }
  }

  if (!slots.length) {
    return;
  }

  await execute(
    `INSERT INTO available_time (DoctorID, ScheduleDate, DayOfWeek, StartTime, EndTime, IsAvailable)
     VALUES ${slots.map(() => '(?, ?, ?, ?, ?, 1)').join(', ')}`,
    slots.flat()
  );
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
      AvatarUrl TEXT NULL,
      ConsultationFee DECIMAL(10, 2) NOT NULL DEFAULT 0
    )`
  );

  await addColumnIfMissing('doctors', 'Email', 'VARCHAR(255) NULL');
  await addColumnIfMissing('doctors', 'PhoneNumber', 'VARCHAR(50) NULL');
  await addColumnIfMissing('doctors', 'Specialization', 'VARCHAR(255) NULL');
  await addColumnIfMissing('doctors', 'AvatarUrl', 'TEXT NULL');
  await addColumnIfMissing('doctors', 'ConsultationFee', 'DECIMAL(10, 2) NOT NULL DEFAULT 0');
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
      DayOfWeek TINYINT NOT NULL DEFAULT 0,
      FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );

  await addColumnIfMissing('available_time', 'DayOfWeek', 'TINYINT NOT NULL DEFAULT 0');
  await execute('UPDATE available_time SET DayOfWeek = DAYOFWEEK(ScheduleDate) - 1 WHERE DayOfWeek IS NULL OR DayOfWeek NOT BETWEEN 0 AND 6');
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

async function createPaymentsTable() {
  await execute(
    `CREATE TABLE IF NOT EXISTS payments (
      PaymentID INT PRIMARY KEY AUTO_INCREMENT,
      AppointmentID INT NOT NULL,
      Amount DECIMAL(10, 2) NOT NULL,
      Currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
      Method ENUM('bkash', 'nagad', 'card') NOT NULL,
      Status ENUM('paid', 'refunded', 'failed') NOT NULL DEFAULT 'paid',
      TransactionReference VARCHAR(191) NULL,
      PaidAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (AppointmentID) REFERENCES appointments(AppointmentID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )`
  );

  await addColumnIfMissing('payments', 'Currency', "VARCHAR(10) NOT NULL DEFAULT 'BDT'");
  await addColumnIfMissing('payments', 'TransactionReference', 'VARCHAR(191) NULL');
  await addColumnIfMissing(
    'payments',
    'Status',
    "ENUM('paid','refunded','failed') NOT NULL DEFAULT 'paid'"
  );
  await addColumnIfMissing('payments', 'PaidAt', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
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

async function seedDoctors() {
  const [{ count }] = await execute('SELECT COUNT(*) AS count FROM doctors');
  if (count > 0) {
    return;
  }

  const doctors = [
    {
      name: 'Dr. John Smith',
      max: 100,
      email: 'dr.john@hospital.com',
      phone: '+8801711000001',
      specialization: 'Cardiology',
      fee: 1500,
    },
    {
      name: 'Dr. Emily Davis',
      max: 80,
      email: 'dr.emily@hospital.com',
      phone: '+8801711000002',
      specialization: 'Neurology',
      fee: 1800,
    },
    {
      name: 'Dr. Michael Brown',
      max: 120,
      email: 'dr.michael@hospital.com',
      phone: '+8801711000003',
      specialization: 'Orthopedics',
      fee: 1400,
    },
    {
      name: 'Dr. Aisha Rahman',
      max: 90,
      email: 'dr.aisha@hospital.com',
      phone: '+8801711000004',
      specialization: 'General Medicine',
      fee: 1200,
    },
    {
      name: 'Dr. Farid Ahmed',
      max: 110,
      email: 'dr.farid@hospital.com',
      phone: '+8801711000005',
      specialization: 'Dermatology',
      fee: 1600,
    },
    {
      name: 'Dr. Laila Chowdhury',
      max: 85,
      email: 'dr.laila@hospital.com',
      phone: '+8801711000006',
      specialization: 'Pediatrics',
      fee: 1100,
    },
  ];

  await Promise.all(
    doctors.map(({ name, max, email, phone, specialization, fee }) =>
      execute(
        `INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber, Email, PhoneNumber, Specialization, ConsultationFee)
         VALUES (?, ?, 0, ?, ?, ?, ?)`,
        [name, max, email, phone, specialization, fee]
      )
    )
  );

  const seededDoctors = await execute('SELECT DoctorID FROM doctors');
  await Promise.all(
    seededDoctors.map((doctor) => ensureDefaultAvailabilityForDoctor(doctor.DoctorID))
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
    { fullName: 'Dr. Aisha Rahman', email: 'dr.aisha@hospital.com', password: 'Doctor@123' },
    { fullName: 'Dr. Farid Ahmed', email: 'dr.farid@hospital.com', password: 'Doctor@123' },
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

async function seedPatientsWithHistory() {
  const [{ count }] = await execute('SELECT COUNT(*) AS count FROM patients');
  if (count > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash('Patient@123', 10);

  const patients = [
    {
      name: 'Rahim Uddin',
      email: 'rahim.patients@hospital.com',
      phone: '+8801711223344',
      nid: '1987654321',
      address: 'House 12, Road 5, Dhanmondi, Dhaka',
      gender: 'Male',
      birthDate: '1988-04-12',
      avatar: null,
    },
    {
      name: 'Shamsi Akter',
      email: 'shamsi.patients@hospital.com',
      phone: '+8801711556677',
      nid: '2387654321',
      address: 'Apartment 4B, Banani, Dhaka',
      gender: 'Female',
      birthDate: '1992-09-23',
      avatar: null,
    },
  ];

  await Promise.all(
    patients.map(async (patient, index) => {
      const [doctor] = await execute('SELECT DoctorID FROM doctors ORDER BY DoctorID LIMIT 1 OFFSET ?', [index]);
      const doctorId = doctor?.DoctorID || null;

      const result = await execute(
        `INSERT INTO patients (FullName, BirthDate, PhoneNumber, Email, Gender, PasswordHash, NidNumber, Address, DoctorID, AvatarUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.name,
          patient.birthDate,
          patient.phone,
          patient.email,
          patient.gender,
          passwordHash,
          patient.nid,
          patient.address,
          doctorId,
          patient.avatar,
        ]
      );

      const patientId = result.insertId;

      await execute(
        `INSERT INTO users (Email, PasswordHash, Role, PatientID)
         VALUES (?, ?, 'patient', ?)`,
        [patient.email, passwordHash, patientId]
      );

      await execute(
        `INSERT INTO patient_documents (PatientID, DocumentName, FileUrl)
         VALUES (?, 'Initial Medical History', 'https://example.com/sample-history.pdf')`,
        [patientId]
      );
    })
  );
}

async function seedSiteContent() {
  const aboutExists = await execute('SELECT ContentKey FROM site_content WHERE ContentKey = ?', ['about_page']);
  if (!aboutExists.length) {
    const aboutContent = {
      hero: {
        eyebrow: 'Who We Are',
        title: 'Destination Health, where compassionate care meets innovation',
        subtitle: 'Partnering with families across Bangladesh for healthier tomorrows.',
        description:
          'Destination Health is a multidisciplinary medical network that blends expert clinicians, modern diagnostics, and digital experiences to keep every patient informed and supported.',
        stats: [
          { label: 'Patients cared for annually', value: '45K+' },
          { label: 'Specialist physicians', value: '120+' },
          { label: 'Satisfaction rating', value: '98%' },
        ],
      },
      sections: [
        {
          title: 'Our Mission',
          body:
            'We are dedicated to making healthcare simple, proactive, and relationship driven. Every appointment, lab visit, and follow-up is coordinated to give patients confidence in their care journey.',
        },
        {
          title: 'Comprehensive services under one roof',
          bullets: [
            'Family medicine, cardiology, neurology, oncology, and more.',
            'Modern diagnostic imaging, pathology, and remote consultations.',
            'Secure digital records with instant access for patients and providers.',
          ],
        },
        {
          title: 'How we support our community',
          body:
            'From preventive screenings to long-term disease management, our teams coordinate personalized care plans that respect each person’s culture, goals, and lifestyle.',
        },
        {
          title: 'Technology that amplifies human care',
          bullets: [
            'Online appointment scheduling with real-time availability.',
            'Automated reminders and follow-up care coordination.',
            'Telehealth options that extend our reach beyond the hospital walls.',
          ],
        },
      ],
      callout: {
        title: 'Ready to experience coordinated care?',
        description:
          'Join Destination Health to access a dedicated care team, same-day diagnostics, and a medical partner that listens first.',
      },
    };

    await execute(
      `INSERT INTO site_content (ContentKey, ContentValue)
       VALUES (?, ?)`,
      ['about_page', JSON.stringify(aboutContent)]
    );
  }

  const siteSettingsExists = await execute('SELECT ContentKey FROM site_content WHERE ContentKey = ?', ['site_settings']);
  if (!siteSettingsExists.length) {
    const siteSettings = {
      siteName: 'Destination Health',
      siteTagline: 'Seamless booking, coordinated care teams, and secure records—designed for modern health journeys.',
      primaryContactPhone: '1-800-123-456',
      primaryContactEmail: 'care@destinationhealth.com',
      emergencyContactName: 'Emergency coordination desk',
      emergencyContactPhone: '1-800-123-456',
      emergencyContactEmail: 'emergency@destinationhealth.com',
      emergencyContactAddress: '221B Harbor Street, Seattle, WA',
      footerNote: 'Secured with HIPAA-compliant infrastructure.',
      supportPhone: '+8801711000000',
      supportWhatsappUrl: 'https://wa.me/8801711000000',
    };

    await execute(
      `INSERT INTO site_content (ContentKey, ContentValue)
       VALUES (?, ?)`,
      ['site_settings', JSON.stringify(siteSettings)]
    );
  }
}

async function seedServicePackages() {
  const [{ count }] = await execute('SELECT COUNT(*) AS count FROM service_packages');
  if (count > 0) {
    return;
  }

  const packages = [
    {
      name: 'Package-1',
      subtitle: 'Essential wellness screening',
      discountedPrice: 5900,
      sortOrder: 1,
      items: [
        { name: 'Complete Blood Count (CBC)', price: 400 },
        { name: 'Random Blood Sugar', price: 200 },
        { name: 'Lipid Profile (Random)', price: 1400 },
        { name: 'Blood Grouping & RH Factor', price: 300 },
        { name: 'Serum Creatinine', price: 400 },
        { name: 'HBsAg', price: 1000 },
        { name: 'Urine R/E', price: 400 },
        { name: 'ECG', price: 400 },
        { name: 'Digital X-Ray of Chest P/A View (Digital)', price: 600 },
        { name: 'Ultrasonography of Whole Abdomen', price: 2500 },
        { name: 'Needle, Tube & Reg. Charges', price: 110 },
      ],
    },
    {
      name: 'Package-2',
      subtitle: 'Advanced metabolic assessment',
      discountedPrice: 10650,
      sortOrder: 2,
      items: [
        { name: 'Complete Blood Count (CBC)', price: 400 },
        { name: 'Blood Sugar (Fasting & 2 hrs ABF)', price: 400 },
        { name: 'HbA1c', price: 1400 },
        { name: 'Lipid Profile (Fasting)', price: 1400 },
        { name: 'Liver Function Test', price: 1000 },
        { name: 'Serum Creatinine', price: 400 },
        { name: 'Serum Uric Acid', price: 600 },
        { name: 'Serum Electrolytes', price: 1000 },
        { name: 'TSH', price: 1000 },
        { name: 'HBsAg', price: 1000 },
        { name: 'PSA', price: 1400 },
        { name: 'Urine R/E', price: 400 },
        { name: 'ECG', price: 400 },
        { name: 'Digital X-Ray of Chest P/A View (Digital)', price: 600 },
        { name: 'Ultrasonography of Whole Abdomen', price: 2500 },
        { name: 'Needle, Tube & Reg. Charges', price: 130 },
      ],
    },
    {
      name: 'Package-3',
      subtitle: 'Balanced health profile',
      discountedPrice: 7180,
      sortOrder: 3,
      items: [
        { name: 'Complete Blood Count (CBC)', price: 400 },
        { name: 'Blood Sugar (Fasting & 2 hrs ABF)', price: 400 },
        { name: 'Lipid Profile (Fasting)', price: 1400 },
        { name: 'Blood Grouping & RH Factor', price: 300 },
        { name: 'HBsAg', price: 1000 },
        { name: 'SGPT', price: 500 },
        { name: 'Serum Bilirubin (Total)', price: 400 },
        { name: 'Serum Uric Acid', price: 600 },
        { name: 'Serum Creatinine', price: 400 },
        { name: 'Urine R/E', price: 400 },
        { name: 'ECG', price: 400 },
        { name: 'Digital X-Ray of Chest P/A View (Digital)', price: 600 },
        { name: 'Ultrasonography of Whole Abdomen', price: 2500 },
        { name: 'Needle, Tube & Reg. Charges', price: 110 },
      ],
    },
    {
      name: 'Package-4',
      subtitle: 'Women’s comprehensive screening',
      discountedPrice: 12850,
      sortOrder: 4,
      items: [
        { name: 'Complete Blood Count (CBC)', price: 400 },
        { name: 'Blood Sugar (Fasting & 2 hrs ABF)', price: 400 },
        { name: 'HbA1c', price: 1400 },
        { name: 'Lipid Profile (Fasting)', price: 1400 },
        { name: 'Liver Function Test', price: 1000 },
        { name: 'Serum Creatinine', price: 400 },
        { name: 'Serum Uric Acid', price: 600 },
        { name: 'Serum Electrolytes', price: 1000 },
        { name: 'TSH', price: 1000 },
        { name: 'HBsAg', price: 1000 },
        { name: 'Pap Smear', price: 1200 },
        { name: 'Urine R/E', price: 400 },
        { name: 'ECG', price: 400 },
        { name: 'Digital X-Ray of Chest P/A View (Digital)', price: 600 },
        { name: 'Mammography of Both Breast', price: 3000 },
        { name: 'Ultrasonography of Whole Abdomen', price: 2500 },
        { name: 'Needle, Tube & Reg. Charges', price: 230 },
      ],
    },
    {
      name: 'Package-5',
      subtitle: 'For 40 years and above',
      discountedPrice: 14630,
      sortOrder: 5,
      items: [
        { name: 'Complete Blood Count (CBC)', price: 400 },
        { name: 'Blood Sugar (Fasting & 2 hrs ABF)', price: 400 },
        { name: 'HbA1c', price: 1400 },
        { name: 'Lipid Profile (Fasting)', price: 1400 },
        { name: 'Liver Function Test (SGPT, Alkaline Phosphar, S.Bilirubin)', price: 1000 },
        { name: 'Kidney Function Test (S.Creatinine, S.Urea, Electrolytes)', price: 1900 },
        { name: 'C-Reactive Protein', price: 600 },
        { name: 'TSH', price: 1000 },
        { name: 'HBsAg', price: 1000 },
        { name: 'Urine R/E', price: 400 },
        { name: 'ECG', price: 400 },
        { name: 'Digital X-Ray of Chest P/A View (Digital)', price: 600 },
        { name: 'Colour Doppler Echo', price: 3000 },
        { name: 'ETT', price: 3000 },
        { name: 'Ultrasonography of Whole Abdomen', price: 2500 },
        { name: 'Needle, Tube & Reg. Charges', price: 130 },
      ],
    },
  ];

  await Promise.all(
    packages.map(async (pkg, pkgIndex) => {
      const total = pkg.items.reduce((sum, item) => sum + Number(item.price), 0);
      const result = await execute(
        `INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
         VALUES (?, ?, ?, ?, ?)`,
        [pkg.name, pkg.subtitle, total, pkg.discountedPrice, pkg.sortOrder ?? pkgIndex]
      );

      const packageId = result.insertId;

      await Promise.all(
        pkg.items.map((item, itemIndex) =>
          execute(
            `INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
             VALUES (?, ?, ?, ?)`,
            [packageId, item.name, item.price, itemIndex]
          )
        )
      );
    })
  );
}

async function seedLabTests() {
  const [{ count }] = await execute('SELECT COUNT(*) AS count FROM lab_tests');
  if (count > 0) {
    return;
  }

  const packages = await execute('SELECT PackageID, PackageName FROM service_packages');
  const packageMap = new Map(packages.map((pkg) => [pkg.PackageName, pkg.PackageID]));

  const tests = [
    {
      name: 'Complete Blood Count (CBC)',
      description: 'Comprehensive blood health screening.',
      basePrice: 400,
      packageName: 'Package-1',
      sortOrder: 1,
    },
    {
      name: 'Lipid Profile (Fasting)',
      description: 'Cholesterol and triglyceride analysis for cardiac risk.',
      basePrice: 1400,
      packageName: 'Package-2',
      sortOrder: 2,
    },
    {
      name: 'HbA1c',
      description: 'Three-month average blood glucose monitoring.',
      basePrice: 1400,
      packageName: 'Package-2',
      sortOrder: 3,
    },
    {
      name: 'Ultrasonography of Whole Abdomen',
      description: 'Detailed abdominal imaging review.',
      basePrice: 2500,
      packageName: 'Package-3',
      sortOrder: 4,
    },
    {
      name: 'Mammography of Both Breast',
      description: 'Digital mammography screening for women.',
      basePrice: 3000,
      packageName: 'Package-4',
      sortOrder: 5,
    },
  ];

  await Promise.all(
    tests.map((test, index) => {
      const packageId = test.packageName ? packageMap.get(test.packageName) || null : null;
      return execute(
        `INSERT INTO lab_tests (TestName, Description, BasePrice, PackageID, SortOrder)
         VALUES (?, ?, ?, ?, ?)`,
        [test.name, test.description, test.basePrice, packageId, test.sortOrder || index]
      );
    })
  );
}

module.exports = {
  ensureSchema,
  ensureDefaultAvailabilityForDoctor,
};
