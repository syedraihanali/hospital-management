const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getOverview } = require('../controllers/adminController');
const {
  fetchAboutContent,
  saveAboutContent,
  fetchServicePackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../controllers/adminContentController');

const router = Router();

router.get('/overview', authenticateToken, authorizeRoles('admin'), asyncHandler(getOverview));
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
