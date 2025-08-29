-- Add system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('app_name', 'Framtt Superadmin', 'Application name', 'general'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode', 'system'),
('max_login_attempts', '5', 'Maximum login attempts before lockout', 'security'),
('session_timeout', '8', 'Session timeout in hours', 'security'),
('email_notifications', 'true', 'Enable email notifications', 'notifications'),
('backup_retention_days', '30', 'Number of days to retain backups', 'system'),
('api_rate_limit', '1000', 'API rate limit per hour', 'performance')
ON CONFLICT (setting_key) DO NOTHING;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Update clients table to include financial data if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'monthly_revenue') THEN
    ALTER TABLE clients ADD COLUMN monthly_revenue DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_bookings') THEN
    ALTER TABLE clients ADD COLUMN total_bookings INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'active_vehicles') THEN
    ALTER TABLE clients ADD COLUMN active_vehicles INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update user preferences with enhanced fields
UPDATE users 
SET preferences = preferences || '{
  "criticalAlerts": true,
  "systemMaintenance": true,
  "accountHealth": true
}'::jsonb
WHERE preferences IS NOT NULL;

-- Create quick actions log table
CREATE TABLE IF NOT EXISTS quick_actions_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_actions_log_user_id ON quick_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_log_action_type ON quick_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_quick_actions_log_created_at ON quick_actions_log(created_at DESC);

-- Insert sample data for testing
INSERT INTO clients (company_name, email, phone, address, kyc_status, status, monthly_revenue, total_bookings, active_vehicles) VALUES
('Elite Car Rentals', 'contact@elitecar.com', '+1-555-0101', '123 Business Ave, New York, NY', 'approved', 'active', 15000.00, 450, 25),
('Metro Solutions', 'info@metrosolutions.com', '+1-555-0102', '456 Corporate Blvd, Chicago, IL', 'approved', 'active', 12000.00, 380, 20),
('Swift Rentals', 'hello@swiftrentals.com', '+1-555-0103', '789 Fleet St, Los Angeles, CA', 'approved', 'active', 9500.00, 290, 18),
('Urban Mobility Co', 'support@urbanmobility.com', '+1-555-0104', '321 Transport Rd, Houston, TX', 'pending', 'pending', 0.00, 0, 0),
('City Drive Rentals', 'admin@citydriver.com', '+1-555-0105', '654 Motor Way, Phoenix, AZ', 'under_review', 'inactive', 8500.00, 220, 15)
ON CONFLICT (email) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (title, description, type, priority, user_id, metadata) VALUES
('System Maintenance Scheduled', 'Scheduled maintenance window from 2:00 AM to 4:00 AM EST', 'info', 'medium', NULL, '{"maintenance_window": "2:00-4:00 AM EST"}'),
('High Revenue Alert', 'Elite Car Rentals exceeded monthly revenue target', 'success', 'low', NULL, '{"client_id": "1", "revenue": "15000"}'),
('KYC Review Required', 'Urban Mobility Co KYC documents require review', 'warning', 'high', NULL, '{"client_id": "4", "action_required": "kyc_review"}'),
('Payment Issue Detected', 'Swift Rentals payment method expired', 'warning', 'medium', NULL, '{"client_id": "3", "issue": "payment_method_expired"}'),
('Critical System Alert', 'Database connection timeout detected', 'error', 'critical', NULL, '{"service": "database", "error_type": "timeout"}')
ON CONFLICT DO NOTHING;
