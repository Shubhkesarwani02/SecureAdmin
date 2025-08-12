const db = require('../services/database_simplified');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const ImpersonationWorkflow = require('../utils/impersonationWorkflow');

class ImpersonationController {
    // Start impersonation session using enhanced workflow
    static async startImpersonation(req, res) {
        try {
            const { impersonated_id, reason } = req.body;
            const impersonator_id = req.user.userId;
            
            // Validate required fields
            if (!impersonated_id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID to impersonate is required'
                });
            }

            // Use enhanced workflow for impersonation
            const result = await ImpersonationWorkflow.startImpersonation(
                impersonator_id,
                impersonated_id,
                reason
            );

            res.json({
                success: true,
                message: 'Impersonation session started successfully',
                data: {
                    impersonationToken: result.token,
                    session: result.session
                }
            });

        } catch (error) {
            logger.error('Error starting impersonation:', error);
            
            // Handle specific error types
            if (error.message === 'Impersonation not allowed') {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to impersonate this user'
                });
            }
            
            if (error.message === 'Cannot impersonate yourself') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot impersonate yourself'
                });
            }
            
            if (error.message.includes('already have an active')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // End impersonation session
    static async endImpersonation(req, res) {
        try {
            const impersonatorId = req.user.impersonatorId;
            const impersonationLogId = req.user.impersonationLogId;
            
            if (!req.user.isImpersonating) {
                return res.status(400).json({
                    success: false,
                    message: 'No active impersonation session found'
                });
            }

            // End the impersonation session
            await db.endImpersonationSession(impersonationLogId);

            // Get the original user data
            const originalUser = await db.getUserById(impersonatorId);
            if (!originalUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Original user not found'
                });
            }

            // Generate new token for the original user
            const originalToken = jwt.sign(
                {
                    userId: originalUser.id,
                    email: originalUser.email,
                    role: originalUser.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            logger.info(`Impersonation ended: ${impersonatorId} stopped impersonating`);

            res.json({
                success: true,
                message: 'Impersonation session ended successfully',
                data: {
                    originalToken,
                    originalUser: {
                        id: originalUser.id,
                        email: originalUser.email,
                        role: originalUser.role
                    }
                }
            });

        } catch (error) {
            logger.error('Error ending impersonation:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get current impersonation status
    static async getImpersonationStatus(req, res) {
        try {
            const user = req.user;
            
            if (user.isImpersonating) {
                const impersonatedUser = await db.getUserById(user.userId);
                const impersonator = await db.getUserById(user.impersonatorId);
                
                res.json({
                    success: true,
                    data: {
                        isImpersonating: true,
                        impersonatedUser: {
                            id: impersonatedUser.id,
                            email: impersonatedUser.email,
                            role: impersonatedUser.role
                        },
                        impersonator: {
                            id: impersonator.id,
                            email: impersonator.email,
                            role: impersonator.role
                        },
                        sessionId: user.impersonationLogId
                    }
                });
            } else {
                res.json({
                    success: true,
                    data: {
                        isImpersonating: false
                    }
                });
            }

        } catch (error) {
            logger.error('Error getting impersonation status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get impersonation logs (admin only)
    static async getImpersonationLogs(req, res) {
        try {
            const userRole = req.user.role;
            
            // Check permissions
            if (!['superadmin', 'admin'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to view impersonation logs'
                });
            }

            const { page = 1, limit = 50, impersonator_id, impersonated_id } = req.query;
            
            const filters = {};
            if (impersonator_id) filters.impersonator_id = impersonator_id;
            if (impersonated_id) filters.impersonated_id = impersonated_id;

            const logs = await db.getImpersonationLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                filters
            });

            res.json({
                success: true,
                data: logs
            });

        } catch (error) {
            logger.error('Error fetching impersonation logs:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user's impersonation history
    static async getUserImpersonationHistory(req, res) {
        try {
            const userId = req.params.userId || req.user.userId;
            const requestingUserRole = req.user.role;
            
            // Check if user can view this history
            if (userId !== req.user.userId && !['superadmin', 'admin'].includes(requestingUserRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to view this user\'s impersonation history'
                });
            }

            const history = await db.getUserImpersonationHistory(userId);

            res.json({
                success: true,
                data: history
            });

        } catch (error) {
            logger.error('Error fetching user impersonation history:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get active impersonation sessions (admin only)
    static async getActiveImpersonationSessions(req, res) {
        try {
            const userRole = req.user.role;
            
            // Check permissions
            if (!['superadmin', 'admin'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to view active impersonation sessions'
                });
            }

            const activeSessions = await db.getActiveImpersonationSessions();

            res.json({
                success: true,
                data: activeSessions
            });

        } catch (error) {
            logger.error('Error fetching active impersonation sessions:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Force end impersonation session (superadmin only)
    static async forceEndImpersonation(req, res) {
        try {
            const userRole = req.user.role;
            const { sessionId } = req.params;
            
            // Check permissions - only superadmin can force end sessions
            if (userRole !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only superadmins can force end impersonation sessions'
                });
            }

            // Use workflow to end session
            const result = await ImpersonationWorkflow.endImpersonation(sessionId);

            logger.info(`Impersonation session force-ended by superadmin: ${req.user.userId}`);

            res.json({
                success: true,
                message: 'Impersonation session ended successfully',
                data: result.session
            });

        } catch (error) {
            logger.error('Error force ending impersonation session:', error);
            
            if (error.message === 'Session not found or already ended') {
                return res.status(404).json({
                    success: false,
                    message: 'Impersonation session not found or already ended'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get impersonation statistics (admin only)
    static async getImpersonationStats(req, res) {
        try {
            const userRole = req.user.role;
            
            // Check permissions
            if (!['superadmin', 'admin'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to view impersonation statistics'
                });
            }

            const { timeframe } = req.query;
            const stats = await ImpersonationWorkflow.getImpersonationStats({ timeframe });

            res.json({
                success: true,
                data: {
                    stats,
                    timeframe: timeframe || '30d'
                }
            });

        } catch (error) {
            logger.error('Error fetching impersonation statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Validate impersonation token (utility endpoint)
    static async validateImpersonationToken(req, res) {
        try {
            const { token } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            const decoded = ImpersonationWorkflow.validateImpersonationToken(token);
            
            res.json({
                success: true,
                data: {
                    valid: true,
                    payload: decoded
                }
            });

        } catch (error) {
            logger.error('Token validation error:', error);
            res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
                data: {
                    valid: false
                }
            });
        }
    }
}

module.exports = ImpersonationController;
