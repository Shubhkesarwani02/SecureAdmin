-- Consolidated, idempotent database setup for the project
-- Safe to run multiple times (uses IF NOT EXISTS where supported).
-- NOTE: Review and adapt to your environment before executing (roles, schemas, privileges).

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequences (create if missing)
CREATE SEQUENCE IF NOT EXISTS account_health_alerts_id_seq;
CREATE SEQUENCE IF NOT EXISTS account_health_scores_id_seq;
CREATE SEQUENCE IF NOT EXISTS accounts_id_seq;
CREATE SEQUENCE IF NOT EXISTS audit_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS clients_id_seq;
CREATE SEQUENCE IF NOT EXISTS csm_assignments_id_seq;
CREATE SEQUENCE IF NOT EXISTS impersonation_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS invite_tokens_id_seq;
CREATE SEQUENCE IF NOT EXISTS notifications_id_seq;
CREATE SEQUENCE IF NOT EXISTS refresh_tokens_id_seq;
CREATE SEQUENCE IF NOT EXISTS system_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS user_accounts_id_seq;
CREATE SEQUENCE IF NOT EXISTS users_id_seq;
CREATE SEQUENCE IF NOT EXISTS vehicles_id_seq;

-- Tables (create without FK constraints first to avoid ordering issues)

