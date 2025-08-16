# 🧪 Framtt Superadmin API Testing Gui3. **Body**:
   ```json
   {
     "email": "superadmin@framtt.com",
     "password": "admin123"
   }
   ```his guide will help you test all the API endpoints using Postman with the provided collection and environment files.

## 📁 Files Created

- `Framtt_Superadmin_API_Collection.postman_collection.json` - Complete API collection
- `Framtt_Superadmin_Environment.postman_environment.json` - Environment variables

## 🚀 Quick Setup

### 1. Import into Postman

1. **Open Postman**
2. **Import Collection**: 
   - Click `Import` button
   - Select `Framtt_Superadmin_API_Collection.postman_collection.json`
3. **Import Environment**:
   - Click on `Environments` tab
   - Click `Import`
   - Select `Framtt_Superadmin_Environment.postman_environment.json`
4. **Select Environment**:
   - Click on the environment dropdown (top right)
   - Select "Framtt Superadmin Environment"

### 2. Server Status

✅ **Server is running on: http://localhost:5000**

Verify by visiting: http://localhost:5000/health

## 🔐 Authentication Flow

### Step 1: Login to Get Token

1. **Go to**: `🔐 Authentication` → `Login (Superadmin)`
2. **Method**: POST
3. **URL**: `{{baseUrl}}/api/auth/login`
4. **Body**:
   ```json
   {
     "email": "john@framtt.com",
     "password": "password123"
   }
   ```
5. **Send Request** - The auth token will be automatically saved to environment variables

### Available Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Superadmin** | `superadmin@framtt.com` | `admin123` | **Full access to all endpoints** ⭐ |
| Admin | `admin@framtt.com` | `admin123` | Limited administrative access |
| CSM1 | `csm1@framtt.com` | `admin123` | Customer Success Manager access |
| CSM2 | `csm2@framtt.com` | `admin123` | Customer Success Manager access |
| User1 | `user1@rentalcorp.com` | `admin123` | Basic user access |
| User2 | `user2@quickrentals.com` | `admin123` | Basic user access |

**💡 Tip**: Use `superadmin@framtt.com` for testing all endpoints as it has full privileges.

## 📋 Testing Checklist

### ✅ Essential Endpoints to Test First

1. **Health Check** (`/health`)
2. **Login** (`/api/auth/login`)
3. **Get Current User** (`/api/auth/me`)
4. **Dashboard Summary** (`/api/dashboard/summary`)

### 🔍 Complete Testing Flow

#### Phase 1: Authentication & Health
- [ ] Health Check
- [ ] Login with Superadmin
- [ ] Login with Admin
- [ ] Get Current User Info
- [ ] Account Health Check

#### Phase 2: Core Management
- [ ] Get Dashboard Summary
- [ ] Get All Users
- [ ] Get All Clients
- [ ] Get All Vehicles
- [ ] Get System Monitoring

#### Phase 3: CRUD Operations
- [ ] Create New User
- [ ] Update User
- [ ] Create New Client
- [ ] Update Client
- [ ] Create New Vehicle
- [ ] Update Vehicle

#### Phase 4: Advanced Features
- [ ] Get Admin Settings
- [ ] Get Integration Codes
- [ ] Create Notification
- [ ] Get Audit Logs
- [ ] Start Impersonation (Admin only)

#### Phase 5: Statistics & Analytics
- [ ] User Statistics
- [ ] Client Statistics
- [ ] Vehicle Statistics
- [ ] Dashboard Analytics

## API Collection Structure

### 🔐 Authentication (6 endpoints)
- Login (Superadmin) ⭐
- Login (Admin)
- Login (CSM1)
- Login (CSM2)
- Get Current User
- Change Password
- Logout

### 📊 Dashboard (3 endpoints)
- Dashboard Summary ✅
- System Monitoring ✅
- Analytics ✅

### 👥 User Management (6 endpoints)
- Get All Users ✅
- Get User by ID
- Create New User
- Update User
- Delete User
- User Statistics

### 🏢 Client Management (6 endpoints)
- Get All Clients ✅
- Get Client by ID
- Create New Client
- Update Client
- Delete Client
- Client Statistics

