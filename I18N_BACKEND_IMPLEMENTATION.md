# i18n Backend Implementation Summary

## Overview

Successfully implemented Phase 1 backend services and APIs for multi-country/multi-language (i18n) support in the UnFranchise Marketing App.

**Implementation Date**: April 9, 2026  
**Architecture Reference**: `docs/I18N_ARCHITECTURE_PLAN.md`

---

## Files Created

### 1. Types
- **`backend/src/types/locale.types.ts`**
  - `MarketLocale` interface - API response format
  - `LocaleMapping` interface - service code mapping structure
  - `UserWithLocale` interface - extended user type
  - `UpdateUserLocaleRequest` interface - update request
  - `LocaleValidationResult` interface - validation response

### 2. Services
- **`backend/src/services/locale.service.ts`**
  - `LOCALE_MAPPINGS` constant - BCP 47 mapping for 9 countries × 4 languages
  - `getMarketLocales(marketCode)` - Get available locales for market
  - `validateMarketLocale(marketCode, locale)` - Validate locale for market
  - `getDefaultLocale(marketCode)` - Get default locale (fallback to en-US)
  - `mapServiceCodeToLocale(countryCode, languageCode)` - Map service codes to BCP 47

### 3. Controllers
- **`backend/src/controllers/locale.controller.ts`**
  - `GET /api/v1/locales/markets/:marketCode` - Get locales for market
  - `PUT /api/v1/locales/user` - Update user's preferred locale

### 4. Routes
- **`backend/src/routes/locale.routes.ts`**
  - Public route for getting market locales
  - Protected route for updating user locale (requires authentication)

---

## Files Updated

### 1. Auth Service
**`backend/src/services/auth.service.ts`**

**Changes**:
- Added `localeService` import
- Updated `User` interface to include `PreferredLocale` and `MarketID`
- Updated `LoginResult` interface to include `locale` and `market`
- Modified `login()` method signature to accept optional `countryCode` and `languageCode`
- Added locale determination logic:
  1. Use user's `PreferredLocale` if set
  2. Map service codes to BCP 47 if provided
  3. Get default locale for user's market
  4. Fallback to 'en-US'
- Auto-update user's `PreferredLocale` if determined from service codes
- Include `locale` in JWT payload
- Return `locale` and `market` in login response
- Updated `generateToken()` to include locale in JWT
- Updated `refreshAccessToken()` query to include `PreferredLocale`

### 2. Auth Controller
**`backend/src/controllers/auth.controller.ts`**

**Changes**:
- Updated `login()` to accept optional `countryCode` and `languageCode` from request body
- Pass locale parameters to `authService.login()`
- Updated `/me` endpoint response to include `locale` and `market` fields

### 3. Auth Middleware
**`backend/src/middleware/auth.middleware.ts`**

**Changes**:
- Updated user query to include `PreferredLocale` field
- Extract locale from JWT payload or fallback to user's `PreferredLocale`
- Add `locale` to request user object
- Default to 'en-US' if no locale found

### 4. Main Server
**`backend/src/index.ts`**

**Changes**:
- Import `localeRoutes`
- Mount locale routes at `/api/v1/locales`

---

## API Endpoints

### Get Market Locales
```
GET /api/v1/locales/markets/:marketCode
```

**Response**:
```json
{
  "success": true,
  "data": {
    "marketCode": "USA",
    "locales": [
      {
        "LocaleCode": "en-US",
        "LanguageName": "English",
        "NativeName": "English",
        "IsDefault": true,
        "DisplayOrder": 1,
        "LanguageID": 1
      },
      {
        "LocaleCode": "zh-Hans",
        "LanguageName": "Chinese (Simplified)",
        "NativeName": "简体中文",
        "IsDefault": false,
        "DisplayOrder": 2,
        "LanguageID": 2
      }
    ]
  }
}
```

### Update User Locale
```
PUT /api/v1/locales/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "locale": "zh-TW",
  "marketCode": "TWN"  // optional for validation
}
```

**Response**:
```json
{
  "success": true,
  "message": "Locale updated successfully",
  "data": {
    "locale": "zh-TW"
  }
}
```

### Login (Updated)
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "countryCode": "TWN",    // optional
  "languageCode": "CHI"    // optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "UFO",
      "locale": "zh-TW",    // NEW
      "market": "TWN"       // NEW
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Get Current User (Updated)
```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "UFO",
    "locale": "zh-TW",     // NEW
    "market": "TWN",       // NEW
    "timezone": "Asia/Taipei",
    "dateFormat": "YYYY-MM-DD",
    "createdAt": "2026-04-09T08:00:00Z"
  }
}
```

---

## Locale Mappings

The service supports 9 countries with 4 language families:

```typescript
USA:  ENG → en-US,  CHI → zh-Hans
CAN:  ENG → en-CA,  CHI → zh-Hans
SGP:  ENG → en-SG,  IDN → id-ID
HKG:  ENG → en-HK,  CHI → zh-HK
TWN:  ENG → en-TW,  CHI → zh-TW
GBR:  ENG → en-GB
AUS:  ENG → en-AU,  CHI → zh-Hans
MYS:  ENG → en-MY,  IDN → id-ID,  MSA → ms-MY
IDN:  ENG → en-ID,  IDN → id-ID
```

**Note**: Service codes (ENG, CHI, IDN, MSA) are legacy codes from existing systems. They are mapped to standard BCP 47 locale codes (en-US, zh-TW, id-ID, ms-MY) for consistency.

---

## Database Requirements

The implementation expects these database tables (to be created in Phase 1 database migration):

