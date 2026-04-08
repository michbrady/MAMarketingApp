# Frontend/Backend Field Mapping Issues

**Date**: April 8, 2026  
**Status**: Resolved - 2 critical mapping issues fixed

---

## Overview

This document tracks issues encountered when mapping data between the backend API and frontend application. The primary challenge is field name casing inconsistencies between database schema (PascalCase), backend transformation (camelCase), and frontend expectations.

---

## Backend Transformation Logic

The backend uses `toCamelCase()` utility in `backend/src/utils/transform.ts`:

```typescript
// Converts PascalCase to camelCase
// ContactID → contactID (capital D in ID)
// FirstName → firstName
// OwnerUserID → ownerUserID (capital ID)
```

**Key behavior**:
- First character becomes lowercase: `ContactID` → `contactID`
- Rest stays the same: capital letters in acronyms preserved (ID, API, URL, etc.)
- Numeric ID fields parsed from string to number

---

## Issue #1: Contact Creation - Tags Type Mismatch

### Problem
Creating a contact threw `TypeError: .split is not a function`

### Root Cause
Backend's `transformContact()` converts tags from comma-separated string to array:
```typescript
// Database:  "tag1,tag2,tag3"
// Backend:   ["tag1", "tag2", "tag3"]
```

Frontend's `mapBackendToFrontend()` expected string and called `.split(',')` on the array.

### Solution
**File**: `frontend/src/lib/api/contacts.ts`

```typescript
// Before (line 41):
tags: backendContact.Tags || backendContact.tags ? 
  (backendContact.Tags || backendContact.tags).split(',').filter(Boolean) : []

// After:
tags: (() => {
  const tags = backendContact.Tags || backendContact.tags;
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;  // Backend's transformed format
  return tags.split(',').filter(Boolean); // Legacy string format
})()
```

**Fix Date**: April 8, 2026  
**Commits**: 
- Frontend: `ec7f397` - "Fix contact creation: handle tags as array or string"
- Main: `5dc46ef` - "Update frontend submodule: fix contact creation tags bug"

---

## Issue #2: Contact Links - Undefined ID

### Problem
Clicking on a contact navigated to `/contacts/undefined` and threw errors.

### Root Cause
Backend's `toCamelCase()` converts `ContactID` to `contactID` (with capital D in ID).

Frontend checked for:
```typescript
backendContact.ContactID   // ❌ Doesn't exist after transform
backendContact.contactId   // ❌ Wrong casing (lowercase d)
backendContact.id          // ❌ Doesn't exist
```

But backend returned: `backendContact.contactID` ✅ (capital D)

### Solution
**File**: `frontend/src/lib/api/contacts.ts`

```typescript
// Before (line 25):
id: (backendContact.ContactID || backendContact.contactId || backendContact.id)?.toString()

// After:
id: (backendContact.ContactID || backendContact.contactID || backendContact.contactId || backendContact.id)?.toString()
//                              ^^^^^^^^^^^^^^^^^^^ Added this
```

**Fix Date**: April 8, 2026  
**Commits**:
- Frontend: `5aa7089` - "Fix contact ID mapping: add contactID with capital D"
- Main: `41d2553` - "Update frontend submodule: fix contact ID undefined issue"

---

## Field Naming Convention Reference

### Database (PascalCase)
```sql
ContactID, FirstName, LastName, Email, Mobile, CompanyName, 
JobTitle, OwnerUserID, CreatedDate, UpdatedDate, Tags, Notes
```

### Backend API Response (camelCase after transform)
```json
{
  "contactID": 123,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "companyName": "Acme Corp",
  "jobTitle": "Manager",
  "ownerUserID": 1,
  "createdDate": "2026-04-08T...",
  "updatedDate": "2026-04-08T...",
  "tags": ["tag1", "tag2"],
  "notes": "Some notes"
}
```

### Frontend Expected Format (camelCase)
```typescript
{
  id: "123",                    // String version of contactID
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",         // Mapped from mobile
  company: "Acme Corp",         // Mapped from companyName
  position: "Manager",          // Mapped from jobTitle
  tags: ["tag1", "tag2"],       // Array format
  notes: "Some notes",
  createdAt: "2026-04-08T...",  // Mapped from createdDate
  updatedAt: "2026-04-08T..."   // Mapped from updatedDate
}
```

---

## Best Practices for Field Mapping

### 1. Always Check Multiple Casing Variants

When mapping backend fields, check all possible casing variations:

