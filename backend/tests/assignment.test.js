const request = require('supertest');
const app = require('../server');
const { testConnection } = require('../services/database');

describe('User & Account Assignment Logic', () => {
  let adminToken;
  let csmToken;
  let userToken;
  let testAccountId;
  let testCSMId;
  let testUserId;

  beforeAll(async () => {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Setup test data (normally would be done with fixtures)
    // For now, we'll assume test data exists
  });

  describe('CSM Assignment Tests', () => {
    test('Admin can assign CSM to account', async () => {
      const response = await request(app)
        .post(`/api/accounts/${testAccountId}/assign-csm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          csmId: testCSMId,
          isPrimary: true,
          notes: 'Test assignment'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignment).toBeDefined();
    });

    test('CSM cannot assign other CSMs', async () => {
      const response = await request(app)
        .post(`/api/accounts/${testAccountId}/assign-csm`)
        .set('Authorization', `Bearer ${csmToken}`)
        .send({
          csmId: testCSMId,
          isPrimary: false
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Get CSM assignments overview', async () => {
      const response = await request(app)
        .get('/api/assignments/csm-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.csm_assignments).toBeDefined();
      expect(Array.isArray(response.body.data.csm_assignments)).toBe(true);
    });
  });

  describe('User Assignment Tests', () => {
    test('Admin can assign user to account', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          accountId: testAccountId,
          roleInAccount: 'member'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignment).toBeDefined();
    });

    test('User cannot assign other users', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUserId,
          accountId: testAccountId,
          roleInAccount: 'member'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('Get user account assignments', async () => {
      const response = await request(app)
        .get(`/api/assignments/users/${testUserId}/accounts`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignments).toBeDefined();
      expect(Array.isArray(response.body.data.assignments)).toBe(true);
    });

    test('Get account user assignments', async () => {
      const response = await request(app)
        .get(`/api/assignments/accounts/${testAccountId}/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignments).toBeDefined();
    });
  });

  describe('Bulk Assignment Tests', () => {
    test('Admin can bulk assign users to account', async () => {
      const response = await request(app)
        .post('/api/assignments/bulk/users-to-account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: [testUserId],
          accountId: testAccountId,
          roleInAccount: 'viewer'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignments).toBeDefined();
      expect(Array.isArray(response.body.data.assignments)).toBe(true);
    });

    test('Bulk assignment handles errors gracefully', async () => {
      const response = await request(app)
        .post('/api/assignments/bulk/users-to-account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds: ['invalid-user-id', testUserId],
          accountId: testAccountId,
          roleInAccount: 'member'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.errors).toBeDefined();
      expect(Array.isArray(response.body.data.errors)).toBe(true);
    });
  });

  describe('Helper Endpoint Tests', () => {
    test('Get available users for assignment', async () => {
      const response = await request(app)
        .get('/api/assignments/available-users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ accountId: testAccountId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availableUsers).toBeDefined();
    });

    test('Get available CSMs', async () => {
      const response = await request(app)
        .get('/api/assignments/available-csms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.availableCSMs).toBeDefined();
    });

    test('Get unassigned accounts', async () => {
      const response = await request(app)
        .get('/api/assignments/unassigned-accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unassignedAccounts).toBeDefined();
    });

    test('Get unassigned users', async () => {
      const response = await request(app)
        .get('/api/assignments/unassigned-users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unassignedUsers).toBeDefined();
    });
  });

  describe('Statistics Tests', () => {
    test('Get assignment statistics', async () => {
      const response = await request(app)
        .get('/api/assignments/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.csm_stats).toBeDefined();
      expect(response.body.data.user_stats).toBeDefined();
      expect(response.body.data.account_stats).toBeDefined();
    });

    test('Non-admin cannot access statistics', async () => {
      const response = await request(app)
        .get('/api/assignments/stats')
        .set('Authorization', `Bearer ${csmToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Access Control Tests', () => {
    test('CSM can only view assigned account users', async () => {
      // This test would need to ensure the CSM is assigned to the account first
      const response = await request(app)
        .get(`/api/assignments/accounts/${testAccountId}/users`)
        .set('Authorization', `Bearer ${csmToken}`);

      // Assuming CSM is assigned to the account
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('CSM cannot view non-assigned account users', async () => {
      // This test would use an account the CSM is not assigned to
      const nonAssignedAccountId = 'non-assigned-account-id';
      const response = await request(app)
        .get(`/api/assignments/accounts/${nonAssignedAccountId}/users`)
        .set('Authorization', `Bearer ${csmToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('User can view own assignments', async () => {
      const response = await request(app)
        .get(`/api/assignments/users/${testUserId}/accounts`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('User cannot view other user assignments', async () => {
      const otherUserId = 'other-user-id';
      const response = await request(app)
        .get(`/api/assignments/users/${otherUserId}/accounts`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Assignment Removal Tests', () => {
    test('Admin can remove user from account', async () => {
      const response = await request(app)
        .delete(`/api/assignments/user-accounts/${testUserId}/${testAccountId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Admin can remove CSM from account', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${testAccountId}/csm/${testCSMId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    test('Invalid role in account is rejected', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          accountId: testAccountId,
          roleInAccount: 'invalid-role'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Missing required fields are rejected', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUserId
          // Missing accountId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Non-existent account is rejected', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          accountId: 'non-existent-account',
          roleInAccount: 'member'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Non-existent user is rejected', async () => {
      const response = await request(app)
        .post('/api/assignments/user-accounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'non-existent-user',
          accountId: testAccountId,
          roleInAccount: 'member'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

// Helper functions for test setup
async function createTestAccount() {
  // Implementation would create a test account
  // Return account ID
}

async function createTestCSM() {
  // Implementation would create a test CSM user
  // Return CSM ID
}

async function createTestUser() {
  // Implementation would create a test regular user
  // Return user ID
}

async function getAuthToken(userType) {
  // Implementation would authenticate and return JWT token
  // for the specified user type (admin, csm, user)
}
