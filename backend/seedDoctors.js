const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('./src/config/env');

const DOCTOR_PASSWORD = 'Doctor@123';
const AVAILABILITY_DAYS = 7;
const WORK_DAY_START_HOUR = 9;
const WORK_DAY_END_HOUR = 17; // Exclusive upper bound (5 PM)

const SPECIALIZATIONS = [
  {
    name: 'Cardiology',
    doctors: [
      { fullName: 'Dr. Ayesha Rahman', email: 'ayesharahman.cardiology@gmail.com', phone: '01810000001', fee: 2200, maxPatients: 25 },
      { fullName: 'Dr. Kamal Hossain', email: 'kamalhossain.cardiology@gmail.com', phone: '01810000002', fee: 2600, maxPatients: 20 },
      { fullName: 'Dr. Laila Chowdhury', email: 'lailachowdhury.cardiology@gmail.com', phone: '01810000003', fee: 2400, maxPatients: 22 },
    ],
  },
  {
    name: 'Dermatology',
    doctors: [
      { fullName: 'Dr. Nabila Karim', email: 'nabilakarim.dermatology@gmail.com', phone: '01810000004', fee: 1800, maxPatients: 18 },
      { fullName: 'Dr. Farhan Uddin', email: 'farhanuddin.dermatology@gmail.com', phone: '01810000005', fee: 2100, maxPatients: 16 },
    ],
  },
  {
    name: 'Neurology',
    doctors: [
      { fullName: 'Dr. Rezaul Islam', email: 'rezaulislam.neurology@gmail.com', phone: '01810000006', fee: 3000, maxPatients: 24 },
      { fullName: 'Dr. Tahmina Akter', email: 'tahminaakter.neurology@gmail.com', phone: '01810000007', fee: 2800, maxPatients: 20 },
      { fullName: 'Dr. Ashfaq Mahmud', email: 'ashfaqmahmud.neurology@gmail.com', phone: '01810000008', fee: 2900, maxPatients: 22 },
    ],
  },
  {
    name: 'Pediatrics',
    doctors: [
      { fullName: 'Dr. Sharmeen Sultana', email: 'sharmeensultana.pediatrics@gmail.com', phone: '01810000009', fee: 1500, maxPatients: 28 },
      { fullName: 'Dr. Imran Kabir', email: 'imrankabir.pediatrics@gmail.com', phone: '01810000010', fee: 1700, maxPatients: 25 },
    ],
  },
  {
    name: 'Orthopedics',
    doctors: [
      { fullName: 'Dr. Parvez Hasan', email: 'parvezhasan.orthopedics@gmail.com', phone: '01810000011', fee: 2500, maxPatients: 20 },
      { fullName: 'Dr. Nusrat Jahan', email: 'nusratjahan.orthopedics@gmail.com', phone: '01810000012', fee: 2300, maxPatients: 18 },
      { fullName: 'Dr. Mahir Rahman', email: 'mahirrahman.orthopedics@gmail.com', phone: '01810000013', fee: 2700, maxPatients: 22 },
    ],
  },
  {
    name: 'Gastroenterology',
    doctors: [
      { fullName: 'Dr. Tanvir Alam', email: 'tanviralam.gastro@gmail.com', phone: '01810000014', fee: 2100, maxPatients: 20 },
      { fullName: 'Dr. Rukhsana Sharmin', email: 'rukhsanasharmin.gastro@gmail.com', phone: '01810000015', fee: 1950, maxPatients: 18 },
    ],
  },
  {
    name: 'Oncology',
    doctors: [
      { fullName: 'Dr. Bilkis Yasmin', email: 'bilkisyasmin.oncology@gmail.com', phone: '01810000016', fee: 2800, maxPatients: 18 },
      { fullName: 'Dr. Habib Rahim', email: 'habibrahim.oncology@gmail.com', phone: '01810000017', fee: 3000, maxPatients: 20 },
    ],
  },
  {
    name: 'Psychiatry',
    doctors: [
      { fullName: 'Dr. Moumita Das', email: 'moumitadas.psychiatry@gmail.com', phone: '01810000018', fee: 1600, maxPatients: 16 },
      { fullName: 'Dr. Salman Chowdhury', email: 'salmanchowdhury.psychiatry@gmail.com', phone: '01810000019', fee: 1750, maxPatients: 18 },
      { fullName: 'Dr. Farzana Rahat', email: 'farzanarahat.psychiatry@gmail.com', phone: '01810000020', fee: 1850, maxPatients: 20 },
    ],
  },
  {
    name: 'Endocrinology',
    doctors: [
      { fullName: 'Dr. Sazzad Amin', email: 'sazzadamin.endocrinology@gmail.com', phone: '01810000021', fee: 2400, maxPatients: 22 },
      { fullName: 'Dr. Mira Hossain', email: 'mirahossain.endocrinology@gmail.com', phone: '01810000022', fee: 2300, maxPatients: 20 },
    ],
  },
  {
    name: 'Ophthalmology',
    doctors: [
      { fullName: 'Dr. Rehana Siddiqui', email: 'rehanasiddiqui.ophthalmology@gmail.com', phone: '01810000023', fee: 1900, maxPatients: 18 },
      { fullName: 'Dr. Arif Hasan', email: 'arifhasan.ophthalmology@gmail.com', phone: '01810000024', fee: 2000, maxPatients: 20 },
      { fullName: 'Dr. Niloy Chowdhury', email: 'niloychowdhury.ophthalmology@gmail.com', phone: '01810000025', fee: 2150, maxPatients: 18 },
    ],
  },
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(hour) {
  return `${`${hour}`.padStart(2, '0')}:00:00`;
}

async function upsertDoctor(connection, doctor, specialization, passwordHash) {
  const [existingDoctor] = await connection.execute(
    'SELECT DoctorID FROM doctors WHERE Email = ? LIMIT 1',
    [doctor.email]
  );

  let doctorId;

  if (existingDoctor.length) {
    doctorId = existingDoctor[0].DoctorID;
    await connection.execute(
      `UPDATE doctors
        SET FullName = ?, MaxPatientNumber = ?, Email = ?, PhoneNumber = ?, Specialization = ?, ConsultationFee = ?
        WHERE DoctorID = ?`,
      [
        doctor.fullName,
        doctor.maxPatients,
        doctor.email,
        doctor.phone,
        specialization,
        doctor.fee,
        doctorId,
      ]
    );
  } else {
    const [insertResult] = await connection.execute(
      `INSERT INTO doctors
        (FullName, MaxPatientNumber, CurrentPatientNumber, Email, PhoneNumber, Specialization, ConsultationFee)
        VALUES (?, ?, 0, ?, ?, ?, ?)`,
      [
        doctor.fullName,
        doctor.maxPatients,
        doctor.email,
        doctor.phone,
        specialization,
        doctor.fee,
      ]
    );
    doctorId = insertResult.insertId;
  }

  const [existingUser] = await connection.execute(
    'SELECT UserID FROM users WHERE Email = ? LIMIT 1',
    [doctor.email]
  );

  if (existingUser.length) {
    await connection.execute(
      `UPDATE users
        SET PasswordHash = ?, Role = 'doctor', DoctorID = ?, AdminID = NULL, PatientID = NULL, UpdatedAt = NOW()
        WHERE UserID = ?`,
      [passwordHash, doctorId, existingUser[0].UserID]
    );
  } else {
    await connection.execute(
      `INSERT INTO users (Email, PasswordHash, Role, DoctorID)
        VALUES (?, ?, 'doctor', ?)`,
      [doctor.email, passwordHash, doctorId]
    );
  }

  return doctorId;
}

async function refreshAvailability(connection, doctorId) {
  await connection.execute(
    `DELETE FROM available_time
      WHERE DoctorID = ? AND ScheduleDate >= CURDATE() AND ScheduleDate < DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
    [doctorId, AVAILABILITY_DAYS]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const values = [];

  for (let offset = 0; offset < AVAILABILITY_DAYS; offset += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + offset);
    const date = formatDate(current);
    const dayOfWeek = current.getDay();

    for (let hour = WORK_DAY_START_HOUR; hour < WORK_DAY_END_HOUR; hour += 1) {
      values.push(doctorId, date, dayOfWeek, formatTime(hour), formatTime(hour + 1), 1);
    }
  }

  if (!values.length) {
    return;
  }

  const placeholders = new Array(values.length / 6).fill('(?, ?, ?, ?, ?, ?)').join(', ');

  await connection.execute(
    `INSERT INTO available_time (DoctorID, ScheduleDate, DayOfWeek, StartTime, EndTime, IsAvailable)
      VALUES ${placeholders}`,
    values
  );
}

async function seedDoctors() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port,
  });

  try {
    console.log('Connected to database. Seeding doctors...');
    const passwordHash = await bcrypt.hash(DOCTOR_PASSWORD, 10);
    let totalDoctors = 0;

    for (const field of SPECIALIZATIONS) {
      for (const doctor of field.doctors) {
        await connection.beginTransaction();
        try {
          const doctorId = await upsertDoctor(connection, doctor, field.name, passwordHash);
          await refreshAvailability(connection, doctorId);
          await connection.commit();
          totalDoctors += 1;
          console.log(`Seeded ${doctor.fullName} (${field.name}).`);
        } catch (error) {
          await connection.rollback();
          console.error(`Failed to seed ${doctor.fullName}:`, error.message);
          throw error;
        }
      }
    }

    console.log(`Successfully seeded ${totalDoctors} doctors with default availability.`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

seedDoctors();
