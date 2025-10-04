const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { fetchAboutContent, fetchServicePackages, fetchSiteSettings } = require('../controllers/contentController');

const router = Router();

router.get('/about', asyncHandler(fetchAboutContent));
router.get('/service-packages', asyncHandler(fetchServicePackages));
router.get('/site-settings', asyncHandler(fetchSiteSettings));

module.exports = router;
