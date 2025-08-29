-- Create impersonation_logs table for tracking all impersonation activities
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired', 'forced_end')),
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
            ELSE NULL
        END
    ) STORED,
    ip_address INET,
    user_agent TEXT,
    actions_performed JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_impersonator ON impersonation_logs(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_target_user ON impersonation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_session_id ON impersonation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_status ON impersonation_logs(status);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_start_time ON impersonation_logs(start_time);
