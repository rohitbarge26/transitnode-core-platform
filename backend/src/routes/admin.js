const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// All admin routes are protected and require ADMIN role
router.use(verifyToken);
router.use(checkRole(['ADMIN']));

const { startDemoSimulation, stopDemoSimulation } = require('../hardware/demoSimulator');

// User Management
router.post('/users/create', adminController.createUser);

// Driver Management
router.post('/drivers/create', adminController.createDriver);
router.get('/drivers', adminController.getDrivers);

// Analytics
router.get('/analytics/revenue', adminController.getAnalytics);

// Rate Card Configuration
router.get('/rates', adminController.getRates);
router.put('/rates/update', adminController.updateRates);

// Live Hardware Tracking
router.post('/devices/map', adminController.mapDevice);
router.post('/fleet/register', adminController.registerFleetAsset);

// Compliance Vault
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

router.post('/compliance/upload', upload.single('document'), adminController.uploadComplianceDocument);
router.get('/compliance/documents', adminController.getComplianceDocuments);

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
