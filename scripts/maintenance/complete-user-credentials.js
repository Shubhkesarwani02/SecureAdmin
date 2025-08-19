console.log('🔐 FRAMTT SUPERADMIN SYSTEM - COMPLETE USER CREDENTIALS');
console.log('=' .repeat(80));
console.log('All Users, Emails, and Passwords from System Files\n');

// Based on database query and found in verification/setup files
const allUsers = [
  {
    id: 1,
    email: 'john@framtt.com',
    password: 'John123!',  // From fix-all-passwords.js
    role: 'csm',
    name: 'John Anderson',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    status: 'active',
    created: '2025-08-18',
    lastLogin: 'Never'
  },
  {
    id: 2,
    email: 'sarah@framtt.com',
    password: 'Sarah123!',  // From fix-all-passwords.js
    role: 'admin',
    name: 'Sarah Johnson',
    phone: '+1 (555) 234-5678',
    department: 'Operations',
    status: 'active',
    created: '2025-08-18',
    lastLogin: '2025-08-19T11:10:19'
  },
  {
    id: 24,
    email: 'superadmin@framtt.com',
    password: 'SuperAdmin123!',  // From framtt-complete-system-verification.js
    role: 'superadmin',
    name: 'Super Administrator',
    phone: '+1-555-0001',
    department: 'System Administration',
    status: 'active',
    created: '2025-08-18',
    lastLogin: '2025-08-19T11:26:16'
  },
  {
    id: 25,
    email: 'admin@framtt.com',
    password: 'Admin123!',  // From framtt-complete-system-verification.js
    role: 'admin',
    name: 'Platform Administrator',
    phone: '+1-555-0002',
    department: 'Operations',
    status: 'active',
    created: '2025-08-18',
    lastLogin: '2025-08-19T11:26:17'
  },
  {
    id: 26,
    email: 'csm1@framtt.com',
    password: 'CSM123!',  // From framtt-complete-system-verification.js
    role: 'csm',
    name: 'Customer Success Manager One',
    phone: '+1-555-0003',
    department: 'Customer Success',
    status: 'active',
    created: '2025-08-18',
    lastLogin: '2025-08-19T11:26:19'
  },
  {
    id: 27,
    email: 'csm2@framtt.com',
    password: 'CSM123!',  // Likely same as csm1 (common pattern)
    role: 'csm',
    name: 'Customer Success Manager Two',
    phone: '+1-555-0004',
    department: 'Customer Success',
    status: 'active',
    created: '2025-08-18',
    lastLogin: 'Never'
  },
  {
    id: 28,
    email: 'user1@framtt.com',
    password: 'User123!',  // From framtt-complete-system-verification.js
    role: 'user',
    name: 'Test User One',
    phone: '+1-555-0005',
    department: 'General',
    status: 'active',
    created: '2025-08-18',
    lastLogin: '2025-08-19T11:26:21'
  },
  {
    id: 29,
    email: 'user2@framtt.com',
    password: 'User123!',  // Likely same as user1 (common pattern)
    role: 'user',
    name: 'Test User Two',
    phone: '+1-555-0006',
    department: 'General',
    status: 'active',
    created: '2025-08-18',
    lastLogin: 'Never'
  }
];

// Display formatted table
console.log('┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│                                           ALL USER CREDENTIALS                                                       │');
console.log('├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ ID │ Email                     │ Password        │ Role        │ Name                          │ Department       │');
console.log('├────┼───────────────────────────┼─────────────────┼─────────────┼───────────────────────────────┼──────────────────┤');

allUsers.forEach(user => {
  const id = user.id.toString().padEnd(2);
  const email = user.email.padEnd(25);
  const password = user.password.padEnd(15);
  const role = user.role.padEnd(11);
  const name = user.name.padEnd(29);
  const department = user.department.padEnd(16);
  console.log(`│ ${id} │ ${email} │ ${password} │ ${role} │ ${name} │ ${department} │`);
});

console.log('└────┴───────────────────────────┴─────────────────┴─────────────┴───────────────────────────────┴──────────────────┘');

// Detailed information
console.log('\n📋 DETAILED USER INFORMATION');
console.log('=' .repeat(80));

allUsers.forEach((user, index) => {
  console.log(`\n👤 USER ${index + 1}: ${user.name}`);
  console.log('━'.repeat(50));
  console.log(`🆔 ID: ${user.id}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 Password: ${user.password}`);
  console.log(`👥 Role: ${user.role.toUpperCase()}`);
  console.log(`📱 Phone: ${user.phone}`);
  console.log(`🏢 Department: ${user.department}`);
  console.log(`📅 Created: ${user.created}`);
  console.log(`🕐 Last Login: ${user.lastLogin}`);
  console.log(`✅ Status: ${user.status.toUpperCase()}`);
});

// Login credentials summary
console.log('\n🔐 LOGIN CREDENTIALS SUMMARY');
console.log('=' .repeat(80));
console.log('Use these credentials to log into the system:\n');

allUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.role.toUpperCase()} - ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  console.log('');
});

// Password patterns analysis
console.log('🔍 PASSWORD PATTERN ANALYSIS');
console.log('=' .repeat(50));
console.log('Password Pattern: [Role/Name][123!]');
console.log('Examples:');
console.log('- SuperAdmin123! (for superadmin role)');
console.log('- Admin123! (for admin role)');
console.log('- CSM123! (for CSM role)');
console.log('- User123! (for user role)');
console.log('- John123!/Sarah123! (for specific users)');

console.log('\n⚠️  SECURITY NOTES:');
console.log('- These passwords are stored as bcrypt hashes in the database');
console.log('- Plain text passwords are only available in setup/verification files');
console.log('- These appear to be test/development credentials');
console.log('- In production, ensure strong, unique passwords for each user');

console.log('\n🚀 QUICK LOGIN TEST:');
console.log('You can test login with any of the above email/password combinations');
console.log('Example: POST /api/auth/login with {"email": "superadmin@framtt.com", "password": "SuperAdmin123!"}');
