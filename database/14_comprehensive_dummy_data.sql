-- =============================================
-- COMPREHENSIVE DUMMY DATA FOR TESTING
-- =============================================

-- First, clear existing test data
DELETE FROM account_health_alerts;
DELETE FROM account_health_scores;
DELETE FROM audit_logs WHERE action LIKE '%test%';
DELETE FROM notifications;
DELETE FROM vehicles;
DELETE FROM clients;
DELETE FROM integration_codes;
DELETE FROM system_logs;

-- Insert comprehensive dummy data for clients table
INSERT INTO clients (id, company_name, email, phone, address, created_at) VALUES
(uuid_generate_v4(), 'TechCorp Solutions', 'contact@techcorp.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA', NOW() - INTERVAL '30 days'),
(uuid_generate_v4(), 'Global Logistics Inc', 'info@globallogistics.com', '+1-555-0102', '456 Logistics Ave, Dallas, TX', NOW() - INTERVAL '25 days'),
(uuid_generate_v4(), 'Green Energy Co', 'hello@greenenergy.com', '+1-555-0103', '789 Sustainable Blvd, Austin, TX', NOW() - INTERVAL '20 days'),
(uuid_generate_v4(), 'Manufacturing Plus', 'contact@manufacturingplus.com', '+1-555-0104', '321 Industrial Way, Detroit, MI', NOW() - INTERVAL '15 days'),
(uuid_generate_v4(), 'Retail Solutions LLC', 'support@retailsolutions.com', '+1-555-0105', '654 Commerce St, New York, NY', NOW() - INTERVAL '10 days'),
(uuid_generate_v4(), 'Healthcare Systems', 'admin@healthcaresys.com', '+1-555-0106', '987 Medical Center Dr, Boston, MA', NOW() - INTERVAL '5 days'),
(uuid_generate_v4(), 'FinTech Innovations', 'info@fintechinnovations.com', '+1-555-0107', '147 Financial Plaza, Chicago, IL', NOW() - INTERVAL '3 days'),
(uuid_generate_v4(), 'Education First', 'contact@educationfirst.com', '+1-555-0108', '258 Learning Lane, Seattle, WA', NOW() - INTERVAL '2 days'),
(uuid_generate_v4(), 'Food & Beverage Co', 'hello@foodbeverage.com', '+1-555-0109', '369 Culinary Court, Miami, FL', NOW() - INTERVAL '1 day'),
(uuid_generate_v4(), 'Transportation Hub', 'support@transportationhub.com', '+1-555-0110', '741 Transit Terminal, Denver, CO', NOW());

-- Insert vehicles data
INSERT INTO vehicles (id, make, model, year, license_plate, color, vin, mileage, status, owner_type, owner_id, created_at) VALUES
(uuid_generate_v4(), 'Toyota', 'Camry', 2022, 'ABC-1234', 'Silver', '1HGBH41JXMN109186', 15000, 'active', 'client', (SELECT id FROM clients LIMIT 1), NOW() - INTERVAL '20 days'),
(uuid_generate_v4(), 'Honda', 'Accord', 2021, 'DEF-5678', 'White', '2HGBH41JXMN109187', 22000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 1), NOW() - INTERVAL '18 days'),
(uuid_generate_v4(), 'Ford', 'F-150', 2023, 'GHI-9012', 'Black', '3HGBH41JXMN109188', 8000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 2), NOW() - INTERVAL '15 days'),
(uuid_generate_v4(), 'Chevrolet', 'Silverado', 2022, 'JKL-3456', 'Red', '4HGBH41JXMN109189', 12000, 'maintenance', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 3), NOW() - INTERVAL '12 days'),
(uuid_generate_v4(), 'BMW', 'X5', 2021, 'MNO-7890', 'Blue', '5HGBH41JXMN109190', 18000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 4), NOW() - INTERVAL '10 days'),
(uuid_generate_v4(), 'Mercedes', 'E-Class', 2023, 'PQR-1234', 'Gray', '6HGBH41JXMN109191', 5000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 5), NOW() - INTERVAL '8 days'),
(uuid_generate_v4(), 'Audi', 'A4', 2022, 'STU-5678', 'Green', '7HGBH41JXMN109192', 14000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 6), NOW() - INTERVAL '6 days'),
(uuid_generate_v4(), 'Tesla', 'Model 3', 2023, 'VWX-9012', 'White', '8HGBH41JXMN109193', 3000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 7), NOW() - INTERVAL '4 days'),
(uuid_generate_v4(), 'Nissan', 'Altima', 2021, 'YZA-3456', 'Silver', '9HGBH41JXMN109194', 25000, 'inactive', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 8), NOW() - INTERVAL '2 days'),
(uuid_generate_v4(), 'Hyundai', 'Elantra', 2022, 'BCD-7890', 'Black', 'AHGBH41JXMN109195', 16000, 'active', 'client', (SELECT id FROM clients LIMIT 1 OFFSET 9), NOW());

