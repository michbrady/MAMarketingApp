# UnFranchise Marketing App

A content sharing and engagement platform for UnFranchise Owners (UFOs) to share marketing content, track engagement, and manage contact relationships.

**Project Status**: MVP Complete + Phase 2 & 3 Features ✅
**Current Development**: Admin enhancements and polish
**Target Launch**: Ready for UAT
**Last Updated**: April 6, 2026

---

## 🎯 Project Overview

The UnFranchise Marketing App empowers UFOs to:
- Browse and share curated marketing content
- Share content via SMS, Email, and Social Media (Facebook, Twitter, LinkedIn)
- Track engagement with unique tracking links
- Manage contacts and relationships
- Automate follow-up reminders
- View analytics and performance metrics
- Use pre-built message templates

**Target Users**: UnFranchise Owners (UFOs), Corporate Admins, Super Admins

---

## ✅ Completed Features (Sprints 1-5)

### Sprint 1: Architecture & Database ✅
- Database schema (32 tables, 9 procedures, 15 views)
- SQL Server setup with authentication
- Seed data scripts

### Sprint 2: Authentication System ✅
- JWT-based authentication (access + refresh tokens)
- Role-based access control (UFO, CorporateAdmin, SuperAdmin)
- Protected routes and API endpoints
- Auto-login with token validation
- Login page and auth flow

### Sprint 3-4: Content Library ✅
- Browse 48+ content items
- Search and filtering (by category, market, language)
- Content detail pages with media viewer
- 12 content categories
- Responsive grid layout
- Pagination

### Sprint 5: Sharing Engine ✅
- Share via SMS (160-char limit)
- Share via Email (HTML templates)
- Share via Social Media (Facebook, Twitter, LinkedIn)
- Copy tracking link to clipboard
- QR code generation for mobile sharing
- Message preview before sending
- Form validation
- Unique tracking links for every share
- Click tracking with redirect
- Device/browser/OS detection
- IP anonymization (GDPR-compliant)
- Analytics dashboard with charts
- Share trends visualization (time-series)
- Channel performance breakdown
- Top content and top sharers leaderboards
- CSV export functionality
- Real-time activity feed
- 15+ pre-built message templates
- WYSIWYG editor for email templates
- Variable substitution (13 variables)
- Template performance tracking
- Admin-only template management

---

## ✅ Recently Completed (April 2026)

### Contact Management - COMPLETE ✅
- ✅ Contact CRUD operations
- ✅ Contact groups and tags
- ✅ CSV import/export
- ✅ Full-text search
- ✅ Engagement scoring
- ✅ Activity history
- ✅ Top engaged contacts leaderboard

### Follow-up System - COMPLETE ✅
- ✅ Follow-up task management
- ✅ Automated follow-ups after shares
- ✅ Calendar, Kanban, and List views
- ✅ Reminder notifications and overdue alerts
- ✅ Follow-up templates
- ✅ Priority management (Low, Medium, High, Urgent)

### Admin Features - COMPLETE ✅
- ✅ Admin dashboard with real-time metrics
- ✅ User management (create, edit, deactivate, bulk actions)
- ✅ Role management (create, edit, assign permissions)
- ✅ Content management (CRUD, approval workflow, featured content)
- ✅ Template management (create, edit, set defaults)
- ✅ User settings (profile, notifications, security, preferences)
- ✅ Share history and activity feed

### Analytics & Tracking - COMPLETE ✅
- ✅ Real-time dashboard with live analytics
- ✅ Share metrics and trends
- ✅ Channel performance breakdown
- ✅ Top content and sharers leaderboards
- ✅ CSV export functionality
- ✅ Date range filtering

---

## 📋 Upcoming Features

### Sprint 7: Admin Panel (Weeks 13-14)
- User management
- Content moderation
- System settings
- Audit logs

### Sprint 8: Testing & QA (Weeks 13-14)
- Unit tests (80% coverage goal)
- Integration tests
- E2E tests for critical workflows
- Performance optimization
- Security audits

### Sprint 9: Deployment (Weeks 15-16)
- Production environment setup
- CI/CD pipeline
- User acceptance testing
- Go-live preparation

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express 4.x
- **Language**: TypeScript 5.x
- **Database**: Microsoft SQL Server 2022
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, cors

### Frontend
- **Framework**: Next.js 14.x (App Router)
- **UI Library**: React 18.x
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand 4.x
- **HTTP Client**: Axios 1.x
- **Charts**: Recharts 2.x
- **Rich Text**: React Quill
- **Icons**: Lucide React

### Database
- **RDBMS**: Microsoft SQL Server 2022
- **Tables**: 32
- **Stored Procedures**: 9
- **Views**: 15 (8 analytics views)
- **Driver**: mssql (node-mssql)

---

## 📁 Project Structure

