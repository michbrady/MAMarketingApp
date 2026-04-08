# Contact Management API Documentation

## Sprint 6: Contact Management & Follow-ups

This document provides comprehensive documentation for the Contact Management and Contact Group APIs.

---

## Table of Contents

1. [Overview](#overview)
2. [Contact API Endpoints](#contact-api-endpoints)
3. [Contact Group API Endpoints](#contact-group-api-endpoints)
4. [Data Models](#data-models)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Database Schema](#database-schema)

---

## Overview

The Contact Management system allows UFOs (UnFranchise Owners) to:

- Create, read, update, and delete contacts
- Organize contacts into groups
- Tag contacts for better organization
- Import/export contacts (CSV/JSON)
- Track contact engagement and activity
- Search and filter contacts
- View contact activity history
- Calculate engagement scores

### Key Features

✅ **Full CRUD Operations** - Complete contact management
✅ **Contact Groups** - Organize contacts into custom groups
✅ **Tagging System** - Flexible tagging for categorization
✅ **Import/Export** - CSV and JSON support
✅ **Full-Text Search** - Search across all contact fields
✅ **Activity Tracking** - Complete engagement history
✅ **Engagement Scoring** - Automatic contact scoring
✅ **Data Isolation** - Users can only access their own contacts
✅ **Soft Delete** - Contacts marked inactive instead of deleted

---

## Contact API Endpoints

### Authentication

All endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer <token>
```

### Base URL

```
/api/v1/contacts
```

---

### 1. Create Contact

**POST** `/api/v1/contacts`

Create a new contact. Either email or mobile is required.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "mobile": "+1234567890",
  "companyName": "Acme Corp",
  "jobTitle": "Sales Manager",
  "relationshipType": "Prospect",
  "source": "Manual",
  "tags": ["hot-lead", "referred"],
  "notes": "Met at networking event",
  "emailOptIn": true,
  "smsOptIn": true,
  "status": "Active"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "contactId": 123,
    "ownerUserId": 456,
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

---

### 2. List Contacts

**GET** `/api/v1/contacts`

Retrieve contacts with optional filtering, sorting, and pagination.

**Query Parameters:**

- `search` - Full-text search across all fields
- `status` - Filter by status (Active, Inactive, DoNotContact, Bounced)
- `relationshipType` - Filter by relationship type
- `tags` - Comma-separated tags to filter by
- `hasEmail` - Filter contacts with/without email (true/false)
- `hasMobile` - Filter contacts with/without mobile (true/false)
- `minEngagementScore` - Minimum engagement score (0-100)
- `lastEngagementFrom` - Filter by engagement date (ISO 8601)
- `lastEngagementTo` - Filter by engagement date (ISO 8601)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)
- `sortBy` - Sort field (createdDate, updatedDate, lastEngagementDate, engagementScore, lastName)
- `sortOrder` - Sort direction (ASC, DESC)

**Example Request:**

```
GET /api/v1/contacts?status=Active&tags=hot-lead,vip&limit=20&sortBy=engagementScore&sortOrder=DESC
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 3. Get Contact

**GET** `/api/v1/contacts/:id`

Retrieve a single contact with group memberships.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "contactId": 123,
    "firstName": "John",
    "lastName": "Doe",
    ...,
    "groups": [
      {
        "groupId": 1,
        "groupName": "VIP Customers"
      }
    ]
  }
}
```

---

### 4. Update Contact

**PUT** `/api/v1/contacts/:id`

Update contact information. Only provided fields are updated.

**Request Body:**

```json
{
  "jobTitle": "VP of Sales",
  "notes": "Promoted to VP!",
  "relationshipType": "Customer",
  "lastContactDate": "2026-04-05T10:30:00Z"
}
```

**Response:** `200 OK`

---

### 5. Delete Contact

**DELETE** `/api/v1/contacts/:id`

Soft delete a contact (sets status to 'Inactive').

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

### 6. Search Contacts

**GET** `/api/v1/contacts/search?q=<query>`

Full-text search across all contact fields with relevance ranking.

**Query Parameters:**

- `q` - Search query (required)

**Example:**

```
GET /api/v1/contacts/search?q=john
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [...]
}
```

---

### 7. Import Contacts

**POST** `/api/v1/contacts/import`

Bulk import contacts from CSV data (as JSON array).

**Request Body:**

```json
{
  "contacts": [
    {
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice@example.com",
      "mobile": "+1111111111",
      "companyName": "Import Co",
      "relationshipType": "Prospect",
      "tags": "imported,test"
    },
    {
      "firstName": "Bob",
      "lastName": "Williams",
      "email": "bob@example.com",
      "mobile": "+2222222222"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalRows": 2,
    "successCount": 2,
    "errorCount": 0,
    "duplicateCount": 0,
    "errors": []
  }
}
```

---

### 8. Export Contacts

**GET** `/api/v1/contacts/export?format=<csv|json>`

Export all contacts for the authenticated user.

**Query Parameters:**

- `format` - Export format (csv or json, default: csv)

**Response:** `200 OK`

**CSV Format:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename=contacts.csv

FirstName,LastName,Email,Mobile,...
John,Doe,john@example.com,+1234567890,...
```

**JSON Format:**
```json
[
  {
    "FirstName": "John",
    "LastName": "Doe",
    ...
  }
]
```

---

### 9. Add Tag

**POST** `/api/v1/contacts/:id/tags`

Add a tag to a contact.

**Request Body:**

```json
{
  "tag": "premium"
}
```

**Response:** `200 OK`

---

### 10. Remove Tag

**DELETE** `/api/v1/contacts/:id/tags/:tag`

Remove a tag from a contact.

**Example:**

```
DELETE /api/v1/contacts/123/tags/hot-lead
```

**Response:** `200 OK`

---

### 11. Get Contact Activity

**GET** `/api/v1/contacts/:id/activity`

Retrieve complete activity history for a contact.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "activityId": 1,
      "activityType": "Share",
      "activityDate": "2026-04-05T10:30:00Z",
      "contentTitle": "Product Brochure",
      "shareChannel": "Email",
      "description": "Content shared with contact"
    },
    {
      "activityId": 2,
      "activityType": "Engagement",
      "activityDate": "2026-04-05T11:00:00Z",
      "contentTitle": "Product Brochure",
      "eventType": "Click",
      "description": "Contact engaged with content"
    }
  ]
}
```

---

### 12. Update Engagement Score

**POST** `/api/v1/contacts/:id/engagement-score`

Recalculate the engagement score for a contact.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "engagementScore": 75
  }
}
```

