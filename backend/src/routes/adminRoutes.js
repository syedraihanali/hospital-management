const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const {
  getOverview,
  getDoctorApplications,
  reviewDoctorApplicationHandler,
  searchDoctorsDirectoryHandler,
  getDoctorDirectoryProfile,
  getDoctorAppointmentsForAdminHandler,
} = require('../controllers/adminController');
const {
  fetchAboutContent,
  saveAboutContent,
  fetchSiteSettings,
  saveSiteSettings,
  fetchHomeHero,
  saveHomeHero,
  fetchServicePackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../controllers/adminContentController');

const router = Router();

router.get('/overview', authenticateToken, authorizeRoles('admin'), asyncHandler(getOverview));
router.get(
  '/doctor-applications',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(getDoctorApplications)
);
router.post(
  '/doctor-applications/:id/review',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(reviewDoctorApplicationHandler)
);
router.get(
  '/doctors',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(searchDoctorsDirectoryHandler)
);
router.get(
  '/doctors/:id/profile',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(getDoctorDirectoryProfile)
);
router.get(
  '/doctors/:id/appointments',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(getDoctorAppointmentsForAdminHandler)
);
router.get(
  '/content/about',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(fetchAboutContent)
);
router.put(
  '/content/about',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(saveAboutContent)
);
router.get(
  '/content/site-settings',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(fetchSiteSettings)
);
router.put(
  '/content/site-settings',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(saveSiteSettings)
);
router.get(
  '/content/home-hero',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(fetchHomeHero)
);
router.put(
  '/content/home-hero',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(saveHomeHero)
);
router.get(
  '/content/service-packages',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(fetchServicePackages)
);
router.post(
  '/content/service-packages',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(createPackage)
);
router.put(
  '/content/service-packages/:id',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(updatePackage)
);
router.delete(
  '/content/service-packages/:id',
  authenticateToken,
  authorizeRoles('admin'),
  asyncHandler(deletePackage)
);

module.exports = router;
