# Backend Testing Guide

This guide provides comprehensive information about testing the UnFranchise Marketing App backend services.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [Testing Patterns](#testing-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

The backend test suite provides comprehensive unit testing for all services with a target of 80%+ code coverage for critical services.

### Current Coverage Status

**High Priority Services (80%+ coverage target):**
- ✅ `auth.service.ts` - Authentication and JWT management
- ✅ `contact.service.ts` - Contact CRUD operations
- ✅ `sharing.service.ts` - Share event tracking and link generation
- ✅ `followup.service.ts` - Follow-up task management
- ✅ `content.service.ts` - Content operations
- ✅ `analytics.service.ts` - Analytics calculations

**Medium Priority Services (70%+ coverage target):**
- Contact group service
- Template service
- User management service

**Lower Priority Services (50%+ coverage target):**
- Feature flags
- System settings
- Content moderation

## Testing Stack

- **Test Framework**: [Vitest](https://vitest.dev/) - Fast unit testing with Vite
- **Coverage Provider**: @vitest/coverage-v8 - V8 JavaScript code coverage
- **Mocking**: Vitest built-in mocking (vi.mock)
- **Assertions**: Vitest expect API (Jest-compatible)
- **UI**: @vitest/ui - Visual test interface

## Running Tests

### Run All Tests

```bash
npm test
```

This runs all tests once and exits.

### Watch Mode

```bash
npm run test:watch
```

Watches for file changes and re-runs affected tests automatically.

### UI Mode

```bash
npm run test:ui
```

Opens a browser-based UI for exploring and running tests interactively.

### Coverage Report

```bash
npm run test:coverage
```

Generates a full coverage report in multiple formats:
- Console output (text)
- HTML report in `coverage/` directory
- JSON data for CI integration
- LCOV format for third-party tools

### Coverage with UI

```bash
npm run test:coverage:ui
```

Opens the test UI with coverage information displayed inline.

## Test Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── contact.service.ts
│   │   ├── sharing.service.ts
│   │   ├── followup.service.ts
│   │   └── __tests__/                    # Service tests
│   │       ├── auth.service.test.ts
│   │       ├── contact.service.test.ts
│   │       ├── sharing.service.test.ts
│   │       ├── followup.service.test.ts
│   │       ├── content.service.test.ts
│   │       └── analytics.service.test.ts
│   └── __tests__/
│       ├── setup/
│       │   ├── vitest-setup.ts           # Global test configuration
│       │   ├── test-db.ts                # Database utilities
│       │   └── test-server.ts            # Test server
│       └── helpers/
│           └── test-utils.ts             # Test helper functions
├── vitest.config.ts                       # Vitest configuration
└── TESTING.md                             # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../my.service';
import * as database from '../../config/database';
import { createMockData } from '../../__tests__/helpers/test-utils';

// Mock dependencies
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('MyService', () => {
  let myService: MyService;

  beforeEach(() => {
    vi.clearAllMocks();
    myService = new MyService();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      const mockData = createMockData();
      vi.mocked(database.query).mockResolvedValueOnce([mockData]);

      // Act
      const result = await myService.methodName();

      // Assert
      expect(result).toBeDefined();
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.mocked(database.query).mockRejectedValueOnce(
        new Error('Database error')
      );

      // Act & Assert
      await expect(myService.methodName()).rejects.toThrow('Database error');
    });
  });
});
```

### Using Test Utilities

The `test-utils.ts` file provides helper functions for creating mock data:

```typescript
import {
  createMockUser,
  createMockContact,
  createMockContentItem,
  createMockShareEvent,
  createMockFollowUp,
  createMockTrackingLink,
  pastDate,
  futureDate
} from '../../__tests__/helpers/test-utils';

// Create mock data
const mockUser = createMockUser({
  UserID: 1,
  Email: 'test@example.com',
  Status: 'Active'
});

const mockContact = createMockContact({
  ContactID: 1,
  Email: 'contact@example.com'
});

// Create dates
const yesterday = pastDate(1);    // 1 day ago
const nextWeek = futureDate(7);   // 7 days from now
```

### Test Coverage Requirements

**What to Test:**

1. **Happy Path** - Normal successful execution
2. **Edge Cases** - Boundary conditions, empty inputs, null values
3. **Error Handling** - Database errors, validation errors, missing data
4. **Business Logic** - Calculations, transformations, rules
5. **Security** - Ownership verification, authorization
6. **Side Effects** - Database updates, external calls

**Example Test Coverage:**

```typescript
describe('createContact', () => {
  it('should create contact with email', async () => {
    // Happy path
  });

  it('should create contact with mobile', async () => {
    // Alternative path
  });

  it('should fail without email or mobile', async () => {
    // Validation error
  });

  it('should detect duplicate contacts', async () => {
    // Business rule
  });

  it('should handle tags array', async () => {
    // Data transformation
  });

  it('should set default values', async () => {
    // Default behavior
  });
});
```

## Mocking Patterns

### Database Mocking

```typescript
// Mock single query result
vi.mocked(database.query).mockResolvedValueOnce([mockData]);

