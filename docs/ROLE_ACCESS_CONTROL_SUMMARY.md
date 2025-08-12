# Role-Based Access Control (RBAC) Implementation Summary

## Role Hierarchy and Access Matrix

### 1. **Superadmin (Level 4) - Total Control**
**Can access:** Everything
**Restrictions:** None

#### Permissions:
- ✅ **User Management**: Can manage ALL users (including other superadmins, admins, CSMs, and regular users)
- ✅ **Account Management**: Full access to ALL customer accounts
- ✅ **Impersonation**: Can impersonate ANY user (including other superadmins)
- ✅ **Data Access**: View ALL data across the entire system
- ✅ **System Administration**: Access to all admin settings and system logs
- ✅ **Account Creation**: Can create any type of user account
- ✅ **Role Assignment**: Can assign any role to any user

#### Implementation Details:
```javascript
// Middleware checks
effectiveRole === 'superadmin' // Always grants full access
canManageUser: true // For any target user
canViewAllData: true
canImpersonate: true // For any target user
```

---

### 2. **Admin (Level 3) - Manage Customer Operations**
**Can access:** All customer accounts and users under them
**Restrictions:** Cannot manage other admins or superadmins

#### Permissions:
- ✅ **User Management**: Can manage CSMs and regular users
- ❌ **Admin Management**: Cannot manage other admins or superadmins
- ✅ **Account Management**: Full access to ALL customer accounts
- ✅ **Impersonation**: Can impersonate CSMs and regular users
- ❌ **Impersonation Restrictions**: Cannot impersonate admins or superadmins
- ✅ **Data Access**: View all customer data
- ❌ **System Administration**: No access to core system settings (superadmin only)
- ✅ **Account Creation**: Can create CSM and user accounts
- ✅ **CSM Assignment**: Can assign CSMs to customer accounts

#### Implementation Details:
```javascript
// User management restrictions
if (effectiveRole === 'admin') {
  canManage = ['csm', 'user'].includes(targetUserRole);
}

// Impersonation restrictions
if (impersonatorRole === 'admin') {
  canImpersonate = ['csm', 'user'].includes(targetUserRole);
}
```

---

### 3. **CSM (Customer Success Manager) (Level 2) - Limited to Assigned Accounts**
**Can access:** Only assigned customer accounts and their users
**Restrictions:** Cannot access unassigned accounts or impersonate anyone

#### Permissions:
- ✅ **User Management**: Can manage regular users ONLY in assigned accounts
- ❌ **CSM Management**: Cannot manage other CSMs
- ✅ **Account Access**: Only assigned customer accounts
- ❌ **Account Access Restriction**: Cannot access unassigned accounts
- ❌ **Impersonation**: No impersonation privileges
- ✅ **Data Access**: View data for assigned accounts only
- ❌ **User Creation**: Can create users only in assigned accounts
- ❌ **Assignment Management**: Cannot assign accounts to other CSMs

#### Implementation Details:
```javascript
// Account access check
if (currentUserRole === 'csm') {
  const assignments = await csmAssignmentService.getByCSM(currentUserId);
  const hasAccess = assignments.some(assignment => 
    assignment.account_id === accountId
  );
}

// User management check for CSMs
if (effectiveRole === 'csm' && targetUserRole === 'user') {
  // Check if user is in CSM's assigned accounts
  const hasCommonAccount = csmAssignments.some(assignment => 
    userAccounts.some(userAccount => 
      userAccount.account_id === assignment.account_id
    )
  );
}
```

---

### 4. **User (Level 1) - Own Data Only**
**Can access:** Only their own data and assigned accounts
**Restrictions:** Cannot manage others or access other accounts

#### Permissions:
- ✅ **Self Management**: Can update own profile and preferences
- ❌ **User Management**: Cannot manage any other users
- ✅ **Account Access**: Only accounts they are assigned to
- ❌ **Other Account Access**: Cannot access unassigned accounts
- ❌ **Impersonation**: No impersonation privileges
- ✅ **Data Access**: View only own data and assigned account data
- ❌ **User Creation**: Cannot create any users
- ❌ **Administrative Functions**: No administrative access

#### Implementation Details:
```javascript
// Self-access check
if (currentUserId === targetUserId) {
  return next(); // Users can always access their own data
}

// Account access for users
if (effectiveRole === 'user') {
  const userAccounts = await userAccountService.getByUser(currentUserId);
  const hasAccess = userAccounts.some(userAccount => 
    userAccount.account_id === accountId
  );
}
```

---

## Impersonation Matrix

| Impersonator Role | Can Impersonate | Cannot Impersonate |
|-------------------|-----------------|-------------------|
| **Superadmin** | Everyone (superadmins, admins, CSMs, users) | None |
| **Admin** | CSMs, Users | Admins, Superadmins |
| **CSM** | None | Everyone |
| **User** | None | Everyone |

### Impersonation Security Rules:
1. ❌ **Self-Impersonation**: Users cannot impersonate themselves
2. ❌ **Already Impersonated**: Cannot impersonate users already being impersonated
3. ✅ **Session Tracking**: All impersonation sessions are logged and tracked
4. ✅ **Audit Trail**: Complete audit log of all impersonation activities
5. ✅ **Time Limits**: Impersonation sessions have time limits
6. ✅ **Permission Inheritance**: During impersonation, permissions are based on the impersonator's role

---

## Data Access Controls

### Database-Level Security Functions:
```sql
-- Check if user can access account
can_user_access_account(user_id, account_id) → boolean

-- Check if user can manage another user
can_user_manage_user(manager_id, target_id) → boolean

-- Check impersonation permissions
can_user_impersonate(impersonator_id, target_id) → boolean
```

### Application-Level Middleware:
- `verifyToken`: Validates JWT and user status
- `requireRole([roles])`: Enforces minimum role requirements
- `canManageUser`: Checks user management permissions
- `checkAccountAccess`: Validates account access permissions
- `canImpersonate`: Validates impersonation permissions
- `getEffectiveRole`: Handles impersonation context

---

## Security Features

### 1. **Audit Logging**
- All user actions are logged with user ID and impersonator ID
- Failed access attempts are recorded
- Impersonation sessions are fully tracked

### 2. **Role Hierarchy Enforcement**
- Database triggers prevent unauthorized role changes
- Middleware validates all role-based operations
- Function-level permission checks

### 3. **Session Security**
- JWT tokens include impersonation context
- Refresh tokens are properly managed
- Session timeouts are enforced

### 4. **Data Isolation**
- CSMs only see assigned accounts
- Users only see their own data
- Account-level data segregation

---

## Implementation Status

### ✅ **Completed**
1. Role hierarchy definition and enforcement
2. Enhanced authentication middleware
3. Impersonation controls with proper role checking
4. Database-level security functions
5. Audit logging for all operations
6. Route-level permission enforcement

### 🔄 **Enhanced**
1. User management permissions with role hierarchy
2. Account access controls with assignment validation
3. Impersonation restrictions based on role hierarchy
4. Database triggers for security enforcement

### ✅ **Verified**
1. Superadmin has total control over all users and data
2. Admin can manage CSMs and users but not other admins
3. CSM is limited to assigned customer accounts only
4. Users can only access their own data

---

## Testing

A comprehensive test suite has been created to validate:
- Role hierarchy permissions
- Impersonation matrix enforcement
- Data access controls
- Account assignment validation

The system now fully implements the required role-based access control with proper security measures and audit logging.
