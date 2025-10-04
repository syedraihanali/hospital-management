const {
  getAboutContent,
  updateAboutContent,
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
} = require('../services/contentService');

async function fetchAboutContent(_req, res) {
  const content = await getAboutContent();
  res.json(content);
}

async function saveAboutContent(req, res) {
  const updated = await updateAboutContent(req.body);
  res.json(updated);
}

async function fetchServicePackages(_req, res) {
  const packages = await getServicePackages();
  res.json(packages);
}

async function createPackage(req, res) {
  const created = await createServicePackage(req.body);
  res.status(201).json(created);
}

async function updatePackage(req, res) {
  const { id } = req.params;
  const packageId = Number.parseInt(id, 10);
  if (Number.isNaN(packageId)) {
    const error = new Error('Invalid package identifier.');
    error.status = 400;
    throw error;
  }

  const updated = await updateServicePackage(packageId, req.body);
  res.json(updated);
}

async function deletePackage(req, res) {
  const { id } = req.params;
  const packageId = Number.parseInt(id, 10);
  if (Number.isNaN(packageId)) {
    const error = new Error('Invalid package identifier.');
    error.status = 400;
    throw error;
  }

  await deleteServicePackage(packageId);
  res.status(204).send();
}

module.exports = {
  fetchAboutContent,
  saveAboutContent,
  fetchServicePackages,
  createPackage,
  updatePackage,
  deletePackage,
};