```
MAMarketingApp/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Database, environment config
│   │   ├── controllers/       # Route controllers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── routes/            # API routes
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities (logger, etc.)
│   │   └── index.ts           # Server entry point
│   ├── test_*.cjs             # API test scripts
│   ├── seed_*.cjs             # Data seeding scripts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── (auth)/       # Auth pages (login)
│   │   │   ├── (dashboard)/  # Protected dashboard pages
│   │   │   └── s/            # Tracking redirect routes
│   │   ├── components/        # React components
│   │   │   ├── auth/         # Auth components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── content/      # Content components
│   │   │   ├── share/        # Share components
│   │   │   ├── analytics/    # Analytics components
│   │   │   ├── admin/        # Admin components
│   │   │   └── ui/           # Reusable UI components
│   │   ├── lib/               # Libraries and utilities
│   │   │   └── api/          # API client functions
│   │   ├── store/             # Zustand stores
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── database/                   # SQL Server schema
│   ├── 01_Create_Database.sql
│   ├── 02_Schema_Core_Tables.sql
│   ├── 03_Schema_Sharing_Tracking.sql
│   ├── 04_Schema_Notifications_Audit.sql
│   ├── 05_Stored_Procedures.sql
│   ├── 06_Views.sql
│   ├── 06_Schema_ShareTemplates.sql
│   ├── 07_Seed_Data.sql
│   └── 08_Analytics_Views.sql
├── setup_database_auto.py      # Database setup script
├── create_login_simple.py      # SQL auth setup
├── PROJECT_STATUS.md           # Current status (detailed)
├── ROADMAP.md                  # Remaining work breakdown
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- Microsoft SQL Server 2022 (or access to SQL Server instance)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/MAMarketingApp.git
cd MAMarketingApp
```

### 2. Database Setup

**Option A: Automated Setup**
```bash
python setup_database_auto.py
```

**Option B: Manual Setup**
```bash
# Run SQL scripts in order
sqlcmd -S your-server -U sa -P password -i database/01_Create_Database.sql
sqlcmd -S your-server -U sa -P password -i database/02_Schema_Core_Tables.sql
# ... run remaining scripts
```

### 3. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=your-server
# DB_NAME=UnFranchiseMarketing
# DB_USER=unfranchise_app
# DB_PASSWORD=your-password
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret

# Start development server
npm run dev
```

Backend runs on: `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 5. Test Login

1. Open `http://localhost:3000`
2. You'll be redirected to `/login`
3. Use test credentials:
   - **Email**: `ufo@unfranchise.com`
   - **Password**: `ufo123`
4. Click "Sign In"
5. You'll be redirected to `/dashboard`

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication (4 endpoints)
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Content (5 endpoints)
- `GET /content` - List content (with filters, search, pagination)
- `GET /content/:id` - Get single content item
- `POST /content` - Create content (admin only)
- `PUT /content/:id` - Update content (admin only)
- `DELETE /content/:id` - Delete content (admin only)

### Sharing (4 endpoints)
- `POST /share` - Create share event
- `GET /share/:trackingCode/track` - Track click and redirect
- `GET /share/analytics` - Get analytics (with filters)
- `GET /share/templates/:channel` - Get channel templates

### Analytics (7 endpoints)
- `GET /analytics/overview` - Overview metrics
- `GET /analytics/trends` - Share trends (time-series)
- `GET /analytics/channels` - Channel performance
- `GET /analytics/top-content` - Top performing content
- `GET /analytics/leaderboard` - Top sharers
- `GET /analytics/recent-shares` - Recent share activity
- `GET /analytics/track/:trackingCode` - Track click

### Templates (9 endpoints)
- `GET /templates` - List all templates
- `GET /templates/:id` - Get template
- `POST /templates` - Create template (admin only)
- `PUT /templates/:id` - Update template (admin only)
- `DELETE /templates/:id` - Delete template (admin only)
- `POST /templates/preview` - Preview template
- `GET /templates/defaults/:channel` - Get default templates
- `GET /templates/performance/:id` - Get template performance
- `PUT /templates/:id/set-default` - Set as default

**All protected endpoints require**:
```
Authorization: Bearer {your_jwt_token}
```

See `SHARING_API.md` for detailed API documentation.

---

## 📊 Project Progress

**Phase 1 MVP Progress**:
```
Week 1-2:  ✅✅✅✅✅✅✅✅✅✅ 100% (Architecture & Database)
Week 3-4:  ✅✅✅✅✅✅✅✅✅✅ 100% (Authentication System)
Week 5-6:  ✅✅✅✅✅✅✅✅✅✅ 100% (Content Foundation)
Week 7-8:  ✅✅✅✅✅✅✅✅✅✅ 100% (Content Library UI)
Week 9-10: ✅✅✅✅✅✅✅✅✅✅ 100% (Sharing Engine)
Week 11-12:✅✅✅✅✅✅✅✅✅✅ 100% (Contact Management & Follow-ups)
Week 13-14:✅✅✅✅✅✅✅✅✅✅ 100% (Admin Panel & Features)
Week 15-16:🔄🔄⬜⬜⬜⬜⬜⬜⬜⬜  20% (Testing, Polish & UAT) ← CURRENT
```

