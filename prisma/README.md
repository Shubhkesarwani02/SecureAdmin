# Prisma Setup Guide

## Overview
This project uses Prisma as the ORM (Object-Relational Mapping) tool for database management. The schema is defined in `prisma/schema.prisma` and includes all models based on your PostgreSQL database.

## Prerequisites
- PostgreSQL database (local or hosted, e.g., Supabase)
- Node.js installed
- DATABASE_URL environment variable configured

## Setup Steps

### 1. Configure Database Connection
Create a `.env` file in the root directory (use `.env.example` as template):
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

For Supabase:
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Generate Prisma Client
After updating the schema, generate the Prisma Client:
```bash
npm run prisma:generate
```

### 3. Available Prisma Commands

#### Development
```bash
# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Create a migration and apply it
npm run prisma:migrate

# Format the schema file
npm run prisma:format

# Pull schema from existing database
npm run prisma:db:pull

# Push schema changes without migrations
npm run prisma:db:push
```

#### Production
```bash
# Deploy migrations in production
npm run prisma:migrate:deploy
```

## Using Prisma in Your Code

### JavaScript
```javascript
const prisma = require('./config/prisma');

// Example: Get all users
async function getAllUsers() {
  const users = await prisma.user.findMany({
    where: { status: 'active' },
    include: {
      userAccounts: true,
      notifications: true,
    }
  });
  return users;
}

// Example: Create a new user
async function createUser(data) {
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      role: 'admin',
      status: 'active',
    }
  });
  return user;
}

// Example: Update a user
async function updateUser(id, data) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      fullName: data.fullName,
      phone: data.phone,
    }
  });
  return user;
}

// Example: Delete a user
async function deleteUser(id) {
  await prisma.user.delete({
    where: { id }
  });
}
```

### TypeScript
```typescript
import prisma from './config/prisma';
import { UserRole, UserStatus } from '@prisma/client';

// Example with type safety
async function getAllUsers() {
  const users = await prisma.user.findMany({
    where: { status: UserStatus.active },
    include: {
      userAccounts: {
        include: {
          account: true
        }
      }
    }
  });
  return users;
}
```

## Common Queries

### Complex Queries with Relations
```javascript
// Get user with all related data
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    userAccounts: {
      include: {
        account: true
      }
    },
    csmAssignments: true,
    notifications: {
      where: { isRead: false }
    },
    refreshTokens: true
  }
});

// Get accounts with health scores and alerts
const accounts = await prisma.account.findMany({
  include: {
    healthScores: {
      orderBy: { lastUpdated: 'desc' },
      take: 1
    },
    healthAlerts: {
      where: { status: 'active' }
    },
    csmAssignments: {
      where: { isPrimary: true },
      include: { csm: true }
    }
  }
});
```

### Transactions
```javascript
// Use transaction for multiple operations
const result = await prisma.$transaction(async (prisma) => {
  const user = await prisma.user.create({
    data: { /* user data */ }
  });
  
  const account = await prisma.account.create({
    data: { /* account data */ }
  });
  
  const userAccount = await prisma.userAccount.create({
    data: {
      userId: user.id,
      accountId: account.id,
      roleInAccount: 'owner'
    }
  });
  
  return { user, account, userAccount };
});
```

### Aggregations
```javascript
// Count, sum, average, etc.
const stats = await prisma.account.aggregate({
  _count: true,
  _sum: {
    monthlyRevenue: true,
    totalBookings: true
  },
  _avg: {
    monthlyRevenue: true
  },
  where: {
    status: 'active'
  }
});
```

## Schema Models

The following models are available in your Prisma schema:

- **User** - System users with roles (superadmin, admin, csm, user)
- **Account** - Client accounts/companies
- **Client** - Client information and billing
- **Vehicle** - Vehicle inventory
- **Notification** - User and client notifications
- **InviteToken** - User invitation system
- **RefreshToken** - JWT refresh tokens
- **UserAccount** - User-Account relationship
- **CsmAssignment** - CSM to Account assignments
- **AccountHealthScore** - Account health metrics
- **AccountHealthAlert** - Account health alerts
- **SystemLog** - System audit logs
- **AuditLog** - Additional audit logging
- **ImpersonationLog** - User impersonation tracking
- **DashboardMetric** - Dashboard analytics
- **IntegrationCode** - Integration codes for third-party systems

## Best Practices

1. **Always handle errors**: Wrap Prisma calls in try-catch blocks
2. **Use transactions**: For operations that need to be atomic
3. **Optimize queries**: Use `select` and `include` wisely to avoid over-fetching
4. **Connection pooling**: Prisma handles this automatically
5. **Don't forget to disconnect**: The prisma client in config handles this automatically

## Troubleshooting

### Connection Issues
```bash
# Test database connection
npx prisma db execute --stdin < /dev/null
```

### Schema Out of Sync
```bash
# Pull latest schema from database
npm run prisma:db:pull

# Or push your schema to database
npm run prisma:db:push
```

### Prisma Client Not Found
```bash
# Regenerate Prisma Client
npm run prisma:generate
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
