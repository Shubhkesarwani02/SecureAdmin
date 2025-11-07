# SecureAdmin - Current Configuration Document

**Project Name:** Framtt Superadmin Dashboard  
**Version:** 1.0.0  
**Last Updated:** October 23, 2025  
**Purpose:** Comprehensive superadmin dashboard for managing rental companies on the Framtt platform

---

## 📋 Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Architecture](#project-architecture)
3. [Frontend Features](#frontend-features)
4. [Backend Features](#backend-features)
5. [Database Schema](#database-schema)
6. [Security Implementation](#security-implementation)
7. [API Endpoints](#api-endpoints)
8. [Environment Configuration](#environment-configuration)
9. [Deployment Setup](#deployment-setup)

---

## 🚀 Technology Stack

### Frontend Technologies
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.6.2
- **Build Tool:** Vite 5.4.9
- **Routing:** React Router DOM 6.28.0
- **Styling:** 
  - Tailwind CSS 3.4.14
  - PostCSS 8.4.49
  - Autoprefixer 10.4.20
  - tailwindcss-animate 1.0.7
  - tailwind-merge 2.5.4

### UI Component Libraries
- **Radix UI Primitives (Complete Set):**
  - accordion, alert-dialog, aspect-ratio, avatar
  - checkbox, collapsible, context-menu, dialog
  - dropdown-menu, hover-card, label, menubar
  - navigation-menu, popover, progress, radio-group
  - scroll-area, select, separator, slider
  - switch, tabs, toast, toggle, toggle-group, tooltip
- **shadcn/ui:** Custom component library with 45+ components
- **Additional UI Libraries:**
  - Recharts 2.12.7 (charts and data visualization)
  - Lucide React 0.447.0 (icon library)
  - date-fns 3.6.0 (date utilities)
  - react-day-picker 8.10.1 (date picker)
  - CMDK 1.0.0 (command palette)
  - Embla Carousel 8.3.0 (carousel component)
  - Sonner 1.7.4 (toast notifications)
  - Vaul 1.0.0 (drawer component)

### State Management & Form Handling
- React Context API (authentication & global state)
- React Hook Form 7.62.0 (form management)
- class-variance-authority 0.7.1 (component variants)
- clsx 2.1.1 (class name utilities)

### Backend Technologies
- **Runtime:** Node.js (>=16.0.0)
- **Framework:** Express.js 4.18.2
- **Database Driver:** pg (PostgreSQL) 8.16.3
- **Database Platform:** Supabase (@supabase/supabase-js 2.55.0)

### Authentication & Security
- **JWT:** jsonwebtoken 9.0.2
- **Password Hashing:** bcrypt 6.0.0, bcryptjs 2.4.3
- **Security Headers:** Helmet 7.2.0
- **Rate Limiting:** express-rate-limit 7.1.5
- **CORS:** cors 2.8.5
- **Cookie Parser:** cookie-parser 1.4.6

### Validation & Utilities
- **Validation:** Joi 17.11.0
- **HTTP Client:** Axios 1.11.0
- **Environment Variables:** dotenv 16.6.1
- **Date Manipulation:** moment 2.29.4
- **UUID Generation:** uuid 11.1.0
- **Email Service:** nodemailer 7.0.5
- **PDF Generation:** pdfkit 0.15.0
- **Terminal Styling:** chalk 4.1.2

### Development Tools
- **HTTP Logging:** morgan 1.10.0
- **Development Server:** nodemon 3.0.2
- **Testing:** Jest 29.7.0, supertest 6.3.3
- **Build Tool:** cross-env 10.0.0
- **Concurrent Execution:** concurrently 8.2.2
- **Linting:** ESLint 9.13.0, TypeScript ESLint 8.10.0

### Build & Bundling
- **Rollup:** @rollup/plugin-node-resolve 15.2.3
- **Terser:** terser 5.43.1 (code minification)
- **Platform Support:** @rollup/rollup-darwin-arm64 4.52.5

---

## 🏗️ Project Architecture

### High-Level Architecture
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend       │         │   Database      │
│   (React SPA)   │◄───────►│  (Express API)   │◄───────►│  (PostgreSQL)   │
│   Port: 5173    │  JWT    │   Port: 5000     │  SQL    │   Supabase      │
└─────────────────┘  Auth   └──────────────────┘ Queries └─────────────────┘
```

### Project Structure
```
SecureAdmin/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # React components (45+ files)
│   │   │   ├── ui/             # shadcn/ui components (47 components)
│   │   │   ├── figma/          # Figma design components
│   │   │   └── [feature components]
│   │   ├── contexts/           # React Context providers
│   │   │   └── AuthContext.tsx
│   │   ├── lib/                # Utilities and API client
│   │   │   ├── api.ts          # Centralized API client
│   │   │   ├── types.ts        # TypeScript type definitions
│   │   │   └── utils.ts        # Helper functions
│   │   ├── styles/             # Global CSS styles
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Entry point
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── tsconfig.json           # TypeScript configuration
│
├── backend/                     # Express.js backend API
│   ├── controllers/            # Business logic (20 controllers)
│   ├── routes/                 # API route definitions (21 route files)
│   ├── middleware/             # Express middleware (4 files)
│   │   ├── auth.js            # Authentication & authorization
│   │   ├── security.js        # Security utilities
│   │   ├── rateLimiting.js    # Rate limiting
│   │   └── errorHandler.js    # Error handling
│   ├── services/               # Database services (4 services)
│   │   ├── database.js
│   │   ├── emailService.js
│   │   ├── inviteService.js
│   │   └── supabaseService.js
│   ├── utils/                  # Utility functions
│   │   └── logger.js
│   ├── config/                 # Configuration files
│   │   └── database.js
│   ├── server.js               # Main server entry point
│   └── package.json
│
├── database/                    # PostgreSQL schema and migrations
│   ├── 00_create_full_schema.sql
│   ├── 01-18 [migration files]
│   ├── final_schema_specification.sql
│   └── README.md
│
├── docs/                        # Documentation
│   └── PROJECT_OVERVIEW.md
│
├── supabase/                    # Supabase configurations
│   └── functions/
│
├── package.json                 # Root workspace configuration
└── README.md                    # Main documentation
```

### Communication Flow
1. **User → Frontend:** User interacts with React UI
2. **Frontend → Backend:** API calls with JWT in Authorization header
3. **Backend → Database:** SQL queries via pg driver to PostgreSQL
4. **Database → Backend:** Query results
5. **Backend → Frontend:** JSON responses
6. **Frontend → User:** Rendered UI updates

---

## 🎨 Frontend Features

### Core Pages & Components

#### 1. **Authentication System**
- **LoginPage.tsx:** Secure JWT-based authentication
- **ProtectedRoute.tsx:** Route guards with role-based access control
- **AuthContext:** Global authentication state management
- Features:
  - JWT token storage in localStorage
  - Automatic token validation
  - Session expiration handling
  - Role-based UI rendering

#### 2. **Dashboard & Analytics**
- **OverviewDashboard.tsx:** Main dashboard with KPIs and analytics
  - Real-time metrics display
  - Revenue tracking charts (Recharts)
  - Client status overview
  - System health indicators
  - Activity timeline
  - Quick action buttons

#### 3. **User Management**
- **UserManagement.tsx:** Complete user administration
  - User CRUD operations
  - Role assignment (SuperAdmin, Admin, CSM, User)
  - Account assignments
  - User status management
  - Activity tracking
  - Bulk operations

#### 4. **Client Management**
- **ClientManagement.tsx:** Tenant/client administration
  - Client CRUD operations
  - Subscription management
  - Integration settings
  - Billing information
  - Account health monitoring
  - Activity logs

#### 5. **Account Health Monitoring**
- **AccountHealth.tsx:** Proactive client health tracking
  - Health score visualization
  - Alert management
  - Risk assessment
  - Engagement metrics
  - Automated alerts
  - Action recommendations

#### 6. **Impersonation System**
- **ImpersonationDialog.tsx:** Secure impersonation initiation
- **ImpersonationBanner.tsx:** Active impersonation indicator
- **ImpersonationHistory.tsx:** Complete audit trail
- Features:
  - Admin/SuperAdmin only access
  - Reason requirement
  - Session time limits
  - Clear visual indicators
  - Comprehensive logging
  - Easy session termination

#### 7. **Invite Management**
- **InviteManagement.tsx:** User onboarding system
  - Send email invitations
  - Token generation
  - Expiration management
  - Resend functionality
  - Status tracking
  - Bulk invitations

#### 8. **System Monitoring**
- **SystemMonitoring.tsx:** Real-time system health
  - Server status
  - API endpoint monitoring
  - Database connection status
  - Performance metrics
  - Error logs
  - Resource usage

#### 9. **Payments & Billing**
- **PaymentsBilling.tsx:** Revenue management
  - Revenue analytics
  - Transaction history
  - Subscription tracking
  - Payment failures
  - Refund processing
  - Billing reports

#### 10. **Integration Snippets**
- **SnippetManager.tsx:** API integration management
  - Code snippet generation
  - API key management
  - Integration templates
  - Usage tracking
  - Documentation links

#### 11. **Admin Settings**
- **AdminSettings.tsx:** System configuration
  - User preferences
  - System settings
  - Integration codes
  - Security settings
  - Notification preferences
  - Theme customization

#### 12. **Navigation & UI**
- **BreadcrumbNavigation.tsx:** Hierarchical navigation
- **Sidebar:** Collapsible navigation menu
- **NotFound.tsx:** 404 error handling

### UI Component Library (45+ Components)

#### Layout Components
- `sidebar.tsx` - Collapsible navigation sidebar
- `card.tsx` - Content container with header/footer
- `sheet.tsx` - Slide-over panels
- `separator.tsx` - Visual dividers
- `scroll-area.tsx` - Custom scrollable areas
- `resizable.tsx` - Resizable panels

#### Form Components
- `button.tsx` - Various button styles
- `input.tsx` - Text input fields
- `textarea.tsx` - Multi-line text input
- `select.tsx` - Dropdown selection
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button groups
- `switch.tsx` - Toggle switches
- `slider.tsx` - Range sliders
- `calendar.tsx` - Date picker calendar
- `form.tsx` - Form wrapper with validation
- `label.tsx` - Form labels
- `input-otp.tsx` - OTP input fields

#### Navigation Components
- `menubar.tsx` - Menu bar navigation
- `navigation-menu.tsx` - Navigation menus
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Page navigation
- `tabs.tsx` - Tabbed interfaces
- `command.tsx` - Command palette

#### Feedback Components
- `alert.tsx` - Alert messages
- `alert-dialog.tsx` - Confirmation dialogs
- `toast.tsx` / `sonner.tsx` - Toast notifications
- `progress.tsx` - Progress indicators
- `skeleton.tsx` - Loading placeholders
- `badge.tsx` - Status badges

#### Overlay Components
- `dialog.tsx` - Modal dialogs
- `drawer.tsx` - Mobile-friendly drawers
- `popover.tsx` - Popover menus
- `tooltip.tsx` - Tooltips
- `hover-card.tsx` - Hover cards
- `context-menu.tsx` - Right-click menus
- `dropdown-menu.tsx` - Dropdown menus

#### Data Display Components
- `table.tsx` - Data tables
- `chart.tsx` - Chart wrapper
- `avatar.tsx` - User avatars
- `aspect-ratio.tsx` - Aspect ratio containers
- `carousel.tsx` - Image carousels

#### Interaction Components
- `accordion.tsx` - Expandable sections
- `collapsible.tsx` - Collapsible content
- `toggle.tsx` - Toggle buttons
- `toggle-group.tsx` - Toggle button groups

### Routing System
```typescript
Routes:
/ - Overview Dashboard
/clients - Client Management
/users - User Management
/invites - Invite Management
/account-health - Account Health Monitoring
/monitoring - System Monitoring
/payments - Payments & Billing
/snippets - Integration Snippets
/impersonation-history - Impersonation Logs
/settings - Admin Settings
/onboarding - User Onboarding
/login - Login Page
* - 404 Not Found
```

### State Management
- **AuthContext:** Global authentication state
  - User profile
  - Session management
  - Impersonation state
  - Token management
  - Profile refresh
  - Login/logout functions

### API Integration
- **Centralized API Client:** `/lib/api.ts`
  - Base URL configuration
  - JWT token management
  - Request/response interceptors
  - Error handling
  - Type-safe responses
  - Automatic token refresh

---

## ⚙️ Backend Features

### Core Functionality

#### 1. **Authentication System**
- **JWT-based authentication**
  - Access tokens (24h expiration)
  - Refresh tokens (7d expiration)
  - Token rotation support
  - Token blacklisting
  - Secure token storage
- **Password management**
  - Bcrypt hashing (10 rounds)
  - Password change with old password verification
  - Password reset via email
  - Strong password requirements
- **Session management**
  - Multiple device support
  - Session tracking
  - Forced logout capability

#### 2. **Role-Based Access Control (RBAC)**
- **Role Hierarchy:**
  ```
  SuperAdmin (full system access)
    ├── Admin (all management features)
    │   ├── CSM (Customer Success Manager - assigned accounts only)
    │   │   └── User (basic access, assigned accounts only)
  ```
- **Permission System:**
  - `requireSuperAdmin` - Full system access
  - `requireAdmin` - Admin and above
  - `requireCSMOrAbove` - CSM, Admin, SuperAdmin
  - `requireAuthenticated` - Any authenticated user
  - `canImpersonate` - Impersonation permission check
  - `canManageAllCustomers` - Customer management permission

#### 3. **Impersonation System**
- **Features:**
  - Admin/SuperAdmin can impersonate any user
  - Reason requirement for audit
  - Session time limits (1 hour)
  - Special impersonation JWT tokens
  - Active session tracking
  - Automatic session termination
- **Audit Trail:**
  - Impersonator ID
  - Impersonated user ID
  - Session ID
  - Start/end timestamps
  - Reason for impersonation
  - All actions during session
  - IP address and user agent

#### 4. **User Management**
- **User CRUD operations**
  - Create user with role assignment
  - Update user profile and permissions
  - Delete user (soft delete)
  - User status management (active/inactive/suspended)
- **User Features:**
  - Profile management
  - Preference settings
  - Notification settings
  - Avatar upload
  - Last login tracking
  - Activity monitoring

#### 5. **Account & Assignment Management**
- **Account (Tenant) Management:**
  - Multi-tenant architecture
  - Account CRUD operations
  - Account status tracking
  - Subscription management
  - Billing information
- **CSM Assignments:**
  - Assign CSMs to accounts
  - Primary CSM designation
  - Bulk assignments
  - Assignment history
  - Workload balancing
- **User-Account Assignments:**
  - Assign users to accounts
  - Role-in-account specification
  - Bulk user assignments
  - Assignment tracking

#### 6. **Client Management**
- **Client Features:**
  - Client CRUD operations
  - Company information
  - Contact management
  - Subscription plans (Basic, Professional, Enterprise)
  - API key generation
  - Webhook configuration
  - Integration settings
  - Billing information
  - Preferences management

#### 7. **Account Health Monitoring**
- **Health Scoring:**
  - Algorithm-based health scores (0-100)
  - Multiple factor analysis
  - Real-time calculation
  - Historical tracking
- **Alert System:**
  - Automated alert generation
  - Alert types: low_engagement, payment_failed, integration_error, high_churn_risk
  - Alert status: active, acknowledged, resolved
  - Threshold-based triggers
  - Email notifications
- **Risk Management:**
  - High-risk client identification
  - Proactive intervention workflows
  - CSM assignment for at-risk accounts

#### 8. **Invite & Onboarding System**
- **Invitation Features:**
  - Email-based invitations
  - Secure token generation (UUID)
  - 48-hour expiration
  - Role pre-assignment
  - Account pre-assignment
  - Resend functionality
  - Bulk invitations
- **Onboarding:**
  - Token validation
  - User registration
  - Password setup
  - Profile completion
  - Automatic account assignment
  - Welcome email

#### 9. **Audit & Logging System**
- **Audit Logs:**
  - All CRUD operations
  - Authentication events
  - Impersonation sessions
  - Role changes
  - Permission modifications
  - Sensitive operations
- **Logged Information:**
  - User ID and impersonator ID
  - Action type
  - Resource type and ID
  - Old and new values (JSON)
  - IP address
  - User agent
  - Timestamp

#### 10. **Integration Management**
- **Integration Codes:**
  - Unique code generation
  - Code lifecycle management
  - Usage tracking
  - Expiration dates
  - Status management
- **API Snippets:**
  - Code snippet templates
  - Multiple languages (JS, Python, cURL, etc.)
  - API key management
  - Documentation generation

#### 11. **Payment & Billing**
- **Revenue Tracking:**
  - Real-time revenue metrics
  - Monthly recurring revenue (MRR)
  - Revenue trends
  - Payment success rates
- **Subscription Management:**
  - Plan management
  - Subscription status tracking
  - Renewal dates
  - Failed payment handling
  - Refund processing
- **Billing Analytics:**
  - Transaction history
  - Payment method tracking
  - Churn analysis
  - Revenue forecasting

#### 12. **System Monitoring**
- **Health Checks:**
  - Database connectivity
  - API endpoint status
  - Service availability
  - Response time monitoring
- **Performance Metrics:**
  - Request/response times
  - API usage statistics
  - Error rates
  - Resource utilization
- **Error Logging:**
  - Centralized error logs
  - Error categorization
  - Stack trace capture
  - Alert on critical errors

#### 13. **Notification System**
- **Notification Types:**
  - System alerts
  - Account updates
  - Payment notifications
  - Security alerts
  - User actions
- **Delivery Methods:**
  - In-app notifications
  - Email notifications
  - Push notifications (planned)
- **Features:**
  - Read/unread status
  - Archive functionality
  - Priority levels
  - Expiration dates
  - Category filtering

### Security Features

#### 1. **Rate Limiting**
- **General API Limiter:**
  - 100 requests per 15 minutes per IP
  - Standard headers included
  - Audit logging of violations
- **Authentication Limiter:**
  - 5 login attempts per 15 minutes per IP
  - Successful requests don't count
  - Account lockout on repeated failures
- **Impersonation Limiter:**
  - 10 attempts per hour per IP
  - Enhanced logging
  - Admin notification on violations
- **Password Change Limiter:**
  - 3 attempts per hour per user
  - Additional verification on limit
- **Admin Operations Limiter:**
  - 50 requests per 15 minutes
  - Applied to sensitive operations

#### 2. **Security Headers (Helmet)**
- Content Security Policy (CSP)
- X-Frame-Options (deny)
- X-Content-Type-Options (nosniff)
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
- Referrer-Policy

#### 3. **Input Validation & Sanitization**
- **Joi validation schemas**
- **SQL injection prevention**
- **XSS protection**
- **CSRF token validation**
- **Request size limits (10MB)**

#### 4. **JWT Security**
- **Secret rotation support**
- **Token expiration**
- **Token blacklisting**
- **Issuer and audience validation**
- **JTI (JWT ID) for uniqueness**

#### 5. **CORS Configuration**
- **Whitelisted origins:**
  - http://localhost:3000
  - http://localhost:5173
  - https://superadmin.framtt.com
  - https://framtt-superadmin.netlify.app
- **Credentials support**
- **Preflight caching**

### Middleware Stack

#### 1. **auth.js**
- `verifyToken` - JWT verification
- `requireSuperAdmin` - SuperAdmin access only
- `requireAdmin` - Admin and above
- `requireCSMOrAbove` - CSM and above
- `requireAuthenticated` - Any authenticated user
- `canImpersonate` - Impersonation permission
- `canManageAllCustomers` - Customer management permission
- `sensitiveOperationLimit` - Extra rate limiting

#### 2. **security.js**
- `JWTSecretManager` - JWT secret rotation
- `ImpersonationTokenManager` - Impersonation tokens
- `securityHeaders` - Additional security headers
- `sanitizeInput` - Input sanitization
- `tokenBlacklist` - Token revocation

#### 3. **rateLimiting.js**
- `generalLimiter` - General API rate limiting
- `authLimiter` - Authentication rate limiting
- `impersonationLimiter` - Impersonation rate limiting
- `passwordChangeLimiter` - Password change rate limiting
- `adminOperationsLimiter` - Admin operation rate limiting

#### 4. **errorHandler.js**
- `notFound` - 404 handler
- `errorHandler` - Global error handler
- Error logging and formatting
- Development vs production error responses

---

## 🗄️ Database Schema

### Database Platform
- **PostgreSQL** (via Supabase)
- **Extensions:** uuid-ossp, pgcrypto

### Core Tables

#### 1. **users**
```sql
Columns:
- id (bigint, PK, auto-increment)
- full_name (varchar, NOT NULL)
- email (varchar, UNIQUE, NOT NULL)
- phone (varchar)
- role (varchar, NOT NULL, DEFAULT 'admin')
  Values: 'superadmin', 'admin', 'csm', 'user'
- department (varchar, DEFAULT 'General')
- status (varchar, NOT NULL, DEFAULT 'active')
  Values: 'active', 'inactive', 'suspended'
- password_hash (varchar)
- avatar (text)
- bio (text)
- permissions (jsonb, DEFAULT '[]')
- preferences (jsonb, DEFAULT {...})
- is_impersonation_active (boolean, DEFAULT false)
- current_impersonator_id (text)
- created_by (uuid)
- invited_at (timestamp)
- invited_by (bigint)
- signup_completed_at (timestamp)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())
- last_login (timestamp)

Indexes:
- idx_users_email
- idx_users_role
- idx_users_status
```

#### 2. **accounts**
```sql
Columns:
- id (bigint, PK, auto-increment)
- name (varchar, UNIQUE, NOT NULL)
- description (text)
- status (varchar, DEFAULT 'active')
- company_name (varchar)
- contact_email (varchar)
- contact_phone (varchar)
- billing_address (text)
- email (varchar)
- phone (varchar)
- address (text)
- city (varchar)
- state (varchar)
- country (varchar, DEFAULT 'United States')
- postal_code (varchar)
- website (varchar)
- business_license (varchar)
- tax_id (varchar)
- subscription_plan (varchar, DEFAULT 'basic')
- subscription_status (varchar, DEFAULT 'trial')
- subscription_amount (numeric, DEFAULT 99.00)
- next_billing_date (timestamp)
- integration_code (varchar)
- ai_recommendation (boolean, DEFAULT false)
- whatsapp_integration (boolean, DEFAULT false)
- tracking_active (boolean, DEFAULT false)
- marketing_active (boolean, DEFAULT false)
- total_bookings (integer, DEFAULT 0)
- active_vehicles (integer, DEFAULT 0)
- monthly_revenue (numeric, DEFAULT 0.00)
- created_by (bigint)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())

Indexes:
- idx_accounts_name
- idx_accounts_status
- idx_accounts_subscription_status
```

#### 3. **clients**
```sql
Columns:
- id (bigint, PK, auto-increment)
- company_name (varchar, NOT NULL)
- contact_name (varchar, NOT NULL)
- email (varchar, UNIQUE, NOT NULL)
- phone (varchar)
- address (text)
- city (varchar)
- state (varchar)
- zip_code (varchar)
- country (varchar, DEFAULT 'United States')
- status (varchar, NOT NULL, DEFAULT 'active')
- subscription_plan (varchar, DEFAULT 'basic')
- subscription_status (varchar, DEFAULT 'active')
- subscription_amount (numeric, DEFAULT 99.00)
- next_billing_date (timestamp)
- api_key (varchar, UNIQUE)
- webhook_url (text)
- integration_settings (jsonb, DEFAULT '{}')
- integration_code (varchar)
- billing_info (jsonb, DEFAULT '{}')
- preferences (jsonb, DEFAULT {...})
- ai_recommendation (boolean, DEFAULT false)
- whatsapp_integration (boolean, DEFAULT false)
- tracking_active (boolean, DEFAULT false)
- marketing_active (boolean, DEFAULT false)
- total_bookings (integer, DEFAULT 0)
- active_vehicles (integer, DEFAULT 0)
- monthly_revenue (numeric, DEFAULT 0.00)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())
- last_activity (timestamp)
- last_login (timestamp)

Indexes:
- idx_clients_email
- idx_clients_status
- idx_clients_api_key
```

#### 4. **csm_assignments**
```sql
Columns:
- id (bigint, PK, auto-increment)
- csm_id (bigint, NOT NULL, FK -> users.id)
- account_id (bigint, NOT NULL, FK -> accounts.id)
- assigned_at (timestamp, DEFAULT now())
- assigned_by (bigint, FK -> users.id)
- is_primary (boolean, DEFAULT false)
- notes (text)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())

Indexes:
- idx_csm_assignments_csm_id
- idx_csm_assignments_account_id
- UNIQUE (csm_id, account_id)
```

#### 5. **user_accounts**
```sql
Columns:
- id (bigint, PK, auto-increment)
- user_id (bigint, NOT NULL, FK -> users.id)
- account_id (bigint, NOT NULL, FK -> accounts.id)
- role_in_account (varchar, DEFAULT 'member')
- assigned_at (timestamp, DEFAULT now())
- assigned_by (bigint, FK -> users.id)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())

Indexes:
- idx_user_accounts_user_id
- idx_user_accounts_account_id
- UNIQUE (user_id, account_id)
```

#### 6. **impersonation_logs**
```sql
Columns:
- id (integer, PK, auto-increment)
- impersonator_id (text)
- impersonated_user_id (text)
- impersonated_id (text)
- session_id (text)
- action (varchar)
- reason (text)
- ip_address (inet)
- user_agent (text)
- is_active (boolean, DEFAULT true)
- created_at (timestamp, DEFAULT now())
- ended_at (timestamp)
- end_time (timestamp)

Indexes:
- idx_impersonation_logs_impersonator_id
- idx_impersonation_logs_impersonated_user_id
- idx_impersonation_logs_session_id
- idx_impersonation_logs_is_active
```

#### 7. **refresh_tokens**
```sql
Columns:
- id (bigint, PK, auto-increment)
- user_id (bigint, NOT NULL, FK -> users.id)
- token_hash (varchar, NOT NULL)
- expires_at (timestamp, NOT NULL)
- is_revoked (boolean, DEFAULT false)
- created_at (timestamp, DEFAULT now())

Indexes:
- idx_refresh_tokens_user_id
- idx_refresh_tokens_expires_at
- idx_refresh_tokens_is_revoked
```

#### 8. **invite_tokens**
```sql
Columns:
- id (bigint, PK, auto-increment)
- token (varchar, UNIQUE, NOT NULL)
- email (varchar, NOT NULL)
- invited_by (bigint, NOT NULL, FK -> users.id)
- role (varchar, NOT NULL)
- account_id (bigint, FK -> accounts.id)
- company_name (varchar)
- full_name (varchar)
- phone (varchar)
- status (varchar, NOT NULL, DEFAULT 'pending')
  Values: 'pending', 'accepted', 'expired', 'cancelled'
- expires_at (timestamp, NOT NULL, DEFAULT now() + 48 hours)
- used_at (timestamp)
- used_by (bigint, FK -> users.id)
- metadata (jsonb)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())

Indexes:
- idx_invite_tokens_token
- idx_invite_tokens_email
- idx_invite_tokens_status
```

#### 9. **audit_logs / system_logs**
```sql
Columns:
- id (bigint, PK, auto-increment)
- user_id (bigint, FK -> users.id)
- impersonator_id (bigint, FK -> users.id)
- action (varchar, NOT NULL)
- resource_type (varchar)
- resource_id (bigint)
- old_values (jsonb)
- new_values (jsonb)
- ip_address (inet)
- user_agent (text)
- level (varchar)
- service (varchar)
- message (text)
- details (jsonb, DEFAULT '{}')
- created_at (timestamp, DEFAULT now())

Indexes:
- idx_audit_logs_user_id
- idx_audit_logs_action
- idx_audit_logs_created_at
```

#### 10. **account_health_scores**
```sql
Columns:
- id (bigint, PK, auto-increment)
- client_id (bigint, NOT NULL, FK -> clients.id)
- health_score (integer, NOT NULL)
  Range: 0-100
- factors (jsonb, DEFAULT '{}')
  Keys: engagement, payment_history, usage, support_tickets
- last_updated (timestamp, DEFAULT now())
- created_at (timestamp, DEFAULT now())

Indexes:
- idx_account_health_scores_client_id
- idx_account_health_scores_health_score
```

#### 11. **account_health_alerts**
```sql
Columns:
- id (bigint, PK, auto-increment)
- client_id (bigint, NOT NULL, FK -> clients.id)
- alert_type (varchar, NOT NULL)
  Values: 'low_engagement', 'payment_failed', 'integration_error', 'high_churn_risk'
- status (varchar, NOT NULL, DEFAULT 'active')
  Values: 'active', 'acknowledged', 'resolved'
- message (text)
- threshold_value (integer)
- current_value (integer)
- created_at (timestamp, DEFAULT now())
- acknowledged_at (timestamp)
- resolved_at (timestamp)

Indexes:
- idx_account_health_alerts_client_id
- idx_account_health_alerts_status
- idx_account_health_alerts_alert_type
```

#### 12. **notifications**
```sql
Columns:
- id (bigint, PK, auto-increment)
- user_id (bigint, FK -> users.id)
- client_id (bigint, FK -> clients.id)
- type (varchar, NOT NULL)
- category (varchar, DEFAULT 'general')
- title (varchar, NOT NULL)
- message (text, NOT NULL)
- data (jsonb, DEFAULT '{}')
- is_read (boolean, DEFAULT false)
- is_archived (boolean, DEFAULT false)
- priority (varchar, DEFAULT 'medium')
  Values: 'low', 'medium', 'high', 'critical'
- expires_at (timestamp)
- created_at (timestamp, DEFAULT now())
- read_at (timestamp)
- archived_at (timestamp)

Indexes:
- idx_notifications_user_id
- idx_notifications_is_read
- idx_notifications_created_at
```

#### 13. **dashboard_metrics**
```sql
Columns:
- id (uuid, PK, DEFAULT uuid_generate_v4())
- metric_name (varchar, NOT NULL, DEFAULT 'daily_summary')
- metric_value (numeric)
- metric_data (jsonb)
- metric_type (text)
- date_recorded (date, NOT NULL, DEFAULT CURRENT_DATE)
- date (date)
- total_companies (integer, DEFAULT 0)
- active_companies (integer, DEFAULT 0)
- total_users (integer, DEFAULT 0)
- total_vehicles (integer, DEFAULT 0)
- active_vehicles (integer, DEFAULT 0)
- total_revenue (numeric, DEFAULT 0)
- monthly_revenue (numeric, DEFAULT 0)
- created_at (timestamp, DEFAULT now())

Indexes:
- idx_dashboard_metrics_date_recorded
- idx_dashboard_metrics_metric_name
```

#### 14. **integration_codes**
```sql
Columns:
- id (uuid, PK, DEFAULT uuid_generate_v4())
- code (varchar, UNIQUE, NOT NULL)
- name (varchar, NOT NULL)
- description (text)
- is_active (boolean, DEFAULT true)
- status (varchar, DEFAULT 'active')
- usage_count (integer, DEFAULT 0)
- last_used (timestamp)
- expires_at (timestamp)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())