```typescript
// For ID fields (ID is acronym, stays uppercase):
backendContact.ContactID || backendContact.contactID || backendContact.contactId || backendContact.id

// For regular fields:
backendContact.FirstName || backendContact.firstName
```

### 2. Handle Both Array and String for Lists

Lists like tags, categories, etc. may come as string or array:

```typescript
const tags = backendContact.tags;
if (!tags) return [];
if (Array.isArray(tags)) return tags;
return tags.split(',').filter(Boolean);
```

### 3. Type Guards for IDs

IDs can be string or number from backend:

```typescript
id: (backendContact.contactID || backendContact.id)?.toString()
```

### 4. Null/Undefined Handling

Always provide fallbacks:

```typescript
firstName: backendContact.firstName || '',
lastName: backendContact.lastName || '',
tags: backendContact.tags || []
```

### 5. Field Name Mapping

Document frontend → backend field mappings in API client:

```typescript
const backendData = {
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  mobile: data.phone,          // phone → mobile
  companyName: data.company,   // company → companyName
  jobTitle: data.position,     // position → jobTitle
};
```

---

## Testing Checklist

When adding new fields or entities:

- [ ] Test field mapping in both directions (create & read)
- [ ] Check ID field extraction works (clicks on lists navigate correctly)
- [ ] Verify array/list fields handle both string and array
- [ ] Test null/undefined values don't break UI
- [ ] Ensure date fields are formatted correctly
- [ ] Verify numeric fields aren't returned as strings
- [ ] Check camelCase/PascalCase consistency

---

## Related Files

### Backend
- `backend/src/utils/transform.ts` - PascalCase → camelCase transformation
- `backend/src/controllers/contact.controller.ts` - Applies transformations to responses
- `backend/src/services/contact.service.ts` - Raw database queries

### Frontend
- `frontend/src/lib/api/contacts.ts` - API client with field mapping
- `frontend/src/types/contact.ts` - TypeScript type definitions
- `frontend/src/components/contacts/ContactCard.tsx` - Uses contact.id for links
- `frontend/src/components/contacts/ContactTable.tsx` - Uses contact.id for links

---

## Issue #3: Contact Notes - Missing Endpoint

### Problem
Adding notes to a contact threw `AxiosError: Request failed with status code 404`

### Root Cause
Frontend called `POST /contacts/:id/notes` which doesn't exist in backend.

**Design mismatch**:
- Frontend UI: Expects timeline-style notes (add note → creates new entry)
- Database schema: Single `Notes NVARCHAR(MAX)` field in Contact table
- Backend: No `/notes` endpoint implemented

```sql
-- Database (03_Schema_Sharing_Tracking.sql, line 39)
Notes NVARCHAR(MAX) NULL,  -- Just one text field, not a separate table
```

### Solution
**File**: `frontend/src/lib/api/contacts.ts`

Updated `addContactNote()` to work with single notes field:

```typescript
// Before:
POST /contacts/:id/notes with { content }

// After:
1. GET /contacts/:id to fetch existing notes
2. Append new note with timestamp: "[2026-04-08T...] content"
3. PUT /contacts/:id with { notes: updatedNotes }
4. Return mock ContactNote response for UI
```

**Note format** (stored as plain text with timestamps):
```
[2026-04-08T12:34:56.789Z] First note here

[2026-04-08T13:45:00.123Z] Second note here
```

### Alternative Solutions Considered

1. **Create notes table** - More scalable but requires:
   - New ContactNotes table in database
   - New backend endpoint POST /contacts/:id/notes
   - Migration script to split existing Notes field
   - More complex UI showing note history with author/timestamp

2. **Keep current approach** - Simple, works with existing schema
   - ✅ Chosen: Quick fix, preserves all existing notes
   - ✅ No database changes required
   - ⚠️ Notes not individually editable/deletable
   - ⚠️ No author tracking per note
   - ⚠️ Not ideal for many notes (single text field gets large)

**Fix Date**: April 8, 2026  
**Commits**:
- Frontend: `f567141` - "Fix contact notes: use update endpoint instead of non-existent notes endpoint"
- Main: `7e2c477` - "Update frontend submodule: fix contact notes 404 error"

---

## Future Improvements

1. **Schema Validation**: Add runtime validation with Zod to catch field mismatches early
2. **Type Generation**: Auto-generate TypeScript types from database schema
3. **Consistent Transform**: Use a single, well-tested transformation library on backend
4. **API Contract Testing**: Add contract tests to catch breaking changes
5. **Documentation**: Keep OpenAPI spec up-to-date with actual field names

---

**Last Updated**: April 8, 2026  
**Status**: All known issues resolved ✅
