-- Create notifications table
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE, -- NULL means global notification
  action_required BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own notifications and global notifications
CREATE POLICY "Users can read their notifications" ON notifications
  FOR SELECT USING (
    user_id IS NULL OR user_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for superadmins to manage all notifications
CREATE POLICY "Superadmins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Create policy for users to update their own notifications
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (
    user_id IS NULL OR user_id::text = auth.uid()::text
  );

-- Insert sample notifications
INSERT INTO notifications (
  id, title, description, type, priority, is_read, user_id, action_required, created_at
) VALUES 
(
  1, 'New client registration', 'Premium Fleet Services completed KYC verification', 
  'info', 'medium', false, NULL, false, NOW() - INTERVAL '2 minutes'
),
(
  2, 'Payment processed', 'Monthly subscription payment received from Elite Car Rentals', 
  'success', 'low', false, NULL, false, NOW() - INTERVAL '1 hour'
),
(
  3, 'System maintenance scheduled', 'Database maintenance planned for tonight at 2:00 AM', 
  'warning', 'high', true, NULL, true, NOW() - INTERVAL '3 hours'
),
(
  4, 'High API usage detected', 'Swift Vehicle Solutions has exceeded 80% of their API limit', 
  'warning', 'medium', false, NULL, true, NOW() - INTERVAL '6 hours'
),
(
  5, 'New feature deployed', 'AI recommendation engine v2.0 has been successfully deployed', 
  'success', 'low', true, NULL, false, NOW() - INTERVAL '1 day'
),
(
  6, 'Profile update required', 'Please update your profile information', 
  'info', 'medium', false, 1, true, NOW() - INTERVAL '2 days'
);

-- Update sequence to continue from inserted IDs
SELECT setval('notifications_id_seq', 6, true);