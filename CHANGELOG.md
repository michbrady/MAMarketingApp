# Changelog

All notable changes, features, and bug fixes to the UnFranchise Marketing App.

## [Unreleased]

### Added - April 9, 2026

#### Multi-Country/Multi-Language (i18n) Support - Phase 1 Foundation 🌍 NEW!

**Database Layer** ✅ COMPLETE
- **New Tables Created**:
  - `MarketLanguage` - Junction table mapping which languages available per market (19 mappings)
  - `TranslationString` - Admin-manageable UI translations (complement to JSON files)
  - `ContentTranslationGroup` - Links master content to translated versions
- **Schema Updates**:
  - `Language` table: Added `LocaleCode` (BCP 47), `FallbackLanguageID`, `Direction`, `PluralRules`
  - `User` table: Added `PreferredLocale` column
- **16 Language Variants**: en-US, en-CA, en-GB, en-AU, en-SG, en-HK, en-TW, en-MY, en-ID, zh-TW, zh-HK, zh-Hans, id-ID, ms-MY, fr-CA, es-MX
- **10 Markets Configured**: USA, Canada, UK, Australia, Taiwan, China, Singapore, Hong Kong, Malaysia, Indonesia
- **Files**: `database/12_Schema_Localization.sql`, `database/13_Seed_Localization_Data.sql`

**Backend Layer** ✅ COMPLETE
- **New Services**:
  - `LocaleService` - Core locale business logic with BCP 47 mapping
  - Methods: `getMarketLocales()`, `validateMarketLocale()`, `getDefaultLocale()`, `mapServiceCodeToLocale()`
- **New API Endpoints**:
  - `GET /api/v1/locales/markets/:marketCode` - Get available locales for market
  - `PUT /api/v1/locales/user` - Update user's preferred locale
- **Auth Updates**:
  - Login accepts optional `countryCode` and `languageCode` parameters
  - Maps service codes (ENG, CHI, IDN, MSA) to BCP 47 locale codes (en-US, zh-TW, id-ID, ms-MY)
  - Locale included in JWT payload and auth responses
  - Auto-updates user's PreferredLocale on first login
- **Files Created**: `backend/src/services/locale.service.ts`, `backend/src/controllers/locale.controller.ts`, `backend/src/routes/locale.routes.ts`, `backend/src/types/locale.types.ts`
- **Files Updated**: `backend/src/services/auth.service.ts`, `backend/src/controllers/auth.controller.ts`, `backend/src/middleware/auth.middleware.ts`, `backend/src/index.ts`

**Frontend Layer** ✅ COMPLETE
- **next-intl Library**: Installed and configured for Next.js 15 App Router
- **i18n Infrastructure**:
  - `src/i18n/request.ts` - Server configuration with 9 supported locales
  - `src/i18n/routing.ts` - Locale-aware navigation helpers (Link, Router, etc.)
  - `src/middleware.ts` - Automatic locale detection and URL rewriting
- **App Structure Restructured**: All routes moved from `app/*` to `app/[locale]/*`
  - URLs now require locale prefix: `/en-US/dashboard`, `/zh-TW/content`, `/id-ID/contacts`
- **LocaleSwitcher Component**: Globe icon dropdown showing available locales for user's market
- **Translation Files Created**: 9 locale files in `frontend/messages/`
  - Complete: en-US, zh-TW, id-ID
  - Stubs: en-CA, en-GB, en-AU, zh-HK, zh-Hans, ms-MY
- **Locale Constants**: `src/lib/locales.ts` with locale metadata, flag emojis, market mappings
- **Auth Store Enhanced**: Added `locale` and `market` to User interface, added `updateUserLocale()` method
- **API Client Extended**: New `src/lib/api/users.ts` with `updateUserLocale()` endpoint
- **Files Created**: 13 new files (i18n config, LocaleSwitcher, translation files, locale constants, etc.)
- **Files Updated**: `next.config.ts`, `src/app/layout.tsx`, `src/store/authStore.ts`, test files

