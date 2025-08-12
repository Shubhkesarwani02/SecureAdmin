const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import simplified routes
const authRoutes = require('./routes/authRoutes_simplified');
const accountRoutes = require('./routes/accountRoutes_simplified');
const assignmentRoutes = require('./routes/assignmentRoutes_simplified');
const impersonationRoutes = require('./routes/impersonationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/impersonation', impersonationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'Superadmin API - Simplified Schema',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            accounts: '/api/accounts',
            assignments: '/api/assignments',
            impersonation: '/api/impersonation'
        },
        schema: {
            users: {
                fields: ['id', 'email', 'password_hash', 'role', 'created_at', 'updated_at'],
                roles: ['superadmin', 'admin', 'csm', 'user']
            },
            accounts: {
                fields: ['id', 'name', 'created_at', 'updated_at']
            },
            csm_assignments: {
                fields: ['csm_id', 'account_id']
            },
            user_accounts: {
                fields: ['user_id', 'account_id']
            },
            impersonation_logs: {
                fields: ['id', 'impersonator_id', 'impersonated_id', 'start_time', 'end_time', 'reason']
            }
        }
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV !== 'production') {
        logger.info(`API documentation: http://localhost:${PORT}/api`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
