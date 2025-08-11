# Framtt Superadmin Backend API

A comprehensive Node.js backend API for the Framtt Superadmin Dashboard, providing authentication, client management, vehicle management, and system monitoring capabilities.

## 🚀 Features

- **JWT Authentication** with role-based access control
- **Dashboard Analytics** with real-time KPIs
- **Client Management** for rental companies
- **Vehicle Management** with booking tracking
- **User Administration** with permissions
- **System Monitoring** with health checks
- **Notification System** for real-time alerts
- **Integration Code Management** for API access
- **Admin Settings** and configuration management

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository and navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Update environment variables in `.env` file:**
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   SUPERADMIN_EMAIL=admin@framtt.com
   SUPERADMIN_PASSWORD=SecurePassword123!
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/preferences` | Update user preferences | Private |
| POST | `/api/auth/logout` | User logout | Private |

### Dashboard Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/summary` | Dashboard KPIs and metrics | Superadmin |
| GET | `/api/dashboard/monitoring` | System health monitoring | Superadmin |
| GET | `/api/dashboard/analytics` | Platform analytics | Superadmin |

### Client Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/clients` | Get all clients | Superadmin |
| GET | `/api/clients/:id` | Get single client | Superadmin |
| POST | `/api/clients` | Create new client | Superadmin |
| PUT | `/api/clients/:id` | Update client | Superadmin |
| DELETE | `/api/clients/:id` | Disable client | Superadmin |
| GET | `/api/clients/stats` | Client statistics | Superadmin |

### Vehicle Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/vehicles` | Get all vehicles | Superadmin |
| GET | `/api/vehicles/:id` | Get single vehicle | Superadmin |
| POST | `/api/vehicles` | Create new vehicle | Superadmin |
| PUT | `/api/vehicles/:id` | Update vehicle | Superadmin |
| DELETE | `/api/vehicles/:id` | Delete vehicle | Superadmin |
| GET | `/api/vehicles/stats` | Vehicle statistics | Superadmin |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Superadmin |
| GET | `/api/users/:id` | Get single user | Superadmin |
| POST | `/api/users` | Create new user | Superadmin |
| PUT | `/api/users/:id` | Update user | Superadmin |
| DELETE | `/api/users/:id` | Deactivate user | Superadmin |
| GET | `/api/users/stats` | User statistics | Superadmin |

### Admin & Settings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/settings` | Get admin settings | Superadmin |
| PUT | `/api/admin/settings` | Update admin settings | Superadmin |
| GET | `/api/admin/logs` | Get system logs | Superadmin |
| GET | `/api/admin/integration-codes` | Get integration codes | Superadmin |
| POST | `/api/admin/integration-codes` | Generate integration code | Superadmin |
| DELETE | `/api/admin/integration-codes/:code` | Deactivate integration code | Superadmin |

### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/notifications` | Get notifications | Private |
| POST | `/api/notifications` | Create notification | Superadmin |
| PATCH | `/api/notifications/:id/read` | Mark notification as read | Private |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read | Private |
| DELETE | `/api/notifications/:id` | Delete notification | Private |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Login Credentials

For demo purposes, use any of these credentials:

- **Superadmin**: `john@framtt.com` (any password)
- **Admin**: `sarah@framtt.com` (any password)

## 🗃️ Data Structure

### User Roles
- **superadmin**: Full system access
- **admin**: Limited administrative access  
- **user**: Basic user access

### Client Status
- **active**: Operational client
- **inactive**: Disabled client
- **pending**: Awaiting verification

### Vehicle Status
- **available**: Ready for booking
- **active**: Currently booked
- **maintenance**: Under maintenance

## 🔧 Query Parameters

Most GET endpoints support these query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc or desc (default: desc)

Example:
```
GET /api/clients?status=active&search=premium&page=1&limit=20
```

## 📊 Response Format

All API responses follow this format:

### Success Response
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

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

## 🚦 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration for frontend domains
- **JWT token validation**
- **Role-based access control**
- **Input validation and sanitization**

## 🌐 CORS Configuration

The API accepts requests from:
- `http://localhost:3000` (React development)
- `http://localhost:5173` (Vite development)
- `https://superadmin.framtt.com` (Production)
- `https://framtt-superadmin.netlify.app` (Deployment)

## 📝 Development Notes

- Uses in-memory mock data for demonstration
- All data resets when server restarts
- Passwords are simplified for demo (no hashing)
- Ready for database integration
- Follows RESTful API conventions
- Implements proper error handling
- Includes comprehensive logging

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRE=24h
DATABASE_URL=your-production-database-url
```

### Docker Deployment (Optional)
```bash
# Build Docker image
docker build -t framtt-superadmin-api .

# Run container
docker run -p 5000:5000 --env-file .env framtt-superadmin-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email: support@framtt.com
```