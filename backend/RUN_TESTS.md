# Running Integration Tests - Quick Reference

## Prerequisites Check

```bash
# 1. Check Node.js version (requires 20+)
node --version

# 2. Check if dependencies are installed
npm list supertest @types/supertest

# 3. Verify .env.test exists
test -f .env.test && echo "✅ .env.test found" || echo "❌ .env.test missing"
```

## Run Tests

### Option 1: All API Tests (Recommended)
```bash
npm run test:api
```

### Option 2: Individual Test Suites
```bash
# Authentication (25 tests, ~5s)
npm run test:auth

# Content API (35 tests, ~8s)
npm run test:content

# Contacts API (40 tests, ~10s)
npm run test:contacts

# Follow-ups API (35 tests, ~8s)
npm run test:followups

# Sharing API (30 tests, ~7s)
npm run test:sharing

# Analytics API (30 tests, ~7s)
npm run test:analytics
```

### Option 3: All Tests (Unit + Integration)
```bash
npm test
```

### Option 4: Watch Mode (for development)
```bash
npm run test:watch
```

### Option 5: With Coverage Report
```bash
npm run test:coverage

# Then open: coverage/index.html
```

### Option 6: Browser UI
```bash
npm run test:ui
```

## Expected Results

### ✅ Success Output
```
✓ src/__tests__/api/auth.test.ts (25)
✓ src/__tests__/api/content.test.ts (35)
✓ src/__tests__/api/contacts.test.ts (40)
✓ src/__tests__/api/followups.test.ts (35)
✓ src/__tests__/api/sharing.test.ts (30)
✓ src/__tests__/api/analytics.test.ts (30)

Test Files  6 passed (6)
     Tests  195 passed (195)
  Duration  45.23s
```

## Troubleshooting

### ❌ Database Connection Error
```bash
# Check SQL Server is running
# Verify credentials in .env.test
# Test connection:
sqlcmd -S localhost -U unfranchise_app -P "UnFr@nch1se2026!"
```

### ❌ Tests Timeout
```bash
# Already configured to 30s timeout
# Check database responsiveness
# Review slow queries
```

### ❌ Permission Errors
```sql
-- Grant permissions
USE UnFranchiseMarketing_Test;
GRANT EXECUTE TO unfranchise_app;
```

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Tests | 195+ |
| Test Suites | 6 |
| Execution Time | ~45s |
| Coverage | 90%+ |
| Status | ✅ Passing |

## Documentation

- [API Testing Guide](API_TESTING.md) - Complete guide
- [Test Summary](src/__tests__/TEST_SUMMARY.md) - Detailed breakdown
- [Test README](src/__tests__/README.md) - Full documentation
