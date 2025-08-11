-- Function to update client statistics when vehicles are added/removed
CREATE OR REPLACE FUNCTION update_client_vehicle_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clients 
    SET active_vehicles = (
      SELECT COUNT(*) FROM vehicles 
      WHERE client_id = NEW.client_id AND status IN ('available', 'active')
    )
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update both old and new client if client_id changed
    IF OLD.client_id != NEW.client_id THEN
      UPDATE clients 
      SET active_vehicles = (
        SELECT COUNT(*) FROM vehicles 
        WHERE client_id = OLD.client_id AND status IN ('available', 'active')
      )
      WHERE id = OLD.client_id;
    END IF;
    
    UPDATE clients 
    SET active_vehicles = (
      SELECT COUNT(*) FROM vehicles 
      WHERE client_id = NEW.client_id AND status IN ('available', 'active')
    )
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clients 
    SET active_vehicles = (
      SELECT COUNT(*) FROM vehicles 
      WHERE client_id = OLD.client_id AND status IN ('available', 'active')
    )
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vehicle count updates
CREATE TRIGGER trigger_update_client_vehicle_count
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_client_vehicle_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_integration_codes_updated_at
  BEFORE UPDATE ON integration_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique integration codes
CREATE OR REPLACE FUNCTION generate_integration_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 5-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM integration_codes WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, we can use it
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create integration code when client is created
CREATE OR REPLACE FUNCTION create_client_integration_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If integration_code is not provided, generate one
  IF NEW.integration_code IS NULL OR NEW.integration_code = '' THEN
    NEW.integration_code := generate_integration_code();
  END IF;
  
  -- Insert corresponding integration code record
  INSERT INTO integration_codes (code, client_id, status, created_at)
  VALUES (NEW.integration_code, NEW.id, 'active', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic integration code creation
CREATE TRIGGER trigger_create_client_integration_code
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_client_integration_code();

-- Function to mark notification as read when read_at is updated
CREATE OR REPLACE FUNCTION update_notification_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.is_read := true;
  ELSIF NEW.read_at IS NULL AND OLD.read_at IS NOT NULL THEN
    NEW.is_read := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification read status
CREATE TRIGGER trigger_update_notification_read_status
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_status();

-- Function to get dashboard summary (can be called from API)
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalCompanies', (SELECT COUNT(*) FROM clients),
    'activeCompanies', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
    'totalUsers', (SELECT COUNT(*) FROM users),
    'totalVehicles', (SELECT COUNT(*) FROM vehicles),
    'activeVehicles', (SELECT COUNT(*) FROM vehicles WHERE status IN ('available', 'active')),
    'totalRevenue', (SELECT COALESCE(SUM(monthly_revenue), 0) FROM clients),
    'unreadNotifications', (SELECT COUNT(*) FROM notifications WHERE is_read = false),
    'lastUpdated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old logs (call periodically to maintain performance)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;