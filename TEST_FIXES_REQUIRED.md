# Test Suite Fixes Required

**Date**: April 8, 2026  
**Status**: 87 tests failing out of ~230 total tests

## Summary

Test failures are primarily due to:
1. **Field name mismatches** - Tests use `phone` but API expects `mobile`
2. **Response format mismatches** - Tests expect different response structures
3. **Validation schema issues** - Phone regex too strict, missing error handling
4. **Database schema differences** - Column name casing inconsistencies

---

## 🔴 Critical Issues

### 1. Contact API Tests (29 failures)

**Root Cause**: Test fixtures use `phone` field but API expects `mobile`

**Files to Fix**:
- `backend/src/__tests__/fixtures/contacts.ts` - Change all `phone:` to `mobile:`
- `backend/src/__tests__/api/contacts.test.ts` - Update field references

**Example Fix**:
```typescript
// BEFORE:
export const testContacts = {
  contact1: {
    phone: '+15551234567'  // ❌ Wrong field name
  }
};

// AFTER:
export const testContacts = {
  contact1: {
    mobile: '+15551234567'  // ✅ Correct field name
  }
};
```

**Impact**: Fixes 5-10 test failures

---

### 2. Phone Number Validation Too Strict

**Root Cause**: Regex `/^\+?[1-9]\d{1,14}$/` rejects valid phone numbers

**File to Fix**: `backend/src/validation/contact.validation.ts`

**Current Issue**:
- Rejects numbers like `5551234567` (missing +)
- Rejects numbers starting with 0

**Recommended Fix**:
```typescript
// BEFORE:
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// AFTER:
const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;  // More lenient
```

**Impact**: Fixes validation failures

---

### 3. Response Format Mismatch

**Root Cause**: Content/Follow-up APIs return `{ items: [], total: 0 }` but tests expect `{ data: [] }`

**Files to Fix**:
- `backend/src/__tests__/api/content.test.ts`
- `backend/src/__tests__/api/followups.test.ts`

**Example Fix**:
```typescript
// BEFORE:
expect(response.body.data).toBeArray();

// AFTER:
expect(response.body.items).toBeArray();
// OR update service to return { data: [] } format
```

**Impact**: Fixes 20+ test failures

---

### 4. Auth Error Response Missing Fields

**Root Cause**: Auth API doesn't return `success: false` field on errors

**File to Fix**: `backend/src/controllers/auth.controller.ts`

**Current**:
```typescript
res.status(401).json({
  error: 'Unauthorized',
  message: 'Invalid credentials'
});
```

**Should Be**:
```typescript
res.status(401).json({
  success: false,  // ✅ Add this
  error: 'Unauthorized',
  message: 'Invalid credentials'
});
```

**Impact**: Fixes 7 auth test failures

---

### 5. Sharing API Channel Validation

**Root Cause**: Tests expect specific channel names but API accepts generic "Social"

**Issue**: 
- Test expects `channel: 'Facebook'`
- API stores as `channel: 'Social'`

**Files to Fix**:
- `backend/src/__tests__/api/sharing.test.ts` - Update expectations
- `backend/src/services/sharing.service.ts` - Store specific channel names

**Impact**: Fixes 10+ sharing test failures

---

## 📝 Detailed Fix List

### Priority 1: Quick Wins (< 30 min)

1. **Fix Contact Fixtures** ✅ Easy
   ```bash
   # File: backend/src/__tests__/fixtures/contacts.ts
   # Change all: phone → mobile
   ```

2. **Add `success` field to error responses** ✅ Easy
   ```bash
   # Files: All controllers
   # Add: success: false to all error responses
   ```

3. **Update phone validation regex** ✅ Easy
   ```bash
   # File: backend/src/validation/contact.validation.ts
   # Update regex to be more lenient
   ```

---

### Priority 2: Response Format Fixes (30-60 min)

4. **Standardize API Response Format** ⚠️ Medium
   
   **Option A**: Update all services to use consistent format
   ```typescript
   {
     success: true,
     data: [...],
     pagination: { total, limit, offset }
   }
   ```

   **Option B**: Update tests to match current format
   - Content API returns: `{ items: [], total: 0 }`
   - Tests expect: `{ data: [] }`

