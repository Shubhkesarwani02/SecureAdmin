const db = require('../services/database_simplified');
const logger = require('../utils/logger');

class AssignmentController {
    // Assign CSM to account
    static async assignCSMToAccount(req, res) {
        try {
            const { csm_id, account_id } = req.body;
            
            // Validate required fields
            if (!csm_id || !account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'CSM ID and Account ID are required'
                });
            }

            // Verify CSM exists and has correct role
            const csm = await db.getUserById(csm_id);
            if (!csm || csm.role !== 'csm') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid CSM ID or user is not a CSM'
                });
            }

            // Verify account exists
            const account = await db.getAccountById(account_id);
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Create CSM assignment
            const assignment = await db.createCSMAssignment(csm_id, account_id);
            
            logger.info(`CSM assignment created: CSM ${csm_id} assigned to account ${account_id}`);
            
            res.status(201).json({
                success: true,
                message: 'CSM assigned to account successfully',
                data: assignment
            });

        } catch (error) {
            logger.error('Error assigning CSM to account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Remove CSM assignment from account
    static async removeCSMAssignment(req, res) {
        try {
            const { csm_id, account_id } = req.params;
            
            const result = await db.removeCSMAssignment(csm_id, account_id);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'CSM assignment not found'
                });
            }

            logger.info(`CSM assignment removed: CSM ${csm_id} from account ${account_id}`);
            
            res.json({
                success: true,
                message: 'CSM assignment removed successfully'
            });

        } catch (error) {
            logger.error('Error removing CSM assignment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all CSM assignments
    static async getCSMAssignments(req, res) {
        try {
            const assignments = await db.getCSMAssignments();
            
            res.json({
                success: true,
                data: assignments
            });

        } catch (error) {
            logger.error('Error fetching CSM assignments:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get assignments for a specific CSM
    static async getCSMAccountAssignments(req, res) {
        try {
            const { csm_id } = req.params;
            
            const assignments = await db.getCSMAccountAssignments(csm_id);
            
            res.json({
                success: true,
                data: assignments
            });

        } catch (error) {
            logger.error('Error fetching CSM account assignments:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Assign user to account
    static async assignUserToAccount(req, res) {
        try {
            const { user_id, account_id } = req.body;
            
            // Validate required fields
            if (!user_id || !account_id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID and Account ID are required'
                });
            }

            // Verify user exists
            const user = await db.getUserById(user_id);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify account exists
            const account = await db.getAccountById(account_id);
            if (!account) {
                return res.status(400).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Create user-account assignment
            const assignment = await db.createUserAccountAssignment(user_id, account_id);
            
            logger.info(`User assignment created: User ${user_id} assigned to account ${account_id}`);
            
            res.status(201).json({
                success: true,
                message: 'User assigned to account successfully',
                data: assignment
            });

        } catch (error) {
            logger.error('Error assigning user to account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Remove user assignment from account
    static async removeUserAccountAssignment(req, res) {
        try {
            const { user_id, account_id } = req.params;
            
            const result = await db.removeUserAccountAssignment(user_id, account_id);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User account assignment not found'
                });
            }

            logger.info(`User assignment removed: User ${user_id} from account ${account_id}`);
            
            res.json({
                success: true,
                message: 'User account assignment removed successfully'
            });

        } catch (error) {
            logger.error('Error removing user account assignment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all user-account assignments
    static async getUserAccountAssignments(req, res) {
        try {
            const assignments = await db.getUserAccountAssignments();
            
            res.json({
                success: true,
                data: assignments
            });

        } catch (error) {
            logger.error('Error fetching user account assignments:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get accounts for a specific user
    static async getUserAccounts(req, res) {
        try {
            const { user_id } = req.params;
            
            const accounts = await db.getUserAccounts(user_id);
            
            res.json({
                success: true,
                data: accounts
            });

        } catch (error) {
            logger.error('Error fetching user accounts:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get users for a specific account
    static async getAccountUsers(req, res) {
        try {
            const { account_id } = req.params;
            
            const users = await db.getAccountUsers(account_id);
            
            res.json({
                success: true,
                data: users
            });

        } catch (error) {
            logger.error('Error fetching account users:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get account assignment summary
    static async getAssignmentSummary(req, res) {
        try {
            const summary = await db.getAssignmentSummary();
            
            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            logger.error('Error fetching assignment summary:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = AssignmentController;
