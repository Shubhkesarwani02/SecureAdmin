## Framtt Superadmin — End-to-End Implementation Guide (Supabase Postgres)

This document explains the system from scratch: architecture, database schema (on Supabase Postgres), backend APIs, authentication and authorization flows, impersonation, frontend integration, security, and runnable examples.

### What you’re building
- A secure multi-tenant Superadmin/Admin portal for managing accounts, users, assignments, and system health.
- Roles: `superadmin`, `admin`, `csm`, `user` with strict hierarchy and scope-based data access.
- Secure authentication with JWT access tokens + httpOnly refresh tokens; impersonation with short-lived tokens and full audit logging.

### Architecture (high level)
```mermaid
flowchart LR
  subgraph Frontend [React (Vite)]
    A[AuthContext]-- stores token -->LS[LocalStorage]
    A-- REST calls --> APIClient
  end
  subgraph Backend [Node/Express]
    API[Routes & Controllers]
    MW[Auth & RBAC Middleware]
    SVC[Services: users, accounts, assignments, audit, tokens]
    SEC[Security: JWT rotation, blacklist, rate limits, headers]
  end
  DB[(Supabase Postgres)]

  APIClient-->API
  API-->MW
  MW-->SVC
  SVC-->DB
```

Notes:
- Supabase is used as a managed Postgres database. We are not using Supabase Auth for login. The app issues its own JWTs.
- The frontend stores the access token in `localStorage` and attaches it to `Authorization: Bearer <token>` for API calls.
- Refresh tokens are httpOnly cookies managed by the backend.

For a deeper, step-by-step guide (including Windows quick-start scripts, Postman setup, verification scripts, and deployment playbooks), see `docs/END_TO_END_IMPLEMENTATION_DETAILED.md`.

---

## 1) Prerequisites

- Supabase project (online). From Supabase dashboard:
  - Get your Database connection string (URI) and project reference (project ID).
  - Ensure SQL editor access to run schema scripts.
- Node.js 18+ and npm.

---

## 2) Environment configuration

Create a `.env` file in `backend/` with your Supabase DB and security secrets. Example:

```env
# Server
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Supabase Postgres (preferred single var)
DATABASE_URL=postgresql://postgres:<YOUR_DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
DB_SSL=true

# Alternatively (if not using DATABASE_URL)
# DB_HOST=db.<PROJECT_REF>.supabase.co
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres
# DB_PASSWORD=<YOUR_DB_PASSWORD>
# DB_SSL=true

# Auth & Security
JWT_SECRET=<strong-long-random-secret>
JWT_PREVIOUS_SECRET=
JWT_SECRET_LAST_ROTATION=2025-01-01T00:00:00.000Z
JWT_SECRET_ROTATION_DAYS=30
BCRYPT_ROUNDS=12
```

Frontend Supabase client (for DB utilities only) is configured in `frontend/src/utils/supabase/info.tsx`. It contains:
```ts
export const projectId = "<PROJECT_REF>"
export const publicAnonKey = "<ANON_KEY>"
```

If you rotate keys or change the project, update these values.

---

## 3) Database schema (run on Supabase)

Use the Supabase SQL editor and run the enhanced schema script:

- Recommended: `database/10_enhanced_schema_for_impersonation.sql`
  - Creates: `users`, `accounts`, `csm_assignments`, `user_accounts`, `impersonation_logs`, `audit_logs`, `refresh_tokens`
  - Adds indexes, helper functions for RBAC checks, and triggers
  - Includes sample data for quick testing

Tables overview (selected fields):
- `users`: id (uuid), email, password_hash, full_name, role, department, status, preferences, last_login, is_impersonation_active, current_impersonator_id, timestamps
- `accounts`: id, name, company_name, email, subscription_plan/status, integration_code, metrics, status, timestamps
- `csm_assignments`: csm_id, account_id, is_primary, assigned_by, timestamps
- `user_accounts`: user_id, account_id, role_in_account, assigned_by, timestamps
- `impersonation_logs`: impersonator_id, impersonated_id, session_id, is_active, reason, ip_address, user_agent, actions_performed, timestamps
- `audit_logs`: user_id, impersonator_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at
- `refresh_tokens`: user_id, token_hash, expires_at, is_revoked, timestamps

Note: Scripts include `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` which Supabase allows.

---

### Quick Start (Windows)

Use the provided scripts from project root for a fast local setup:

```bat
:: From project root
scripts\dev-windows.bat
```

This will:
- Start backend on port 5000 (expects `backend/.env` configured)
- Start frontend on port 5173

Alternatively, start services manually:

```bat
cd backend && npm install && npm run start
cd ..\frontend && npm install && npm run dev
```

## 4) Backend (Node/Express)

