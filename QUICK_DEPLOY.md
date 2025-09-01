# 🚀 Quick Deployment Setup for FRAMTT Superadmin

## Your Current Configuration

Based on your current setup, here are the e### Frontend Deployment to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up/login**

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select your repository: `framtt-superadmin`

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build:legacy
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

4. **Environment Variables** (Replace `YOUR_BACKEND_URL` with your actual Render URL):y your application:

### 📊 Current Environment Details
- **Database**: Supabase (already configured)
- **Backend**: Express.js with comprehensive security
- **Frontend**: React + TypeScript + Vite
- **Current API URL**: `http://localhost:5000/api`

---

## 🎯 Step-by-Step Deployment

### 1. Prepare Your Repository

First, make sure your code is pushed to GitHub:

```powershell
# In your project root
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Generate Production Secrets

Run this command to generate new JWT secrets:

```powershell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_PREVIOUS_SECRET=' + require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'));"
```

**Copy these secrets - you'll need them for Render!**

### 3. Deploy Backend to Render

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your repository: `framtt-superadmin`

3. **Configure Service**
   ```
   Name: framtt-superadmin-backend
   Environment: Node
   Region: Ohio (US East)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Environment Variables** (Copy exactly as shown):
   ```env
   NODE_ENV=production
   PORT=10000
   
   # Database Configuration - Supabase
   DB_HOST=db.wqpkqjxsuqburhksoafb.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=Shubh@2025#123
   DB_SSL=true
   DATABASE_URL=postgresql://postgres:Shubh%402025%23123@db.wqpkqjxsuqburhksoafb.supabase.co:5432/postgres
   
   # Supabase Configuration
   SUPABASE_URL=https://wqpkqjxsuqburhksoafb.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw
   
   # JWT Configuration - USE THE SECRETS YOU GENERATED ABOVE
   JWT_SECRET=YOUR_GENERATED_SECRET_HERE
   JWT_PREVIOUS_SECRET=YOUR_GENERATED_SECRET_HERE
   JWT_REFRESH_SECRET=YOUR_GENERATED_SECRET_HERE
   JWT_EXPIRE=1h
   JWT_SECRET_ROTATION_DAYS=30
   JWT_SECRET_LAST_ROTATION=2025-09-02T00:00:00.000Z
   
   # Security Configuration
   BCRYPT_ROUNDS=12
   
   # CORS Configuration - LEAVE AS IS FOR NOW, UPDATE AFTER FRONTEND DEPLOYMENT
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   
   # Rate Limiting Configuration
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   AUTH_RATE_LIMIT_MAX=5
   IMPERSONATION_RATE_LIMIT_MAX=10
   PASSWORD_CHANGE_RATE_LIMIT_MAX=3
   
   # Session Configuration
   SESSION_TIMEOUT_HOURS=24
   IMPERSONATION_TIMEOUT_HOURS=1
   REFRESH_TOKEN_EXPIRY_DAYS=7
   
   # Security Features
   ENABLE_AUDIT_LOGGING=true
   ENABLE_SECURITY_HEADERS=true
   ENABLE_INPUT_SANITIZATION=true
   ENABLE_TOKEN_BLACKLIST=true
   
   # Monitoring and Alerts
   SECURITY_ALERT_EMAIL=admin@framtt.com
   AUDIT_LOG_RETENTION_DAYS=90
   IMPERSONATION_ALERT_THRESHOLD=10
   
   # Admin Configuration
   SUPERADMIN_EMAIL=admin@framtt.com
   SUPERADMIN_PASSWORD=SecurePassword123!
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - **Copy your backend URL**: `https://your-service-name.onrender.com`

6. **Test Backend**
   ```powershell
   # Test health endpoint
   curl https://your-service-name.onrender.com/api/health
   ```

### 4. Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up/login**

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select your repository: `framtt-superadmin`

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build:legacy
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

4. **Environment Variables** (Replace `YOUR_BACKEND_URL` with your actual Render URL):
   ```env
   VITE_API_URL=https://your-service-name.onrender.com/api
   VITE_SUPABASE_PROJECT_ID=wqpkqjxsuqburhksoafb
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTU0NTQsImV4cCI6MjA3MTA3MTQ1NH0.FfTT5TUWqbc6cXqDIThP7Sybl-vVvP82hhAXm1t31I4
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcGtxanhzdXFidXJoa3NvYWZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ5NTQ1NCwiZXhwIjoyMDcxMDcxNDU0fQ.AzPdcr5qH5C9xycDn9vOatpZz846TBanG_F7IeEDigw
   VITE_DEMO_MODE=false
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (3-5 minutes)
   - **Copy your frontend URL**: `https://your-app.vercel.app`

### 5. Update Backend CORS Settings

1. **Go back to Render dashboard**
2. **Navigate to your backend service → Environment**
3. **Update ALLOWED_ORIGINS**:
   ```env
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. **Redeploy the service**

### 6. Update vercel.json Configuration

1. **In your local project**, update `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build:legacy",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-backend-url.onrender.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    }
  ]
}
```

2. **Commit and push changes**:
```powershell
git add frontend/vercel.json
git commit -m "Update vercel.json with production backend URL"
git push origin main
```

3. **Vercel will auto-redeploy**

---

## 🧪 Testing Your Deployment

### Test Backend API
```powershell
# Health check
curl https://your-backend-url.onrender.com/api/health

# Login test
curl -X POST https://your-backend-url.onrender.com/api/auth/login -H "Content-Type: application/json" -d '{\"email\":\"admin@framtt.com\",\"password\":\"SecurePassword123!\"}'
```

### Test Frontend Application
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try logging in with:
   - **Email**: `admin@framtt.com`
   - **Password**: `SecurePassword123!`
3. Navigate through the dashboard
4. Test creating/editing data

---

## 🎯 Your Final URLs

After successful deployment, you'll have:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.onrender.com/api`
- **Admin Login**: `https://your-app.vercel.app/login`

---

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure ALLOWED_ORIGINS in backend includes your Vercel URL
   - No trailing slashes in URLs

2. **Build Failures**
   ```powershell
   # Test build locally first
   cd frontend
   npm run build:legacy
   
   # If you get NODE_OPTIONS error on Windows, ensure cross-env is installed:
   npm install --save-dev cross-env
   
   # If you get terser error, install terser:
   npm install --save-dev terser
   ```

3. **Environment Variables Not Working**
   - Ensure Vite variables start with `VITE_`
   - Redeploy after adding environment variables

4. **API Connection Issues**
   - Check browser Network tab for failed requests
   - Verify backend is running (health endpoint)
   - Ensure vercel.json points to correct backend URL

### Quick Fixes

```powershell
# Generate new secrets if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test local build
cd frontend && npm run build:legacy

# Check if backend is accessible
curl https://your-backend-url.onrender.com/api/health
```

---

## 🎉 Success!

Once everything is working:

1. ✅ Backend deployed and healthy
2. ✅ Frontend deployed and loading
3. ✅ Login functionality working
4. ✅ Dashboard features accessible
5. ✅ API communication established

Your FRAMTT Superadmin is now live in production! 🚀

---

## 📞 Need Help?

- Check the complete `DEPLOYMENT_GUIDE.md` for detailed explanations
- Review Render logs for backend issues
- Check Vercel function logs for frontend issues
- Test API endpoints individually to isolate problems
