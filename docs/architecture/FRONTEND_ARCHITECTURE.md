# UnFranchise Marketing App - Frontend Architecture

## Executive Summary

This document defines the complete frontend architecture for the UnFranchise Marketing App, a web-based sales enablement and content sharing platform designed for UnFranchise Owners (UFOs). The architecture prioritizes mobile-first responsive design, API-first integration, and extensibility for future native mobile applications.

---

## 1. Technology Stack

### 1.1 Core Framework
**Next.js 14+ (React 18+)**
- **Rationale**:
  - Server-side rendering (SSR) for improved performance and SEO
  - App Router for modern routing patterns
  - Built-in API routes for BFF (Backend for Frontend) layer
  - Excellent TypeScript support
  - Image optimization out of the box
  - Easy deployment and scaling
  - Future-ready for Progressive Web App (PWA) conversion

### 1.2 Language
**TypeScript 5+**
- **Rationale**:
  - Strong typing reduces runtime errors
  - Better IDE support and autocomplete
  - Easier refactoring and maintenance
  - Self-documenting code through interfaces
  - Enterprise-grade code quality

### 1.3 State Management
**Zustand + TanStack Query (React Query)**

**Zustand** for global UI state:
- User authentication state
- UI preferences and settings
- Navigation state
- Notification state
- Lightweight and simple API
- No boilerplate compared to Redux
- DevTools support

**TanStack Query** for server state:
- Content library data
- Contacts management
- Engagement analytics
- Share history
- Built-in caching and invalidation
- Automatic background refetching
- Optimistic updates
- Request deduplication

### 1.4 Styling Approach
**Tailwind CSS + CSS Modules (hybrid)**

**Tailwind CSS** for:
- Rapid UI development
- Consistent design system
- Responsive utilities
- Component variants
- Dark mode support (future)

**CSS Modules** for:
- Complex animations
- Component-specific styles
- Legacy browser support if needed

**shadcn/ui** for base component library:
- Pre-built accessible components
- Customizable with Tailwind
- Copy-paste friendly (not NPM dependency)
- Production-ready components

### 1.5 Form Handling & Validation
**React Hook Form + Zod**

**React Hook Form**:
- Performant form state management
- Minimal re-renders
- Built-in validation
- Easy integration with UI libraries

**Zod**:
- TypeScript-first schema validation
- Runtime type safety
- Composable schemas
- Clear error messages
- Shared validation with backend

### 1.6 API Client Library
**Axios + TanStack Query**

**Axios**:
- Interceptor support for auth tokens
- Request/response transformation
- Automatic JSON handling
- Cancel token support
- Better error handling than fetch

**API Layer Structure**:
```typescript
// Centralized API client
// Type-safe endpoints
// Automatic retry logic
// Request/response logging
```

### 1.7 Testing Framework
**Vitest + React Testing Library + Playwright**

**Vitest**:
- Fast unit tests
- Compatible with Vite
- Jest-compatible API
- Built-in code coverage

**React Testing Library**:
- Component integration tests
- User-centric testing approach
- Accessible queries

**Playwright**:
- End-to-end testing
- Cross-browser support
- Mobile viewport testing
- Visual regression testing

### 1.8 Additional Libraries

| Purpose | Library | Rationale |
|---------|---------|-----------|
| Date handling | date-fns | Lightweight, tree-shakeable, immutable |
| Icons | Lucide React | Modern, customizable, lightweight |
| Animations | Framer Motion | Declarative animations, gestures |
| Charts/Analytics | Recharts | React-native charts, composable |
| Rich Text (admin) | Tiptap | Modern WYSIWYG, extensible |
| File uploads | react-dropzone | Drag & drop, validation |
| Notifications | react-hot-toast | Simple, customizable toasts |
| QR codes | qrcode.react | Share tracking links |
| Copy to clipboard | use-clipboard-hook | Share functionality |
| Analytics | PostHog or Mixpanel | User behavior tracking |

---

## 2. Application Structure

### 2.1 Project Folder Structure

