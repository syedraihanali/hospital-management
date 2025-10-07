const { execute, transaction } = require('../database/query');

const ALLOWED_PAYMENT_METHODS = ['bkash', 'nagad', 'card'];
const DEFAULT_PAYMENT_CURRENCY = 'BDT';

function normalizeTimeValue(time) {
  if (!time) {
    return time;
  }

  const trimmed = String(time).trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return trimmed;
}
async function getUpcomingAppointments(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        d.FullName AS doctor,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS startTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS endTime,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN doctors d ON a.DoctorID = d.DoctorID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.PatientID = ? AND at.ScheduleDate >= CURDATE()
      ORDER BY at.ScheduleDate ASC, at.StartTime ASC`,
    [patientId]
  );
}
async function getAppointmentHistory(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        d.FullName AS doctor,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS time,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN doctors d ON a.DoctorID = d.DoctorID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.PatientID = ? AND at.ScheduleDate < CURDATE()
      ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [patientId]
  );
}
async function getUpcomingAppointmentsForDoctor(doctorId) {
  return execute(
    `SELECT
        a.AppointmentID,
        p.FullName AS patient,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS date,
        TIME_FORMAT(at.StartTime, '%H:%i') AS startTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS endTime,
        a.Status,
        a.Notes
      FROM appointments a
      JOIN patients p ON a.PatientID = p.PatientID
      JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
      WHERE a.DoctorID = ? AND at.ScheduleDate >= CURDATE()
      ORDER BY at.ScheduleDate ASC, at.StartTime ASC`,
    [doctorId]
  );
}
async function getAvailableTimes(doctorId) {
  return execute(
    `SELECT
        AvailableTimeID,
        DoctorID,
        DATE_FORMAT(ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        DayOfWeek,
        DATE_FORMAT(ScheduleDate, '%W') AS DayName,
        TIME_FORMAT(StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(EndTime, '%H:%i') AS EndTime
      FROM available_time
      WHERE DoctorID = ? AND IsAvailable = 1 AND ScheduleDate >= CURDATE()
      ORDER BY ScheduleDate ASC, StartTime ASC`,
    [doctorId]
  );
}
async function bookAppointment({ patientId, availableTimeId, notes = '', payment }) {
  return transaction(async (connection) => {
    const [timeSlots] = await connection.execute(
      `SELECT at.*, d.ConsultationFee
         FROM available_time at
         JOIN doctors d ON at.DoctorID = d.DoctorID
        WHERE at.AvailableTimeID = ? AND at.IsAvailable = 1 FOR UPDATE`,
      [availableTimeId]
    );
    const timeSlot = timeSlots[0];

    if (!timeSlot) {
      const error = new Error('Selected time slot is no longer available');
      error.statusCode = 400;
      throw error;
    }

    if (!payment || typeof payment !== 'object') {
      const error = new Error('Payment details are required to confirm the booking.');
      error.statusCode = 400;
      throw error;
    }

    const paymentMethod = String(payment.method || '').toLowerCase();
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      const error = new Error('Unsupported payment method provided.');
      error.statusCode = 400;
      throw error;
    }

    const paymentAmount = Number.parseFloat(payment.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
      const error = new Error('Payment amount must be a positive number.');
      error.statusCode = 400;
      throw error;
    }

    const expectedFee = Number.parseFloat(timeSlot.ConsultationFee ?? 0);
    const roundedAmount = Number.parseFloat(paymentAmount.toFixed(2));
    const roundedFee = Number.parseFloat(expectedFee.toFixed(2));

    if (Math.abs(roundedAmount - roundedFee) > 0.01) {
      const error = new Error('Payment amount does not match the consultation fee.');
      error.statusCode = 400;
      throw error;
    }

    const paymentCurrency = String(payment.currency || DEFAULT_PAYMENT_CURRENCY).toUpperCase();
    const paymentReference = payment.reference ? String(payment.reference).trim() : '';

    if (paymentMethod !== 'card' && !paymentReference) {
      const error = new Error('A transaction reference is required for mobile wallet payments.');
      error.statusCode = 400;
      throw error;
    }

    const paymentReferenceValue = paymentReference || null;

    const [appointmentResult] = await connection.execute(
      `INSERT INTO appointments (PatientID, DoctorID, AvailableTimeID, Status, Notes)
       VALUES (?, ?, ?, 'pending', ?)`,
      [patientId, timeSlot.DoctorID, availableTimeId, notes || null]
    );

    await connection.execute('UPDATE available_time SET IsAvailable = 0 WHERE AvailableTimeID = ?', [
      availableTimeId,
    ]);
    const appointmentId = appointmentResult.insertId;

    await connection.execute(
      `INSERT INTO payments (AppointmentID, Amount, Currency, Method, Status, TransactionReference)
       VALUES (?, ?, ?, ?, 'paid', ?)`,
      [appointmentId, roundedAmount, paymentCurrency, paymentMethod, paymentReferenceValue]
    );

    return {
      appointmentId,
      doctorId: timeSlot.DoctorID,
      scheduleDate: timeSlot.ScheduleDate,
      startTime: timeSlot.StartTime,
      endTime: timeSlot.EndTime,
      notes: notes || null,
      payment: {
        amount: roundedAmount,
        currency: paymentCurrency,
        method: paymentMethod,
        reference: paymentReferenceValue,
        status: 'paid',
      },
    };
  });
}

async function createAvailabilitySlots(doctorId, slots) {
  if (!slots.length) {
    return;
  }

  const values = slots.map(({ date, startTime, endTime }) => {
    const slotDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = Number.isNaN(slotDate.getTime()) ? null : slotDate.getDay();
    return [
      doctorId,
      date,
      dayOfWeek ?? 0,
      normalizeTimeValue(startTime),
      normalizeTimeValue(endTime),
    ];
  });
  await execute(
    `INSERT INTO available_time (DoctorID, ScheduleDate, DayOfWeek, StartTime, EndTime, IsAvailable)
     VALUES ${values.map(() => '(?, ?, ?, ?, ?, 1)').join(', ')}`,
    values.flat()
  );
}

async function listAvailabilityForDoctorManagement(doctorId) {
  return execute(
    `SELECT
        AvailableTimeID,
        DoctorID,
        DATE_FORMAT(ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        DayOfWeek,
        DATE_FORMAT(ScheduleDate, '%W') AS DayName,
        TIME_FORMAT(StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(EndTime, '%H:%i') AS EndTime,
        IsAvailable
      FROM available_time
      WHERE DoctorID = ? AND ScheduleDate >= CURDATE()
      ORDER BY ScheduleDate ASC, StartTime ASC`,
    [doctorId]
  );
}

async function updateAvailabilitySlotStatus(slotId, doctorId, isAvailable) {
  const result = await execute(
    'UPDATE available_time SET IsAvailable = ? WHERE AvailableTimeID = ? AND DoctorID = ?',
    [isAvailable ? 1 : 0, slotId, doctorId]
  );

  return result.affectedRows || 0;
}

async function hasActiveAppointmentForSlot(slotId) {
  const result = await execute(
    `SELECT COUNT(*) AS total
       FROM appointments
       WHERE AvailableTimeID = ?
         AND Status IN ('pending', 'confirmed')`,
    [slotId]
  );

  return (result[0]?.total || 0) > 0;
}

async function listAppointmentsForDoctor(doctorId) {
  const rows = await execute(
    `SELECT
        a.AppointmentID,
        a.Status,
        a.Notes,
        a.CreatedAt,
        p.PatientID,
        p.FullName AS PatientName,
        p.PhoneNumber,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        TIME_FORMAT(at.StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS EndTime,
        pay.Amount AS PaymentAmount,
        pay.Currency AS PaymentCurrency,
        pay.Method AS PaymentMethod,
        pay.Status AS PaymentStatus,
        pay.TransactionReference AS PaymentReference,
        DATE_FORMAT(pay.PaidAt, '%Y-%m-%dT%H:%i:%sZ') AS PaymentDate,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'DocumentID', pd.DocumentID,
              'DocumentName', pd.DocumentName,
              'FileUrl', pd.FileUrl,
              'UploadedAt', DATE_FORMAT(pd.UploadedAt, '%Y-%m-%dT%H:%i:%sZ')
            )
          )
          FROM patient_documents pd
          WHERE pd.AppointmentID = a.AppointmentID
        ) AS PatientDocuments
     FROM appointments a
     JOIN patients p ON a.PatientID = p.PatientID
     JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
     LEFT JOIN payments pay ON pay.AppointmentID = a.AppointmentID
     WHERE a.DoctorID = ?
     ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [doctorId]
  );

  return rows.map((appointment) => {
    let patientDocuments = [];
    if (appointment.PatientDocuments) {
      try {
        const parsed = JSON.parse(appointment.PatientDocuments);
        if (Array.isArray(parsed)) {
          patientDocuments = parsed;
        }
      } catch (error) {
        patientDocuments = [];
      }
    }

    return {
      ...appointment,
      PatientDocuments: patientDocuments,
    };
  });
}

async function listAppointmentsForPatient(patientId) {
  return execute(
    `SELECT
        a.AppointmentID,
        a.Status,
        a.Notes,
        a.CreatedAt,
        d.DoctorID,
        d.FullName AS DoctorName,
        DATE_FORMAT(at.ScheduleDate, '%Y-%m-%d') AS ScheduleDate,
        TIME_FORMAT(at.StartTime, '%H:%i') AS StartTime,
        TIME_FORMAT(at.EndTime, '%H:%i') AS EndTime,
        pay.Amount AS PaymentAmount,
        pay.Currency AS PaymentCurrency,
        pay.Method AS PaymentMethod,
        pay.Status AS PaymentStatus,
        pay.TransactionReference AS PaymentReference,
        DATE_FORMAT(pay.PaidAt, '%Y-%m-%dT%H:%i:%sZ') AS PaymentDate
     FROM appointments a
     JOIN doctors d ON a.DoctorID = d.DoctorID
     JOIN available_time at ON a.AvailableTimeID = at.AvailableTimeID
     LEFT JOIN payments pay ON pay.AppointmentID = a.AppointmentID
     WHERE a.PatientID = ?
     ORDER BY at.ScheduleDate DESC, at.StartTime DESC`,
    [patientId]
  );
}

async function hasDoctorSeenPatient(doctorId, patientId) {
  const rows = await execute(
    `SELECT COUNT(*) AS total
       FROM appointments
       WHERE DoctorID = ? AND PatientID = ?`,
    [doctorId, patientId]
  );

  return (rows[0]?.total || 0) > 0;
}

async function updateAppointmentStatus(appointmentId, status, notes = null) {
  await execute(
    `UPDATE appointments SET Status = ?, Notes = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE AppointmentID = ?`,
    [status, notes, appointmentId]
  );
}

async function getAppointmentById(appointmentId) {
  const appointments = await execute('SELECT * FROM appointments WHERE AppointmentID = ?', [appointmentId]);
  return appointments[0];
}

async function reopenAvailabilitySlot(availableTimeId) {
  await execute('UPDATE available_time SET IsAvailable = 1 WHERE AvailableTimeID = ?', [availableTimeId]);
}

module.exports = {
  getUpcomingAppointments,
  getAppointmentHistory,
  getAvailableTimes,
  bookAppointment,
  getUpcomingAppointmentsForDoctor,
  createAvailabilitySlots,
  listAppointmentsForDoctor,
  listAppointmentsForPatient,
  hasDoctorSeenPatient,
  updateAppointmentStatus,
  getAppointmentById,
  reopenAvailabilitySlot,
  listAvailabilityForDoctorManagement,
  updateAvailabilitySlotStatus,
  hasActiveAppointmentForSlot,
};
