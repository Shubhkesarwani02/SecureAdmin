-- Create billing and transactions tables for payment tracking
BEGIN;

-- Transactions table for all payment records
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method VARCHAR(50),
  plan_type VARCHAR(50),
  billing_period VARCHAR(20), -- monthly, yearly, etc
  description TEXT,
  stripe_payment_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  refund_amount NUMERIC(10, 2),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription renewals tracking
CREATE TABLE IF NOT EXISTS public.subscription_renewals (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  renewal_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'confirmed', 'at_risk', 'cancelled', 'completed')),
  auto_renewal BOOLEAN DEFAULT true,
  last_payment_id BIGINT REFERENCES transactions(id),
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed payments tracking
CREATE TABLE IF NOT EXISTS public.failed_payments (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT REFERENCES transactions(id) ON DELETE CASCADE,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  reason TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_renewals_client_id ON subscription_renewals(client_id);
CREATE INDEX IF NOT EXISTS idx_renewals_renewal_date ON subscription_renewals(renewal_date);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON subscription_renewals(status);

CREATE INDEX IF NOT EXISTS idx_failed_payments_client_id ON failed_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_failed_payments_resolved ON failed_payments(resolved);
CREATE INDEX IF NOT EXISTS idx_failed_payments_next_attempt ON failed_payments(next_attempt_at);

-- Insert sample transaction data
INSERT INTO transactions (
  transaction_id, client_id, amount, currency, status, payment_method, 
  plan_type, billing_period, paid_at, created_at
) VALUES 
  ('txn_' || gen_random_uuid(), 1, 299.00, 'USD', 'completed', 'Credit Card', 'Professional', 'monthly', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('txn_' || gen_random_uuid(), 2, 599.00, 'USD', 'completed', 'Bank Transfer', 'Enterprise', 'monthly', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
  ('txn_' || gen_random_uuid(), 3, 99.00, 'USD', 'failed', 'Credit Card', 'Basic', 'monthly', NULL, NOW() - INTERVAL '1 day'),
  ('txn_' || gen_random_uuid(), 4, 599.00, 'USD', 'pending', 'Credit Card', 'Enterprise', 'monthly', NULL, NOW() - INTERVAL '3 hours'),
  ('txn_' || gen_random_uuid(), 5, 299.00, 'USD', 'completed', 'PayPal', 'Professional', 'monthly', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('txn_' || gen_random_uuid(), 1, 299.00, 'USD', 'completed', 'Credit Card', 'Professional', 'monthly', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
  ('txn_' || gen_random_uuid(), 2, 599.00, 'USD', 'completed', 'Bank Transfer', 'Enterprise', 'monthly', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
  ('txn_' || gen_random_uuid(), 1, 299.00, 'USD', 'completed', 'Credit Card', 'Professional', 'monthly', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
  ('txn_' || gen_random_uuid(), 2, 599.00, 'USD', 'completed', 'Bank Transfer', 'Enterprise', 'monthly', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months')
ON CONFLICT DO NOTHING;

-- Insert sample renewal data
INSERT INTO subscription_renewals (
  client_id, plan_type, amount, currency, renewal_date, status, auto_renewal
) VALUES 
  (1, 'Professional', 299.00, 'USD', NOW() + INTERVAL '8 days', 'upcoming', true),
  (2, 'Enterprise', 599.00, 'USD', NOW() + INTERVAL '11 days', 'upcoming', true),
  (3, 'Basic', 99.00, 'USD', NOW() + INTERVAL '13 days', 'at_risk', true),
  (4, 'Enterprise', 599.00, 'USD', NOW() + INTERVAL '15 days', 'upcoming', true),
  (5, 'Professional', 299.00, 'USD', NOW() + INTERVAL '20 days', 'upcoming', false)
ON CONFLICT DO NOTHING;

-- Insert sample failed payments
INSERT INTO failed_payments (
  client_id, amount, currency, reason, attempt_count, 
  last_attempt_at, next_attempt_at, resolved
) VALUES 
  (3, 99.00, 'USD', 'Insufficient funds', 2, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '3 days', false),
  (4, 299.00, 'USD', 'Card expired', 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', false)
ON CONFLICT DO NOTHING;

COMMIT;
