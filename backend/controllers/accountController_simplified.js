const db = require('../services/database_simplified');
const logger = require('../utils/logger');

class AccountController {
    // Create new account
    static async createAccount(req, res) {
        try {
            const { name } = req.body;
            
            // Validate required fields
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Account name is required'
                });
            }

            // Check if account with same name already exists
            const existingAccount = await db.getAccountByName(name.trim());
            if (existingAccount) {
                return res.status(409).json({
                    success: false,
                    message: 'Account with this name already exists'
                });
            }

            // Create account
            const account = await db.createAccount({
                name: name.trim()
            });

            logger.info(`Account created: ${account.id} - ${account.name}`);

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: account
            });

        } catch (error) {
            logger.error('Error creating account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all accounts
    static async getAllAccounts(req, res) {
        try {
            const { page = 1, limit = 50, search } = req.query;
            
            const params = {
                page: parseInt(page),
                limit: parseInt(limit)
            };

            if (search) {
                params.search = search.trim();
            }

            const accounts = await db.getAllAccounts(params);

            res.json({
                success: true,
                data: accounts
            });

        } catch (error) {
            logger.error('Error fetching accounts:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get account by ID
    static async getAccountById(req, res) {
        try {
            const { id } = req.params;
            
            const account = await db.getAccountById(id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            res.json({
                success: true,
                data: account
            });

        } catch (error) {
            logger.error('Error fetching account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update account
    static async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            
            // Validate required fields
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Account name is required'
                });
            }

            // Check if account exists
            const existingAccount = await db.getAccountById(id);
            if (!existingAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Check if another account with same name exists
            const accountWithSameName = await db.getAccountByName(name.trim());
            if (accountWithSameName && accountWithSameName.id !== id) {
                return res.status(409).json({
                    success: false,
                    message: 'Account with this name already exists'
                });
            }

            // Update account
            const updatedAccount = await db.updateAccount(id, {
                name: name.trim()
            });

            logger.info(`Account updated: ${id} - ${updatedAccount.name}`);

            res.json({
                success: true,
                message: 'Account updated successfully',
                data: updatedAccount
            });

        } catch (error) {
            logger.error('Error updating account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete account
    static async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            
            // Check if account exists
            const account = await db.getAccountById(id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Check if account has associated users or CSM assignments
            const accountUsers = await db.getAccountUsers(id);
            const csmAssignments = await db.getCSMAccountAssignments(null, id);

            if (accountUsers.length > 0 || csmAssignments.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete account with existing user assignments or CSM assignments. Remove all assignments first.'
                });
            }

            // Delete account
            await db.deleteAccount(id);

            logger.info(`Account deleted: ${id} - ${account.name}`);

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });

        } catch (error) {
            logger.error('Error deleting account:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get account statistics
    static async getAccountStats(req, res) {
        try {
            const { id } = req.params;
            
            // Check if account exists
            const account = await db.getAccountById(id);
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            // Get account statistics
            const stats = await db.getAccountStats(id);

            res.json({
                success: true,
                data: {
                    account,
                    stats
                }
            });

        } catch (error) {
            logger.error('Error fetching account stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get accounts summary
    static async getAccountsSummary(req, res) {
        try {
            const summary = await db.getAccountsSummary();

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            logger.error('Error fetching accounts summary:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = AccountController;
