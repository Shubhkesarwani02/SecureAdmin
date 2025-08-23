-- Create invite_tokens table for secure onboarding flow
-- This table stores one-time tokenized links for user invitations

DROP TABLE IF EXISTS invite_tokens CASCADE;

CREATE TABLE invite_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    invited_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
    account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE, -- For client-level invites
    company_name VARCHAR(255), -- Optional for client-level users
    full_name VARCHAR(255), -- Pre-filled if known
    phone VARCHAR(20), -- Pre-filled if known
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    used_at TIMESTAMP WITH TIME ZONE,
    used_by BIGINT REFERENCES users(id), -- User ID who completed onboarding
    metadata JSONB, -- Additional invite-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX idx_invite_tokens_email ON invite_tokens(email);
CREATE INDEX idx_invite_tokens_invited_by ON invite_tokens(invited_by);
CREATE INDEX idx_invite_tokens_status ON invite_tokens(status);
CREATE INDEX idx_invite_tokens_expires_at ON invite_tokens(expires_at);
CREATE INDEX idx_invite_tokens_account_id ON invite_tokens(account_id);

-- Add status tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('invited', 'pending_signup', 'active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_by BIGINT REFERENCES users(id),
ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index on user status
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Update trigger for invite_tokens
CREATE OR REPLACE FUNCTION update_invite_tokens_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invite_tokens_timestamp
    BEFORE UPDATE ON invite_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_invite_tokens_timestamp();

-- Function to cleanup expired tokens (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_invite_tokens()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE invite_tokens 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for invite_tokens
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invite_tokens
CREATE POLICY "Superadmins can manage all invite tokens" ON invite_tokens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
    );

CREATE POLICY "Admins can manage invite tokens" ON invite_tokens
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "CSMs can view their own invite tokens" ON invite_tokens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'csm')
        AND invited_by::text = auth.uid()::text
    );

-- Sample data (optional for testing)
-- INSERT INTO invite_tokens (
--     token, email, invited_by, role, account_id, company_name, 
--     full_name, phone, expires_at
-- ) VALUES (
--     'sample_token_12345', 'newuser@example.com', 1, 'user', 1, 
--     'Example Corp', 'John Doe', '+1234567890', 
--     NOW() + INTERVAL '24 hours'
-- );

COMMENT ON TABLE invite_tokens IS 'Stores secure one-time invitation tokens for user onboarding';
COMMENT ON COLUMN invite_tokens.token IS 'Unique secure token for invitation link';
COMMENT ON COLUMN invite_tokens.email IS 'Email address of the invited user (pre-filled in onboarding)';
COMMENT ON COLUMN invite_tokens.invited_by IS 'User ID who sent the invitation';
COMMENT ON COLUMN invite_tokens.role IS 'Role to be assigned to the new user';
COMMENT ON COLUMN invite_tokens.account_id IS 'Account ID for client-level user invitations';
COMMENT ON COLUMN invite_tokens.company_name IS 'Company name for client-level invitations';
COMMENT ON COLUMN invite_tokens.status IS 'Current status of the invitation';
COMMENT ON COLUMN invite_tokens.expires_at IS 'When the invitation expires (default 48 hours)';
COMMENT ON COLUMN invite_tokens.metadata IS 'Additional invitation-specific data in JSON format';
