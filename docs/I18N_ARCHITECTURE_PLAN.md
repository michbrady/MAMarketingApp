# Multi-Country/Multi-Language Support - Architecture & Implementation Plan

## Executive Summary

This plan details the implementation of comprehensive internationalization (i18n) support for the UnFranchise Marketing App, supporting 9 countries with 4 language families (English, Chinese with regional variants, Indonesian, and Malay). The architecture leverages `next-intl` for frontend localization, extends existing database structures, and implements a scalable translation management system.

**Timeline**: 13 weeks  
**Complexity**: High  
**Team Requirements**: Database engineer, 2 backend developers, 2 frontend developers, QA engineer, translator coordinator

---

## 1. Architecture Decisions

### 1.1 I18n Library Selection: **next-intl**

**Decision**: Use `next-intl` instead of react-i18next

**Rationale**:
- **Native Next.js 15 App Router Support**: Built specifically for Next.js with full SSR/SSG support
- **Server Components Ready**: Works seamlessly with React Server Components
- **Type Safety**: Full TypeScript support with autocomplete for translation keys
- **Smaller Bundle**: Tree-shakeable, only loads translations for active locale
- **Better DX**: Simpler API, less boilerplate than react-i18next
- **Middleware Integration**: Built-in locale detection and routing middleware
- **Performance**: Translations can be loaded at build time for static pages

### 1.2 Locale Code Format: **BCP 47 Standard**

**Decision**: Use BCP 47 locale codes (en-US, zh-TW, id-ID, ms-MY) as primary format

**Mapping Strategy**:
```typescript
// Service code → BCP 47 mapping
const LOCALE_MAPPINGS = {
  USA: {
    ENG: 'en-US',
    CHI: 'zh-Hans', // Simplified Chinese for USA
  },
  CAN: {
    ENG: 'en-CA',
    CHI: 'zh-Hans',
  },
  SGP: {
    ENG: 'en-SG',
    IDN: 'id-ID',
  },
  HKG: {
    ENG: 'en-HK',
    CHI: 'zh-HK', // Traditional with HK variant
  },
  TWN: {
    ENG: 'en-TW',
    CHI: 'zh-TW', // Traditional Taiwanese
  },
  GBR: {
    ENG: 'en-GB',
  },
  AUS: {
    ENG: 'en-AU',
    CHI: 'zh-Hans',
  },
  MYS: {
    ENG: 'en-MY',
    IDN: 'id-ID',
    MSA: 'ms-MY',
  },
  IDN: {
    ENG: 'en-ID',
    IDN: 'id-ID',
  },
};
```

### 1.3 Translation Storage: **Hybrid Approach**

**Decision**: JSON files for UI strings, database for dynamic content

**Structure**:
```
frontend/
  messages/          # Translation files
    en-US.json      # Default English
    en-CA.json      # Canadian English (inherits en-US)
    zh-TW.json      # Traditional Chinese (Taiwan)
    zh-HK.json      # Traditional Chinese (Hong Kong)
    zh-Hans.json    # Simplified Chinese
    id-ID.json      # Indonesian
    ms-MY.json      # Malay
    
    # Shared translations
    common/
      errors.json
      validation.json
      navigation.json
```

**Benefits**:
- UI strings version-controlled and deployable with code
- Dynamic content (marketing materials) manageable via admin panel
- Translation memory reusable across similar locales
- Clear separation of concerns

### 1.4 URL Strategy: **Locale Prefix in Path**

**Decision**: Use `/[locale]/...` pattern, not subdomain or cookie-only

**Examples**:
- `/en-US/dashboard`
- `/zh-TW/content`
- `/id-ID/contacts`

**Rationale**:
- SEO-friendly (if public pages added later)
- User-shareable URLs with locale context
- Easy locale switching
- No CORS/cookie issues
- Aligns with Next.js conventions

### 1.5 Fallback Strategy

**Locale Resolution Order**:
1. User's saved preference (database)
2. JWT token locale claim
3. Accept-Language header
4. Country default (e.g., USA → en-US)
5. Global default (en-US)

**Translation Fallback Chain**:
```
zh-HK → zh-Hant → en-US (fallback)
en-CA → en-US (fallback)
id-ID → en-US (fallback)
```

---

## 2. Database Schema Changes

### 2.1 New Tables

