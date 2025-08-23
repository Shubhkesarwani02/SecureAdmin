const { asyncHandler } = require('../middleware/errorHandler');
const inviteService = require('../services/inviteService');
const { userService, auditService } = require('../services/database');

// @desc    Send invitation
// @route   POST /api/invites
// @access  Private (Admin/Superadmin)
const sendInvitation = asyncHandler(async (req, res) => {
  const {
    email,
    role,
    accountId,
    companyName,
    fullName,
    phone,
    expiresIn = 48,
    sendEmail = true
  } = req.body;

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!email || !role) {
    return res.status(400).json({
      success: false,
      message: 'Email and role are required'
    });
  }

  // Role-based invitation restrictions
  if (currentUserRole === 'admin') {
    if (!['csm', 'user'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin can only invite CSM and regular user accounts'
      });
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // If role is 'user', accountId should be provided
  if (role === 'user' && !accountId) {
    return res.status(400).json({
      success: false,
      message: 'Account ID is required for user role invitations'
    });
  }

  try {
    // Create invite token
    const invite = await inviteService.createInvite({
      email,
      invitedBy: currentUserId,
      role,
      accountId,
      companyName,
      fullName,
      phone,
      expiresIn,
      metadata: {
        inviterRole: currentUserRole,
        userAgent,
        ipAddress
      }
    });

    // Generate onboarding URL
    const onboardingUrl = inviteService.generateOnboardingUrl(invite.token);

    // Log invitation creation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INVITATION_SENT',
      resourceType: 'INVITE_TOKEN',
      resourceId: invite.id,
      oldValues: null,
      newValues: {
        email: invite.email,
        role: invite.role,
        accountId: invite.account_id,
        expiresAt: invite.expires_at
      },
      ipAddress,
      userAgent
    });

    // TODO: Send email with onboarding link (implement email service)
    if (sendEmail) {
      // Email service implementation would go here
      console.log(`Invitation email would be sent to ${email} with link: ${onboardingUrl}`);
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          accountId: invite.account_id,
          companyName: invite.company_name,
          fullName: invite.full_name,
          phone: invite.phone,
          status: invite.status,
          expiresAt: invite.expires_at,
          createdAt: invite.created_at
        },
        onboardingUrl: sendEmail ? null : onboardingUrl // Only return URL if not sending email
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    
    if (error.message.includes('already exists') || error.message.includes('pending invitation')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error sending invitation'
    });
  }
});

