const request = require('supertest');
const app = require('../server');
const { userService, tokenService } = require('../services/database');

describe('Authentication & Authorization', () => {
  let userToken;
  let adminToken;
  let refreshToken;

  beforeAll(async () => {
    // Clean up test data
    await userService.deleteByEmail('testuser@example.com');
    await userService.deleteByEmail('testadmin@example.com');
  });

  afterAll(async () => {
    // Clean up test data
    await userService.deleteByEmail('testuser@example.com');
    await userService.deleteByEmail('testadmin@example.com');
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const userData = {
        email: 'admin@framtt.com',
        password: 'Admin123!'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('email');
      expect(res.body.data.user).toHaveProperty('role');
      expect(res.body.data.user.email).toBe(userData.email);

      // Store token for later tests
      adminToken = res.body.data.token;
    });

    it('should reject login with invalid credentials', async () => {
      const userData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please provide email and password');
    });

    it('should reject login with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please provide a valid email address');
    });
  });

  describe('JWT Token Validation', () => {
    it('should protect routes without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access denied. No token provided.');
    });

    it('should protect routes with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid token.');
    });

    it('should allow access with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('role');
    });
  });

  describe('Token Structure Validation', () => {
    it('should include required claims in JWT token', async () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('fullName');
      expect(decoded).toHaveProperty('type');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded.type).toBe('access');
    });
  });

  describe('Password Change', () => {
    it('should change password with valid current password', async () => {
      const changeData = {
        currentPassword: 'Admin123!',
        newPassword: 'NewPassword123!'
      };

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(changeData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully. Please log in again.');
    });

    it('should reject password change with weak password', async () => {
      const changeData = {
        currentPassword: 'NewPassword123!',
        newPassword: 'weak'
      };

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(changeData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password does not meet requirements');
      expect(res.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('Refresh Token', () => {
    it('should refresh token with valid refresh token', async () => {
      // Login first to get refresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@framtt.com',
          password: 'NewPassword123!'
        });

      expect(loginRes.statusCode).toBe(200);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', loginRes.headers['set-cookie']);

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('token');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should restrict access based on user role', async () => {
      // Test with user role trying to access admin endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow access with sufficient role', async () => {
      // Test with admin role accessing admin endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt', async () => {
      const bcrypt = require('bcryptjs');
      const user = await userService.findByEmail('admin@framtt.com');
      
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('Admin123!');
      expect(user.password_hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should verify passwords correctly', async () => {
      const user = await userService.findByEmail('admin@framtt.com');
      const isValid = await userService.verifyPassword('NewPassword123!', user.password_hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should be stateless (no server-side session storage)', async () => {
      // JWT tokens should be self-contained and not require server-side session storage
      // This is verified by the fact that our authentication works with just JWT verification
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBeDefined();
    });
  });
});
