const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const verifyToken = require('../middleware/verifyToken');

// Apply auth middleware
router.use(verifyToken);

router.get('/ledger', financeController.getTrialBalance);
router.get('/pnl', financeController.getPnL);
router.get('/trips/:trackingNumber', financeController.getTripDetails);

module.exports = router;
