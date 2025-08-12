# 🏥 Account Health Monitoring API

## Overview

The Account Health Monitoring system provides comprehensive health scoring, risk assessment, and proactive alerting for client accounts in the Framtt Superadmin Dashboard.

## 📊 Features

### Health Scoring
- **Overall Health Score** (0-100) - Composite score based on multiple factors
- **Usage Score** - Platform engagement and activity levels
- **Engagement Score** - User interaction and feature adoption
- **Financial Score** - Payment history and subscription status
- **Support Score** - Support ticket volume and resolution

### Risk Assessment
- **Risk Levels**: Low, Medium, High, Critical
- **Churn Probability** - Percentage likelihood of client leaving
- **Health Trends** - Improving, Stable, Declining, Critical

### Alert System
- **Proactive Alerts** - Automatic notifications for health issues
- **Alert Types**: Churn Risk, Low Engagement, Support Spikes, Feature Adoption
- **Severity Levels**: Low, Medium, High, Critical
- **Alert Management** - Acknowledge and resolve alerts

## 🔗 API Endpoints

### Base URL: `/api/account-health`

All endpoints require authentication. Role-based access control applies:
- **SuperAdmin**: Full access to all endpoints
- **Admin**: Access to most endpoints except sensitive operations
- **CSM**: Access to assigned client data
- **User**: No access to health monitoring

---

### 📊 GET `/overview`
Get summary statistics for account health monitoring.

**Authentication**: Required  
**Authorization**: All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClients": 5,
    "healthyClients": 2,
    "atRiskClients": 2,
    "criticalClients": 1,
    "averageHealthScore": 71,
    "totalActiveAlerts": 4,
    "criticalAlerts": 1,
    "churnRiskClients": 2,
    "lastUpdated": "2025-08-12T10:30:00Z"
  }
}
```

---

### 📈 GET `/scores`
Get health scores for all clients with filtering and sorting options.

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin, CSM

**Query Parameters:**
- `riskLevel` (string): Filter by risk level (low, medium, high, critical)
- `sortBy` (string): Sort field (overallScore, churnProbability, companyName)
- `sortOrder` (string): Sort direction (asc, desc)
- `minScore` (number): Minimum health score filter
- `maxScore` (number): Maximum health score filter

**Example Request:**
```
GET /api/account-health/scores?riskLevel=high&sortBy=churnProbability&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "clientId": 5,
      "companyName": "Sunshine Auto Rental",
      "overallScore": 45,
      "usageScore": 40,
      "engagementScore": 35,
      "financialScore": 55,
      "supportScore": 50,
      "riskLevel": "critical",
      "healthTrend": "critical",
      "churnProbability": 65.0,
      "daysSinceLastActivity": 14,
      "featureAdoptionRate": 22.1,
      "lastHealthCheck": "2025-08-12T10:30:00Z",
      "activeAlerts": 1,
      "criticalAlerts": 1
    }
  ],
  "total": 1
}
```

---

### 🚨 GET `/alerts`
Get account health alerts with filtering options.

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin, CSM

**Query Parameters:**
- `status` (string): Filter by status (active, acknowledged, resolved)
- `severity` (string): Filter by severity (low, medium, high, critical)
- `clientId` (number): Filter by specific client
- `alertType` (string): Filter by alert type (churn_risk, low_engagement, support_spike, feature_adoption, contract_renewal)

**Example Request:**
```
GET /api/account-health/alerts?status=active&severity=critical
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "clientId": 5,
      "companyName": "Sunshine Auto Rental",
      "alertType": "low_engagement",
      "severity": "critical",
      "title": "Critical Low Engagement",
      "description": "Sunshine Auto Rental has not logged in for 14 days",
      "metricValue": 45.0,
      "thresholdValue": 60.0,
      "recommendedAction": "Urgent: Contact immediately and offer onboarding assistance",
      "status": "active",
      "assignedTo": "Account Manager",
      "createdAt": "2025-08-12T08:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 🏢 GET `/client/:clientId`
Get detailed health information for a specific client.

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin, CSM

**Parameters:**
- `clientId` (number): Client ID to get health details for

