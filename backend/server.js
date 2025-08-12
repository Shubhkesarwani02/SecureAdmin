const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import custom logger
const { logger, createMorganFormat } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://superadmin.framtt.com',
    'https://framtt-superadmin.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for refresh tokens
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Custom logging middleware with better formatting
app.use(morgan(createMorganFormat()));

// Database connection test
const { testConnection } = require('./services/database');

// Request logging for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    if (!req.url.includes('/health') && !req.url.includes('/favicon.ico')) {
      logger.debug(`Incoming request: ${req.method} ${req.url}`, {
        body: req.body,
        query: req.query,
        headers: req.headers
      });
    }
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.status(200).json({
    success: true,
    message: 'Framtt Superadmin API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Handle 404 errors
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server and test database connection
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Server starting anyway...');
    }
    
    app.listen(PORT, () => {
      logger.server.start(PORT, process.env.NODE_ENV || 'development');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  🔐 Authentication: /api/auth');
      console.log('  👥 Users: /api/users');
      console.log('  🏢 Accounts: /api/accounts');
      console.log('  � Assignments: /api/assignments');
      console.log('  �📊 Dashboard: /api/dashboard');
      console.log('  📋 Audit: /api/audit');
      console.log('  🚗 Vehicles: /api/vehicles');
      console.log('  👤 Clients: /api/clients');
      console.log('  ⚙️  Admin: /api/admin');
      console.log('  🔔 Notifications: /api/notifications');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;