```
unfranchise-app/
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.json (PWA)
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (ufo)/                    # UFO user layout group
│   │   │   ├── dashboard/
│   │   │   ├── content/
│   │   │   │   ├── page.tsx          # Content library
│   │   │   │   └── [id]/             # Content detail
│   │   │   ├── share/
│   │   │   │   └── [id]/             # Share flow
│   │   │   ├── contacts/
│   │   │   ├── engagement/
│   │   │   ├── activity/
│   │   │   ├── history/
│   │   │   └── settings/
│   │   ├── (admin)/                  # Admin layout group
│   │   │   ├── admin-dashboard/
│   │   │   ├── content-management/
│   │   │   ├── campaigns/
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   ├── compliance/
│   │   │   └── system-settings/
│   │   ├── api/                      # API routes (BFF layer)
│   │   │   ├── auth/
│   │   │   ├── content/
│   │   │   ├── share/
│   │   │   └── tracking/
│   │   ├── layout.tsx                # Root layout
│   │   ├── error.tsx                 # Error boundary
│   │   └── loading.tsx               # Loading UI
│   ├── components/
│   │   ├── ui/                       # Base UI components (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── content/                  # Content-specific components
│   │   │   ├── ContentCard.tsx
│   │   │   ├── ContentGrid.tsx
│   │   │   ├── ContentDetail.tsx
│   │   │   ├── ContentPreview.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── share/                    # Share flow components
│   │   │   ├── ShareModal.tsx
│   │   │   ├── ChannelSelector.tsx
│   │   │   ├── RecipientPicker.tsx
│   │   │   ├── MessageComposer.tsx
│   │   │   ├── SharePreview.tsx
│   │   │   └── TrackingLinkDisplay.tsx
│   │   ├── contacts/                 # Contact management components
│   │   │   ├── ContactList.tsx
│   │   │   ├── ContactCard.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── ContactImport.tsx
│   │   │   └── ContactTimeline.tsx
│   │   ├── engagement/               # Analytics components
│   │   │   ├── EngagementChart.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── PerformanceCard.tsx
│   │   │   └── HeatMap.tsx
│   │   ├── admin/                    # Admin components
│   │   │   ├── ContentEditor.tsx
│   │   │   ├── CampaignManager.tsx
│   │   │   ├── UserTable.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── shared/                   # Shared components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/                          # Utilities & helpers
│   │   ├── api/                      # API client
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── content.ts
│   │   │   │   ├── share.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   └── analytics.ts
│   │   │   └── interceptors.ts
│   │   ├── auth/                     # Auth utilities
│   │   │   ├── session.ts
│   │   │   ├── permissions.ts
│   │   │   └── middleware.ts
│   │   ├── utils/                    # General utilities
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   ├── tracking.ts
│   │   │   └── helpers.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       ├── channels.ts
│   │       └── config.ts
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useContent.ts
│   │   ├── useShare.ts
│   │   ├── useContacts.ts
│   │   ├── useEngagement.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   └── useIntersectionObserver.ts
│   ├── store/                        # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   ├── notificationStore.ts
│   │   └── shareStore.ts
│   ├── types/                        # TypeScript types
│   │   ├── api.ts
│   │   ├── content.ts
│   │   ├── user.ts
│   │   ├── contact.ts
│   │   ├── engagement.ts
│   │   └── index.ts
│   ├── schemas/                      # Zod validation schemas
│   │   ├── auth.ts
│   │   ├── content.ts
│   │   ├── contact.ts
│   │   └── share.ts
│   └── styles/
│       ├── globals.css
│       └── themes/
│           └── default.ts
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

### 2.2 Component Hierarchy

```
App Root
├── RootLayout
│   ├── AuthProvider
│   ├── QueryClientProvider
│   ├── ToastProvider
│   └── ThemeProvider
│
├── (auth) Layout
│   └── Login/ResetPassword pages
│
├── (ufo) Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   ├── NotificationBell
│   │   └── UserMenu
│   ├── Sidebar (desktop) / MobileNav
│   │   ├── Navigation Links
│   │   └── QuickActions
│   ├── Main Content Area
│   │   └── Page Components
│   └── Footer (optional)
│
└── (admin) Layout
    ├── AdminHeader
    ├── AdminSidebar
    └── Admin Pages
