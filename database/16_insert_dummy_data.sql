-- Direct SQL to create health tables and insert dummy data

-- Create account_health_scores table if not exists
CREATE TABLE IF NOT EXISTS account_health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    factors JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_health_alerts table if not exists
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_health_scores_client_id ON account_health_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON account_health_scores(health_score);
CREATE INDEX IF NOT EXISTS idx_health_alerts_client_id ON account_health_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON account_health_alerts(status);

-- Insert dummy health scores (using existing accounts)
INSERT INTO account_health_scores (client_id, health_score, factors)
SELECT 
    id,
    70 + (ROW_NUMBER() OVER ()) * 5 AS health_score,
    jsonb_build_object(
        'engagement', 80 + (ROW_NUMBER() OVER ()) * 2,
        'payment_history', 90 - (ROW_NUMBER() OVER ()),
        'support_tickets', 75 + (ROW_NUMBER() OVER ()) * 3,
        'feature_usage', 85 - (ROW_NUMBER() OVER ()) * 2
    ) AS factors
FROM accounts
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert dummy health alerts
INSERT INTO account_health_alerts (client_id, alert_type, status, message, threshold_value, current_value)
SELECT 
    id,
    'low_score',
    'active',
    'Account health score has dropped below threshold',
    75,
    70
FROM accounts
LIMIT 2
ON CONFLICT DO NOTHING;

-- Insert dummy clients with required fields
INSERT INTO clients (company_name, contact_name, email, phone, address, integration_code, status, subscription_plan, subscription_status)
VALUES 
    ('TechCorp Solutions', 'John Smith', 'contact@techcorp.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA', 'TC001', 'active', 'professional', 'active'),
    ('Global Logistics Inc', 'Jane Doe', 'info@globallogistics.com', '+1-555-0102', '456 Logistics Ave, Dallas, TX', 'GL002', 'active', 'enterprise', 'active'),
    ('Green Energy Co', 'Bob Johnson', 'hello@greenenergy.com', '+1-555-0103', '789 Sustainable Blvd, Austin, TX', 'GE003', 'active', 'basic', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert dummy vehicles
INSERT INTO vehicles (client_id, make, model, year, license_plate, vin, status, category, daily_rate, location)
SELECT 
    c.id,
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN 'Toyota'
        WHEN 2 THEN 'Honda'  
        ELSE 'Ford'
    END,
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN 'Camry'
        WHEN 2 THEN 'Accord'
        ELSE 'F-150'
    END,
    2022,
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN 'ABC-1234'
        WHEN 2 THEN 'DEF-5678'
        ELSE 'GHI-9012'
    END,
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN '1HGBH41JXMN109186'
        WHEN 2 THEN '2HGBH41JXMN109187'
        ELSE '3HGBH41JXMN109188'
    END,
    'active',
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN 'sedan'
        WHEN 2 THEN 'sedan'
        ELSE 'truck'
    END,
    75.00,
    'Main Branch'
FROM clients c
LIMIT 3
ON CONFLICT (license_plate) DO NOTHING;

-- Insert dummy notifications
INSERT INTO notifications (title, description, type, priority, is_read)
VALUES 
    ('System Maintenance Scheduled', 'System maintenance is scheduled for this weekend', 'info', 'medium', false),
    ('New Vehicle Registration', 'A new vehicle has been registered in the system', 'success', 'low', false),
    ('Account Health Alert', 'Client account health score has dropped below threshold', 'warning', 'high', false)
ON CONFLICT DO NOTHING;

-- Insert dummy integration codes
INSERT INTO integration_codes (code, client_id, status, expires_at)
SELECT 
    CASE ROW_NUMBER() OVER ()
        WHEN 1 THEN 'INT001TECH'
        WHEN 2 THEN 'INT002GLBL'
        ELSE 'INT003GREN'
    END,
    c.id,
    'active',
    NOW() + INTERVAL '90 days'
FROM clients c
LIMIT 3
ON CONFLICT (code) DO NOTHING;

-- Insert system logs
INSERT INTO system_logs (level, message, component, metadata)
VALUES 
    ('INFO', 'User login successful', 'auth', '{"browser": "Chrome", "os": "Windows"}'),
    ('INFO', 'Vehicle data updated', 'vehicle', '{"vehicle_id": "ABC-1234"}'),
    ('WARNING', 'Failed login attempt', 'auth', '{"email": "invalid@test.com", "attempts": 3}'),
    ('INFO', 'Account health score calculated', 'health', '{"account_id": "tech-corp", "score": 85}'),
    ('INFO', 'Notification sent', 'notification', '{"notification_type": "health_alert", "recipient_count": 5}')
ON CONFLICT DO NOTHING;
