# User & Account Assignment Logic Implementation

## Overview

This document describes the comprehensive User & Account Assignment Logic implementation for the Framtt Superadmin platform. The system manages relationships between Customer Success Managers (CSMs), customer accounts, and end users.

## Core Concepts

### 1. Role Hierarchy
- **Superadmin**: Full system access, can manage all users and assignments
- **Admin**: Can manage CSMs and users, assign CSMs to accounts, view all accounts
- **CSM (Customer Success Manager)**: Can only view and manage assigned customer accounts
- **User**: Regular users assigned to specific customer accounts

### 2. Assignment Types

#### CSM to Account Assignment
- Each CSM can be assigned to multiple customer accounts
- Each account can have multiple CSMs (primary and secondary)
- Tracks assignment date, who made the assignment, and notes
- Supports primary CSM designation for main responsibility

#### User to Account Assignment
- Regular users are assigned to specific customer accounts
- Users have roles within accounts: owner, admin, member, viewer
- Tracks assignment date and who made the assignment
- Users can be assigned to multiple accounts if needed

## Database Schema

### Tables

#### 1. `csm_assignments`
```sql
CREATE TABLE csm_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    csm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(csm_id, account_id)
);
```

#### 2. `user_accounts`
```sql
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_in_account VARCHAR(50) DEFAULT 'member' CHECK (role_in_account IN ('owner', 'admin', 'member', 'viewer')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_id)
);
```

## API Endpoints

### Assignment Management

#### CSM Assignment Endpoints (Existing)
- `POST /api/accounts/:id/assign-csm` - Assign CSM to account
- `DELETE /api/accounts/:id/csm/:csmId` - Remove CSM from account
- `GET /api/users/:id/assignments` - Get CSM's account assignments

#### User Assignment Endpoints (New)
- `POST /api/assignments/user-accounts` - Assign user to account
- `DELETE /api/assignments/user-accounts/:userId/:accountId` - Remove user from account
- `GET /api/assignments/users/:userId/accounts` - Get user's account assignments
- `GET /api/assignments/accounts/:accountId/users` - Get account's user assignments

#### Bulk Operations
- `POST /api/assignments/bulk/users-to-account` - Bulk assign users to account

#### Helper Endpoints
- `GET /api/assignments/available-users` - Get users available for assignment
- `GET /api/assignments/available-csms` - Get CSMs available for assignment
- `GET /api/assignments/unassigned-accounts` - Get accounts without CSM assignment
- `GET /api/assignments/unassigned-users` - Get users without account assignment

#### Statistics & Overview
- `GET /api/assignments/stats` - Get assignment statistics
- `GET /api/assignments/csm-overview` - Get CSM assignments overview

## Access Control

### Permission Matrix

| Action | Superadmin | Admin | CSM | User |
|--------|------------|-------|-----|------|
| View all accounts | ✓ | ✓ | ✗ | ✗ |
| View assigned accounts | ✓ | ✓ | ✓ | ✗ |
| Assign CSM to account | ✓ | ✓ | ✗ | ✗ |
| Assign user to account | ✓ | ✓ | ✗ | ✗ |
| View assignment stats | ✓ | ✓ | ✗ | ✗ |
| View own assignments | ✓ | ✓ | ✓ | ✓ |
| Manage account users | ✓ | ✓ | ✓ | ✗ |

### CSM Access Rules
- CSMs can only view accounts they are assigned to
- CSMs can view and manage users within their assigned accounts
- CSMs cannot assign other CSMs or modify account assignments

### User Access Rules
- Users can only view their own account assignments
- Users cannot modify assignments
- Users can view other users in the same account (if permitted by account role)

## Business Logic

### Assignment Rules

#### CSM Assignment
1. Only users with role 'csm' can be assigned to accounts
2. CSMs can be assigned to multiple accounts
3. Accounts can have multiple CSMs (recommended: 1 primary, multiple secondary)
4. Assignment requires admin+ privileges
5. Assignment history is tracked for audit purposes

#### User Assignment
1. Only users with role 'user' can be assigned to customer accounts
2. Users can be assigned to multiple accounts if needed
3. Users have specific roles within each account
4. Assignment requires admin+ privileges
5. Supports bulk assignment operations

