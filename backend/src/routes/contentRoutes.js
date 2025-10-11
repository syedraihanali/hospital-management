const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  fetchAboutContent,
  fetchServicePackages,
  fetchSiteSettings,
  fetchHomeHeroContent,
  fetchLabTests,
  purchaseServicePackage,
} = require('../controllers/contentController');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = Router();

router.get('/about', asyncHandler(fetchAboutContent));
router.get('/service-packages', asyncHandler(fetchServicePackages));
router.post(
  '/service-packages/:id/purchase',
  authenticateToken,
  authorizeRoles('patient'),
  asyncHandler(purchaseServicePackage)
);
router.get('/lab-tests', asyncHandler(fetchLabTests));
router.get('/site-settings', asyncHandler(fetchSiteSettings));
router.get('/home-hero', asyncHandler(fetchHomeHeroContent));

module.exports = router;