// @desc    Validate invitation token
// @route   GET /api/invites/validate/:token
// @access  Public
const validateInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }

  try {
    const invite = await inviteService.validateToken(token);

    res.status(200).json({
      success: true,
      data: {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          accountId: invite.account_id,
          accountName: invite.account_name,
          accountCompanyName: invite.account_company_name,
          companyName: invite.company_name,
          fullName: invite.full_name,
          phone: invite.phone,
          inviterName: invite.inviter_name,
          inviterEmail: invite.inviter_email,
          expiresAt: invite.expires_at,
          createdAt: invite.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Complete onboarding (signup with token)
// @route   POST /api/invites/complete
// @access  Public
const completeOnboarding = asyncHandler(async (req, res) => {
  const {
    token,
    password,
    confirmPassword,
    fullName,
    phone,
    companyName, // For client-level users
    acceptTerms
  } = req.body;

  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  // Validate input
  if (!token || !password || !confirmPassword || !fullName || !acceptTerms) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided'
    });
  }

  // Validate password match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  // Password strength validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
    });
  }

  try {
    // Validate invitation token
    const invite = await inviteService.validateToken(token);

    // Check if user already exists (double-check)
    const existingUser = await userService.findByEmail(invite.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user account
    const newUser = await userService.create({
      email: invite.email,
      password,
      fullName: fullName || invite.full_name,
      phone: phone || invite.phone,
      role: invite.role,
      department: companyName || invite.company_name || 'General',
      status: 'active',
      createdBy: invite.invited_by,
      invitedAt: invite.created_at,
      invitedBy: invite.invited_by,
      signupCompletedAt: new Date()
    });

    // If user is being assigned to an account, create the assignment
    if (invite.account_id && invite.role === 'user') {
      const { userAccountService } = require('../services/database');
      await userAccountService.assign({
        userId: newUser.id,
        accountId: invite.account_id,
        roleInAccount: 'member',
        assignedBy: invite.invited_by
      });
    }

    // Mark invitation as used
    await inviteService.markAsUsed(invite.id, newUser.id);

    // Log successful onboarding
    await auditService.log({
      userId: newUser.id,
      action: 'USER_ONBOARDED',
      resourceType: 'USER',
      resourceId: newUser.id,
      oldValues: null,
      newValues: {
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        inviteId: invite.id,
        invitedBy: invite.invited_by
      },
      ipAddress,
      userAgent
    });

    // Also log for the inviter
    await auditService.log({
      userId: invite.invited_by,
      action: 'INVITATION_COMPLETED',
      resourceType: 'INVITE_TOKEN',
      resourceId: invite.id,
      oldValues: null,
      newValues: {
        email: invite.email,
        completedBy: newUser.id,
        completedAt: new Date()
      },
      ipAddress,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          role: newUser.role,
          status: newUser.status
        }
      }
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    
    if (error.message.includes('already exists') || 
        error.message.includes('Invalid') || 
        error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error completing onboarding'
    });
  }
});

// @desc    Get invitations
// @route   GET /api/invites
// @access  Private (Admin/Superadmin)
const getInvitations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const {
    status,
    role,
    accountId,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    const filters = {
      status,
      role,
      accountId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // CSMs can only see their own invitations
    if (currentUserRole === 'csm') {
      filters.invitedBy = currentUserId;
    }

    const invitations = await inviteService.getInvites(filters);

    res.status(200).json({
      success: true,
      data: { invitations }
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
});

// @desc    Resend invitation
// @route   POST /api/invites/:id/resend
// @access  Private (Admin/Superadmin)
const resendInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expiresIn = 48 } = req.body;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    const newInvite = await inviteService.resendInvite(id, expiresIn);
    const onboardingUrl = inviteService.generateOnboardingUrl(newInvite.token);

    // Log resend action
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INVITATION_RESENT',
      resourceType: 'INVITE_TOKEN',
      resourceId: newInvite.id,
      oldValues: { originalInviteId: id },
      newValues: {
        email: newInvite.email,
        newExpiresAt: newInvite.expires_at
      },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invite: {
          id: newInvite.id,
          email: newInvite.email,
          expiresAt: newInvite.expires_at,
          onboardingUrl
        }
      }
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending invitation'
    });
  }
});

// @desc    Cancel invitation
// @route   DELETE /api/invites/:id
// @access  Private (Admin/Superadmin)
const cancelInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    const cancelledInvite = await inviteService.cancelInvite(id, currentUserId);

    // Log cancellation
    await auditService.log({
      userId: currentUserId,
      impersonatorId: req.user.impersonator_id,
      action: 'INVITATION_CANCELLED',
      resourceType: 'INVITE_TOKEN',
      resourceId: id,
      oldValues: { status: 'pending' },
      newValues: { status: 'cancelled' },
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation'
    });
  }
});

// @desc    Get invitation statistics
// @route   GET /api/invites/stats
// @access  Private (Admin/Superadmin)
const getInvitationStats = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    const filters = {};
    
    // CSMs can only see their own stats
    if (currentUserRole === 'csm') {
      filters.invitedBy = currentUserId;
    }

    const stats = await inviteService.getInviteStats(filters.invitedBy);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation stats'
    });
  }
});

module.exports = {
  sendInvitation,
  validateInvitation,
  completeOnboarding,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  getInvitationStats
};