-- Insert notifications data
INSERT INTO notifications (id, title, description, type, priority, recipient_type, recipient_id, is_read, created_at) VALUES
(uuid_generate_v4(), 'System Maintenance Scheduled', 'System maintenance is scheduled for this weekend', 'system', 'medium', 'role', 'admin', false, NOW() - INTERVAL '5 hours'),
(uuid_generate_v4(), 'New Vehicle Registration', 'A new vehicle has been registered in the system', 'vehicle', 'low', 'role', 'csm', false, NOW() - INTERVAL '3 hours'),
(uuid_generate_v4(), 'Account Health Alert', 'Client account health score has dropped below threshold', 'health', 'high', 'user', (SELECT id FROM users WHERE role = 'csm' LIMIT 1), false, NOW() - INTERVAL '2 hours'),
(uuid_generate_v4(), 'Payment Overdue', 'Payment is overdue for client account', 'billing', 'high', 'role', 'admin', false, NOW() - INTERVAL '1 hour'),
(uuid_generate_v4(), 'Welcome Message', 'Welcome to the Framtt platform!', 'welcome', 'low', 'user', (SELECT id FROM users WHERE role = 'user' LIMIT 1), true, NOW() - INTERVAL '30 minutes'),
(uuid_generate_v4(), 'Security Update', 'New security features have been enabled', 'security', 'medium', 'role', 'superadmin', false, NOW() - INTERVAL '15 minutes'),
(uuid_generate_v4(), 'Backup Completed', 'Daily backup has been completed successfully', 'system', 'low', 'role', 'admin', true, NOW() - INTERVAL '10 minutes'),
(uuid_generate_v4(), 'User Login Alert', 'Unusual login pattern detected', 'security', 'high', 'role', 'admin', false, NOW() - INTERVAL '5 minutes'),
(uuid_generate_v4(), 'Report Generated', 'Monthly report has been generated and is ready for review', 'report', 'medium', 'role', 'csm', false, NOW() - INTERVAL '2 minutes'),
(uuid_generate_v4(), 'Integration Success', 'Third-party integration has been successfully configured', 'integration', 'low', 'role', 'admin', false, NOW());

-- Insert integration codes data
INSERT INTO integration_codes (id, code, purpose, client_id, is_active, expires_at, created_at) VALUES
(uuid_generate_v4(), 'INT-001-TECH', 'API Access for TechCorp Solutions', (SELECT id FROM clients WHERE company_name = 'TechCorp Solutions'), true, NOW() + INTERVAL '90 days', NOW() - INTERVAL '10 days'),
(uuid_generate_v4(), 'INT-002-GLBL', 'Webhook Integration for Global Logistics', (SELECT id FROM clients WHERE company_name = 'Global Logistics Inc'), true, NOW() + INTERVAL '60 days', NOW() - INTERVAL '8 days'),
(uuid_generate_v4(), 'INT-003-GREN', 'Third-party API for Green Energy Co', (SELECT id FROM clients WHERE company_name = 'Green Energy Co'), true, NOW() + INTERVAL '120 days', NOW() - INTERVAL '6 days'),
(uuid_generate_v4(), 'INT-004-MANU', 'Data Export Integration', (SELECT id FROM clients WHERE company_name = 'Manufacturing Plus'), false, NOW() + INTERVAL '30 days', NOW() - INTERVAL '4 days'),
(uuid_generate_v4(), 'INT-005-RETL', 'POS System Integration', (SELECT id FROM clients WHERE company_name = 'Retail Solutions LLC'), true, NOW() + INTERVAL '180 days', NOW() - INTERVAL '2 days'),
(uuid_generate_v4(), 'INT-006-HLTH', 'Healthcare Data Exchange', (SELECT id FROM clients WHERE company_name = 'Healthcare Systems'), true, NOW() + INTERVAL '365 days', NOW() - INTERVAL '1 day'),
(uuid_generate_v4(), 'INT-007-FINT', 'Financial Data API', (SELECT id FROM clients WHERE company_name = 'FinTech Innovations'), true, NOW() + INTERVAL '90 days', NOW()),
(uuid_generate_v4(), 'INT-008-EDUC', 'Learning Management System', (SELECT id FROM clients WHERE company_name = 'Education First'), true, NOW() + INTERVAL '180 days', NOW()),
(uuid_generate_v4(), 'INT-009-FOOD', 'Inventory Management API', (SELECT id FROM clients WHERE company_name = 'Food & Beverage Co'), true, NOW() + INTERVAL '120 days', NOW()),
(uuid_generate_v4(), 'INT-010-TRNS', 'Fleet Management Integration', (SELECT id FROM clients WHERE company_name = 'Transportation Hub'), true, NOW() + INTERVAL '240 days', NOW());