#### MarketLanguage (Junction Table)
```sql
CREATE TABLE dbo.MarketLanguage (
    MarketLanguageID INT IDENTITY(1,1) NOT NULL,
    MarketID INT NOT NULL,
    LanguageID INT NOT NULL,
    IsDefault BIT NOT NULL DEFAULT 0,         -- Default language for this market
    DisplayOrder INT NOT NULL DEFAULT 0,       -- Order in language selector
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    
    CONSTRAINT PK_MarketLanguage PRIMARY KEY CLUSTERED (MarketLanguageID),
    CONSTRAINT FK_MarketLanguage_Market FOREIGN KEY (MarketID) 
        REFERENCES dbo.Market(MarketID),
    CONSTRAINT FK_MarketLanguage_Language FOREIGN KEY (LanguageID) 
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_MarketLanguage UNIQUE (MarketID, LanguageID)
);

CREATE NONCLUSTERED INDEX IX_MarketLanguage_Market 
    ON dbo.MarketLanguage(MarketID, IsActive);
```

#### TranslationString (for UI translations manageable via admin)
```sql
CREATE TABLE dbo.TranslationString (
    TranslationStringID BIGINT IDENTITY(1,1) NOT NULL,
    TranslationKey NVARCHAR(255) NOT NULL,     -- e.g., "dashboard.welcome"
    LanguageID INT NOT NULL,
    TranslationValue NVARCHAR(MAX) NOT NULL,
    Context NVARCHAR(500) NULL,                -- Help text for translators
    IsActive BIT NOT NULL DEFAULT 1,
    
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,
    
    CONSTRAINT PK_TranslationString PRIMARY KEY CLUSTERED (TranslationStringID),
    CONSTRAINT FK_TranslationString_Language FOREIGN KEY (LanguageID) 
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_TranslationString UNIQUE (TranslationKey, LanguageID)
);

CREATE NONCLUSTERED INDEX IX_TranslationString_Key 
    ON dbo.TranslationString(TranslationKey, LanguageID) 
    WHERE IsActive = 1;
```

#### ContentTranslationGroup (for content localization)
```sql
CREATE TABLE dbo.ContentTranslationGroup (
    ContentTranslationGroupID INT IDENTITY(1,1) NOT NULL,
    MasterContentItemID BIGINT NOT NULL,        -- Original content
    TranslationContentItemID BIGINT NOT NULL,    -- Translated version
    LanguageID INT NOT NULL,
    TranslationQuality NVARCHAR(20) NULL,        -- Professional, Machine, Community
    ReviewStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    ReviewedBy BIGINT NULL,
    ReviewedDate DATETIME2(7) NULL,
    
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    
    CONSTRAINT PK_ContentTranslationGroup PRIMARY KEY CLUSTERED (ContentTranslationGroupID),
    CONSTRAINT FK_ContentTranslation_Master FOREIGN KEY (MasterContentItemID) 
        REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ContentTranslation_Translation FOREIGN KEY (TranslationContentItemID) 
        REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ContentTranslation_Language FOREIGN KEY (LanguageID) 
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_ContentTranslation UNIQUE (MasterContentItemID, LanguageID)
);
```

### 2.2 Updated Tables

#### User Table - Add Locale Preference
```sql
ALTER TABLE dbo.[User]
ADD PreferredLocale NVARCHAR(10) NULL;  -- e.g., 'en-US', 'zh-TW'

-- Update existing users based on their market and language
UPDATE u
SET PreferredLocale = CASE 
    WHEN m.MarketCode = 'US' AND l.LanguageCode = 'en-US' THEN 'en-US'
    WHEN m.MarketCode = 'TW' AND l.LanguageCode = 'zh-TW' THEN 'zh-TW'
    -- ... other mappings
    ELSE 'en-US'
END
FROM dbo.[User] u
JOIN dbo.Market m ON u.MarketID = m.MarketID
JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID;
```

#### Language Table - Add Additional Fields
```sql
ALTER TABLE dbo.Language
ADD 
    LocaleCode NVARCHAR(10) NULL,              -- BCP 47 code
    FallbackLanguageID INT NULL,               -- For translation fallback
    Direction NVARCHAR(3) NOT NULL DEFAULT 'LTR',  -- LTR or RTL
    PluralRules NVARCHAR(50) NULL;             -- Cldr plural rules

-- Add fallback constraint
ALTER TABLE dbo.Language
ADD CONSTRAINT FK_Language_Fallback 
    FOREIGN KEY (FallbackLanguageID) REFERENCES dbo.Language(LanguageID);

CREATE NONCLUSTERED INDEX IX_Language_Locale 
    ON dbo.Language(LocaleCode) WHERE IsActive = 1;
```

### 2.3 Seed Data Updates

