## Framtt Superadmin — Full Project Overview

This document explains the system architecture, file structure, how the frontend, backend, and Supabase pieces connect, and the detailed workflows for authentication, role-based access, impersonation, and account assignments.

---

### High-Level Architecture

- **Frontend (React + Vite + TypeScript)**: A single-page app that authenticates via JWT, stores the access token in localStorage, and calls backend REST APIs under `/api`. Impersonation swaps the active JWT in the client to assume the target user.
- **Backend (Node.js + Express + PostgreSQL)**: Exposes REST APIs, enforces authentication/authorization with JWT, implements role hierarchy, impersonation, and data-access scoping. Uses a service layer for database queries.
- **Database (PostgreSQL)**: Core relational schema for users, roles, accounts, assignments, impersonation logs, audit logs, and metrics. SQL files under `database/` define tables, functions, and triggers.
- **Supabase**: Used for provisioning/setup scripts and optional client utilities. The backend can run setup scripts against a Supabase-hosted Postgres using the service role key. The frontend has a basic Supabase client scaffold for optional use cases.

### Technology Stack

#### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript 5.6.2
- **Build Tool**: Vite 5.4.9 for fast development and building
- **Styling**: Tailwind CSS 3.4.14 with custom design system
- **UI Components**: 
  - Radix UI primitives (complete set of accessible components)
  - shadcn/ui component library with consistent design tokens
  - Custom Figma-based components for brand consistency
- **Charts & Data Visualization**: Recharts 2.12.7 for dashboard analytics
- **Icons**: Lucide React 0.447.0 (comprehensive icon set)
- **Routing**: React Router DOM 6.28.0 with browser history
- **State Management**: React Context API for authentication and global state
- **Date Handling**: date-fns 3.6.0 and react-day-picker 8.10.1
- **Additional Libraries**:
  - CMDK for command palette functionality
  - Embla Carousel for image/content carousels
  - Sonner for toast notifications
  - Vaul for mobile-friendly drawers

#### Backend Stack
- **Framework**: Node.js with Express 4.18.2
- **Database**: PostgreSQL with pg 8.16.3 driver
- **Authentication**: JWT with jsonwebtoken 9.0.2, bcrypt/bcryptjs for password hashing
- **Security**: 
  - Helmet 7.2.0 for security headers
  - express-rate-limit 7.1.5 for API protection
  - CORS 2.8.5 for cross-origin requests
- **Validation**: Joi 17.11.0 for request validation
- **Logging**: Morgan 1.10.0 for HTTP request logging
- **External Services**: Supabase JS 2.55.0, Axios 1.11.0 for HTTP clients
  - Development**: Nodemon 3.0.2, Jest 29.7.0 for testing

---

### Component Architecture & UI System

#### Frontend Component Structure
The frontend uses a sophisticated component architecture with three main layers:

**Core Application Components (`src/components/`):**
- `OverviewDashboard.tsx`: Main dashboard with KPI metrics, charts, and analytics
- `ClientManagement.tsx`: Complete client/tenant management interface
- `SystemMonitoring.tsx`: Real-time system health and performance monitoring
- `PaymentsBilling.tsx`: Revenue tracking and payment management
- `SnippetManager.tsx`: API integration code management and generation
- `AdminSettings.tsx`: Comprehensive user and system administration
- `UserManagement.tsx`: Advanced user administration with role assignments
- `AccountHealth.tsx`: Account health monitoring and alert management
- `LoginPage.tsx`: Secure authentication interface with JWT handling
- `NotFound.tsx`: 404 error handling with navigation recovery
- `ProtectedRoute.tsx`: Route guards with role-based access control
- `BreadcrumbNavigation.tsx`: Dynamic navigation breadcrumbs

**Impersonation System Components:**
- `ImpersonationBanner.tsx`: Persistent banner showing active impersonation state
- `ImpersonationDialog.tsx`: Secure impersonation initiation with audit logging
- `ImpersonationHistory.tsx`: Complete audit trail of impersonation sessions