```

---

## 3. Routing Structure

### 3.1 Route Map

| Route | Layout | Access | Description |
|-------|--------|--------|-------------|
| `/login` | Auth | Public | User login |
| `/forgot-password` | Auth | Public | Password reset request |
| `/reset-password` | Auth | Public | Password reset form |
| `/dashboard` | UFO | UFO | UFO home dashboard |
| `/content` | UFO | UFO | Content library (browse/search) |
| `/content/[id]` | UFO | UFO | Content detail and preview |
| `/share/[contentId]` | UFO | UFO | Share flow for specific content |
| `/contacts` | UFO | UFO | Contact management |
| `/contacts/[id]` | UFO | UFO | Contact detail and timeline |
| `/engagement` | UFO | UFO | Engagement dashboard |
| `/activity` | UFO | UFO | Activity feed |
| `/history` | UFO | UFO | Share history |
| `/settings` | UFO | UFO | User profile and settings |
| `/admin-dashboard` | Admin | Admin | Admin overview |
| `/content-management` | Admin | Admin | Create/edit content |
| `/content-management/[id]` | Admin | Admin | Edit specific content |
| `/campaigns` | Admin | Admin | Campaign management |
| `/campaigns/[id]` | Admin | Admin | Campaign detail |
| `/users` | Admin | Admin | User management |
| `/analytics` | Admin | Admin | Analytics dashboard |
| `/compliance` | Admin | Admin | Compliance controls |
| `/system-settings` | Admin | Admin | System configuration |
| `/t/[trackingId]` | Public | Public | Tracking link redirect |

### 3.2 Navigation Guards

```typescript
// Middleware for route protection
// - Check authentication status
// - Verify role-based permissions
// - Redirect to login if needed
// - Redirect to unauthorized page if insufficient permissions
```

---

## 4. Key User Interfaces - Design Specifications

### 4.1 UFO User Screens

#### 4.1.1 Login/Authentication
**Purpose**: Secure user authentication

**Components**:
- Login form (email/phone + password)
- "Remember me" checkbox
- "Forgot password" link
- SSO button (future)
- MFA input (future)

**Layout**:
- Centered card on branded background
- Mobile: Full-screen form
- Logo and tagline at top

**Key Features**:
- Form validation with real-time feedback
- Loading state during authentication
- Error handling with clear messages
- Accessibility: ARIA labels, keyboard navigation

**States**:
- Default
- Loading
- Error (invalid credentials)
- Success (redirect to dashboard)

---

#### 4.1.2 Dashboard (Home)
**Purpose**: Overview of recent activity and quick actions

**Sections**:
1. **Welcome Header**
   - Personalized greeting
   - Quick stats (shares this week, engagement rate, hot leads)

2. **Quick Actions**
   - "Share Content" CTA
   - "View Hot Leads"
   - "Browse Content Library"

3. **Activity Summary**
   - Recent shares (last 5)
   - Recent engagement events (last 5)
   - Pending follow-ups

4. **Performance Snapshot**
   - Chart: Shares over time (last 30 days)
   - Top performing content (top 3)
   - Most engaged contacts (top 3)

5. **Notifications/Nudges**
   - Actionable notifications
   - Dismissible alerts

**Layout**:
- Desktop: 2-column grid (main + sidebar)
- Mobile: Stacked single column
- Cards for each section

**Interactions**:
- Click cards to drill down
- Hover states on interactive elements
- Pull-to-refresh on mobile

---

#### 4.1.3 Content Library (Browse, Search, Filter)
**Purpose**: Discover and find shareable content

**Components**:
1. **Search Bar**
   - Global search across title, description, tags
   - Auto-suggest/autocomplete
   - Recent searches

2. **Filter Panel** (collapsible on mobile)
   - Category
   - Content type (video, image, PDF, etc.)
   - Language
   - Campaign
   - Channel availability (SMS, Email, Social)
   - Sort by: Newest, Popular, Most Engaged

3. **Content Grid**
   - Card layout (3-4 columns desktop, 1-2 mobile)
   - Thumbnail
   - Title
   - Content type badge
   - Share count
   - Engagement indicator
   - Favorite/bookmark icon

4. **Featured Content Carousel**
   - Hero section at top
   - Auto-rotate or manual navigation

**Layout**:
- Desktop: Filter sidebar + grid
- Tablet: Collapsible filters + 2-column grid
- Mobile: Filter drawer + 1-column list

**States**:
- Loading (skeleton cards)
- Empty state (no results)
- Error state

**Interactions**:
- Click card → Content detail
- Click share icon → Quick share modal
- Click favorite → Add to favorites
- Infinite scroll or pagination

---

#### 4.1.4 Content Detail (Preview, Share Options)
**Purpose**: Preview content before sharing

**Sections**:
1. **Media Preview**
   - Video player (with controls)
   - Image viewer
   - PDF preview
   - Embedded landing page preview

2. **Content Information**
   - Title
   - Description
   - Category/tags
   - Created/updated date
   - Share count
   - Engagement stats

3. **Share Options**
   - Primary CTA: "Share Now" button
   - Secondary actions:
     - Add to favorites
     - Copy link
     - View share history for this content

4. **Related Content**
   - "You might also like" carousel

**Layout**:
- Desktop: Split view (preview left, info right)
- Mobile: Stacked (preview on top)

**Interactions**:
- Play video inline
- Zoom images
- Navigate related content
- Share button → Share flow modal

---

#### 4.1.5 Share Flow (SMS, Email, Social)
**Purpose**: Multi-step wizard for sharing content

**Steps**:

**Step 1: Select Channel**
- SMS button
- Email button
- Social button
- Visual icons for each

**Step 2: Select Recipients**
- **For SMS/Email**:
  - Contact picker (multi-select)
  - Search contacts
  - Recent contacts
  - Manual phone/email entry
  - Import from CSV (future)

- **For Social**:
  - Platform selector (Facebook, Instagram, WhatsApp, etc.)
  - Copy link option

**Step 3: Compose Message**
- **For SMS**:
  - Pre-filled approved message
  - Character count
  - Preview with tracking link

- **For Email**:
  - Subject line (pre-filled, editable within limits)
  - Email body (template with personalization fields)
  - Preview button

- **For Social**:
  - Caption (pre-filled, editable)
  - Image/video asset
  - Hashtags
  - Copy asset / Copy caption buttons

**Step 4: Preview & Confirm**
- Full preview of message
- Recipient list summary
- Edit buttons to go back
- "Send" CTA

**Step 5: Success**
- Confirmation message
- Share summary
- Tracking link displayed
- Options:
  - Share another
  - View in share history
  - Return to content library

**Layout**:
- Desktop: Modal with progress indicator
- Mobile: Full-screen flow with back button

**Components**:
- Step indicator (1/4, 2/4, etc.)
- Back/Next navigation
- Form validation
- Loading states

---

#### 4.1.6 Contacts Management
**Purpose**: Manage contact list and relationships

**Views**:

**List View**:
- Table/card layout
- Columns: Name, Email, Phone, Last Contact, Tags, Engagement Score
- Sort by each column
- Bulk actions (tag, delete)
- Search and filter

**Card View** (mobile-friendly):
- Contact card with avatar
- Key info displayed
- Quick actions (call, email, view timeline)

**Actions**:
- Add new contact (manual form)
- Import contacts (CSV)
- Edit contact
- Delete contact
- Merge duplicates
- Add tags
- Add notes

**Components**:
- Contact form modal
- Import wizard
- Contact card component
- Search/filter panel

---

#### 4.1.7 Engagement Dashboard
**Purpose**: Visualize engagement metrics

**Sections**:

1. **Key Metrics Cards**
   - Total Shares (period)
   - Click-Through Rate
   - Unique Views
   - Hot Leads (high engagement)

2. **Charts**
   - Shares over time (line chart)
   - Engagement by channel (bar chart)
   - Content performance (table with sparklines)
   - Top contacts by engagement (ranked list)

3. **Filters**
   - Date range picker
   - Channel filter
   - Campaign filter
   - Content type filter

4. **Export Options**
   - Download report (CSV/PDF)
   - Share dashboard link (future)

**Layout**:
- Desktop: Grid layout (2-3 columns)
- Mobile: Stacked cards

**Interactions**:
- Hover tooltips on charts
- Click chart elements to filter
- Drill down to detail views

---

#### 4.1.8 Activity Feed
**Purpose**: Real-time feed of engagement events and notifications

**Feed Items**:
- "John clicked your product share" (with timestamp, contact link)
- "Mary opened your email" (with content preview)
- "Chris viewed the video twice" (with engagement indicator)
- "New corporate content published" (with content preview)
- "3 contacts need follow-up" (with CTA)

**Components**:
- Feed item card
- Timestamp (relative: "2 hours ago")
- Action icon
- Contact avatar
- Quick action buttons (view, follow up, dismiss)

**Features**:
- Filter by type (all, engagement, content updates, nudges)
- Mark as read
- Infinite scroll
- Pull-to-refresh on mobile

**Layout**:
- Single column feed
- Chronological order
- Grouped by day

---

#### 4.1.9 Share History
**Purpose**: View past share activity

**Views**:

**List View**:
- Table with columns:
  - Content (thumbnail + title)
  - Recipients
  - Channel
  - Date/Time
  - Status (sent, clicked, viewed)
  - Engagement count
  - Actions (view details, reshare)

**Detail View**:
- Full share record
- Recipient engagement timeline
- Tracking link
- Re-share option

**Filters**:
- Date range
- Channel
- Content type
- Engagement status (no engagement, clicked, high engagement)

**Components**:
- Share history table
- Share detail modal
- Filter panel

---

#### 4.1.10 Profile/Settings
**Purpose**: User profile and preferences

**Sections**:

1. **Profile Information**
   - Avatar
   - Name
   - Email
   - Phone
   - Member ID
   - Market/Country
   - Language preference

2. **Account Settings**
   - Change password
   - Email preferences
   - Notification preferences (email, in-app, future: push)

3. **Preferences**
   - Default share channel
   - Default message templates
   - Quiet hours (future)

4. **Security**
   - Active sessions
   - Login history
   - Two-factor authentication (future)

**Layout**:
- Desktop: Sidebar navigation + content area
- Mobile: Tabbed interface

---

### 4.2 Admin Screens

#### 4.2.1 Admin Dashboard
**Purpose**: High-level overview of platform usage

**Sections**:
1. **Platform Metrics**
   - Total active users
   - Total content items
   - Total shares (period)
   - Total engagement events

2. **User Activity**
   - Most active UFOs
   - Inactive users (need attention)
   - New user signups

3. **Content Performance**
   - Top shared content
   - Top engaged content
   - Underperforming content

4. **Campaign Performance**
   - Active campaigns
   - Campaign engagement metrics

5. **System Health**
   - API uptime
   - Integration status
   - Error rate

**Layout**:
- Dashboard grid (3-4 columns)
- Charts and tables

---

#### 4.2.2 Content Management (Create/Edit/Publish)
**Purpose**: Manage content library

**List View**:
- Content table
- Columns: Thumbnail, Title, Type, Category, Status, Market, Publish Date, Actions
- Filters: Status, Type, Market, Campaign
- Bulk actions: Publish, Unpublish, Delete

**Create/Edit View**:
- **Form Sections**:
  1. Basic Info
     - Title
     - Subtitle
     - Description
     - Content type

  2. Media
     - Upload or link to media URL
     - Thumbnail upload
     - Asset library selector

  3. Targeting
     - Markets (multi-select)
     - Languages (multi-select)
     - Categories/Tags

  4. Share Settings
     - Available channels (SMS, Email, Social)
     - Approved share copy templates
     - CTA type and label
     - Allow personal note (yes/no)

  5. Compliance
     - Compliance flags
     - Required disclaimers
     - Expiration date

  6. Campaign
     - Assign to campaign

  7. Publishing
     - Status (Draft, Review, Approved, Published, Archived)
     - Publish date/time
     - Unpublish date/time

**Components**:
- Rich text editor (Tiptap)
- Media uploader
- Multi-select dropdowns
- Date/time pickers
- Preview panel

---

#### 4.2.3 Campaign Management
**Purpose**: Create and manage marketing campaigns

**List View**:
- Campaign cards/table
- Filters: Status, Date range, Market

**Create/Edit View**:
- Campaign name
- Description
- Start/end date
- Associated content (multi-select)
- Target markets
- Goals/KPIs
- Status

**Campaign Detail View**:
- Campaign overview
- Performance metrics
- Associated content performance
- User participation

---

#### 4.2.4 User Management
**Purpose**: Manage UFO users and permissions

**User Table**:
- Columns: Name, Email, Member ID, Role, Market, Status, Last Login, Actions
- Search and filter
- Bulk actions: Activate, Deactivate, Change Role

**User Detail/Edit**:
- User profile information
- Role assignment
- Market assignment
- Status (Active, Inactive, Suspended)
- Activity log
- Reset password

**Role Management**:
- Create/edit roles
- Permission assignment
- Role hierarchy

---

#### 4.2.5 Analytics/Reporting Dashboard
**Purpose**: Deep analytics and custom reports

**Pre-built Reports**:
- Content performance report
- User activity report
- Channel performance report
- Campaign effectiveness report
- Market comparison report
- Engagement funnel report

**Custom Report Builder**:
- Select dimensions (User, Content, Channel, Market, Date)
- Select metrics (Shares, Clicks, Views, CTR)
- Add filters
- Choose visualization (table, chart)
- Export options (CSV, PDF)

**Visualizations**:
- Line charts, bar charts, pie charts
- Heatmaps
- Tables with sorting
- Sparklines

---

#### 4.2.6 System Settings
**Purpose**: Platform configuration

**Sections**:
1. **General Settings**
   - Platform name
   - Logo/branding
   - Default language
   - Time zone

2. **Integration Settings**
   - API keys for external services
   - SMS provider config
   - Email provider config
   - Asset storage config

3. **Email Templates**
   - System email templates
   - Share email templates

4. **SMS Templates**
   - Share SMS templates

5. **Tracking Settings**
   - Short link domain
   - Analytics provider
   - Tracking pixel config

6. **Notification Settings**
   - Email notification rules
   - In-app notification rules

---

#### 4.2.7 Compliance Controls
**Purpose**: Manage compliance rules and content moderation

**Sections**:
1. **Market Rules**
   - Market-specific compliance requirements
   - Approved languages per market
   - Required disclaimers per market

2. **Content Approval Workflow**
   - Approval rules
   - Reviewer assignments

3. **Audit Log**
   - Content changes
   - User actions
   - System events

4. **Opt-out Management**
   - Opt-out requests
   - Do-not-contact list

---

## 5. Component Library

### 5.1 Base UI Components (from shadcn/ui)

| Component | Usage |
|-----------|-------|
| Button | Primary actions, secondary actions, icon buttons |
| Input | Text input, number input, search |
| Textarea | Multi-line text input |
| Select | Dropdown selection |
| Checkbox | Boolean options, multi-select |
| Radio Group | Single selection from list |
| Switch | Toggle on/off |
| Label | Form labels |
| Card | Container for grouped content |
| Dialog/Modal | Overlays, forms, confirmations |
| Dropdown Menu | Context menus, action menus |
| Popover | Tooltips, floating menus |
| Tooltip | Hover information |
| Tabs | Tabbed interfaces |
| Accordion | Collapsible sections |
| Alert | Notifications, warnings, errors |
| Badge | Status indicators, counts |
| Avatar | User profile images |
| Progress | Loading progress |
| Skeleton | Loading placeholders |
| Table | Data tables |
| Pagination | Page navigation |

### 5.2 Custom Composite Components

#### Layout Components
- **Header**: Logo, search, notifications, user menu
- **Sidebar**: Navigation links, quick actions
- **MobileNav**: Bottom navigation bar
- **Footer**: Links, copyright
- **Breadcrumbs**: Navigation trail
- **PageHeader**: Page title, actions, tabs

#### Content Components
- **ContentCard**: Content preview card
- **ContentGrid**: Grid of content cards
- **ContentDetail**: Full content view
- **ContentPreview**: Modal preview
- **CategoryFilter**: Multi-select category filter
- **SearchBar**: Search with autocomplete
- **FeaturedCarousel**: Featured content slider

#### Share Components
- **ShareModal**: Multi-step share wizard
- **ChannelSelector**: Choose share channel
- **RecipientPicker**: Select contacts
- **MessageComposer**: Compose share message
- **SharePreview**: Preview before sending
- **TrackingLinkDisplay**: Display and copy tracking link

#### Contact Components
- **ContactList**: List of contacts
- **ContactCard**: Contact preview card
- **ContactForm**: Add/edit contact
- **ContactImport**: CSV import wizard
- **ContactTimeline**: Engagement timeline

#### Engagement Components
- **EngagementChart**: Various chart types
- **ActivityFeed**: Feed of events
- **PerformanceCard**: Metric card with chart
- **HeatMap**: Engagement heatmap
- **MetricCard**: KPI display card

#### Admin Components
- **ContentEditor**: Rich content editor
- **CampaignManager**: Campaign CRUD
- **UserTable**: User management table
- **AnalyticsDashboard**: Analytics layout
- **RoleEditor**: Role and permission editor

#### Shared Components
- **EmptyState**: No data illustration
- **LoadingSpinner**: Loading indicator
- **ErrorMessage**: Error display
- **ConfirmDialog**: Confirmation modal
- **FileUploader**: Drag-and-drop file upload
- **DateRangePicker**: Select date range
- **MultiSelect**: Multi-select dropdown
- **TagInput**: Add/remove tags

### 5.3 Design System Guidelines

#### Color Palette
```typescript
// Tailwind config
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... Market Amrica brand colors
    500: '#3b82f6', // Primary brand
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: { ... },
  success: { ... },
  warning: { ... },
  danger: { ... },
  neutral: { ... },
}
```

#### Typography
- **Font Family**:
  - Sans: Inter or System UI
  - Mono: JetBrains Mono (for codes/links)

- **Font Sizes**:
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 30px
  - 4xl: 36px

- **Font Weights**:
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

#### Spacing
- Use Tailwind's default spacing scale (4px base unit)
- Consistent padding/margin across components

#### Border Radius
- sm: 4px (inputs, badges)
- md: 8px (cards, buttons)
- lg: 12px (modals)
- xl: 16px (large cards)
- full: 9999px (pills, avatars)

#### Shadows
- sm: Subtle shadow for inputs
- md: Card shadow
- lg: Modal shadow
- xl: Floating element shadow

#### Animations
- Transitions: 150-300ms ease-in-out
- Hover effects: subtle scale, color change
- Loading: skeleton shimmer, spinner
- Page transitions: fade, slide

### 5.4 Responsive Design Strategy

#### Breakpoints
```typescript
// Tailwind breakpoints
screens: {
  'sm': '640px',   // Mobile landscape, small tablets
  'md': '768px',   // Tablets
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
}
```

#### Mobile-First Approach
1. Design for mobile (320px+) first
2. Enhance for larger screens
3. Touch-friendly targets (min 44px)
4. Readable font sizes (min 16px base)
5. Accessible color contrast (WCAG AA)

#### Responsive Patterns
- **Navigation**: Bottom nav (mobile) → Sidebar (desktop)
- **Content Grid**: 1 column (mobile) → 2-3 columns (tablet) → 3-4 columns (desktop)
- **Forms**: Stacked (mobile) → 2-column (desktop)
- **Modals**: Full screen (mobile) → Centered (desktop)
- **Tables**: Horizontal scroll or card view (mobile) → Full table (desktop)

#### Touch Interactions
- Swipe gestures for carousels
- Pull-to-refresh on feed
- Long-press for context menu
- Tap to expand/collapse

---

## 6. State Management Design

### 6.1 Global State Structure (Zustand)

#### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

#### UI Store
```typescript
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

