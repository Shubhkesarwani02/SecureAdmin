// =============================================
// IMPERSONATION SECURITY MIDDLEWARE
// Enhanced security for impersonation sessions
// =============================================

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../services/database_simplified');
const ImpersonationWorkflow = require('../utils/impersonationWorkflow');

/**
 * Middleware to handle impersonation-aware authentication
 * This middleware handles both regular and impersonation tokens
 */
const impersonationAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Decode and verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Handle impersonation tokens
        if (decoded.isImpersonating) {
            // Validate impersonation session is still active
            const session = await db.getImpersonationLogById(decoded.impersonationLogId);
            
            if (!session || session.end_time) {
                return res.status(401).json({
                    success: false,
                    message: 'Impersonation session has ended or is invalid'
                });
            }

            // Set impersonation context
            req.user = {
                userId: decoded.user_id,
                email: decoded.email,
                role: decoded.role,
                account_id: decoded.account_id,
                isImpersonating: true,
                impersonatorId: decoded.impersonator_id,
                impersonationLogId: decoded.impersonationLogId || session.id
            };
            
            // Enhanced logging for impersonation activities
            req.impersonationContext = {
                sessionId: session.id,
                startTime: session.start_time,
                impersonator: {
                    id: decoded.impersonator_id
                }
            };
            
        } else {
            // Regular token
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                account_id: decoded.account_id,
                isImpersonating: false
            };
        }

        next();

    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Middleware to log impersonation activities
 */
const logImpersonationActivity = (action) => {
    return (req, res, next) => {
        if (req.user?.isImpersonating) {
            logger.info('Impersonation activity', {
                action,
                sessionId: req.impersonationContext?.sessionId,
                impersonatorId: req.user.impersonatorId,
                targetUserId: req.user.userId,
                endpoint: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
        }
        next();
    };
};

/**
 * Middleware to prevent impersonation of higher-privileged users
 */
const preventPrivilegeEscalation = async (req, res, next) => {
    try {
        if (req.user?.isImpersonating) {
            const impersonator = await db.getUserById(req.user.impersonatorId);
            
            // Prevent privilege escalation
            if (impersonator.role === 'admin' && req.user.role === 'superadmin') {
                logger.warn('Privilege escalation attempt detected', {
                    impersonatorId: req.user.impersonatorId,
                    impersonatorRole: impersonator.role,
                    targetRole: req.user.role,
                    sessionId: req.impersonationContext?.sessionId
                });
                
                return res.status(403).json({
                    success: false,
                    message: 'Privilege escalation detected. Session terminated.'
                });
            }
        }
        next();
    } catch (error) {
        logger.error('Error in privilege escalation check:', error);
        next(error);
    }
};

/**
 * Middleware to enforce impersonation session timeouts
 */
const enforceSessionTimeout = async (req, res, next) => {
    try {
        if (req.user?.isImpersonating) {
            const session = await db.getImpersonationLogById(req.impersonationContext.sessionId);
            
            // Check if session has exceeded maximum duration (e.g., 2 hours)
            const maxDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
            const sessionAge = Date.now() - new Date(session.start_time).getTime();
            
            if (sessionAge > maxDuration) {
                // Auto-end the session
                await db.endImpersonationSession(session.id);
                
                logger.warn('Impersonation session auto-expired', {
                    sessionId: session.id,
                    duration: sessionAge,
                    maxDuration
                });
                
                return res.status(401).json({
                    success: false,
                    message: 'Impersonation session has expired due to timeout'
                });
            }
        }
        next();
    } catch (error) {
        logger.error('Error in session timeout check:', error);
        next(error);
    }
};

/**
 * Middleware to restrict sensitive operations during impersonation
 */
const restrictSensitiveOperations = (operations = []) => {
    return (req, res, next) => {
        if (req.user?.isImpersonating) {
            const endpoint = req.originalUrl;
            const method = req.method;
            const operation = `${method} ${endpoint}`;
            
            // Default restricted operations
            const defaultRestricted = [
                'DELETE /api/users',
                'POST /api/users/create',
                'PUT /api/users/role',
                'POST /api/impersonation/start',
                'DELETE /api/accounts'
            ];
            
            const allRestricted = [...defaultRestricted, ...operations];
            
            const isRestricted = allRestricted.some(restricted => {
                return operation.includes(restricted.split(' ')[1]) && 
                       method === restricted.split(' ')[0];
            });
            
            if (isRestricted) {
                logger.warn('Restricted operation attempted during impersonation', {
                    operation,
                    sessionId: req.impersonationContext?.sessionId,
                    impersonatorId: req.user.impersonatorId
                });
                
                return res.status(403).json({
                    success: false,
                    message: 'This operation is not allowed during impersonation'
                });
            }
        }
        next();
    };
};

/**
 * Middleware to add impersonation headers to responses
 */
const addImpersonationHeaders = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
        if (req.user?.isImpersonating) {
            res.set({
                'X-Impersonation-Active': 'true',
                'X-Impersonation-Session': req.impersonationContext?.sessionId,
                'X-Impersonator-Id': req.user.impersonatorId,
                'X-Target-User-Id': req.user.userId
            });
        } else {
            res.set('X-Impersonation-Active', 'false');
        }
        
        originalSend.call(this, body);
    };
    
    next();
};

module.exports = {
    impersonationAuth,
    logImpersonationActivity,
    preventPrivilegeEscalation,
    enforceSessionTimeout,
    restrictSensitiveOperations,
    addImpersonationHeaders
};