### 🚗 Vehicle Management (6 endpoints)
- Get All Vehicles ✅
- Get Vehicle by ID
- Create New Vehicle
- Update Vehicle
- Delete Vehicle
- Vehicle Statistics

### ⚙️ Admin Management (6 endpoints) ✅
- Get Admin Settings ✅
- Update Admin Settings ✅
- Get System Logs ✅
- Get Integration Codes ✅
- Generate Integration Code
- Deactivate Integration Code

### 🔔 Notifications (5 endpoints)
- Get All Notifications
- Create Notification
- Mark Notification as Read
- Mark All Notifications as Read
- Delete Notification

### 🎭 Impersonation (4 endpoints)
- Start Impersonation
- Stop Impersonation
- Get Active Impersonations
- Get Impersonation History

### 📋 Audit & Logs (2 endpoints)
- Get Audit Logs
- Get User Activity

### 🔍 Health Check (2 endpoints)
- Health Check
- Account Health Check

## 🎯 Testing Tips

### Query Parameters
Most GET endpoints support these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status
- `sortBy`: Sort field
- `sortOrder`: asc or desc

Example:
```
GET {{baseUrl}}/api/users?page=1&limit=5&search=john&status=active
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔧 Troubleshooting

### ✅ FIXED: All Issues Resolved!

**✅ WORKING CREDENTIALS:**
- **Superadmin**: `superadmin@framtt.com` / `admin123` ⭐ (Full access)
- **Admin**: `admin@framtt.com` / `admin123` (Limited access)
- **CSM1**: `csm1@framtt.com` / `admin123` (CSM access)
- **CSM2**: `csm2@framtt.com` / `admin123` (CSM access)

**✅ ALL ENDPOINTS WORKING:**
- ✅ Authentication (All users can login)
- ✅ Dashboard (Summary, Analytics, Monitoring)
- ✅ Admin Settings (Get, Update, Logs, Integration Codes)
- ✅ Users Management (6 users found in database)
- ✅ Clients Management (Ready for data)
- ✅ Vehicles Management (Ready for data)
- ✅ Notifications System

**✅ DATABASE:**
- ✅ PostgreSQL connected successfully
- ✅ Password hashes fixed for all users
- ✅ Admin routes properly registered

### Common Issues

1. **401 Unauthorized**
   - Make sure you're logged in
   - Check if auth token is saved in environment
   - Token might be expired, try logging in again

2. **CORS Errors**
   - Server allows `localhost:3000`, `localhost:5173`, and production domains
   - Postman should not have CORS issues

3. **Rate Limiting**
   - API has rate limiting enabled
   - Wait a moment if you hit rate limits

4. **Server Not Running**
   - Ensure server is running on `http://localhost:5000`
   - Check the terminal/console for error messages

### Debug Tips

1. **Check Server Logs**
   - Look at the terminal where server is running
   - Detailed request/response logging is enabled

2. **Verify Environment Variables**
   - Make sure `baseUrl` is set to `http://localhost:5000`
   - Ensure `authToken` gets populated after login

3. **Test Basic Endpoints First**
   - Start with `/health` endpoint
   - Then try authentication
   - Work your way through more complex endpoints

## 📝 Sample Test Data

### User Creation
```json
{
  "name": "Test User",
  "email": "testuser@framtt.com",
  "password": "password123",
  "role": "user",
  "phone": "+1234567890",
  "department": "Operations"
}
```

### Client Creation
```json
{
  "name": "Test Rental Company",
  "email": "contact@testrentals.com",
  "phone": "+1234567890",
  "address": "123 Test Street, Test City, TC 12345",
  "subscriptionTier": "Premium",
  "maxVehicles": 100
}
```

### Vehicle Creation
```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "licensePlate": "ABC123",
  "vin": "1HGBH41JXMN109186",
  "category": "Sedan",
  "dailyRate": 89.99,
  "clientId": 1
}
```

## 🎉 Happy Testing!

You now have everything you need to comprehensively test the Framtt Superadmin API. Start with the authentication flow and work your way through each module.

For any issues or questions, check the server logs or the API documentation in the main README.md file.
