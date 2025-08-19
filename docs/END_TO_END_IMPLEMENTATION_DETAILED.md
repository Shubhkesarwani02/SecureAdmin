## Framtt Superadmin — End-to-End Implementation (Detailed Playbook)

This is the comprehensive, step-by-step guide for setting up, running, testing, and deploying the Framtt Superadmin platform. It expands on `docs/END_TO_END_IMPLEMENTATION_GUIDE.md` with concrete commands, checklists, verification scripts, and platform-specific notes.

---

## 0) Overview

- Backend: Node.js + Express with Postgres (Supabase-managed)
- Frontend: React (Vite) + TypeScript
- Auth: First-party JWT access tokens, httpOnly refresh tokens
- RBAC: `superadmin > admin > csm > user`
- Impersonation: Short-lived tokens, full audit logs

Key directories:
- `backend/` — API, middleware, routes, controllers
- `frontend/` — React app
- `database/` — SQL schema and data
- `deployment/` — deploy configs (Vercel, Netlify, Nginx, Docker)
- `docs/` — documentation

---

## 1) Prerequisites

- Node.js 18+
- npm 9+
- Supabase project with SQL editor access
- Postgres connection string (URI) and project reference
- Windows PowerShell (for Windows quick-start) or bash/zsh

---

## 2) Environment configuration

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

DATABASE_URL=postgresql://postgres:<YOUR_DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
DB_SSL=true

JWT_SECRET=<strong-long-random-secret>
JWT_PREVIOUS_SECRET=
JWT_SECRET_LAST_ROTATION=2025-01-01T00:00:00.000Z
JWT_SECRET_ROTATION_DAYS=30
BCRYPT_ROUNDS=12
```

Frontend Supabase client configuration:

Edit `frontend/src/utils/supabase/info.tsx`:

```ts
export const projectId = "<PROJECT_REF>"
export const publicAnonKey = "<ANON_KEY>"
```

Optional frontend `.env` (in `frontend/`):

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3) Database setup (Supabase)

Run in Supabase SQL editor:

- Primary schema: `database/10_enhanced_schema_for_impersonation.sql`
- Optional sample data: `database/11_sample_data.sql`

This creates and configures:
- Users, accounts, assignments, audit and impersonation logs, refresh tokens
- Indexes, functions, and triggers for RBAC and auditing

Verification (from project root):

```bash
node verify-database-schema.js
```

---

## 4) Start services

### Windows quick start

From project root:

```bat
scripts\dev-windows.bat
```

This starts:
- Backend at `http://localhost:5000`
- Frontend at `http://localhost:5173`

### Manual start

```bash
cd backend && npm install && npm run start
# in another terminal
cd frontend && npm install && npm run dev
```

Health checks:
- Backend logs should show: `Database connected successfully`
- Frontend opens on `http://localhost:5173`

---

## 5) Authentication & session

Login:

```bash
curl -s -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@framtt.com","password":"password"}' | jq .
```

Me:

```bash
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" | jq .
```

Refresh:

```bash
curl -s -X POST http://localhost:5000/api/auth/refresh -b cookiejar.txt -c cookiejar.txt | jq .
```

Logout:

```bash
curl -s -X POST http://localhost:5000/api/auth/logout -b cookiejar.txt -c cookiejar.txt | jq .
```

---

## 6) RBAC & resource access

Role hierarchy: `superadmin > admin > csm > user`.

Enforced by `backend/middleware/auth.js` and SQL relationships:
- `checkAccountAccess` for account scoping
- `canManageUser` and `checkCSMUserAccess` for user management

API groups:
- Users: `backend/routes/userRoutes.js`
- Accounts: `backend/routes/accountRoutes.js`
- Clients: `backend/routes/clientRoutes.js`
- Vehicles: `backend/routes/vehicleRoutes.js`
- Auth/Impersonation: `backend/routes/authRoutes.js`

---

## 7) Impersonation flow

Start session (admin/superadmin):

