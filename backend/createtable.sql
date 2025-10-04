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
-- 7. Create Indexes for Performance
-- ---------------------------
CREATE INDEX idx_patients_email ON patients(Email);
CREATE INDEX idx_users_role ON users(Role);
CREATE INDEX idx_appointments_patient_id ON appointments(PatientID);
CREATE INDEX idx_appointments_doctor_id ON appointments(DoctorID);
CREATE INDEX idx_available_time_doctor_id ON available_time(DoctorID);

-- ---------------------------
-- 8. Seed baseline reference data
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

INSERT INTO admins (FullName)
SELECT 'System Administrator' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE FullName = 'System Administrator');

-- ---------------------------
-- 9. Seed role-based authentication accounts
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
-- 10. Triggers to maintain doctor patient counts
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
