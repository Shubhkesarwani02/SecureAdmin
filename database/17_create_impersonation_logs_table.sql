-- Create impersonation logs table for tracking impersonation sessions
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
    end_reason VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_impersonator_id ON impersonation_logs(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_target_user_id ON impersonation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_session_id ON impersonation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_start_time ON impersonation_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_status ON impersonation_logs(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_impersonation_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_impersonation_logs_updated_at
    BEFORE UPDATE ON impersonation_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_impersonation_logs_updated_at();

-- Insert sample impersonation data
INSERT INTO impersonation_logs (
    session_id, impersonator_id, target_user_id, reason, 
    start_time, end_time, duration_seconds, status, end_reason, ip_address, user_agent
) VALUES 
(
    'imp_1704980400_sample1',
    1, -- superadmin
    3, -- csm user
    'Customer support assistance for client onboarding',
    '2024-01-11 10:00:00+00',
    '2024-01-11 10:45:00+00',
    2700, -- 45 minutes
    'ended',
    'manual_stop',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
    'imp_1704984000_sample2',
    2, -- admin
    4, -- another csm
    'Troubleshooting integration issues',
    '2024-01-11 11:00:00+00',
    '2024-01-11 11:30:00+00',
    1800, -- 30 minutes
    'ended',
    'manual_stop',
    '192.168.1.101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
    'imp_1704987600_sample3',
    1, -- superadmin
    3, -- csm user
    'Account configuration assistance',
    '2024-01-11 12:00:00+00',
    '2024-01-11 12:15:00+00',
    900, -- 15 minutes
    'ended',
    'session_timeout',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
