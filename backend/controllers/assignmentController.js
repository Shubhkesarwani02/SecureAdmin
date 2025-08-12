const { asyncHandler } = require('../middleware/errorHandler');
const { 
  userAccountService,
  csmAssignmentService,
  userService,
  accountService,
  auditService
} = require('../services/database');

// @desc    Assign user to account
// @route   POST /api/assignments/user-accounts
// @access  Private (Admin/Superadmin)
const assignUserToAccount = asyncHandler(async (req, res) => {
  const { userId, accountId, roleInAccount = 'member' } = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Only admin and superadmin can assign users to accounts
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can assign users to accounts.'
    });
  }

  // Validate required fields
  if (!userId || !accountId) {
    return res.status(400).json({
      success: false,
      message: 'User ID and Account ID are required'
    });
  }

  // Validate role in account
  const validRoles = ['owner', 'admin', 'member', 'viewer'];
  if (!validRoles.includes(roleInAccount)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
    });
  }

  try {
    // Verify user exists
    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify account exists
    const account = await accountService.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Check if user role is appropriate for account assignment
    if (!['user'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Only users with role "user" can be assigned to customer accounts'
      });
    }

    // Create the assignment
    const assignment = await userAccountService.assign({
      userId,
      accountId,
      roleInAccount,
      assignedBy: currentUserId
    });

    // Log the assignment
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'USER_ASSIGNED_TO_ACCOUNT',
      resourceType: 'USER_ACCOUNT_ASSIGNMENT',
      resourceId: accountId,
      oldValues: null,
      newValues: {
        userId,
        accountId,
        roleInAccount,
        userName: user.full_name,
        accountName: account.name
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'User assigned to account successfully',
      data: { assignment }
    });
  } catch (error) {
    console.error('Error assigning user to account:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning user to account'
    });
  }
});

// @desc    Remove user from account
// @route   DELETE /api/assignments/user-accounts/:userId/:accountId
// @access  Private (Admin/Superadmin)
const removeUserFromAccount = asyncHandler(async (req, res) => {
  const { userId, accountId } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Only admin and superadmin can remove user assignments
  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can remove user assignments.'
    });
  }

  try {
    // Verify assignment exists
    const assignments = await userAccountService.getByUser(userId);
    const assignment = assignments.find(a => a.account_id === accountId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'User assignment to account not found'
      });
    }

    // Remove the assignment
    const removedAssignment = await userAccountService.remove(userId, accountId);

    // Log the removal
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'USER_REMOVED_FROM_ACCOUNT',
      resourceType: 'USER_ACCOUNT_ASSIGNMENT',
      resourceId: accountId,
      oldValues: { assignment },
      newValues: null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'User removed from account successfully',
      data: { removedAssignment }
    });
  } catch (error) {
    console.error('Error removing user from account:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user from account'
    });
  }
});

// @desc    Get user's account assignments
// @route   GET /api/assignments/users/:userId/accounts
// @access  Private (User can view own assignments, Admin can view all)
const getUserAccountAssignments = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Check permissions
  if (currentUserId !== userId && !['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own assignments.'
    });
  }

  try {
    const assignments = await userAccountService.getByUser(userId);

    res.status(200).json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Error fetching user account assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user account assignments'
    });
  }
});

// @desc    Get account's user assignments
// @route   GET /api/assignments/accounts/:accountId/users
// @access  Private (CSM/Admin/Superadmin)
const getAccountUserAssignments = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Check permissions for CSM
  if (currentUserRole === 'csm') {
    const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
    const hasAccess = csmAssignments.some(assignment => assignment.account_id === accountId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account not assigned to this CSM.'
      });
    }
  }

  try {
    const assignments = await userAccountService.getByAccount(accountId);

    res.status(200).json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Error fetching account user assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching account user assignments'
    });
  }
});

// @desc    Get all CSM assignments overview (Admin/Superadmin only)
// @route   GET /api/assignments/csm-overview
// @access  Private (Admin/Superadmin)
const getCSMAssignmentsOverview = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view CSM assignments overview.'
    });
  }

  try {
    const { query } = require('../services/database');
    
    // Get all CSMs with their account assignments
    const result = await query(`
      SELECT 
        u.id as csm_id,
        u.full_name as csm_name,
        u.email as csm_email,
        u.status as csm_status,
        COUNT(ca.account_id) as total_accounts,
        COUNT(CASE WHEN ca.is_primary = true THEN 1 END) as primary_accounts,
        ARRAY_AGG(
          CASE WHEN ca.account_id IS NOT NULL 
          THEN json_build_object(
            'account_id', a.id,
            'account_name', a.name,
            'company_name', a.company_name,
            'is_primary', ca.is_primary,
            'assigned_at', ca.assigned_at
          ) END
        ) FILTER (WHERE ca.account_id IS NOT NULL) as assigned_accounts
      FROM users u
      LEFT JOIN csm_assignments ca ON u.id = ca.csm_id
      LEFT JOIN accounts a ON ca.account_id = a.id AND a.status != 'deleted'
      WHERE u.role = 'csm' AND u.status != 'deleted'
      GROUP BY u.id, u.full_name, u.email, u.status
      ORDER BY u.full_name
    `);

    res.status(200).json({
      success: true,
      data: { csm_assignments: result.rows }
    });
  } catch (error) {
    console.error('Error fetching CSM assignments overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CSM assignments overview'
    });
  }
});

