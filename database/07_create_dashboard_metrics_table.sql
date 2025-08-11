-- Create dashboard_metrics table for storing KPI snapshots
CREATE TABLE dashboard_metrics (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  
  -- Overview metrics
  total_companies INTEGER DEFAULT 0,
  active_companies INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_vehicles INTEGER DEFAULT 0,
  active_vehicles INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0.00,
  monthly_revenue DECIMAL(15,2) DEFAULT 0.00,
  
  -- Growth metrics
  companies_growth DECIMAL(5,2) DEFAULT 0.00,
  revenue_growth DECIMAL(5,2) DEFAULT 0.00,
  bookings_growth DECIMAL(5,2) DEFAULT 0.00,
  
  -- System health metrics
  api_uptime DECIMAL(5,2) DEFAULT 100.00,
  database_uptime DECIMAL(5,2) DEFAULT 100.00,
  avg_response_time INTEGER DEFAULT 0, -- in milliseconds
  error_rate DECIMAL(5,4) DEFAULT 0.00,
  
  -- Additional metrics
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE UNIQUE INDEX idx_dashboard_metrics_date_type ON dashboard_metrics(date, metric_type);
CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(date DESC);
CREATE INDEX idx_dashboard_metrics_type ON dashboard_metrics(metric_type);

-- Enable RLS
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to manage dashboard metrics
CREATE POLICY "Superadmins can manage dashboard metrics" ON dashboard_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for admins to read dashboard metrics
CREATE POLICY "Admins can read dashboard metrics" ON dashboard_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'superadmin'))
  );

-- Insert sample dashboard metrics for the last 7 days
INSERT INTO dashboard_metrics (
  date, metric_type, total_companies, active_companies, total_users, total_vehicles, 
  active_vehicles, total_revenue, monthly_revenue, companies_growth, revenue_growth, 
  bookings_growth, api_uptime, database_uptime, avg_response_time, error_rate
) VALUES 
(
  CURRENT_DATE, 'daily_summary', 5, 3, 2, 5, 2, 83700.00, 83700.00,
  12.5, 8.7, 15.2, 99.9, 100.0, 145, 0.02
),
(
  CURRENT_DATE - INTERVAL '1 day', 'daily_summary', 5, 3, 2, 5, 3, 81200.00, 81200.00,
  11.2, 7.3, 14.8, 99.8, 100.0, 152, 0.03
),
(
  CURRENT_DATE - INTERVAL '2 days', 'daily_summary', 4, 3, 2, 5, 2, 78900.00, 78900.00,
  10.8, 6.9, 13.5, 99.9, 99.9, 148, 0.01
),
(
  CURRENT_DATE - INTERVAL '3 days', 'daily_summary', 4, 3, 2, 4, 3, 76500.00, 76500.00,
  9.5, 5.2, 12.1, 100.0, 100.0, 142, 0.02
),
(
  CURRENT_DATE - INTERVAL '4 days', 'daily_summary', 4, 2, 2, 4, 2, 74200.00, 74200.00,
  8.1, 4.8, 11.7, 99.7, 100.0, 155, 0.04
),
(
  CURRENT_DATE - INTERVAL '5 days', 'daily_summary', 4, 2, 2, 4, 4, 71800.00, 71800.00,
  7.9, 4.1, 10.3, 99.9, 99.8, 149, 0.02
),
(
  CURRENT_DATE - INTERVAL '6 days', 'daily_summary', 3, 2, 2, 3, 1, 69400.00, 69400.00,
  6.5, 3.7, 9.8, 100.0, 100.0, 138, 0.01
);