---

## Contact Group API Endpoints

### Base URL

```
/api/v1/contact-groups
```

---

### 1. Create Contact Group

**POST** `/api/v1/contact-groups`

Create a new contact group.

**Request Body:**

```json
{
  "groupName": "VIP Customers",
  "description": "High-value customers and prospects"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "groupId": 1,
    "userId": 456,
    "groupName": "VIP Customers",
    "description": "High-value customers and prospects",
    "createdDate": "2026-04-05T10:00:00Z",
    "updatedDate": "2026-04-05T10:00:00Z"
  }
}
```

---

### 2. List Contact Groups

**GET** `/api/v1/contact-groups`

Retrieve all contact groups for the authenticated user.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "groupId": 1,
      "groupName": "VIP Customers",
      "description": "High-value customers",
      "contactCount": 15,
      "createdDate": "2026-04-05T10:00:00Z"
    }
  ]
}
```

---

### 3. Get Contact Group

**GET** `/api/v1/contact-groups/:id`

Retrieve a single contact group.

**Response:** `200 OK`

---

### 4. Update Contact Group

**PUT** `/api/v1/contact-groups/:id`

Update contact group information.

**Request Body:**

```json
{
  "groupName": "Premium VIP Customers",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### 5. Delete Contact Group

**DELETE** `/api/v1/contact-groups/:id`

Delete a contact group and all its memberships.

**Response:** `200 OK`

---

### 6. Get Group Contacts

**GET** `/api/v1/contact-groups/:id/contacts`

Retrieve all contacts in a group.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [...]
}
```

---

### 7. Add Contacts to Group

**POST** `/api/v1/contact-groups/:id/contacts`

Add multiple contacts to a group.

**Request Body:**

```json
{
  "contactIds": [123, 456, 789]
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Added 3 contacts to group",
  "data": {
    "addedCount": 3
  }
}
```

---

### 8. Remove Contact from Group

**DELETE** `/api/v1/contact-groups/:id/contacts/:contactId`

Remove a contact from a group.

**Response:** `200 OK`

---

## Data Models

### Contact

```typescript
interface Contact {
  contactId: number;
  ownerUserId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  companyName: string | null;
  jobTitle: string | null;
  relationshipType: string | null;
  source: string | null;
  tags: string | null;
  notes: string | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  marketingConsentDate: Date | null;
  totalSharesReceived: number;
  totalEngagements: number;
  lastEngagementDate: Date | null;
  lastContactDate: Date | null;
  engagementScore: number;
  status: 'Active' | 'Inactive' | 'DoNotContact' | 'Bounced';
  contactHash: string | null;
  duplicateOfContactId: number | null;
  createdDate: Date;
  updatedDate: Date;
}
```

### ContactGroup

```typescript
interface ContactGroup {
  groupId: number;
  userId: number;
  groupName: string;
  description: string | null;
  contactCount?: number;
  createdDate: Date;
  updatedDate: Date;
}
```

### ContactActivity

```typescript
interface ContactActivity {
  activityId: number;
  contactId: number;
  activityType: string;
  activityDate: Date;
  contentTitle?: string | null;
  shareChannel?: string | null;
  eventType?: string | null;
  description?: string | null;
}
```

---

## Usage Examples

### Create and Organize Contacts

```javascript
// 1. Create a contact
const contact = await api.post('/contacts', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  tags: ['hot-lead']
});