**Overall Progress**:
- **Phase 1 (MVP)**: 100% Complete ✅
- **Phase 2 (Contact Management)**: 100% Complete ✅
- **Phase 3 (Activity & Engagement)**: 100% Complete ✅
- **Phase 4 (Mobile Apps)**: Not Started ⏸️
- **Phase 5 (AI Features)**: Not Started ⏸️
- **Final Polish & Testing**: 20% Complete 🔄

---

## 📝 Documentation

**Setup Guides**:
- `AUTHENTICATION_SETUP_COMPLETE.md` - Auth system setup
- `FRONTEND_COMPLETE.md` - Frontend setup and structure

**Feature Documentation**:
- `SPRINT5_SHARING_ENGINE_COMPLETE.md` - Complete sharing engine guide
- `SHARING_API.md` - Sharing API reference
- `TEMPLATE_SYSTEM_README.md` - Template system documentation
- `QUICKSTART_SHARING.md` - Quick start for sharing features

**Status & Planning**:
- `PROJECT_STATUS.md` - **Detailed current project status** ⭐
- `ROADMAP.md` - **Upcoming features and timeline** ⭐
- `PROJECT_PLAN.md` - Original project plan
- **`CHANGELOG.md`** - **Complete change history, errors, and fixes** ⭐ NEW!

---

## 🔐 Security

**Implemented**:
- ✅ JWT authentication (15-minute access tokens, 7-day refresh tokens)
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based access control
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention in templates
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ IP anonymization (GDPR-compliant)
- ✅ Input validation on all endpoints

**Planned**:
- Rate limiting
- Account lockout after failed login attempts
- Email verification
- Password reset flow
- 2FA/MFA (future enhancement)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Test sharing API
node test_sharing_api.cjs

# Test specific features (when implemented)
node test_contact_api.cjs
node test_followup_api.cjs
```

### Frontend Tests

```bash
cd frontend

# Run unit tests (when implemented in Sprint 8)
npm test

# Run E2E tests (when implemented in Sprint 8)
npm run test:e2e
```

---

## 📅 Release History

**v0.5.0** - April 2026 (Current)
- Sharing engine complete (4 parallel agents)
- Analytics dashboard
- Template management
- 62.5% of MVP complete

**v0.4.0** - March 2026
- Content library UI
- Content detail pages
- 48 content items seeded

**v0.3.0** - February 2026
- Frontend authentication
- Protected routes
- Dashboard layout

**v0.2.0** - February 2026
- Backend authentication API
- JWT tokens
- Role-based access

**v0.1.0** - January 2026
- Database schema
- Initial project setup

---

## 🎯 What's Next

**Current Focus (Testing & Polish)**:
- ✅ Complete admin role management
- ✅ User settings page
- ✅ Dashboard analytics integration
- 🔄 Backend endpoint verification
- 🔄 Test suite updates
- 🔄 Bug fixes and polish

**Immediate Priorities**:
- Verify backend endpoints for user settings
- Fix failing component tests
- Complete audit logs integration
- Enhance admin system settings
- Performance optimization
- Security audit

**Optional Enhancements (Phase 4+)**:
- Native mobile apps (iOS, Android)
- AI-powered content recommendations
- Prospect scoring algorithms
- Advanced analytics (predictive, cohort analysis)
- Email verification & password reset
- Rate limiting & account lockout
- Two-factor authentication

**Ready for UAT**: Application feature-complete for MVP scope

See `CHANGELOG.md` for detailed change history and `ROADMAP.md` for complete remaining work.

---

## 🤝 Contributing

This project uses an AI-powered parallel agent development approach. Each sprint involves:
1. Planning the sprint deliverables
2. Deploying specialized agents for specific tasks
3. Agents work in parallel on independent features
4. Integration and testing
5. Documentation

**Development Workflow**:
1. Create feature branch
2. Implement feature with tests
3. Run linting and type checking
4. Create pull request
5. Code review
6. Merge to main

---

## 📞 Support

For questions or issues:
1. Check the documentation in project root
2. Review `PROJECT_STATUS.md` for current progress
3. Review `ROADMAP.md` for planned work
4. Check `SHARING_API.md` for API details
5. Contact project maintainer

---

## 📄 License

Proprietary - Market America / UnFranchise Business

---

## 🔗 Quick Links

| Document | Purpose |
|----------|---------|
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Detailed current status with all completed work |
| [ROADMAP.md](./ROADMAP.md) | All remaining work broken down by sprint |
| [SPRINT5_SHARING_ENGINE_COMPLETE.md](./SPRINT5_SHARING_ENGINE_COMPLETE.md) | Sharing engine documentation |
| [SHARING_API.md](./SHARING_API.md) | Sharing API reference |
| [UnFranchise Marketing App.docx](./UnFranchise%20Marketing%20App.docx) | Original requirements |

---

**Last Updated**: April 6, 2026
**Project Status**: MVP + Phase 2 & 3 Complete (85%+ Overall)
**Next Milestone**: Testing, Polish & UAT
**Status**: ✅ Feature-Complete - Ready for Testing & Deployment
