const { getOverviewMetrics } = require('../services/adminService');

async function getOverview(_req, res) {
  const overview = await getOverviewMetrics();
  return res.json(overview);
}

module.exports = {
  getOverview,
};
