const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  fetchAboutContent,
  fetchServicePackages,
  fetchSiteSettings,
  fetchHomeHeroContent,
  fetchLabTests,
} = require('../controllers/contentController');

const router = Router();

router.get('/about', asyncHandler(fetchAboutContent));
router.get('/service-packages', asyncHandler(fetchServicePackages));
router.get('/lab-tests', asyncHandler(fetchLabTests));
router.get('/site-settings', asyncHandler(fetchSiteSettings));
router.get('/home-hero', asyncHandler(fetchHomeHeroContent));

module.exports = router;
