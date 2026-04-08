# API Integration Tests

Comprehensive API integration tests for the UnFranchise Marketing App backend.

## Overview

This test suite provides full coverage of all API endpoints with integration tests that use a real test database. Tests validate authentication, authorization, data validation, error handling, and business logic.

## Test Structure

```
src/__tests__/
├── api/                    # API endpoint tests
│   ├── auth.test.ts        # Authentication endpoints
│   ├── content.test.ts     # Content management endpoints
│   ├── contacts.test.ts    # Contact management endpoints
│   ├── followups.test.ts   # Follow-up management endpoints
│   ├── sharing.test.ts     # Content sharing endpoints
│   └── analytics.test.ts   # Analytics endpoints
├── setup/                  # Test setup and utilities
│   ├── test-db.ts          # Database setup/teardown
│   └── test-server.ts      # Server initialization
├── fixtures/               # Test data fixtures
│   ├── users.ts            # User test data
│   ├── contacts.ts         # Contact test data
│   ├── content.ts          # Content test data
│   └── followups.ts        # Follow-up test data
├── helpers/                # Test helper functions
│   └── api-helpers.ts      # API testing utilities
└── README.md               # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run only API integration tests
```bash
npm test -- api/
```

## Test Database Setup

Tests use a separate test database: `UnFranchiseMarketing_Test`

### Environment Configuration

Test environment variables are in `.env.test`:
- `DB_NAME=UnFranchiseMarketing_Test`
- `NODE_ENV=test`
- Different JWT secrets for test isolation

### Database Lifecycle

1. **Before All Tests**:
   - Create test database if not exists
   - Create schemas
   - Seed test data

2. **Before Each Test Suite**:
   - Seed fresh test data

3. **After All Tests**:
   - Clean up test data
   - Close database connections

## Test Coverage

### Authentication API (auth.test.ts)
- ✅ POST /api/v1/auth/login
  - Valid credentials
  - Invalid credentials
  - Inactive user
  - Missing fields
  - SQL injection protection
  - Security tests
- ✅ GET /api/v1/auth/me
  - Valid token
  - Invalid token
  - Missing token
- ✅ POST /api/v1/auth/refresh
  - Valid refresh token
  - Invalid refresh token
  - Missing token
- ✅ POST /api/v1/auth/logout
  - Successful logout
  - Invalid token

**Total: 25+ test cases**

### Content API (content.test.ts)
- ✅ GET /api/v1/content
  - List all content
  - Pagination
  - Filtering (type, category, status)
  - Sorting
- ✅ GET /api/v1/content/:id
  - Get by ID
  - Non-existent content
  - Draft content authorization
- ✅ GET /api/v1/content/featured
- ✅ GET /api/v1/content/recent
- ✅ GET /api/v1/content/search
  - Search by title
  - Search by description
  - No results
- ✅ GET /api/v1/content/categories
- ✅ POST /api/v1/content (Admin)
  - Create content
  - Authorization check
  - Validation
- ✅ PUT /api/v1/content/:id (Admin)
  - Update content
  - Authorization check
- ✅ DELETE /api/v1/content/:id (Admin)
  - Delete content
  - Authorization check

**Total: 35+ test cases**

### Contact API (contacts.test.ts)
- ✅ POST /api/v1/contacts
  - Create contact
  - Validation
  - Email normalization
  - Phone normalization
- ✅ GET /api/v1/contacts
  - List contacts
  - Pagination
  - Filtering
  - User isolation
- ✅ GET /api/v1/contacts/:id
  - Get by ID
  - Authorization check
- ✅ PUT /api/v1/contacts/:id
  - Update contact
  - Partial updates
  - Authorization check
- ✅ DELETE /api/v1/contacts/:id
  - Delete contact
  - Authorization check
- ✅ GET /api/v1/contacts/search
  - Search by name
  - Search by email
  - User isolation
- ✅ POST /api/v1/contacts/import
  - Bulk import
  - Error handling
- ✅ GET /api/v1/contacts/export
  - CSV export
  - JSON export
- ✅ POST /api/v1/contacts/:id/tags
  - Add tags
  - Duplicate prevention
- ✅ DELETE /api/v1/contacts/:id/tags/:tag
  - Remove tags
- ✅ GET /api/v1/contacts/:id/activity
  - Activity timeline

**Total: 40+ test cases**

### Follow-up API (followups.test.ts)
- ✅ POST /api/v1/followups
  - Create follow-up
  - Validation
  - Contact association
  - Authorization check
- ✅ GET /api/v1/followups
  - List follow-ups
  - Pagination
  - Filtering (status, priority, contact)
  - User isolation
- ✅ GET /api/v1/followups/:id
  - Get by ID
  - Authorization check
- ✅ PUT /api/v1/followups/:id
  - Update follow-up
  - Partial updates
  - Authorization check
- ✅ DELETE /api/v1/followups/:id
  - Delete follow-up
  - Authorization check
- ✅ POST /api/v1/followups/:id/complete
  - Mark as completed
- ✅ POST /api/v1/followups/:id/snooze
  - Snooze follow-up
  - Duration validation
- ✅ GET /api/v1/followups/upcoming
  - Get upcoming follow-ups
- ✅ GET /api/v1/followups/overdue
  - Get overdue follow-ups
- ✅ GET /api/v1/followups/templates
  - Get templates

**Total: 35+ test cases**

### Sharing API (sharing.test.ts)
- ✅ POST /api/v1/share
  - Share via SMS
  - Share via Email
  - Share via WhatsApp
  - Share via Facebook
  - Share via Twitter
  - Tracking code generation
  - Validation
- ✅ GET /api/v1/share/:trackingCode/track
  - Track click
  - Record event
  - Redirect to content
  - Invalid tracking code
- ✅ GET /api/v1/share/analytics
  - Get analytics
  - Filter by date
  - Filter by channel
  - Filter by content
  - User isolation
- ✅ GET /api/v1/share/templates/:channel
  - Get templates by channel
  - Template variables
  - Invalid channel

**Total: 30+ test cases**

### Analytics API (analytics.test.ts)
- ✅ GET /api/v1/analytics/overview
  - Get overview metrics
  - Date range filtering
  - Engagement metrics
- ✅ GET /api/v1/analytics/trends
  - Get trends
  - Period grouping (daily, weekly, monthly)
  - Date range filtering
- ✅ GET /api/v1/analytics/channels
  - Channel performance
  - Sorting
  - Click-through rates
- ✅ GET /api/v1/analytics/top-content
  - Top performing content
  - Sorting
  - Filtering
- ✅ GET /api/v1/analytics/leaderboard
  - User leaderboard
  - Sorting
  - Market filtering
  - Privacy protection
- ✅ GET /api/v1/analytics/recent-shares
  - Recent activity
  - Filtering
  - Sorting
- ✅ Performance tests
  - Large date ranges
  - Concurrent requests

**Total: 30+ test cases**

## Total Test Coverage

- **6 Test Suites**
- **195+ Test Cases**
- **90%+ Endpoint Coverage**
- **All Critical User Flows Tested**

## Test Patterns

### Authentication Testing
```typescript
it('should fail without authentication', async () => {
  const response = await request(app)
    .get('/api/v1/protected-endpoint')
    .expect(401);

  expect(response.body.error).toBe('Unauthorized');
});
```

### Authorization Testing
```typescript
it('should not allow accessing other users data', async () => {
  const response = await request(app)
    .get(`/api/v1/resource/${othersResourceId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .expect(403);

  expect(response.body.error).toBe('Forbidden');
});
```

### Validation Testing
```typescript
it('should fail with invalid email format', async () => {
  const response = await request(app)
    .post('/api/v1/endpoint')
    .set('Authorization', `Bearer ${token}`)
    .send({ email: 'notanemail' })
    .expect(400);

  expect(response.body.error).toBe('Bad Request');
});
```

### SQL Injection Testing
```typescript
it('should handle SQL injection attempts safely', async () => {
  for (const payload of SQL_INJECTION_PAYLOADS) {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .send({ field: payload });

    expect([400, 401]).toContain(response.status);
  }
});
```

## Helper Functions

### Login Helper
```typescript
const { token, user } = await loginUser('user@test.com');
```

### Authenticated Request Helper
```typescript
const response = await authenticatedRequest('get', '/api/v1/endpoint', token);
```

### Create Test Data Helpers
```typescript
const contact = await createTestContact(token, { firstName: 'John', ... });
const followUp = await createTestFollowUp(token, { title: 'Call', ... });
```

## Test Data

All test data is defined in fixtures:
- **4 Test Users**: Admin, UFO, UFO2, Inactive
- **3 Test Contacts**: John, Jane, Bob
- **4 Test Content Items**: Video, Document, Image, Draft
- **2 Test Contact Groups**
- **3 Test Markets**: US, CA, MX
- **3 Test Categories**: Product, Training, Event

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use beforeAll/afterAll for setup/teardown
3. **Assertions**: Use descriptive expect statements
4. **Error Cases**: Test both success and failure paths
5. **Security**: Test authentication, authorization, and injection attacks
6. **User Isolation**: Verify users can only access their own data
7. **Validation**: Test all validation rules
8. **Edge Cases**: Test boundary conditions and edge cases

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

### CI Requirements
- All tests must pass
- No test should take longer than 30 seconds
- Test database must be created/destroyed cleanly

## Troubleshooting

### Tests Timeout
- Increase `testTimeout` in vitest.config.ts
- Check database connectivity
- Verify test database exists

### Database Connection Errors
- Ensure SQL Server is running
- Check `.env.test` configuration
- Verify test user has permissions

### Random Test Failures
- Enable `singleFork: true` in vitest.config.ts
- Check for test interdependencies
- Review database cleanup logic

### Port Already in Use
- Tests don't start a server (use supertest)
- Check if dev server is running
- Kill any orphaned processes

## Future Enhancements

- [ ] Add admin endpoint tests
- [ ] Add settings endpoint tests
- [ ] Add contact group tests
- [ ] Add template tests
- [ ] Add rate limiting tests
- [ ] Add file upload tests
- [ ] Add webhook tests
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Security penetration testing

## Contributing

When adding new API endpoints:
1. Create test file in `src/__tests__/api/`
2. Add test data to fixtures if needed
3. Write tests for all success/failure cases
4. Test authentication and authorization
5. Test validation and error handling
6. Update this README with coverage details

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
