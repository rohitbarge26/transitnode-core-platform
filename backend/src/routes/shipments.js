const express = require('express');
const router = express.Router();
const shipController = require('../controllers/shipController');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure upload storage for Lorry Receipts (LR Copies)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `lr-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// GET /api/shipments/fix-db (TEMPORARY FIX)
router.get('/fix-db', shipController.fixFlipkartAmount);

// GET /api/shipments/check-admin (TEMPORARY FIX)
router.get('/check-admin', shipController.checkAdmin);

// POST /api/shipments/create (requires Operation Executive/Admin)
router.post('/create', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), shipController.createShipment);

// PUT /api/shipments/:trackingId (requires Operation Executive/Admin)
router.put('/:trackingId', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), shipController.updateShipment);

// GET /api/shipments
router.get('/', verifyToken, shipController.listShipments);

// GET /api/shipments/stats
router.get('/stats', verifyToken, shipController.getStats);

// GET /api/shipments/invoices/pending (Requires Accountant/Admin)
router.get('/invoices/pending', verifyToken, checkRole(['ACCOUNTANT', 'ADMIN']), shipController.getPendingInvoices);

// POST /api/shipments/:trackingId/pay (Requires Accountant/Admin)
router.post('/:trackingId/pay', verifyToken, checkRole(['ACCOUNTANT', 'ADMIN']), shipController.processPayment);

// POST /api/shipments/:trackingId/upload-lr (Requires Operation/Admin)
router.post('/:trackingId/upload-lr', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), upload.single('lrCopy'), shipController.uploadLrCopy);

// POST /api/shipments/:trackingId/generate-lr (Requires Operation/Admin)
router.post('/:trackingId/generate-lr', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), shipController.generateLrCopyOnline);

// POST /api/shipments/:trackingId/log-exception (Requires Operation/Admin)
router.post('/:trackingId/log-exception', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), shipController.logException);

// PATCH /api/shipments/:trackingId/resolve-exception/:exceptionId (Requires Operation/Admin)
router.patch('/:trackingId/resolve-exception/:exceptionId', verifyToken, checkRole(['OPERATION_EXECUTIVE', 'ADMIN', 'OPERATION']), shipController.resolveException);

// GET /api/shipments/:trackingId (Public tracker)
router.get('/:trackingId', shipController.getShipment);

module.exports = router;
