# User Management Quick Start Guide

## Quick Reference for Common Operations

### Prerequisites

1. Backend server running: `npm run dev`
2. Admin user credentials (CorporateAdmin or SuperAdmin role)
3. JWT token from login

### Getting Started

#### 1. Login as Admin
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Save the returned `token` for use in subsequent requests.

### Common Operations

#### List All Users
```bash
curl -X GET "http://localhost:3001/api/v1/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Search Users
```bash
# Search by email, name, or member ID
curl -X GET "http://localhost:3001/api/v1/admin/users?search=john&status=Active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get User Details
```bash
curl -X GET http://localhost:3001/api/v1/admin/users/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create New User
```bash
curl -X POST http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "UFO12345",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!",
    "roleId": 1,
    "marketId": 1,
    "preferredLanguageId": 1,
    "mobile": "+1234567890",
    "timeZone": "America/New_York"
  }'
```

#### Update User
```bash
curl -X PUT http://localhost:3001/api/v1/admin/users/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "timeZone": "America/Los_Angeles"
  }'
```

#### Deactivate User
```bash
curl -X POST http://localhost:3001/api/v1/admin/users/123/deactivate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Activate User
```bash
curl -X POST http://localhost:3001/api/v1/admin/users/123/activate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Assign Role
```bash
curl -X PUT http://localhost:3001/api/v1/admin/users/123/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": 2
  }'
```

#### Reset Password
```bash
curl -X POST http://localhost:3001/api/v1/admin/users/123/reset-password \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Returns a temporary password that must be changed on first login.

#### Get User Activity
```bash
curl -X GET "http://localhost:3001/api/v1/admin/users/123/activity?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Bulk Deactivate Users
```bash
curl -X POST http://localhost:3001/api/v1/admin/users/bulk/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [123, 124, 125],
    "status": "Inactive"
  }'
```

### Role Management

#### List All Roles
```bash
curl -X GET http://localhost:3001/api/v1/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Role Details
```bash
curl -X GET http://localhost:3001/api/v1/admin/roles/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Role (SuperAdmin only)
```bash
curl -X POST http://localhost:3001/api/v1/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "RegionalManager",
    "roleDescription": "Manages regional operations",
    "permissionLevel": 50
  }'
```

### Audit Logs

#### View Recent Audit Logs
```bash
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Filter Audit Logs
```bash
# By user
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs?userId=123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# By action type
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs?action=UserCreated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# By date range
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs?dateFrom=2026-04-01T00:00:00Z&dateTo=2026-04-05T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Security events only
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs?securityFlag=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Export Audit Logs to CSV
```bash
curl -X GET "http://localhost:3001/api/v1/admin/audit-logs/export?dateFrom=2026-04-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output audit-logs.csv
```

### Advanced Filtering

#### Combine Multiple Filters
```bash
curl -X GET "http://localhost:3001/api/v1/admin/users?roleId=1&marketId=1&status=Active&sortBy=lastLoginDate&sortOrder=desc&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Testing

Run the comprehensive test suite:
```bash
cd backend
node test_user_management_api.cjs
```

This will test all endpoints and report success/failure rates.

### Common Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### List Response with Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "totalPages": 5
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### Security Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Role-Based Access**:
   - CorporateAdmin: Can manage UFO users
   - SuperAdmin: Can manage all users and roles
3. **Self-Protection**: Cannot delete or deactivate your own account
4. **Audit Trail**: All operations are logged for compliance
5. **Protected Roles**: System roles (UFO, CorporateAdmin, SuperAdmin) cannot be modified

### Tips

1. **Use pagination** - Always specify page and limit for large datasets
2. **Filter early** - Use filters to reduce result sets before retrieving data
3. **Check audit logs** - Review audit logs regularly for security monitoring
4. **Bulk operations** - Use bulk endpoints for efficiency when managing multiple users
5. **Test first** - Use the test script to verify functionality before integration

### Troubleshooting

#### "Unauthorized" Error
- Check that your JWT token is valid and not expired
- Ensure you're including the `Authorization: Bearer TOKEN` header

#### "Forbidden" Error
- Verify your user has the required role (CorporateAdmin or SuperAdmin)
- Some operations (like creating roles) require SuperAdmin

#### "Validation Error"
- Check request body matches the required schema
- Ensure passwords meet complexity requirements
- Verify required fields are present

#### "Not Found" Error
- Confirm the user/role ID exists
- Check that the resource hasn't been soft-deleted

### Need More Details?

- Full API documentation: `USER_MANAGEMENT_API.md`
- Implementation details: `USER_MANAGEMENT_SUMMARY.md`
- Type definitions: `src/types/user-management.types.ts`
- Test examples: `test_user_management_api.cjs`
