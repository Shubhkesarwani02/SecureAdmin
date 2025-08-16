-- =============================================
-- Framtt Superadmin Dashboard Database Setup
-- =============================================
-- Run this complete script in Supabase SQL Editor
-- This will create all tables, policies, triggers, and sample data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
-- Stores admin user profiles and preferences
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'viewer')),
    department VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    avatar TEXT,
    bio TEXT,
    permissions TEXT[] DEFAULT ARRAY['read:dashboard'],
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 2. CLIENTS TABLE
-- =============================================
-- Stores rental company client information
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    postal_code VARCHAR(20),
    website VARCHAR(255),
    business_license VARCHAR(100),
    tax_id VARCHAR(50),
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled', 'suspended')),
    monthly_revenue DECIMAL(10,2) DEFAULT 0.00,
    total_bookings INTEGER DEFAULT 0,
    fleet_size INTEGER DEFAULT 0,
    integration_status JSONB DEFAULT '{"ai_recommendation": false, "whatsapp_connected": false, "tracking_active": false, "marketing_active": false}',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. VEHICLES TABLE
-- =============================================
-- Stores vehicle information for clients
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17) UNIQUE,
    license_plate VARCHAR(20),
    color VARCHAR(50),
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'truck', 'van', 'convertible', 'luxury', 'economy')),
    fuel_type VARCHAR(30) DEFAULT 'gasoline' CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
    transmission VARCHAR(20) DEFAULT 'automatic' CHECK (transmission IN ('automatic', 'manual')),
    mileage INTEGER DEFAULT 0,
    daily_rate DECIMAL(8,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    location VARCHAR(255),
    features TEXT[],
    images TEXT[],
    insurance_policy VARCHAR(100),
    registration_expiry DATE,
    last_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. NOTIFICATIONS TABLE
-- =============================================
-- Stores system notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'client', 'payment', 'system', 'security')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    read_status BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. INTEGRATION_CODES TABLE
-- =============================================
-- Stores unique 5-digit integration codes for clients
CREATE TABLE IF NOT EXISTS integration_codes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    code VARCHAR(5) UNIQUE NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(255),
    webhook_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    rate_limit INTEGER DEFAULT 1000,
    rate_window VARCHAR(20) DEFAULT 'hourly',
    permissions TEXT[] DEFAULT ARRAY['basic'],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. SYSTEM_LOGS TABLE
-- =============================================
-- Stores system activity and audit logs
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    session_id VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. DASHBOARD_METRICS TABLE
-- =============================================
-- Stores aggregated metrics for dashboard analytics
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('count', 'revenue', 'percentage', 'average', 'sum')),
    dimension_1 VARCHAR(100),
    dimension_2 VARCHAR(100),
    time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_name, time_period, period_start, dimension_1, dimension_2)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_plan ON clients(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_status ON clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Integration codes table indexes
CREATE INDEX IF NOT EXISTS idx_integration_codes_client_id ON integration_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_integration_codes_code ON integration_codes(code);
CREATE INDEX IF NOT EXISTS idx_integration_codes_is_active ON integration_codes(is_active);

-- System logs table indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_client_id ON system_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Dashboard metrics table indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name_period ON dashboard_metrics(metric_name, time_period);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_period_start ON dashboard_metrics(period_start);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_created_at ON dashboard_metrics(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Superadmins can manage all users" ON users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin' 
            AND status = 'active'
        )
    );

-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON clients FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage clients" ON clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('superadmin', 'admin') 
            AND status = 'active'
        )
    );

-- Vehicles policies
CREATE POLICY "Authenticated users can view vehicles" ON vehicles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage vehicles" ON vehicles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('superadmin', 'admin') 
            AND status = 'active'
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND id = notifications.recipient_id
        )
    );

CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND id = notifications.recipient_id
        )
    );

-- Integration codes policies
CREATE POLICY "Authenticated users can view integration codes" ON integration_codes FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage integration codes" ON integration_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('superadmin', 'admin') 
            AND status = 'active'
        )
    );

-- System logs policies
CREATE POLICY "Superadmins can view system logs" ON system_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin' 
            AND status = 'active'
        )
    );