Indexes:
- idx_integration_codes_code
- idx_integration_codes_is_active
```

#### 15. **vehicles** (if implemented)
```sql
Columns:
- id (bigint, PK, auto-increment)
- client_id (bigint, FK -> clients.id)
- make (varchar)
- model (varchar)
- year (integer)
- vin (varchar, UNIQUE)
- license_plate (varchar)
- status (varchar, DEFAULT 'available')
- daily_rate (numeric)
- created_at (timestamp, DEFAULT now())
- updated_at (timestamp, DEFAULT now())
```

### Database Relationships
```
users ──┬── csm_assignments.csm_id
        ├── user_accounts.user_id
        ├── refresh_tokens.user_id
        ├── invite_tokens.invited_by
        └── audit_logs.user_id

accounts ──┬── csm_assignments.account_id
           ├── user_accounts.account_id
           └── invite_tokens.account_id

clients ──┬── account_health_scores.client_id
          ├── account_health_alerts.client_id
          ├── notifications.client_id
          └── vehicles.client_id
```

---

## 🔐 Security Implementation

### 1. **Authentication Flow**
```
1. User submits credentials
2. Backend validates credentials
3. Generate access token (24h) + refresh token (7d)
4. Store refresh token hash in database
5. Return tokens to frontend
6. Frontend stores access token in localStorage
7. Include token in Authorization header for all requests
8. Backend verifies token on each request
9. If expired, use refresh token to get new access token
```

### 2. **Authorization Flow**
```
1. Request received with JWT token
2. Verify token signature and expiration
3. Extract user role from token
4. Check route permission requirements
5. Compare user role with required permissions
6. Allow/deny request based on role hierarchy
7. Log access attempt for audit
```

### 3. **Impersonation Flow**
```
1. Admin requests to impersonate user
2. Validate admin has impersonation permission
3. Generate special impersonation JWT
4. Include impersonator_id and session_id in token
5. Log impersonation start in database
6. Return impersonation token to frontend
7. Frontend replaces current token
8. All subsequent requests use impersonation token
9. Backend tracks all actions during impersonation
10. Admin stops impersonation
11. Log impersonation end
12. Restore original admin token
```

### 4. **Rate Limiting Strategy**
- **General API:** 100 req/15min per IP
- **Authentication:** 5 req/15min per IP
- **Impersonation:** 10 req/hour per IP
- **Password Change:** 3 req/hour per user
- **Admin Operations:** 50 req/15min per IP
- All violations logged to audit system

### 5. **Data Protection**
- **Passwords:** Bcrypt with 10 rounds
- **JWT Secrets:** 64-byte random strings
- **API Keys:** UUID v4
- **Tokens:** UUID v4 with expiration
- **Sensitive Data:** Encrypted at rest
- **Database:** SSL/TLS connections

### 6. **Security Headers**
```javascript
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
```

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /login                    - User login
POST   /refresh                  - Refresh access token
GET    /me                       - Get current user profile
POST   /logout                   - User logout
PUT    /change-password          - Change password
POST   /impersonate/start        - Start impersonation (Admin+)
POST   /impersonate/stop         - Stop impersonation
GET    /impersonate/active       - Get active impersonations (Admin+)
GET    /impersonate/history      - Get impersonation history (Admin+)
```

