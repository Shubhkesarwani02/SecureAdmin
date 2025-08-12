const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController_simplified');
const auth = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes (authentication required)
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.post('/change-password', auth, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);
router.get('/verify-token', auth, AuthController.verifyToken);

module.exports = router;
