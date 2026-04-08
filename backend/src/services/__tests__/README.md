# Service Unit Tests

This directory contains comprehensive unit tests for all backend services.

## Test Coverage

### High Priority Services (80%+ target)

| Service | Tests | Coverage Target | Status |
|---------|-------|----------------|--------|
| `auth.service.ts` | 20 tests | 100% | ✅ Complete |
| `contact.service.ts` | 34 tests | 90% | ✅ Complete |
| `sharing.service.ts` | 25 tests | 85% | ✅ Complete |
| `followup.service.ts` | 33 tests | 85% | ✅ Complete |
| `content.service.ts` | 14 tests | 80% | ✅ Complete |
| `analytics.service.ts` | 11 tests | 75% | ✅ Complete |

**Total Tests**: 137 tests covering critical services

## Test Files

- **`auth.service.test.ts`** - Authentication, login, JWT token generation/verification, token refresh
- **`contact.service.test.ts`** - Contact CRUD, import/export, tagging, grouping, engagement scoring
- **`sharing.service.test.ts`** - Share events, tracking links, click tracking, analytics, templates
- **`followup.service.test.ts`** - Follow-up tasks, reminders, snoozing, completion, stats
- **`content.service.test.ts`** - Content listing, filtering, categories, view/share counts
- **`analytics.service.test.ts`** - Performance metrics, trends, channel analytics, engagement

## Running Tests

### All Service Tests
```bash
npm test src/services/__tests__
```

### Specific Service
```bash
npm test auth.service.test
npm test contact.service.test
npm test sharing.service.test
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage -- src/services/__tests__
```

## Test Structure

Each test file follows this structure:

```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServiceName();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Test implementation
    });

    it('should handle error case', async () => {
      // Test implementation
    });

    it('should validate edge cases', async () => {
      // Test implementation
    });
  });
});
```

## What We Test

### For Each Service Method:

1. **✅ Happy Path** - Successful execution with valid input
2. **✅ Edge Cases** - Empty inputs, null values, boundary conditions
3. **✅ Error Handling** - Database errors, validation errors, not found
4. **✅ Business Logic** - Calculations, transformations, rules
5. **✅ Security** - Ownership verification, authorization checks
6. **✅ Data Handling** - Pagination, filtering, sorting, search

## Mock Helpers

All tests use standardized mock helpers from `__tests__/helpers/test-utils.ts`:

```typescript
// Create mock entities
createMockUser(overrides)
createMockContact(overrides)
createMockContentItem(overrides)
createMockShareEvent(overrides)
createMockFollowUp(overrides)
createMockTrackingLink(overrides)

// Create dates
pastDate(daysAgo)
futureDate(daysFromNow)
```

## Test Examples

### Testing CRUD Operations

```typescript
it('should create entity', async () => {
  const mockEntity = createMockEntity();
  vi.mocked(database.query).mockResolvedValueOnce([mockEntity]);

  const result = await service.create(data, userId);

  expect(result).toBeDefined();
  expect(result.id).toBe(1);
});
```

### Testing Validation

```typescript
it('should fail with invalid input', async () => {
  await expect(
    service.create({ invalid: 'data' }, userId)
  ).rejects.toThrow('Validation error');
});
```

### Testing Ownership

```typescript
it('should verify ownership', async () => {
  vi.mocked(database.query).mockResolvedValueOnce([]);

  const result = await service.get(1, wrongUserId);

  expect(result).toBeNull();
});
```

### Testing Pagination

```typescript
it('should paginate results', async () => {
  vi.mocked(database.query)
    .mockResolvedValueOnce([{ Total: 100 }])
    .mockResolvedValueOnce(mockItems);

  const result = await service.getList(userId, { limit: 10, offset: 0 });

  expect(result.items).toHaveLength(10);
  expect(result.total).toBe(100);
});
```

## Coverage Goals

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

Run `npm run test:coverage` to see detailed coverage report.

## Adding New Tests

When adding a new service:

1. Create `servicename.service.test.ts` in this directory
2. Import the service and database module
3. Mock database with `vi.mock('../../config/database')`
4. Write tests for all public methods
5. Aim for 80%+ coverage on critical services
6. Use helper functions from `test-utils.ts`
7. Follow AAA pattern (Arrange-Act-Assert)

## Troubleshooting

**Tests failing?**
- Check mock setup is before imports
- Ensure `vi.clearAllMocks()` in `beforeEach`
- Verify mock data matches expected types

**Coverage too low?**
- Add tests for error paths
- Test edge cases (null, empty, invalid)
- Test all conditional branches

**Slow tests?**
- Ensure database is properly mocked
- Don't use real database in unit tests
- Check for unnecessary waits/delays

## Related Documentation

- [Main Testing Guide](../../../TESTING.md)
- [Test Utilities](../../__tests__/helpers/test-utils.ts)
- [Vitest Setup](../../__tests__/setup/vitest-setup.ts)
