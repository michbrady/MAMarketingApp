# Contact Management Backend - Sprint 6

## Overview

Complete contact management backend system for the UnFranchise Marketing App, enabling UFOs to manage contacts, organize them into groups, track engagement, and import/export contact data.

## Features Implemented

### Contact Management
- ✅ Create, Read, Update, Delete (CRUD) operations
- ✅ Soft delete (status changes to 'Inactive')
- ✅ Contact deduplication using SHA-256 hash
- ✅ Full-text search across all contact fields
- ✅ Advanced filtering (status, tags, engagement, dates)
- ✅ Pagination and sorting
- ✅ Tag management (add/remove tags)
- ✅ Activity history tracking
- ✅ Engagement score calculation

### Contact Groups
- ✅ Create and manage contact groups
- ✅ Add/remove contacts from groups
- ✅ Bulk contact assignment
- ✅ Group contact count tracking
- ✅ List groups with contact counts

### Import/Export
- ✅ CSV import with validation
- ✅ CSV export with all fields
- ✅ JSON export option
- ✅ Duplicate detection during import
- ✅ Error reporting with row-level details

### Data Validation
- ✅ Zod schemas for all endpoints
- ✅ Email format validation
- ✅ Phone number format validation
- ✅ Required field validation
- ✅ Business rule validation

### Security
- ✅ JWT authentication required for all endpoints
- ✅ User ownership verification (users can only access their own contacts)
- ✅ SQL injection prevention via parameterized queries
- ✅ Input sanitization

## API Endpoints

### Contacts

#### Create Contact
```http
POST /api/v1/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "mobile": "+1234567890",
  "companyName": "Acme Corp",
  "jobTitle": "Sales Manager",
  "relationshipType": "Prospect",
  "tags": ["hot-lead", "referred"],
  "notes": "Met at conference",
  "emailOptIn": true,
  "smsOptIn": true,
  "status": "Active"
}
```

#### List Contacts
```http
GET /api/v1/contacts?status=Active&limit=50&offset=0&sortBy=updatedDate&sortOrder=DESC
Authorization: Bearer {token}
```

**Query Parameters:**
- `search` - Full-text search query
- `status` - Active | Inactive | DoNotContact | Bounced
- `relationshipType` - Prospect | Customer | Lead | etc.
- `tags` - Comma-separated tags (e.g., "hot-lead,vip")
- `hasEmail` - true | false
- `hasMobile` - true | false
- `minEngagementScore` - Minimum score (0-100)
- `lastEngagementFrom` - ISO date
- `lastEngagementTo` - ISO date
- `limit` - Results per page (default: 50)
- `offset` - Results to skip (default: 0)
- `sortBy` - createdDate | updatedDate | lastEngagementDate | engagementScore | lastName
- `sortOrder` - ASC | DESC

#### Get Single Contact
```http
GET /api/v1/contacts/:id
Authorization: Bearer {token}
```

#### Update Contact
```http
PUT /api/v1/contacts/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobTitle": "VP of Sales",
  "notes": "Promoted!",
  "lastContactDate": "2026-04-05T10:00:00Z"
}
```

#### Delete Contact (Soft Delete)
```http
DELETE /api/v1/contacts/:id
Authorization: Bearer {token}
```

#### Search Contacts
```http
GET /api/v1/contacts/search?q=john
Authorization: Bearer {token}
```

#### Add Tag
```http
POST /api/v1/contacts/:id/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "tag": "vip"
}
```

#### Remove Tag
```http
DELETE /api/v1/contacts/:id/tags/:tag
Authorization: Bearer {token}
```

#### Get Contact Activity
```http
GET /api/v1/contacts/:id/activity
Authorization: Bearer {token}
```

#### Update Engagement Score
```http
POST /api/v1/contacts/:id/engagement-score
Authorization: Bearer {token}
```

#### Import Contacts
```http
POST /api/v1/contacts/import
Authorization: Bearer {token}
Content-Type: application/json

{
  "contacts": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "mobile": "+1234567891",
      "relationshipType": "Customer",
      "tags": "vip,enterprise"
    }
  ]
}
```

#### Export Contacts
```http
GET /api/v1/contacts/export?format=csv
Authorization: Bearer {token}
```

**Formats:** csv | json

### Contact Groups