### User Routes (`/api/users`)
```
GET    /                         - List all users (CSM+)
GET    /stats                    - User statistics (Admin+)
GET    /csm/dashboard            - CSM dashboard data (CSM+)
POST   /                         - Create user (Admin+)
GET    /:id                      - Get user by ID
PUT    /:id                      - Update user (Admin+)
DELETE /:id                      - Delete user (Admin+)
PUT    /profile                  - Update own profile
POST   /:id/assign-accounts      - Assign accounts to CSM (Admin+)
GET    /:id/assignments          - Get CSM assignments
```

### Account Routes (`/api/accounts`)
```
GET    /                         - List accounts
POST   /                         - Create account (Admin+)
GET    /:id                      - Get account by ID
PUT    /:id                      - Update account (Admin+)
DELETE /:id                      - Delete account (SuperAdmin)
GET    /:id/users                - Get account users
GET    /:id/stats                - Get account statistics
```

### Assignment Routes (`/api/assignments`)
```
GET    /stats                    - Assignment statistics (Admin+)
GET    /csm-overview             - CSM assignments overview (Admin+)
GET    /available-users          - List available users (Admin+)
GET    /available-csms           - List available CSMs (Admin+)
GET    /unassigned-accounts      - List unassigned accounts (Admin+)
GET    /unassigned-users         - List unassigned users (Admin+)
POST   /user-accounts            - Assign user to account (Admin+)
DELETE /user-accounts/:userId/:accountId - Remove user from account (Admin+)
POST   /bulk/users-to-account    - Bulk assign users (Admin+)
GET    /users/:userId/accounts   - Get user's accounts
GET    /accounts/:accountId/users - Get account's users (CSM+)
```

