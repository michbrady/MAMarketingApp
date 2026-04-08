# User Management API Documentation

## Overview

Complete backend implementation for Sprint 7: Admin Panel & User Management. This system provides comprehensive user management, role management, and audit logging capabilities for administrators.

## Architecture

### Services Layer
- **UserManagementService** - CRUD operations for users, role/market assignment, bulk operations
- **RoleManagementService** - Role creation, updates, and permission management
- **AuditLogService** - Audit trail logging, filtering, and export

### Controllers Layer
- **UserManagementController** - HTTP endpoints for user operations
- **RoleManagementController** - HTTP endpoints for role operations
- **AuditLogController** - HTTP endpoints for audit logs

### Routes
All routes are under `/api/v1/admin/*` and require authentication + admin role:
- `/admin/users` - User management endpoints
- `/admin/roles` - Role management endpoints
- `/admin/audit-logs` - Audit log endpoints

## API Endpoints

### User Management

#### GET /api/v1/admin/users
Get all users with filtering and pagination.

**Query Parameters:**
- `roleId` (optional) - Filter by role ID
- `marketId` (optional) - Filter by market ID
- `status` (optional) - Filter by status (Active, Inactive, Suspended, PendingVerification)
- `search` (optional) - Search by email, name, or member ID
- `dateFrom` (optional) - Filter by creation date (ISO 8601)
- `dateTo` (optional) - Filter by creation date (ISO 8601)
- `sortBy` (optional) - Sort by field (name, email, createdDate, lastLoginDate)
- `sortOrder` (optional) - Sort order (asc, desc)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50, max: 100) - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "memberId": "UFO001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roleName": "UFO",
      "marketName": "United States",
      "status": "Active",
      "lastLoginDate": "2026-04-05T10:00:00Z",
      "stats": {
        "totalShares": 150,
        "totalContacts": 45,
        "totalFollowUps": 12,
        "engagementRate": 8.0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

#### GET /api/v1/admin/users/:id
Get user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "memberId": "UFO001",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "mobile": "+1234567890",
    "roleId": 1,
    "roleName": "UFO",
    "marketId": 1,
    "marketName": "United States",
    "marketCode": "US",
    "status": "Active",
    "emailVerified": true,
    "mobileVerified": false,
    "lastLoginDate": "2026-04-05T10:00:00Z",
    "createdDate": "2026-01-01T00:00:00Z",
    "stats": { ... }
  }
}
```

#### POST /api/v1/admin/users
Create new user.

**Request Body:**
```json
{
  "memberId": "UFO123",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "SecurePassword123!",
  "roleId": 1,
  "marketId": 1,
  "preferredLanguageId": 1,
  "mobile": "+1234567890",
  "timeZone": "America/New_York"
}
```

**Validation Rules:**
- `memberId` - Required, max 50 characters
- `email` - Required, valid email format, max 255 characters
- `firstName` - Required, max 100 characters
- `lastName` - Required, max 100 characters
- `password` - Required, min 8 characters, must contain uppercase, lowercase, number, and special character
- `roleId` - Required, positive integer
- `marketId` - Required, positive integer
- `preferredLanguageId` - Required, positive integer
- `mobile` - Optional, max 20 characters
- `timeZone` - Optional, max 50 characters

#### PUT /api/v1/admin/users/:id
Update user.

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@example.com",
  "status": "Active",
  "timeZone": "America/Los_Angeles"
}
```

#### DELETE /api/v1/admin/users/:id
Delete user (soft delete - sets status to Inactive).

**Note:** Cannot delete your own account.

#### POST /api/v1/admin/users/:id/activate
Activate user (sets status to Active).

#### POST /api/v1/admin/users/:id/deactivate
Deactivate user (sets status to Inactive).

**Note:** Cannot deactivate your own account.

#### PUT /api/v1/admin/users/:id/role
Assign role to user.

**Request Body:**
```json
{
  "roleId": 2
}
```

**Note:** Cannot downgrade your own role to a lower permission level.

#### PUT /api/v1/admin/users/:id/market
Assign market to user.

**Request Body:**
```json
{
  "marketId": 5
}
```

#### POST /api/v1/admin/users/:id/reset-password
Reset user password.

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "temporaryPassword": "xyz123ABC!",
    "expiresAt": "2026-04-06T10:00:00Z"
  }
}
```

#### GET /api/v1/admin/users/:id/activity
Get user activity history.

**Query Parameters:**
- `days` (optional, default: 30, max: 365) - Number of days of history

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "eventType": "UserUpdated",
      "eventDate": "2026-04-05T10:00:00Z",
      "description": "User updated: user@example.com",
      "entityType": "User",
      "entityId": 1
    }
  ]
}
```

#### POST /api/v1/admin/users/bulk/status
Bulk update user status.

**Request Body:**
```json
{
  "userIds": [1, 2, 3],
  "status": "Inactive"
}
```

**Limits:** Max 100 users per request

#### POST /api/v1/admin/users/bulk/role
Bulk assign role to users.