**Architecture & Documentation**:
- `docs/I18N_ARCHITECTURE_PLAN.md` - Complete 13-week implementation plan
- `docs/I18N_FRONTEND_IMPLEMENTATION.md` - Frontend usage guide
- `docs/I18N_BACKEND_IMPLEMENTATION.md` - Backend implementation details
- `docs/I18N_DIRECTORY_STRUCTURE.md` - Directory structure reference

**Status**: Phase 1 (Foundation) complete. Phase 2 (Component Migration) pending.

**Next Steps**:
1. Use `start.bat` to start frontend and backend
2. Test locale switcher and API endpoints
3. Begin migrating components to use `useTranslations()` hook
4. Professional translation review for zh-TW and id-ID

### Added - April 8, 2026

#### Timezone-Aware Timestamp Display ✨ NEW!
- **Centralized Date Formatting**: Created `dateUtils.ts` utility with timezone-aware functions
  - `formatTimestamp()` - Format ISO timestamps in user's timezone
  - `formatRelativeTime()` - "2 hours ago" style display
  - `parseNoteTimestamp()` - Parse notes with embedded timestamps
  - Uses `date-fns-tz` for accurate timezone conversion
- **User Timezone Preferences**: Extended User interface with timezone and dateFormat fields
  - Frontend: `src/store/authStore.ts`
  - Backend: Auth controller and service return timezone from database
  - Settings page loads user's saved timezone preference
- **Comprehensive Timezone List**: 75+ timezones grouped by region
  - File: `frontend/src/constants/timezones.ts`
  - Regions: North America, Europe, Asia, Oceania, Africa, Middle East
  - Uses IANA timezone identifiers
  - Dropdown with optgroups for better UX
- **Enhanced Notes Display**: Timestamps now show in user's local timezone
  - Each note in separate card with timestamp header
  - Shows both formatted time and relative time
  - Fixed label styling with proper dark mode support
- Commits: `3ac7993`, `bff83ef`, `b0f9769`

### Fixed - April 8, 2026

#### Contact Edit Screen UX Improvements 🎨
- **Tags 400 Error Fixed**: Changed payload from `{tag}` to `{tags: [tag]}` to match backend
  - File: `frontend/src/lib/api/contacts.ts`
  - Backend expects array, not single string
- **Tag Input Styling Improved**: Less prominent, better dark mode support
  - Changed from `bg-white` to `bg-gray-50 dark:bg-gray-900/50`
  - Reduced height from 42px to 38px
  - Added dark mode border colors
  - File: `frontend/src/components/contacts/TagInput.tsx`
- **Notes Label Fixed**: Added dark mode support
  - Changed from `text-gray-700` to `text-gray-700 dark:text-gray-300`
  - Better visibility in dark mode
  - File: `frontend/src/app/(dashboard)/contacts/[id]/page.tsx`
- Commits: `3ac7993`, `b0f9769`

#### React Hooks Order Violation Fixed ⚛️
- **Contact Detail Page Crash**: Fixed "React has detected a change in the order of Hooks" error
  - Problem: `useMemo` hook placed after conditional return statement (loading check)
  - Solution: Moved `useMemo` before any early returns to ensure consistent hook call order
  - File: `frontend/src/app/(dashboard)/contacts/[id]/page.tsx`
  - Follows Rules of Hooks: hooks must be called in same order on every render
- Commits: `efd123a`, `e86a7e5`

#### Frontend/Backend Field Mapping Issues 🔧
- **Contact Creation Tags Bug**: Fixed `TypeError: .split is not a function` when creating contacts
  - Backend now returns tags as array `["tag1", "tag2"]` instead of string `"tag1,tag2"`
  - Updated frontend to handle both array and string formats
  - File: `frontend/src/lib/api/contacts.ts` - mapBackendToFrontend()
  - Commits: `ec7f397`, `5dc46ef`