// Mock multiple sequential queries
vi.mocked(database.query)
  .mockResolvedValueOnce([]) // First call
  .mockResolvedValueOnce([mockData]); // Second call

// Mock database error
vi.mocked(database.query).mockRejectedValueOnce(
  new Error('Database error')
);

// Mock stored procedure
vi.mocked(database.executeProcedure).mockResolvedValueOnce([mockData]);
```

### Bcrypt/JWT Mocking

Password hashing and JWT generation work normally in tests. The logger is auto-mocked in `vitest-setup.ts`.

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`, open:
```
coverage/index.html
```

This shows:
- Overall coverage percentages
- File-by-file coverage breakdown
- Line-by-line coverage highlighting
- Uncovered code branches

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

Tests will fail if coverage drops below these thresholds.

### Coverage Exclusions

Excluded from coverage:
- `node_modules/`
- `dist/`
- Test files (`**/*.test.ts`, `**/__tests__/`)
- Type definitions (`src/types/`)
- Configuration (`src/config/`)
- Logger (`src/utils/logger.ts`)
- Routes and middleware (tested via integration tests)

## Testing Patterns

### AAA Pattern (Arrange-Act-Assert)

All tests follow the AAA pattern:

```typescript
it('should do something', async () => {
  // Arrange - Set up test data and mocks
  const mockData = createMockUser();
  vi.mocked(database.query).mockResolvedValueOnce([mockData]);

  // Act - Execute the function being tested
  const result = await service.someMethod();

  // Assert - Verify the results
  expect(result).toBeDefined();
  expect(result.id).toBe(1);
});
```

### Testing Async Code

```typescript
// Promise resolution
it('should resolve successfully', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// Promise rejection
it('should handle errors', async () => {
  await expect(service.asyncMethod()).rejects.toThrow('Error message');
});
```

### Testing Error Handling

```typescript
it('should handle database errors gracefully', async () => {
  // Arrange
  vi.mocked(database.query).mockRejectedValueOnce(
    new Error('Connection timeout')
  );

  // Act & Assert
  await expect(
    service.methodName()
  ).rejects.toThrow('Connection timeout');
});
```

### Testing Ownership/Authorization

```typescript
it('should verify ownership', async () => {
  // Arrange
  vi.mocked(database.query).mockResolvedValueOnce([]); // No results

  // Act
  const result = await service.getContact(1, 999); // Wrong user ID

  // Assert
  expect(result).toBeNull(); // Or throws error
});
```

### Testing Pagination

```typescript
it('should apply pagination', async () => {
  // Arrange
  const mockData = Array.from({ length: 10 }, (_, i) =>
    createMockContact({ ContactID: i + 1 })
  );

  vi.mocked(database.query)
    .mockResolvedValueOnce([{ Total: 100 }])
    .mockResolvedValueOnce(mockData);

  // Act
  const result = await service.getContacts(1, { limit: 10, offset: 0 });

  // Assert
  expect(result.items).toHaveLength(10);
  expect(result.total).toBe(100);
});
```

## Troubleshooting

### Tests Timing Out

If tests timeout, increase the timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
  hookTimeout: 10000
}
```

### Database Connection Issues

Unit tests mock the database, so no real database connection is needed. If you see database errors, ensure your mocks are properly configured.

### Mock Not Working

Ensure mocks are defined before imports:

```typescript
// ✅ Correct - Mock before importing
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

import { MyService } from '../my.service';

// ❌ Wrong - Import before mock
import { MyService } from '../my.service';

vi.mock('../../config/database', () => ({
  query: vi.fn()
}));
```

### Coverage Not Updating

Clear coverage cache and re-run:

```bash
rm -rf coverage/
npm run test:coverage
```

### Test Isolation Issues

Tests should be isolated. Always clear mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Best Practices

1. **One Assertion Per Test** - Keep tests focused
2. **Use Descriptive Names** - Test names should describe what they test
3. **Test Behavior, Not Implementation** - Don't test internal details
4. **Keep Tests Fast** - Mock external dependencies
5. **Make Tests Independent** - No test should depend on another
6. **Use Factory Functions** - Use `createMock*` helpers for consistency
7. **Clear Mocks** - Always clear mocks between tests
8. **Test Edge Cases** - Don't just test happy paths

## CI/CD Integration

Tests run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

Coverage reports can be uploaded to services like Codecov or Coveralls for tracking over time.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Coverage Guide](https://vitest.dev/guide/coverage.html)

## Support

For issues or questions about testing:
1. Check this documentation
2. Review existing test files for patterns
3. Check Vitest documentation
4. Ask the team in #dev-testing Slack channel
