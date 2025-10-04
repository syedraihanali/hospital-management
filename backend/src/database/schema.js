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
  await createSiteContentTable();
  await createServicePackagesTable();
  await createServicePackageItemsTable();
  await seedDoctors();
  await seedSiteContent();
  await seedServicePackages();
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

async function seedSiteContent() {
  const existing = await execute('SELECT ContentKey FROM site_content WHERE ContentKey = ?', ['about_page']);
  if (existing.length > 0) {
    return;
  }

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

module.exports = {
  ensureSchema,
};
