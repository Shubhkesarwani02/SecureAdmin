const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/assignmentController_simplified');
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

// CSM Assignment Routes
router.post('/csm', auth, requireAdmin, AssignmentController.assignCSMToAccount);
router.delete('/csm/:csm_id/:account_id', auth, requireAdmin, AssignmentController.removeCSMAssignment);
router.get('/csm', auth, requireAdmin, AssignmentController.getCSMAssignments);
router.get('/csm/:csm_id', auth, AssignmentController.getCSMAccountAssignments);

// User-Account Assignment Routes
router.post('/user-account', auth, requireAdmin, AssignmentController.assignUserToAccount);
router.delete('/user-account/:user_id/:account_id', auth, requireAdmin, AssignmentController.removeUserAccountAssignment);
router.get('/user-account', auth, requireAdmin, AssignmentController.getUserAccountAssignments);
router.get('/user/:user_id/accounts', auth, AssignmentController.getUserAccounts);
router.get('/account/:account_id/users', auth, AssignmentController.getAccountUsers);

// Summary Routes
router.get('/summary', auth, requireAdmin, AssignmentController.getAssignmentSummary);

module.exports = router;