-- Insert system logs data
INSERT INTO system_logs (id, level, message, component, user_id, ip_address, metadata, created_at) VALUES
(uuid_generate_v4(), 'INFO', 'User login successful', 'auth', (SELECT id FROM users WHERE email = 'superadmin@framtt.com'), '192.168.1.100', '{"browser": "Chrome", "os": "Windows"}', NOW() - INTERVAL '2 hours'),
(uuid_generate_v4(), 'INFO', 'Vehicle data updated', 'vehicle', (SELECT id FROM users WHERE role = 'csm' LIMIT 1), '192.168.1.101', '{"vehicle_id": "ABC-1234"}', NOW() - INTERVAL '1 hour'),
(uuid_generate_v4(), 'WARNING', 'Failed login attempt', 'auth', null, '192.168.1.102', '{"email": "invalid@test.com", "attempts": 3}', NOW() - INTERVAL '45 minutes'),
(uuid_generate_v4(), 'ERROR', 'Database connection timeout', 'database', null, 'server', '{"timeout": 5000, "query": "SELECT * FROM users"}', NOW() - INTERVAL '30 minutes'),
(uuid_generate_v4(), 'INFO', 'Account health score calculated', 'health', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), '192.168.1.103', '{"account_id": "tech-corp", "score": 85}', NOW() - INTERVAL '15 minutes'),
(uuid_generate_v4(), 'INFO', 'Notification sent', 'notification', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), '192.168.1.104', '{"notification_type": "health_alert", "recipient_count": 5}', NOW() - INTERVAL '10 minutes'),
(uuid_generate_v4(), 'WARNING', 'Rate limit exceeded', 'api', null, '192.168.1.105', '{"endpoint": "/api/auth/login", "limit": 5, "window": "15m"}', NOW() - INTERVAL '5 minutes'),
(uuid_generate_v4(), 'INFO', 'Backup completed successfully', 'backup', null, 'server', '{"size": "2.5GB", "duration": "00:15:32"}', NOW() - INTERVAL '2 minutes'),
(uuid_generate_v4(), 'ERROR', 'Integration API failure', 'integration', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), '192.168.1.106', '{"api": "third-party", "error": "timeout", "code": "INT-001-TECH"}', NOW() - INTERVAL '1 minute'),
(uuid_generate_v4(), 'INFO', 'Dashboard metrics refreshed', 'dashboard', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), '192.168.1.107', '{"metrics_count": 25, "refresh_time": "00:00:15"}', NOW());

-- Insert account health scores with realistic data
INSERT INTO account_health_scores (id, client_id, health_score, factors, last_updated, created_at) VALUES
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1), 85, '{"engagement": 90, "payment_history": 95, "support_tickets": 70, "feature_usage": 85}', NOW(), NOW() - INTERVAL '1 day'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 1), 92, '{"engagement": 95, "payment_history": 100, "support_tickets": 85, "feature_usage": 90}', NOW(), NOW() - INTERVAL '2 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 2), 67, '{"engagement": 60, "payment_history": 80, "support_tickets": 50, "feature_usage": 75}', NOW(), NOW() - INTERVAL '3 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 3), 78, '{"engagement": 75, "payment_history": 85, "support_tickets": 70, "feature_usage": 80}', NOW(), NOW() - INTERVAL '4 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 4), 89, '{"engagement": 85, "payment_history": 95, "support_tickets": 90, "feature_usage": 85}', NOW(), NOW() - INTERVAL '5 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 5), 45, '{"engagement": 40, "payment_history": 30, "support_tickets": 60, "feature_usage": 50}', NOW(), NOW() - INTERVAL '6 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 6), 96, '{"engagement": 100, "payment_history": 95, "support_tickets": 95, "feature_usage": 95}', NOW(), NOW() - INTERVAL '7 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 7), 73, '{"engagement": 70, "payment_history": 75, "support_tickets": 75, "feature_usage": 70}', NOW(), NOW() - INTERVAL '8 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 8), 82, '{"engagement": 80, "payment_history": 85, "support_tickets": 80, "feature_usage": 85}', NOW(), NOW() - INTERVAL '9 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 9), 91, '{"engagement": 90, "payment_history": 95, "support_tickets": 90, "feature_usage": 90}', NOW(), NOW() - INTERVAL '10 days');

