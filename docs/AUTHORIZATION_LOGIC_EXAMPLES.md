# Authorization Logic Examples

This document provides detailed examples of how the role-based access control (RBAC) system works for different user roles in the Superadmin application.

## Role Hierarchy

```
Superadmin (Level 4) - Full unrestricted access
Admin (Level 3) - Can manage CSMs and users, assign CSMs to accounts
CSM (Level 2) - Can only access assigned accounts and their users
User (Level 1) - Limited access to own data and assigned accounts
```

## Authorization Examples

### 1. CSM Role Access Patterns

#### When accessing `/api/accounts`
- **CSM Access**: Returns only accounts assigned to the CSM
- **Implementation**: Uses `accountService.getByCSM(csmId, options)` function
- **Query**: Filters accounts through `csm_assignments` table where `csm_id = currentUserId`

```javascript
// In accountController.js - getAccounts function
if (currentUserRole === 'csm') {
  // CSM can only see assigned accounts
  result = await accountService.getByCSM(currentUserId, options);
}
```

#### When accessing `/api/users/:id`
- **CSM Access**: Allow only if the user belongs to an account assigned to the CSM
- **Check Process**:
  1. Verify target user exists
  2. Ensure target user has role 'user' (CSMs can't access other CSMs/admins)
  3. Get CSM's assigned accounts
  4. Get target user's account assignments
  5. Check for common accounts

```javascript
// In userController_enhanced.js - getUser function
if (currentUserRole === 'csm') {
  // CSM can only view users in their assigned accounts
  if (user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. CSM can only view regular users in assigned accounts.'
    });
  }

  // Check if the user belongs to any account assigned to this CSM
  const userAccounts = await userAccountService.getByUser(id);
  const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
  
  const hasCommonAccount = userAccounts.some(userAccount => 
    csmAssignments.some(assignment => assignment.account_id === userAccount.account_id)
  );
  
  if (!hasCommonAccount) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This user is not in any account assigned to you.'
    });
  }
}
```

#### When accessing `/api/users` (listing all users)
- **CSM Access**: Returns only users who belong to accounts assigned to the CSM
- **Implementation**: Uses `userService.getUsersByCSM(csmId, options)` function
- **Query**: Joins users, user_accounts, accounts, and csm_assignments tables

```sql
SELECT DISTINCT u.id, u.email, u.full_name, u.role, u.department, u.phone, u.status, u.created_at, u.updated_at, u.last_login,
       array_agg(DISTINCT a.name) as account_names
FROM users u
INNER JOIN user_accounts ua ON u.id = ua.user_id
INNER JOIN accounts a ON ua.account_id = a.id
INNER JOIN csm_assignments ca ON a.id = ca.account_id
WHERE u.status != 'deleted' AND u.role = 'user' AND ca.csm_id = $csmId
```

### 2. Admin Role Access Patterns

#### Full access to all accounts and users
- **Admin Access**: Can view, create, update all accounts and users (except other admins/superadmins)
- **Account Access**: Uses `accountService.getAll(options)` - no filtering applied
- **User Access**: Can view CSMs and regular users, but not other admins or superadmins

```javascript
// In userController_enhanced.js - getUsers function
if (currentUserRole === 'admin') {
  // Admin can see CSMs and regular users, but not other admins or superadmins
  if (!role) {
    options.role = ['csm', 'user'];
  } else if (!['csm', 'user'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Cannot view users with this role.'
    });
  }
  result = await userService.getAll(options);
}
```

#### Can assign CSMs to accounts
- **Admin Access**: Can create CSM assignments through `/api/accounts/:id/assign-csm` endpoint
- **Authorization**: Protected by `requireAdmin` middleware
- **Implementation**: Uses `csmAssignmentService.assign()` function

```javascript
// In accountController.js - assignCSMToAccount function
const assignCSMToAccount = asyncHandler(async (req, res) => {
  // Only accessible by admin/superadmin due to requireAdmin middleware
  const { accountId } = req.params;
  const { csmId, isPrimary = false, notes } = req.body;
  
  await csmAssignmentService.assign({
    csmId,
    accountId,
    assignedBy: req.user.id,
    isPrimary,
    notes
  });
});
```

### 3. Superadmin Role Access Patterns

#### Full unrestricted access
- **Superadmin Access**: Can access all endpoints, all data, all users
- **No Filtering**: All service calls return complete datasets
- **Override Permissions**: Can impersonate any user, manage any resource

```javascript
// In middleware/auth.js - Role hierarchy checks
if (effectiveRole === 'superadmin') {
  // Superadmin can manage anyone
  return next();
}
```

## Middleware Implementation

### Role-based Route Protection

```javascript
// Different middleware combinations for different access levels

// Superadmin only
router.delete('/:id', requireSuperAdmin, deleteAccount);

// Admin or Superadmin
router.post('/', requireAdmin, createAccount);

// CSM, Admin, or Superadmin
router.get('/', requireCSMOrAbove, getAccounts);

// Any authenticated user
router.get('/profile', requireAuthenticated, getProfile);
```

### Account Access Control

```javascript
// checkAccountAccess middleware
const checkAccountAccess = async (req, res, next) => {
  const { accountId } = req.params;
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  if (currentUserRole === 'superadmin' || currentUserRole === 'admin') {
    // Full access
    return next();
  }

  if (currentUserRole === 'csm') {
    // Check CSM assignments
    const assignments = await csmAssignmentService.getByCSM(currentUserId);
    const hasAccess = assignments.some(assignment => assignment.account_id === accountId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account not assigned to this CSM.'
      });
    }
    return next();
  }

  // Regular users need specific user-account assignments
  if (currentUserRole === 'user') {
    const userAccounts = await userAccountService.getByUser(currentUserId);
    const hasAccess = userAccounts.some(userAccount => userAccount.account_id === accountId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this account.'
      });
    }
    return next();
  }
};
```

### User Management Control

```javascript
// canManageUser middleware
const canManageUser = async (req, res, next) => {
  const { userId: targetUserId } = req.params;
  const currentUserRole = req.user.role;
  const currentUserId = req.user.id;

  // Self-management always allowed
  if (currentUserId === targetUserId) {
    return next();
  }

  // Role hierarchy enforcement
  if (currentUserRole === 'csm') {
    // CSMs can only manage regular users in their assigned accounts
    const targetUser = await userService.findById(targetUserId);
    
    if (targetUser.role === 'user') {
      // Verify account assignments overlap
      const csmAssignments = await csmAssignmentService.getByCSM(currentUserId);
      const userAccounts = await userAccountService.getByUser(targetUserId);
      
      const hasCommonAccount = csmAssignments.some(assignment => 
        userAccounts.some(userAccount => userAccount.account_id === assignment.account_id)
      );
      
      if (hasCommonAccount) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. CSM can only manage users in assigned accounts.'
    });
  }
};
```

## API Endpoint Examples

### CSM Accessing Accounts
```bash
# CSM makes request to get accounts
GET /api/accounts
Authorization: Bearer <csm_jwt_token>

# Response: Only accounts assigned to this CSM
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "123",
        "name": "Assigned Account 1",
        "company_name": "Company A"
      }
    ],
    "total": 1
  }
}
```

### CSM Accessing User
```bash
# CSM tries to access user in assigned account
GET /api/users/456
Authorization: Bearer <csm_jwt_token>

# Response: User details (if user belongs to CSM's assigned account)
{
  "success": true,
  "data": {
    "user": {
      "id": "456",
      "email": "user@company-a.com",
      "full_name": "John Doe",
      "role": "user"
    }
  }
}

# CSM tries to access user NOT in assigned account
GET /api/users/789
Authorization: Bearer <csm_jwt_token>

# Response: Access denied
{
  "success": false,
  "message": "Access denied. This user is not in any account assigned to you."
}
```

### Admin Assigning CSM to Account
```bash
# Admin assigns CSM to account
POST /api/accounts/123/assign-csm
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "csmId": "csm_user_id",
  "isPrimary": true,
  "notes": "Primary CSM for this account"
}

# Response: Assignment created
{
  "success": true,
  "message": "CSM assigned to account successfully",
  "data": {
    "assignment": {
      "csm_id": "csm_user_id",
      "account_id": "123",
      "is_primary": true
    }
  }
}
```

## Security Considerations

1. **JWT Token Validation**: All endpoints verify JWT tokens and check user status
2. **Role Hierarchy**: Lower roles cannot access higher role resources
3. **Account Isolation**: CSMs can only access their assigned accounts
4. **Audit Logging**: All access attempts are logged for audit purposes
5. **Impersonation Controls**: Strict rules govern who can impersonate whom
6. **Rate Limiting**: Sensitive operations have rate limiting applied

## Testing Authorization

Use the provided test scripts to verify authorization logic:
```bash
# Test CSM access to assigned accounts
node scripts/verify-endpoints.js --role csm --test accounts

# Test admin user management
node scripts/verify-endpoints.js --role admin --test users

# Test superadmin full access
node scripts/verify-endpoints.js --role superadmin --test all
```
