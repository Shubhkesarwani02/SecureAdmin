-- Create clients table for rental companies
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  integration_code VARCHAR(10) UNIQUE NOT NULL,
  
  -- Subscription details
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('active', 'cancelled', 'trial', 'past_due')),
  subscription_amount DECIMAL(10,2) DEFAULT 99.00,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Integration flags
  ai_recommendation BOOLEAN DEFAULT false,
  whatsapp_integration BOOLEAN DEFAULT false,
  tracking_active BOOLEAN DEFAULT false,
  marketing_active BOOLEAN DEFAULT false,
  
  -- Statistics
  total_bookings INTEGER DEFAULT 0,
  active_vehicles INTEGER DEFAULT 0,
  monthly_revenue DECIMAL(12,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_subscription_plan ON clients(subscription_plan);
CREATE INDEX idx_clients_integration_code ON clients(integration_code);
CREATE INDEX idx_clients_created_at ON clients(created_at);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to manage all clients
CREATE POLICY "Superadmins can manage all clients" ON clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for admins to read clients
CREATE POLICY "Admins can read clients" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin'))
  );

-- Insert sample clients
INSERT INTO clients (
  id, company_name, email, phone, address, status, integration_code,
  subscription_plan, subscription_status, subscription_amount, next_billing_date,
  ai_recommendation, whatsapp_integration, tracking_active, marketing_active,
  total_bookings, active_vehicles, monthly_revenue, created_at, last_login
) VALUES 
(
  1, 'Elite Car Rentals', 'admin@elitecarrentals.com', '+1 (555) 111-2222',
  '123 Business District, New York, NY 10001', 'active', 'EC789',
  'enterprise', 'active', 299.00, '2025-02-15 00:00:00+00',
  true, true, true, false,
  1247, 45, 28500.00, '2024-01-15 00:00:00+00', '2025-01-05 00:00:00+00'
),
(
  2, 'Swift Vehicle Solutions', 'contact@swiftvehicle.com', '+1 (555) 222-3333',
  '456 Commerce Ave, Los Angeles, CA 90001', 'active', 'SV456',
  'professional', 'active', 199.00, '2025-02-22 00:00:00+00',
  false, true, true, true,
  892, 32, 19800.00, '2024-02-22 00:00:00+00', '2025-01-04 00:00:00+00'
),
(
  3, 'Urban Mobility Co', 'info@urbanmobility.com', '+1 (555) 333-4444',
  '789 Downtown Street, Chicago, IL 60601', 'inactive', 'UM123',
  'basic', 'cancelled', 99.00, NULL,
  false, false, true, false,
  234, 8, 0.00, '2024-01-08 00:00:00+00', '2024-12-20 00:00:00+00'
),
(
  4, 'Premium Fleet Services', 'support@premiumfleet.com', '+1 (555) 444-5555',
  '321 Executive Plaza, Miami, FL 33101', 'active', 'PF654',
  'enterprise', 'active', 299.00, '2025-02-10 00:00:00+00',
  true, true, true, true,
  1567, 67, 35400.00, '2024-03-10 00:00:00+00', '2025-01-06 00:00:00+00'
),
(
  5, 'City Drive Rentals', 'hello@citydriverentals.com', '+1 (555) 555-6666',
  '654 Metropolitan Way, Seattle, WA 98101', 'pending', 'CD321',
  'basic', 'trial', 99.00, '2025-02-02 00:00:00+00',
  true, false, false, false,
  0, 0, 0.00, '2025-01-02 00:00:00+00', NULL
);

-- Update sequence to continue from inserted IDs
SELECT setval('clients_id_seq', 5, true);