#### Notification Store
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}
```

#### Share Store (transient state)
```typescript
interface ShareState {
  selectedContent: ContentItem | null;
  selectedChannel: Channel | null;
  selectedRecipients: Contact[];
  message: string;
  trackingLink: string | null;
  setContent: (content: ContentItem) => void;
  setChannel: (channel: Channel) => void;
  addRecipient: (contact: Contact) => void;
  removeRecipient: (contactId: string) => void;
  setMessage: (message: string) => void;
  reset: () => void;
}
```

### 6.2 Server State (TanStack Query)

#### Query Keys Structure
```typescript
// Organized by domain
const queryKeys = {
  content: {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (filters: ContentFilters) => [...queryKeys.content.lists(), filters] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },
  // ... similar for share, engagement, analytics
};
```

#### Example Query Hooks
```typescript
// Custom hook for content list
export function useContentList(filters: ContentFilters) {
  return useQuery({
    queryKey: queryKeys.content.list(filters),
    queryFn: () => contentApi.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for content detail
export function useContentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => contentApi.getById(id),
    enabled: !!id,
  });
}

// Mutation for sharing content
export function useShareContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ShareRequest) => shareApi.create(data),
    onSuccess: () => {
      // Invalidate share history
      queryClient.invalidateQueries({ queryKey: queryKeys.share.all });
      // Invalidate engagement data
      queryClient.invalidateQueries({ queryKey: queryKeys.engagement.all });
    },
  });
}
```

### 6.3 API Integration Patterns

#### API Client Setup
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors, refresh token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Type-Safe API Endpoints
```typescript
// lib/api/endpoints/content.ts
import apiClient from '../client';
import type { ContentItem, ContentFilters, CreateContentRequest } from '@/types';