### MarketLanguage (Junction Table)
```sql
CREATE TABLE dbo.MarketLanguage (
    MarketLanguageID INT IDENTITY(1,1) NOT NULL,
    MarketID INT NOT NULL,
    LanguageID INT NOT NULL,
    IsDefault BIT NOT NULL DEFAULT 0,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    -- Foreign keys and constraints
);
```

### Language Table Updates
```sql
-- Language.LanguageCode should contain BCP 47 codes
-- Examples: 'en-US', 'zh-TW', 'zh-Hans', 'id-ID', 'ms-MY'
```

### User Table Updates
```sql
ALTER TABLE dbo.[User]
ADD PreferredLocale NVARCHAR(10) NULL;  -- BCP 47 locale code
```

---

## JWT Payload Changes

The JWT access token now includes a `locale` field:

```typescript
{
  userId: 123,
  email: "user@example.com",
  role: 2,
  locale: "zh-TW",      // NEW
  type: "access",
  iat: 1234567890,
  exp: 1234567890
}
```

---

## Validation

### Locale Format Validation
- Validates BCP 47 format: `^[a-z]{2}-[A-Z]{2}$|^[a-z]{2}-[A-Z][a-z]{3}$`
- Examples: `en-US`, `zh-TW`, `zh-Hans`, `id-ID`

### Market-Locale Validation
- Ensures locale is available for the user's market
- Queries `MarketLanguage` junction table
- Returns 400 Bad Request if invalid

---

## Error Handling

All endpoints include comprehensive error handling:
- **400 Bad Request** - Invalid input (missing fields, invalid format, unavailable locale)
- **401 Unauthorized** - Not authenticated
- **500 Internal Server Error** - Database or service errors

All errors are logged with Winston logger for debugging.

---

## TypeScript Compilation

All new files compiled successfully with no TypeScript errors:

```bash
✓ backend/src/types/locale.types.ts
✓ backend/src/services/locale.service.ts
✓ backend/src/controllers/locale.controller.ts
✓ backend/src/routes/locale.routes.ts
✓ Updated auth service, controller, middleware
✓ Updated main server index
```

**Build Status**: All locale files compiled to JavaScript in `backend/dist/`

---

## Testing Recommendations

### Unit Tests
1. **LocaleService**
   - Test `mapServiceCodeToLocale()` with all country/language combinations
   - Test fallback to en-US for unknown codes
   - Test `getMarketLocales()` with valid and invalid market codes
   - Test `validateMarketLocale()` with valid/invalid combinations
   - Test `getDefaultLocale()` fallback behavior

2. **AuthService**
   - Test login with service codes (countryCode + languageCode)
   - Test login without service codes (uses PreferredLocale)
   - Test JWT payload includes locale
   - Test PreferredLocale auto-update on first login

3. **LocaleController**
   - Test GET /locales/markets/:marketCode with valid market
   - Test GET /locales/markets/:marketCode with invalid market
   - Test PUT /locales/user with valid locale
   - Test PUT /locales/user with invalid locale
   - Test PUT /locales/user without authentication (401)

### Integration Tests
1. **Login Flow**
   - Login with service codes → verify locale in response
   - Login without service codes → verify default locale
   - Verify JWT contains locale claim
   - Verify /me endpoint returns locale

2. **Locale Update Flow**
   - Update user locale → verify database update
   - Update to invalid locale → verify 400 error
   - Update locale for different market → verify validation

### Manual Testing
1. Login with service codes: `{ countryCode: "TWN", languageCode: "CHI" }`
2. Verify response contains `locale: "zh-TW"`
3. Call GET /me → verify locale persists
4. Update locale to different valid locale
5. Login again → verify new locale is used

---

## Dependencies

**No new dependencies required.** All implementation uses existing packages:
- `mssql` - Database queries
- `express` - HTTP routing
- `jsonwebtoken` - JWT payload updates
- `winston` - Logging

---

## Next Steps

### Phase 1 Database Migration
1. Create `database/12_Schema_Localization.sql`:
   - Create `MarketLanguage` table
   - Add `PreferredLocale` to `User` table
   - Update `Language` table if needed

2. Create `database/13_Seed_Localization_Data.sql`:
   - Seed Language table with BCP 47 codes
   - Populate MarketLanguage junction table
   - Set default locales for each market

3. Run migrations:
   ```bash
   sqlcmd -S localhost -U sa -P "password" -d UnFranchiseMarketing -i database/12_Schema_Localization.sql
   sqlcmd -S localhost -U sa -P "password" -d UnFranchiseMarketing -i database/13_Seed_Localization_Data.sql
   ```

### Frontend Integration (Phase 1)
- Install `next-intl`
- Configure i18n routing
- Implement LocaleSwitcher component
- Update auth store to handle locale
- Update API client to send locale in headers

### Testing
- Write unit tests for all services and controllers
- Write integration tests for API endpoints
- Test with all supported locales
- Verify fallback behavior

---

## Technical Notes

### SQL Server Queries
All database queries use parameterized inputs to prevent SQL injection:
```typescript
await query(`
  SELECT * FROM Language
  WHERE LanguageCode = @locale
`, { locale });
```

### Logging
All operations logged with appropriate levels:
- `logger.info()` - Successful operations
- `logger.warn()` - Fallback behavior or unknown codes
- `logger.error()` - Database errors or failures

### Locale Resolution Order
1. User's saved `PreferredLocale` (database)
2. JWT token `locale` claim
3. Service codes mapping (countryCode + languageCode)
4. Market default locale
5. Global default: `en-US`

---

## Questions or Issues

For questions about this implementation, refer to:
- Architecture plan: `docs/I18N_ARCHITECTURE_PLAN.md`
- This document: `I18N_BACKEND_IMPLEMENTATION.md`
- Backend patterns: `backend/src/services/auth.service.ts`

**Status**: Backend implementation complete and ready for database migration.
