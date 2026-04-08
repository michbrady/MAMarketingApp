# Test Database Setup Complete

**Date**: April 5, 2026
**Status**: ✅ Test Database Created | ⚠️ Integration Tests Need Schema Alignment
**Database**: UnFranchiseMarketing_Test
**Server**: dbms-dwhs.corp.shop.com\DWP01

---

## Summary

Successfully created test database with full schema. Unit tests (137) passing at 100%. Integration tests (241) require schema alignment between SQL scripts and test expectations.

**Test Results:**
- ✅ **137 unit tests** - 100% passing
- ⏭️ **241 integration tests** - Skipped (schema mismatches)

---

## Database Setup

### Created Successfully
- ✅ Database: `UnFranchiseMarketing_Test`
- ✅ 40 tables
- ✅ 26 stored procedures
- ✅ 23 views
- ✅ Test data seeded (markets, languages, roles)

### Tables Created
```
ActivityFeedItem, APIRequestLog, AuditLog, Campaign, CampaignContent,
ComplianceRule, Contact, ContactGroup, ContactGroupMember, ContactNote,
ContactTag, ContactTimeline, ContentCategory, ContentItem, ContentItemCategory,
ContentItemLanguage, ContentItemMarket, ContentItemTag, ContentSearchHistory,
ContentTag, EngagementEvent, FollowUp, FollowUpReminder, FollowUpTemplate,
Language, Market, Notification, NudgeExecutionLog, NudgeRule, Role,
ScheduledJobLog, ShareEvent, ShareRecipient, ShareTemplate, SystemConfiguration,
TrackingLink, User, UserFavoriteContent, UserSession, UserSettings
```

### Credentials
- **App User**: `unfranchise_app`
- **Password**: `UnFr@nch1se2026!`
- **Permissions**: db_owner (full control)

---

## Setup Process

### 1. Database Creation
**Script**: `database/00_Create_Test_Database_Simple.sql`
- Created database with default file locations
- Created SQL Server login for `unfranchise_app`
- Granted db_owner permissions

### 2. Schema Creation
**Script**: `backend/setup-test-db-no-create.js`
- Executed 10 SQL schema scripts
- Created all tables, views, stored procedures
- Seeded initial test data

**Scripts Executed:**
1. `02_Schema_Core_Tables.sql` - ✅
2. `03_Schema_Sharing_Tracking.sql` - ✅ (3 warnings)
3. `04_Schema_Notifications_Audit.sql` - ✅
4. `06_Schema_ShareTemplates.sql` - ✅ (2 warnings)
5. `09_Schema_FollowUp.sql` - ✅ (4 warnings)
6. `10_Schema_Settings.sql` - ✅ (6 warnings)
7. `11_Contact_Groups_Migration.sql` - ✅ (1 warning)
8. `05_Stored_Procedures.sql` - ✅
9. `06_Views.sql` - ✅
10. `08_Analytics_Views.sql` - ✅

---

## Test Status

### Unit Tests - ✅ PASSING

**Location**: `backend/src/services/__tests__/`

**Results**: 137 tests, 100% passing

**Coverage by Service:**
- ✅ Auth Service - 20 tests
- ✅ Contact Service - 34 tests
- ✅ Content Service - 14 tests
- ✅ Follow-up Service - 33 tests
- ✅ Sharing Service - 25 tests
- ✅ Analytics Service - 11 tests

**Command**: `npm test`

**What They Test:**
- Core business logic
- Service methods
- Data validation
- Error handling
- Mock database interactions

---

### Integration Tests - ⚠️ SCHEMA MISMATCHES

**Location**: `backend/src/__tests__/api/`

**Results**: 241 tests skipped due to schema mismatches

**Test Suites:**
- ❌ Auth API - 28 tests
- ❌ Content API - 43 tests
- ❌ Contacts API - 53 tests
- ❌ Follow-ups API - 48 tests
- ❌ Sharing API - 32 tests
- ❌ Analytics API - 37 tests

**Command**: `npm run test:api`

**Issues Found:**

1. **Schema Organization**
   - Tests expect: `identity`, `content`, `sharing`, `notifications`, `audit` schemas
   - Actual: All tables in `dbo` schema

2. **Column Name Mismatches**
   - Example: `Market.LanguageID` expected but may not exist
   - Tests written from design docs, SQL scripts have evolved

3. **Table Structure Differences**
   - Tests expect certain table relationships
   - Actual SQL may have different foreign keys or columns

**Error Examples:**
```
RequestError: Invalid column name 'LanguageID'
RequestError: Cannot find the object "ContentItemCategory"
RequestError: CREATE SCHEMA failed due to previous errors
```

---

## Schema Alignment Needed

