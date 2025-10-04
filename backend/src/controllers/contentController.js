const { getAboutContent, getServicePackages } = require('../services/contentService');

async function fetchAboutContent(_req, res) {
  const content = await getAboutContent();
  res.json(content);
}

async function fetchServicePackages(_req, res) {
  const packages = await getServicePackages();
  res.json(packages);
}

module.exports = {
  fetchAboutContent,
  fetchServicePackages,
};