### Data Integrity
1. All assignments are logged in audit trail
2. Soft deletion prevents data loss
3. Foreign key constraints ensure referential integrity
4. Unique constraints prevent duplicate assignments
5. ON CONFLICT handling for upsert operations

## Service Layer

### CSM Assignment Service
```javascript
const csmAssignmentService = {
  assign(assignmentData),
  remove(csmId, accountId),
  getByCSM(csmId),
  getAccountsByCSM(csmId),
  getCSMsByAccount(accountId),
  getUnassignedAccounts(),
  getAvailableCSMs()
}
```

### User Account Service
```javascript
const userAccountService = {
  assign(assignmentData),
  remove(userId, accountId),
  getByUser(userId),
  getByAccount(accountId),
  getUnassignedUsers(),
  getAvailableUsers(accountId)
}
```

## Implementation Benefits

### 1. Scalability
- Supports unlimited CSMs and customer accounts
- Efficient database queries with proper indexing
- Bulk operations for large-scale assignments

### 2. Security
- Role-based access control
- Audit logging for all assignment changes
- Rate limiting on sensitive operations

### 3. Flexibility
- Support for multiple CSMs per account
- Support for users in multiple accounts
- Configurable roles within accounts

### 4. Maintainability
- Clean separation of concerns
- Comprehensive error handling
- Detailed logging and monitoring

## Usage Examples

### 1. Assign CSM to Account
```javascript
POST /api/accounts/account-123/assign-csm
{
  "csmId": "csm-456",
  "isPrimary": true,
  "notes": "Primary CSM for enterprise client"
}
```

### 2. Assign User to Account
```javascript
POST /api/assignments/user-accounts
{
  "userId": "user-789",
  "accountId": "account-123",
  "roleInAccount": "member"
}
```

### 3. Bulk Assign Users
```javascript
POST /api/assignments/bulk/users-to-account
{
  "userIds": ["user-1", "user-2", "user-3"],
  "accountId": "account-123",
  "roleInAccount": "member"
}
```

### 4. Get Assignment Statistics
```javascript
GET /api/assignments/stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "csm_stats": {
      "total_csms": 15,
      "assigned_accounts": 45,
      "accounts_with_primary_csm": 40,
      "avg_accounts_per_csm": 3.2
    },
    "user_stats": {
      "total_users": 150,
      "users_with_assignments": 120,
      "assigned_users": 120
    },
    "account_stats": {
      "total_accounts": 50,
      "accounts_with_csm": 45,
      "accounts_with_users": 48
    }
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Assignment Already Exists**: Returns conflict error with existing assignment details
2. **Invalid User Role**: Prevents assignment of incorrect user types
3. **Account Not Found**: Validates account existence before assignment
4. **Permission Denied**: Role-based access control enforcement
5. **Database Constraints**: Handles unique constraint violations gracefully

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "details": {
    "code": "ERROR_CODE",
    "field": "fieldName"
  }
}
```

## Future Enhancements

### Planned Features
1. **Assignment Templates**: Pre-defined assignment patterns for common scenarios
2. **Auto-Assignment Rules**: Automatic CSM assignment based on account criteria
3. **Assignment Notifications**: Email/SMS notifications for assignment changes
4. **Assignment Analytics**: Detailed reporting on assignment effectiveness
5. **Assignment Workflow**: Approval process for sensitive assignments

### Possible Extensions
1. **Geographic Assignment**: CSM assignment based on account location
2. **Workload Balancing**: Automatic distribution based on CSM capacity
3. **Skill-Based Assignment**: Match CSMs to accounts based on expertise
4. **Temporary Assignments**: Time-limited assignments with auto-expiry

## Monitoring & Analytics

### Key Metrics
1. Assignment distribution across CSMs
2. Account coverage percentage
3. User assignment completion rate
4. Assignment change frequency
5. Access pattern analysis

### Audit Trail
- All assignment operations are logged
- Change history with timestamps and user attribution
- IP address and user agent tracking
- Rollback capabilities for accidental changes

## Conclusion

The User & Account Assignment Logic provides a comprehensive, scalable, and secure foundation for managing customer relationships in the Framtt Superadmin platform. The implementation supports current requirements while providing flexibility for future enhancements and growth.
