# Troubleshooting Guide

This document tracks issues encountered during development, their root causes, and solutions.

---

## Database Issues

### 1. Contact Status CHECK Constraint Error

**Error:**
```
The INSERT statement conflicted with the CHECK constraint "CK_Contact_Status".
The conflict occurred in database "UnFranchiseMarketing", table "dbo.Contact", column 'Status'.
```

**Root Cause:**
- Frontend sends CRM-appropriate status values: `Lead`, `Prospect`, `Customer`, `TeamMember`, `Inactive`
- Database constraint only allowed: `Active`, `Inactive`, `DoNotContact`, `Bounced`
- Mismatch between frontend business logic and database constraints

**Solution:**
```sql
-- Updated constraint to include both CRM and system status values
ALTER TABLE dbo.Contact DROP CONSTRAINT CK_Contact_Status;
ALTER TABLE dbo.Contact
ADD CONSTRAINT CK_Contact_Status
CHECK (Status IN ('Lead', 'Prospect', 'Customer', 'TeamMember', 'Active', 'Inactive', 'DoNotContact', 'Bounced'));
```

**Files Changed:**
- `database/03_Schema_Sharing_Tracking.sql` - Updated constraint definition
- `database/migrations/002_fix_contact_status_admin.sql` - Migration script

**Prevention:**
- Always sync frontend enum types with database constraints
- Document allowed values in both type definitions and schema
- Consider using a shared constants file for status values

---

## API Field Mapping Issues

### 2. Field Name Mismatch (Frontend ↔ Backend)

**Error:**
```
Request failed with status code 400
Either email or mobile is required
```

**Root Cause:**
Frontend and backend use different field names:
- Frontend: `phone`, `company`, `position`
- Backend: `mobile`, `companyName`, `jobTitle`

**Solution:**
Added mapping layer in `frontend/src/lib/api/contacts.ts`:

```typescript
// Request mapping (Frontend → Backend)
const backendData = {
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  mobile: data.phone,           // phone → mobile
  companyName: data.company,     // company → companyName
  jobTitle: data.position,       // position → jobTitle
  // ...
};
```

**Files Changed:**
- `frontend/src/lib/api/contacts.ts` - Added `mapBackendToFrontend()` function
- `frontend/src/lib/api/contacts.ts` - Updated create/update methods with field mapping

**Prevention:**
- Use TypeScript interfaces to enforce type safety
- Create a shared API contract documentation
- Consider using DTOs (Data Transfer Objects) that match exactly

---

### 3. Database Column Name Case Mismatch

**Error:**
```
Contact ID showing as 'undefined' in list
Link: http://localhost:3000/contacts/undefined
```

**Root Cause:**
SQL Server returns column names in PascalCase (as defined in schema):
- Database returns: `ContactID`, `FirstName`, `Mobile`, `CompanyName`
- Frontend mapping only checked for: `contactId`, `firstName`, `mobile`, `companyName`
- TypeScript service layer sometimes uses camelCase, sometimes PascalCase

**Solution:**
Updated mapping function to handle both cases:

```typescript
function mapBackendToFrontend(backendContact: any): Contact {
  return {
    id: (backendContact.ContactID || backendContact.contactId || backendContact.id)?.toString(),
    firstName: backendContact.FirstName || backendContact.firstName || '',
    lastName: backendContact.LastName || backendContact.lastName || '',
    phone: backendContact.Mobile || backendContact.mobile,
    company: backendContact.CompanyName || backendContact.companyName,
    // Handle both PascalCase and camelCase for all fields
  };
}
```

**Files Changed:**
- `frontend/src/lib/api/contacts.ts` - Updated `mapBackendToFrontend()` to handle both cases

**Prevention:**
- Always map database results to camelCase in the service layer
- Use explicit column aliases in SQL queries: `SELECT ContactID AS contactId`
- Consider using an ORM that handles case conversion automatically

---

## Frontend Data Structure Issues

### 4. Contacts List Not Displaying After Creation

**Error:**
Contact created successfully but doesn't appear in the list.

**Root Cause:**
Backend returns:
```json
{
  "success": true,
  "data": [...],        // Array directly
  "pagination": {...}
}
```

Frontend expected:
```typescript
const contacts = contactsData?.data.items || [];  // Looking for nested .items
```

**Solution:**
```typescript
// Changed from:
const contacts = contactsData?.data.items || [];
const pagination = contactsData?.data.pagination;

// To:
const contacts = contactsData?.data || [];
const pagination = contactsData?.pagination;
```

**Files Changed:**
- `frontend/src/app/(dashboard)/contacts/page.tsx` - Fixed data access path

**Prevention:**
- Document API response structures in OpenAPI/Swagger spec
- Use TypeScript interfaces for all API responses
- Add response validation/testing

---

### 5. React Key Prop Warning - Missing ID

**Error:**
```
Each child in a list should have a unique "key" prop.
Check the render method of `ContentGrid`.
```

**Root Cause:**
- Content items from backend have `ContentItemID` (PascalCase)
- Frontend expects `id` field for React keys
- No mapping was in place for content items

**Solution:**
Added content item mapping:

```typescript
function mapContentItemToFrontend(item: any): any {
  return {
    ...item,
    id: item.ContentItemID || item.id,
  };
}
```

