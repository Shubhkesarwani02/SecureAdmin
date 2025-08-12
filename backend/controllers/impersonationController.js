const db = require('../services/database_simplified');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class ImpersonationController {
    // Start impersonation session
    static async startImpersonation(req, res) {
        try {
            const { impersonated_id, reason } = req.body;
            const impersonator_id = req.user.userId;
            const impersonatorRole = req.user.role;
            
            // Validate required fields
            if (!impersonated_id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID to impersonate is required'
                });
            }

            // Check if user has permission to impersonate
            if (!['superadmin', 'admin'].includes(impersonatorRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to impersonate users'
                });
            }

            // Verify target user exists
            const targetUser = await db.getUserById(impersonated_id);
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            // Prevent self-impersonation
            if (impersonator_id === impersonated_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot impersonate yourself'
                });
            }

            // Check role hierarchy - admins cannot impersonate superadmins
            if (impersonatorRole === 'admin' && targetUser.role === 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admins cannot impersonate superadmins'
                });
            }

            // Check if there's already an active impersonation session
            const activeSession = await db.getActiveImpersonationSession(impersonator_id);
            if (activeSession) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have an active impersonation session. End it before starting a new one.'
                });
            }

            // Create impersonation log entry
            const impersonationLog = await db.createImpersonationLog({
                impersonator_id,
                impersonated_id,
                reason: reason || null
            });

            // Generate impersonation token
            const impersonationToken = jwt.sign(
                {
                    userId: impersonated_id,
                    email: targetUser.email,
                    role: targetUser.role,
                    isImpersonating: true,
                    impersonatorId: impersonator_id,
                    impersonationLogId: impersonationLog.id
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '2h' } // Shorter expiry for impersonation sessions
            );

            logger.info(`Impersonation started: ${impersonator_id} impersonating ${impersonated_id}`);

            res.json({
                success: true,
                message: 'Impersonation session started successfully',
                data: {
                    impersonationToken,
                    targetUser: {
                        id: targetUser.id,
                        email: targetUser.email,
                        role: targetUser.role
                    },
                    sessionId: impersonationLog.id
                }
            });

        } catch (error) {
            logger.error('Error starting impersonation:', error);
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

            // Verify session exists and is active
            const session = await db.getImpersonationLogById(sessionId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Impersonation session not found'
                });
            }

            if (session.end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Impersonation session is already ended'
                });
            }

            // Force end the session
            await db.endImpersonationSession(sessionId);

            logger.info(`Impersonation session force-ended by superadmin: ${req.user.userId}`);

            res.json({
                success: true,
                message: 'Impersonation session ended successfully'
            });

        } catch (error) {
            logger.error('Error force ending impersonation session:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = ImpersonationController;