Entry: `backend/server.js`
- Security: Helmet + custom security headers, input sanitization, rate limiting (auth, impersonation, password change, admin ops), detailed logging.
- Routes mounted under `/api`:
  - `/auth` (login, refresh, me, logout, change-password, impersonation)
  - `/users` (listing, details, create/update/delete, CSM assignments)
  - `/accounts` (listing, details, create/update/delete, assign/remove CSM, account users, stats)
  - Plus dashboard, notifications, etc.

DB access: `backend/services/database.js` uses `pg` Pool and supports `DATABASE_URL` + SSL for Supabase.

### Authentication flow
- Login: `POST /api/auth/login`
  - Body: `{ email, password }`
  - Verifies password with bcrypt, checks `status === 'active'`.
  - Returns `accessToken` (JWT) in JSON and sets `refreshToken` cookie (httpOnly).
- Me: `GET /api/auth/me` requires `Authorization: Bearer <accessToken>`
- Refresh: `POST /api/auth/refresh` rotates refresh token (cookie) and returns new `accessToken`.
- Logout: `POST /api/auth/logout` revokes refresh token and clears cookie.

Token claims include: `id, email, role, fullName, jti, iat, type`, and impersonation claims when applicable.

Example (cURL):
```bash
curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@framtt.com","password":"password"}'
```

### Authorization & RBAC
Middleware in `backend/middleware/auth.js`:
- `verifyToken`: validates JWT, loads user, attaches `req.user`, logs API access.
- `requireRole([roles])`, `requireAdmin`, `requireSuperAdmin`.
- Context-aware checks for impersonation: effective role is the impersonator’s role.
- Resource guards:
  - `checkAccountAccess`: CSM only for assigned accounts, users only for their accounts; admin/superadmin full.
  - `canManageUser` and `checkCSMUserAccess`: enforce hierarchy for user management.

Role hierarchy: `superadmin > admin > csm > user`.

Other API groups available (see `backend/routes/*`):
- Clients: `/api/clients` (admin/superadmin)
- Vehicles: `/api/vehicles` (admin/superadmin)
- Dashboard, notifications, roles, and audit endpoints

### Impersonation
Endpoints in `backend/routes/authRoutes.js` and controller `authController.js`:
- Start: `POST /api/auth/impersonate/start` (admin/superadmin)
  - Body: `{ targetUserId, reason? }`
  - Validates role rules; creates session and returns `impersonationToken` + `sessionId`.
- Stop: `POST /api/auth/impersonate/stop`
- Active sessions: `GET /api/auth/impersonate/active`
- History: `GET /api/auth/impersonate/history`

Impersonation tokens carry `is_impersonation`, `impersonator_id`, `impersonated_user_id`, `session_id` and expire in 1h.

### Users and Accounts APIs
- Users: `backend/routes/userRoutes.js` (enhanced controller)
  - Admin/Superadmin can create/update/delete; CSM can list/manage within scope.
  - Stats endpoint for admins.
- Accounts: `backend/routes/accountRoutes.js`
  - CSM sees only assigned accounts; Admin/Superadmin see all.
  - Create/Update/Delete (soft delete by superadmin), assign/remove CSM, list account users.

Clients and Vehicles:
- Clients: `backend/routes/clientRoutes.js`
- Vehicles: `backend/routes/vehicleRoutes.js`

### Security
- Rate limiting by route category.
- Security headers and input sanitization.
- JWT secret rotation helper and token blacklist support.
- Audit logs for sensitive events (login, impersonation, rate-limit violations, admin actions).

JWT secret rotation:
```bash
node backend/scripts/rotate-jwt-secret.js
```

---

## 5) Frontend (React + Vite)

Auth context: `frontend/src/contexts/AuthContext.tsx`
- Stores `accessToken` via `apiClient` in `localStorage`.
- `signIn(email, password)`: calls `POST /api/auth/login`, sets session/user.
- `getMe()`: populates user profile on load.
- Impersonation helpers: `startImpersonation(targetUserId, reason?)`, `stopImpersonation()`.
- `ProtectedRoute` component: guards routes based on authentication and optional role requirement.

API client: `frontend/src/lib/api.ts`
- `VITE_API_URL` configurable; defaults to `http://localhost:5000/api`.
- Attaches `Authorization: Bearer <token>` when present.
- Methods for auth, users, accounts, dashboard, audit, account health.

Supabase client: `frontend/src/utils/supabase/client.ts`
- Used for direct Postgres utilities (not auth). Configure `projectId` and `publicAnonKey` in `info.tsx`.

Example: logging in from `LoginPage.tsx`
```tsx
const { signIn } = useAuth()
await signIn(email, password) // stores accessToken, loads profile
```

Protecting a route:
```tsx
<ProtectedRoute requiredRole="admin">
  <AdminSettings />
</ProtectedRoute>
```

Fetching accounts via API client:
```ts
const res = await apiClient.getAccounts({ page: 1, limit: 10 })
// CSM → only assigned accounts; Admin/Superadmin → all accounts
```

