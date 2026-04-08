# Testing Quick Start Guide

Get started with backend testing in 2 minutes.

## Run Tests

```bash
# Run all tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Open test UI in browser
npm run test:ui
```

## Test Results

**Current Status**: ✅ 125/137 tests passing (91%)

## What's Tested

- ✅ **Auth Service** (20 tests) - Login, JWT, token refresh
- ✅ **Contact Service** (34 tests) - CRUD, import/export, tagging
- ✅ **Sharing Service** (25 tests) - Tracking links, analytics
- ✅ **Follow-up Service** (33 tests) - Task management, reminders
- ✅ **Content Service** (14 tests) - Content listing, filtering
- ✅ **Analytics Service** (11 tests) - Performance metrics

## Quick Examples

### Run Specific Tests

```bash
# Single service
npm test auth.service.test

# Multiple services
npm test contact.service.test sharing.service.test

# Watch specific tests
npm run test:watch -- contact.service.test
```

### View Coverage

```bash
# Generate coverage
npm run test:coverage

# Open HTML report
open coverage/index.html  # Mac
start coverage/index.html # Windows
```

### Test in UI Mode

```bash
npm run test:ui
# Opens http://localhost:51204
```

## File Structure

```
backend/
├── vitest.config.ts              # Test configuration
├── TESTING.md                    # Full documentation
├── TEST_SUMMARY.md               # This sprint's summary
├── src/
│   ├── services/
│   │   └── __tests__/            # Service unit tests
│   │       ├── auth.service.test.ts
│   │       ├── contact.service.test.ts
│   │       ├── sharing.service.test.ts
│   │       └── ...
│   └── __tests__/
│       ├── setup/
│       │   └── vitest-setup.ts   # Global setup
│       └── helpers/
│           └── test-utils.ts     # Mock helpers
```

## Writing a New Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../my.service';
import * as database from '../../config/database';
import { createMockData } from '../../__tests__/helpers/test-utils';

// Mock database
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MyService();
  });

  it('should do something', async () => {
    // Arrange
    const mockData = createMockData();
    vi.mocked(database.query).mockResolvedValueOnce([mockData]);

    // Act
    const result = await service.doSomething();

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Mock Helpers

```typescript
import {
  createMockUser,
  createMockContact,
  createMockContentItem,
  pastDate,
  futureDate
} from '../../__tests__/helpers/test-utils';

const user = createMockUser({ Email: 'test@example.com' });
const contact = createMockContact({ Status: 'Active' });
const yesterday = pastDate(1);
const nextWeek = futureDate(7);
```

## Coverage Targets

| Service Type | Coverage Target |
|--------------|-----------------|
| High Priority | 80%+ |
| Medium Priority | 70%+ |
| Low Priority | 50%+ |

## Troubleshooting

**Tests won't run?**
```bash
npm install
npm test
```

**Coverage report not generating?**
```bash
rm -rf coverage/
npm run test:coverage
```

**Tests timing out?**
- Check that database is mocked properly
- Increase timeout in `vitest.config.ts` if needed

## Resources

- **Full Guide**: [TESTING.md](./TESTING.md)
- **Sprint Summary**: [TEST_SUMMARY.md](./TEST_SUMMARY.md)
- **Service Tests**: [src/services/__tests__/README.md](./src/services/__tests__/README.md)
- **Vitest Docs**: https://vitest.dev/

## Next Steps

1. Run `npm test` to verify setup
2. Run `npm run test:coverage` to see coverage
3. Open `coverage/index.html` to explore coverage
4. Read [TESTING.md](./TESTING.md) for detailed guide
5. Check [TEST_SUMMARY.md](./TEST_SUMMARY.md) for Sprint 8 deliverables

---

**Need Help?** Check [TESTING.md](./TESTING.md) for comprehensive documentation.