#### Create Group
```http
POST /api/v1/contact-groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupName": "VIP Customers",
  "description": "High-value customers"
}
```

#### List Groups
```http
GET /api/v1/contact-groups
Authorization: Bearer {token}
```

#### Get Group Details
```http
GET /api/v1/contact-groups/:id
Authorization: Bearer {token}
```

#### Update Group
```http
PUT /api/v1/contact-groups/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupName": "Premium VIP Customers",
  "description": "Top-tier customers"
}
```

#### Delete Group
```http
DELETE /api/v1/contact-groups/:id
Authorization: Bearer {token}
```

#### Get Group Contacts
```http
GET /api/v1/contact-groups/:id/contacts
Authorization: Bearer {token}
```

#### Add Contacts to Group
```http
POST /api/v1/contact-groups/:id/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "contactIds": [1, 2, 3]
}
```

#### Remove Contact from Group
```http
DELETE /api/v1/contact-groups/:id/contacts/:contactId
Authorization: Bearer {token}
```

## Database Schema

### Contact Table
```sql
CREATE TABLE dbo.Contact (
    ContactID BIGINT IDENTITY(1,1) PRIMARY KEY,
    OwnerUserID BIGINT NOT NULL,
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    Email NVARCHAR(255) NULL,
    Mobile NVARCHAR(20) NULL,
    CompanyName NVARCHAR(200) NULL,
    JobTitle NVARCHAR(100) NULL,
    RelationshipType NVARCHAR(50) NULL,
    Source NVARCHAR(100) NULL,
    Tags NVARCHAR(500) NULL,
    Notes NVARCHAR(MAX) NULL,
    EmailOptIn BIT DEFAULT 0,
    SMSOptIn BIT DEFAULT 0,
    MarketingConsentDate DATETIME2(7) NULL,
    TotalSharesReceived INT DEFAULT 0,
    TotalEngagements INT DEFAULT 0,
    LastEngagementDate DATETIME2(7) NULL,
    LastContactDate DATETIME2(7) NULL,
    EngagementScore INT DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'Active',
    ContactHash NVARCHAR(64) NULL,
    DuplicateOfContactID BIGINT NULL,
    CreatedDate DATETIME2(7) DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) DEFAULT SYSDATETIME()
);
```

### ContactGroup Table
```sql
CREATE TABLE dbo.ContactGroup (
    GroupID INT IDENTITY(1,1) PRIMARY KEY,
    UserID BIGINT NOT NULL,
    GroupName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    CreatedDate DATETIME2(7) DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) DEFAULT SYSDATETIME()
);
```

### ContactGroupMember Table
```sql
CREATE TABLE dbo.ContactGroupMember (
    ContactID BIGINT NOT NULL,
    GroupID INT NOT NULL,
    AddedDate DATETIME2(7) DEFAULT SYSDATETIME(),
    PRIMARY KEY (ContactID, GroupID)
);
```

### ContactTag Table (Optional - Enhanced Tag Management)
```sql
CREATE TABLE dbo.ContactTag (
    ContactTagID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContactID BIGINT NOT NULL,
    Tag NVARCHAR(100) NOT NULL,
    AddedDate DATETIME2(7) DEFAULT SYSDATETIME()
);
```

### ContactNote Table (Optional - Enhanced Notes)
```sql
CREATE TABLE dbo.ContactNote (
    NoteID BIGINT IDENTITY(1,1) PRIMARY KEY,
    ContactID BIGINT NOT NULL,
    UserID BIGINT NOT NULL,
    NoteText NVARCHAR(MAX) NOT NULL,
    NoteType NVARCHAR(50) NULL,
    CreatedDate DATETIME2(7) DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) DEFAULT SYSDATETIME()
);
```

