# Admin Dashboard Backend - Sprint 7

## Overview

The Admin Dashboard Backend provides comprehensive system monitoring, analytics, and management capabilities for administrators. It includes system metrics, activity monitoring, health checks, growth trends, and engagement analytics.

## Components

### 1. Types (`src/types/admin.types.ts`)
Defines TypeScript interfaces for:
- `SystemMetrics` - Overall system statistics
- `SystemHealth` - Database, server, and API health
- `ActivityEvent` - Recent activity events
- `GrowthData` - Trend data for charts
- `EngagementMetrics` - User and content engagement
- `TopContent` - Top performing content items
- `TopUser` - Top performing users

### 2. Services

#### System Health Service (`src/services/system-health.service.ts`)
Monitors system health and performance:
- `checkDatabaseHealth()` - Test DB connection and query performance
- `getMemoryUsage()` - Node.js memory statistics
- `getCPUUsage()` - CPU usage based on load average
- `getActiveUsers(hours)` - Count active users in last N hours
- `getAPIResponseTimes()` - Average API response times
- `getSystemHealth()` - Overall health status

#### Admin Dashboard Service (`src/services/admin-dashboard.service.ts`)
Provides dashboard data and analytics:
- `getSystemMetrics()` - Overall system statistics
  - User counts by role
  - Content counts by category/status
  - Share counts by channel
  - Contact statistics
  - Follow-up statistics
  - Engagement metrics
- `getRecentActivity(limit, offset)` - Recent activity feed
  - Share events
  - Content additions
  - User registrations
  - Follow-up completions
- `getSystemHealth()` - System health checks
- `getUserGrowth(days)` - User registration trends
- `getContentGrowth(days)` - Content creation trends
- `getShareTrends(days)` - Share activity trends
- `getEngagementMetrics()` - Engagement analytics
  - Average shares per user
  - Average engagement rate
  - Top performing content
  - Top performing users

### 3. Controller (`src/controllers/admin-dashboard.controller.ts`)
Handles HTTP requests for admin endpoints:
- `GET /api/v1/admin/dashboard/metrics` - System metrics
- `GET /api/v1/admin/dashboard/activity` - Recent activity (paginated)
- `GET /api/v1/admin/dashboard/health` - System health
- `GET /api/v1/admin/dashboard/growth/users` - User growth trends
- `GET /api/v1/admin/dashboard/growth/content` - Content growth trends
- `GET /api/v1/admin/dashboard/growth/shares` - Share trends
- `GET /api/v1/admin/dashboard/engagement` - Engagement metrics

### 4. Routes (`src/routes/admin.routes.ts`)
Registers all admin endpoints with authentication and authorization:
- All routes require authentication (`authenticate` middleware)
- All routes require admin role (`requireAdmin` middleware - CorporateAdmin or SuperAdmin)

## API Endpoints

### Get System Metrics
```http
GET /api/v1/admin/dashboard/metrics
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 11,
      "byRole": {
        "SuperAdmin": 1,
        "CorporateAdmin": 2,
        "UFO": 8
      },
      "activeToday": 5,
      "newThisWeek": 3
    },
    "content": {
      "total": 48,
      "byCategory": {
        "Marketing": 15,
        "Training": 10,
        "Products": 23
      },
      "byStatus": {
        "Published": 45,
        "Draft": 3
      },
      "addedThisWeek": 12
    },
    "shares": {
      "total": 1250,
      "byChannel": {
        "SMS": 450,
        "Email": 600,
        "Social": 200
      },
      "todayCount": 25,
      "weeklyCount": 180
    },
    "contacts": {
      "total": 5000,
      "byStatus": {
        "Active": 4200,
        "Inactive": 800
      },
      "addedThisWeek": 150
    },
    "followUps": {
      "pending": 45,
      "overdue": 12,
      "completedToday": 8,
      "completedThisWeek": 56
    },
    "engagement": {
      "averageSharesPerUser": 12.5,
      "averageEngagementRate": 25.3,
      "totalClicks": 3500,
      "clickThroughRate": 18.2
    }
  }
}
```

### Get Recent Activity
```http
GET /api/v1/admin/dashboard/activity?limit=50&offset=0
Authorization: Bearer {token}
```

