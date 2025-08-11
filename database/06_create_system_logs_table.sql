-- Create system_logs table for monitoring and audit trails
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
  service VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_service ON system_logs(service);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_client_id ON system_logs(client_id);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to read all logs
CREATE POLICY "Superadmins can read all logs" ON system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for superadmins to insert logs
CREATE POLICY "Superadmins can insert logs" ON system_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Insert sample system logs
INSERT INTO system_logs (
  level, service, message, details, user_id, ip_address, created_at
) VALUES 
(
  'info', 'api', 'User login successful', 
  '{"userId": 1, "method": "email"}', 1, '192.168.1.100', NOW()
),
(
  'warning', 'database', 'Slow query detected', 
  '{"query": "SELECT * FROM clients", "duration": "2.3s"}', NULL, NULL, NOW() - INTERVAL '1 hour'
),
(
  'error', 'payment', 'Payment processing failed', 
  '{"clientId": 3, "amount": 299, "error": "Card declined"}', NULL, NULL, NOW() - INTERVAL '2 hours'
),
(
  'info', 'system', 'Scheduled backup completed', 
  '{"size": "1.2GB", "duration": "45s"}', NULL, NULL, NOW() - INTERVAL '3 hours'
),
(
  'info', 'api', 'Client registration completed', 
  '{"clientId": 5, "companyName": "City Drive Rentals"}', 1, '192.168.1.100', NOW() - INTERVAL '4 hours'
);