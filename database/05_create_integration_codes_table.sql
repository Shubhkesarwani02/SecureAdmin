-- Create integration_codes table
CREATE TABLE integration_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_integration_codes_code ON integration_codes(code);
CREATE INDEX idx_integration_codes_client_id ON integration_codes(client_id);
CREATE INDEX idx_integration_codes_status ON integration_codes(status);
CREATE INDEX idx_integration_codes_created_at ON integration_codes(created_at);

-- Enable RLS
ALTER TABLE integration_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to manage all integration codes
CREATE POLICY "Superadmins can manage integration codes" ON integration_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for admins to read integration codes
CREATE POLICY "Admins can read integration codes" ON integration_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin'))
  );

-- Insert sample integration codes
INSERT INTO integration_codes (
  id, code, client_id, status, usage_count, last_used, created_at
) VALUES 
(
  1, 'EC789', 1, 'active', 1247, '2025-01-08 10:30:00+00', '2024-01-15 00:00:00+00'
),
(
  2, 'SV456', 2, 'active', 892, '2025-01-07 15:45:00+00', '2024-02-22 00:00:00+00'
),
(
  3, 'UM123', 3, 'inactive', 234, '2024-12-20 08:20:00+00', '2024-01-08 00:00:00+00'
),
(
  4, 'PF654', 4, 'active', 1567, '2025-01-06 14:30:00+00', '2024-03-10 00:00:00+00'
),
(
  5, 'CD321', 5, 'active', 0, NULL, '2025-01-02 00:00:00+00'
);

-- Update sequence to continue from inserted IDs
SELECT setval('integration_codes_id_seq', 5, true);