### Client Routes (`/api/clients`)
```
GET    /                         - List clients
POST   /                         - Create client (Admin+)
GET    /stats                    - Client statistics (Admin+)
GET    /:id                      - Get client by ID
PUT    /:id                      - Update client (Admin+)
DELETE /:id                      - Delete client (SuperAdmin)
```

### Invite Routes (`/api/invites`)
```
GET    /validate/:token          - Validate invitation token (Public)
POST   /complete                 - Complete onboarding (Public)
GET    /                         - List invitations (CSM+)
GET    /stats                    - Invitation statistics (CSM+)
GET    /available-accounts       - Get available accounts (Admin+)
POST   /                         - Send invitation (Admin+)
POST   /:id/resend               - Resend invitation (Admin+)
DELETE /:id                      - Cancel invitation (Admin+)
```

### Account Health Routes (`/api/account-health`)
```
GET    /overview                 - Health overview
GET    /scores                   - Health scores (Admin+)
GET    /alerts                   - Health alerts (Admin+)
GET    /client/:clientId         - Client health details (Admin+)
GET    /high-risk                - High-risk clients (Admin+)
POST   /alerts/:alertId/acknowledge - Acknowledge alert (Admin+)
POST   /alerts/:alertId/resolve  - Resolve alert (Admin+)
POST   /refresh-scores           - Refresh health scores (Admin+)
GET    /csm/overview             - CSM health overview (CSM+)
GET    /csm/scores               - CSM health scores (CSM+)
GET    /csm/alerts               - CSM health alerts (CSM+)
GET    /csm/client/:clientId     - CSM client health (CSM+)
```

