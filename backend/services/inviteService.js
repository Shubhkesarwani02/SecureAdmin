const crypto = require('crypto');
const { query } = require('./database');

class InviteService {
  // Generate a secure random token
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a new invite token
  async createInvite({
    email,
    invitedBy,
    role,
    accountId = null,
    companyName = null,
    fullName = null,
    phone = null,
    expiresIn = 48, // hours
    metadata = {}
  }) {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    // Check if there's already a pending invite for this email
    const existingInvite = await query(
      `SELECT id FROM invite_tokens 
       WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
      [email.toLowerCase()]
    );

    if (existingInvite.rows.length > 0) {
      throw new Error('A pending invitation already exists for this email');
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    const result = await query(
      `INSERT INTO invite_tokens (
        token, email, invited_by, role, account_id, company_name,
        full_name, phone, expires_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        token,
        email.toLowerCase(),
        invitedBy,
        role,
        accountId,
        companyName,
        fullName,
        phone,
        expiresAt,
        JSON.stringify(metadata)
      ]
    );

    return result.rows[0];
  }

  // Validate and get invite token
  async validateToken(token) {
    const result = await query(
      `SELECT it.*, u.full_name as inviter_name, u.email as inviter_email,
              a.name as account_name, a.company_name as account_company_name
       FROM invite_tokens it
       LEFT JOIN users u ON it.invited_by = u.id
       LEFT JOIN accounts a ON it.account_id = a.id
       WHERE it.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid invitation token');
    }

    const invite = result.rows[0];

    if (invite.status !== 'pending') {
      throw new Error('This invitation has already been used or expired');
    }

    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await this.markAsExpired(invite.id);
      throw new Error('This invitation has expired');
    }

    return invite;
  }

  // Mark token as used
  async markAsUsed(tokenId, userId) {
    const result = await query(
      `UPDATE invite_tokens 
       SET status = 'used', used_at = NOW(), used_by = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [tokenId, userId]
    );

    return result.rows[0];
  }

  // Mark token as expired
  async markAsExpired(tokenId) {
    const result = await query(
      `UPDATE invite_tokens 
       SET status = 'expired', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [tokenId]
    );

    return result.rows[0];
  }

  // Cancel invite token
  async cancelInvite(tokenId, cancelledBy) {
    const result = await query(
      `UPDATE invite_tokens 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [tokenId]
    );

    if (result.rows.length === 0) {
      throw new Error('Invitation not found or already processed');
    }

    return result.rows[0];
  }

  // Get all invites (with filtering)
  async getInvites({
    invitedBy = null,
    status = null,
    role = null,
    accountId = null,
    limit = 50,
    offset = 0
  } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (invitedBy) {
      whereClause += ` AND it.invited_by = $${paramIndex}`;
      params.push(invitedBy);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND it.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND it.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (accountId) {
      whereClause += ` AND it.account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }

    const result = await query(
      `SELECT it.*, 
              u.full_name as inviter_name, 
              u.email as inviter_email,
              a.name as account_name,
              a.company_name as account_company_name,
              uu.full_name as used_by_name
       FROM invite_tokens it
       LEFT JOIN users u ON it.invited_by = u.id
       LEFT JOIN accounts a ON it.account_id = a.id
       LEFT JOIN users uu ON it.used_by = uu.id
       ${whereClause}
       ORDER BY it.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return result.rows;
  }

  // Get invite statistics
  async getInviteStats(invitedBy = null) {
    let whereClause = '';
    const params = [];

    if (invitedBy) {
      whereClause = 'WHERE invited_by = $1';
      params.push(invitedBy);
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_invites,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invites,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as completed_invites,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_invites,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_invites,
        COUNT(CASE WHEN expires_at < NOW() AND status = 'pending' THEN 1 END) as should_expire
       FROM invite_tokens ${whereClause}`,
      params
    );

    return result.rows[0];
  }

  // Cleanup expired tokens
  async cleanupExpired() {
    const result = await query(
      `UPDATE invite_tokens 
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'pending' AND expires_at < NOW()
       RETURNING id`
    );

    return result.rows.length;
  }

  // Resend invite (create new token, invalidate old one)
  async resendInvite(oldTokenId, newExpiresIn = 48) {
    const oldInvite = await query(
      'SELECT * FROM invite_tokens WHERE id = $1',
      [oldTokenId]
    );

    if (oldInvite.rows.length === 0) {
      throw new Error('Original invitation not found');
    }

    const invite = oldInvite.rows[0];

    // Cancel old token
    await this.cancelInvite(oldTokenId);

    // Create new token with same details
    return await this.createInvite({
      email: invite.email,
      invitedBy: invite.invited_by,
      role: invite.role,
      accountId: invite.account_id,
      companyName: invite.company_name,
      fullName: invite.full_name,
      phone: invite.phone,
      expiresIn: newExpiresIn,
      metadata: typeof invite.metadata === 'string' ? JSON.parse(invite.metadata) : invite.metadata
    });
  }

  // Generate onboarding URL
  generateOnboardingUrl(token, baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000') {
    return `${baseUrl}/onboarding?token=${token}`;
  }
}

module.exports = new InviteService();
