# Framtt Superadmin Backend

A comprehensive backend system for Framtt's superadmin dashboard with role hierarchy, impersonation, and controlled data access.

## Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Superadmin, Admin, CSM, User)
- **Secure password hashing** with bcrypt
- **Session management** with httpOnly cookies
- **Token refresh mechanism**

### 👤 User Management
- **Hierarchical role system** with proper access controls
- **User CRUD operations** with role-based restrictions
- **Profile management** for self-service updates
- **Password change functionality**

### 🎭 Impersonation System
- **Secure impersonation** for admins and superadmins
- **Session tracking** with detailed audit logs
- **Permission checks** based on role hierarchy
- **Automatic session timeout**

### 🏢 Account Management
- **Customer account management** with CSM assignments
- **Role-based account access** (CSM can only see assigned accounts)
- **Account creation and updates** by admins
- **Integration code management**

### 📋 Audit & Logging
- **Comprehensive audit trail** for all actions
- **Impersonation session logging**
- **API access logging**
- **Exportable audit reports**

### 🔒 Security Features
- **Rate limiting** on sensitive operations
- **CORS protection**
- **Helmet security headers**
- **Input validation and sanitization**
- **SQL injection prevention**

## Role Hierarchy & Permissions

| Role | Description | Access Scope | Permissions |
|------|-------------|--------------|-------------|
| **Superadmin** | Full system control | All data and users | All operations, impersonate anyone |
| **Admin** | Manage customer accounts | All customer accounts | Manage CSMs/users, impersonate CSMs/users |
| **CSM** | Customer Success Manager | Assigned accounts only | View/manage assigned accounts |
| **User** | Regular platform user | Own data only | Normal usage, no admin features |

## API Endpoints

### Authentication
```
POST   /api/auth/login                 # User login
POST   /api/auth/refresh               # Refresh access token
GET    /api/auth/me                    # Get current user
POST   /api/auth/logout                # User logout
PUT    /api/auth/change-password       # Change password

# Impersonation (Admin/Superadmin only)
POST   /api/auth/impersonate/start     # Start impersonation
POST   /api/auth/impersonate/stop      # Stop impersonation
GET    /api/auth/impersonate/active    # Get active sessions
GET    /api/auth/impersonate/history   # Get impersonation history
```

### User Management
```
GET    /api/users                      # List users (role-based filtering)
POST   /api/users                      # Create user (Admin/Superadmin)
GET    /api/users/:id                  # Get user details
PUT    /api/users/:id                  # Update user
DELETE /api/users/:id                  # Delete user (soft delete)
PUT    /api/users/profile              # Update own profile

# CSM Management
POST   /api/users/:id/assign-accounts  # Assign CSM to accounts
GET    /api/users/:id/assignments      # Get CSM assignments
```

### Account Management
```
GET    /api/accounts                   # List accounts (role-based)
POST   /api/accounts                   # Create account (Admin/Superadmin)
GET    /api/accounts/:id               # Get account details
PUT    /api/accounts/:id               # Update account
DELETE /api/accounts/:id               # Delete account (Superadmin)
GET    /api/accounts/stats             # Account statistics

# CSM Assignment
POST   /api/accounts/:id/assign-csm    # Assign CSM to account
DELETE /api/accounts/:id/csm/:csmId    # Remove CSM from account
```

### Audit & Logging
```
GET    /api/audit/logs                 # Get audit logs (Admin/Superadmin)
GET    /api/audit/impersonation        # Get impersonation logs
GET    /api/audit/stats                # Audit statistics
GET    /api/audit/export               # Export audit logs (Superadmin)
```

## Database Schema

### Core Tables
- **users** - User profiles and authentication
- **accounts** - Customer accounts/companies
- **csm_assignments** - CSM to account mappings
- **user_accounts** - User to account mappings
- **impersonation_logs** - Impersonation session tracking
- **audit_logs** - Comprehensive audit trail
- **refresh_tokens** - Token management

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb framtt_superadmin

# Run database migrations
psql -d framtt_superadmin -f ../database/10_enhanced_schema_for_impersonation.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.template .env

# Edit .env with your configuration
nano .env
```

### 4. Start Development Server
```bash
npm run dev
```

## Environment Variables

Key environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/framtt_superadmin

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Security Considerations

### Authentication Security
- JWT tokens expire in 1 hour (configurable)
- Refresh tokens stored as httpOnly cookies
- Passwords hashed with bcrypt (12 rounds)
- Failed login attempts logged for monitoring

### Authorization Security
- Role-based access control on all endpoints
- Impersonation restricted by role hierarchy
- CSM access limited to assigned accounts only
- API actions logged for audit compliance

### Data Security
- SQL queries use parameterized statements
- Input validation on all endpoints
- Rate limiting on sensitive operations
- CORS configuration for frontend domains

## Development Workflow

### Code Structure
```
backend/
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── userController_enhanced.js
│   ├── accountController.js
│   └── auditController.js
├── middleware/          # Authentication & validation
│   ├── auth.js
│   └── errorHandler.js
├── routes/              # API route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── accountRoutes.js
│   └── auditRoutes.js
├── services/            # Business logic & database
│   └── database.js
└── server.js           # Application entry point
```

### Adding New Features
1. Create database migrations if needed
2. Add service layer functions in `services/database.js`
3. Create controller functions
4. Add routes with proper middleware
5. Update documentation

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Production Deployment

### Security Checklist
- [ ] Change all default secrets in production
- [ ] Enable HTTPS/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Database backups configured

### Environment Setup
- Use environment-specific `.env` files
- Set `NODE_ENV=production`
- Configure logging to files
- Set up process monitoring (PM2, etc.)

### Database
- Regular backups
- Connection pooling configured
- Performance monitoring
- Index optimization

## Monitoring & Observability

### Logging
- Structured JSON logging with winston
- Request/response logging
- Error tracking and alerting
- Audit log retention policies

### Metrics
- API response times
- Error rates by endpoint
- Database query performance
- User activity metrics

### Health Checks
```bash
GET /health
```
Returns server status and database connectivity.

## API Usage Examples

### Authentication Flow
```javascript
// 1. Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@framtt.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();

// 2. Use token for authenticated requests
const userResponse = await fetch('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Impersonation Flow
```javascript
// Start impersonation (Admin/Superadmin only)
const impersonationResponse = await fetch('/api/auth/impersonate/start', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUserId: 'user-uuid',
    reason: 'Customer support assistance'
  })
});

const { impersonationToken } = await impersonationResponse.json();

// Use impersonation token
const dataResponse = await fetch('/api/accounts', {
  headers: { 'Authorization': `Bearer ${impersonationToken}` }
});
```

## Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation
4. Follow security best practices
5. Test role-based access thoroughly

## Support

For questions or issues:
- Check the documentation
- Review audit logs for debugging
- Check database connection and migrations
- Verify environment configuration

## License

MIT License - see LICENSE file for details.