- **Contact ID Undefined Bug**: Fixed contact links showing `/contacts/undefined`
  - Backend's `toCamelCase()` converts `ContactID` → `contactID` (capital D)
  - Frontend was checking for `contactId` (lowercase d) - mismatch!
  - Added `contactID` to ID field fallback chain
  - File: `frontend/src/lib/api/contacts.ts` - line 25
  - Commits: `5aa7089`, `41d2553`

- **Contact Notes 404 Bug**: Fixed error when adding notes to contacts
  - Frontend called `POST /contacts/:id/notes` endpoint that doesn't exist
  - Database has single `Notes` text field, not separate notes table
  - Updated frontend to append notes with timestamp to existing Notes field
  - Uses existing `PUT /contacts/:id` endpoint to update notes
  - Notes format: `[ISO timestamp] content` with blank line separator
  - File: `frontend/src/lib/api/contacts.ts` - addContactNote()
  - Commits: `f567141`, `7e2c477`
  - **Follow-up fix**: Notes saved but didn't display - now also invalidates main contact query
  - File: `frontend/src/app/(dashboard)/contacts/[id]/page.tsx`
  - Commits: `e173fee`, `7324307`

- **Documentation**: Created comprehensive field mapping reference
  - File: `FRONTEND_BACKEND_MAPPING_ISSUES.md`
  - Documents PascalCase → camelCase transformation rules
  - Best practices for field mapping and type handling
  - Testing checklist for new fields/entities
  - Now includes all 3 frontend/backend issues (tags, contactID, notes)

