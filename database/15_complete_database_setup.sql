-- =============================================
-- COMPREHENSIVE DATABASE SETUP SCRIPT
-- Run this to create all missing tables and insert dummy data
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create indexes for account health tables
CREATE INDEX IF NOT EXISTS idx_health_scores_client_id ON account_health_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON account_health_scores(health_score);
CREATE INDEX IF NOT EXISTS idx_health_alerts_client_id ON account_health_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON account_health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_health_alerts_type ON account_health_alerts(alert_type);

-- Clear existing test data before inserting fresh data
DELETE FROM account_health_alerts;
DELETE FROM account_health_scores;
DELETE FROM notifications WHERE title LIKE '%Test%' OR title LIKE '%Demo%';
DELETE FROM vehicles WHERE license_plate LIKE '%TEST%';
DELETE FROM clients WHERE company_name LIKE '%Test%' OR company_name LIKE '%Demo%';
DELETE FROM integration_codes WHERE code LIKE '%TEST%';
DELETE FROM system_logs WHERE component = 'test';

-- Insert comprehensive clients data
DO $$
DECLARE
    client_ids UUID[];
    account_ids UUID[];
    i INTEGER;
BEGIN
    -- Get some account IDs to use as client references
    SELECT ARRAY(SELECT id FROM accounts LIMIT 10) INTO account_ids;
    
    -- Insert clients data only if we have accounts
    IF array_length(account_ids, 1) > 0 THEN
        FOR i IN 1..10 LOOP
            INSERT INTO clients (id, company_name, email, phone, address, created_at) VALUES
            (uuid_generate_v4(), 
             CASE i
                 WHEN 1 THEN 'TechCorp Solutions'
                 WHEN 2 THEN 'Global Logistics Inc'
                 WHEN 3 THEN 'Green Energy Co'
                 WHEN 4 THEN 'Manufacturing Plus'
                 WHEN 5 THEN 'Retail Solutions LLC'
                 WHEN 6 THEN 'Healthcare Systems'
                 WHEN 7 THEN 'FinTech Innovations'
                 WHEN 8 THEN 'Education First'
                 WHEN 9 THEN 'Food & Beverage Co'
                 WHEN 10 THEN 'Transportation Hub'
             END,
             CASE i
                 WHEN 1 THEN 'contact@techcorp.com'
                 WHEN 2 THEN 'info@globallogistics.com'
                 WHEN 3 THEN 'hello@greenenergy.com'
                 WHEN 4 THEN 'contact@manufacturingplus.com'
                 WHEN 5 THEN 'support@retailsolutions.com'
                 WHEN 6 THEN 'admin@healthcaresys.com'
                 WHEN 7 THEN 'info@fintechinnovations.com'
                 WHEN 8 THEN 'contact@educationfirst.com'
                 WHEN 9 THEN 'hello@foodbeverage.com'
                 WHEN 10 THEN 'support@transportationhub.com'
             END,
             '+1-555-010' || i,
             i || '00 Business Ave, Suite ' || i || '00, Business City, BC',
             NOW() - INTERVAL '1 day' * (30 - i * 3));
        END LOOP;
    END IF;

    -- Get client IDs for further inserts
    SELECT ARRAY(SELECT id FROM clients ORDER BY created_at DESC LIMIT 10) INTO client_ids;
    
    -- Insert vehicles data if we have clients
    IF array_length(client_ids, 1) > 0 THEN
        FOR i IN 1..10 LOOP
            INSERT INTO vehicles (id, make, model, year, license_plate, color, vin, mileage, status, owner_type, owner_id, created_at) VALUES
            (uuid_generate_v4(),
             CASE (i % 5)
                 WHEN 1 THEN 'Toyota'
                 WHEN 2 THEN 'Honda'
                 WHEN 3 THEN 'Ford'
                 WHEN 4 THEN 'BMW'
                 WHEN 0 THEN 'Mercedes'
             END,
             CASE (i % 5)
                 WHEN 1 THEN 'Camry'
                 WHEN 2 THEN 'Accord'
                 WHEN 3 THEN 'F-150'
                 WHEN 4 THEN 'X5'
                 WHEN 0 THEN 'E-Class'
             END,
             2020 + (i % 4),
             'ABC-' || LPAD(i::text, 4, '0'),
             CASE (i % 4)
                 WHEN 1 THEN 'Silver'
                 WHEN 2 THEN 'White'
                 WHEN 3 THEN 'Black'
                 WHEN 0 THEN 'Blue'
             END,
             i || 'HGBH41JXMN10918' || i,
             5000 + (i * 2000),
             CASE WHEN i % 8 = 0 THEN 'maintenance' ELSE 'active' END,
             'client',
             client_ids[((i-1) % array_length(client_ids, 1)) + 1],
             NOW() - INTERVAL '1 day' * (20 - i));
        END LOOP;
    END IF;
