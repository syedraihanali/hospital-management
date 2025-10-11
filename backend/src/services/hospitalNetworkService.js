const {
  findPatientByNid,
  listPatientDocuments,
  listPatientReports,
  listPatientLabReports,
} = require('./patientService');
const { listAppointmentsForPatient } = require('./appointmentService');

function describeHospital(hospital = {}) {
  return {
    slug: String(hospital.slug || '').trim().toLowerCase(),
    name: String(hospital.name || '').trim() || 'Partner hospital',
    isPrimary: Boolean(hospital.isPrimary),
  };
}

function formatPatientSummary(patient) {
  if (!patient) {
    return null;
  }
  return {
    id: patient.PatientID ?? patient.id ?? null,
    fullName: patient.FullName ?? patient.fullName ?? '',
    email: patient.Email ?? patient.email ?? '',
    phoneNumber: patient.PhoneNumber ?? patient.phoneNumber ?? '',
    nidNumber: patient.NidNumber ?? patient.nidNumber ?? '',
  };
}

function sanitizeBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== 'string') {
    return null;
  }
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

async function fetchJson(url) {
  if (typeof fetch !== 'function') {
    throw new Error('Partner hospital integration requires a Node.js runtime with fetch support.');
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    raw: text,
  };
}

async function fetchLocalHospitalAppointments(nid) {
  const patient = await findPatientByNid(nid);
  if (!patient) {
    return {
      status: 'not_found',
      message: 'No patient found for the provided NID number.',
      patient: null,
      appointments: [],
      labReports: [],
    };
  }

  const [appointments, labReports] = await Promise.all([
    listAppointmentsForPatient(patient.PatientID),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  return {
    status: 'succeeded',
    message: '',
    patient: formatPatientSummary(patient),
    appointments,
    labReports,
  };
}

async function fetchLocalHospitalAppointmentAssets(nid, appointmentId) {
  const patient = await findPatientByNid(nid);
  if (!patient) {
    return {
      status: 'not_found',
      message: 'No patient found for the provided NID number.',
    };
  }

  const numericAppointmentId = Number.parseInt(appointmentId, 10);
  if (!Number.isInteger(numericAppointmentId)) {
    return {
      status: 'invalid',
      message: 'A valid appointment identifier is required for the primary hospital.',
    };
  }

  const appointments = await listAppointmentsForPatient(patient.PatientID);
  const appointment = appointments.find(
    (item) => Number.parseInt(item.AppointmentID, 10) === numericAppointmentId
  );

  if (!appointment) {
    return {
      status: 'not_found',
      message: 'No appointment was found for this patient using the provided identifier.',
    };
  }

  const [documents, doctorReports, labReports] = await Promise.all([
    listPatientDocuments(patient.PatientID, { sort: 'desc', appointmentId: numericAppointmentId }),
    listPatientReports(patient.PatientID, { sort: 'desc', appointmentId: numericAppointmentId }),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  return {
    status: 'succeeded',
    message: '',
    patient: formatPatientSummary(patient),
    appointment,
    documents,
    doctorReports,
    labReports,
  };
}

async function fetchPartnerHospitalAppointments(hospital, nid) {
  const baseUrl = sanitizeBaseUrl(hospital.baseUrl);
  if (baseUrl) {
    const url = `${baseUrl}/api/patient-access/appointments?nid=${encodeURIComponent(nid)}`;
    try {
      const response = await fetchJson(url);
      if (response.ok) {
        const payload = response.data || {};
        const patient = payload.patient ? formatPatientSummary(payload.patient) : null;
        const appointments = Array.isArray(payload.appointments) ? payload.appointments : [];
        const labReports = Array.isArray(payload.labReports) ? payload.labReports : [];

        if (patient) {
          return {
            status: 'succeeded',
            message: '',
            patient,
            appointments,
            labReports,
          };
        }

        return {
          status: 'not_found',
          message: payload.message || 'No records were located at this hospital.',
          patient: null,
          appointments: [],
          labReports: [],
        };
      }

      const message =
        (response.data && response.data.message) ||
        (response.raw && response.raw.trim()) ||
        'Unable to load data from the partner hospital.';

      if (response.status === 404) {
        return {
          status: 'not_found',
          message,
          patient: null,
          appointments: [],
          labReports: [],
        };
      }

      return {
        status: 'failed',
        message,
        patient: null,
        appointments: [],
        labReports: [],
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message || 'Unable to load data from the partner hospital.',
        patient: null,
        appointments: [],
        labReports: [],
      };
    }
  }

  const mockData = createMockHospitalData(hospital, nid);
  return {
    status: 'succeeded',
    message: '',
    patient: mockData.patient,
    appointments: mockData.appointments,
    labReports: mockData.labReports,
  };
}

async function fetchPartnerHospitalAppointmentAssets(hospital, nid, appointmentId) {
  const baseUrl = sanitizeBaseUrl(hospital.baseUrl);
  if (baseUrl) {
    const url = `${baseUrl}/api/patient-access/appointments/${encodeURIComponent(
      appointmentId
    )}/assets?nid=${encodeURIComponent(nid)}`;
    try {
      const response = await fetchJson(url);
      if (response.ok) {
        const payload = response.data || {};
        return {
          status: 'succeeded',
          message: '',
          patient: payload.patient ? formatPatientSummary(payload.patient) : null,
          appointment: payload.appointment || null,
          documents: Array.isArray(payload.documents) ? payload.documents : [],
          doctorReports: Array.isArray(payload.doctorReports) ? payload.doctorReports : [],
          labReports: Array.isArray(payload.labReports) ? payload.labReports : [],
        };
      }

      const message =
        (response.data && response.data.message) ||
        (response.raw && response.raw.trim()) ||
        'Unable to load appointment details from the partner hospital.';

      if (response.status === 404) {
        return {
          status: 'not_found',
          message,
          patient: null,
          appointment: null,
          documents: [],
          doctorReports: [],
          labReports: [],
        };
      }

      return {
        status: 'failed',
        message,
        patient: null,
        appointment: null,
        documents: [],
        doctorReports: [],
        labReports: [],
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message || 'Unable to load appointment details from the partner hospital.',
        patient: null,
        appointment: null,
        documents: [],
        doctorReports: [],
        labReports: [],
      };
    }
  }

  const assets = createMockAppointmentAssets(hospital, nid, appointmentId);
  if (!assets) {
    return {
      status: 'not_found',
      message: 'No appointment was found at the partner hospital for the provided identifier.',
      patient: null,
      appointment: null,
      documents: [],
      doctorReports: [],
      labReports: [],
    };
  }

  return {
    status: 'succeeded',
    message: '',
    patient: assets.patient,
    appointment: assets.appointment,
    documents: assets.documents,
    doctorReports: assets.doctorReports,
    labReports: assets.labReports,
  };
}

function computeSeedFromNid(nid) {
  return String(nid || '')
    .split('')
    .reduce((acc, char, index) => (acc + char.charCodeAt(0) * (index + 1)) % 10000, 0);
}

function sanitizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function createMockHospitalData(hospital, nid) {
  const seed = computeSeedFromNid(nid);
  const safeSlug = sanitizeSlug(hospital.slug || 'partner');
  const patientFirstNames = ['Aisha', 'Karim', 'Farah', 'Imran', 'Nadia', 'Tanvir', 'Lamia', 'Rahim'];
  const patientLastNames = ['Rahman', 'Akter', 'Islam', 'Karim', 'Hasan', 'Chowdhury', 'Begum', 'Alam'];
  const doctorLastNames = ['Rahman', 'Islam', 'Chowdhury', 'Hasan', 'Ahmed', 'Sultana'];
  const firstName = patientFirstNames[seed % patientFirstNames.length];
  const lastName = patientLastNames[(seed + 3) % patientLastNames.length];
  const doctorLastName = doctorLastNames[(seed + 5) % doctorLastNames.length];
  const doctorName = `Dr. ${hospital.name?.split(' ')?.[0] || 'Network'} ${doctorLastName}`;
  const patientIdSuffix = String(seed).padStart(4, '0');
  const phoneSuffix = String((seed % 10000)).padStart(4, '0');

  const baseDate = new Date(Date.UTC(2024, 0, 1));
  baseDate.setUTCDate(baseDate.getUTCDate() + (seed % 18));

  const patient = {
    id: `${safeSlug || 'partner'}-${patientIdSuffix}`,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}`.toLowerCase() + `@${safeSlug || 'partner'}.network`,
    phoneNumber: `+8801${((seed % 8) + 1).toString()}${phoneSuffix}`,
    nidNumber: String(nid || ''),
  };

  const appointments = Array.from({ length: 2 }).map((_, index) => {
    const appointmentDate = new Date(baseDate);
    appointmentDate.setUTCDate(appointmentDate.getUTCDate() - index * 7);
    const appointmentId = `${(safeSlug || 'PARTNER').toUpperCase()}-${patientIdSuffix}-${index + 1}`;
    return {
      AppointmentID: appointmentId,
      DoctorName: doctorName,
      ScheduleDate: appointmentDate.toISOString().slice(0, 10),
      StartTime: index === 0 ? '10:00' : '15:30',
      EndTime: index === 0 ? '10:30' : '16:00',
      Status: index === 0 ? 'completed' : 'follow-up',
      Notes:
        index === 0
          ? `Primary consultation completed at ${hospital.name || 'the partner hospital'}.`
          : `Follow-up visit at ${hospital.name || 'the partner hospital'} to review treatment progress.`,
    };
  });

  const labReports = appointments.map((appointment, index) => {
    const createdAt = `${appointment.ScheduleDate}T14:00:00.000Z`;
    return {
      LabReportID: `${appointment.AppointmentID}-LAB`,
      Title: index === 0 ? 'Comprehensive Lab Panel' : 'Follow-up Blood Work',
      Description: `Diagnostic results shared by ${hospital.name || 'the partner hospital'}.`,
      FileUrl: `https://example.org/${safeSlug || 'partner'}/lab-reports/${appointment.AppointmentID}.pdf`,
      TestName: index === 0 ? 'Comprehensive metabolic panel' : 'Complete blood count',
      BaseCharge: 3500 + index * 450,
      DiscountAmount: 450,
      FinalCharge: 3050 + index * 400,
      PackageID: null,
      CreatedAt: createdAt,
      AdminName: `${hospital.name || 'Partner hospital'} Records Team`,
      PackageName: index === 0 ? 'Preventive Care Bundle' : null,
    };
  });

  return {
    patient,
    appointments,
    labReports,
  };
}

function createMockAppointmentAssets(hospital, nid, appointmentId) {
  const data = createMockHospitalData(hospital, nid);
  const appointment = data.appointments.find(
    (item) => String(item.AppointmentID) === String(appointmentId)
  );

  if (!appointment) {
    return null;
  }

  const safeSlug = sanitizeSlug(hospital.slug || 'partner');
  const createdAt = `${appointment.ScheduleDate}T15:30:00.000Z`;

  const documents = [
    {
      DocumentID: `${appointment.AppointmentID}-DOC`,
      DocumentName: 'Visit summary',
      FileUrl: `https://example.org/${safeSlug || 'partner'}/documents/${appointment.AppointmentID}-summary.pdf`,
      UploadedAt: createdAt,
      AppointmentID: appointment.AppointmentID,
    },
    {
      DocumentID: `${appointment.AppointmentID}-RX`,
      DocumentName: 'Prescription sheet',
      FileUrl: `https://example.org/${safeSlug || 'partner'}/documents/${appointment.AppointmentID}-prescription.pdf`,
      UploadedAt: createdAt,
      AppointmentID: appointment.AppointmentID,
    },
  ];

  const doctorReports = [
    {
      ReportID: `${appointment.AppointmentID}-REPORT`,
      AppointmentID: appointment.AppointmentID,
      Title: `${hospital.name || 'Partner hospital'} consultation report`,
      Description: `Detailed consultation notes from ${appointment.DoctorName}.`,
      FileUrl: `https://example.org/${safeSlug || 'partner'}/reports/${appointment.AppointmentID}.pdf`,
      CreatedAt: createdAt,
      DoctorName: appointment.DoctorName,
    },
  ];

  return {
    patient: data.patient,
    appointment,
    documents,
    doctorReports,
    labReports: data.labReports,
  };
}

async function fetchHospitalAppointments(hospital, nid) {
  const descriptor = describeHospital(hospital);
  const type = hospital && hospital.type === 'local' ? 'local' : 'partner';

  const result =
    type === 'local'
      ? await fetchLocalHospitalAppointments(nid)
      : await fetchPartnerHospitalAppointments(hospital, nid);

  return {
    hospital: descriptor,
    status: result.status,
    message: result.message,
    patient: result.patient,
    appointments: Array.isArray(result.appointments) ? result.appointments : [],
    labReports: Array.isArray(result.labReports) ? result.labReports : [],
  };
}

async function fetchHospitalAppointmentAssets(hospital, nid, appointmentId) {
  const descriptor = describeHospital(hospital);
  const type = hospital && hospital.type === 'local' ? 'local' : 'partner';

  const result =
    type === 'local'
      ? await fetchLocalHospitalAppointmentAssets(nid, appointmentId)
      : await fetchPartnerHospitalAppointmentAssets(hospital, nid, appointmentId);

  return {
    hospital: descriptor,
    status: result.status,
    message: result.message,
    patient: result.patient || null,
    appointment: result.appointment || null,
    documents: Array.isArray(result.documents) ? result.documents : [],
    doctorReports: Array.isArray(result.doctorReports) ? result.doctorReports : [],
    labReports: Array.isArray(result.labReports) ? result.labReports : [],
  };
}

module.exports = {
  fetchHospitalAppointments,
  fetchHospitalAppointmentAssets,
};
