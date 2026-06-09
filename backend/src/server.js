const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const app = express();
const connectDB = require('./config/nosql');

// Connect to Database
connectDB();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

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

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shipmentRoutes = require('./routes/shipments');
const invoiceRoutes = require('./routes/invoices');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/invoices', invoiceRoutes);

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