END $$;

-- Insert notifications data
INSERT INTO notifications (id, title, description, type, priority, is_read, user_id, action_required, created_at) VALUES
(uuid_generate_v4(), 'System Maintenance Scheduled', 'System maintenance is scheduled for this weekend', 'system', 'medium', false, NULL, false, NOW() - INTERVAL '5 hours'),
(uuid_generate_v4(), 'New Vehicle Registration', 'A new vehicle has been registered in the system', 'vehicle', 'low', false, NULL, false, NOW() - INTERVAL '3 hours'),
(uuid_generate_v4(), 'Account Health Alert', 'Client account health score has dropped below threshold', 'health', 'high', false, (SELECT id FROM users WHERE role = 'admin' LIMIT 1), true, NOW() - INTERVAL '2 hours'),
(uuid_generate_v4(), 'Payment Overdue', 'Payment is overdue for client account', 'billing', 'high', false, NULL, true, NOW() - INTERVAL '1 hour'),
(uuid_generate_v4(), 'Welcome Message', 'Welcome to the Framtt platform!', 'welcome', 'low', true, (SELECT id FROM users WHERE role = 'user' LIMIT 1), false, NOW() - INTERVAL '30 minutes'),
(uuid_generate_v4(), 'Security Update', 'New security features have been enabled', 'security', 'medium', false, NULL, false, NOW() - INTERVAL '15 minutes'),
(uuid_generate_v4(), 'Backup Completed', 'Daily backup has been completed successfully', 'system', 'low', true, NULL, false, NOW() - INTERVAL '10 minutes'),
(uuid_generate_v4(), 'User Login Alert', 'Unusual login pattern detected', 'security', 'high', false, NULL, true, NOW() - INTERVAL '5 minutes'),
(uuid_generate_v4(), 'Report Generated', 'Monthly report has been generated and is ready for review', 'report', 'medium', false, NULL, false, NOW() - INTERVAL '2 minutes'),
(uuid_generate_v4(), 'Integration Success', 'Third-party integration has been successfully configured', 'integration', 'low', false, NULL, false, NOW());

-- Insert integration codes data
DO $$
DECLARE
    client_ids UUID[];
    i INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM clients LIMIT 10) INTO client_ids;
    
    IF array_length(client_ids, 1) > 0 THEN
        FOR i IN 1..10 LOOP
            INSERT INTO integration_codes (id, code, purpose, client_id, is_active, expires_at, created_at) VALUES
            (uuid_generate_v4(),
             'INT-' || LPAD(i::text, 3, '0') || '-' || 
             CASE i
                 WHEN 1 THEN 'TECH'
                 WHEN 2 THEN 'GLBL'
                 WHEN 3 THEN 'GREN'
                 WHEN 4 THEN 'MANU'
                 WHEN 5 THEN 'RETL'
                 WHEN 6 THEN 'HLTH'
                 WHEN 7 THEN 'FINT'
                 WHEN 8 THEN 'EDUC'
                 WHEN 9 THEN 'FOOD'
                 WHEN 10 THEN 'TRNS'
             END,
             CASE i
                 WHEN 1 THEN 'API Access for TechCorp Solutions'
                 WHEN 2 THEN 'Webhook Integration for Global Logistics'
                 WHEN 3 THEN 'Third-party API for Green Energy Co'
                 WHEN 4 THEN 'Data Export Integration'
                 WHEN 5 THEN 'POS System Integration'
                 WHEN 6 THEN 'Healthcare Data Exchange'
                 WHEN 7 THEN 'Financial Data API'
                 WHEN 8 THEN 'Learning Management System'
                 WHEN 9 THEN 'Inventory Management API'
                 WHEN 10 THEN 'Fleet Management Integration'
             END,
             client_ids[((i-1) % array_length(client_ids, 1)) + 1],
             CASE WHEN i % 4 = 0 THEN false ELSE true END,
             NOW() + INTERVAL '1 day' * (30 + i * 10),
             NOW() - INTERVAL '1 day' * (10 - i));
        END LOOP;
    END IF;