### Dashboard Routes (`/api/dashboard`)
```
GET    /overview                 - Dashboard overview
GET    /metrics                  - Dashboard metrics
GET    /stats                    - Dashboard statistics
GET    /kpis                     - Key performance indicators
GET    /recent-activity          - Recent activity feed
```

### Impersonation Routes (`/api/impersonation-history`)
```
POST   /start                    - Start impersonation (Admin+)
POST   /stop                     - Stop impersonation
GET    /active                   - Active sessions (Admin+)
POST   /log-action               - Log impersonation action
GET    /history                  - Impersonation history (Admin+)
GET    /stats                    - Impersonation statistics (Admin+)
GET    /current                  - Current impersonations (Admin+)
GET    /:id/details              - Impersonation details (Admin+)
POST   /:id/terminate            - Terminate session (SuperAdmin)
```

### Audit Routes (`/api/audit`)
```
GET    /logs                     - Audit logs (Admin+)
GET    /impersonation            - Impersonation logs (Admin+)
GET    /stats                    - Audit statistics (Admin+)
GET    /export                   - Export audit logs (SuperAdmin)
```

### Payment Routes (`/api/payments`)
```
GET    /reports                  - Payment reports (Admin+)
GET    /export                   - Export payment data (Admin+)
GET    /stats                    - Payment statistics (Admin+)
GET    /billing-history          - Billing history (Admin+)
GET    /revenue-analytics        - Revenue analytics (Admin+)
POST   /refund                   - Process refund (Admin+)
GET    /integration-codes        - Get integration codes (SuperAdmin)
POST   /integration-codes        - Create integration code (SuperAdmin)
DELETE /integration-codes/:id    - Delete integration code (SuperAdmin)
```

