# Frontend Directory Structure - i18n Restructure

## Before i18n Implementation

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       ├── page.tsx
│   │   │       └── LoginForm.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   └── page.tsx
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── layout.tsx                 ← Root layout (all providers)
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   ├── lib/
│   └── store/
└── package.json

URL Examples:
  /login
  /dashboard
  /content
```

## After i18n Implementation

```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/                  ← NEW: Dynamic locale segment
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       ├── page.tsx
│   │   │   │       └── LoginForm.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── content/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── contacts/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── ...
│   │   │   ├── layout.tsx             ← Locale layout (NextIntlProvider)
│   │   │   ├── page.tsx
│   │   │   └── ...
│   │   ├── layout.tsx                 ← Root layout (minimal wrapper)
│   │   └── globals.css
│   ├── i18n/                          ← NEW: i18n configuration
│   │   ├── request.ts
│   │   └── routing.ts
│   ├── middleware.ts                  ← NEW: Locale detection
│   ├── components/
│   │   └── LocaleSwitcher.tsx         ← NEW: Language selector
│   ├── lib/
│   │   ├── api/
│   │   │   └── users.ts               ← NEW: User/locale API
│   │   └── locales.ts                 ← NEW: Locale constants
│   └── store/
│       └── authStore.ts               ← Updated: locale field
├── messages/                          ← NEW: Translation files
│   ├── en-US.json
│   ├── en-CA.json
│   ├── en-GB.json
│   ├── en-AU.json
│   ├── zh-TW.json
│   ├── zh-HK.json
│   ├── zh-Hans.json
│   ├── id-ID.json
│   └── ms-MY.json
└── package.json                       ← Updated: next-intl added

URL Examples:
  /en-US/login
  /zh-TW/dashboard
  /id-ID/content
```

## Key Changes

### 1. Route Structure

**Before**: Routes were directly under `/app`
```
/app/dashboard/page.tsx → /dashboard
```

**After**: Routes are under `/app/[locale]`
```
/app/[locale]/dashboard/page.tsx → /en-US/dashboard
```

### 2. Layout Hierarchy

**Before**:
```
Root Layout (app/layout.tsx)
  └─ Providers: Theme, Query, Auth
     └─ Page Content
```

**After**:
```
Root Layout (app/layout.tsx) - minimal wrapper
  └─ Locale Layout (app/[locale]/layout.tsx)
     └─ NextIntlClientProvider
        └─ Providers: Theme, Query, Auth
           └─ Page Content
```

### 3. New Files & Folders

| Path | Purpose |
|------|---------|
| `src/i18n/` | next-intl configuration |
| `src/middleware.ts` | Automatic locale detection & redirect |
| `messages/` | Translation JSON files (9 locales) |
| `src/lib/locales.ts` | Locale constants & helpers |
| `src/components/LocaleSwitcher.tsx` | Language selector UI |
| `src/lib/api/users.ts` | User/locale API endpoints |

### 4. Modified Files

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Simplified to minimal wrapper |
| `src/app/[locale]/layout.tsx` | New file with all providers + IntlProvider |
| `src/store/authStore.ts` | Added `locale` and `market` to User interface |
| `next.config.ts` | Added next-intl plugin |
| Test files | Updated mock users to include locale/market |

## Middleware Flow

```
User Request
    │
    ├─> Has locale in URL? (/en-US/dashboard)
    │   └─> YES: Continue to page
    │
    ├─> NO: Detect locale from:
    │   ├─> 1. JWT token (user preference)
    │   ├─> 2. Cookie (last selected)
    │   ├─> 3. Accept-Language header
    │   ├─> 4. Market default
    │   └─> 5. Global default (en-US)
    │
    └─> Redirect to /[locale]/original-path
```

## Translation Loading

```
User navigates to /zh-TW/dashboard
    │
    ├─> Middleware validates locale: ✓ zh-TW is valid
    │
    ├─> [locale] layout loads messages:
    │   └─> import(`messages/zh-TW.json`)
    │
    ├─> NextIntlClientProvider wraps app
    │   └─> Messages available to all components
    │
    └─> Components use translations:
        ├─> const t = useTranslations('dashboard');
        └─> <h1>{t('welcome', { name: user.name })}</h1>
```

## Navigation Helpers

### Before (Standard Next.js)

```tsx
import { Link } from 'next/link';
import { useRouter } from 'next/navigation';

<Link href="/dashboard">Dashboard</Link>
router.push('/content');
```

### After (next-intl aware)

```tsx
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';

<Link href="/dashboard">Dashboard</Link>  // Becomes /zh-TW/dashboard
router.push('/content');                   // Becomes /zh-TW/content
```

**IMPORTANT**: Always use `@/i18n/routing` for navigation, NOT `next/link` or `next/navigation`!

## File Moves Summary

All routes moved from `app/*` to `app/[locale]/*`:

- `app/(auth)/` → `app/[locale]/(auth)/`
- `app/(dashboard)/` → `app/[locale]/(dashboard)/`
- `app/page.tsx` → `app/[locale]/page.tsx`
- `app/maintenance/` → `app/[locale]/maintenance/`
- `app/s/` → `app/[locale]/s/` (tracking redirects)

**Total files moved**: ~50+ route files
**Breaking changes**: All URLs now require locale prefix

---

**Note**: The directory structure diagram shows the logical organization. Actual file structure verified via:
```bash
cd frontend/src/app/[locale]
find . -type d | head -30
```
