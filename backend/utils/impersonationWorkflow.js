// =============================================
// IMPERSONATION WORKFLOW IMPLEMENTATION
// Matches the pseudocode example provided
// =============================================

const db = require('../services/database_simplified');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Enhanced impersonation workflow matching the provided pseudocode
 * Supports proper role hierarchy and account management
 */
class ImpersonationWorkflow {
    
    /**
     * Start impersonation session with enhanced permission checks
     * @param {string} requesting_user_id - ID of user requesting impersonation
     * @param {string} target_user_id - ID of user to be impersonated
     * @param {string} reason - Optional reason for impersonation
     * @returns {Object} Impersonation token and session details
     */
    static async startImpersonation(requesting_user_id, target_user_id, reason = null) {
        try {
            // Get user details
            const requesting_user = await this.getUser(requesting_user_id);
            const target_user = await this.getUser(target_user_id);
            
            if (!requesting_user || !target_user) {
                throw new Error('User not found');
            }

            // Prevent self-impersonation
            if (requesting_user_id === target_user_id) {
                throw new Error('Cannot impersonate yourself');
            }

            // Check permissions using role hierarchy
            const allowed = await this.checkImpersonationPermissions(requesting_user, target_user);
            
            if (!allowed) {
                throw new Error('Impersonation not allowed');
            }

            // Check for existing active sessions
            const activeSession = await db.getActiveImpersonationSession(requesting_user_id);
            if (activeSession) {
                throw new Error('You already have an active impersonation session. End it before starting a new one.');
            }

            // Create impersonation token with enhanced payload
            const token = this.createImpersonationJWT({
                impersonator_id: requesting_user_id,
                user_id: target_user_id,
                role: target_user.role,
                account_id: target_user.account_id,
                exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
            });

            // Log impersonation start
            const logEntry = await this.logImpersonationStart(
                requesting_user_id, 
                target_user_id, 
                reason
            );

            // Return comprehensive session details
            return {
                success: true,
                token,
                session: {
                    id: logEntry.id,
                    impersonator: {
                        id: requesting_user.id,
                        email: requesting_user.email,
                        role: requesting_user.role
                    },
                    target: {
                        id: target_user.id,
                        email: target_user.email,
                        role: target_user.role,
                        account_id: target_user.account_id
                    },
                    started_at: logEntry.start_time,
                    expires_at: new Date(Date.now() + (60 * 60 * 1000)), // 1 hour
                    reason: reason
                }
            };

        } catch (error) {
            logger.error('Impersonation start failed:', error);
            throw error;
        }
    }

    /**
     * Enhanced permission checking logic
     * @param {Object} requesting_user - User requesting impersonation
     * @param {Object} target_user - User to be impersonated
     * @returns {boolean} Whether impersonation is allowed
     */
    static async checkImpersonationPermissions(requesting_user, target_user) {
        // Superadmin can impersonate anyone except other superadmins
        if (requesting_user.role === 'superadmin') {
            return target_user.role !== 'superadmin';
        }
        
        // Admin can impersonate users in their managed accounts
        if (requesting_user.role === 'admin') {
            // Admins cannot impersonate superadmins or other admins
            if (['superadmin', 'admin'].includes(target_user.role)) {
                return false;
            }
            
            // Check if target user is in admin's managed accounts
            const managedAccounts = await this.getAdminManagedAccounts(requesting_user.id);
            return managedAccounts.includes(target_user.account_id);
        }
        
        // CSMs and regular users cannot impersonate anyone
        return false;
    }

    /**
     * Get accounts managed by an admin
     * @param {string} admin_id - Admin user ID
     * @returns {Array} Array of account IDs
     */
    static async getAdminManagedAccounts(admin_id) {
        try {
            const result = await db.query(
                `SELECT DISTINCT account_id 
                 FROM user_account_assignments 
                 WHERE user_id = $1 AND role = 'admin'`,
                [admin_id]
            );
            return result.rows.map(row => row.account_id);
        } catch (error) {
            logger.error('Error fetching admin managed accounts:', error);
            return [];
        }
    }

