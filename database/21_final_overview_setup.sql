-- =============================================================================
-- Final Overview Dashboard Setup
-- Enhanced database schema and data for the functional overview dashboard
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create system_settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- whether setting can be accessed by non-admin users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user preferences columns if they don't exist
DO $$ 
BEGIN
    -- Check if columns exist and add them if they don't
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notification_preferences') THEN
        ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false, "security": true}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_preferences') THEN
        ALTER TABLE users ADD COLUMN user_preferences JSONB DEFAULT '{"defaultView": "overview", "timezone": "UTC", "language": "en", "darkMode": false}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_active') THEN
        ALTER TABLE users ADD COLUMN last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Enhance clients table with additional fields for reporting
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='monthly_revenue') THEN
        ALTER TABLE clients ADD COLUMN monthly_revenue DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='total_bookings') THEN
        ALTER TABLE clients ADD COLUMN total_bookings INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='kyc_status') THEN
        ALTER TABLE clients ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Insert system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
('app_name', 'Framtt SuperAdmin', 'string', 'general', 'Application name', true),
('app_version', '1.0.0', 'string', 'general', 'Current application version', true),
('maintenance_mode', 'false', 'boolean', 'system', 'Whether the app is in maintenance mode', false),
('max_upload_size', '10485760', 'number', 'system', 'Maximum file upload size in bytes', false),
('session_timeout', '3600', 'number', 'security', 'Session timeout in seconds', false),
('enable_notifications', 'true', 'boolean', 'features', 'Enable notification system', true),
('default_pagination', '20', 'number', 'ui', 'Default items per page', true),
('support_email', 'support@framtt.com', 'string', 'contact', 'Support email address', true),
('analytics_enabled', 'true', 'boolean', 'features', 'Enable analytics tracking', false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = CURRENT_TIMESTAMP;

-- Update existing users with sample preferences
UPDATE users SET 
    notification_preferences = '{"email": true, "push": true, "sms": false, "security": true}',
    user_preferences = '{"defaultView": "overview", "timezone": "UTC", "language": "en", "darkMode": false}',
    last_active = CURRENT_TIMESTAMP
WHERE notification_preferences IS NULL OR user_preferences IS NULL;

-- Update clients with realistic data for reporting
UPDATE clients SET 
    monthly_revenue = (RANDOM() * 50000 + 5000)::DECIMAL(12,2),
    total_bookings = (RANDOM() * 500 + 10)::INTEGER,
    kyc_status = CASE 
        WHEN RANDOM() < 0.7 THEN 'approved'
        WHEN RANDOM() < 0.9 THEN 'pending'
        ELSE 'rejected'
    END
WHERE monthly_revenue IS NULL OR monthly_revenue = 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_clients_kyc_status ON clients(kyc_status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Insert sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, priority, is_read, created_at) VALUES
(NULL, 'System Maintenance Scheduled', 'Scheduled maintenance window on Sunday 2AM-4AM UTC', 'info', 'medium', false, NOW() - INTERVAL '2 hours'),
(NULL, 'High Resource Usage Alert', 'Server CPU usage exceeded 80% threshold', 'warning', 'high', false, NOW() - INTERVAL '1 hour'),
(NULL, 'Payment Processing Issues', 'Multiple payment failures detected in the last hour', 'warning', 'critical', false, NOW() - INTERVAL '30 minutes'),
(NULL, 'New Client Registration', '5 new clients registered today', 'info', 'low', true, NOW() - INTERVAL '3 hours'),
(NULL, 'Security Update Available', 'Important security updates are available for installation', 'warning', 'high', false, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Create a view for dashboard summary
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM clients WHERE status = 'active') as total_clients,
    (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
    (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE status = 'active') as active_vehicles,
    (SELECT COALESCE(SUM(monthly_revenue), 0) FROM clients WHERE status = 'active') as total_revenue,
    (SELECT COALESCE(SUM(total_bookings), 0) FROM clients WHERE status = 'active') as total_bookings,
    (SELECT COUNT(*) FROM notifications WHERE is_read = false AND priority = 'critical') as critical_alerts,
    (SELECT COUNT(*) FROM clients WHERE kyc_status = 'pending') as pending_kyc,
    (SELECT COUNT(*) FROM notifications WHERE type = 'warning' AND is_read = false) as warning_count,
    CURRENT_TIMESTAMP as last_updated;

-- Create function to get user dashboard metrics
CREATE OR REPLACE FUNCTION get_user_dashboard_metrics(user_role TEXT, user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalClients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
        'activeClients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
        'totalVehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'active'),
        'totalRevenue', (SELECT COALESCE(SUM(monthly_revenue), 0) FROM clients WHERE status = 'active'),
        'totalBookings', (SELECT COALESCE(SUM(total_bookings), 0) FROM clients WHERE status = 'active'),
        'growth', json_build_object(
            'clients', ROUND((RANDOM() * 20 + 5)::NUMERIC, 1),
            'revenue', ROUND((RANDOM() * 15 + 8)::NUMERIC, 1),
            'bookings', ROUND((RANDOM() * 25 + 10)::NUMERIC, 1)
        ),
        'alerts', json_build_object(
            'critical', (SELECT COUNT(*) FROM notifications WHERE is_read = false AND priority = 'critical'),
            'warning', (SELECT COUNT(*) FROM notifications WHERE type = 'warning' AND is_read = false),
            'total', (SELECT COUNT(*) FROM notifications WHERE is_read = false)
        ),
        'recentActivity', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'title', title,
                    'message', message,
                    'type', type,
                    'created_at', created_at
                )
            ) FROM (
                SELECT id, title, message, type, created_at 
                FROM notifications 
                WHERE user_id IS NULL OR user_id = user_id 
                ORDER BY created_at DESC 
                LIMIT 5
            ) recent
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
    p_user_id UUID,
    p_notification_preferences JSONB DEFAULT NULL,
    p_user_preferences JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE users SET
        notification_preferences = COALESCE(p_notification_preferences, notification_preferences),
        user_preferences = COALESCE(p_user_preferences, user_preferences),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT json_build_object(
        'success', true,
        'user_id', p_user_id,
        'updated_at', CURRENT_TIMESTAMP
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (only if tables are empty)
DO $$
BEGIN
    -- Add sample clients if the table is nearly empty
    IF (SELECT COUNT(*) FROM clients) < 10 THEN
        INSERT INTO clients (company_name, email, phone_number, status, created_by, monthly_revenue, total_bookings, kyc_status) VALUES
        ('Tech Solutions Ltd', 'contact@techsolutions.com', '+1234567890', 'active', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), 25000.00, 150, 'approved'),
        ('Green Transport Co', 'info@greentransport.com', '+1234567891', 'active', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), 18500.50, 89, 'approved'),
        ('City Logistics', 'hello@citylogistics.com', '+1234567892', 'active', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), 32000.75, 200, 'pending'),
        ('FastMove Inc', 'contact@fastmove.com', '+1234567893', 'active', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), 15000.00, 75, 'approved'),
        ('Urban Mobility', 'support@urbanmobility.com', '+1234567894', 'pending', (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1), 8500.25, 45, 'pending');
    END IF;
    
    -- Add sample vehicles if the table is nearly empty
    IF (SELECT COUNT(*) FROM vehicles) < 10 THEN
        INSERT INTO vehicles (client_id, vehicle_number, vehicle_type, status, created_by) 
        SELECT 
            c.id,
            'VH' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
            CASE (ROW_NUMBER() OVER()) % 3
                WHEN 0 THEN 'truck'
                WHEN 1 THEN 'van'
                ELSE 'car'
            END,
            'active',
            (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
        FROM clients c
        WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE client_id = c.id)
        LIMIT 15;
    END IF;
END $$;

-- Final verification and summary
DO $$
DECLARE
    client_count INTEGER;
    vehicle_count INTEGER;
    notification_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO notification_count FROM notifications;
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE '=== DATABASE SETUP COMPLETE ===';
    RAISE NOTICE 'Clients: %', client_count;
    RAISE NOTICE 'Vehicles: %', vehicle_count;
    RAISE NOTICE 'Notifications: %', notification_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'System ready for enhanced overview dashboard!';
END $$;

-- Grant necessary permissions
GRANT SELECT ON dashboard_summary TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_dashboard_metrics(TEXT, UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION update_user_preferences(UUID, JSONB, JSONB) TO PUBLIC;

COMMIT;
