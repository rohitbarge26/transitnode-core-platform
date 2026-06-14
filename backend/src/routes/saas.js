const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saasController');

// @route   POST /api/saas/register-tenant
// @desc    Register a new tenant
// @access  Public
router.post('/register-tenant', saasController.registerTenant);

// @route   GET /api/saas/tenant-profile
// @desc    Get tenant profile by subdomain
// @access  Public
router.get('/tenant-profile', saasController.getTenantProfile);

module.exports = router;
