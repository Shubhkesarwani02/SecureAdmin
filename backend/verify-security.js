const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n🔐 Enhanced Security Implementation Verification\n');

// Check if required security files exist
const securityFiles = [
  'middleware/rateLimiting.js',
  'middleware/security.js',
  'SECURITY_CONFIGURATION.md'
];

console.log('📁 Checking security files:');
securityFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file} - EXISTS`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
  }
});

// Check environment configuration
console.log('\n🔧 Checking environment configuration:');

const requiredEnvVars = [
  'JWT_SECRET',
  'BCRYPT_ROUNDS',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const recommendedEnvVars = [
  'JWT_PREVIOUS_SECRET',
  'JWT_SECRET_ROTATION_DAYS',
  'ALLOWED_ORIGINS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✓ ${envVar} - SET`);
  } else {
    console.log(`   ✗ ${envVar} - MISSING (REQUIRED)`);
  }
});

recommendedEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✓ ${envVar} - SET`);
  } else {
    console.log(`   ⚠ ${envVar} - NOT SET (RECOMMENDED)`);
  }
});

// Check JWT secret strength
console.log('\n🔑 Checking JWT secret security:');
if (process.env.JWT_SECRET) {
  const secret = process.env.JWT_SECRET;
  const secretBuffer = Buffer.from(secret, 'utf8');
  const entropyBits = secretBuffer.length * 8;
  
  if (entropyBits >= 256) {
    console.log(`   ✓ JWT Secret length: ${entropyBits} bits (Strong)`);
  } else if (entropyBits >= 128) {
    console.log(`   ⚠ JWT Secret length: ${entropyBits} bits (Acceptable, but consider 256+ bits)`);
  } else {
    console.log(`   ✗ JWT Secret length: ${entropyBits} bits (WEAK - Use 256+ bits)`);
  }
  
  // Check for common weak secrets
  const weakSecrets = [
    'your-secret-key',
    'secret',
    'jwt-secret',
    'fallback-secret-key',
    'default-secret'
  ];
  
  if (weakSecrets.some(weak => secret.toLowerCase().includes(weak.toLowerCase()))) {
    console.log(`   ✗ JWT Secret contains common patterns (CHANGE IMMEDIATELY)`);
  } else {
    console.log(`   ✓ JWT Secret does not contain common patterns`);
  }
} else {
  console.log('   ✗ JWT_SECRET not set');
}

// Check security implementation
console.log('\n🛡️ Checking security implementation:');

const securityChecks = [
  {
    name: 'Rate Limiting Middleware',
    check: () => {
      try {
        const rateLimiting = require('./middleware/rateLimiting');
        return rateLimiting.authLimiter && rateLimiting.impersonationLimiter;
      } catch (e) { return false; }
    }
  },
  {
    name: 'Enhanced Security Middleware',
    check: () => {
      try {
        const security = require('./middleware/security');
        return security.JWTSecretManager && security.ImpersonationTokenManager;
      } catch (e) { return false; }
    }
  },
  {
    name: 'JWT Secret Rotation Support',
    check: () => {
      try {
        const { jwtSecretManager } = require('./middleware/security');
        return typeof jwtSecretManager.shouldRotateSecret === 'function';
      } catch (e) { return false; }
    }
  },
  {
    name: 'Token Blacklisting',
    check: () => {
      try {
        const { TokenBlacklist } = require('./middleware/security');
        return typeof TokenBlacklist === 'function';
      } catch (e) { return false; }
    }
  },
  {
    name: 'Enhanced Password Validation',
    check: () => {
      try {
        const authController = fs.readFileSync(path.join(__dirname, 'controllers/authController.js'), 'utf8');
        return authController.includes('calculatePasswordStrength') && 
               authController.includes('hasNoCommonPatterns');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Audit Logging for Security Events',
    check: () => {
      try {
        const authMiddleware = fs.readFileSync(path.join(__dirname, 'middleware/auth.js'), 'utf8');
        return authMiddleware.includes('TOKEN_VERIFICATION_FAILED');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Impersonation Token Validation',
    check: () => {
      try {
        const impersonationController = fs.readFileSync(path.join(__dirname, 'controllers/impersonationController.js'), 'utf8');
        return impersonationController.includes('expiresIn: \'2h\'') ||
               impersonationController.includes('expiresIn: \'1h\'');
      } catch (e) { return false; }
    }
  },
  {
    name: 'CORS Security Configuration',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('allowedOrigins') && server.includes('maxAge');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Security Headers Implementation',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('securityHeaders') && server.includes('contentSecurityPolicy');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Input Sanitization',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('sanitizeInput');
      } catch (e) { return false; }
    }
  }
];

securityChecks.forEach(check => {
  if (check.check()) {
    console.log(`   ✓ ${check.name}`);
  } else {
    console.log(`   ✗ ${check.name} - NOT IMPLEMENTED`);
  }
});

// Check bcrypt configuration
console.log('\n🔒 Checking password security:');
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
if (bcryptRounds >= 12) {
  console.log(`   ✓ bcrypt rounds: ${bcryptRounds} (Strong)`);
} else if (bcryptRounds >= 10) {
  console.log(`   ⚠ bcrypt rounds: ${bcryptRounds} (Acceptable, but consider 12+)`);
} else {
  console.log(`   ✗ bcrypt rounds: ${bcryptRounds} (WEAK - Use 12+)`);
}

// Check impersonation security
console.log('\n🎭 Checking impersonation security:');

const impersonationChecks = [
  {
    name: 'Limited Token Lifetime',
    check: () => {
      try {
        const impController = fs.readFileSync(path.join(__dirname, 'controllers/impersonationController.js'), 'utf8');
        return impController.includes('1h') || impController.includes('2h');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Role Hierarchy Enforcement',
    check: () => {
      try {
        const impController = fs.readFileSync(path.join(__dirname, 'controllers/impersonationController.js'), 'utf8');
        return impController.includes('admin\' && targetUser.role === \'superadmin');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Self-Impersonation Prevention',
    check: () => {
      try {
        const impController = fs.readFileSync(path.join(__dirname, 'controllers/impersonationController.js'), 'utf8');
        return impController.includes('Cannot impersonate yourself');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Audit Logging for Impersonation',
    check: () => {
      try {
        const impController = fs.readFileSync(path.join(__dirname, 'controllers/impersonationController.js'), 'utf8');
        return impController.includes('createImpersonationLog') || 
               impController.includes('endImpersonationSession');
      } catch (e) { return false; }
    }
  }
];

impersonationChecks.forEach(check => {
  if (check.check()) {
    console.log(`   ✓ ${check.name}`);
  } else {
    console.log(`   ✗ ${check.name} - NOT IMPLEMENTED`);
  }
});

// Rate limiting verification
console.log('\n⏱️ Checking rate limiting configuration:');

const rateLimitChecks = [
  {
    name: 'Authentication Rate Limiting',
    endpoint: '/api/auth/login',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('authLimiter');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Impersonation Rate Limiting',
    endpoint: '/api/impersonate',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('impersonationLimiter');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Password Change Rate Limiting',
    endpoint: '/api/auth/change-password',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('passwordChangeLimiter');
      } catch (e) { return false; }
    }
  },
  {
    name: 'Admin Operations Rate Limiting',
    endpoint: '/api/admin',
    check: () => {
      try {
        const server = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        return server.includes('adminOperationsLimiter');
      } catch (e) { return false; }
    }
  }
];

rateLimitChecks.forEach(check => {
  if (check.check()) {
    console.log(`   ✓ ${check.name} (${check.endpoint})`);
  } else {
    console.log(`   ✗ ${check.name} (${check.endpoint}) - NOT IMPLEMENTED`);
  }
});

console.log('\n🎉 Enhanced Security Verification Complete!\n');

// Security recommendations
console.log('📋 Security Recommendations:');

const recommendations = [
  'Rotate JWT secrets every 30 days',
  'Monitor audit logs for suspicious activity',
  'Implement IP whitelisting for admin operations',
  'Set up automated security alerts',
  'Regularly update dependencies',
  'Use HTTPS in production',
  'Implement database connection encryption',
  'Set up automated backups with encryption',
  'Monitor impersonation patterns',
  'Implement 2FA for admin accounts'
];

recommendations.forEach((rec, index) => {
  console.log(`   ${index + 1}. ${rec}`);
});

console.log('\n🔐 Production Security Checklist:');
console.log('   □ Strong JWT secrets configured');
console.log('   □ HTTPS enabled with valid certificates');
console.log('   □ Database connections encrypted');
console.log('   □ Rate limiting configured and tested');
console.log('   □ Audit logging enabled and monitored');
console.log('   □ Security headers implemented');
console.log('   □ Input validation and sanitization active');
console.log('   □ Token blacklisting implemented');
console.log('   □ Impersonation tokens have limited lifetime');
console.log('   □ Role-based access control enforced');
console.log('   □ Security monitoring and alerting configured');

console.log('\n✅ Security implementation verification completed!');
console.log('📖 See SECURITY_CONFIGURATION.md for detailed setup instructions.\n');
