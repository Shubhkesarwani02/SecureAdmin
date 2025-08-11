-- Create vehicles table
CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'maintenance', 'inactive')),
  category VARCHAR(50) NOT NULL DEFAULT 'sedan' CHECK (category IN ('sedan', 'suv', 'luxury', 'economy', 'truck', 'van')),
  daily_rate DECIMAL(8,2) DEFAULT 50.00,
  location VARCHAR(255),
  
  -- Current booking information
  current_booking_id BIGINT,
  current_booking_start DATE,
  current_booking_end DATE,
  current_booking_customer VARCHAR(255),
  
  -- Statistics
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to manage all vehicles
CREATE POLICY "Superadmins can manage all vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for admins to read vehicles
CREATE POLICY "Admins can read vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin'))
  );

-- Insert sample vehicles
INSERT INTO vehicles (
  id, client_id, make, model, year, license_plate, vin, status, category, daily_rate,
  location, current_booking_id, current_booking_start, current_booking_end, current_booking_customer,
  total_bookings, total_revenue, created_at, updated_at
) VALUES 
(
  1, 1, 'Toyota', 'Camry', 2023, 'NYC-2023', '1HGBH41JXMN109186', 'active', 'sedan', 65.00,
  'New York Downtown', 1001, '2025-01-08', '2025-01-12', 'John Doe',
  45, 12750.00, '2024-01-15 00:00:00+00', '2025-01-08 00:00:00+00'
),
(
  2, 1, 'Honda', 'Accord', 2022, 'NYC-2024', '1HGCV1F3XLA123456', 'available', 'sedan', 70.00,
  'New York Midtown', NULL, NULL, NULL, NULL,
  38, 9800.00, '2024-01-20 00:00:00+00', '2025-01-07 00:00:00+00'
),
(
  3, 2, 'BMW', 'X5', 2023, 'LAX-3001', '5UXCR6C5XK1234567', 'maintenance', 'suv', 120.00,
  'Los Angeles Airport', NULL, NULL, NULL, NULL,
  62, 28400.00, '2024-02-22 00:00:00+00', '2025-01-06 00:00:00+00'
),
(
  4, 4, 'Mercedes-Benz', 'E-Class', 2023, 'MIA-4001', '4JGDA5HB5EA123456', 'available', 'luxury', 150.00,
  'Miami Downtown', NULL, NULL, NULL, NULL,
  78, 45600.00, '2024-03-10 00:00:00+00', '2025-01-05 00:00:00+00'
),
(
  5, 4, 'Ford', 'Explorer', 2022, 'MIA-4002', '1FM5K8D84NGA12345', 'active', 'suv', 95.00,
  'Miami Airport', 1002, '2025-01-07', '2025-01-14', 'Sarah Wilson',
  52, 18700.00, '2024-03-15 00:00:00+00', '2025-01-07 00:00:00+00'
);

-- Update sequence to continue from inserted IDs
SELECT setval('vehicles_id_seq', 5, true);