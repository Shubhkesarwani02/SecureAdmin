# 🔧 Backend Development Tools

This directory contains utility tools and scripts for backend development, testing, and maintenance.

## 📁 Available Tools

### 🔑 Security & Authentication Tools

#### `generate-password.js`
Generates secure passwords for user accounts and API keys.

**Usage:**
```bash
node tools/generate-password.js [options]
```

**Features:**
- Cryptographically secure random password generation
- Configurable length and character sets
- Hash generation for database storage

#### `jwt-rotate.js`
JWT token rotation and management utility.

**Usage:**
```bash
node tools/jwt-rotate.js [action] [options]
```

**Features:**
- Rotate JWT secrets
- Invalidate existing tokens
- Generate new signing keys

#### `verify-auth.js`
Authentication system verification and testing tool.

**Usage:**
```bash
node tools/verify-auth.js [test-type]
```

**Features:**
- Test authentication endpoints
- Verify JWT token validation
- Check role-based access control

#### `verify-security.js`
Comprehensive security verification tool.

**Usage:**
```bash
node tools/verify-security.js [security-check]
```

**Features:**
- Security middleware testing
- Rate limiting verification
- Input validation checks
- CORS configuration testing

### 🔍 Audit & Monitoring Tools

#### `security-audit.js`
Security audit and vulnerability scanning tool.

**Usage:**
```bash
node tools/security-audit.js [scan-type]
```

**Features:**
- Dependency vulnerability scanning
- Code security analysis
- Configuration security checks
- Generate security reports

## 🚀 Quick Start

### Run All Security Checks
```bash
# Verify authentication system
node tools/verify-auth.js

# Run security audit
node tools/security-audit.js

# Verify security configuration
node tools/verify-security.js
```

### Generate Secure Credentials
```bash
# Generate a new password
node tools/generate-password.js --length 32

# Rotate JWT secrets
node tools/jwt-rotate.js rotate --backup
```

## 📋 Tool Configuration

### Environment Variables
```bash
# Required for most tools
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
NODE_ENV=development
```

### Tool-Specific Configs
Each tool may have its own configuration file in the `config/` directory or accept command-line arguments.

## 🔒 Security Considerations

- **Never commit generated secrets** to version control
- **Run security audits regularly** in CI/CD pipelines
- **Backup existing configurations** before rotating secrets
- **Test in development environment** before production deployment

## 📖 Additional Documentation

- **Security Checklist**: [../docs/SECURITY_CHECKLIST.md](../docs/SECURITY_CHECKLIST.md)
- **Security Configuration**: [../docs/SECURITY_CONFIGURATION.md](../docs/SECURITY_CONFIGURATION.md)
- **Backend Documentation**: [../docs/README_ENHANCED.md](../docs/README_ENHANCED.md)

---

*For additional help with any tool, run: `node tools/[tool-name].js --help`*
