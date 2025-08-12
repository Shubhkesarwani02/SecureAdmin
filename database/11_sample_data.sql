-- Insert sample users for testing impersonation
-- Run this after the main database schema is set up

-- Insert a superadmin user
INSERT INTO users (email, password_hash, full_name, role, department, status) VALUES 
('admin@framtt.com', '$2a$12$8Z3.CvQtDv0K9kXIlZ1wOuZ4J5X4Bx0nN9XrL8o6Q1W2P3K4J5X6Y7', 'Super Admin', 'superadmin', 'Management', 'active');

-- Insert an admin user
INSERT INTO users (email, password_hash, full_name, role, department, status) VALUES 
('admin.user@framtt.com', '$2a$12$8Z3.CvQtDv0K9kXIlZ1wOuZ4J5X4Bx0nN9XrL8o6Q1W2P3K4J5X6Y7', 'Admin User', 'admin', 'Administration', 'active');

-- Insert a CSM user
INSERT INTO users (email, password_hash, full_name, role, department, status) VALUES 
('csm@framtt.com', '$2a$12$8Z3.CvQtDv0K9kXIlZ1wOuZ4J5X4Bx0nN9XrL8o6Q1W2P3K4J5X6Y7', 'Customer Success Manager', 'csm', 'Customer Success', 'active');

-- Insert a regular user
INSERT INTO users (email, password_hash, full_name, role, department, status) VALUES 
('user@framtt.com', '$2a$12$8Z3.CvQtDv0K9kXIlZ1wOuZ4J5X4Bx0nN9XrL8o6Q1W2P3K4J5X6Y7', 'Regular User', 'user', 'Operations', 'active');

-- Insert a sample account
INSERT INTO accounts (name, company_name, email, integration_code, subscription_plan, created_by) VALUES 
('Test Company', 'Test Company Inc.', 'test@company.com', 'TEST001', 'premium', (SELECT id FROM users WHERE email = 'admin@framtt.com'));

-- Assign CSM to the account
INSERT INTO csm_assignments (csm_id, account_id, assigned_by, is_primary) VALUES 
((SELECT id FROM users WHERE email = 'csm@framtt.com'), 
 (SELECT id FROM accounts WHERE integration_code = 'TEST001'),
 (SELECT id FROM users WHERE email = 'admin@framtt.com'),
 true);

-- Assign regular user to the account
INSERT INTO user_accounts (user_id, account_id, role_in_account, assigned_by) VALUES 
((SELECT id FROM users WHERE email = 'user@framtt.com'),
 (SELECT id FROM accounts WHERE integration_code = 'TEST001'),
 'member',
 (SELECT id FROM users WHERE email = 'admin@framtt.com'));

-- Note: Password for all users is 'admin123' (hashed with bcrypt)
-- To generate new password hashes, use:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('admin123', 12));