### Billing Routes (`/api/billing`)
```
GET    /revenue                  - Revenue data (SuperAdmin)
GET    /subscriptions            - Subscription data (SuperAdmin)
GET    /transactions             - Transaction data (SuperAdmin)
GET    /renewals                 - Renewal data (SuperAdmin)
GET    /failed-payments          - Failed payments (SuperAdmin)
```

### System Routes (`/api/system`)
```
GET    /monitoring               - System monitoring (Admin+)
GET    /health                   - System health (Admin+)
GET    /performance              - Performance metrics (Admin+)
GET    /resources                - Resource usage (Admin+)
POST   /refresh-metrics          - Refresh metrics (Admin+)
GET    /logs/errors              - Error logs (Admin+)
POST   /restart/:service         - Restart service (SuperAdmin)
GET    /services/:service        - Service details (SuperAdmin)
```

### Monitoring Routes (`/api/monitoring`)
```
GET    /system-metrics           - System metrics (SuperAdmin)
GET    /system-health            - System health (SuperAdmin)
GET    /api-endpoints            - API endpoints status (SuperAdmin)
GET    /error-logs               - Error logs (SuperAdmin)
```

### Role Routes (`/api/roles`)
```
POST   /assign                   - Assign role (Admin+)
GET    /:userId                  - Get user roles (Admin+)
```