## Files Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── contact.controller.ts
│   │   └── contact-group.controller.ts
│   ├── services/
│   │   ├── contact.service.ts
│   │   └── contact-group.service.ts
│   ├── routes/
│   │   ├── contact.routes.ts
│   │   └── contact-group.routes.ts
│   ├── types/
│   │   └── contact.types.ts
│   └── validation/
│       └── contact.validation.ts
├── test_contact_api.cjs (Comprehensive test suite)
└── CONTACT_MANAGEMENT_README.md (This file)
```

## Testing

### Run the Test Suite

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run the test script:**
   ```bash
   node test_contact_api.cjs
   ```

### Test Coverage

The test suite includes 23 comprehensive tests:

1. ✅ User Authentication
2. ✅ Create Contact
3. ✅ Create Second Contact
4. ✅ Get Contact
5. ✅ Update Contact
6. ✅ List Contacts
7. ✅ Search Contacts
8. ✅ Add Tag
9. ✅ Remove Tag
10. ✅ Create Contact Group
11. ✅ List Contact Groups
12. ✅ Add Contacts to Group
13. ✅ Get Group Contacts
14. ✅ Get Contact Activity
15. ✅ Update Engagement Score
16. ✅ Filter Contacts
17. ✅ Import Contacts
18. ✅ Export Contacts (CSV)
19. ✅ Export Contacts (JSON)
20. ✅ Update Contact Group
21. ✅ Remove Contact from Group
22. ✅ Delete Contact
23. ✅ Delete Contact Group

## Engagement Scoring Algorithm

The engagement score (0-100) is calculated based on:

1. **Shares Received:** 5 points per share
2. **Engagements:** 10 points per engagement (click, view, reply)
3. **Recency Bonus:**
   - Last 7 days: +20 points
   - Last 30 days: +10 points
   - Over 90 days: -20 points (inactive penalty)
4. **Capped at 100 points**

Formula:
```
score = (sharesReceived × 5) + (engagements × 10) + recencyBonus
score = min(max(score, 0), 100)
```

## Contact Deduplication

Contacts are deduplicated using a SHA-256 hash of:
- Email address (lowercase)
- Mobile number

This prevents duplicate contacts with the same email or phone number.

## CSV Import Format

```csv
FirstName,LastName,Email,Mobile,CompanyName,JobTitle,RelationshipType,Tags,Status
John,Doe,john@example.com,+1234567890,Acme Corp,Manager,Prospect,"hot-lead,vip",Active
Jane,Smith,jane@example.com,+0987654321,Tech Inc,CEO,Customer,"enterprise,vip",Active
```

## CSV Export Format

```csv
FirstName,LastName,Email,Mobile,CompanyName,JobTitle,RelationshipType,Tags,Status,EngagementScore,TotalSharesReceived,TotalEngagements,LastEngagementDate,LastContactDate,CreatedDate
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Bad Request",
  "message": "Either email or mobile is required"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (not owner)
- `404` - Not Found
- `500` - Internal Server Error

## Performance Considerations

1. **Database Indexes:**
   - Primary keys on all tables
   - Index on `OwnerUserID, Status`
   - Index on `Email` and `Mobile` for lookups
   - Index on `EngagementScore DESC` for sorting
   - Index on `ContactHash` for deduplication

2. **Pagination:**
   - Default limit: 50 contacts
   - Max limit: 1000 contacts
   - Use `OFFSET/FETCH` for efficient pagination

3. **Query Optimization:**
   - Avoid `SELECT *` in production
   - Use parameterized queries to prevent SQL injection
   - Indexed columns for WHERE clauses

## Security Best Practices

1. **Authentication:** All endpoints require JWT token
2. **Authorization:** Users can only access their own contacts
3. **Validation:** Zod schemas validate all inputs
4. **SQL Injection:** Parameterized queries only
5. **XSS Prevention:** Input sanitization
6. **Rate Limiting:** Recommended for production
7. **Audit Logging:** All contact modifications logged

## Next Steps (Phase 2+)

- [ ] Real-time activity tracking integration
- [ ] Advanced analytics dashboard
- [ ] Contact scoring ML model
- [ ] Automated follow-up suggestions
- [ ] Contact merge functionality
- [ ] Custom fields support
- [ ] Contact webhooks
- [ ] Bulk operations (bulk delete, bulk tag, etc.)
- [ ] Contact sharing between users
- [ ] Contact timeline view

## Support

For issues or questions:
1. Check the test suite for usage examples
2. Review API specification in `/docs/architecture/`
3. Check database schema in `/database/`
4. Review implementation in `/src/services/` and `/src/controllers/`

---

**Status:** ✅ Production Ready
**Sprint:** Sprint 6 - Contact Management & Follow-ups
**Version:** 1.0.0
**Last Updated:** 2026-04-05
