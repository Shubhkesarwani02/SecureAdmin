const { asyncHandler } = require('../middleware/errorHandler');
const { 
  userService, 
  accountService,
  csmAssignmentService,
  userAccountService,
  auditService 
} = require('../services/database');

// @desc    Assign role or account to user
// @route   POST /api/roles/assign
// @access  Private (Admin, Superadmin)
const assignRole = asyncHandler(async (req, res) => {
  const { 
    userId, 
    role, 
    accountId, 
    action = 'assign' // 'assign' or 'remove'
  } = req.body;

  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  // Validate required fields
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  if (!role && !accountId) {
    return res.status(400).json({
      success: false,
      message: 'Either role or accountId must be provided'
    });
  }

  // Check if target user exists
  const targetUser = await userService.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'Target user not found'
    });
  }

  // Role assignment validation
  if (role) {
    // Validate role
    const validRoles = ['user', 'csm', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles: ' + validRoles.join(', ')
      });
    }

    // Role hierarchy checks
    if (currentUserRole === 'admin') {
      // Admin cannot assign admin or superadmin roles
      if (['admin', 'superadmin'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Admin cannot assign admin or superadmin roles'
        });
      }

      // Admin cannot modify admin or superadmin users
      if (['admin', 'superadmin'].includes(targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: 'Admin cannot modify admin or superadmin users'
        });
      }
    }

    // Update user role
    const oldValues = { role: targetUser.role };
    await userService.update(userId, { role });

    // Log the action
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'ROLE_ASSIGNED',
      resourceType: 'USER',
      resourceId: userId,
      oldValues,
      newValues: { role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: `Role ${role} assigned to user successfully`,
      data: {
        userId,
        oldRole: oldValues.role,
        newRole: role
      }
    });
    return;
  }

  // Account assignment validation
  if (accountId) {
    // Check if account exists
    const account = await accountService.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    if (action === 'assign') {
      // For CSM role, use CSM assignment service
      if (targetUser.role === 'csm') {
        // Check if already assigned
        const existingAssignment = await csmAssignmentService.getByCSMAndAccount(userId, accountId);
        if (existingAssignment) {
          return res.status(400).json({
            success: false,
            message: 'CSM is already assigned to this account'
          });
        }

        await csmAssignmentService.create({
          csm_id: userId,
          account_id: accountId,
          assigned_by: currentUserId
        });

        // Log the action
        await auditService.log({
          userId: currentUserId,
          impersonatorId: req.user.impersonator_id,
          action: 'CSM_ASSIGNED_TO_ACCOUNT',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          oldValues: null,
          newValues: { csmId: userId, accountId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: 'CSM assigned to account successfully',
          data: {
            userId,
            accountId,
            userRole: targetUser.role
          }
        });
      } else if (targetUser.role === 'user') {
        // For regular users, use user-account assignment
        // Check if already assigned
        const existingAssignment = await userAccountService.getByUserAndAccount(userId, accountId);
        if (existingAssignment) {
          return res.status(400).json({
            success: false,
            message: 'User is already assigned to this account'
          });
        }

        await userAccountService.create({
          user_id: userId,
          account_id: accountId,
          assigned_by: currentUserId
        });

        // Log the action
        await auditService.log({
          userId: currentUserId,
          impersonatorId: req.user.impersonator_id,
          action: 'USER_ASSIGNED_TO_ACCOUNT',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          oldValues: null,
          newValues: { userId, accountId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: 'User assigned to account successfully',
          data: {
            userId,
            accountId,
            userRole: targetUser.role
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Only CSM and regular users can be assigned to accounts'
        });
      }
    } else if (action === 'remove') {
      // Remove assignment
      if (targetUser.role === 'csm') {
        const assignment = await csmAssignmentService.getByCSMAndAccount(userId, accountId);
        if (!assignment) {
          return res.status(404).json({
            success: false,
            message: 'CSM assignment not found'
          });
        }

        await csmAssignmentService.remove(userId, accountId);

        // Log the action
        await auditService.log({
          userId: currentUserId,
          impersonatorId: req.user.impersonator_id,
          action: 'CSM_REMOVED_FROM_ACCOUNT',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          oldValues: { csmId: userId, accountId },
          newValues: null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: 'CSM removed from account successfully'
        });
      } else if (targetUser.role === 'user') {
        const assignment = await userAccountService.getByUserAndAccount(userId, accountId);
        if (!assignment) {
          return res.status(404).json({
            success: false,
            message: 'User assignment not found'
          });
        }

        await userAccountService.remove(userId, accountId);

        // Log the action
        await auditService.log({
          userId: currentUserId,
          impersonatorId: req.user.impersonator_id,
          action: 'USER_REMOVED_FROM_ACCOUNT',
          resourceType: 'ACCOUNT',
          resourceId: accountId,
          oldValues: { userId, accountId },
          newValues: null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(200).json({
          success: true,
          message: 'User removed from account successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid user role for account assignment'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "assign" or "remove"'
      });
    }
  }
});

// @desc    Get user roles and assignments
// @route   GET /api/roles/:userId
// @access  Private (Admin, Superadmin)
const getUserRoles = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserRole = req.user.role;

  // Check if target user exists
  const targetUser = await userService.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Role hierarchy checks
  if (currentUserRole === 'admin') {
    // Admin cannot view admin or superadmin users
    if (['admin', 'superadmin'].includes(targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot view this user\'s roles'
      });
    }
  }

  let assignments = [];

  // Get assignments based on user role
  if (targetUser.role === 'csm') {
    assignments = await csmAssignmentService.getByCSM(userId);
  } else if (targetUser.role === 'user') {
    assignments = await userAccountService.getByUser(userId);
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: targetUser.role,
        status: targetUser.status
      },
      assignments: assignments
    }
  });
});

module.exports = {
  assignRole,
  getUserRoles
};