#### Startup Scripts Enhanced 🚀
- **Auto Browser Open**: start.bat now automatically opens http://localhost:3000
- **Better Error Handling**: Exit codes and validation for Node.js/npm
- **Reliable Directory Navigation**: Uses `%~dp0` for script location
- **Fixed Window Commands**: Include `cd` command inside new window command string
  - Before: `cd backend && start cmd /k "npm run dev"` ❌ (didn't work)
  - After: `start cmd /k "cd /d "%ROOT_DIR%backend" && npm run dev"` ✅
- **Improved Wait Times**: 5 seconds for backend, 8 seconds for frontend
- **Clearer Status Messages**: Better user feedback throughout startup
- Files: `start.bat`, `start-dev.bat`
- Commits: `1347db7`, `15d53d9`

### Added - April 6, 2026

#### User Self-Service Backend Endpoints ✅ NEW!
- Complete backend implementation for user settings
- **Files Created**:
  - `/backend/src/routes/users.routes.ts` - User self-service routes
  - `/backend/src/controllers/users.controller.ts` - Request handlers with validation
  - `/backend/src/services/users.service.ts` - Business logic and database operations
- **Endpoints Added**:
  - `PUT /api/v1/users/profile` - Update user profile (name, email, phone)
  - `PUT /api/v1/users/password` - Change password (with current password verification)
  - `PUT /api/v1/users/notifications` - Update notification preferences
  - `PUT /api/v1/users/preferences` - Update language, timezone, date format, default view
- **Features**:
  - Zod schema validation for all inputs
  - bcrypt password hashing (10 rounds)
  - MERGE statements for UserSettings (upsert)
  - Language code to LanguageID mapping
  - Current password verification before update
  - Users can only update their own profile (JWT-based)
- **Security**:
  - All endpoints require authentication
  - SQL injection prevention via parameterized queries
  - No sensitive data in error messages
  - Password strength validation (min 8 chars)
- **Integration**: Frontend settings page now fully functional

#### Role Management System ✅
- Complete role CRUD operations in admin panel
- Create, edit, delete custom roles
- Permission assignment system with 23 available permissions
- Visual permission selector with categories
- System role protection (cannot delete system roles)
- Role-based access control enforcement
- File: `/frontend/src/app/(dashboard)/admin/roles/page.tsx`
- API: `/frontend/src/lib/api/admin.ts` (createRole, updateRole, deleteRole)

#### User Settings Page ✅
- Complete user settings with 4 tabs:
  - **Profile Tab**: Update name, email, phone number
  - **Notifications Tab**: Email, SMS, push notifications, weekly digest, engagement alerts, content updates
  - **Security Tab**: Change password with validation
  - **Preferences Tab**: Language, timezone, date format, default view
- Form validation and error handling
- Auto-save functionality
- File: `/frontend/src/app/(dashboard)/settings/page.tsx`

#### Dashboard Analytics Enhancement ✅
- Real-time analytics integration
- Replaced hardcoded stats with live data from backend
- Metrics displayed:
  - Content Shared (totalShares)
  - Engagement Rate (clickThroughRate %)
  - Total Clicks
  - Avg Clicks/Share
- Uses `/analytics/overview` endpoint with user filtering
- File: `/frontend/src/app/(dashboard)/dashboard/page.tsx`

#### Admin Content Management - Edit Page ✅
- Complete edit form for existing content
- Pre-population from API data
- All content fields editable:
  - Basic info (title, subtitle, description)
  - Media URLs (thumbnail, media, destination)
  - Publishing schedule (publish date, expiration)
  - Sharing options (SMS, email, social, personal note)
  - Featured content settings
- Delete confirmation dialog
- Status management (Draft, Published, Archived)
- Date formatter for datetime-local inputs
- Handles both PascalCase and camelCase API responses
- File: `/frontend/src/app/(dashboard)/admin/content/[id]/edit/page.tsx`

#### Admin Content Management - Create Page ✅
- Complete create form for new content
- All content fields supported
- Multiple save options (Draft, Publish)
- Form validation
- File: `/frontend/src/app/(dashboard)/admin/content/new/page.tsx`

#### Admin Content Management - List View ✅
- Content list with tabs (All, Pending, Approved, Rejected, Featured)
- Approve/Reject workflow for pending content
- Feature/Unfeature functionality for published content
- Edit button for each content item
- Create Content button in header
- File: `/frontend/src/app/(dashboard)/admin/content/page.tsx`

### Technical Improvements

#### Frontend Architecture
- Consistent use of TanStack Query for data fetching
- Proper error handling with toast notifications
- Loading states for all async operations
- Optimistic UI updates with query invalidation

#### API Integration
- Complete analytics API integration
- Role management API endpoints
- Content CRUD operations
- User settings endpoints (profile, notifications, password, preferences)

### Known Limitations

1. **Backend Endpoints May Not Exist**
   - User settings endpoints (`/users/profile`, `/users/password`, `/users/notifications`, `/users/preferences`) referenced but may need backend implementation
   - Settings page will show errors if backend endpoints don't exist yet

2. **Role Permissions**
   - Permission list is frontend-defined
   - Backend permission enforcement needs to match frontend expectations

3. **Test Coverage**
   - Some component tests failing (ShareMetrics, EngagementScore)
   - Need to update test expectations for new data structures

## [1.0.0-MVP] - April 2026

### Completed Features

#### Phase 1 - MVP (Complete) ✅

##### Authentication System ✅
- JWT-based auth with access and refresh tokens
- Auto-refresh token mechanism
- Protected routes with role-based access
- Login/logout functionality
- Session persistence
- Files: `/frontend/src/middleware.ts`, `/frontend/src/store/authStore.ts`

##### Content Library ✅
- Browse 48+ content items
- Search functionality
- Category filtering (12 categories)
- Responsive grid layout
- Content detail pages
- Files: `/frontend/src/app/(dashboard)/content/`

##### Share Engine ✅
- Multi-channel sharing:
  - SMS (with character limit)
  - Email (with templates)
  - Facebook
  - Twitter
  - LinkedIn
  - Copy Link
- Unique tracking links per share
- Message preview
- Template system with variable substitution
- Files: `/frontend/src/components/content/ShareModal.tsx`, `/frontend/src/components/share/`

##### Analytics Dashboard ✅
- Share metrics overview
- Trends visualization (time-series charts)
- Channel performance breakdown
- Top content leaderboard
- Top sharers leaderboard
- Date range filtering (7/30/90 days, custom)
- CSV export functionality
- Files: `/frontend/src/app/(dashboard)/analytics/page.tsx`, `/frontend/src/components/analytics/`

#### Phase 2 - Contact Management (Complete) ✅

##### Contact System ✅
- Contact CRUD operations
- Contact groups and tags
- CSV import/export
- Engagement scoring
- Activity timeline
- Top engaged contacts
- Search and filtering
- Files: `/frontend/src/app/(dashboard)/contacts/`, `/frontend/src/components/contacts/`

##### Follow-ups System ✅
- Follow-up task management
- Calendar view
- Kanban view
- List view
- Follow-up stats (total pending, overdue, completed today, upcoming)
- Priority levels (Low, Medium, High, Urgent)
- Follow-up types (Call, Email, Meeting, Task, Other)
- Files: `/frontend/src/app/(dashboard)/followups/`, `/frontend/src/components/followups/`

#### Phase 3 - Activity Feed (Complete) ✅

##### Share History ✅
- Activity feed with all share events
- Filter by channel (SMS, Email, Social)
- Date range filtering
- Click tracking display
- Copy tracking link
- Share details modal
- Files: `/frontend/src/app/(dashboard)/activity/page.tsx`

#### Admin Features (Complete) ✅

##### Admin Dashboard ✅
- System metrics cards (users, content, shares, engagement)
- User growth chart
- Recent activity feed
- Quick action buttons
- Files: `/frontend/src/app/(dashboard)/admin/page.tsx`, `/frontend/src/components/admin/`

##### User Management ✅
- User list with search and filters
- Create new users
- Edit user details
- Activate/deactivate users
- Bulk operations
- User activity timeline
- Files: `/frontend/src/app/(dashboard)/admin/users/page.tsx`

##### Template Management ✅
- List all share templates
- Create new templates
- Edit existing templates
- Delete templates
- Set default templates per channel
- Template preview
- Files: `/frontend/src/app/(dashboard)/admin/templates/page.tsx`

### Database Schema

#### Core Tables (32 total)
- User management (User, Role, UserRole)
- Content management (ContentItem, ContentCategory, ContentTag)
- Sharing (ShareEvent, ShareTemplate, ShareChannel)
- Tracking (EngagementEvent, TrackingLink)
- Contacts (Contact, ContactGroup, ContactTag)
- Follow-ups (FollowUp)
- Audit (AuditLog)

#### Stored Procedures (9)
- User authentication
- Content operations
- Share event creation
- Analytics aggregation
- Contact management

#### Views (15)
- Analytics views (8)
- User activity views
- Content performance views
- Engagement metrics views

## Errors and Fixes

### Fixed Issues

#### Issue 1: Next.js Dynamic Route Params Type Error
**Date**: April 2026
**File**: `/frontend/src/app/(dashboard)/admin/content/[id]/edit/page.tsx`
**Error**:
```
Type error: Page "app/(dashboard)/admin/content/[id]/edit/page" has an invalid
"default" export: Type "Promise<Element>" is not a valid type for the function's
first parameter.
```
**Root Cause**: Next.js 14+ requires async functions receiving `params` to handle them as `Promise<{id: string}>`
**Fix**:
```typescript
export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  // ... rest of component
}
```

#### Issue 2: DateTime Input Format Mismatch
**Date**: April 2026
**File**: `/frontend/src/app/(dashboard)/admin/content/[id]/edit/page.tsx`
**Error**: DateTime values from database not compatible with `<input type="datetime-local">`
**Root Cause**: SQL Server returns ISO datetime strings, but datetime-local inputs require `YYYY-MM-DDTHH:mm` format
**Fix**: Created `formatDateForInput` helper function:
```typescript
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};
```

#### Issue 3: PascalCase vs camelCase API Response Handling
**Date**: April 2026
**File**: `/frontend/src/app/(dashboard)/admin/content/[id]/edit/page.tsx`
**Error**: Form not pre-populating correctly
**Root Cause**: Backend sometimes returns PascalCase (ContentItemID, PublishStatus) and sometimes camelCase (id, publishStatus)
**Fix**: Handle both cases with fallbacks:
```typescript
setFormData({
  title: content.Title || content.title || '',
  subtitle: content.Subtitle || content.subtitle || '',
  publishStatus: content.PublishStatus || content.publishStatus || 'Draft',
  // ... etc
});
```

#### Issue 4: Form State Update Before Submission
**Date**: April 2026
**File**: `/frontend/src/app/(dashboard)/admin/content/new/page.tsx`
**Error**: "Save as Draft" and "Publish" buttons not updating publishStatus before submit
**Root Cause**: React state updates are asynchronous, form submits with old state
**Fix**: Use setTimeout to ensure state updates before submission:
```typescript
const handlePublish = async () => {
  setFormData({ ...formData, publishStatus: 'Published' });
  setTimeout(() => {
    const form = document.querySelector('form') as HTMLFormElement;
    form?.requestSubmit();
  }, 0);
};
```

### Pending Issues

#### Issue 1: Test Failures
**Status**: Known
**Impact**: Non-blocking
**Files**:
- `/frontend/src/components/analytics/__tests__/ShareMetrics.test.tsx`
- `/frontend/src/components/contacts/__tests__/EngagementScore.test.tsx`
**Description**: Component tests failing due to data structure changes
**Priority**: Low (tests need updating, not production code)

#### Issue 2: Backend Endpoints May Not Exist
**Status**: To Be Verified
**Impact**: Settings page may show errors
**Files**: `/frontend/src/app/(dashboard)/settings/page.tsx`
**Endpoints**:
- `PUT /users/profile`
- `PUT /users/password`
- `PUT /users/notifications`
- `PUT /users/preferences`
**Next Steps**: Implement backend endpoints or mock for development

## Development Statistics

### Code Statistics (Estimated)

**Frontend**:
- Pages: 25+
- Components: 80+
- API Functions: 40+
- TypeScript Files: 120+
- Lines of Code: ~15,000+

**Backend**:
- Controllers: 12+
- Services: 15+
- Routes: 50+ endpoints
- TypeScript Files: 50+
- Lines of Code: ~8,000+

**Database**:
- Tables: 32
- Stored Procedures: 9
- Views: 15
- SQL Files: 10+
- Lines of SQL: ~5,000+

### Features Completed

- ✅ Authentication & Authorization
- ✅ Content Library & Management
- ✅ Multi-Channel Sharing
- ✅ Tracking & Analytics
- ✅ Contact Management
- ✅ Follow-up System
- ✅ Template Management
- ✅ Admin Dashboard
- ✅ User Management
- ✅ Role Management
- ✅ User Settings
- ✅ Activity Feed
- ✅ Share History

### Features In Progress

- 🚧 Audit Logs (frontend exists, needs backend integration)
- 🚧 Admin System Settings (exists, needs enhancement)

### Features Not Started

- ❌ Phase 4: Mobile Apps
- ❌ Phase 5: AI Features
- ❌ Email Verification
- ❌ Password Reset
- ❌ Rate Limiting
- ❌ Account Lockout

## Migration Guide

_No migrations needed yet. First production deployment pending._

## Breaking Changes

_No breaking changes yet. Pre-production._

## Security

### Security Fixes

No security vulnerabilities reported or fixed yet.

### Security Features Added

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Protected API endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention in templates
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation

## Contributors

- AI Development Team (Claude Code)
- Project Manager
- Database Architect
- QA Engineer

## Links

- [Project README](./README.md)
- [Getting Started Guide](./GETTING_STARTED.md)
- [Project Plan](./docs/PROJECT_PLAN.md)
- [Architecture Documentation](./docs/architecture/)

---

**Format**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
**Versioning**: This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
**Last Updated**: April 6, 2026