// @desc    Get assignment statistics
// @route   GET /api/assignments/stats
// @access  Private (Admin/Superadmin)
const getAssignmentStats = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view assignment statistics.'
    });
  }

  try {
    const { query } = require('../services/database');
    
    // Get various assignment statistics
    const [
      csmStats,
      userStats,
      accountStats
    ] = await Promise.all([
      // CSM statistics
      query(`
        SELECT 
          COUNT(DISTINCT u.id) as total_csms,
          COUNT(DISTINCT ca.account_id) as assigned_accounts,
          COUNT(DISTINCT CASE WHEN ca.is_primary = true THEN ca.account_id END) as accounts_with_primary_csm,
          AVG(account_count.count) as avg_accounts_per_csm
        FROM users u
        LEFT JOIN csm_assignments ca ON u.id = ca.csm_id
        LEFT JOIN (
          SELECT csm_id, COUNT(*) as count 
          FROM csm_assignments 
          GROUP BY csm_id
        ) account_count ON u.id = account_count.csm_id
        WHERE u.role = 'csm' AND u.status = 'active'
      `),
      
      // User statistics
      query(`
        SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT ua.account_id) as users_with_assignments,
          COUNT(DISTINCT ua.user_id) as assigned_users
        FROM users u
        LEFT JOIN user_accounts ua ON u.id = ua.user_id
        WHERE u.role = 'user' AND u.status = 'active'
      `),
      
      // Account statistics
      query(`
        SELECT 
          COUNT(DISTINCT a.id) as total_accounts,
          COUNT(DISTINCT ca.account_id) as accounts_with_csm,
          COUNT(DISTINCT ua.account_id) as accounts_with_users
        FROM accounts a
        LEFT JOIN csm_assignments ca ON a.id = ca.account_id
        LEFT JOIN user_accounts ua ON a.id = ua.account_id
        WHERE a.status = 'active'
      `)
    ]);

    res.status(200).json({
      success: true,
      data: {
        csm_stats: csmStats.rows[0],
        user_stats: userStats.rows[0],
        account_stats: accountStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment statistics'
    });
  }
});

// @desc    Bulk assign users to account
// @route   POST /api/assignments/bulk/users-to-account
// @access  Private (Admin/Superadmin)
const bulkAssignUsersToAccount = asyncHandler(async (req, res) => {
  const { userIds, accountId, roleInAccount = 'member' } = req.body;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can perform bulk assignments.'
    });
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  if (!accountId) {
    return res.status(400).json({
      success: false,
      message: 'Account ID is required'
    });
  }

  try {
    const assignments = [];
    const errors = [];

    // Process each user assignment
    for (const userId of userIds) {
      try {
        const assignment = await userAccountService.assign({
          userId,
          accountId,
          roleInAccount,
          assignedBy: currentUserId
        });
        assignments.push(assignment);
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log the bulk assignment
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'BULK_USER_ASSIGNMENT',
      resourceType: 'USER_ACCOUNT_ASSIGNMENT',
      resourceId: accountId,
      oldValues: null,
      newValues: {
        accountId,
        userIds,
        roleInAccount,
        successCount: assignments.length,
        errorCount: errors.length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: `Bulk assignment completed. ${assignments.length} successful, ${errors.length} failed.`,
      data: {
        assignments,
        errors
      }
    });
  } catch (error) {
    console.error('Error in bulk user assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk user assignment'
    });
  }
});

// @desc    Get available users for assignment
// @route   GET /api/assignments/available-users
// @access  Private (Admin/Superadmin)
const getAvailableUsers = asyncHandler(async (req, res) => {
  const { accountId } = req.query;
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view available users.'
    });
  }

  try {
    const availableUsers = await userAccountService.getAvailableUsers(accountId);
    
    res.status(200).json({
      success: true,
      data: { availableUsers }
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available users'
    });
  }
});

// @desc    Get available CSMs for assignment
// @route   GET /api/assignments/available-csms
// @access  Private (Admin/Superadmin)
const getAvailableCSMs = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view available CSMs.'
    });
  }

  try {
    const availableCSMs = await csmAssignmentService.getAvailableCSMs();
    
    res.status(200).json({
      success: true,
      data: { availableCSMs }
    });
  } catch (error) {
    console.error('Error fetching available CSMs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available CSMs'
    });
  }
});

// @desc    Get unassigned accounts
// @route   GET /api/assignments/unassigned-accounts
// @access  Private (Admin/Superadmin)
const getUnassignedAccounts = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view unassigned accounts.'
    });
  }

  try {
    const unassignedAccounts = await csmAssignmentService.getUnassignedAccounts();
    
    res.status(200).json({
      success: true,
      data: { unassignedAccounts }
    });
  } catch (error) {
    console.error('Error fetching unassigned accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned accounts'
    });
  }
});

// @desc    Get unassigned users
// @route   GET /api/assignments/unassigned-users
// @access  Private (Admin/Superadmin)
const getUnassignedUsers = asyncHandler(async (req, res) => {
  const currentUserRole = req.user.role;

  if (!['admin', 'superadmin'].includes(currentUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only admins can view unassigned users.'
    });
  }

  try {
    const unassignedUsers = await userAccountService.getUnassignedUsers();
    
    res.status(200).json({
      success: true,
      data: { unassignedUsers }
    });
  } catch (error) {
    console.error('Error fetching unassigned users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned users'
    });
  }
});

module.exports = {
  assignUserToAccount,
  removeUserFromAccount,
  getUserAccountAssignments,
  getAccountUserAssignments,
  getCSMAssignmentsOverview,
  getAssignmentStats,
  bulkAssignUsersToAccount,
  getAvailableUsers,
  getAvailableCSMs,
  getUnassignedAccounts,
  getUnassignedUsers
};