// 2. Create a group
const group = await api.post('/contact-groups', {
  groupName: 'Hot Leads'
});

// 3. Add contact to group
await api.post(`/contact-groups/${group.data.data.groupId}/contacts`, {
  contactIds: [contact.data.data.contactId]
});

// 4. Search contacts
const results = await api.get('/contacts/search?q=john');

// 5. Update engagement score
await api.post(`/contacts/${contact.data.data.contactId}/engagement-score`);
```

### Import Contacts

```javascript
const csvData = [
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    tags: 'imported,prospect'
  }
];

const result = await api.post('/contacts/import', { contacts: csvData });
console.log(`Imported ${result.data.data.successCount} contacts`);
```

### Export Contacts

```javascript
// Export as CSV
const csv = await api.get('/contacts/export?format=csv');

// Export as JSON
const json = await api.get('/contacts/export?format=json');
```

---

## Testing

### Run Test Suite

```bash
cd backend
node test_contact_api.cjs
```

### Test Coverage

The test suite covers:

- ✅ Contact CRUD operations
- ✅ Contact groups CRUD
- ✅ Tag management
- ✅ Import/export (CSV & JSON)
- ✅ Search functionality
- ✅ Activity tracking
- ✅ Engagement scoring
- ✅ Filtering and pagination

**23 automated tests** ensure all functionality works correctly.

---

## Database Schema

### Tables

1. **Contact** - Main contact storage
2. **ContactGroup** - Contact group definitions
3. **ContactGroupMember** - Many-to-many relationship
4. **ContactTag** - Optional structured tag storage
5. **ContactNote** - Optional timestamped notes
6. **ContactTimeline** - Activity history

### Migration Script

Run the migration to create missing tables:

```bash
sqlcmd -S localhost -U sa -P "password" -i database/11_Contact_Groups_Migration.sql
```

### Indexes

Optimized indexes for:
- Contact owner + status lookups
- Email and mobile searches
- Engagement score sorting
- Tag filtering
- Date range queries

---

## Security & Data Isolation

- ✅ All endpoints require authentication
- ✅ Users can only access their own contacts
- ✅ Ownership verified on all operations
- ✅ SQL injection prevention via parameterized queries
- ✅ Input validation on all requests
- ✅ Soft delete preserves data integrity

---

## Engagement Scoring Algorithm

Contacts receive a score from 0-100 based on:

1. **Shares Received** (5 points each)
2. **Engagements** (10 points each)
3. **Recency Bonus:**
   - Last 7 days: +20 points
   - Last 30 days: +10 points
4. **Inactivity Penalty:**
   - Over 90 days: -20 points

Score is capped at 100 and floored at 0.

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "message": "Either email or mobile is required"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**404 Not Found**
```json
{
  "error": "Not Found",
  "message": "Contact not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve contacts"
}
```

---

## Performance Considerations

- **Pagination:** Use `limit` and `offset` for large result sets
- **Indexing:** All queries optimized with database indexes
- **Caching:** Consider caching frequently accessed contacts
- **Batch Operations:** Use import endpoint for bulk operations
- **Engagement Score:** Recalculate periodically, not on every request

---

## Future Enhancements

- ⏳ Duplicate detection and merging
- ⏳ Advanced search with fuzzy matching
- ⏳ Contact segmentation rules
- ⏳ Automated list management
- ⏳ Contact data enrichment
- ⏳ Smart contact recommendations
- ⏳ Contact lifecycle automation

---

## Support

For issues or questions, contact the backend development team.

**Created:** 2026-04-05
**Sprint:** 6 - Contact Management & Follow-ups
**Version:** 1.0.0