END $$;

-- Insert system logs data
DO $$
DECLARE
    admin_user_id UUID;
    csm_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    SELECT id INTO csm_user_id FROM users WHERE role = 'csm' LIMIT 1;
    
    INSERT INTO system_logs (id, level, message, component, user_id, ip_address, metadata, created_at) VALUES
    (uuid_generate_v4(), 'INFO', 'User login successful', 'auth', admin_user_id, '192.168.1.100', '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '2 hours'),
    (uuid_generate_v4(), 'INFO', 'Vehicle data updated', 'vehicle', csm_user_id, '192.168.1.101', '{"vehicle_id": "ABC-0001"}', NOW() - INTERVAL '1 hour'),
    (uuid_generate_v4(), 'WARNING', 'Failed login attempt', 'auth', NULL, '192.168.1.102', '{"email": "invalid@test.com", "attempts": 3}', NOW() - INTERVAL '45 minutes'),
    (uuid_generate_v4(), 'ERROR', 'Database connection timeout', 'database', NULL, 'server', '{"timeout": 5000, "query": "SELECT * FROM users"}', NOW() - INTERVAL '30 minutes'),
    (uuid_generate_v4(), 'INFO', 'Account health score calculated', 'health', admin_user_id, '192.168.1.103', '{"account_id": "tech-corp", "score": 85}', NOW() - INTERVAL '15 minutes'),
    (uuid_generate_v4(), 'INFO', 'Notification sent', 'notification', admin_user_id, '192.168.1.104', '{"notification_type": "health_alert", "recipient_count": 5}', NOW() - INTERVAL '10 minutes'),
    (uuid_generate_v4(), 'WARNING', 'Rate limit exceeded', 'api', NULL, '192.168.1.105', '{"endpoint": "/api/auth/login", "limit": 5, "window": "15m"}', NOW() - INTERVAL '5 minutes'),
    (uuid_generate_v4(), 'INFO', 'Backup completed successfully', 'backup', NULL, 'server', '{"size": "2.5GB", "duration": "00:15:32"}', NOW() - INTERVAL '2 minutes'),
    (uuid_generate_v4(), 'ERROR', 'Integration API failure', 'integration', admin_user_id, '192.168.1.106', '{"api": "third-party", "error": "timeout", "code": "INT-001-TECH"}', NOW() - INTERVAL '1 minute'),
    (uuid_generate_v4(), 'INFO', 'Dashboard metrics refreshed', 'dashboard', admin_user_id, '192.168.1.107', '{"metrics_count": 25, "refresh_time": "00:00:15"}', NOW());
END $$;

-- Insert account health scores with realistic data
DO $$
DECLARE
    account_ids UUID[];
    i INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM accounts LIMIT 10) INTO account_ids;
    
    IF array_length(account_ids, 1) > 0 THEN
        FOR i IN 1..LEAST(10, array_length(account_ids, 1)) LOOP
            INSERT INTO account_health_scores (id, client_id, health_score, factors, last_updated, created_at) VALUES
            (uuid_generate_v4(),
             account_ids[i],
             CASE i
                 WHEN 1 THEN 85
                 WHEN 2 THEN 92
                 WHEN 3 THEN 67
                 WHEN 4 THEN 78
                 WHEN 5 THEN 89
                 WHEN 6 THEN 45
                 WHEN 7 THEN 96
                 WHEN 8 THEN 73
                 WHEN 9 THEN 82
                 WHEN 10 THEN 91
                 ELSE 75
             END,
             ('{"engagement": ' || (50 + random() * 50)::integer || 
              ', "payment_history": ' || (70 + random() * 30)::integer ||
              ', "support_tickets": ' || (40 + random() * 60)::integer ||
              ', "feature_usage": ' || (60 + random() * 40)::integer || '}')::jsonb,
             NOW(),
             NOW() - INTERVAL '1 day' * i);
        END LOOP;
    END IF;
END $$;

-- Insert account health alerts
DO $$
DECLARE
    account_ids UUID[];
    i INTEGER;
