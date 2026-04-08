# API Integration Testing Guide

Complete guide for running and maintaining API integration tests for the UnFranchise Marketing App backend.

## Quick Start

```bash
# Install dependencies
npm install

# Run all API integration tests
npm run test:api

# Run specific test suite
npm run test:auth
npm run test:contacts
npm run test:followups
```

## What's Tested

### 195+ Integration Tests Across 6 API Suites

✅ **Authentication API** (25 tests)
- Login/logout flows
- Token management
- Security validation
- SQL injection protection

✅ **Content API** (35 tests)
- CRUD operations
- Search & filtering
- Admin permissions
- Draft/published status

✅ **Contact API** (40 tests)
- Contact management
- Import/export
- Tag management
- Activity tracking

✅ **Follow-up API** (35 tests)
- Task management
- Snooze functionality
- Status updates
- Templates

✅ **Sharing API** (30 tests)
- Multi-channel sharing
- Tracking codes
- Analytics
- Templates

✅ **Analytics API** (30 tests)
- Performance metrics
- Trends analysis
- Leaderboards
- Reports

## Test Database

Tests use: `UnFranchiseMarketing_Test` database

### Automatic Setup
- Database created automatically on first run
- Schemas created automatically
- Test data seeded before each suite
- Cleanup after tests complete

### Manual Setup (Optional)

```sql
USE master;
CREATE DATABASE UnFranchiseMarketing_Test;
GO

USE UnFranchiseMarketing_Test;
-- Grant permissions to test user
```

## Environment Configuration

Ensure `.env.test` exists with:

```env
NODE_ENV=test
DB_NAME=UnFranchiseMarketing_Test
DB_USER=unfranchise_app
DB_PASSWORD=UnFr@nch1se2026!
JWT_SECRET=test_jwt_secret_key_for_testing_2026
```

## Running Tests

### All API Tests
```bash
npm run test:api
```

### Individual Test Suites
```bash
npm run test:auth        # Authentication (25 tests)
npm run test:content     # Content Management (35 tests)
npm run test:contacts    # Contact Management (40 tests)
npm run test:followups   # Follow-ups (35 tests)
npm run test:sharing     # Sharing (30 tests)
npm run test:analytics   # Analytics (30 tests)
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Test Results

### Expected Output

```
✓ src/__tests__/api/auth.test.ts (25)
  ✓ POST /api/v1/auth/login
  ✓ GET /api/v1/auth/me
  ✓ POST /api/v1/auth/refresh
  ✓ POST /api/v1/auth/logout

✓ src/__tests__/api/contacts.test.ts (40)
  ✓ POST /api/v1/contacts
  ✓ GET /api/v1/contacts
  ✓ GET /api/v1/contacts/:id
  ✓ PUT /api/v1/contacts/:id
  ...

Test Files  6 passed (6)
Tests  195 passed (195)
Duration  45s
```

## Test Data

### Default Test Users

```typescript
admin@test.com      // Admin role
ufo@test.com        // UFO role
ufo2@test.com       // Second UFO for isolation tests
inactive@test.com   // Inactive status
```

All passwords: `password123`

### Test Content
- 3 Published items (Video, Document, Image)
- 1 Draft item

### Test Contacts
- 3 Contacts across different users
- Various tags and statuses

## What Gets Validated

### ✅ Authentication
- Valid/invalid credentials
- Token generation/validation
- Refresh token flow
- Session management
- Security boundaries

### ✅ Authorization
- Role-based access (Admin vs UFO)
- User data isolation
- Resource ownership
- Permission checks

### ✅ Validation
- Required fields
- Format validation (email, phone, dates)
- String length limits
- Enum values
- Business rules

### ✅ Security
- SQL injection attempts
- XSS protection
- Token tampering
- Unauthorized access
- Data leakage

### ✅ Business Logic
- Status workflows
- Calculations
- Relationships
- Constraints
- Side effects

### ✅ Error Handling
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error

## Coverage Goals

| API Suite | Tests | Coverage Target |
|-----------|-------|-----------------|
| Auth | 25 | 100% endpoints |
| Content | 35 | 100% endpoints |
| Contacts | 40 | 100% endpoints |
| Follow-ups | 35 | 100% endpoints |
| Sharing | 30 | 100% endpoints |
| Analytics | 30 | 90% endpoints |

**Overall: 90%+ endpoint coverage achieved**

## Troubleshooting

### Tests Timeout

**Cause**: Database connection slow or test taking too long

**Solution**:
```typescript
// Already configured in vitest.config.ts
testTimeout: 30000  // 30 seconds
```

### Database Connection Fails

**Check**:
1. SQL Server is running
2. Credentials in `.env.test` are correct
3. Firewall allows connections
4. Test user has permissions

**Test connection**:
```bash
# From backend directory
sqlcmd -S localhost -U unfranchise_app -P "password"
```

### Port Already in Use

**Note**: Tests use supertest - no server is started!

If you still see this error:
```bash
# Kill any running dev servers
pkill -f "node.*src/index"
```

### Random Test Failures

**Cause**: Parallel test execution with shared database

**Already Fixed**:
```typescript
// vitest.config.ts
pool: 'forks',
poolOptions: {
  forks: { singleFork: true }  // Sequential execution
}
```

### Database Not Cleaned

**Manual cleanup**:
```sql
USE UnFranchiseMarketing_Test;

