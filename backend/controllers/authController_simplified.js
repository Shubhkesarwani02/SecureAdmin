const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/database_simplified');
const logger = require('../utils/logger');

class AuthController {
    // User registration
    static async register(req, res) {
        try {
            const { email, password, role = 'user' } = req.body;
            
            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password strength
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Validate role
            const validRoles = ['superadmin', 'admin', 'csm', 'user'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role specified'
                });
            }

            // Check if user already exists
            const existingUser = await db.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Create user
            const user = await db.createUser({
                email,
                password_hash,
                role
            });

            logger.info(`User registered: ${email} with role: ${role}`);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                }
            });

        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // User login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Get user by email
            const user = await db.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    role: user.role 
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            logger.info(`User logged in: ${email}`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    },
                    token
                }
            });

        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            
            const user = await db.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            });

        } catch (error) {
            logger.error('Profile fetch error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { email } = req.body;
            
            // Validate email if provided
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid email format'
                    });
                }

                // Check if email is already taken by another user
                const existingUser = await db.getUserByEmail(email);
                if (existingUser && existingUser.id !== userId) {
                    return res.status(409).json({
                        success: false,
                        message: 'Email is already taken'
                    });
                }
            }

            // Update user
            const updatedUser = await db.updateUser(userId, { email });

            logger.info(`User profile updated: ${userId}`);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    updated_at: updatedUser.updated_at
                }
            });

        } catch (error) {
            logger.error('Profile update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;
            
            // Validate required fields
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            // Validate new password strength
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long'
                });
            }

            // Get user
            const user = await db.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await db.updateUser(userId, { password_hash: newPasswordHash });

            logger.info(`Password changed for user: ${userId}`);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            logger.error('Password change error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Logout (client-side token removal)
    static async logout(req, res) {
        try {
            logger.info(`User logged out: ${req.user.userId}`);
            
            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Verify token
    static async verifyToken(req, res) {
        try {
            const userId = req.user.userId;
            
            const user = await db.getUserById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    valid: true,
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    }
                }
            });

        } catch (error) {
            logger.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = AuthController;
