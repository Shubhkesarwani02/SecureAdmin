# 🚀 Deployment Quick Reference

## 📋 Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Vercel account created
- [ ] Render account created

## 🗄️ Supabase Setup

### 1. Create Project
- Go to [Supabase Dashboard](https://app.supabase.com/)
- Create new project: `framtt-superadmin-db`
- Note down: Database URL, API keys

### 2. Run Database Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your Supabase credentials
node create-missing-tables.js
node setup-role-hierarchy-supabase.js
node setup-assignment-tables.js
```

## 🔧 Backend Deployment (Render)

### 1. Deploy to Render
- Go to [Render Dashboard](https://dashboard.render.com/)
- New Web Service → Connect GitHub repo
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

### 2. Environment Variables
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_HOST=db.[PROJECT-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[YOUR-PASSWORD]
DB_SSL=true
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
JWT_SECRET=[GENERATE-SECURE-STRING]
JWT_EXPIRE=1h
IMPERSONATION_TIMEOUT_HOURS=1
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

**Backend URL**: `https://framtt-superadmin-backend.onrender.com`

## ⚛️ Frontend Deployment (Vercel)

### 1. Deploy to Vercel
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- New Project → Import GitHub repo
- **Framework**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. Environment Variables
```env
VITE_API_BASE_URL=https://framtt-superadmin-backend.onrender.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON-KEY]
```

**Frontend URL**: `https://framtt-superadmin-frontend.vercel.app`

## 🧪 Testing Commands

### Test Backend
```bash
# Health check
curl https://framtt-superadmin-backend.onrender.com/api/health

# Database connection
curl https://framtt-superadmin-backend.onrender.com/api/auth/me
```

### Test Frontend
- Visit your Vercel URL
- Try logging in
- Test all major features

## 🔄 Automated Deployment

### Using Scripts
```bash
# Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows
scripts/deploy.bat
```

### Manual Deployment
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run build
```

## 🚨 Common Issues

### CORS Errors
- Check `ALLOWED_ORIGINS` in backend
- Ensure frontend URL is included

### Database Connection
- Verify Supabase credentials
- Check `DB_SSL=true`
- Ensure database is accessible

### Build Failures
- Check Node.js version
- Verify all dependencies
- Check TypeScript errors

## 📞 Support URLs

- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **Project Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🔑 Security Checklist

- [ ] JWT_SECRET is secure and unique
- [ ] Database password is strong
- [ ] CORS origins are properly configured
- [ ] Environment variables are set in production
- [ ] SSL certificates are active
- [ ] API keys are kept secret

## 📊 Monitoring

- **Render Logs**: Dashboard → Service → Logs
- **Vercel Analytics**: Dashboard → Project → Analytics
- **Supabase Monitoring**: Dashboard → Project → Monitoring

---

**Quick Deploy**: Run `./scripts/deploy.sh` (Linux/Mac) or `scripts/deploy.bat` (Windows)
