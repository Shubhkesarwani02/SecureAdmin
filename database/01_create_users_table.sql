-- Create users table for admin users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'user')),
  department VARCHAR(100) DEFAULT 'General',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  avatar TEXT,
  bio TEXT,
  permissions JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "pushNotifications": false,
    "weeklyReports": true,
    "marketingEmails": false,
    "twoFactorAuth": false,
    "sessionTimeout": "8",
    "language": "en",
    "timezone": "America/New_York",
    "theme": "light"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data and superadmins to read all
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR 
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'));

-- Create policy for superadmins to manage all users
CREATE POLICY "Superadmins can manage all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

-- Insert default superadmin user
INSERT INTO users (
  id, full_name, email, phone, role, department, status, bio, permissions
) VALUES (
  1,
  'John Anderson',
  'john@framtt.com',
  '+1 (555) 123-4567',
  'superadmin',
  'Engineering',
  'active',
  'Senior administrator managing the Framtt platform with over 5 years of experience in rental management systems.',
  '["all"]'
);

-- Insert default admin user
INSERT INTO users (
  id, full_name, email, phone, role, department, status, bio, permissions
) VALUES (
  2,
  'Sarah Johnson',
  'sarah@framtt.com',
  '+1 (555) 234-5678',
  'admin',
  'Operations',
  'active',
  'Operations manager overseeing client relationships and system operations.',
  '["users", "clients", "monitoring"]'
);

-- Update sequence to continue from inserted IDs
SELECT setval('users_id_seq', 2, true);