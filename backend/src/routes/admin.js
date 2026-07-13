const express = require('express');
const RateCard = require('../models/NoSQL/RateCard');
const router = express.Router();

router.get('/rates/clear', async (req, res) => {
  await RateCard.deleteMany({});
  res.json({ message: 'Cleared rate cards' });
});
const adminController = require('../controllers/adminController');
const supplierController = require('../controllers/supplierController');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// All admin routes are protected
router.use(verifyToken);

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Open to drivers for uploading receipts
router.post('/compliance/upload', upload.single('document'), adminController.uploadComplianceDocument);

// Open to all tenant users for dropdowns (including OPERATION_EXECUTIVE)
router.get('/suppliers', supplierController.getSuppliers);
router.get('/drivers', adminController.getDrivers);
router.get('/fleet', adminController.getFleetAssets);

// Fleet & Driver Management (accessible by OPERATION_EXECUTIVE and ADMIN)
router.post('/drivers/create', checkRole(['ADMIN', 'OPERATION_EXECUTIVE']), upload.single('document'), adminController.createDriver);
router.delete('/drivers/:id', checkRole(['ADMIN', 'OPERATION_EXECUTIVE']), adminController.deleteDriver);
router.post('/fleet/register', checkRole(['ADMIN', 'OPERATION_EXECUTIVE']), upload.single('document'), adminController.registerFleetAsset);
router.delete('/fleet/:id', checkRole(['ADMIN', 'OPERATION_EXECUTIVE']), adminController.deleteFleetAsset);
router.put('/drivers/:driverId/assign-vehicle', checkRole(['ADMIN', 'OPERATION_EXECUTIVE']), adminController.assignVehicleToDriver);

// Require ADMIN role for the rest
router.use(checkRole(['ADMIN']));

const { startDemoSimulation, stopDemoSimulation } = require('../hardware/demoSimulator');

// User Management
router.post('/users/create', adminController.createUser);

// Employee Management
router.post('/employee/verify', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), adminController.verifyEmployee);

// Analytics
router.get('/analytics/revenue', adminController.getAnalytics);

// Rate Card Configuration
router.get('/rates', adminController.getRates);
router.put('/rates/update', adminController.updateRates);

// Live Hardware Tracking
router.post('/devices/map', adminController.mapDevice);

// Compliance Vault
router.get('/compliance/documents', adminController.getComplianceDocuments);

// Supplier Management
router.post('/suppliers/create', supplierController.createSupplier);

// Subscription Management
router.get('/subscription', adminController.getSubscriptionDetails);
router.put('/subscription/upgrade', adminController.updateSubscriptionPlan);

// Daily Run Sheets
router.get('/runsheets', adminController.getDailyRunSheets);
router.post('/runsheets', adminController.createDailyRunSheet);

// Demo Simulation Toggle
router.post('/demo/toggle', (req, res) => {
  const { active } = req.body;
  const io = req.app.get('io');
  
  if (active) {
    startDemoSimulation(io);
    res.status(200).json({ message: 'Demo simulation started', active: true });
  } else {
    stopDemoSimulation();
    res.status(200).json({ message: 'Demo simulation stopped', active: false });
  }
});

module.exports = router;