```bash
curl -s -X POST http://localhost:5000/api/auth/impersonate/start \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"targetUserId":"<USER_UUID>","reason":"support"}' | jq .
```

Use `impersonationToken` for subsequent calls.

Stop session:

```bash
curl -s -X POST http://localhost:5000/api/auth/impersonate/stop \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <IMPERSONATION_TOKEN>" \
  -d '{"sessionId":"<SESSION_ID>"}' | jq .
```

---

## 8) Frontend integration

Auth context: `frontend/src/contexts/AuthContext.tsx`

```tsx
const { signIn, startImpersonation, stopImpersonation } = useAuth()
await signIn(email, password)
```

Protect routes:

```tsx
<ProtectedRoute requiredRole="admin">
  <AdminSettings />
  </ProtectedRoute>
```

Configure API base URL via `VITE_API_URL` or defaults to `http://localhost:5000/api`.

---

## 9) Verification & tests

From project root:

```bash
# Connectivity & schema
node test-basic-connectivity.js
node verify-database-schema.js

# Authentication
node test-login.js
node test-login-debug.js

# Authorization & RBAC
node verify-authorization-logic.js
node final-authorization-verification.js

# Endpoints
node verify-api-endpoints.js
node test-api-integration.js
node backend/test-endpoints.js

# Comprehensive
node comprehensive-verification.js
node final-comprehensive-verification.js
```

Optional Postman: import `Framtt_Superadmin_API_Collection.postman_collection.json` and `Framtt_Superadmin_Environment.postman_environment.json`.

---

## 10) Security operations

Rate limits and security headers are enabled by default. To rotate JWT secrets:

```bash
node backend/scripts/rotate-jwt-secret.js
```

Ensure you redeploy after rotation and preserve `JWT_PREVIOUS_SECRET` during the transition window.

---

## 11) Deployment playbooks

### Frontend (Vercel)

```bash
npm i -g vercel
cd frontend
vercel --prod
```

`deployment/vercel.json` proxies `/api/*` to your backend.

### Frontend (Netlify)

```bash
npm i -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Backend (Docker)

```bash
docker build -t framtt-backend -f deployment/docker/Dockerfile.backend .
docker run -p 5000:5000 --env-file backend/.env framtt-backend
```

### Traditional server (Nginx)

- Use `deployment/nginx.conf` as a baseline for reverse proxy, TLS, and static serving.

---

## 12) Troubleshooting

- DB connection fails: check `DATABASE_URL` and `?sslmode=require`, ensure `DB_SSL=true`.
- 401 Unauthorized: missing/expired token; call `/api/auth/refresh`.
- 403 Forbidden: role or scope violation; inspect middleware and audit logs.
- CORS: update `ALLOWED_ORIGINS` in `backend/.env`.
- Impersonation denied: role hierarchy or user status invalid.

Logs and diagnostics:

```bash
node backend/debug-endpoints.js | cat
node backend/diagnose-connection.js | cat
node backend/test-supabase-connection.js | cat
```

---

## 13) Checklists

### Local dev
- [ ] Supabase schema applied
- [ ] `backend/.env` configured
- [ ] Backend running on 5000
- [ ] Frontend running on 5173
- [ ] Login works and `/me` returns profile

### Pre-deploy
- [ ] Environment variables set on platform
- [ ] `ALLOWED_ORIGINS` updated
- [ ] DB URL uses SSL
- [ ] Secrets rotated if needed

### Post-deploy
- [ ] Health checks pass
- [ ] Endpoints respond with 200
- [ ] Audit logs captured
- [ ] Impersonation works for admin/superadmin

---

## 14) Key references

- Guide: `docs/END_TO_END_IMPLEMENTATION_GUIDE.md`
- Backend overview: `backend/README.md`
- Frontend overview: `frontend/README.md`
- Deployment: `deployment/README.md`
- Database docs: `database/README.md`

This document reflects the verified implementation and includes commands to validate critical paths end-to-end.