    /**
     * Create JWT token for impersonation
     * @param {Object} payload - Token payload
     * @returns {string} JWT token
     */
    static createImpersonationJWT(payload) {
        const enhancedPayload = {
            ...payload,
            isImpersonating: true,
            iat: Math.floor(Date.now() / 1000),
            tokenType: 'impersonation'
        };

        return jwt.sign(
            enhancedPayload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
    }

    /**
     * Log impersonation session start
     * @param {string} impersonator_id - Impersonator user ID
     * @param {string} target_id - Target user ID
     * @param {string} reason - Reason for impersonation
     * @returns {Object} Log entry
     */
    static async logImpersonationStart(impersonator_id, target_id, reason) {
        const logEntry = await db.createImpersonationLog({
            impersonator_id,
            impersonated_id: target_id,
            reason
        });

        // Enhanced logging
        logger.info('Impersonation session started', {
            impersonator_id,
            target_id,
            reason,
            session_id: logEntry.id,
            timestamp: new Date().toISOString()
        });

        // You could also add real-time notifications here
        // await this.notifyImpersonationStart(impersonator_id, target_id);

        return logEntry;
    }

    /**
     * End impersonation session
     * @param {string} session_id - Impersonation session ID
     * @returns {Object} Updated session details
     */
    static async endImpersonation(session_id) {
        try {
            const updatedSession = await db.endImpersonationSession(session_id);
            
            if (!updatedSession) {
                throw new Error('Session not found or already ended');
            }

            logger.info('Impersonation session ended', {
                session_id,
                ended_at: updatedSession.end_time
            });

            return {
                success: true,
                session: updatedSession
            };

        } catch (error) {
            logger.error('Error ending impersonation session:', error);
            throw error;
        }
    }

    /**
     * Validate impersonation token
     * @param {string} token - JWT token to validate
     * @returns {Object} Decoded token payload
     */
    static validateImpersonationToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            if (!decoded.isImpersonating || decoded.tokenType !== 'impersonation') {
                throw new Error('Invalid impersonation token');
            }

            return decoded;
        } catch (error) {
            logger.error('Impersonation token validation failed:', error);
            throw new Error('Invalid or expired impersonation token');
        }
    }

    /**
     * Get user by ID with enhanced error handling
     * @param {string} user_id - User ID
     * @returns {Object} User object
     */
    static async getUser(user_id) {
        const user = await db.getUserById(user_id);
        if (!user) {
            throw new Error(`User with ID ${user_id} not found`);
        }
        return user;
    }

    /**
     * Get comprehensive impersonation session info
     * @param {string} session_id - Session ID
     * @returns {Object} Session details
     */
    static async getSessionInfo(session_id) {
        try {
            const session = await db.getImpersonationLogById(session_id);
            if (!session) {
                throw new Error('Session not found');
            }

            return {
                id: session.id,
                impersonator: {
                    id: session.impersonator_id,
                    email: session.impersonator_email
                },
                target: {
                    id: session.impersonated_id,
                    email: session.impersonated_email
                },
                started_at: session.start_time,
                ended_at: session.end_time,
                reason: session.reason,
                is_active: !session.end_time
            };
        } catch (error) {
            logger.error('Error fetching session info:', error);
            throw error;
        }
    }

    /**
     * Get impersonation statistics for monitoring
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    static async getImpersonationStats(filters = {}) {
        try {
            const { timeframe = '30d' } = filters;
            
            const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
            
            const stats = await db.query(`
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN end_time IS NULL THEN 1 END) as active_sessions,
                    COUNT(DISTINCT impersonator_id) as unique_impersonators,
                    COUNT(DISTINCT impersonated_id) as unique_targets,
                    AVG(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))/60) as avg_duration_minutes
                FROM impersonation_logs 
                WHERE start_time > NOW() - INTERVAL '${days} days'
            `);

            return stats.rows[0];
        } catch (error) {
            logger.error('Error fetching impersonation stats:', error);
            throw error;
        }
    }
}

module.exports = ImpersonationWorkflow;