Postman collection (optional): import `Framtt_Superadmin_API_Collection.postman_collection.json` and environment `Framtt_Superadmin_Environment.postman_environment.json`. Set the `baseUrl` and auth variables as needed.

---

## 6) End-to-end flows

### A) Fresh setup (Supabase Postgres)
1) Create Supabase project → copy DB URI and project ref.
2) In Supabase SQL editor, run: `database/10_enhanced_schema_for_impersonation.sql`.
3) In `backend/.env`, set `DATABASE_URL` with `?sslmode=require`, `DB_SSL=true`, `JWT_SECRET`, etc.
4) Install and run backend:
```bash
cd backend
npm install
npm run start
```
5) Install and run frontend:
```bash
cd frontend
npm install
npm run dev
```

### B) Login → Read profile → List accounts
1) `POST /api/auth/login` with an existing user (see sample data in schema file).
2) Store `accessToken` (frontend does automatically).
3) `GET /api/auth/me` to load profile.
4) `GET /api/accounts` → CSM sees assigned; Admin/Superadmin sees all.

Sample cURL:
```bash
ACCESS_TOKEN=$(\
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@framtt.com","password":"password"}' | jq -r .data.accessToken)

curl -s http://localhost:5000/api/accounts \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

### C) Impersonation (admin → user)
1) Start:
```bash
curl -s -X POST http://localhost:5000/api/auth/impersonate/start \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"targetUserId":"<USER_UUID>","reason":"debug"}' | jq .
```
2) Use `data.impersonationToken` for subsequent calls while impersonating.
3) Stop:
```bash
curl -s -X POST http://localhost:5000/api/auth/impersonate/stop \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <IMPERSONATION_TOKEN>" \
  -d '{"sessionId":"<SESSION_ID>"}' | jq .
```

---

## 7) Role & access rules (summary)

- Superadmin:
  - Full access to all APIs and data; can impersonate anyone.
- Admin:
  - Full accounts/users (except superadmin/admin management restrictions); can impersonate `csm` and `user`.
- CSM:
  - Only assigned accounts; can manage `user` within those accounts.
- User:
  - Only own accounts/data.

These are enforced in `backend/middleware/auth.js` and by SQL relationships.

---

## 8) Security & audit

- Security headers, input sanitization, rate limiting (auth/impersonation/password/admin ops).
- JWT secret rotation helper (`middleware/security.js`).
- Token blacklist support.
- Comprehensive audit logging (`audit_logs`) for authentication, impersonation, rate-limit events, and admin operations.

---

## 9) Deployment notes

- Set `ALLOWED_ORIGINS` to your frontend origins (e.g., Netlify/Vercel URLs).
- Use environment variables (never commit secrets) for DB and JWTs.
- Ensure your Supabase connection string includes SSL (`?sslmode=require`) and set `DB_SSL=true`.
- Behind a proxy, make sure headers like `X-Forwarded-For` are preserved for accurate audit logs.

---

## 10) Troubleshooting

- Cannot connect to DB: Verify `DATABASE_URL`, password, and that SSL is required. Check backend logs for `Database connected successfully`.
- 401 Unauthorized: Ensure `Authorization: Bearer <token>` header; check token expiry; use `POST /api/auth/refresh`.
- 403 Forbidden: Role/permission check failed; see middleware rules and audit logs.
- Impersonation denied: Validate role hierarchy rules; target must be `active` and not already impersonated.
- CORS blocked: Add your frontend origin to `ALLOWED_ORIGINS`.

Verification scripts (from project root):
```bash
# Connectivity and schema
node test-basic-connectivity.js
node verify-database-schema.js

# Authentication and authorization
node test-login.js
node verify-authorization-logic.js
node final-authorization-verification.js

# Endpoints
node verify-api-endpoints.js
node test-api-integration.js

# Comprehensive
node final-comprehensive-verification.js
```

---

## 11) Key files (reference)

- Backend
  - `backend/server.js` — app setup, security, routes
  - `backend/middleware/auth.js` — JWT, RBAC, resource guards
  - `backend/controllers/authController.js` — login/refresh/me/logout/impersonation
  - `backend/services/database.js` — Postgres pool and services
  - `backend/routes/*` — route wiring

- Frontend
  - `frontend/src/contexts/AuthContext.tsx` — session, impersonation helpers
  - `frontend/src/lib/api.ts` — API client
  - `frontend/src/components/ProtectedRoute.tsx` — route guard
  - `frontend/src/components/LoginPage.tsx` — login UI

- Database
  - `database/10_enhanced_schema_for_impersonation.sql` — full schema & sample data

This guide reflects the working implementation verified by the comprehensive authorization tests.

See also: `docs/END_TO_END_IMPLEMENTATION_DETAILED.md` for extended, step-by-step instructions, checklists, and deployment playbooks.