See `database/13_Seed_Localization_Data.sql` for complete seed data including:
- Updated Language table with locale codes
- New language entries for all market variants
- MarketLanguage junction table population
- Default locale assignments

---

## 3. Backend Implementation

### 3.1 New Services

#### LocaleService (`backend/src/services/locale.service.ts`)

Key methods:
- `getMarketLocales(marketCode)` - Get available locales for a market
- `validateMarketLocale(marketCode, locale)` - Validate locale for market
- `getDefaultLocale(marketCode)` - Get default locale for market
- `mapServiceCodeToLocale(countryCode, languageCode)` - Map service codes to BCP 47

### 3.2 Updated Services

#### AuthService Updates
- Add locale parameter to login method
- Map service codes (ENG, CHI, etc.) to BCP 47 locale codes
- Include locale in JWT payload
- Return locale in user object
- Auto-update user's PreferredLocale if not set

### 3.3 New API Endpoints

#### LocaleController (`backend/src/controllers/locale.controller.ts`)

**Endpoints**:
- `GET /api/v1/locales/markets/:marketCode` - Get available locales for market
- `PUT /api/v1/users/locale` - Update user's preferred locale

### 3.4 Middleware Updates

#### Auth Middleware
- Include locale from JWT in request context
- Fallback to user's PreferredLocale if JWT doesn't have locale

---

## 4. Frontend Implementation

### 4.1 Install Dependencies

```bash
cd frontend
npm install next-intl
```

### 4.2 Project Structure Changes

```
frontend/
  src/
    i18n/
      request.ts              # next-intl configuration
      routing.ts              # Locale routing config
    middleware.ts             # Next.js middleware for locale detection
    messages/                 # Translation files
      en-US.json
      zh-TW.json
      zh-HK.json
      zh-Hans.json
      id-ID.json
      ms-MY.json
      en-CA.json
      en-GB.json
      en-AU.json
    app/
      [locale]/               # Locale-based routing
        layout.tsx            # Root layout with IntlProvider
        (auth)/
          login/
        (dashboard)/
          layout.tsx
          dashboard/
          content/
          contacts/
          ...
    components/
      LocaleSwitcher.tsx      # Language/country selector
    lib/
      locales.ts              # Locale constants and mappings
    types/
      locale.types.ts         # Locale-related types
```

### 4.3 Core i18n Configuration

#### Supported Locales
- en-US, en-CA, en-GB, en-AU (English variants)
- zh-TW, zh-HK, zh-Hans (Chinese variants)
- id-ID (Indonesian)
- ms-MY (Malay)

#### Key Components
1. **i18n/request.ts** - next-intl configuration
2. **i18n/routing.ts** - Locale routing with shared pathnames
3. **middleware.ts** - Automatic locale detection and redirect
4. **[locale]/layout.tsx** - Root layout with NextIntlClientProvider
5. **LocaleSwitcher.tsx** - UI component for language selection

### 4.4 Translation File Structure

#### Base Translation File (`messages/en-US.json`)
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "locale": {
      "selectLanguage": "Select Language",
      "changed": "Language changed successfully"
    }
  },
  "navigation": {
    "dashboard": "Dashboard",
    "contentLibrary": "Content Library",
    "contacts": "Contacts",
    "followUps": "Follow-ups",
    "activity": "Activity",
    "settings": "Settings"
  },
  "dashboard": {
    "welcome": "Welcome back, {name}",
    "stats": {
      "totalShares": "Total Shares",
      "activeContacts": "Active Contacts"
    }
  }
}
```

#### Localized Versions
- **zh-TW.json** - Traditional Chinese (Taiwan)
- **zh-HK.json** - Traditional Chinese (Hong Kong) - inherits zh-TW with overrides
- **zh-Hans.json** - Simplified Chinese
- **id-ID.json** - Indonesian
- **ms-MY.json** - Malay
- **en-CA.json** - Canadian English - inherits en-US with overrides (e.g., "colour" vs "color")

### 4.5 Component Usage Pattern

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';  // Use localized Link

export default function MyComponent() {
  const t = useTranslations('dashboard');
  
  return (
    <div>
      <h1>{t('welcome', { name: 'John' })}</h1>
      <Link href="/content">{t('navigation.contentLibrary')}</Link>
    </div>
  );
}
```

### 4.6 Auth Store Updates

