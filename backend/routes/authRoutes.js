const express = require('express');
const { 
  login, 
  getMe, 
  updateProfile, 
  updatePreferences, 
  logout 
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.use(verifyToken); // Apply to all routes below
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.post('/logout', logout);

module.exports = router;