-- Create monitoring and metrics tables
BEGIN;

-- API Endpoints monitoring table
CREATE TABLE IF NOT EXISTS public.api_endpoints (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  endpoint_path VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'error', 'down')),
  uptime_percentage NUMERIC(5, 2) DEFAULT 99.9,
  average_response_time INTEGER, -- in milliseconds
  total_requests BIGINT DEFAULT 0,
  failed_requests BIGINT DEFAULT 0,
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table for tracking resource usage over time
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cpu_usage NUMERIC(5, 2), -- percentage
  memory_usage NUMERIC(5, 2), -- percentage
  disk_usage NUMERIC(5, 2), -- percentage
  network_in INTEGER, -- KB/s
  network_out INTEGER, -- KB/s
  active_connections INTEGER,
  load_average NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance system_logs table if it exists (add indexes and ensure structure)
DO $$ 
BEGIN
  -- Add index for system_logs if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
    CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs(service);
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_endpoints_status ON api_endpoints(status);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_last_check ON api_endpoints(last_check_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- Insert sample API endpoints
INSERT INTO api_endpoints (name, endpoint_path, status, uptime_percentage, average_response_time, total_requests, failed_requests) VALUES
  ('Authentication API', '/api/auth', 'healthy', 99.9, 120, 1200000, 120),
  ('User Management API', '/api/users', 'healthy', 99.8, 150, 890000, 890),
  ('Client API', '/api/clients', 'healthy', 99.7, 95, 2100000, 2100),
  ('Dashboard API', '/api/dashboard', 'healthy', 99.9, 200, 445000, 445),
  ('Billing API', '/api/billing', 'warning', 99.2, 280, 567000, 4536)
ON CONFLICT (name) DO UPDATE SET
  status = EXCLUDED.status,
  uptime_percentage = EXCLUDED.uptime_percentage,
  average_response_time = EXCLUDED.average_response_time,
  total_requests = EXCLUDED.total_requests,
  failed_requests = EXCLUDED.failed_requests,
  last_check_at = NOW();

-- Insert sample system metrics (last 24 hours worth of data)
INSERT INTO system_metrics (timestamp, cpu_usage, memory_usage, disk_usage, network_in, network_out)
SELECT 
  NOW() - (interval '1 hour' * generate_series),
  45 + (random() * 30)::numeric(5,2),
  60 + (random() * 25)::numeric(5,2),
  78 + (random() * 10)::numeric(5,2),
  100 + (random() * 200)::int,
  50 + (random() * 150)::int
FROM generate_series(0, 23)
ON CONFLICT DO NOTHING;

-- Insert sample system logs if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
    INSERT INTO system_logs (level, service, message, details, created_at)
    SELECT 
      CASE 
        WHEN random() < 0.1 THEN 'ERROR'
        WHEN random() < 0.3 THEN 'WARNING'
        ELSE 'INFO'
      END,
      (ARRAY['Authentication API', 'Billing API', 'Dashboard API', 'Client API'])[floor(random() * 4 + 1)],
      (ARRAY[
        'Request processed successfully',
        'High response time detected',
        'Database connection timeout',
        'Failed login attempts spike',
        'Cache refresh completed'
      ])[floor(random() * 5 + 1)],
      jsonb_build_object('timestamp', NOW() - (interval '1 hour' * floor(random() * 24))),
      NOW() - (interval '1 hour' * floor(random() * 24))
    FROM generate_series(1, 20)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
