const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticateToken = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getOverview } = require('../controllers/adminController');

const router = Router();

router.get('/overview', authenticateToken, authorizeRoles('admin'), asyncHandler(getOverview));

module.exports = router;
