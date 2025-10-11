const {
  findPatientByNid,
  listPatientDocuments,
  listPatientReports,
  listPatientLabReports,
} = require('../services/patientService');
const {
  getHospitalNetwork,
  getHospitalBySlug,
  getPrimaryHospital,
} = require('../config/hospitalNetwork');
const {
  fetchHospitalAppointments,
  fetchHospitalAppointmentAssets,
} = require('../services/hospitalNetworkService');

function sanitizeNid(nid) {
  return String(nid || '').trim();
}

function sanitizeHospital(value) {
  return String(value || '').trim().toLowerCase();
}

function formatPatientSummary(patient) {
  return {
    id: patient.PatientID,
    fullName: patient.FullName,
    email: patient.Email,
    phoneNumber: patient.PhoneNumber,
    nidNumber: patient.NidNumber,
  };
}

async function getAppointmentsByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);
  const hospitalQuery = sanitizeHospital(req.query.hospital);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  const hospitals = getHospitalNetwork();
  if (!hospitals.length) {
    return res.status(500).json({ message: 'No hospitals are configured for patient access.' });
  }

  let targetHospitals = hospitals;
  let requestedHospital = 'all';

  if (hospitalQuery && hospitalQuery !== 'all') {
    const selectedHospital = getHospitalBySlug(hospitalQuery);
    if (!selectedHospital) {
      return res.status(404).json({ message: 'The selected hospital could not be found in the network.' });
    }
    targetHospitals = [selectedHospital];
    requestedHospital = selectedHospital.slug;
  }

  const results = await Promise.all(
    targetHospitals.map(async (hospital) => {
      try {
        return await fetchHospitalAppointments(hospital, nid);
      } catch (error) {
        return {
          hospital: {
            slug: hospital.slug,
            name: hospital.name,
            isPrimary: !!hospital.isPrimary,
          },
          status: 'failed',
          message: error.message || 'Unable to load records from this hospital.',
          patient: null,
          appointments: [],
          labReports: [],
        };
      }
    })
  );

  const compareByPriority = (a, b) => {
    const hospitalA = a?.hospital || a;
    const hospitalB = b?.hospital || b;
    const aPrimary = hospitalA?.isPrimary ? 1 : 0;
    const bPrimary = hospitalB?.isPrimary ? 1 : 0;
    if (aPrimary !== bPrimary) {
      return bPrimary - aPrimary;
    }
    const nameA = (hospitalA?.name || '').toLowerCase();
    const nameB = (hospitalB?.name || '').toLowerCase();
    if (nameA && nameB) {
      return nameA.localeCompare(nameB);
    }
    if (nameA) {
      return -1;
    }
    if (nameB) {
      return 1;
    }
    return 0;
  };

  const orderedHospitals = [...hospitals]
    .map((hospital) => ({
      slug: hospital.slug,
      name: hospital.name,
      isPrimary: !!hospital.isPrimary,
      type: hospital.type || 'partner',
    }))
    .sort(compareByPriority);

  const orderedResults = [...results].sort(compareByPriority);

  return res.json({
    requestedHospital,
    hospitals: orderedHospitals,
    results: orderedResults,
  });
}

async function getMedicalHistoryByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  const patient = await findPatientByNid(nid);
  if (!patient) {
    return res.status(404).json({ message: 'No patient found for the provided NID number.' });
  }

  const [documents, doctorReports, labReports] = await Promise.all([
    listPatientDocuments(patient.PatientID, { sort: 'desc' }),
    listPatientReports(patient.PatientID, { sort: 'desc' }),
    listPatientLabReports(patient.PatientID, { sort: 'desc' }),
  ]);

  const prescriptions = documents.filter((doc) => /prescription/i.test(doc.DocumentName || ''));
  const otherDocuments = documents.filter((doc) => !/prescription/i.test(doc.DocumentName || ''));

  return res.json({
    patient: formatPatientSummary(patient),
    documents: otherDocuments,
    prescriptions,
    doctorReports,
    labReports,
  });
}

async function getAppointmentAssetsByNid(req, res) {
  const nid = sanitizeNid(req.query.nid);
  const appointmentId = String(req.params.appointmentId || '').trim();
  const hospitalQuery = sanitizeHospital(req.query.hospital);

  if (!nid) {
    return res.status(400).json({ message: 'NID number is required to continue.' });
  }

  if (!appointmentId) {
    return res.status(400).json({ message: 'A valid appointment identifier is required.' });
  }

  const hospitals = getHospitalNetwork();
  if (!hospitals.length) {
    return res.status(500).json({ message: 'No hospitals are configured for patient access.' });
  }

  let hospital = null;
  if (hospitalQuery && hospitalQuery !== 'all') {
    hospital = getHospitalBySlug(hospitalQuery);
    if (!hospital) {
      return res.status(404).json({ message: 'The selected hospital could not be found in the network.' });
    }
  } else {
    hospital = getPrimaryHospital();
  }

  if (!hospital) {
    return res.status(404).json({ message: 'Unable to determine which hospital to query.' });
  }

  try {
    const result = await fetchHospitalAppointmentAssets(hospital, nid, appointmentId);

    if (result.status === 'succeeded') {
      return res.json({
        hospital: result.hospital,
        patient: result.patient,
        appointment: result.appointment,
        documents: result.documents,
        doctorReports: result.doctorReports,
        labReports: result.labReports,
      });
    }

    if (result.status === 'invalid') {
      return res
        .status(400)
        .json({ message: result.message || 'A valid appointment identifier is required.' });
    }

    const statusCode = result.status === 'not_found' ? 404 : 502;
    return res.status(statusCode).json({
      message: result.message || 'Unable to load appointment details for the selected hospital.',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Something went wrong while fetching the appointment details.',
    });
  }
}

module.exports = {
  getAppointmentsByNid,
  getMedicalHistoryByNid,
  getAppointmentAssetsByNid,
};