-- Insert account health alerts
INSERT INTO account_health_alerts (id, client_id, alert_type, status, message, threshold_value, current_value, created_at) VALUES
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 2), 'low_score', 'active', 'Account health score has dropped below the warning threshold', 70, 67, NOW() - INTERVAL '2 hours'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 5), 'high_risk', 'active', 'Account is at high risk due to low engagement and payment issues', 50, 45, NOW() - INTERVAL '1 hour'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 2), 'declining_trend', 'acknowledged', 'Account health has been declining over the past month', null, 67, NOW() - INTERVAL '3 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 5), 'payment_overdue', 'active', 'Payment is overdue by more than 30 days', null, null, NOW() - INTERVAL '5 days'),
(uuid_generate_v4(), (SELECT id FROM accounts LIMIT 1 OFFSET 7), 'inactive', 'resolved', 'Account showed signs of inactivity but has since recovered', null, null, NOW() - INTERVAL '7 days');

-- Update dashboard metrics with fresh data
UPDATE dashboard_metrics SET 
    metric_value = CASE 
        WHEN metric_name = 'total_users' THEN (SELECT COUNT(*) FROM users)::text
        WHEN metric_name = 'total_accounts' THEN (SELECT COUNT(*) FROM accounts)::text
        WHEN metric_name = 'total_vehicles' THEN (SELECT COUNT(*) FROM vehicles)::text
        WHEN metric_name = 'total_clients' THEN (SELECT COUNT(*) FROM clients)::text
        WHEN metric_name = 'active_integrations' THEN (SELECT COUNT(*) FROM integration_codes WHERE is_active = true)::text
        WHEN metric_name = 'pending_notifications' THEN (SELECT COUNT(*) FROM notifications WHERE is_read = false)::text
        WHEN metric_name = 'average_health_score' THEN (SELECT ROUND(AVG(health_score))::text FROM account_health_scores)
        WHEN metric_name = 'active_alerts' THEN (SELECT COUNT(*) FROM account_health_alerts WHERE status = 'active')::text
        ELSE metric_value
    END,
    updated_at = NOW()
WHERE metric_name IN ('total_users', 'total_accounts', 'total_vehicles', 'total_clients', 'active_integrations', 'pending_notifications', 'average_health_score', 'active_alerts');

-- Insert additional dashboard metrics if they don't exist
INSERT INTO dashboard_metrics (id, metric_name, metric_value, metric_type, created_at, updated_at)
SELECT uuid_generate_v4(), metric_name, metric_value, metric_type, NOW(), NOW()
FROM (VALUES
    ('total_users', (SELECT COUNT(*) FROM users)::text, 'count'),
    ('total_accounts', (SELECT COUNT(*) FROM accounts)::text, 'count'),
    ('total_vehicles', (SELECT COUNT(*) FROM vehicles)::text, 'count'),
    ('total_clients', (SELECT COUNT(*) FROM clients)::text, 'count'),
    ('active_integrations', (SELECT COUNT(*) FROM integration_codes WHERE is_active = true)::text, 'count'),
    ('pending_notifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false)::text, 'count'),
    ('average_health_score', (SELECT ROUND(AVG(health_score))::text FROM account_health_scores), 'percentage'),
    ('active_alerts', (SELECT COUNT(*) FROM account_health_alerts WHERE status = 'active')::text, 'count')
) AS new_metrics(metric_name, metric_value, metric_type)
WHERE NOT EXISTS (
    SELECT 1 FROM dashboard_metrics WHERE dashboard_metrics.metric_name = new_metrics.metric_name
);

-- Refresh any dependent views or functions
REFRESH MATERIALIZED VIEW IF EXISTS account_summary_view;

-- Analyze tables for better query performance
ANALYZE account_health_scores;
ANALYZE account_health_alerts;
ANALYZE clients;
ANALYZE vehicles;
ANALYZE notifications;
ANALYZE integration_codes;
ANALYZE system_logs;
ANALYZE dashboard_metrics;
