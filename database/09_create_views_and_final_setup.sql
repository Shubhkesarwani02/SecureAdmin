-- Create a comprehensive view for client dashboard
CREATE OR REPLACE VIEW client_dashboard_view AS
SELECT 
  c.id,
  c.company_name,
  c.email,
  c.phone,
  c.address,
  c.status,
  c.integration_code,
  c.subscription_plan,
  c.subscription_status,
  c.subscription_amount,
  c.next_billing_date,
  c.ai_recommendation,
  c.whatsapp_integration,
  c.tracking_active,
  c.marketing_active,
  c.total_bookings,
  c.active_vehicles,
  c.monthly_revenue,
  c.created_at,
  c.updated_at,
  c.last_login,
  
  -- Integration tags as array
  ARRAY_REMOVE(ARRAY[
    CASE WHEN c.ai_recommendation THEN 'AI Recommendation' END,
    CASE WHEN c.whatsapp_integration THEN 'Connected via WhatsApp' END,
    CASE WHEN c.tracking_active THEN 'Tracking Active' END,
    CASE WHEN c.marketing_active THEN 'Marketing Active' END
  ], NULL) as integration_tags,
  
  -- Vehicle statistics
  (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = c.id) as total_vehicles,
  (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = c.id AND v.status = 'available') as available_vehicles,
  (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = c.id AND v.status = 'active') as rented_vehicles,
  (SELECT COUNT(*) FROM vehicles v WHERE v.client_id = c.id AND v.status = 'maintenance') as maintenance_vehicles,
  
  -- Integration code info
  ic.usage_count as integration_usage_count,
  ic.last_used as integration_last_used,
  ic.status as integration_status
  
FROM clients c
LEFT JOIN integration_codes ic ON c.id = ic.client_id;

-- Create view for vehicle dashboard with client information
CREATE OR REPLACE VIEW vehicle_dashboard_view AS
SELECT 
  v.*,
  c.company_name as client_name,
  c.email as client_email,
  c.status as client_status,
  
  -- Current booking info
  CASE 
    WHEN v.current_booking_id IS NOT NULL THEN 
      json_build_object(
        'id', v.current_booking_id,
        'startDate', v.current_booking_start,
        'endDate', v.current_booking_end,
        'customer', v.current_booking_customer
      )
    ELSE NULL
  END as current_booking_info
  
FROM vehicles v
JOIN clients c ON v.client_id = c.id;

-- Create view for system health monitoring
CREATE OR REPLACE VIEW system_health_view AS
SELECT 
  'operational' as overall_status,
  
  -- API Health
  (SELECT COUNT(*) FROM system_logs 
   WHERE service = 'api' AND level = 'error' 
   AND created_at > NOW() - INTERVAL '1 hour') as api_errors_last_hour,
  
  -- Database Health  
  (SELECT COUNT(*) FROM system_logs 
   WHERE service = 'database' AND level = 'error' 
   AND created_at > NOW() - INTERVAL '1 hour') as db_errors_last_hour,
   
  -- Recent activity
  (SELECT COUNT(*) FROM system_logs 
   WHERE created_at > NOW() - INTERVAL '5 minutes') as activity_last_5_min,
   
  -- User activity
  (SELECT COUNT(DISTINCT user_id) FROM system_logs 
   WHERE user_id IS NOT NULL 
   AND created_at > NOW() - INTERVAL '1 hour') as active_users_last_hour,
   
  NOW() as last_checked;

-- Create indexes on views for better performance
CREATE INDEX idx_client_dashboard_view_status ON clients(status);
CREATE INDEX idx_client_dashboard_view_plan ON clients(subscription_plan);

-- Grant permissions for API access
GRANT SELECT ON client_dashboard_view TO authenticated;
GRANT SELECT ON vehicle_dashboard_view TO authenticated;
GRANT SELECT ON system_health_view TO authenticated;

-- Create a function to refresh dashboard data (for real-time updates)
CREATE OR REPLACE FUNCTION refresh_dashboard_data()
RETURNS JSON AS $$
DECLARE
  dashboard_data JSON;
BEGIN
  SELECT json_build_object(
    'summary', (SELECT get_dashboard_summary()),
    'systemHealth', (SELECT row_to_json(system_health_view) FROM system_health_view LIMIT 1),
    'recentActivity', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'level', level,
          'service', service,
          'message', message,
          'created_at', created_at
        )
      ) FROM (
        SELECT * FROM system_logs 
        ORDER BY created_at DESC 
        LIMIT 10
      ) recent_logs
    ),
    'topClients', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'name', company_name,
          'revenue', monthly_revenue,
          'bookings', total_bookings,
          'vehicles', active_vehicles
        )
      ) FROM (
        SELECT * FROM clients 
        WHERE status = 'active' 
        ORDER BY monthly_revenue DESC 
        LIMIT 5
      ) top_clients
    )
  ) INTO dashboard_data;
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple function to log API calls (for monitoring)
CREATE OR REPLACE FUNCTION log_api_call(
  p_service TEXT,
  p_endpoint TEXT,
  p_method TEXT,
  p_user_id BIGINT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_response_time INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO system_logs (level, service, message, details, user_id, ip_address)
  VALUES (
    'info',
    p_service,
    'API call logged',
    json_build_object(
      'endpoint', p_endpoint,
      'method', p_method,
      'responseTime', p_response_time
    ),
    p_user_id,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial dashboard metrics for today
INSERT INTO dashboard_metrics (
  date, metric_type, total_companies, active_companies, total_users, 
  total_vehicles, active_vehicles, total_revenue, monthly_revenue
)
SELECT 
  CURRENT_DATE,
  'daily_summary',
  (SELECT COUNT(*) FROM clients),
  (SELECT COUNT(*) FROM clients WHERE status = 'active'),
  (SELECT COUNT(*) FROM users),
  (SELECT COUNT(*) FROM vehicles),
  (SELECT COUNT(*) FROM vehicles WHERE status IN ('available', 'active')),
  (SELECT COALESCE(SUM(monthly_revenue), 0) FROM clients),
  (SELECT COALESCE(SUM(monthly_revenue), 0) FROM clients WHERE status = 'active')
ON CONFLICT (date, metric_type) DO UPDATE SET
  total_companies = EXCLUDED.total_companies,
  active_companies = EXCLUDED.active_companies,
  total_users = EXCLUDED.total_users,
  total_vehicles = EXCLUDED.total_vehicles,
  active_vehicles = EXCLUDED.active_vehicles,
  total_revenue = EXCLUDED.total_revenue,
  monthly_revenue = EXCLUDED.monthly_revenue;

-- Final setup: Create a summary report
SELECT 
  'Database Setup Complete!' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM notifications) as total_notifications,
  (SELECT COUNT(*) FROM integration_codes) as total_integration_codes;

-- Show sample data verification
SELECT 'Sample Data Verification:' as info;
SELECT 'Users:', full_name, email, role FROM users;
SELECT 'Clients:', company_name, status, subscription_plan, integration_code FROM clients;
SELECT 'Vehicles:', make, model, status, license_plate FROM vehicles LIMIT 3;