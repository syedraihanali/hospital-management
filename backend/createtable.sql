-- MySQL schema and seed script for Destination Health

-- ---------------------------
-- 1. Create the doctors table
-- ---------------------------
CREATE TABLE IF NOT EXISTS doctors (
    DoctorID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    MaxPatientNumber INT NOT NULL,
    CurrentPatientNumber INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------
-- 2. Create the patients table
-- ---------------------------
CREATE TABLE IF NOT EXISTS patients (
    PatientID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    BirthDate DATE NOT NULL,
    PhoneNumber VARCHAR(50) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Address VARCHAR(255) NOT NULL,
    DoctorID INT,
    FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------
-- 3. Create the admins table
-- ---------------------------
CREATE TABLE IF NOT EXISTS admins (
    AdminID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------
-- 4. Create the users table
-- ---------------------------
CREATE TABLE IF NOT EXISTS users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB;

-- ---------------------------
-- 5. Create the available_time table
-- ---------------------------
CREATE TABLE IF NOT EXISTS available_time (
    AvailableTimeID INT AUTO_INCREMENT PRIMARY KEY,
    DoctorID INT NOT NULL,
    ScheduleDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsAvailable TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (DoctorID) REFERENCES doctors(DoctorID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- 6. Create the appointments table
-- ---------------------------
CREATE TABLE IF NOT EXISTS appointments (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB;

-- ---------------------------
-- 7. Create the site_content table
-- ---------------------------
CREATE TABLE IF NOT EXISTS site_content (
    ContentKey VARCHAR(100) PRIMARY KEY,
    ContentValue LONGTEXT NOT NULL,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------
-- 8. Create the service_packages table
-- ---------------------------
CREATE TABLE IF NOT EXISTS service_packages (
    PackageID INT AUTO_INCREMENT PRIMARY KEY,
    PackageName VARCHAR(255) NOT NULL,
    Subtitle VARCHAR(255) NULL,
    OriginalPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    DiscountedPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------
-- 9. Create the service_package_items table
-- ---------------------------
CREATE TABLE IF NOT EXISTS service_package_items (
    PackageItemID INT AUTO_INCREMENT PRIMARY KEY,
    PackageID INT NOT NULL,
    ItemName VARCHAR(255) NOT NULL,
    ItemPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    SortOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PackageID) REFERENCES service_packages(PackageID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- 10. Create the package_orders table to track lab package purchases
-- ---------------------------
CREATE TABLE IF NOT EXISTS package_orders (
    PackageOrderID INT AUTO_INCREMENT PRIMARY KEY,
    PackageID INT NOT NULL,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(50) NOT NULL,
    NidNumber VARCHAR(100) NULL,
    Notes TEXT NULL,
    OriginalPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    DiscountedPrice DECIMAL(10,2) NOT NULL DEFAULT 0,
    Savings DECIMAL(10,2) NOT NULL DEFAULT 0,
    Status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    PackageSnapshot LONGTEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PackageID) REFERENCES service_packages(PackageID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------
-- 11. Create Indexes for Performance
-- ---------------------------
CREATE INDEX idx_patients_email ON patients(Email);
CREATE INDEX idx_users_role ON users(Role);
CREATE INDEX idx_appointments_patient_id ON appointments(PatientID);
CREATE INDEX idx_appointments_doctor_id ON appointments(DoctorID);
CREATE INDEX idx_available_time_doctor_id ON available_time(DoctorID);

-- ---------------------------
-- 12. Seed baseline reference data
-- ---------------------------
INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. John Smith', 100, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. John Smith');

INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. Emily Davis', 80, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. Emily Davis');

INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. Michael Brown', 120, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. Michael Brown');

INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. Aisha Rahman', 90, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. Aisha Rahman');

INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. Farid Ahmed', 110, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. Farid Ahmed');

INSERT INTO doctors (FullName, MaxPatientNumber, CurrentPatientNumber)
SELECT 'Dr. Laila Chowdhury', 85, 0 FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doctors WHERE FullName = 'Dr. Laila Chowdhury');

INSERT INTO admins (FullName)
SELECT 'System Administrator' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE FullName = 'System Administrator');

-- ---------------------------
-- 12. Seed marketing content (about & service packages)
-- ---------------------------
INSERT INTO site_content (ContentKey, ContentValue)
SELECT 'about_page', JSON_OBJECT(
    'hero', JSON_OBJECT(
        'eyebrow', 'Who We Are',
        'title', 'Destination Health, where compassionate care meets innovation',
        'subtitle', 'Partnering with families across Bangladesh for healthier tomorrows.',
        'description', 'Destination Health is a multidisciplinary medical network that blends expert clinicians, modern diagnostics, and digital experiences to keep every patient informed and supported.',
        'stats', JSON_ARRAY(
            JSON_OBJECT('label', 'Patients cared for annually', 'value', '45K+'),
            JSON_OBJECT('label', 'Specialist physicians', 'value', '120+'),
            JSON_OBJECT('label', 'Satisfaction rating', 'value', '98%')
        )
    ),
    'sections', JSON_ARRAY(
        JSON_OBJECT(
            'title', 'Our Mission',
            'body', 'We are dedicated to making healthcare simple, proactive, and relationship driven. Every appointment, lab visit, and follow-up is coordinated to give patients confidence in their care journey.'
        ),
        JSON_OBJECT(
            'title', 'Comprehensive services under one roof',
            'bullets', JSON_ARRAY(
                'Family medicine, cardiology, neurology, oncology, and more.',
                'Modern diagnostic imaging, pathology, and remote consultations.',
                'Secure digital records with instant access for patients and providers.'
            )
        ),
        JSON_OBJECT(
            'title', 'How we support our community',
            'body', 'From preventive screenings to long-term disease management, our teams coordinate personalized care plans that respect each person’s culture, goals, and lifestyle.'
        ),
        JSON_OBJECT(
            'title', 'Technology that amplifies human care',
            'bullets', JSON_ARRAY(
                'Online appointment scheduling with real-time availability.',
                'Automated reminders and follow-up care coordination.',
                'Telehealth options that extend our reach beyond the hospital walls.'
            )
        )
    ),
    'callout', JSON_OBJECT(
        'title', 'Ready to experience coordinated care?',
        'description', 'Join Destination Health to access a dedicated care team, same-day diagnostics, and a medical partner that listens first.'
    )
    )
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE ContentKey = 'about_page');

INSERT INTO site_content (ContentKey, ContentValue)
SELECT 'site_settings', JSON_OBJECT(
    'siteName', 'Destination Health',
    'siteTagline', 'Seamless booking, coordinated care teams, and secure records—designed for modern health journeys.',
    'primaryContactPhone', '1-800-123-456',
    'primaryContactEmail', 'care@destinationhealth.com',
    'emergencyContactName', 'Emergency coordination desk',
    'emergencyContactPhone', '1-800-123-456',
    'emergencyContactEmail', 'emergency@destinationhealth.com',
    'emergencyContactAddress', '221B Harbor Street, Seattle, WA',
    'footerNote', 'Secured with HIPAA-compliant infrastructure.'
  )
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE ContentKey = 'site_settings');

INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
SELECT 'Package-1', 'Essential wellness screening', 7710, 5900, 1
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE PackageName = 'Package-1');

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Complete Blood Count (CBC)', 400, 0
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Complete Blood Count (CBC)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Random Blood Sugar', 200, 1
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Random Blood Sugar'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Lipid Profile (Random)', 1400, 2
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Lipid Profile (Random)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Grouping & RH Factor', 300, 3
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Grouping & RH Factor'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Creatinine', 400, 4
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Creatinine'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HBsAg', 1000, 5
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HBsAg'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Urine R/E', 400, 6
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Urine R/E'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ECG', 400, 7
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ECG'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Digital X-Ray of Chest P/A View (Digital)', 600, 8
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Digital X-Ray of Chest P/A View (Digital)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Ultrasonography of Whole Abdomen', 2500, 9
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Ultrasonography of Whole Abdomen'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Needle, Tube & Reg. Charges', 110, 10
FROM service_packages p
WHERE p.PackageName = 'Package-1'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Needle, Tube & Reg. Charges'
  );

INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
SELECT 'Package-2', 'Advanced metabolic assessment', 14030, 10650, 2
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE PackageName = 'Package-2');

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Complete Blood Count (CBC)', 400, 0
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Complete Blood Count (CBC)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Sugar (Fasting & 2 hrs ABF)', 400, 1
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Sugar (Fasting & 2 hrs ABF)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HbA1c', 1400, 2
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HbA1c'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Lipid Profile (Fasting)', 1400, 3
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Lipid Profile (Fasting)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Liver Function Test', 1000, 4
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Liver Function Test'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Creatinine', 400, 5
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Creatinine'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Uric Acid', 600, 6
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Uric Acid'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Electrolytes', 1000, 7
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Electrolytes'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'TSH', 1000, 8
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'TSH'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HBsAg', 1000, 9
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HBsAg'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'PSA', 1400, 10
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'PSA'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Urine R/E', 400, 11
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Urine R/E'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ECG', 400, 12
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ECG'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Digital X-Ray of Chest P/A View (Digital)', 600, 13
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Digital X-Ray of Chest P/A View (Digital)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Ultrasonography of Whole Abdomen', 2500, 14
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Ultrasonography of Whole Abdomen'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Needle, Tube & Reg. Charges', 130, 15
FROM service_packages p
WHERE p.PackageName = 'Package-2'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Needle, Tube & Reg. Charges'
  );

INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
SELECT 'Package-3', 'Balanced health profile', 9410, 7180, 3
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE PackageName = 'Package-3');

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Complete Blood Count (CBC)', 400, 0
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Complete Blood Count (CBC)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Sugar (Fasting & 2 hrs ABF)', 400, 1
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Sugar (Fasting & 2 hrs ABF)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Lipid Profile (Fasting)', 1400, 2
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Lipid Profile (Fasting)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Grouping & RH Factor', 300, 3
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Grouping & RH Factor'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HBsAg', 1000, 4
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HBsAg'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'SGPT', 500, 5
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'SGPT'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Bilirubin (Total)', 400, 6
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Bilirubin (Total)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Uric Acid', 600, 7
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Uric Acid'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Creatinine', 400, 8
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Creatinine'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Urine R/E', 400, 9
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Urine R/E'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ECG', 400, 10
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ECG'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Digital X-Ray of Chest P/A View (Digital)', 600, 11
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Digital X-Ray of Chest P/A View (Digital)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Ultrasonography of Whole Abdomen', 2500, 12
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Ultrasonography of Whole Abdomen'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Needle, Tube & Reg. Charges', 110, 13
FROM service_packages p
WHERE p.PackageName = 'Package-3'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Needle, Tube & Reg. Charges'
  );

INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
SELECT 'Package-4', 'Women’s comprehensive screening', 16930, 12850, 4
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE PackageName = 'Package-4');

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Complete Blood Count (CBC)', 400, 0
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Complete Blood Count (CBC)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Sugar (Fasting & 2 hrs ABF)', 400, 1
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Sugar (Fasting & 2 hrs ABF)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HbA1c', 1400, 2
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HbA1c'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Lipid Profile (Fasting)', 1400, 3
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Lipid Profile (Fasting)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Liver Function Test', 1000, 4
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Liver Function Test'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Creatinine', 400, 5
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Creatinine'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Uric Acid', 600, 6
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Uric Acid'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Serum Electrolytes', 1000, 7
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Serum Electrolytes'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'TSH', 1000, 8
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'TSH'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HBsAg', 1000, 9
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HBsAg'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Pap Smear', 1200, 10
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Pap Smear'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Urine R/E', 400, 11
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Urine R/E'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ECG', 400, 12
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ECG'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Digital X-Ray of Chest P/A View (Digital)', 600, 13
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Digital X-Ray of Chest P/A View (Digital)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Mammography of Both Breast', 3000, 14
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Mammography of Both Breast'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Ultrasonography of Whole Abdomen', 2500, 15
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Ultrasonography of Whole Abdomen'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Needle, Tube & Reg. Charges', 230, 16
FROM service_packages p
WHERE p.PackageName = 'Package-4'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Needle, Tube & Reg. Charges'
  );

INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
SELECT 'Package-5', 'For 40 years and above', 19130, 14630, 5
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE PackageName = 'Package-5');

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Complete Blood Count (CBC)', 400, 0
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Complete Blood Count (CBC)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Blood Sugar (Fasting & 2 hrs ABF)', 400, 1
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Blood Sugar (Fasting & 2 hrs ABF)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HbA1c', 1400, 2
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HbA1c'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Lipid Profile (Fasting)', 1400, 3
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Lipid Profile (Fasting)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Liver Function Test (SGPT, Alkaline Phosphar, S.Bilirubin)', 1000, 4
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Liver Function Test (SGPT, Alkaline Phosphar, S.Bilirubin)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Kidney Function Test (S.Creatinine, S.Urea, Electrolytes)', 1900, 5
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Kidney Function Test (S.Creatinine, S.Urea, Electrolytes)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'C-Reactive Protein', 600, 6
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'C-Reactive Protein'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'TSH', 1000, 7
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'TSH'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'HBsAg', 1000, 8
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'HBsAg'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Urine R/E', 400, 9
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Urine R/E'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ECG', 400, 10
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ECG'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Digital X-Ray of Chest P/A View (Digital)', 600, 11
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Digital X-Ray of Chest P/A View (Digital)'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Colour Doppler Echo', 3000, 12
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Colour Doppler Echo'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'ETT', 3000, 13
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'ETT'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Ultrasonography of Whole Abdomen', 2500, 14
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Ultrasonography of Whole Abdomen'
  );

INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
SELECT p.PackageID, 'Needle, Tube & Reg. Charges', 130, 15
FROM service_packages p
WHERE p.PackageName = 'Package-5'
  AND NOT EXISTS (
    SELECT 1 FROM service_package_items spi WHERE spi.PackageID = p.PackageID AND spi.ItemName = 'Needle, Tube & Reg. Charges'
  );

-- ---------------------------
-- 13. Seed role-based authentication accounts
-- ---------------------------
INSERT INTO users (Email, PasswordHash, Role, AdminID)
SELECT 'admin@hospital.com', '$2a$10$D5s70fBDZ1.6vQrPYC0.AuBZGAPll7n/eI16oQ4GhWG0V6h78trKC', 'admin', a.AdminID
FROM admins a
WHERE a.FullName = 'System Administrator'
  AND NOT EXISTS (SELECT 1 FROM users WHERE Email = 'admin@hospital.com');

INSERT INTO users (Email, PasswordHash, Role, DoctorID)
SELECT 'dr.john@hospital.com', '$2a$10$qOpk3gJx/DSdhaEUp.ckNO.bMd3wuW//5DdM.XlZo5Kx2.rvSRszC', 'doctor', d.DoctorID
FROM doctors d
WHERE d.FullName = 'Dr. John Smith'
  AND NOT EXISTS (SELECT 1 FROM users WHERE Email = 'dr.john@hospital.com');

-- Ensure each patient record has a corresponding user entry
INSERT INTO users (Email, PasswordHash, Role, PatientID)
SELECT p.Email, p.PasswordHash, 'patient', p.PatientID
FROM patients p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.PatientID = p.PatientID
);

-- ---------------------------
-- 14. Triggers to maintain doctor patient counts
-- ---------------------------
DELIMITER //

CREATE TRIGGER trg_after_patient_insert
AFTER INSERT ON patients
FOR EACH ROW
BEGIN
    IF NEW.DoctorID IS NOT NULL THEN
        UPDATE doctors
        SET CurrentPatientNumber = CurrentPatientNumber + 1
        WHERE DoctorID = NEW.DoctorID;
    END IF;
END//

CREATE TRIGGER trg_after_patient_delete
AFTER DELETE ON patients
FOR EACH ROW
BEGIN
    IF OLD.DoctorID IS NOT NULL THEN
        UPDATE doctors
        SET CurrentPatientNumber = CurrentPatientNumber - 1
        WHERE DoctorID = OLD.DoctorID;
    END IF;
END//

CREATE TRIGGER trg_after_patient_update
AFTER UPDATE ON patients
FOR EACH ROW
BEGIN
    IF OLD.DoctorID != NEW.DoctorID
        OR (OLD.DoctorID IS NULL AND NEW.DoctorID IS NOT NULL)
        OR (OLD.DoctorID IS NOT NULL AND NEW.DoctorID IS NULL) THEN
        IF OLD.DoctorID IS NOT NULL THEN
            UPDATE doctors
            SET CurrentPatientNumber = CurrentPatientNumber - 1
            WHERE DoctorID = OLD.DoctorID;
        END IF;

        IF NEW.DoctorID IS NOT NULL THEN
            UPDATE doctors
            SET CurrentPatientNumber = CurrentPatientNumber + 1
            WHERE DoctorID = NEW.DoctorID;
        END IF;
    END IF;
END//

DELIMITER ;