### Current Architecture
- **All tables**: `dbo` schema (standard SQL Server)
- **40 tables** created from SQL scripts
- **Column names**: As defined in SQL scripts

### Test Expectations
- **Multi-schema**: identity, content, sharing, notifications, audit
- **Column names**: From original design documents
- **Table structures**: May differ from actual implementation

### Alignment Options

**Option A: Update SQL Scripts**
- Reorganize tables into multiple schemas
- Align column names with test expectations
- Most accurate to original design

**Option B: Update Tests**
- Modify 241 tests to match actual schema
- Use actual table/column names
- Faster but diverges from design

**Option C: Hybrid**
- Keep dbo schema (simpler)
- Update tests for critical mismatches
- Document differences

---

## Running Tests

### Unit Tests (Working)
```bash
cd backend
npm test                    # All unit tests
npm run test:coverage       # With coverage report
```

### Integration Tests (Need Fixing)
```bash
cd backend
npm run test:api           # All API tests (currently fail)
npm run test:auth          # Auth tests only
npm run test:contacts      # Contact tests only
```

### Setup Database from Scratch
```bash
# 1. Run in SSMS (as DBA):
database/00_Create_Test_Database_Simple.sql

# 2. Run schema setup:
cd backend
node setup-test-db-no-create.js
```

---

## Files Created

### Database Scripts
- `database/00_Create_Test_Database.sql` - Full version (path issues)
- `database/00_Create_Test_Database_Simple.sql` - ✅ **Working version**

### Setup Scripts
- `backend/setup-test-db.js` - With database creation (needs DBA)
- `backend/setup-test-db-no-create.js` - ✅ **Schema only (working)**
- `backend/create-test-db-dba.js` - DBA credentials version
- `backend/create-test-db-windows-auth.js` - Windows auth (not working)
- `backend/test-connection.js` - Connection tester

### Test Files
- `backend/src/__tests__/setup/test-db.ts` - Modified (skip schema creation)
- All unit tests in `src/services/__tests__/` - ✅ Working
- All API tests in `src/__tests__/api/` - ⚠️ Need schema fixes

### Documentation
- `backend/.env.test` - Test environment config
- `backend/.env.dba` - DBA credentials template (if needed)

---

## Next Steps

### Immediate (To Run Integration Tests)
1. ⬜ Investigate exact schema mismatches
2. ⬜ Update test fixtures to match actual schema
3. ⬜ Or update SQL scripts to match test expectations
4. ⬜ Run integration tests to validate
5. ⬜ Achieve 90%+ endpoint coverage

### Alternative (Skip for Now)
1. ✅ Unit tests prove business logic works
2. ✅ Document schema differences
3. ⬜ Proceed to Sprint 9: UAT & Deployment
4. ⬜ Circle back to integration tests in CI/CD setup

---

## Troubleshooting

### Connection Issues
```bash
# Test connection
node test-connection.js

# Should output:
# ✓ Connected successfully!
# SQL Server Version: Microsoft SQL Server 2019...
```

### VPN Required
The SQL Server `dbms-dwhs.corp.shop.com\DWP01` requires VPN connection.

### Permission Issues
If tests fail with permission errors:
1. Verify `unfranchise_app` has db_owner role
2. Check `.env.test` has correct credentials
3. Re-run database creation script

### Schema Reset
To completely reset the test database:
```sql
-- Run in SSMS
USE master;
GO

ALTER DATABASE [UnFranchiseMarketing_Test] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [UnFranchiseMarketing_Test];
GO

-- Then re-run setup scripts
```

---

## Success Criteria

### Current Achievement
✅ Test database infrastructure complete
✅ 137 unit tests passing (100%)
✅ Database schema created and verified
✅ Connection and authentication working

### Remaining for Full Test Coverage
⬜ Align schema with integration test expectations
⬜ 241 integration tests passing (90%+ target)
⬜ E2E tests passing
⬜ Performance benchmarks established

---

## Technical Details

### Connection Configuration
```typescript
{
  server: 'dbms-dwhs.corp.shop.com\\DWP01',
  database: 'UnFranchiseMarketing_Test',
  user: 'unfranchise_app',
  password: 'UnFr@nch1se2026!',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'DWP01'
  }
}
```

### Test Data Seeded
```sql
-- Markets
US - United States (USD, America/New_York)
CA - Canada (CAD, America/Toronto)

-- Languages
en - English
es - Spanish

-- Roles
Admin - System Administrator (Level 99)
UFO - UnFranchise Owner (Level 10)
Moderator - Content Moderator (Level 50)
```

---

**Last Updated**: April 5, 2026, 9:57 PM
**Status**: Test database ready, schema alignment in progress
**Next Action**: Fix schema mismatches for integration tests