**Files Changed:**
- `frontend/src/lib/api/client.ts` - Added `mapContentItemToFrontend()` function

**Prevention:**
- Always map API responses to match frontend type definitions
- Add TypeScript strict mode to catch missing fields at compile time

---

### 6. StatusBadge Component Crash on Unknown Status

**Error:**
```
Cannot read properties of undefined (reading 'bg')
at StatusBadge (src/components/contacts/StatusBadge.tsx:55:85)
```

**Root Cause:**
StatusBadge component assumes status value exists in `statusConfig` object:
```typescript
const config = statusConfig[status];  // undefined if status not in object
return <span className={`${config.bg} ...`} />  // crashes
```

**Solution:**
Added fallback for unknown status values:

```typescript
const config = statusConfig[status] || {
  label: status || "Unknown",
  bg: "bg-gray-50",
  text: "text-gray-600",
  border: "border-gray-200",
};
```

**Files Changed:**
- `frontend/src/components/contacts/StatusBadge.tsx` - Added fallback config

**Prevention:**
- Always provide fallbacks for enum-based lookups
- Add TypeScript exhaustive checks for status values
- Validate data at component boundaries

---

## Backend Error Handling Issues

### 7. Empty Error Response (HTTP 500)

**Error:**
```
Error status: 500
Error data: {}
```

**Root Cause:**
Backend error handler wasn't including the actual error message in response:

```typescript
catch (error: any) {
  logger.error('Get contact error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Failed to retrieve contact'  // Generic message, no actual error
  });
}
```

**Solution:**
Updated error handler to return actual error details:

```typescript
catch (error: any) {
  logger.error('Get contact error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'Failed to retrieve contact',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

**Files Changed:**
- `backend/src/controllers/contact.controller.ts` - Enhanced error responses

**Prevention:**
- Always include `error.message` in error responses (in development)
- Use structured logging with error context
- Never expose stack traces in production

---

## Authentication Issues

### 8. Auth Validation Endpoint Mismatch

**Error:**
Frontend stuck on loading screen, couldn't redirect to login.

**Root Cause:**
- Frontend `authStore.validateToken()` called `/auth/validate` endpoint
- Backend only had: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- Endpoint didn't exist

**Solution:**
Changed frontend to use existing `/auth/me` endpoint:

```typescript
// Changed from:
const response = await fetch(`${apiUrl}/auth/validate`, ...);

// To:
const response = await fetch(`${apiUrl}/auth/me`, ...);
```

**Files Changed:**
- `frontend/src/store/authStore.ts` - Updated endpoint call

**Prevention:**
- Document all backend endpoints in API specification
- Use OpenAPI/Swagger to generate TypeScript clients
- Add E2E tests for critical auth flows

---

## Common Patterns & Best Practices

### Field Name Mapping Strategy

**Problem:** SQL Server uses PascalCase, TypeScript uses camelCase

**Solution Pattern:**
```typescript
// Always check both cases in mapping functions
function mapFromDatabase(dbRecord: any): FrontendType {
  return {
    id: (dbRecord.ID || dbRecord.id)?.toString(),
    firstName: dbRecord.FirstName || dbRecord.firstName,
    // Check PascalCase first, then camelCase
  };
}
```

### Error Response Structure

**Standard format for all API errors:**
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "User-friendly error message",
  "details": "Technical details (development only)"
}
```

### Type Safety Checklist

- [ ] Frontend types match backend response structure
- [ ] Database column names mapped correctly
- [ ] Enum values synced between frontend, backend, and database
- [ ] Required fields validated on both frontend and backend
- [ ] Error responses include helpful messages

---

## Debug Tools & Techniques

### 1. Frontend API Call Debugging

Add comprehensive logging:
```typescript
try {
  console.log('Making request:', endpoint, data);
  const response = await apiClient.post(endpoint, data);
  console.log('Response:', response.data);
  return response.data;
} catch (error: any) {
  console.error('Full error:', error);
  console.error('Status:', error.response?.status);
  console.error('Data:', error.response?.data);
  console.error('Message:', error.message);
  throw error;
}
```

### 2. Backend Database Query Debugging

Log queries and parameters:
```typescript
logger.debug('Executing query:', {
  sql: queryText,
  params: parameters
});
const result = await query(queryText, parameters);
logger.debug('Query result:', result);
```

### 3. Check Database Constraints

```sql
-- View all constraints on a table
EXEC sp_helpconstraint 'dbo.Contact', 'nomsg';

-- View specific constraint definition
SELECT
  cc.name,
  cc.definition
FROM sys.check_constraints cc
WHERE cc.name = 'CK_Contact_Status';
```

---

## Quick Reference

### Common Error Codes

- `400` - Bad Request (validation error, missing required fields)
- `401` - Unauthorized (no token or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (backend crash, database error)

### Where to Look

| Error Type | Check |
|------------|-------|
| Field undefined | Mapping function in `lib/api/*.ts` |
| 400 error | Backend validation, field names |
| 500 error | Backend logs, database constraints |
| React key warning | ID mapping in API client |
| Auth issues | `authStore.ts`, auth middleware |
| Status badge crash | StatusBadge fallback config |

---

**Last Updated:** 2026-04-07
**Maintained By:** Development Team