**Response:**
```json
{
  "success": true,
  "data": {
    "healthScore": {
      "id": 1,
      "clientId": 1,
      "companyName": "Premium Fleet Services",
      "overallScore": 92,
      "usageScore": 95,
      "engagementScore": 90,
      "financialScore": 95,
      "supportScore": 88,
      "riskLevel": "low",
      "healthTrend": "improving",
      "churnProbability": 5.0,
      "daysSinceLastActivity": 0,
      "featureAdoptionRate": 85.5,
      "lastHealthCheck": "2025-08-12T10:30:00Z",
      "activeAlerts": 0,
      "criticalAlerts": 0
    },
    "alerts": [],
    "engagementMetrics": {
      "clientId": 1,
      "companyName": "Premium Fleet Services",
      "dailyActiveUsers": 45,
      "weeklyActiveUsers": 180,
      "monthlyActiveUsers": 450,
      "sessionDurationAvg": 25.5,
      "pageViews": 1250,
      "featureInteractions": 890,
      "apiCalls": 2400,
      "bookingConversions": 234,
      "revenueGenerated": 15750.00,
      "npsScore": 85,
      "csatScore": 5
    }
  }
}
```

---

### ⚠️ GET `/high-risk`
Get list of high-risk clients (high or critical risk level, or churn probability > 30%).

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "clientId": 5,
      "companyName": "Sunshine Auto Rental",
      "overallScore": 45,
      "riskLevel": "critical",
      "churnProbability": 65.0,
      "healthTrend": "critical"
    }
  ],
  "total": 1
}
```

---

### ✅ POST `/alerts/:alertId/acknowledge`
Acknowledge an alert (mark as seen/reviewed).

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin, CSM

**Parameters:**
- `alertId` (number): Alert ID to acknowledge

**Request Body:**
```json
{
  "acknowledgedBy": "John Doe (optional - will use current user if not provided)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert acknowledged successfully",
  "data": {
    "id": 1,
    "status": "acknowledged",
    "acknowledgedBy": "John Doe",
    "acknowledgedAt": "2025-08-12T10:35:00Z"
  }
}
```

---

### ✅ POST `/alerts/:alertId/resolve`
Resolve an alert (mark as completed/fixed).

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin, CSM

**Parameters:**
- `alertId` (number): Alert ID to resolve

**Request Body:**
```json
{
  "resolvedBy": "Jane Smith (optional - will use current user if not provided)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": 1,
    "status": "resolved",
    "resolvedBy": "Jane Smith",
    "resolvedAt": "2025-08-12T10:40:00Z"
  }
}
```

---

### 🔄 POST `/refresh-scores`
Manually trigger health score calculation for all clients.

**Authentication**: Required  
**Authorization**: SuperAdmin, Admin

**Response:**
```json
{
  "success": true,
  "message": "Health scores refreshed successfully",
  "data": {
    "updatedCount": 5,
    "lastRefresh": "2025-08-12T10:45:00Z"
  }
}
```

## 📈 Health Score Calculation

### Overall Score Components
- **Usage Score (25%)** - Platform activity and engagement
- **Engagement Score (25%)** - Feature adoption and user interaction
- **Financial Score (25%)** - Payment history and subscription health
- **Support Score (25%)** - Support ticket volume and satisfaction

### Risk Level Determination
- **Low Risk**: Score 80-100, Churn Probability < 15%
- **Medium Risk**: Score 60-79, Churn Probability 15-30%
- **High Risk**: Score 40-59, Churn Probability 30-50%
- **Critical Risk**: Score < 40, Churn Probability > 50%

### Alert Triggers
- **Churn Risk**: Overall score drops below 70
- **Low Engagement**: No activity for > 7 days
- **Support Spike**: Support tickets increase > 50% from baseline
- **Feature Adoption**: < 75% of available features enabled
- **Contract Renewal**: Contract expires within 60 days

## 🧪 Testing

Use the provided test script to verify the integration:

```bash
# Run the account health API test
node backend/tools/test-account-health.js
```

**Prerequisites:**
1. Backend server running on port 3001
2. Valid JWT token for authentication
3. Database with sample data

## 🔒 Security Considerations

- All endpoints require authentication
- Role-based access control prevents unauthorized data access
- Sensitive client data is only accessible to authorized users
- Rate limiting applies to prevent abuse
- Input validation and sanitization on all parameters

## 🚀 Integration with Frontend

The account health API can be integrated with the frontend dashboard to provide:

1. **Health Overview Widget** - Summary statistics on main dashboard
2. **Client Health Cards** - Health scores in client list views
3. **Alert Center** - Centralized alert management interface
4. **Risk Dashboard** - High-risk client monitoring page
5. **Client Detail Views** - Detailed health metrics per client

## 📊 Future Enhancements

- Real-time health score updates via WebSocket
- Machine learning-based churn prediction
- Custom alert thresholds per client
- Health score trending and historical analysis
- Integration with external CRM systems
- Automated action workflows based on health scores

---

*Last Updated: August 12, 2025*
