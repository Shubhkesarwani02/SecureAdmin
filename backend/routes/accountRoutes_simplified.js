const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController_simplified');
const auth = require('../middleware/auth');

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
    if (!['superadmin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Admin permissions required'
        });
    }
    next();
};

// Account CRUD operations
router.post('/', auth, requireAdmin, AccountController.createAccount);
router.get('/', auth, AccountController.getAllAccounts);
router.get('/summary', auth, requireAdmin, AccountController.getAccountsSummary);
router.get('/:id', auth, AccountController.getAccountById);
router.put('/:id', auth, requireAdmin, AccountController.updateAccount);
router.delete('/:id', auth, requireAdmin, AccountController.deleteAccount);

// Account statistics
router.get('/:id/stats', auth, AccountController.getAccountStats);

module.exports = router;