CREATE TABLE IF NOT EXISTS public.accounts (
  id bigint NOT NULL DEFAULT nextval('accounts_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  status character varying DEFAULT 'active',
  company_name character varying,
  contact_email character varying,
  contact_phone character varying,
  billing_address text,
  created_by bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email character varying,
  phone character varying,
  address text,
  city character varying,
  state character varying,
  country character varying DEFAULT 'United States',
  postal_code character varying,
  website character varying,
  business_license character varying,
  tax_id character varying,
  subscription_plan character varying DEFAULT 'basic',
  subscription_status character varying DEFAULT 'trial',
  subscription_amount numeric DEFAULT 99.00,
  next_billing_date timestamp with time zone,
  integration_code character varying,
  ai_recommendation boolean DEFAULT false,
  whatsapp_integration boolean DEFAULT false,
  tracking_active boolean DEFAULT false,
  marketing_active boolean DEFAULT false,
  total_bookings integer DEFAULT 0,
  active_vehicles integer DEFAULT 0,
  monthly_revenue numeric DEFAULT 0.00,
  CONSTRAINT accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id bigint NOT NULL DEFAULT nextval('clients_id_seq'::regclass),
  company_name character varying NOT NULL,
  contact_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  address text,
  city character varying,
  state character varying,
  zip_code character varying,
  country character varying DEFAULT 'United States',
  status character varying NOT NULL DEFAULT 'active',
  subscription_plan character varying DEFAULT 'basic',
  subscription_status character varying DEFAULT 'active',
  api_key character varying UNIQUE,
  webhook_url text,
  integration_settings jsonb DEFAULT '{}'::jsonb,
  billing_info jsonb DEFAULT '{}'::jsonb,
  preferences jsonb DEFAULT '{"weeklyReports": true, "apiNotifications": true, "dataRetentionDays": 365, "emailNotifications": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone,
  integration_code character varying,
  subscription_amount numeric DEFAULT 99.00,
  next_billing_date timestamp with time zone,
  ai_recommendation boolean DEFAULT false,
  whatsapp_integration boolean DEFAULT false,
  tracking_active boolean DEFAULT false,
  marketing_active boolean DEFAULT false,
  total_bookings integer DEFAULT 0,
  active_vehicles integer DEFAULT 0,
  monthly_revenue numeric DEFAULT 0.00,
  last_login timestamp with time zone,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  role character varying NOT NULL DEFAULT 'admin',
  department character varying DEFAULT 'General',
  status character varying NOT NULL DEFAULT 'active',
  avatar text,
  bio text,
  permissions jsonb DEFAULT '[]'::jsonb,
  preferences jsonb DEFAULT '{"theme": "light", "language": "en", "timezone": "America/New_York", "twoFactorAuth": false, "weeklyReports": true, "sessionTimeout": "8", "marketingEmails": false, "pushNotifications": false, "emailNotifications": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  password_hash character varying,
  is_impersonation_active boolean DEFAULT false,
  current_impersonator_id text,
  created_by uuid,
  invited_at timestamp with time zone,
  invited_by bigint,
  signup_completed_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.account_health_alerts (
  id bigint NOT NULL DEFAULT nextval('account_health_alerts_id_seq'::regclass),
  client_id bigint NOT NULL,
  alert_type character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'active',
  message text,
  threshold_value integer,
  current_value integer,
  created_at timestamp with time zone DEFAULT now(),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  CONSTRAINT account_health_alerts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.account_health_scores (
  id bigint NOT NULL DEFAULT nextval('account_health_scores_id_seq'::regclass),
  client_id bigint NOT NULL,
  health_score integer NOT NULL,
  factors jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT account_health_scores_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.csm_assignments (
  id bigint NOT NULL DEFAULT nextval('csm_assignments_id_seq'::regclass),
  csm_id bigint NOT NULL,
  account_id bigint NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by bigint,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT csm_assignments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  metric_name character varying NOT NULL DEFAULT 'daily_summary',
  metric_value numeric,
  metric_data jsonb,
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  date date,
  metric_type text,
  total_companies integer DEFAULT 0,
  active_companies integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_vehicles integer DEFAULT 0,
  active_vehicles integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  monthly_revenue numeric DEFAULT 0,
  CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id integer NOT NULL DEFAULT nextval('impersonation_logs_id_seq'::regclass),
  impersonator_id text,
  impersonated_user_id text,
  session_id text,
  action character varying,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  is_active boolean DEFAULT true,
  end_time timestamp with time zone,
  reason text,
  impersonated_id text,
  CONSTRAINT impersonation_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.integration_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  usage_count integer DEFAULT 0,
  last_used timestamp with time zone,
  expires_at timestamp with time zone,
  status character varying DEFAULT 'active',
  CONSTRAINT integration_codes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id bigint NOT NULL DEFAULT nextval('invite_tokens_id_seq'::regclass),
  token character varying NOT NULL UNIQUE,
  email character varying NOT NULL,
  invited_by bigint NOT NULL,
  role character varying NOT NULL,
  account_id bigint,
  company_name character varying,
  full_name character varying,
  phone character varying,
  status character varying NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '48:00:00'::interval),
  used_at timestamp with time zone,
  used_by bigint,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invite_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id bigint,
  client_id bigint,
  type character varying NOT NULL,
  category character varying DEFAULT 'general',
  title character varying NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  priority character varying DEFAULT 'medium',
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id bigint NOT NULL DEFAULT nextval('refresh_tokens_id_seq'::regclass),
  user_id bigint NOT NULL,
  token_hash character varying NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id bigint NOT NULL DEFAULT nextval('system_logs_id_seq'::regclass),
  user_id bigint,
  impersonator_id bigint,
  action character varying NOT NULL,
  resource_type character varying,
  resource_id bigint,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  level character varying,
  service character varying,
  message text,
  details jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_accounts (
  id bigint NOT NULL DEFAULT nextval('user_accounts_id_seq'::regclass),
  user_id bigint NOT NULL,
  account_id bigint NOT NULL,
  role_in_account character varying DEFAULT 'member',
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id integer NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  user_id text,
  impersonator_id text,
  action character varying NOT NULL,
  resource_type character varying,
  resource_id character varying,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id bigint NOT NULL DEFAULT nextval('vehicles_id_seq'::regclass),
  client_id bigint,
  vehicle_id character varying NOT NULL,
  make character varying,
  model character varying,
  year integer,
  vin character varying,
  license_plate character varying,
  color character varying,
  vehicle_type character varying,
  fuel_type character varying,
  status character varying NOT NULL DEFAULT 'available',
  current_location jsonb,
  mileage integer DEFAULT 0,
  rental_rate_daily numeric,
  rental_rate_weekly numeric,
  rental_rate_monthly numeric,
  features jsonb DEFAULT '[]'::jsonb,
  maintenance_info jsonb DEFAULT '{}'::jsonb,
  insurance_info jsonb DEFAULT '{}'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  current_booking_id bigint,
  current_booking_start date,
  current_booking_end date,
  current_booking_customer character varying,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);

-- Add constraints (foreign keys, CHECKs) and indexes

-- CHECK constraints for enumerations
ALTER TABLE IF EXISTS public.account_health_alerts
  ADD CONSTRAINT account_health_alerts_alert_type_check CHECK (alert_type::text = ANY (ARRAY['low_score','high_risk','declining_trend','inactive','payment_overdue']::text[]));
ALTER TABLE IF EXISTS public.account_health_alerts
  ADD CONSTRAINT account_health_alerts_status_check CHECK (status::text = ANY (ARRAY['active','acknowledged','resolved']::text[]));

ALTER TABLE IF EXISTS public.account_health_scores
  ADD CONSTRAINT account_health_scores_health_check CHECK (health_score >= 0 AND health_score <= 100);

ALTER TABLE IF EXISTS public.accounts
  ADD CONSTRAINT accounts_status_check CHECK (status::text = ANY (ARRAY['active','inactive','suspended']::text[]));

ALTER TABLE IF EXISTS public.clients
  ADD CONSTRAINT clients_status_check CHECK (status::text = ANY (ARRAY['active','inactive','suspended','pending']::text[]));
ALTER TABLE IF EXISTS public.clients
  ADD CONSTRAINT clients_subscription_plan_check CHECK (subscription_plan::text = ANY (ARRAY['basic','premium','enterprise']::text[]));
ALTER TABLE IF EXISTS public.clients
  ADD CONSTRAINT clients_subscription_status_check CHECK (subscription_status::text = ANY (ARRAY['active','inactive','trial','expired']::text[]));

ALTER TABLE IF EXISTS public.invite_tokens
  ADD CONSTRAINT invite_tokens_role_check CHECK (role::text = ANY (ARRAY['superadmin','admin','csm','user']::text[]));
ALTER TABLE IF EXISTS public.invite_tokens
  ADD CONSTRAINT invite_tokens_status_check CHECK (status::text = ANY (ARRAY['pending','used','expired','cancelled']::text[]));

ALTER TABLE IF EXISTS public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (type::text = ANY (ARRAY['info','warning','error','success','alert']::text[]));
ALTER TABLE IF EXISTS public.notifications
  ADD CONSTRAINT notifications_category_check CHECK (category::text = ANY (ARRAY['general','security','billing','maintenance','system','api']::text[]));
ALTER TABLE IF EXISTS public.notifications
  ADD CONSTRAINT notifications_priority_check CHECK (priority::text = ANY (ARRAY['low','medium','high','urgent']::text[]));

ALTER TABLE IF EXISTS public.user_accounts
  ADD CONSTRAINT user_accounts_role_in_account_check CHECK (role_in_account::text = ANY (ARRAY['owner','admin','member','viewer']::text[]));

ALTER TABLE IF EXISTS public.users
  ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['superadmin','admin','csm','user']::text[]));
ALTER TABLE IF EXISTS public.users
  ADD CONSTRAINT users_status_check CHECK (status::text = ANY (ARRAY['active','inactive','pending']::text[]));

-- Foreign keys (use ALTER so order is flexible)
ALTER TABLE IF EXISTS public.accounts
  ADD CONSTRAINT accounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.account_health_alerts
  ADD CONSTRAINT account_health_alerts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.accounts(id);

ALTER TABLE IF EXISTS public.account_health_scores
  ADD CONSTRAINT account_health_scores_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.accounts(id);

ALTER TABLE IF EXISTS public.csm_assignments
  ADD CONSTRAINT csm_assignments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  ADD CONSTRAINT csm_assignments_csm_id_fkey FOREIGN KEY (csm_id) REFERENCES public.users(id),
  ADD CONSTRAINT csm_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.notifications
  ADD CONSTRAINT notifications_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.system_logs
  ADD CONSTRAINT system_logs_impersonator_id_fkey FOREIGN KEY (impersonator_id) REFERENCES public.users(id),
  ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.user_accounts
  ADD CONSTRAINT user_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  ADD CONSTRAINT user_accounts_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  ADD CONSTRAINT user_accounts_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.invite_tokens
  ADD CONSTRAINT invite_tokens_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id),
  ADD CONSTRAINT invite_tokens_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  ADD CONSTRAINT invite_tokens_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);

ALTER TABLE IF EXISTS public.csm_assignments
  ADD CONSTRAINT IF NOT EXISTS csm_assignments_fkey_accounts FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE IF EXISTS public.vehicles
  ADD CONSTRAINT vehicles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_id ON public.user_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON public.accounts(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_csm_assignments_csm_id ON public.csm_assignments(csm_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON public.notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles(client_id);

COMMIT;

-- End of consolidated schema file