Add locale to User interface:
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  locale: string;        // NEW
  market: string;        // NEW
  timezone?: string;
  dateFormat?: string;
  createdAt: string;
}
```

Add locale update method:
```typescript
updateUserLocale: (locale: string) => void;
```

---

## 5. String Extraction & Migration Strategy

### 5.1 Automated Extraction Tool

Script to identify hardcoded strings: `frontend/scripts/extract-i18n.js`

Uses Babel parser to find:
- JSX text nodes
- String literals that look like UI text
- Template literals with user-facing content

Outputs: `extracted-strings.json` with all found strings

### 5.2 Migration Phases

**Phase 1: High-Priority Pages (Week 1-2)**
- Login/Auth flows
- Main dashboard
- Content library
- Top navigation/sidebar

**Phase 2: Core Features (Week 3-4)**
- Contact management
- Follow-ups
- Settings pages
- Share workflows

**Phase 3: Admin Features (Week 5-6)**
- Admin dashboard
- User management
- Content management
- Template management

**Phase 4: Secondary Features (Week 7-8)**
- Analytics
- Activity feed
- Notifications
- Error messages

### 5.3 Translation Workflow

1. **Developer**: Mark strings with translation keys
2. **Extraction**: Run extraction script weekly to find missed strings
3. **Translation**: Professional translation service for priority languages
4. **Review**: QA testing in each locale
5. **Iteration**: Continuous refinement based on user feedback

---

## 6. Content Localization Strategy

### 6.1 ContentItem Localization

Content items already have language associations via `ContentItemLanguage` table. Enhanced to support:

1. **Translation Groups**: Group related content items as translations of each other
2. **Locale-Specific Media**: Different thumbnails/videos for different locales
3. **Fallback Content**: Show English version if locale version unavailable

### 6.2 Content Service Updates

Updated `getContentList()` to:
- Accept locale parameter
- Query for localized content via ContentTranslationGroup
- Fallback to English if translation not available
- Return LocalizedTitle and LocalizedDescription fields

### 6.3 Admin UI for Content Translation

- Link master content to translated versions
- Track translation quality (Professional, Machine, Community)
- Review workflow for translation approval
- Bulk operations for content translation

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Translation Completeness Tests**:
- Verify all locales have same translation keys as en-US
- Check for placeholder text (TODO, FIXME)
- Validate translation format strings match

### 7.2 E2E Tests

**Locale Switching Tests**:
- Switch between locales and verify UI updates
- Test locale persistence across sessions
- Verify only valid locales shown for user's market
- Test URL structure with locale prefix

**Content Localization Tests**:
- Verify localized content displays correctly
- Test fallback to English when translation missing
- Verify locale-specific media loads

### 7.3 Visual Regression Tests

Test UI in different locales to catch:
- Text overflow in buttons
- Truncated labels
- Broken line breaks
- Layout issues with longer/shorter text

---

## 8. Performance Optimization

### 8.1 Bundle Size Optimization

**Strategy**: Only load translations for active locale

**Result**: ~15KB per locale instead of ~100KB for all locales

### 8.2 Caching Strategy

1. **Static translations**: Cache indefinitely (versioned by build)
2. **Dynamic content translations**: Cache with TTL of 1 hour
3. **User locale preference**: Store in JWT and Zustand (localStorage)

### 8.3 Lazy Loading

For large translation files, split by feature:
- Load dashboard translations initially
- Load feature-specific translations on navigation

---

## 9. Migration & Rollout Plan

### Phase 1: Foundation (Weeks 1-2)

**Database**:
- Create MarketLanguage table
- Update Language table with locale codes
- Seed language and market-language data
- Add PreferredLocale to User table

**Backend**:
- Implement LocaleService
- Update AuthService to handle locale
- Create locale endpoints
- Update auth middleware

**Frontend**:
- Install next-intl
- Configure i18n routing
- Create [locale] directory structure
- Implement LocaleSwitcher component

### Phase 2: Core Translation (Weeks 3-5)

**High-Priority Pages**:
- Login/Auth (Week 3)
- Dashboard (Week 3)
- Content Library (Week 4)
- Navigation/Sidebar (Week 4)
- Settings (Week 5)

**Translations**:
- English (en-US) - baseline
- Chinese Traditional (zh-TW) - professional translation
- Indonesian (id-ID) - professional translation

### Phase 3: Feature Completion (Weeks 6-8)

**Remaining Pages**:
- Contacts (Week 6)
- Follow-ups (Week 6)
- Admin pages (Week 7)
- Analytics (Week 7)
- Activity feed (Week 8)

**Additional Locales**:
- Chinese Simplified (zh-Hans)
- Chinese Hong Kong (zh-HK)
- Malay (ms-MY)
- All English variants (en-CA, en-GB, en-AU)

### Phase 4: Content Localization (Weeks 9-10)

**Content Translation System**:
- Create ContentTranslationGroup table
- Build admin UI for content translation
- Implement content fallback logic
- Train content managers

### Phase 5: Testing & Refinement (Weeks 11-12)

**Testing**:
- E2E tests for all locales
- Visual regression testing
- Translation quality review
- User acceptance testing

**Optimization**:
- Performance audit
- Bundle size optimization
- Caching implementation

### Phase 6: Production Rollout (Week 13)

**Pre-launch**:
- Backup database
- Run database migrations
- Deploy backend changes
- Deploy frontend changes
- Smoke tests in production

**Rollout Strategy**:
1. **Soft launch**: Enable for internal users only (Week 13, Day 1-2)
2. **Beta test**: Enable for 10% of users per market (Week 13, Day 3-4)
3. **Full rollout**: Enable for all users (Week 13, Day 5)

**Monitoring**:
- Error rates by locale
- Locale switcher usage
- Missing translation errors
- Performance metrics

---

## 10. Risk Assessment & Mitigation

### Risk 1: Incomplete Translations

**Impact**: High - Poor user experience  
**Probability**: Medium

**Mitigation**:
- Implement fallback chain (zh-HK → en-US)
- Show language code in dev mode for missing translations
- Automated testing for translation completeness
- Professional translation service for priority languages

### Risk 2: URL Breaking Changes

**Impact**: High - Bookmarks/shared links break  
**Probability**: High

**Mitigation**:
- Implement redirects from old URLs to locale-prefixed URLs
- Detect user's preferred locale and redirect
- Clear communication to users about URL changes
- Gradual rollout with backward compatibility period

### Risk 3: Performance Degradation

**Impact**: Medium - Slower page loads  
**Probability**: Low

**Mitigation**:
- Lazy load translations by feature
- Use next-intl's static optimization
- Cache translations aggressively
- Monitor bundle size and performance metrics

### Risk 4: Translation Quality Issues

**Impact**: Medium - Confusing or incorrect translations  
**Probability**: Medium

**Mitigation**:
- Professional translation service for initial translations
- Native speaker review before launch
- Feedback mechanism for users to report issues
- Iterative improvement process

### Risk 5: Database Migration Failures

**Impact**: High - Data loss or corruption  
**Probability**: Low

**Mitigation**:
- Test migrations on staging database
- Backup production database before migration
- Rollback plan prepared
- Monitor database health during migration

---

## 11. Success Metrics

### User Engagement
- Locale switcher usage rate
- User retention by locale
- Feature adoption rate per locale

### Technical Metrics
- Translation coverage: >95% for priority locales
- Page load time: <200ms increase
- Bundle size: <20KB per locale
- Error rate: <0.1% locale-related errors

### Content Metrics
- Content availability by locale
- Translation completion rate
- Content engagement by locale

---

## 12. Future Enhancements (Post-Launch)

1. **RTL Support**: Add Arabic/Hebrew markets
2. **Dynamic Translation Management**: Admin UI for editing translations
3. **Machine Translation**: Auto-translate with human review
4. **Locale-Specific Features**: Regional compliance rules
5. **Currency Localization**: Display prices in local currency
6. **Date/Time Localization**: Enhanced format per locale preferences

---

## 13. Critical Files for Implementation

### Database
- `database/12_Schema_Localization.sql` - New tables and schema updates
- `database/13_Seed_Localization_Data.sql` - Seed data for locales

### Backend
- `backend/src/services/locale.service.ts` - Locale business logic
- `backend/src/controllers/locale.controller.ts` - Locale API endpoints
- `backend/src/services/auth.service.ts` - Updated with locale handling
- `backend/src/controllers/auth.controller.ts` - Updated auth responses
- `backend/src/middleware/auth.middleware.ts` - Include locale in context
- `backend/src/types/locale.types.ts` - Locale-related types

### Frontend
- `frontend/src/i18n/request.ts` - next-intl configuration
- `frontend/src/i18n/routing.ts` - Locale routing config
- `frontend/src/middleware.ts` - Locale detection middleware
- `frontend/src/app/[locale]/layout.tsx` - Root layout with provider
- `frontend/src/components/LocaleSwitcher.tsx` - Language selector UI
- `frontend/src/lib/locales.ts` - Locale constants
- `frontend/src/store/authStore.ts` - Add locale to User interface
- `frontend/messages/*.json` - Translation files for all locales

### Scripts
- `frontend/scripts/extract-i18n.js` - String extraction tool

---

**Document Version**: 1.0  
**Last Updated**: April 8, 2026  
**Status**: Ready for implementation approval
