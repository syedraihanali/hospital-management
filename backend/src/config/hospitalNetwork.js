const PRIMARY_HOSPITAL_SLUG = String(process.env.PRIMARY_HOSPITAL_SLUG || 'destination-health')
  .trim()
  .toLowerCase();
const PRIMARY_HOSPITAL_NAME = String(process.env.PRIMARY_HOSPITAL_NAME || 'Destination Health').trim();

function normalizeBaseUrl(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function normalizePartnerHospital(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const slug = String(entry.slug || '')
    .trim()
    .toLowerCase();
  const name = String(entry.name || '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!slug || !name || slug === PRIMARY_HOSPITAL_SLUG) {
    return null;
  }

  return {
    slug,
    name,
    isPrimary: false,
    type: 'partner',
    baseUrl: normalizeBaseUrl(entry.baseUrl),
  };
}

function parsePartnerHospitalsFromEnv() {
  const raw = process.env.PARTNER_HOSPITALS || process.env.HOSPITAL_NETWORK || '';
  if (!raw || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizePartnerHospital).filter(Boolean);
  } catch (error) {
    return [];
  }
}

const fallbackPartnerDefinitions = [
  {
    slug: 'skyline-medical-center',
    name: 'Skyline Medical Center',
    baseUrl: process.env.PARTNER_HOSPITAL_SKYLINE_URL,
  },
  {
    slug: 'lakeside-regional-hospital',
    name: 'Lakeside Regional Hospital',
    baseUrl: process.env.PARTNER_HOSPITAL_LAKESIDE_URL,
  },
];

const fallbackPartners = fallbackPartnerDefinitions.map(normalizePartnerHospital).filter(Boolean);
const envPartners = parsePartnerHospitalsFromEnv();

const partnerHospitals = envPartners.length ? envPartners : fallbackPartners;

function uniqueHospitals(list, excludedSlugs = new Set()) {
  const seen = new Set(Array.from(excludedSlugs));
  const result = [];

  list.forEach((hospital) => {
    if (!hospital || seen.has(hospital.slug)) {
      return;
    }
    seen.add(hospital.slug);
    result.push({ ...hospital });
  });

  return result;
}

const primaryHospital = {
  slug: PRIMARY_HOSPITAL_SLUG,
  name: PRIMARY_HOSPITAL_NAME,
  isPrimary: true,
  type: 'local',
  baseUrl: null,
};

const hospitalNetwork = [
  primaryHospital,
  ...uniqueHospitals(partnerHospitals, new Set([primaryHospital.slug])),
];

function cloneHospital(hospital) {
  return hospital ? { ...hospital } : null;
}

function getHospitalNetwork() {
  return hospitalNetwork.map(cloneHospital);
}

function getHospitalBySlug(slug) {
  if (!slug) {
    return null;
  }
  const normalized = String(slug).trim().toLowerCase();
  const match = hospitalNetwork.find((hospital) => hospital.slug === normalized);
  return cloneHospital(match);
}

function getPrimaryHospital() {
  const primary = hospitalNetwork.find((hospital) => hospital.isPrimary) || hospitalNetwork[0] || null;
  return cloneHospital(primary);
}

module.exports = {
  getHospitalNetwork,
  getHospitalBySlug,
  getPrimaryHospital,
};