export const contentApi = {
  getList: async (filters: ContentFilters): Promise<ContentItem[]> => {
    const { data } = await apiClient.get('/content', { params: filters });
    return data;
  },

  getById: async (id: string): Promise<ContentItem> => {
    const { data } = await apiClient.get(`/content/${id}`);
    return data;
  },

  create: async (payload: CreateContentRequest): Promise<ContentItem> => {
    const { data } = await apiClient.post('/content', payload);
    return data;
  },

  update: async (id: string, payload: Partial<ContentItem>): Promise<ContentItem> => {
    const { data } = await apiClient.patch(`/content/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/content/${id}`);
  },
};
```

### 6.4 Caching Strategy

#### Cache Configuration by Data Type

| Data Type | Stale Time | Cache Time | Refetch Strategy |
|-----------|------------|------------|------------------|
| Content Library | 5 minutes | 10 minutes | On window focus |
| Content Detail | 10 minutes | 15 minutes | On window focus |
| Contacts | 2 minutes | 5 minutes | On window focus |
| Engagement Data | 1 minute | 3 minutes | Interval (30s) |
| Share History | 3 minutes | 10 minutes | On window focus |
| User Profile | 15 minutes | 30 minutes | Manual |
| Analytics | 5 minutes | 10 minutes | Manual |
| Admin Settings | 30 minutes | 1 hour | Manual |

#### Cache Invalidation Strategy
- **On mutation**: Invalidate related queries
- **On logout**: Clear all cache
- **On role change**: Invalidate user-specific queries
- **Manual refresh**: User-triggered refetch

#### Optimistic Updates
- Contact creation/update
- Content favoriting
- Notification read status
- Share creation (show in history immediately)

#### Background Refetching
- Engagement dashboard: refetch every 30 seconds when in focus
- Notifications: refetch every 1 minute
- Activity feed: refetch on window focus

---

## 7. Responsive Design Strategy

### 7.1 Mobile Breakpoints

| Breakpoint | Width | Target Devices | Layout Strategy |
|------------|-------|----------------|-----------------|
| xs | 0-639px | Mobile phones | Single column, stacked, bottom nav |
| sm | 640-767px | Large phones, small tablets | 1-2 columns, collapsible sidebar |
| md | 768-1023px | Tablets | 2-3 columns, persistent sidebar |
| lg | 1024-1279px | Desktop | Multi-column, full sidebar |
| xl | 1280-1535px | Large desktop | Wider content, more whitespace |
| 2xl | 1536px+ | Extra large | Max width container, centered |

### 7.2 Touch-Friendly Interactions

#### Touch Targets
- **Minimum size**: 44x44px (Apple HIG, WCAG)
- **Comfortable size**: 48x48px
- **Spacing**: 8px between targets

#### Touch Gestures
- **Swipe**: Navigate carousel, dismiss notifications
- **Pull-to-refresh**: Reload feed/list
- **Long press**: Show context menu, preview content
- **Pinch-to-zoom**: Image/video preview (where appropriate)
- **Double-tap**: Quick action (like/favorite)

#### Touch-Specific UI
- Larger buttons on mobile
- Bottom-sheet modals instead of centered modals
- Bottom navigation bar for primary actions
- Floating action button (FAB) for primary action
- Swipeable cards/items

### 7.3 Progressive Web App (PWA) Considerations

#### Manifest.json
```json
{
  "name": "UnFranchise Marketing App",
  "short_name": "UFO Marketing",
  "description": "Share approved content, track engagement",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Service Worker Strategy
- **Cache-first**: Static assets (CSS, JS, images)
- **Network-first**: API calls (with offline fallback)
- **Stale-while-revalidate**: Content library, contacts

#### Offline Support (Phase 2+)
- Cache content for offline viewing
- Queue share actions when offline
- Sync when connection restored
- Offline indicator in UI

#### Install Prompt
- Show "Add to Home Screen" prompt after user engagement
- Dismissible
- Don't show again if dismissed

#### Push Notifications (Phase 3+)
- Request permission after user opts in
- Types:
  - New engagement on shared content
  - New content published
  - Follow-up reminders
  - Hot lead alerts

---

## 8. Performance Optimization

### 8.1 Code Splitting
- Route-based splitting (automatic with Next.js)
- Dynamic imports for heavy components
- Lazy load below-the-fold content

### 8.2 Image Optimization
- Use Next.js Image component
- Responsive images (srcset)
- WebP format with fallbacks
- Lazy loading
- Blur placeholder

### 8.3 Bundle Optimization
- Tree-shaking unused code
- Minimize third-party dependencies
- Analyze bundle size (webpack-bundle-analyzer)
- Code splitting for admin vs UFO routes

### 8.4 Rendering Strategy
- **SSR**: Landing pages, public tracking redirects
- **SSG**: Marketing pages (if any)
- **CSR**: Authenticated app pages
- **ISR**: Content library (if caching is beneficial)

### 8.5 Performance Budgets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

---

## 9. Accessibility (a11y)

### 9.1 WCAG 2.1 Level AA Compliance

#### Keyboard Navigation
- All interactive elements accessible via keyboard
- Visible focus indicators
- Skip navigation links
- Logical tab order
- Escape to close modals

#### Screen Reader Support
- Semantic HTML
- ARIA labels where needed
- ARIA live regions for dynamic content
- Alt text for images
- Accessible forms

#### Color & Contrast
- Contrast ratio 4.5:1 for text
- Contrast ratio 3:1 for UI components
- Don't rely solely on color to convey information

#### Responsive & Zoom
- Support 200% zoom without horizontal scroll
- Responsive text sizing
- No fixed pixel heights

### 9.2 Accessibility Testing
- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation, screen reader testing
- Tools: NVDA, JAWS, VoiceOver

---

## 10. Security Considerations

### 10.1 Frontend Security

#### Authentication
- Store tokens in httpOnly cookies (not localStorage)
- Implement token refresh mechanism
- Auto-logout on token expiration
- Session timeout warnings

#### Authorization
- Check permissions client-side (UX only)
- Server validates all actions
- Hide/disable UI for unauthorized actions

#### Input Validation
- Validate all user input
- Sanitize before display (prevent XSS)
- Use Zod schemas for validation
- CSP headers to prevent XSS

#### Data Protection
- Don't log sensitive data
- Mask sensitive fields (phone, email)
- Secure file uploads (type, size validation)

#### HTTPS Only
- Enforce HTTPS
- HSTS headers
- Secure cookies

---

## 11. Internationalization (i18n)

### 11.1 Multi-Language Support

#### Library
- **next-intl** or **react-i18next**

#### Supported Languages (Phase 1)
- English (default)
- Spanish (future)
- Chinese (future - WeChat integration)

#### Translation Strategy
- JSON files per language
- Namespace by feature
- Pluralization support
- Date/time/number formatting

#### Market-Specific Content
- Content filtered by market
- Market-specific templates
- Currency formatting
- Phone number formatting

### 11.2 Right-to-Left (RTL) Support
- Logical properties in CSS
- Flip layouts for RTL languages (future)

---

## 12. Development Workflow

### 12.1 Environment Setup

#### Environment Variables
```
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_TRACKING_DOMAIN=https://t.example.com
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ANALYTICS_ID=xxx
```

### 12.2 Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "analyze": "ANALYZE=true next build"
  }
}
```

### 12.3 Code Quality Tools
- **ESLint**: Linting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **lint-staged**: Run linters on staged files
- **Commitlint**: Commit message linting

### 12.4 Git Workflow
- **Branch naming**: `feature/`, `bugfix/`, `hotfix/`
- **Commit convention**: Conventional Commits
- **PR review**: Required before merge
- **CI/CD**: Automated tests on PR

---

## 13. Deployment Strategy

### 13.1 Hosting Platform
**Vercel** (recommended for Next.js)
- Automatic deployments from Git
- Preview deployments for PRs
- Edge network (global CDN)
- Serverless functions
- Environment variables management

**Alternatives**: Netlify, AWS Amplify, Azure Static Web Apps

### 13.2 Build & Deploy Pipeline
1. Push to Git (GitHub/GitLab)
2. Trigger CI pipeline
3. Run linters, type-check, tests
4. Build production bundle
5. Deploy to staging (preview)
6. Manual approval
7. Deploy to production

### 13.3 Environments
- **Development**: Local dev server
- **Staging**: Pre-production testing
- **Production**: Live app

### 13.4 Monitoring & Analytics
- **Error tracking**: Sentry
- **Performance monitoring**: Vercel Analytics / Web Vitals
- **User analytics**: PostHog / Mixpanel
- **Uptime monitoring**: Pingdom / UptimeRobot

---

## 14. Testing Strategy

### 14.1 Unit Tests (Vitest)
- Test utilities and helpers
- Test custom hooks
- Test store logic
- Coverage target: 70%+

### 14.2 Component Tests (React Testing Library)
- Test component rendering
- Test user interactions
- Test accessibility
- Coverage target: 60%+

### 14.3 Integration Tests
- Test API integration
- Test form submissions
- Test routing
- Coverage target: 50%+

### 14.4 E2E Tests (Playwright)
- Critical user flows:
  - Login
  - Browse content
  - Share content (SMS, Email, Social)
  - View engagement
  - Add contact
  - Admin: Create content
- Mobile viewport testing
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### 14.5 Visual Regression Testing
- Chromatic or Percy
- Screenshot comparison
- Component storybook

---

## 15. Documentation

### 15.1 Code Documentation
- JSDoc comments for complex functions
- TypeScript interfaces for data structures
- README for each major directory

### 15.2 Component Storybook
- Storybook for component library
- Document component props
- Show variants and states
- Accessibility checks

### 15.3 API Documentation
- Document all API endpoints used
- Request/response examples
- Error handling

---

## 16. Future Enhancements

### 16.1 Phase 2 Features (Frontend)
- Contact import CSV wizard
- Advanced filters and saved searches
- Bulk actions on contacts
- Enhanced engagement timeline
- Customizable dashboard widgets

### 16.2 Phase 3 Features (Mobile Apps)
- React Native apps (iOS/Android)
- Share code with web (where possible)
- Native share sheets
- Push notifications
- Device contact sync
- Camera integration (share photos)
- Deep linking

### 16.3 Phase 4 Features (AI)
- AI-powered content recommendations
- Smart follow-up suggestions
- Auto-generated message variations
- Predictive analytics

---

## 17. Migration & Rollout Plan

### 17.1 Phased Rollout
1. **Alpha**: Internal testing (10 users)
2. **Beta**: Select UFOs (50-100 users)
3. **Limited Release**: Pilot market (500 users)
4. **General Availability**: All markets

### 17.2 User Training
- Video tutorials
- In-app onboarding flow
- Help documentation
- Support contact

### 17.3 Feedback Collection
- In-app feedback widget
- User surveys
- Analytics on feature usage
- Support tickets

---

## 18. Success Metrics

### 18.1 Technical Metrics
- Page load time < 2s
- API response time < 500ms
- Uptime > 99.9%
- Error rate < 1%
- Test coverage > 70%

### 18.2 User Experience Metrics
- User retention (30-day)
- Daily active users
- Session duration
- Bounce rate
- User satisfaction (NPS)

### 18.3 Business Metrics
- Total shares per user
- Click-through rate
- Content engagement rate
- Lead conversion rate (tracked elsewhere)
- Admin content creation rate

---

## Appendix A: Component Specifications

### A.1 ContentCard Component

**Purpose**: Display content item in grid/list

**Props**:
```typescript
interface ContentCardProps {
  content: ContentItem;
  variant?: 'grid' | 'list';
  onShare?: (content: ContentItem) => void;
  onFavorite?: (content: ContentItem) => void;
  onPreview?: (content: ContentItem) => void;
}
```

**States**:
- Default
- Hover (show actions)
- Loading
- Favorited

**Accessibility**:
- Keyboard navigable
- ARIA labels
- Alt text for thumbnail

---

### A.2 ShareModal Component

**Purpose**: Multi-step share wizard

**Props**:
```typescript
interface ShareModalProps {
  content: ContentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (shareEvent: ShareEvent) => void;
}
```

**Steps**:
1. Channel selection
2. Recipient selection
3. Message composition
4. Preview & confirm
5. Success

**State Management**:
- Internal step state
- Form data
- Validation errors

---

## Appendix B: Routing Configuration

```typescript
// Route configuration with metadata
export const routes = {
  auth: {
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  ufo: {
    dashboard: '/dashboard',
    content: '/content',
    contentDetail: (id: string) => `/content/${id}`,
    share: (id: string) => `/share/${id}`,
    contacts: '/contacts',
    contactDetail: (id: string) => `/contacts/${id}`,
    engagement: '/engagement',
    activity: '/activity',
    history: '/history',
    settings: '/settings',
  },
  admin: {
    dashboard: '/admin-dashboard',
    content: '/content-management',
    contentEdit: (id: string) => `/content-management/${id}`,
    campaigns: '/campaigns',
    campaignEdit: (id: string) => `/campaigns/${id}`,
    users: '/users',
    analytics: '/analytics',
    compliance: '/compliance',
    settings: '/system-settings',
  },
  public: {
    track: (id: string) => `/t/${id}`,
  },
};
```

---

## Appendix C: Type Definitions

```typescript
// Core types excerpt

export interface User {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  market: string;
  language: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ufo' | 'admin' | 'super_admin';

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  contentType: ContentType;
  thumbnailUrl: string;
  mediaUrl: string;
  destinationUrl?: string;
  category: string;
  tags: string[];
  markets: string[];
  languages: string[];
  channels: Channel[];
  campaignId?: string;
  status: ContentStatus;
  publishedAt?: string;
  expiresAt?: string;
  shareCount: number;
  engagementCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ContentType = 'video' | 'image' | 'pdf' | 'landing_page' | 'article';
export type Channel = 'sms' | 'email' | 'facebook' | 'instagram' | 'whatsapp' | 'wechat';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface Contact {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationshipType: RelationshipType;
  tags: string[];
  notes: string;
  source: string;
  consentEmail: boolean;
  consentSms: boolean;
  lastEngagementAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipType = 'prospect' | 'customer' | 'distributor' | 'other';

export interface ShareEvent {
  id: string;
  userId: string;
  contentId: string;
  channel: Channel;
  recipientIds: string[];
  message: string;
  trackingLink: string;
  campaignId?: string;
  clickCount: number;
  viewCount: number;
  createdAt: string;
}

export interface EngagementEvent {
  id: string;
  trackingLinkId: string;
  shareEventId: string;
  contactId?: string;
  eventType: EngagementType;
  metadata: Record<string, any>;
  createdAt: string;
}

export type EngagementType = 'link_clicked' | 'page_viewed' | 'video_started' | 'video_completed' | 'email_opened';
```

---

## Conclusion

This frontend architecture provides a solid foundation for the UnFranchise Marketing App with:

1. **Modern Tech Stack**: Next.js, TypeScript, Tailwind CSS, Zustand, TanStack Query
2. **Scalable Structure**: Modular, maintainable, testable
3. **Mobile-First Design**: Responsive, touch-friendly, PWA-ready
4. **API-First Integration**: Clean separation, reusable for mobile apps
5. **Comprehensive UI**: Complete component library and design system
6. **Performance Optimized**: Code splitting, caching, lazy loading
7. **Accessible**: WCAG 2.1 AA compliant
8. **Secure**: Authentication, authorization, input validation
9. **Future-Ready**: Extensible for mobile apps, AI features, internationalization

The architecture supports the phased delivery plan outlined in the specification, starting with the Content Sharing Engine MVP and expanding to full contact management, engagement tracking, and eventually mobile apps.

**Next Steps**:
1. Set up Next.js project with TypeScript
2. Configure Tailwind CSS and shadcn/ui
3. Implement authentication flow
4. Build component library
5. Develop UFO dashboard and content library
6. Implement share flow
7. Integrate with backend APIs
8. Testing and deployment

---

**Document Version**: 1.0
**Last Updated**: 2026-04-04
**Author**: Lead Frontend Developer
**Status**: Ready for Review