-- Dashboard metrics policies
CREATE POLICY "Authenticated users can view dashboard metrics" ON dashboard_metrics FOR SELECT
    USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_codes_updated_at BEFORE UPDATE ON integration_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_metrics_updated_at BEFORE UPDATE ON dashboard_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique 5-digit codes
CREATE OR REPLACE FUNCTION generate_unique_code()
RETURNS VARCHAR(5) AS $$
DECLARE
    new_code VARCHAR(5);
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        -- Generate random 5-digit code
        new_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM integration_codes WHERE code = new_code) THEN
            RETURN new_code;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate integration code for new clients
CREATE OR REPLACE FUNCTION create_integration_code_for_client()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO integration_codes (client_id, code, description)
    VALUES (
        NEW.id, 
        generate_unique_code(), 
        'Default integration code for ' || NEW.company_name
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create integration code when client is created
CREATE TRIGGER create_client_integration_code
    AFTER INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION create_integration_code_for_client();

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log INSERT operations
    IF TG_OP = 'INSERT' THEN
        INSERT INTO system_logs (user_id, action, resource_type, resource_id, new_values, message)
        VALUES (
            (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
            'CREATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(NEW),
            TG_TABLE_NAME || ' created'
        );
        RETURN NEW;
    END IF;
    
    -- Log UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO system_logs (user_id, action, resource_type, resource_id, old_values, new_values, message)
        VALUES (
            (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(OLD),
            to_jsonb(NEW),
            TG_TABLE_NAME || ' updated'
        );
        RETURN NEW;
    END IF;
    
    -- Log DELETE operations
    IF TG_OP = 'DELETE' THEN
        INSERT INTO system_logs (user_id, action, resource_type, resource_id, old_values, message)
        VALUES (
            (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::TEXT,
            to_jsonb(OLD),
            TG_TABLE_NAME || ' deleted'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers to key tables
CREATE TRIGGER log_clients_activity
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_vehicles_activity
    AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_users_activity
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample admin users
INSERT INTO users (auth_user_id, full_name, email, phone, role, department, status, bio, permissions, preferences) VALUES
(uuid_generate_v4(), 'John Smith', 'john@framtt.com', '+1 (555) 123-4567', 'superadmin', 'Management', 'active', 'Superadmin with full system access and oversight responsibilities.', 
 ARRAY['read:all', 'write:all', 'delete:all', 'admin:all'], 
 '{"emailNotifications": true, "pushNotifications": false, "weeklyReports": true, "twoFactorAuth": true, "sessionTimeout": "8", "language": "en", "timezone": "America/New_York", "theme": "light"}'),

(uuid_generate_v4(), 'Sarah Johnson', 'sarah@framtt.com', '+1 (555) 234-5678', 'admin', 'Operations', 'active', 'Operations admin responsible for client management and system monitoring.',
 ARRAY['read:all', 'write:clients', 'write:vehicles', 'read:logs'], 
 '{"emailNotifications": true, "pushNotifications": true, "weeklyReports": true, "twoFactorAuth": true, "sessionTimeout": "8", "language": "en", "timezone": "America/New_York", "theme": "light"}'),

(uuid_generate_v4(), 'Mike Chen', 'mike@framtt.com', '+1 (555) 345-6789', 'admin', 'Engineering', 'active', 'Technical admin managing system integrations and API development.',
 ARRAY['read:all', 'write:integrations', 'read:logs', 'write:system'], 
 '{"emailNotifications": false, "pushNotifications": true, "weeklyReports": false, "twoFactorAuth": true, "sessionTimeout": "4", "language": "en", "timezone": "America/Los_Angeles", "theme": "dark"}')

ON CONFLICT (email) DO NOTHING;

-- Insert sample rental company clients
INSERT INTO clients (company_name, contact_person, email, phone, address, city, state, country, postal_code, website, business_license, tax_id, subscription_plan, subscription_status, monthly_revenue, total_bookings, fleet_size, integration_status, onboarding_completed, kyc_verified, last_activity) VALUES

('Premium Fleet Services', 'David Rodriguez', 'david@premiumfleet.com', '+1 (555) 987-6543', '123 Business Blvd', 'Los Angeles', 'California', 'United States', '90210', 'https://premiumfleet.com', 'BL123456', 'TAX789012', 'enterprise', 'active', 15750.00, 234, 45, 
 '{"ai_recommendation": true, "whatsapp_connected": true, "tracking_active": true, "marketing_active": true}', true, true, NOW() - INTERVAL '2 hours'),

('Elite Car Rentals', 'Jessica Wang', 'jessica@eliterentals.com', '+1 (555) 876-5432', '456 Commerce Ave', 'Miami', 'Florida', 'United States', '33101', 'https://eliterentals.com', 'BL234567', 'TAX890123', 'premium', 'active', 12300.00, 189, 32, 
 '{"ai_recommendation": true, "whatsapp_connected": false, "tracking_active": true, "marketing_active": true}', true, true, NOW() - INTERVAL '5 hours'),

('Coastal Vehicle Co', 'Robert Taylor', 'robert@coastalvehicle.com', '+1 (555) 765-4321', '789 Harbor St', 'San Diego', 'California', 'United States', '92101', 'https://coastalvehicle.com', 'BL345678', 'TAX901234', 'premium', 'active', 9800.00, 156, 28, 
 '{"ai_recommendation": false, "whatsapp_connected": true, "tracking_active": true, "marketing_active": false}', true, true, NOW() - INTERVAL '1 day'),

('Metro Transit Solutions', 'Lisa Anderson', 'lisa@metrotransit.com', '+1 (555) 654-3210', '321 Downtown Rd', 'Chicago', 'Illinois', 'United States', '60601', 'https://metrotransit.com', 'BL456789', 'TAX012345', 'basic', 'active', 6500.00, 98, 18, 
 '{"ai_recommendation": false, "whatsapp_connected": false, "tracking_active": true, "marketing_active": false}', true, true, NOW() - INTERVAL '3 days'),

('Sunshine Auto Rental', 'Carlos Martinez', 'carlos@sunshineauto.com', '+1 (555) 543-2109', '654 Sunny Blvd', 'Orlando', 'Florida', 'United States', '32801', 'https://sunshineauto.com', 'BL567890', 'TAX123456', 'basic', 'trial', 4200.00, 67, 12, 
 '{"ai_recommendation": false, "whatsapp_connected": false, "tracking_active": false, "marketing_active": false}', false, false, NOW() - INTERVAL '1 week')

ON CONFLICT (email) DO NOTHING;

-- Insert sample vehicles (distributed across clients)
INSERT INTO vehicles (client_id, make, model, year, vin, license_plate, color, vehicle_type, fuel_type, transmission, mileage, daily_rate, status, location, features, images) VALUES

-- Premium Fleet Services vehicles (client_id: 1)
(1, 'BMW', 'X5', 2023, '1HGCM82633A123456', 'PFS001', 'Black', 'luxury', 'gasoline', 'automatic', 5000, 199.99, 'available', 'LAX Terminal', ARRAY['GPS Navigation', 'Leather Seats', 'Sunroof', 'Premium Audio'], ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e']),
(1, 'Mercedes-Benz', 'E-Class', 2023, '1HGCM82633A123457', 'PFS002', 'Silver', 'luxury', 'gasoline', 'automatic', 3200, 179.99, 'rented', 'Downtown LA', ARRAY['GPS Navigation', 'Leather Seats', 'Premium Audio'], ARRAY['https://images.unsplash.com/photo-1563720223185-11003d516935']),
(1, 'Audi', 'Q7', 2023, '1HGCM82633A123458', 'PFS003', 'White', 'luxury', 'gasoline', 'automatic', 7500, 189.99, 'available', 'Beverly Hills', ARRAY['GPS Navigation', 'Leather Seats', 'All-wheel Drive'], ARRAY['https://images.unsplash.com/photo-1544636331-e26879cd4d9b']),

-- Elite Car Rentals vehicles (client_id: 2) 
(2, 'Tesla', 'Model S', 2023, '1HGCM82633A123459', 'ECR001', 'Red', 'luxury', 'electric', 'automatic', 12000, 159.99, 'available', 'Miami Beach', ARRAY['Autopilot', 'Premium Audio', 'Fast Charging'], ARRAY['https://images.unsplash.com/photo-1560958089-b8a1929cea89']),
(2, 'Porsche', '911', 2023, '1HGCM82633A123460', 'ECR002', 'Blue', 'luxury', 'gasoline', 'automatic', 8500, 299.99, 'available', 'South Beach', ARRAY['Sport Package', 'Premium Audio', 'GPS Navigation'], ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70']),

-- Coastal Vehicle Co vehicles (client_id: 3)
(3, 'Toyota', 'Camry', 2023, '1HGCM82633A123461', 'CVC001', 'Gray', 'sedan', 'hybrid', 'automatic', 15000, 79.99, 'available', 'San Diego Airport', ARRAY['GPS Navigation', 'Backup Camera', 'Hybrid Engine'], ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb']),
(3, 'Honda', 'CR-V', 2023, '1HGCM82633A123462', 'CVC002', 'Green', 'suv', 'gasoline', 'automatic', 18000, 89.99, 'rented', 'Downtown San Diego', ARRAY['GPS Navigation', 'All-wheel Drive', 'Backup Camera'], ARRAY['https://images.unsplash.com/photo-1581540222194-0def2dda95b8']),

-- Metro Transit Solutions vehicles (client_id: 4)
(4, 'Ford', 'Transit', 2022, '1HGCM82633A123463', 'MTS001', 'White', 'van', 'gasoline', 'automatic', 25000, 129.99, 'available', 'Chicago OHare', ARRAY['GPS Navigation', '12 Passenger Seating', 'Rear Camera'], ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64']),
(4, 'Chevrolet', 'Suburban', 2022, '1HGCM82633A123464', 'MTS002', 'Black', 'suv', 'gasoline', 'automatic', 22000, 149.99, 'maintenance', 'Downtown Chicago', ARRAY['GPS Navigation', '8 Passenger Seating', 'All-wheel Drive'], ARRAY['https://images.unsplash.com/photo-1565022231272-7e6db57ef439']),

-- Sunshine Auto Rental vehicles (client_id: 5)
(5, 'Nissan', 'Altima', 2022, '1HGCM82633A123465', 'SAR001', 'Blue', 'sedan', 'gasoline', 'automatic', 28000, 69.99, 'available', 'Orlando Airport', ARRAY['GPS Navigation', 'Backup Camera', 'Bluetooth'], ARRAY['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2'])

ON CONFLICT (vin) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (recipient_id, title, message, type, category, priority, read_status, action_url, metadata) VALUES

(1, 'New Client Registration', 'Premium Fleet Services completed KYC verification and is ready for onboarding.', 'success', 'client', 'medium', true, '/clients', '{"client_id": 1, "action_required": false}'),
(1, 'Payment Received', 'Monthly subscription payment of $2,499.99 received from Elite Car Rentals.', 'success', 'payment', 'low', true, '/payments', '{"amount": 2499.99, "client_id": 2}'),
(1, 'System Maintenance Scheduled', 'Database maintenance is scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.', 'warning', 'system', 'high', false, '/monitoring', '{"maintenance_window": "2024-01-15T02:00:00Z"}'),
(2, 'Integration Code Generated', 'New integration code ABC123 created for Coastal Vehicle Co.', 'info', 'client', 'medium', false, '/snippets', '{"code": "ABC123", "client_id": 3}'),
(2, 'Low Fleet Utilization Alert', 'Metro Transit Solutions fleet utilization dropped below 60% threshold.', 'warning', 'client', 'medium', false, '/clients', '{"client_id": 4, "utilization": 58}'),
(1, 'Security Alert', 'Multiple failed login attempts detected from IP 192.168.1.100.', 'error', 'security', 'urgent', false, '/monitoring', '{"ip": "192.168.1.100", "attempts": 5}'),
(3, 'API Rate Limit Warning', 'Client Sunshine Auto Rental approaching API rate limit (90% of quota used).', 'warning', 'system', 'medium', true, '/clients', '{"client_id": 5, "usage_percent": 90})

ON CONFLICT DO NOTHING;

-- Insert sample dashboard metrics
INSERT INTO dashboard_metrics (metric_name, metric_value, metric_type, dimension_1, time_period, period_start, period_end, metadata) VALUES

-- Monthly metrics for current month
('total_clients', 5, 'count', NULL, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{}'),
('total_revenue', 48550.00, 'revenue', NULL, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"currency": "USD"}'),
('total_bookings', 744, 'count', NULL, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{}'),
('average_booking_value', 65.25, 'average', NULL, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"currency": "USD"}'),
('fleet_utilization', 78.5, 'percentage', NULL, 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{}'),

-- Daily metrics for today
('daily_active_clients', 4, 'count', NULL, 'daily', CURRENT_DATE, CURRENT_DATE, '{}'),
('daily_revenue', 1850.00, 'revenue', NULL, 'daily', CURRENT_DATE, CURRENT_DATE, '{"currency": "USD"}'),
('daily_bookings', 28, 'count', NULL, 'daily', CURRENT_DATE, CURRENT_DATE, '{}'),

-- Client-specific metrics
('client_revenue', 15750.00, 'revenue', 'Premium Fleet Services', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"client_id": 1}'),
('client_revenue', 12300.00, 'revenue', 'Elite Car Rentals', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"client_id": 2}'),
('client_revenue', 9800.00, 'revenue', 'Coastal Vehicle Co', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"client_id": 3}'),
('client_revenue', 6500.00, 'revenue', 'Metro Transit Solutions', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"client_id": 4}'),
('client_revenue', 4200.00, 'revenue', 'Sunshine Auto Rental', 'monthly', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day', '{"client_id": 5}')

ON CONFLICT (metric_name, time_period, period_start, dimension_1, dimension_2) DO NOTHING;

-- =============================================
-- USEFUL VIEWS
-- =============================================

-- Client summary view with key metrics
CREATE OR REPLACE VIEW client_summary AS
SELECT 
    c.id,
    c.company_name,
    c.contact_person,
    c.email,
    c.subscription_plan,
    c.subscription_status,
    c.monthly_revenue,
    c.total_bookings,
    c.fleet_size,
    c.integration_status,
    c.kyc_verified,
    c.onboarding_completed,
    c.last_activity,
    ic.code as integration_code,
    COUNT(v.id) as actual_vehicle_count,
    COUNT(CASE WHEN v.status = 'available' THEN 1 END) as available_vehicles,
    COUNT(CASE WHEN v.status = 'rented' THEN 1 END) as rented_vehicles,
    ROUND(
        CASE 
            WHEN COUNT(v.id) > 0 THEN 
                (COUNT(CASE WHEN v.status = 'rented' THEN 1 END)::DECIMAL / COUNT(v.id) * 100)
            ELSE 0 
        END, 2
    ) as utilization_rate,
    c.created_at,
    c.updated_at
FROM clients c
LEFT JOIN vehicles v ON c.id = v.client_id
LEFT JOIN integration_codes ic ON c.id = ic.client_id AND ic.is_active = true
GROUP BY c.id, ic.code
ORDER BY c.monthly_revenue DESC;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    sl.id,
    sl.action,
    sl.resource_type,
    sl.resource_id,
    sl.message,
    sl.severity,
    sl.created_at,
    u.full_name as user_name,
    u.email as user_email,
    c.company_name as client_name
FROM system_logs sl
LEFT JOIN users u ON sl.user_id = u.id
LEFT JOIN clients c ON sl.client_id = c.id
ORDER BY sl.created_at DESC
LIMIT 100;

-- Monthly revenue summary view
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT 
    DATE_TRUNC('month', period_start) as month,
    SUM(CASE WHEN metric_name = 'total_revenue' THEN metric_value ELSE 0 END) as total_revenue,
    SUM(CASE WHEN metric_name = 'total_bookings' THEN metric_value ELSE 0 END) as total_bookings,
    AVG(CASE WHEN metric_name = 'average_booking_value' THEN metric_value ELSE NULL END) as avg_booking_value,
    AVG(CASE WHEN metric_name = 'fleet_utilization' THEN metric_value ELSE NULL END) as avg_utilization
FROM dashboard_metrics 
WHERE time_period = 'monthly' 
    AND period_start >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', period_start)
ORDER BY month DESC;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'Framtt Superadmin Dashboard database setup completed successfully!';
    RAISE NOTICE 'Created tables: users, clients, vehicles, notifications, integration_codes, system_logs, dashboard_metrics';
    RAISE NOTICE 'Inserted sample data for 3 admin users and 5 rental companies';
    RAISE NOTICE 'Applied Row Level Security policies and created useful views';
    RAISE NOTICE 'Integration codes have been automatically generated for all clients';
    RAISE NOTICE 'System is ready for authentication and full dashboard functionality';
END $$;