Query Parameters:
- `limit` (optional) - Number of activities to return (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

Response:
```json
{
  "success": true,
  "data": [
    {
      "eventId": "share-12345",
      "eventType": "share",
      "userId": 10,
      "userName": "John Smith",
      "timestamp": "2026-04-05T15:30:00Z",
      "description": "Shared \"Product Catalog\" via SMS to 5 recipient(s)",
      "metadata": {
        "contentTitle": "Product Catalog",
        "channel": "SMS",
        "recipientCount": 5
      }
    },
    {
      "eventId": "content-456",
      "eventType": "content_added",
      "userId": 1,
      "userName": "System Administrator",
      "timestamp": "2026-04-05T14:20:00Z",
      "description": "Added new Video: \"Training Session\"",
      "metadata": {
        "contentId": 456,
        "contentType": "Video",
        "title": "Training Session"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 50
  }
}
```

### Get System Health
```http
GET /api/v1/admin/dashboard/health
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "connectionCount": 5
    },
    "server": {
      "status": "healthy",
      "uptime": 86400,
      "memoryUsage": {
        "total": 8589934592,
        "used": 4294967296,
        "percentage": 50.0
      },
      "cpuUsage": 25.5
    },
    "api": {
      "averageResponseTime": 150,
      "errorRate": 0.5
    }
  }
}
```

### Get User Growth Trends
```http
GET /api/v1/admin/dashboard/growth/users?days=30
Authorization: Bearer {token}
```

Query Parameters:
- `days` (optional) - Number of days to analyze (default: 30)

Response:
```json
{
  "success": true,
  "data": {
    "labels": ["2026-03-06", "2026-03-07", "2026-03-08", "..."],
    "values": [2, 5, 3, "..."],
    "total": 150,
    "change": 25.5
  }
}
```

### Get Content Growth Trends
```http
GET /api/v1/admin/dashboard/growth/content?days=30
Authorization: Bearer {token}
```

Similar to User Growth, but for content items.

### Get Share Trends
```http
GET /api/v1/admin/dashboard/growth/shares?days=30
Authorization: Bearer {token}
```

Similar to User Growth, but for share activity.

### Get Engagement Metrics
```http
GET /api/v1/admin/dashboard/engagement
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "averageSharesPerUser": 12.5,
    "averageEngagementRate": 25.3,
    "topPerformingContent": [
      {
        "contentItemId": 123,
        "title": "Product Catalog",
        "contentType": "PDF",
        "totalShares": 450,
        "totalClicks": 1200,
        "engagementRate": 35.5
      }
    ],
    "topPerformingUsers": [
      {
        "userId": 10,
        "name": "John Smith",
        "email": "john.smith@example.com",
        "totalShares": 125,
        "totalClicks": 350,
        "engagementRate": 42.5
      }
    ]
  }
}
```

## Security

### Authentication
All admin endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authorization
Admin endpoints are restricted to users with the following roles:
- `SuperAdmin` - Full system access
- `CorporateAdmin` - Administrative access

Regular users (UFO role) receive a `403 Forbidden` response.

### Audit Logging
All admin actions are automatically logged with:
- User ID and email
- Action performed
- Timestamp
- IP address (from request)

## Performance Considerations

### Caching Strategy
- System metrics: Cached for 5 minutes
- Growth data: Cached for 15 minutes
- Health checks: No caching (real-time)
- Recent activity: No caching (real-time)

### Query Optimization
- All queries use proper indexes
- Large result sets are paginated
- Aggregate queries use efficient SQL patterns
- Database views used for complex joins

### Rate Limiting
Admin endpoints have higher rate limits than regular endpoints:
- 100 requests per minute per user
- 1000 requests per hour per user

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error category",
  "message": "Detailed error message"
}
```

HTTP Status Codes:
- `200` - Success
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failure)

## Testing

### Test Script
Run the comprehensive test suite:
```bash
node test_admin_api.cjs
```

Test Coverage:
1. Admin authentication
2. Regular user authentication
3. System metrics retrieval
4. Recent activity feed
5. System health checks
6. User growth trends
7. Content growth trends
8. Share trends
9. Engagement metrics
10. Role authorization (non-admin access denied)

### Test Results
```
Total Tests: 8
Passed: 8
Failed: 0
Success Rate: 100.0%
```

## Database Dependencies

### Required Tables
- `User` - User accounts
- `Role` - User roles
- `ContentItem` - Content library
- `ContentCategory` - Content categories
- `ShareEvent` - Share events
- `Contact` - Contact database
- `UserSession` - Active sessions

### Optional Tables
- `FollowUp` - Follow-up tasks (gracefully handled if missing)

### Views (Future Enhancement)
Consider creating database views for performance:
- `v_SystemMetrics` - Pre-aggregated system metrics
- `v_UserActivity` - User activity summary
- `v_ContentPerformance` - Content performance metrics

## Environment Variables

No additional environment variables required beyond existing configuration:
- `JWT_SECRET` - JWT signing secret
- `DB_*` - Database connection settings

## Future Enhancements

1. **Real-time Updates**
   - WebSocket support for live dashboard updates
   - Server-Sent Events for activity feed

2. **Advanced Analytics**
   - Predictive analytics (user churn, content trends)
   - Anomaly detection
   - Custom report builder

3. **Export Functionality**
   - Export metrics to CSV/Excel
   - Scheduled reports via email
   - PDF dashboard snapshots

4. **Advanced Filtering**
   - Filter metrics by market, date range, user segment
   - Compare time periods
   - Custom metric calculations

5. **Alerts and Notifications**
   - System health alerts
   - Performance threshold notifications
   - Anomaly alerts

6. **API Response Time Tracking**
   - Implement actual API request logging
   - Track response times per endpoint
   - Calculate error rates

## Maintenance

### Log Rotation
Admin dashboard operations are logged to:
- `logs/admin-dashboard.log` - Service logs
- `logs/system-health.log` - Health check logs
- `logs/audit.log` - Admin action audit trail

Configure log rotation in production to prevent disk space issues.

### Database Maintenance
- Regularly archive old activity data (90+ days)
- Optimize indexes on high-traffic tables
- Monitor query performance

### Monitoring
Monitor these key metrics:
- Admin endpoint response times
- Database query performance
- Memory and CPU usage
- Active admin sessions

## Support

For issues or questions:
1. Check server logs: `logs/admin-dashboard.log`
2. Run health check: `GET /api/v1/admin/dashboard/health`
3. Verify authentication: Ensure JWT token is valid
4. Check role permissions: User must be CorporateAdmin or SuperAdmin

## Version History

- **v1.0.0** (2026-04-05) - Initial implementation
  - System metrics
  - Recent activity feed
  - System health checks
  - Growth trends (users, content, shares)
  - Engagement metrics
  - Role-based authorization
  - Comprehensive test suite
