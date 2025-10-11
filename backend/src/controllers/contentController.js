const {
  getAboutContent,
  getServicePackages,
  getSiteSettings,
  getHomeHeroContent,
  getLabTests,
  createServicePackageOrder,
} = require('../services/contentService');
const { findPatientById } = require('../services/patientService');
const { findPaymentMethod } = require('../constants/paymentMethods');

async function fetchAboutContent(_req, res) {
  const content = await getAboutContent();
  res.json(content);
}

async function fetchServicePackages(_req, res) {
  const packages = await getServicePackages();
  res.json(packages);
}

async function fetchLabTests(_req, res) {
  const tests = await getLabTests();
  res.json(tests);
}

async function fetchSiteSettings(_req, res) {
  const settings = await getSiteSettings();
  res.json(settings);
}

async function fetchHomeHeroContent(_req, res) {
  const hero = await getHomeHeroContent();
  res.json(hero);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  const cleaned = String(value || '').trim();
  return cleaned;
}

function phoneDigits(value) {
  return (value || '').replace(/\D/g, '');
}

async function purchaseServicePackage(req, res) {
  const packageId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(packageId)) {
    return res.status(400).json({ message: 'Invalid package identifier.' });
  }

  const {
    fullName = '',
    email = '',
    phoneNumber = '',
    phone = '',
    nidNumber = '',
    nid = '',
    notes = '',
    paymentMethod = '',
  } = req.body || {};

  let patientId = null;
  let patientProfile = null;

  if (req.user?.role === 'patient') {
    const parsedPatientId = Number.parseInt(req.user.id, 10);
    if (!Number.isNaN(parsedPatientId)) {
      patientProfile = await findPatientById(parsedPatientId);
      if (patientProfile) {
        patientId = patientProfile.PatientID;
      }
    }
  }

  const trimmedName = String(fullName || patientProfile?.FullName || '').trim();
  if (!trimmedName) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  const trimmedEmail = String(email || patientProfile?.Email || '')
    .trim()
    .toLowerCase();
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const rawPhone = phoneNumber || phone || patientProfile?.PhoneNumber;
  const trimmedPhone = normalizePhone(rawPhone);
  if (!trimmedPhone) {
    return res.status(400).json({ message: 'A valid phone number is required.' });
  }

  if (phoneDigits(trimmedPhone).length < 6) {
    return res.status(400).json({ message: 'Phone number must include at least six digits.' });
  }

  const trimmedNid = String(nidNumber || nid || '').trim();
  const trimmedNotes = String(notes || '').trim();
  const paymentMethodOption = findPaymentMethod(paymentMethod);

  if (!paymentMethodOption) {
    return res.status(400).json({ message: 'Please choose a valid payment method.' });
  }

  try {
    const order = await createServicePackageOrder(packageId, {
      fullName: trimmedName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      nidNumber: trimmedNid,
      notes: trimmedNotes,
      patientId,
      paymentMethod: paymentMethodOption.value,
    });
    return res.status(201).json(order);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }

    throw error;
  }
}

module.exports = {
  fetchAboutContent,
  fetchServicePackages,
  fetchLabTests,
  fetchSiteSettings,
  fetchHomeHeroContent,
  purchaseServicePackage,
};