BEGIN
    SELECT ARRAY(SELECT id FROM accounts WHERE id IN (SELECT client_id FROM account_health_scores) LIMIT 5) INTO account_ids;
    
    IF array_length(account_ids, 1) > 0 THEN
        FOR i IN 1..LEAST(5, array_length(account_ids, 1)) LOOP
            INSERT INTO account_health_alerts (id, client_id, alert_type, status, message, threshold_value, current_value, created_at) VALUES
            (uuid_generate_v4(),
             account_ids[i],
             CASE (i % 4)
                 WHEN 1 THEN 'low_score'
                 WHEN 2 THEN 'high_risk'
                 WHEN 3 THEN 'declining_trend'
                 WHEN 0 THEN 'payment_overdue'
             END,
             CASE WHEN i % 3 = 0 THEN 'resolved' ELSE 'active' END,
             CASE (i % 4)
                 WHEN 1 THEN 'Account health score has dropped below the warning threshold'
                 WHEN 2 THEN 'Account is at high risk due to low engagement and payment issues'
                 WHEN 3 THEN 'Account health has been declining over the past month'
                 WHEN 0 THEN 'Payment is overdue by more than 30 days'
             END,
             CASE WHEN (i % 4) IN (1, 2) THEN 70 ELSE NULL END,
             CASE WHEN (i % 4) IN (1, 2) THEN 45 + i * 5 ELSE NULL END,
             NOW() - INTERVAL '1 hour' * i);
        END LOOP;
    END IF;
END $$;

-- Update dashboard metrics with fresh data
INSERT INTO dashboard_metrics (id, metric_name, metric_value, metric_type, created_at, updated_at)
SELECT uuid_generate_v4(), metric_name, metric_value, metric_type, NOW(), NOW()
FROM (VALUES
    ('total_users', (SELECT COUNT(*) FROM users)::text, 'count'),
    ('total_accounts', (SELECT COUNT(*) FROM accounts)::text, 'count'),
    ('total_vehicles', (SELECT COUNT(*) FROM vehicles)::text, 'count'),
    ('total_clients', (SELECT COUNT(*) FROM clients)::text, 'count'),
    ('active_integrations', (SELECT COUNT(*) FROM integration_codes WHERE is_active = true)::text, 'count'),
    ('pending_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false)::text, 'count'),
    ('average_health_score', COALESCE((SELECT ROUND(AVG(health_score))::text FROM account_health_scores), '0'), 'percentage'),
    ('active_alerts', (SELECT COUNT(*) FROM account_health_alerts WHERE status = 'active')::text, 'count')
) AS new_metrics(metric_name, metric_value, metric_type)
ON CONFLICT (metric_name) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    updated_at = NOW();

-- Refresh any dependent views
DO $$
BEGIN
    -- Check if materialized view exists before refreshing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_summary_view' AND table_type = 'VIEW') THEN
        REFRESH MATERIALIZED VIEW account_summary_view;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if view doesn't exist
        NULL;
END $$;

-- Create function to update health score timestamp if not exists
CREATE OR REPLACE FUNCTION update_health_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health scores if not exists
DROP TRIGGER IF EXISTS trigger_update_health_score_timestamp ON account_health_scores;
CREATE TRIGGER trigger_update_health_score_timestamp
    BEFORE UPDATE ON account_health_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_health_score_timestamp();

-- Analyze tables for better query performance
ANALYZE account_health_scores;
ANALYZE account_health_alerts;
ANALYZE clients;
ANALYZE vehicles;
ANALYZE notifications;
ANALYZE integration_codes;
ANALYZE system_logs;
ANALYZE dashboard_metrics;

-- Final status check
DO $$
DECLARE
    table_count INTEGER;
    data_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('account_health_scores', 'account_health_alerts', 'clients', 'vehicles', 'notifications', 'integration_codes', 'system_logs');
    
    SELECT 
        (SELECT COUNT(*) FROM clients) +
        (SELECT COUNT(*) FROM vehicles) +
        (SELECT COUNT(*) FROM notifications) +
        (SELECT COUNT(*) FROM integration_codes) +
        (SELECT COUNT(*) FROM system_logs) +
        (SELECT COUNT(*) FROM account_health_scores) +
        (SELECT COUNT(*) FROM account_health_alerts)
    INTO data_count;
    
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Total records inserted: %', data_count;
END $$;
