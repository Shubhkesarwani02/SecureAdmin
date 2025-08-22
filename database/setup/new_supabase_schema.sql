-- ==========================================================
-- Framtt Superadmin - Supabase schema for verification script
-- Creates all required tables, constraints, indexes and helpers
-- Run in Supabase SQL editor on a fresh project
-- ==========================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================
-- Core auth/users domain
-- ======================

-- Users (backend uses this table, separate from auth.users)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'csm', 'user')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending','suspended','deleted')),
  full_name VARCHAR(255),
  department VARCHAR(100),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Accounts
DROP TABLE IF EXISTS accounts CASCADE;
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CSM assignments (CSM → accounts)
DROP TABLE IF EXISTS csm_assignments CASCADE;
CREATE TABLE csm_assignments (
  csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (csm_id, account_id)
);
CREATE INDEX IF NOT EXISTS idx_csm_assignments_csm_id ON csm_assignments(csm_id);
CREATE INDEX IF NOT EXISTS idx_csm_assignments_account_id ON csm_assignments(account_id);

-- User-to-Account assignments (end users → accounts)
DROP TABLE IF EXISTS user_accounts CASCADE;
CREATE TABLE user_accounts (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, account_id)
);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON user_accounts(account_id);

-- Impersonation logs
DROP TABLE IF EXISTS impersonation_logs CASCADE;
CREATE TABLE impersonation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  impersonator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  impersonated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NULL,
  reason TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_impersonator_id ON impersonation_logs(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_impersonated_id ON impersonation_logs(impersonated_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_start_time ON impersonation_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_end_time ON impersonation_logs(end_time);

-- Refresh tokens (server-side persisted, hash only)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(256) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- =======================
-- Ops / auditing / metrics
-- =======================

-- Audit logs (verification expects this exact name)
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  session_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- System logs (used by admin ops)
DROP TABLE IF EXISTS system_logs CASCADE;
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('debug','info','warning','error','critical')),
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Dashboard metrics (verification queries this table exists)
DROP TABLE IF EXISTS dashboard_metrics CASCADE;
CREATE TABLE dashboard_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('count','revenue','percentage','average','sum')),
  dimension_1 VARCHAR(100),
  dimension_2 VARCHAR(100),
  time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('daily','weekly','monthly','quarterly','yearly')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, time_period, period_start, dimension_1, dimension_2)
);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name_period ON dashboard_metrics(metric_name, time_period);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_period_start ON dashboard_metrics(period_start);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_created_at ON dashboard_metrics(created_at);
CREATE TRIGGER trg_dashboard_metrics_updated_at BEFORE UPDATE ON dashboard_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================
-- Business domain (clients/vehicles)
-- =================================

-- Clients (kept for vehicles + health refs; backend verification also uses accounts)
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending','cancelled','suspended')),
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic','premium','enterprise')),
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','cancelled','trial','past_due','inactive')),
  monthly_revenue DECIMAL(12,2) DEFAULT 0.00,
  total_bookings INTEGER DEFAULT 0,
  fleet_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_plan ON clients(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vehicles (FK to clients)
DROP TABLE IF EXISTS vehicles CASCADE;
CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  license_plate VARCHAR(20) UNIQUE,
  vin VARCHAR(50) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available','rented','maintenance','inactive','retired','active')),
  category VARCHAR(50) DEFAULT 'sedan',
  daily_rate DECIMAL(8,2) DEFAULT 50.00,
  location VARCHAR(255),
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications (minimal columns the app uses)
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Integration codes
DROP TABLE IF EXISTS integration_codes CASCADE;
CREATE TABLE integration_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integration_codes_code ON integration_codes(code);
CREATE INDEX IF NOT EXISTS idx_integration_codes_client_id ON integration_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_integration_codes_is_active ON integration_codes(is_active);
CREATE TRIGGER trg_integration_codes_updated_at BEFORE UPDATE ON integration_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================
-- Account health (verification)
-- ==========================

DROP TABLE IF EXISTS account_health_scores CASCADE;
CREATE TABLE account_health_scores (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  health_score NUMERIC(5,2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_health_scores_client_id ON account_health_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_account_health_scores_last_updated ON account_health_scores(last_updated);

DROP TABLE IF EXISTS account_health_alerts CASCADE;
CREATE TABLE account_health_alerts (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_account_health_alerts_client_id ON account_health_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_account_health_alerts_status ON account_health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_account_health_alerts_created_at ON account_health_alerts(created_at);

-- =====================================
-- Optional: enable RLS (service role bypasses)
-- =====================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE csm_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE integration_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE account_health_scores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE account_health_alerts ENABLE ROW LEVEL SECURITY;

-- =================
-- Completion notice
-- =================
DO $$
BEGIN
  RAISE NOTICE 'Framtt Superadmin: schema created (users, accounts, csm_assignments, user_accounts, impersonation_logs, refresh_tokens, audit_logs, clients, vehicles, notifications, integration_codes, system_logs, dashboard_metrics, account_health_scores, account_health_alerts).';
END $$;


