const mongoose = require('mongoose');
const TelemetryLog = require('../models/NoSQL/TelemetryLog');
const mockRoute = require('./mockRoute');

let simulationInterval = null;
let currentStep = 0;

const startDemoSimulation = (io) => {
  if (simulationInterval) return; // Already running

  console.log('[DEMO] Starting Mock Simulation...');
  currentStep = 0;

  simulationInterval = setInterval(async () => {
    try {
      if (currentStep >= mockRoute.length) {
        currentStep = 0; // Loop the route
      }

      const coordinates = mockRoute[currentStep];
      const payload = {
        tenantId: new mongoose.Types.ObjectId(),
        vehicleId: 'DEMO-VEHICLE-01',
        status: 'MOVING',
        location: {
          type: 'Point',
          coordinates: coordinates
        },
        speed: 60 + Math.floor(Math.random() * 20), // 60-80 km/h
        heading: 320,
        ignition: true,
        timestamp: new Date()
      };

      // Save to MongoDB directly
      const logEntry = await TelemetryLog.create(payload);

      // Broadcast via socket.io
      io.emit('telemetry_update', {
        imei: 'DEMO-IMEI-01',
        vehicleRegistration: logEntry.vehicleId,
        driverName: 'Mock Driver',
        location: { lat: coordinates[1], lng: coordinates[0] },
        speed: logEntry.speed,
        ignition: logEntry.ignition,
        timestamp: logEntry.timestamp
      });

      currentStep++;
    } catch (error) {
      console.error('[DEMO] Error in simulation step:', error);
    }
  }, 4000); // 4 seconds step
};

const stopDemoSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('[DEMO] Stopped Mock Simulation.');
  }
};

module.exports = { startDemoSimulation, stopDemoSimulation };