### Admin Routes (`/api/admin`)
```
GET    /settings                 - Get admin settings (SuperAdmin)
PUT    /settings                 - Update admin settings (SuperAdmin)
GET    /logs                     - System logs (SuperAdmin)
GET    /integration-codes        - Integration codes (SuperAdmin)
POST   /integration-codes        - Create integration code (SuperAdmin)
DELETE /integration-codes/:code  - Deactivate integration code (SuperAdmin)
```

### Vehicle Routes (`/api/vehicles`)
```
GET    /                         - List vehicles (SuperAdmin)
POST   /                         - Create vehicle (SuperAdmin)
GET    /stats                    - Vehicle statistics (SuperAdmin)
GET    /:id                      - Get vehicle by ID (SuperAdmin)
PUT    /:id                      - Update vehicle (SuperAdmin)
DELETE /:id                      - Delete vehicle (SuperAdmin)
```

### Notification Routes (`/api/notifications`)
```
GET    /                         - List notifications
GET    /:id                      - Get notification by ID
PUT    /:id/read                 - Mark as read
PUT    /:id/archive              - Archive notification
POST   /                         - Create notification (Admin+)
DELETE /:id                      - Delete notification (Admin+)
```

### Integration Routes (`/api/integrations`)
```
GET    /snippets                 - List snippets
POST   /snippets                 - Create snippet (Admin+)
GET    /snippets/:id             - Get snippet by ID
PUT    /snippets/:id             - Update snippet (Admin+)
DELETE /snippets/:id             - Delete snippet (Admin+)
GET    /templates                - List templates
GET    /stats                    - Integration statistics (Admin+)
```

### Snippet Routes (`/api/snippets`)
```
GET    /                         - List snippets (SuperAdmin)
POST   /                         - Create snippet (SuperAdmin)
GET    /:id                      - Get snippet (SuperAdmin)
PUT    /:id                      - Update snippet (SuperAdmin)
DELETE /:id                      - Delete snippet (SuperAdmin)
```

### User Preferences Routes (`/api/user`)
```
GET    /preferences              - Get user preferences
PUT    /preferences              - Update user preferences
GET    /notification-settings    - Get notification settings
PUT    /notification-settings    - Update notification settings
```

### Health Check Routes
```
GET    /health                   - API health check (Public)
GET    /api/health               - API health check (Public)
```

---

## 🌍 Environment Configuration

### Frontend Environment Variables (`.env`)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Supabase Configuration (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_IMPERSONATION=true
```

### Backend Environment Variables (`.env`)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Supabase PostgreSQL)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_SSL=true

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT Configuration
JWT_SECRET=your_64_byte_random_string
JWT_PREVIOUS_SECRET=previous_secret_for_rotation
JWT_SECRET_LAST_ROTATION=2025-10-23T00:00:00.000Z
JWT_SECRET_ROTATION_DAYS=30
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://superadmin.framtt.com,https://framtt-superadmin.netlify.app

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@framtt.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
IMPERSONATION_RATE_LIMIT_MAX=10

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=your_session_secret
CSRF_SECRET=your_csrf_secret

# Feature Flags
ENABLE_IMPERSONATION=true
ENABLE_AUDIT_LOGGING=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Monitoring
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log

# External Services
ANALYTICS_API_KEY=your_analytics_key
PAYMENT_GATEWAY_KEY=your_payment_key
```

---

## 🚀 Deployment Setup

### Development Environment
```bash
# Install dependencies
npm run install:all

# Start development servers (concurrently)
npm run dev

# Or start separately:
npm run frontend:dev  # Vite dev server on :5173
npm run backend:dev   # Nodemon on :5000
```

### Build for Production
```bash
# Frontend build
npm run frontend:build  # Output: frontend/dist/

# Backend (no build needed, runs on Node.js)
npm run backend:start
```

### Deployment Platforms

#### Frontend Deployment Options
1. **Vercel** (Recommended)
   - Config: `vercel.json`, `vite.config.vercel.js`
   - Auto-deploy from Git
   - Serverless functions support

2. **Netlify**
   - Config: `netlify.toml`
   - CI/CD pipeline
   - Environment variables in dashboard

3. **Traditional Hosting**
   - Build with `npm run frontend:build`
   - Serve `frontend/dist/` with Nginx/Apache

#### Backend Deployment Options
1. **Railway** (Recommended for Node.js)
   - One-click PostgreSQL database
   - Auto-deploy from Git
   - Environment variables

2. **Heroku**
   - Procfile: `web: cd backend && npm start`
   - Add PostgreSQL addon
   - Config vars in dashboard

