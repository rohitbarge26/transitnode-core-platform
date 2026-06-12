const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// GET /api/transports/fleet (can be used by Receptionist)
router.get('/fleet', verifyToken, transportController.getFleet);

// GET /api/transports/drivers
router.get('/drivers', verifyToken, transportController.getDrivers);

// POST /api/transports/driver/start-trip (For future Driver App)
router.post('/driver/start-trip', verifyToken, transportController.startTrip);

// POST /api/transports/gate-clerk/verify (requires Gate Clerk/Admin)
router.post('/gate-clerk/verify', verifyToken, checkRole(['ADMIN', 'GATE_CLERK']), transportController.verifyDeliveryOtp);

module.exports = router;