5. **Fix Content API Response Structure**
   - Update `content.service.ts` to return `{ data, total }` instead of `{ items, total }`
   - OR update all content tests to use `.items` instead of `.data`

---

### Priority 3: Service Logic Fixes (60-90 min)

6. **Fix Sharing Channel Storage**
   ```typescript
   // backend/src/services/sharing.service.ts
   // Store: 'Facebook', 'Twitter', 'LinkedIn'
   // Instead of: 'Social'
   ```

7. **Fix Follow-up Service Response Format**
   ```typescript
   // Ensure getUpcomingFollowUps returns proper structure
   // Fix: Cannot read properties of undefined (reading 'map')
   ```

8. **Fix Template Endpoint**
   ```typescript
   // GET /api/v1/share/templates/:channel
   // Should return template for WhatsApp, Facebook, etc.
   // Currently returns 400 Bad Request
   ```

---

## 🧪 Test Files Needing Updates

### Fixtures (Test Data)
- ✅ `backend/src/__tests__/fixtures/contacts.ts` - phone → mobile
- ✅ `backend/src/__tests__/fixtures/users.ts` - Check field names
- ✅ `backend/src/__tests__/fixtures/content.ts` - Check response format
- ✅ `backend/src/__tests__/fixtures/followups.ts` - Check response format

### API Tests
- ⚠️ `backend/src/__tests__/api/contacts.test.ts` (29 failures)
- ⚠️ `backend/src/__tests__/api/content.test.ts` (29 failures)
- ⚠️ `backend/src/__tests__/api/followups.test.ts` (22 failures)
- ⚠️ `backend/src/__tests__/api/sharing.test.ts` (16 failures)
- ⚠️ `backend/src/__tests__/api/auth.test.ts` (7 failures)
- ⚠️ `backend/src/__tests__/api/analytics.test.ts` (not checked)

### Service Tests
- ⚠️ `backend/src/services/__tests__/followup.service.test.ts` (7 failures)
- ⚠️ `backend/src/services/__tests__/sharing.service.test.ts` (2 failures)
- ✅ `backend/src/services/__tests__/contact.service.test.ts` (all passing!)

---

## 🚀 Recommended Fix Order

### Step 1: Fix Test Fixtures (5 min)
```bash
cd backend/src/__tests__/fixtures
# Edit contacts.ts - change phone to mobile
```

### Step 2: Fix Validation (5 min)
```bash
cd backend/src/validation
# Edit contact.validation.ts - update phone regex
```

### Step 3: Add success field to errors (10 min)
```bash
cd backend/src/controllers
# Edit all *controller.ts files
# Add success: false to error responses
```

### Step 4: Run tests and check progress
```bash
cd backend
npm test
# Should see significant improvement
```

### Step 5: Fix response format mismatches (30 min)
- Decision needed: Update tests or update services?
- Recommendation: Update tests to match current API

### Step 6: Fix remaining service logic issues (30 min)
- Sharing channel names
- Template endpoints
- Follow-up service map errors

---

## 📊 Expected Results After Fixes

| Test Suite | Before | After (Est.) |
|------------|--------|--------------|
| Contact API | 29 failures | ~5 failures |
| Content API | 29 failures | ~10 failures |
| Follow-up API | 22 failures | ~8 failures |
| Sharing API | 16 failures | ~5 failures |
| Auth API | 7 failures | 0 failures ✅ |
| Services | 9 failures | ~2 failures |
| **TOTAL** | **~87 failures** | **~20 failures** |

---

## 🎯 Next Actions

1. **Start with quick wins** - Fix fixtures and validation (10 min)
2. **Add success fields** - Standardize error responses (10 min)
3. **Run tests again** - See improvement
4. **Decision point** - Update tests vs update services for response format
5. **Fix remaining issues** - Service logic, channel names, templates

---

## 📝 Notes

- ✅ **Contact service tests** are ALL PASSING - use as reference for good patterns
- ⚠️ **Response format** - Inconsistent across services, needs standardization
- ⚠️ **Field naming** - Mix of camelCase/PascalCase/different names
- 🔍 **Database schema** - Need to verify actual column names match types

---

**Status**: Ready to begin fixes  
**Estimated Time**: 1-2 hours for 75% improvement  
**Owner**: Ready for implementation
