const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { validateEnvironment } = require('./config/environment');
validateEnvironment();
const express = require('express');
const app = express();
const connectDB = require('./config/nosql');

// Connect to Database
connectDB();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

const cors = require('cors');
// Middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[BACKEND] Received ${req.method} request to ${req.url}`);
  res.on('finish', () => {
    console.log(`[BACKEND] Responded with status ${res.statusCode}`);
  });
  next();
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shipmentRoutes = require('./routes/shipments');
const invoiceRoutes = require('./routes/invoices');
const adminRoutes = require('./routes/admin');
const transportRoutes = require('./routes/transports');
const financeRoutes = require('./routes/finance');
const exportRoutes = require('./routes/export');
const payrollRoutes = require('./routes/payroll');
const saasRoutes = require('./routes/saas');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/finance/export', exportRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/saas', saasRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('TransitNode ERP Backend API is running');
});

// Real-time sockets
io.on('connection', (socket) => {
  console.log('a user connected via socket:', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Telemetry Mock Simulator
const protocolParser = require('./hardware/protocolParser');
setInterval(async () => {
  try {
    const Device = require('./models/NoSQL/Device');
    const devices = await Device.find({ status: 'ACTIVE' });
    devices.forEach((device) => {
      // Simulate moving around Mumbai coordinates
      const lat = 19.0760 + (Math.random() - 0.5) * 0.1;
      const lng = 72.8777 + (Math.random() - 0.5) * 0.1;
      const speed = Math.floor(Math.random() * 80);
      io.emit('telemetry_update', {
        imei: device.imei,
        vehicleRegistration: device.vehicleRegistration,
        driverName: device.driverName,
        location: { lat, lng },
        speed,
        ignition: speed > 0,
        timestamp: new Date()
      });

      // Execute Geofence Proximity check
      protocolParser.processGeofenceProximity(device.vehicleRegistration, lat, lng);
    });
  } catch (error) {
    console.error('Error simulating telemetry:', error);
  }
}, 3000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
