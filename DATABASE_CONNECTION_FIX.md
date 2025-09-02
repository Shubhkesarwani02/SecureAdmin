# Database Connection Fix Guide

## Issues Identified
1. Database connection timeout with Supabase
2. Missing CORS configuration for Vercel frontend
3. Environment variables not properly configured in Render

## Step-by-Step Fix

### 1. Update Render Environment Variables

Go to your Render dashboard → Your backend service → Environment tab and set these **EXACT** variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Shubh%402025%23123@db.wqpkqjxsuqburhksoafb.supabase.co:5432/postgres
DB_HOST=db.wqpkqjxsuqburhksoafb.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Shubh@2025#123
DB_SSL=true
SUPABASE_URL=https://wqpkqjxsuqburhksoafb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw
JWT_SECRET=19b79b00fdcb4accf9c0581f9e265f64f640e88b8e06af83a4c9e8f2b1d7e3a2f5c8e9b1a3d6f2e8c5b9a7e4f1d8e2b5a9c6f3e0d7b4a1e8f5c2b9d6a3
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=1h
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://secure-admin-frontend.vercel.app,http://localhost:3000,http://localhost:5173
PORT=5000
SUPERADMIN_EMAIL=superadmin@framtt.com
SUPERADMIN_PASSWORD=SuperAdmin123!
ENABLE_AUDIT_LOGGING=true
ENABLE_INPUT_SANITIZATION=true
ENABLE_SECURITY_HEADERS=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### 2. Update Vercel Environment Variables

In your Vercel dashboard → Your frontend project → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://secureadmin.onrender.com
VITE_APP_NAME=Framtt Superadmin
VITE_APP_VERSION=1.0.0
VITE_SUPABASE_URL=https://wqpkqjxsuqburhksoafb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
```

### 3. Verify Supabase Settings

1. Go to your Supabase dashboard
2. Navigate to Settings → Database
3. Ensure these settings:
   - **SSL enforcement**: Enabled
   - **Connection pooling**: Enabled (recommended)
   - **IPv4**: Accessible from anywhere (0.0.0.0/0) or add Render's IP ranges

### 4. Test Database Connection Locally

Run this command in your backend directory to test the connection:

```bash
cd backend
node debug-db-connection.js
```

This will help identify any remaining connection issues.

### 5. Deploy Changes

1. **Backend (Render)**:
   - After updating environment variables, trigger a new deployment
   - Check logs for database connection status

2. **Frontend (Vercel)**:
   - After updating environment variables, trigger a new deployment
   - Verify API calls are going to the correct backend URL

### 6. Verification Steps

1. **Check Backend Health**:
   ```
   GET https://secureadmin.onrender.com/health
   ```
   Should return: `{"database": "connected"}`

2. **Check Frontend API Calls**:
   Open browser dev tools and verify API calls are going to `https://secureadmin.onrender.com`

3. **Test Login**:
   Try logging in with superadmin credentials

## Common Issues & Solutions

### Issue: "Database disconnected"
- **Solution**: Check DATABASE_URL encoding and SSL settings
- **Debug**: Run `node debug-db-connection.js`

### Issue: CORS errors
- **Solution**: Verify ALLOWED_ORIGINS includes your Vercel frontend URL
- **Check**: Ensure no trailing slashes in URLs

### Issue: 502 Bad Gateway
- **Solution**: Backend might be starting slowly. Check Render logs
- **Wait**: Render free tier can have cold starts

### Issue: Environment variables not loading
- **Solution**: Ensure all variables are set in Render dashboard
- **Restart**: Trigger a new deployment after setting variables

## Contact
If issues persist, check:
1. Render deployment logs
2. Vercel function logs
3. Browser console for specific error messages

The updated code includes better error handling and connection timeouts optimized for Supabase.
