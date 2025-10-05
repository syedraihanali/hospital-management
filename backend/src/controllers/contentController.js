const {
  getAboutContent,
  getServicePackages,
  getSiteSettings,
  getHomeHeroContent,
} = require('../services/contentService');

async function fetchAboutContent(_req, res) {
  const content = await getAboutContent();
  res.json(content);
}

async function fetchServicePackages(_req, res) {
  const packages = await getServicePackages();
  res.json(packages);
}

async function fetchSiteSettings(_req, res) {
  const settings = await getSiteSettings();
  res.json(settings);
}

async function fetchHomeHeroContent(_req, res) {
  const hero = await getHomeHeroContent();
  res.json(hero);
}

module.exports = {
  fetchAboutContent,
  fetchServicePackages,
  fetchSiteSettings,
  fetchHomeHeroContent,
};
