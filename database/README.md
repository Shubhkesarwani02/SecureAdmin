# 🗄️ Database Schema & Migrations

This directory contains all database schema definitions, migration scripts, and data setup for the Framtt Superadmin Dashboard.

## 📁 Database Structure

### 🔢 Migration Scripts (Sequential)

The database schema is built through numbered migration scripts that should be executed in order:

#### Core Tables
1. **`01_create_users_table.sql`** - User accounts and authentication
2. **`02_create_clients_table.sql`** - Rental company clients
3. **`03_create_vehicles_table.sql`** - Vehicle fleet management
4. **`04_create_notifications_table.sql`** - System notifications
5. **`05_create_integration_codes_table.sql`** - API integration codes
6. **`06_create_system_logs_table.sql`** - Audit and system logs
7. **`07_create_dashboard_metrics_table.sql`** - Analytics and KPIs

#### Advanced Features
8. **`08_create_functions_and_triggers.sql`** - Database functions and triggers
9. **`09_create_views_and_final_setup.sql`** - Database views and final configuration
10. **`10_enhanced_schema_for_impersonation.sql`** - Impersonation system tables
11. **`11_sample_data.sql`** - Test and sample data

### 📋 Schema Documentation
- **`final_schema_specification.sql`** - Complete schema overview
- **`schema_verification_and_update.sql`** - Schema validation and updates
- **`../database-setup.sql`** - Root database setup script

## 🚀 Database Setup

### Quick Setup
```bash
# Run the complete setup (from root directory)
psql -d your_database -f database-setup.sql

# Or run individual migrations in order
cd database
psql -d your_database -f 01_create_users_table.sql
psql -d your_database -f 02_create_clients_table.sql
# ... continue with remaining files
```

### Automated Setup
```bash
# Run all migrations in sequence
for file in database/[0-9]*.sql; do
    echo "Running $file..."
    psql -d your_database -f "$file"
done
```

## 📊 Database Schema Overview

### Core Tables

#### 👥 Users (`users`)
- User authentication and profile information
- Role-based access control (SuperAdmin, Admin, CSM, User)
- Password hashing and security settings

#### 🏢 Clients (`clients`)
- Rental company information
- Business details and contact information
- Integration settings and API access

#### 🚗 Vehicles (`vehicles`)
- Vehicle fleet management
- Booking status and availability
- Vehicle specifications and maintenance

#### 🔔 Notifications (`notifications`)
- System notifications and alerts
- User-specific and broadcast messages
- Notification preferences and status

#### 🔑 Integration Codes (`integration_codes`)
- API access codes and tokens
- Client-specific integration settings
- Usage tracking and rate limiting

#### 📝 System Logs (`system_logs`)
- Audit trail for all system actions
- User activity logging
- Security and error event tracking

#### 📈 Dashboard Metrics (`dashboard_metrics`)
- KPI data and analytics
- Performance metrics
- Historical data tracking

### Advanced Features

#### 🎭 Impersonation System
Enhanced tables for admin impersonation functionality:
- Impersonation session tracking
- Security audit for impersonation actions
- Time-limited impersonation tokens

#### 🔍 Database Functions
- Automated data validation
- Business logic enforcement
- Performance optimization functions

#### 📊 Database Views
- Aggregated data views for reporting
- Performance-optimized queries
- Security-filtered data access

## 🔒 Security Features

### Data Protection
- **Password Hashing** - bcrypt with salt rounds
- **Sensitive Data Encryption** - AES-256 encryption for PII
- **Role-Based Access** - Table-level permissions
- **Audit Logging** - All data changes tracked

### Database Security
- **Connection Encryption** - SSL/TLS required
- **Input Validation** - SQL injection prevention
- **Query Optimization** - Prepared statements only
- **Access Control** - Role-based database users

## 📋 Database Maintenance

### Regular Tasks
```sql
-- Analyze query performance
ANALYZE;

-- Update table statistics
VACUUM ANALYZE;

-- Check database health
SELECT * FROM pg_stat_activity;

-- Monitor disk usage
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy
```bash
# Daily backup
pg_dump -h localhost -U postgres -d framtt_superadmin > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -h localhost -U postgres -d framtt_superadmin | gzip > backup_$(date +%Y%m%d).sql.gz
```

## 🧪 Testing & Validation

### Schema Validation
```bash
# Run schema validation
psql -d your_database -f schema_verification_and_update.sql
```

### Sample Data
```bash
# Load test data
psql -d your_database -f 11_sample_data.sql
```

### Performance Testing
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE role = 'admin';

-- Index usage analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes;
```

## 🔗 Related Documentation

- **Backend Integration**: [../backend/README.md](../backend/README.md)
- **API Documentation**: [../docs/api/](../docs/api/)
- **Schema Implementation**: [../docs/implementation/SIMPLIFIED_SCHEMA_IMPLEMENTATION.md](../docs/implementation/SIMPLIFIED_SCHEMA_IMPLEMENTATION.md)

## 🚨 Troubleshooting

### Common Issues

#### Connection Problems
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d framtt_superadmin -c "SELECT version();"
```

#### Migration Errors
```bash
# Check migration status
psql -d your_database -c "SELECT * FROM schema_migrations;"

# Rollback last migration if needed
psql -d your_database -f rollback_scripts/rollback_last.sql
```

#### Performance Issues
```sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table bloat
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename)) as size,
    pg_size_pretty(pg_relation_size(tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(tablename) - pg_relation_size(tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public';
```

---

*Last Updated: August 12, 2025*

**Database Version**: PostgreSQL 13+  
**Required Extensions**: uuid-ossp, pgcrypto