**UI Component Library (`src/components/ui/`):**
Complete shadcn/ui implementation with 40+ components:
- Form controls: `button.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`
- Layout: `card.tsx`, `sheet.tsx`, `tabs.tsx`, `accordion.tsx`, `collapsible.tsx`
- Navigation: `menubar.tsx`, `navigation-menu.tsx`, `breadcrumb.tsx`, `pagination.tsx`
- Feedback: `alert.tsx`, `progress.tsx`, `skeleton.tsx`, `sonner.tsx` (toasts)
- Data display: `table.tsx`, `chart.tsx`, `avatar.tsx`, `badge.tsx`
- Overlays: `dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `hover-card.tsx`

**Figma Design Components (`src/components/figma/`):**
Custom components based on Figma design specifications for brand consistency.

#### Routing System
- **Browser History Support**: Full back/forward navigation with React Router DOM 6.28.0
- **Direct URL Access**: All dashboard sections accessible via clean URLs
  - `/` - Overview Dashboard
  - `/clients` - Client Management
  - `/monitoring` - System Monitoring  
  - `/payments` - Payments & Billing
  - `/snippets` - Snippet Manager
  - `/settings` - Admin Settings
- **Dynamic Page Titles**: Context-aware browser tab titles
- **Breadcrumb Navigation**: Hierarchical navigation with current location highlighting
- **404 Handling**: Graceful error pages with navigation recovery options

---

### Backend Architecture & Services

#### Enhanced Controller Layer
The backend implements a comprehensive controller system:

**Core Controllers (`backend/controllers/`):**
- `authController.js`: JWT authentication, refresh tokens, impersonation management
- `userController.js` & `userController_enhanced.js`: User CRUD, profile management, role assignments
- `accountController.js`: Account management with CSM assignment scoping
- `accountHealthController.js`: Health monitoring, scoring, and alert management
- `adminController.js`: System administration and configuration management
- `assignmentController.js`: CSM-Account assignment logic and validation
- `auditController.js`: Comprehensive audit logging and trail management
- `clientController.js`: Client/tenant management and configuration
- `dashboardController.js`: KPI metrics, analytics, and reporting
- `notificationController.js`: Real-time notifications and alert system
- `roleController.js`: Role hierarchy management and permissions
- `vehicleController.js`: Fleet and booking management system

#### Service Layer Architecture
Advanced service layer with specialized modules:

**Database Services (`backend/services/database.js`):**
- `userService`: User CRUD, authentication, CSM-scoped queries, profile management
- `accountService`: Account management, statistics, and relationship handling
- `csmAssignmentService`: CSM-Account assignment validation and management
- `userAccountService`: User-Account relationship management
- `impersonationService`: Session management, audit logging, state tracking
- `tokenService`: Refresh token lifecycle, blacklist management
- `auditService`: Comprehensive audit trail and compliance logging

#### Security & Middleware
**Enhanced Security Stack:**
- `middleware/security.js`: Security headers, JWT secret rotation, CSRF protection
- `middleware/rateLimiting.js`: Granular rate limiting for sensitive endpoints
- `middleware/auth.js`: Multi-layer authentication with impersonation awareness
- `middleware/errorHandler.js`: Centralized error handling with security considerations

**Development Tools (`backend/tools/`):**
- `generate-password.js`: Cryptographically secure password generation
- `jwt-rotate.js`: Automated JWT secret rotation for enhanced security

---

### Account Health Monitoring System

#### Real-time Health Tracking
Comprehensive account health monitoring with automated scoring:

**Health Metrics:**
- Account activity and engagement tracking
- Performance indicators and trend analysis
- Integration status and API usage monitoring
- User adoption and feature utilization metrics

**Alert Management:**
- Configurable health score thresholds
- Automated alert generation and escalation
- Alert acknowledgment and resolution tracking
- Trend-based predictive alerting

**Supabase Integration:**
- Real-time health data synchronization
- Historical trend analysis and reporting
- Performance metrics aggregation

---

### Development Workflow & Scripts

#### Automation Scripts
**Development Environment (`scripts/`):**
- `dev-windows.bat`: Complete Windows development environment setup
- `start.sh` / `start.bat`: Cross-platform application startup with environment validation
- `deploy.sh` / `deploy.bat`: Automated deployment with environment-specific configurations

**Maintenance Scripts (`scripts/maintenance/`):**
- `complete-user-credentials.js`: User credential management and password reset utilities
- `get-all-users.js`: User data retrieval and management
- `get-users-passwords.js`: Password management utilities
- `setup-test-authorization-data.js`: Test data setup for authorization testing
- Database maintenance and optimization scripts
- System health checks and diagnostic tools

**Database Scripts (`scripts/db/`):**
- `create-audit-table.js`: Audit table creation and configuration

**Backend Setup Scripts:**
- `backend/complete-role-setup.js`: Automated role hierarchy configuration
- `backend/setup-assignment-tables.js`: CSM assignment table provisioning
- `backend/setup-role-hierarchy.js`: Role hierarchy setup for regular PostgreSQL
- `backend/setup-role-hierarchy-supabase.js`: Role hierarchy setup for Supabase
- `framtt-complete-system-verification.js`: End-to-end system verification

#### Testing & Verification
**Comprehensive Testing Suite:**
- API endpoint verification and authorization testing
- Authentication flow validation
- Role-based access control verification
- Database integrity and constraint validation

---

### Deployment Architecture

#### Multi-Platform Deployment Support
**Render.com Configuration (`render.yaml`):**
- Node.js backend with automatic scaling
- Environment variable management
- Database connection with SSL support
- Production-ready configuration

**Alternative Deployment Options:**
- **Vercel**: Frontend deployment with serverless functions
- **Netlify**: Static site deployment with form handling
- **Docker**: Containerized deployment with `deployment/docker/`
- **Custom**: Nginx reverse proxy configuration

#### Environment Management
**Frontend Environment Variables:**
- Vite-based configuration with `VITE_` prefix
- Supabase project configuration
- API endpoint configuration
- Feature flag management

**Backend Environment Variables:**
- Database connection strings with SSL support
- JWT configuration and secret management
- Supabase service role integration
- CORS and security configuration
- Rate limiting and timeout settings

---

### Design System & User Experience

#### Comprehensive Design System
**Tailwind CSS Integration:**
- Custom design tokens and color system
- Responsive breakpoints for desktop, tablet, mobile
- Typography scale and spacing system
- Animation and transition library

**Accessibility Standards:**
- WCAG 2.1 AA compliance with Radix UI primitives
- Keyboard navigation support
- Screen reader optimization
- High contrast mode support

**Design Specifications:**
- Figma component library integration
- Design token consistency across components
- Component usage guidelines and best practices

---

### Repository Structure (What each area does)

- `backend/`
  - `server.js`: Bootstraps Express, security middleware, CORS, routes, and error handling; tests DB connectivity on startup.
  - `routes/`: Express routers mounted under `/api/*` (auth, users, accounts, account health, etc.).
  - `controllers/`: Request handlers implementing business logic (auth, users, accounts, impersonation, etc.).
  - `middleware/`: JWT verification, role checks, security headers, rate limiting, and error handling.
  - `services/`: Database access layer and utility services (e.g., `database.js` encapsulates all SQL queries via `pg`).
  - `config/`: Environment-specific DB config.
  - `scripts/` and root `scripts/`: Setup and maintenance utilities (DB check, role hierarchy setup, rotate JWT secret, etc.).
  - `utils/logger.js`: Structured server logging + morgan integration.
  - `tools/`: Security and maintenance utilities:
    - `generate-password.js`: Secure password generation
    - `jwt-rotate.js`: JWT token rotation
  - `data/`: Mock data and test fixtures (`mockData.js`)
  - `logs/`: Application logs directory

- `frontend/`
  - `src/contexts/AuthContext.tsx`: Centralized auth state, token load/save, impersonation switching, and profile refresh.
  - `src/lib/api.ts`: API client wrapper with automatic Authorization header and helpers for auth, users, accounts, dashboard, audit, and account health.
  - `src/components/`: Core application components:
    - `OverviewDashboard.tsx`: Main dashboard with metrics and charts
    - `ClientManagement.tsx`: Client/tenant management interface
    - `SystemMonitoring.tsx`: System health and monitoring
    - `PaymentsBilling.tsx`: Revenue and payment management
    - `SnippetManager.tsx`: Integration code management
    - `AdminSettings.tsx`: User and system administration
    - `LoginPage.tsx`: Authentication interface
    - `NotFound.tsx`: 404 error handling
    - `ImpersonationBanner.tsx`, `ImpersonationDialog.tsx`, `ImpersonationHistory.tsx`: Impersonation UI
    - `UserManagement.tsx`: User administration
    - `AccountHealth.tsx`: Account health monitoring
    - `ProtectedRoute.tsx`: Route guards
    - `BreadcrumbNavigation.tsx`: Navigation breadcrumbs
  - `src/components/ui/`: Complete shadcn/ui component library (40+ components)
  - `src/components/figma/`: Components from Figma designs
  - `src/utils/supabase/client.ts`: Supabase client initialization for optional frontend usage.

- `database/`: Authoritative SQL schema and setup (tables, functions, triggers, views, and sample data).
  - Key files: `01_create_users_table.sql`, `02_create_clients_table.sql`, `09_create_assignment_tables.sql`, `10_enhanced_schema_for_impersonation.sql`, `08_create_functions_and_triggers.sql`, `11_sample_data.sql`.

- `scripts/`: Development and deployment automation
  - `dev-windows.bat`: Windows development environment
  - `start.sh`, `start.bat`: Cross-platform startup scripts
  - `deploy.sh`, `deploy.bat`: Deployment scripts
  - `maintenance/`: User credential management scripts

- `deployment/`: Deployment configurations
  - `docker/`: Container configurations
  - `netlify.toml`: Netlify deployment settings
  - `vercel.json`: Vercel deployment configuration
  - `nginx.conf`: Nginx reverse proxy configuration

- `supabase/`: Supabase edge functions scaffold (`functions/server/`) for future extensions.

- `tools/`: Development and maintenance utilities (currently empty, tools moved to `backend/tools/`)

- Configuration files:
  - `render.yaml`: Render.com deployment configuration
  - `package.json`: Root project configuration
  - Environment examples: `backend/env.example`, `frontend/env.production.example`

---

### How the Backend Is Wired

- Route mounting in `backend/server.js` (selected):
  - `/api/auth` → `routes/authRoutes.js`
  - `/api/users` → `routes/userRoutes.js`
  - `/api/accounts` → `routes/accountRoutes.js`
  - `/api/dashboard` → `routes/dashboardRoutes.js`
  - `/api/account-health` → `routes/accountHealthRoutes.js`
  - Additional: vehicles, clients, admin, notifications, audit, roles

- Security & middlewares:
  - `middleware/security.js`: Security headers and JWT secret rotation utilities.
  - `middleware/rateLimiting.js`: Granular rate-limiters for sensitive endpoints (auth, impersonation, admin ops).
  - `middleware/auth.js`: `verifyToken`, `requireRole`, `requireAdmin`, `requireCSMOrAbove`, impersonation-aware access checks, and request context (`req.user`).
  - `middleware/errorHandler.js`: Centralized error responses.

- Database access:
  - `services/database.js`: Creates a `pg` pool, exposes services:
    - `userService`: CRUD, authentication helpers, user listings, last login updates, CSM-scoped queries.
    - `accountService`: Accounts CRUD and stats (and related lookups).
    - `csmAssignmentService` / `userAccountService`: Relationship management between CSMs, users, and accounts.
    - `impersonationService`: Start/End sessions, set `is_impersonation_active`, write to `impersonation_logs`.
    - `tokenService` / `auditService`: Refresh token persistence and audit logging.

---

### Authentication & Sessions

- Login flow (`POST /api/auth/login` in `controllers/authController.js`):
  1. Validate email/password; fetch user by email via `userService.findByEmail`.
  2. Verify `status === 'active'` and password with bcrypt.
  3. Issue an access token (JWT) with claims: `id`, `email`, `role`, `fullName`, `jti`, `type='access'`, `iat`, `exp`.
  4. Create a random `refreshToken`, set as httpOnly cookie, and persist its SHA-256 hash via `tokenService.store` (7 days by default).
  5. Return `{ accessToken, user, refreshToken? }` to the client; frontend stores the access token in `localStorage`.

- Access token verification (`middleware/auth.js`):
  - Extracts `Bearer` token; verifies via `jwtSecretManager.verifyToken(...)`.
  - Rejects blacklisted tokens (`tokenBlacklist.isBlacklisted(decoded.jti)`), checks required claims, and confirms the user is still active.
  - Attaches `req.user` with impersonation-aware context (`is_impersonation`, `impersonator_id`, `impersonated_user_id`, `session_id`).

- Refresh (`POST /api/auth/refresh`):
  - Validates the httpOnly refresh cookie, rotates access token, persists refresh token as needed.

Frontend token handling (`src/lib/api.ts`, `src/contexts/AuthContext.tsx`):

- Token saved to `localStorage` under `auth_token` after successful login.
- All API calls include `Authorization: Bearer <token>`.
- On app load, `AuthContext` decodes JWT, validates expiration, fetches `/auth/me` to populate profile, and sets session state.

---

### Role Hierarchy & Access Control

Roles: `superadmin`, `admin`, `csm`, `user`.

- Gatekeeping in `middleware/auth.js`:
  - `requireRole([...])`, `requireAdmin`, `requireCSMOrAbove`, `requireSuperAdmin` guard routes.
  - During impersonation, effective role checks use the impersonator’s role to prevent privilege escalation.
  - Resource-level checks like `checkAccountAccess` and `checkCSMUserAccess` enforce account scoping.

Examples:

- CSM hitting `/api/accounts`: only accounts assigned to that CSM are returned.
- CSM hitting `/api/users/:id`: allowed only if the user belongs to an account assigned to that CSM (and only for regular users).
- Admin: full access to accounts and users; can assign CSMs and start impersonation.
- Superadmin: unrestricted access.

---

### Impersonation Logic

Purpose: Allow Admins/Superadmins to assume another user’s identity for troubleshooting.

Rules:
- Only `superadmin` and `admin` can impersonate.
- Admin may impersonate `csm` and `user` (not `admin` or `superadmin`).
- Superadmin can impersonate anyone.
- Cannot impersonate yourself or a user already being impersonated.

Backend flow (`POST /api/auth/impersonate/start`):
1. Verify initiator’s role and scope. Deny with an audit log if not allowed.
2. Generate a `sessionId` and write an active record to `impersonation_logs` via `impersonationService.start(...)`. Mark target user as `is_impersonation_active`.
3. Issue a special JWT (`type='impersonation'`) embedding `impersonator_id`, `impersonated_user_id`, `session_id`, `is_impersonation`, and a short expiry (default 1h).
4. Return the impersonation token and target user profile.

Frontend flow:
1. Call `apiClient.startImpersonation(...)`; on success, save returned `impersonationToken` as the active token.
2. Update `AuthContext` to set `isImpersonating=true` and session state to the target user.
3. All subsequent API requests are authorized using the impersonation JWT.
4. To stop, call `POST /api/auth/impersonate/stop`; server ends the session and logs it; client clears the token and session.

Audit:
- All impersonation attempts, approvals, starts, and ends are logged with timestamp, IP, user agent, and involved user IDs.

---

### User & Account Assignment Logic

- Each CSM manages a set of customer accounts (many-to-many via `csm_assignments`).
- Each end user belongs to an account (many-to-one via `user_accounts`).
- Admins/Superadmins can assign CSMs to accounts and manage user-account links.
- Middlewares consult these relationships to allow/deny resource access.

---

### Database Schema (Simplified)

Core tables (defined across `database/*.sql`):

- `users`
  - `id` (PK, UUID or bigint depending on setup), `email`, `password_hash`, `full_name`, `role`, `status`, timestamps
  - Flags for impersonation state: `is_impersonation_active`, `current_impersonator_id`

- `accounts`
  - `id` (PK), `name`, `status`, plan fields and timestamps

- `csm_assignments`
  - `csm_id` (FK → users), `account_id` (FK → accounts)

- `user_accounts`
  - `user_id` (FK → users), `account_id` (FK → accounts)

- `impersonation_logs`
  - `id` (PK), `impersonator_id`, `impersonated_id`, `session_id`, `reason`, `ip_address`, `user_agent`, `start_time`, `end_time`, `is_active`

- `refresh_tokens`
  - `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`

- `audit_logs`
  - `id`, `user_id`, `action`, `resource_type`, `resource_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`

Additional tables cover vehicles, notifications, dashboard metrics, system logs, and views/functions defined in accompanying SQL.

---

### Key Backend Endpoints

Auth (`/api/auth`):
- `POST /login` — Authenticate and return `{ accessToken, user }`.
- `POST /refresh` — Issue a fresh access token using refresh cookie.
- `GET /me` — Return the authenticated user profile.
- `POST /logout` — Invalidate tokens (blacklist `jti` and/or revoke refresh tokens).
- `PUT /change-password` — Change the current user’s password.
- `POST /impersonate/start` — Start an impersonation session (Admin/Superadmin; extra checks).
- `POST /impersonate/stop` — End impersonation (requires impersonation token).
- `GET /impersonate/active` — List active sessions (Admin/Superadmin).
- `GET /impersonate/history` — Paginated history (Admin/Superadmin).

Users (`/api/users`):
- `PUT /profile` — Update profile (any authenticated user).
- `GET /stats` — User statistics (Admin/Superadmin).
- `POST /` — Create user (Admin/Superadmin).
- `GET /:id` — Get user details; CSM must have account overlap with target user.
- `PUT /:id` — Update user; Admin or authorized manager only.
- `DELETE /:id` — Delete user (Admin/Superadmin).

Accounts (`/api/accounts`):
- `GET /` — List accounts; CSM/Admin/Superadmin; CSM limited to assignments.
- `POST /` — Create account (Admin/Superadmin).
- `GET /:id` — Get account; scoping enforced.
- `GET /:id/users` — Users under an account; scoping enforced.

Account Health (`/api/account-health`):
- `GET /overview`, `GET /scores`, `GET /alerts`, `POST /alerts/:id/acknowledge`, `POST /alerts/:id/resolve`, `POST /refresh-scores` (auth required; specific role checks may apply per action).

---

### Frontend Authentication & Impersonation

- `src/lib/api.ts`:
  - Stores token in `localStorage` (`auth_token`).
  - Adds `Authorization` header for requests.
  - Implements helpers: `login`, `logout`, `refreshToken`, `getMe`, impersonation endpoints, users/accounts/audit/account-health methods.

- `src/contexts/AuthContext.tsx`:
  - On init: loads token, decodes JWT, checks expiry, fetches `/auth/me`, and sets `session`.
  - `signIn(email, password)`: calls API, saves token, sets `session`.
  - `startImpersonation(targetUserId, reason)`: calls API, replaces token with impersonation JWT, switches `user`/`userProfile`, sets `isImpersonating=true`.
  - `stopImpersonation()`: calls API to end session, clears token and session (user must log in again or refresh session).

UI components under `src/components/` reflect these capabilities (ImpersonationBanner/Dialog/History, Admin/User management pages, ProtectedRoute guards, etc.).

---

### Supabase Integration

- Backend setup scripts can target a Supabase-hosted Postgres using the service role key:
  - `backend/setup-assignment-tables.js`: Reads `database/09_create_assignment_tables.sql` and executes statements via Supabase client (service key) to provision assignment tables.
  - Additional setup scripts exist for role hierarchy and tables (`backend/setup-role-hierarchy*.js`, `backend/create-assignment-tables*.js`).

- Frontend Supabase client (`src/utils/supabase/client.ts`):
  - Initializes a Supabase JS client from configured project ID and anon key for optional UI needs.

- Supabase edge functions scaffold under `supabase/functions/server/` can be used for serverless extensions if desired.

---

### Security Considerations

- Password hashing: bcrypt with configurable rounds.
- JWT: issuer/audience claims set; secret rotation supported; token blacklist for revocation; short-lived impersonation tokens.
- Refresh tokens: httpOnly cookies; stored hashed server-side; revocation on password change.
- Rate limiting: applied to auth, impersonation, and other sensitive routes.
- Input sanitization and security headers via Helmet and custom middleware.
- Role checks on every protected endpoint; impersonation-aware effective role enforcement.
- Audit logging of logins, impersonation actions, password changes, and admin operations.

---

### Typical Workflows

Login & Authentication
1. Frontend posts credentials to `/api/auth/login`.
2. Backend verifies credentials; issues access token; sets refresh cookie; logs success.
3. Frontend saves token, fetches `/api/auth/me`, and renders the dashboard.
4. On expiry, frontend can call `/api/auth/refresh` to rotate the access token.

Impersonation
1. Admin/Superadmin triggers impersonation with target user ID.
2. Backend validates role and target; starts a session and issues an impersonation JWT.
3. Frontend swaps token and UI context to the target user.
4. When stopping, backend ends the session and logs it; frontend clears token.

Role-Based Data Access
- CSMs only see accounts and users they manage based on `csm_assignments` and `user_accounts` joins.
- Admin/Superadmin bypass these scopes.

---

- Environment & Deployment

- Required env vars (selection): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, `DB_SSL`, `JWT_SECRET`, `JWT_EXPIRE`, `IMPERSONATION_TIMEOUT_HOURS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`.
- Development: Run backend Express server, frontend Vite dev server, and a local or Supabase Postgres.
- Deployment: Provide secure secrets, enable SSL for DB connections, rotate JWT secret regularly (see `backend/tools/jwt-rotate.js`), and configure allowed origins.

#### Complete Environment Configuration

**Frontend Environment Variables (Vite-based):**
- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_ENVIRONMENT`: Development/staging/production flag
- `VITE_DEMO_MODE`: Enable demo mode for development

**Backend Environment Variables:**
- Database: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`
- Authentication: `JWT_SECRET`, `JWT_EXPIRE`, `REFRESH_TOKEN_SECRET`, `IMPERSONATION_TIMEOUT_HOURS`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Security: `ALLOWED_ORIGINS`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`
- Server: `PORT`, `NODE_ENV`

#### Deployment Configurations

**Render.com (`render.yaml`):**
- Automated Node.js backend deployment
- Environment variable synchronization
- SSL database connections
- Production scaling and monitoring

**Alternative Platforms:**
- **Vercel**: Serverless deployment for frontend and API routes
- **Netlify**: Static site deployment with edge functions
- **Docker**: Container-based deployment with `deployment/docker/`
- **Self-hosted**: Nginx reverse proxy configuration

---

### Complete Technology Specifications

#### Frontend Dependencies (Key Packages)
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.28.0", 
  "typescript": "~5.6.2",
  "vite": "^5.4.9",
  "tailwindcss": "^3.4.14",
  "@radix-ui/react-*": "Latest versions",
  "recharts": "^2.12.7",
  "lucide-react": "^0.447.0",
  "sonner": "^1.7.4"
}
```

#### Backend Dependencies (Key Packages)
```json
{
  "express": "^4.18.2",
  "pg": "^8.16.3",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "helmet": "^7.2.0",
  "express-rate-limit": "^7.1.5",
  "cors": "^2.8.5",
  "@supabase/supabase-js": "^2.55.0"
}
```

---

### Where to Look in the Code

- Server bootstrap: `backend/server.js`
- Routes: `backend/routes/*.js`
- Controllers: `backend/controllers/*.js`
- Auth & JWT: `backend/controllers/authController.js`, `backend/middleware/auth.js`, `backend/middleware/security.js`
- Services/DB: `backend/services/database.js`
- Frontend auth: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/lib/api.ts`
- Supabase client (frontend): `frontend/src/utils/supabase/client.ts`
- Database DDL: `database/*.sql`