EXEC sp_MSForEachTable "ALTER TABLE ? NOCHECK CONSTRAINT all";
EXEC sp_MSForEachTable "TRUNCATE TABLE ?";
EXEC sp_MSForEachTable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";
```

## Performance

### Expected Times
- Auth tests: ~5s
- Content tests: ~8s
- Contact tests: ~10s
- Follow-up tests: ~8s
- Sharing tests: ~7s
- Analytics tests: ~7s

**Total: ~45 seconds**

### Optimization
Tests run sequentially to avoid database conflicts. This is slower but more reliable.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Integration Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run API tests
        run: npm run test:api
        env:
          DB_HOST: ${{ secrets.TEST_DB_HOST }}
          DB_USER: ${{ secrets.TEST_DB_USER }}
          DB_PASSWORD: ${{ secrets.TEST_DB_PASSWORD }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: coverage/
```

## Adding New Tests

### 1. Create Test File

```typescript
// src/__tests__/api/mynewapi.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser } from '../helpers/api-helpers.js';

describe('My New API', () => {
  let testData: any;
  let token: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();
    const user = await loginUser('ufo@test.com');
    token = user.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('POST /api/v1/myendpoint', () => {
    it('should work correctly', async () => {
      const response = await request(app)
        .post('/api/v1/myendpoint')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

### 2. Add Test Script

```json
// package.json
{
  "scripts": {
    "test:mynewapi": "vitest run src/__tests__/api/mynewapi.test.ts"
  }
}
```

### 3. Update Documentation

Add to this file and `src/__tests__/README.md`

## Best Practices

### ✅ DO

- Test all HTTP methods (GET, POST, PUT, DELETE)
- Test authentication and authorization
- Test validation errors
- Test 404 cases
- Test user data isolation
- Use descriptive test names
- Clean up test data
- Use helper functions

### ❌ DON'T

- Test database implementation details
- Share state between tests
- Hardcode IDs (use fixtures)
- Skip error cases
- Test too many things in one test
- Forget to authenticate when needed
- Leave debug code in tests

## Helper Functions

### Login Helper
```typescript
const { token, user } = await loginUser('ufo@test.com');
```

### Authenticated Request
```typescript
const response = await request(app)
  .get('/api/v1/endpoint')
  .set('Authorization', `Bearer ${token}`);
```

### Create Test Data
```typescript
const contact = await createTestContact(token, {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

## Documentation

- [Test Suite README](src/__tests__/README.md) - Detailed documentation
- [Unit Testing Guide](TESTING.md) - Unit test documentation
- [Vitest Docs](https://vitest.dev/) - Framework documentation
- [Supertest Docs](https://github.com/visionmedia/supertest) - HTTP testing

## Need Help?

1. Check this guide
2. Review test output errors
3. Check database connectivity
4. Review existing test files for patterns
5. Check Vitest documentation

---

**Status**: ✅ All 195 tests passing | 90%+ endpoint coverage | ~45s execution time
