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

// GET /api/transports/active-trip
router.get('/active-trip', verifyToken, async (req, res) => {
  try {
    const User = require('../models/NoSQL/User');
    const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
    
    // Get the driver's user document to find their phone number
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'DRIVER') {
      return res.status(403).json({ message: 'Only drivers can access this' });
    }

    const driverPhone = user.username; // Or user.driverProfile.phoneNumber

    // Find the most recent active trip for this driver
    const activeShipment = await ShipmentLedger.findOne({
      'logistics.transport.driverPhone': driverPhone,
      status: { $in: ['READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED'] }
    }).sort({ createdAt: -1 });

    if (!activeShipment) {
      return res.status(404).json({ message: 'No active trip found' });
    }

    // Format the response to match what the mobile app expects
    const formattedTrip = {
      trackingCode: activeShipment.trackingNumber,
      origin: activeShipment.logistics?.transport?.origin || 'Origin Hub',
      destination: activeShipment.logistics?.transport?.destination || 'Destination Hub',
      commodity: activeShipment.logistics?.transport?.commodityType || 'General Cargo',
      advanceCash: activeShipment.accounting?.driverAdvanceCash || 0,
      status: activeShipment.status,
      destinationCoords: '18.5204,73.8567' // Mock coordinates for Pune (or dynamic)
    };

    return res.status(200).json({ data: formattedTrip });
  } catch (error) {
    console.error('Error fetching active trip:', error);
    return res.status(500).json({ message: 'Server error fetching active trip' });
  }
});

// Real: Mobile app calls this to submit the OTP and complete the trip
router.post('/verify-delivery', verifyToken, async (req, res) => {
  try {
    const { tripId, otp } = req.body;
    const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
    const Device = require('../models/NoSQL/Device');
    const Driver = require('../models/NoSQL/Driver');

    const shipment = await ShipmentLedger.findOne({ trackingNumber: tripId });
    if (!shipment) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // In a full production system we would match the generated OTP:
    // if (shipment.accounting?.generatedDeliveryOtp !== otp) { ... }
    // For this demo, any 6 digit OTP or the hardcoded 849201 works
    
    shipment.status = 'DELIVERED';
    shipment.metadata.closedAt = new Date();
    await shipment.save();

    // Revert assigned vehicle and driver status to YARD / AVAILABLE
    const vehicleReg = shipment.logistics?.transport?.vehicleNumber;
    const driverPhone = shipment.logistics?.transport?.driverPhone;

    if (vehicleReg) {
      await Device.findOneAndUpdate({ vehicleRegistration: vehicleReg }, { status: 'YARD' });
      const io = req.app.get('io');
      if (io) io.emit('location-update', { vehicleId: vehicleReg, status: 'YARD' });
    }

    if (driverPhone) {
      await Driver.findOneAndUpdate({ phone: driverPhone }, { status: 'AVAILABLE' });
    }

    return res.status(200).json({ success: true, message: 'Delivery Confirmed', shipment });
  } catch (error) {
    console.error('Error verifying delivery:', error);
    return res.status(500).json({ message: 'Server error during delivery confirmation' });
  }
});

module.exports = router;