3. **VPS (DigitalOcean, AWS, etc.)**
   - PM2 for process management
   - Nginx reverse proxy
   - SSL with Let's Encrypt

#### Database Deployment
- **Supabase** (Current setup)
  - Managed PostgreSQL
  - Built-in authentication (optional)
  - Real-time subscriptions
  - Row-level security
  - Automatic backups

### Deployment Checklist
- [ ] Set all environment variables
- [ ] Update ALLOWED_ORIGINS for CORS
- [ ] Run database migrations
- [ ] Test database connectivity
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test authentication flow
- [ ] Verify rate limiting
- [ ] Test API endpoints
- [ ] Check security headers
- [ ] Enable production logging
- [ ] Set up error tracking (Sentry, etc.)

---

## 📊 Project Status

### ✅ Implemented Features
1. ✅ Complete authentication system with JWT
2. ✅ Role-based access control (4 roles)
3. ✅ User management with CRUD operations
4. ✅ Account/tenant management
5. ✅ CSM assignment system
6. ✅ User-to-account assignment
7. ✅ Impersonation system with audit trail
8. ✅ Invite & onboarding system
9. ✅ Account health monitoring with alerts
10. ✅ Dashboard with KPIs and analytics
11. ✅ Payment & billing management
12. ✅ System monitoring and health checks
13. ✅ Integration snippet management
14. ✅ Notification system
15. ✅ Comprehensive audit logging
16. ✅ Rate limiting on all sensitive endpoints
17. ✅ Security headers and input validation
18. ✅ Responsive UI with 45+ components
19. ✅ API client with error handling
20. ✅ Database schema with migrations

### 🚧 Partially Implemented
- Vehicle management (backend ready, frontend basic)
- Email notifications (service ready, templates needed)
- PDF report generation (library installed, templates needed)

### 📋 Not Implemented
- Two-factor authentication (2FA)
- Password reset via email flow
- Real-time notifications (WebSocket/SSE)
- Advanced analytics and reporting
- Mobile application
- API documentation (Swagger/OpenAPI)
- Automated testing (unit & integration tests)
- CI/CD pipeline
- Docker containerization
- Kubernetes orchestration

---

## 🔑 Key Design Decisions

### Architecture Decisions
1. **Monorepo Structure:** Single repository with frontend, backend, and database
2. **JWT Authentication:** Stateless authentication with refresh token rotation
3. **Role Hierarchy:** Clear permission levels (SuperAdmin > Admin > CSM > User)
4. **Multi-Tenancy:** Account-based isolation for data scoping
5. **Impersonation:** Built-in for support and troubleshooting
6. **PostgreSQL:** Relational database for complex relationships
7. **Supabase:** Managed PostgreSQL with additional features

### Technology Decisions
1. **React + TypeScript:** Type safety and modern React practices
2. **Vite:** Fast build tool and development server
3. **Tailwind CSS:** Utility-first CSS for rapid UI development
4. **shadcn/ui:** Accessible, customizable component library
5. **Express.js:** Lightweight, flexible Node.js framework
6. **JWT + Bcrypt:** Industry-standard security
7. **Joi:** Schema-based validation
8. **Rate Limiting:** Protection against abuse and DDoS

### Security Decisions
1. **JWT in localStorage:** Trade-off for simplicity (consider httpOnly cookies for higher security)
2. **Rate Limiting:** Multiple tiers based on endpoint sensitivity
3. **Impersonation Logging:** Complete audit trail for accountability
4. **Password Hashing:** Bcrypt with 10 rounds
5. **CORS Whitelist:** Explicit origin control
6. **Security Headers:** Helmet.js for common vulnerabilities

---

## 📈 Scalability Considerations

### Current Limitations
- Single database connection (no pooling configured)
- In-memory token blacklist (will reset on restart)
- No caching layer (Redis recommended)
- No load balancing configuration
- No CDN for static assets

### Recommended Improvements for Scale
1. **Database:**
   - Implement connection pooling
   - Add read replicas for queries
   - Set up automated backups
   - Configure database indexes

2. **Caching:**
   - Redis for session management
   - Cache frequently accessed data
   - Implement cache invalidation strategy

3. **Performance:**
   - CDN for frontend assets
   - Image optimization
   - API response compression
   - Lazy loading for components

4. **Monitoring:**
   - Application performance monitoring (APM)
   - Error tracking (Sentry)
   - Log aggregation (ELK stack)
   - Uptime monitoring

5. **Infrastructure:**
   - Horizontal scaling with load balancer
   - Containerization (Docker)
   - Orchestration (Kubernetes)
   - Auto-scaling policies

---

## 📝 Development Workflow

### Getting Started
1. Clone repository
2. Install dependencies: `npm run install:all`
3. Set up environment variables
4. Run database migrations
5. Start development servers: `npm run dev`
6. Access frontend at http://localhost:5173
7. API available at http://localhost:5000

### Code Organization
- **Frontend:** Feature-based component organization
- **Backend:** Layered architecture (routes → controllers → services → database)
- **Database:** Version-controlled SQL migrations

### Best Practices
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting (recommended)
- Git hooks for pre-commit validation (recommended)
- Semantic commit messages (recommended)

---

## 📞 Support & Documentation

### Additional Documentation
- `/README.md` - Project overview and quick start
- `/docs/PROJECT_OVERVIEW.md` - Detailed architecture and flow
- `/database/README.md` - Database schema documentation
- `/backend/README.md` - Backend API documentation
- `/frontend/README.md` - Frontend component documentation

### Key Contacts
- **Project:** Framtt Superadmin Dashboard
- **Team:** Framtt Team
- **License:** MIT

---

**Document Generated:** October 23, 2025  
**Version:** 1.0.0  
**Status:** Current Production Configuration

---

## 🎯 Next Steps for Development

### Immediate Priorities
1. Complete vehicle management frontend
2. Implement email notification templates
3. Add unit and integration tests
4. Create API documentation (Swagger)
5. Set up CI/CD pipeline
6. Implement password reset flow
7. Add two-factor authentication

### Future Enhancements
1. Real-time notifications with WebSocket
2. Advanced analytics dashboard
3. Mobile application (React Native)
4. API rate limiting per user
5. Advanced reporting with PDF export
6. Data export/import functionality
7. Multi-language support (i18n)
8. Dark mode theme
9. Advanced search and filtering
10. Activity feed with real-time updates

---

*This document provides a complete snapshot of your current codebase configuration. Use it as a reference for onboarding, development planning, and architecture decisions.*
