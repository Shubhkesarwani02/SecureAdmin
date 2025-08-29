-- =============================================
-- CREATE MISSING ACCOUNT HEALTH TABLES
-- =============================================

-- Create account_health_scores table
CREATE TABLE IF NOT EXISTS account_health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    factors JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_health_alerts table  
CREATE TABLE IF NOT EXISTS account_health_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_score', 'high_risk', 'declining_trend', 'inactive', 'payment_overdue')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    message TEXT,
    threshold_value INTEGER,
    current_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_scores_client_id ON account_health_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON account_health_scores(health_score);
CREATE INDEX IF NOT EXISTS idx_health_alerts_client_id ON account_health_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON account_health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_health_alerts_type ON account_health_alerts(alert_type);

-- Add health monitoring function
CREATE OR REPLACE FUNCTION update_health_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health scores
DROP TRIGGER IF EXISTS trigger_update_health_score_timestamp ON account_health_scores;
CREATE TRIGGER trigger_update_health_score_timestamp
    BEFORE UPDATE ON account_health_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_health_score_timestamp();