**Request Body:**
```json
{
  "userIds": [1, 2, 3],
  "roleId": 1
}
```

**Limits:** Max 100 users per request

#### POST /api/v1/admin/users/bulk/delete
Bulk delete users.

**Request Body:**
```json
{
  "userIds": [1, 2, 3]
}
```

**Limits:** Max 100 users per request

### Role Management

#### GET /api/v1/admin/roles
Get all roles.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roleId": 1,
      "roleName": "UFO",
      "roleDescription": "UnFranchise Owner",
      "permissionLevel": 1,
      "isActive": true,
      "createdDate": "2026-01-01T00:00:00Z",
      "userCount": 1500
    }
  ]
}
```

#### GET /api/v1/admin/roles/active
Get active roles only.

#### GET /api/v1/admin/roles/:id
Get role by ID.

#### POST /api/v1/admin/roles
Create new role (SuperAdmin only).

**Request Body:**
```json
{
  "roleName": "CustomRole",
  "roleDescription": "Custom role description",
  "permissionLevel": 5
}
```

**Validation:**
- `roleName` - Required, max 50 characters
- `roleDescription` - Optional, max 255 characters
- `permissionLevel` - Required, integer between 1 and 999

#### PUT /api/v1/admin/roles/:id
Update role (SuperAdmin only).

**Request Body:**
```json
{
  "roleName": "UpdatedRole",
  "roleDescription": "Updated description",
  "permissionLevel": 10,
  "isActive": true
}
```

**Note:** Cannot modify default system roles (UFO, CorporateAdmin, SuperAdmin).

#### DELETE /api/v1/admin/roles/:id
Delete role (SuperAdmin only).

**Note:**
- Cannot delete default system roles
- Cannot delete roles that have users assigned

### Audit Logs

#### GET /api/v1/admin/audit-logs
Get audit logs with filtering.

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `entityType` (optional) - Filter by entity type (User, Role, etc.)
- `action` (optional) - Filter by action type
- `dateFrom` (optional) - Filter by date (ISO 8601)
- `dateTo` (optional) - Filter by date (ISO 8601)
- `securityFlag` (optional) - Filter security events (true/false)
- `complianceFlag` (optional) - Filter compliance events (true/false)
- `page` (optional, default: 1)
- `limit` (optional, default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "auditLogId": 1,
      "userId": 5,
      "userEmail": "admin@example.com",
      "entityType": "User",
      "entityId": 10,
      "action": "UserCreated",
      "description": "User created: newuser@example.com",
      "ipAddress": "192.168.1.1",
      "eventDate": "2026-04-05T10:00:00Z",
      "securityFlag": false,
      "complianceFlag": true
    }
  ],
  "pagination": { ... }
}
```

#### GET /api/v1/admin/audit-logs/export
Export audit logs to CSV.

**Query Parameters:** Same as GET /api/v1/admin/audit-logs (excluding page/limit)

**Response:** CSV file download

#### GET /api/v1/admin/audit-logs/security
Get security-flagged audit logs (SuperAdmin only).

#### GET /api/v1/admin/audit-logs/compliance
Get compliance-flagged audit logs.

## Security Features

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Authorization
- **CorporateAdmin** - Can manage UFO users, view audit logs
- **SuperAdmin** - Can manage all users including admins, manage roles, view security logs

### Audit Logging
All user management operations are automatically logged:
- User created/updated/deleted
- Role assigned
- Password reset
- Bulk operations
- Status changes

Security-sensitive operations are flagged for review:
- Role changes
- Password resets
- User deletions
- Deactivations

### Self-Protection
- Users cannot delete their own account
- Users cannot deactivate their own account
- Users cannot downgrade their own role to a lower permission level
- Default system roles (UFO, CorporateAdmin, SuperAdmin) cannot be modified or deleted

## Database Schema

### Tables Used
- `dbo.[User]` - User records
- `dbo.Role` - Role definitions
- `dbo.Market` - Market/region data
- `dbo.Language` - Language options
- `dbo.AuditLog` - Audit trail

### Indexes
- User email, market, status, and activity date indexes for fast queries
- Audit log indexes on user, entity, action, and date for efficient filtering

## Testing

Run the comprehensive test suite:

```bash
cd backend
node test_user_management_api.cjs
```

The test suite covers:
- Authentication
- User CRUD operations
- Role assignment
- Market assignment
- Activation/deactivation
- Password reset
- User activity retrieval
- Role listing
- Audit log retrieval
- Filtering and search
- Bulk operations
- Authorization checks

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `500` - Internal Server Error

## Performance Considerations

- Pagination is enforced on all list endpoints (max 100 items per page)
- Database queries use indexed fields for filtering
- Bulk operations are limited to 100 items per request
- User stats are calculated in a single query using subqueries

## Future Enhancements

Potential improvements for future sprints:
- Email notifications for password resets
- Two-factor authentication management
- User import/export (CSV, Excel)
- Role permission matrix UI
- Advanced audit log analytics
- User session management
- IP whitelisting/blacklisting
- Rate limiting per user
