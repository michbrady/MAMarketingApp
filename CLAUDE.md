# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **UnFranchise Marketing App** - a comprehensive content sharing and engagement platform for UnFranchise Owners (UFOs). The application enables UFOs to share corporate-approved content with prospects through SMS, email, and social channels while tracking engagement and follow-up opportunities.

**How Sharing Works**:
- **SMS & Email**: App **generates content** for UFO to copy/send via their own messaging apps (does NOT send on their behalf)
- **Social Media**: App generates content with tracking links for UFO to post manually
- **Tracking**: All shares include unique tracking URLs to monitor engagement
- **No Direct Sending**: This is a web app - UFOs control when and how messages are sent

**Current Status**: MVP Complete + Phase 2 & 3 Features (85%+ overall completion)
**Current Phase**: Testing, polish, and UAT preparation

## Project Structure

```
MAMarketingApp/
├── backend/                       # Node.js/TypeScript backend API
│   ├── src/
│   │   ├── config/               # Database, Redis, logger config
│   │   ├── controllers/          # Route controllers (auth, content, sharing, etc.)
│   │   ├── services/             # Business logic layer
│   │   ├── middleware/           # Auth, validation, error handling
│   │   ├── routes/               # API route definitions
│   │   ├── types/                # TypeScript types
│   │   ├── utils/                # Utility functions
│   │   ├── __tests__/            # Vitest tests
│   │   └── index.ts              # Server entry point
│   └── package.json              # Extensive test scripts
├── frontend/                      # Next.js 16+ frontend
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── (auth)/          # Login page
│   │   │   ├── (dashboard)/     # Protected dashboard pages
│   │   │   └── s/[code]/        # Share tracking redirect
│   │   ├── components/           # React components
│   │   │   ├── auth/            # Login, protected route wrappers
│   │   │   ├── content/         # Content grid, cards, filters
│   │   │   ├── share/           # Share dialogs and forms
│   │   │   ├── analytics/       # Charts and dashboards
│   │   │   ├── admin/           # Admin UI components
│   │   │   └── ui/              # Reusable UI primitives (shadcn/ui)
│   │   ├── lib/
│   │   │   ├── api/             # Typed API client functions
│   │   │   └── utils.ts         # Utility functions
│   │   ├── store/                # Zustand stores
│   │   └── types/                # TypeScript types
│   ├── CLAUDE.md & AGENTS.md    # Next.js 16 breaking changes warning
│   └── package.json              # Test scripts (Vitest + Playwright)
├── database/                      # SQL Server schema (source of truth!)
│   ├── 01_Create_Database.sql
│   ├── 02_Schema_Core_Tables.sql
│   ├── 03_Schema_Sharing_Tracking.sql
│   ├── 04_Schema_Notifications_Audit.sql
│   ├── 05_Stored_Procedures.sql
│   ├── 06_Views.sql
│   ├── 06_Schema_ShareTemplates.sql
│   ├── 07_Seed_Data.sql
│   ├── 08_Analytics_Views.sql
│   └── 10_Master_Deploy.sql      # Runs all scripts in order
├── docs/
│   ├── architecture/             # Architecture documentation
│   ├── PROJECT_PLAN.md
│   └── QA-Testing-Strategy.md
├── .claude/
│   └── projects/.../memory/      # Claude Code memory files
├── README.md                      # **Most current project status**
├── CHANGELOG.md                   # Complete change history
├── PROJECT_STATUS.md              # Detailed status
├── ROADMAP.md                     # Remaining work
├── docker-compose.yml
└── GETTING_STARTED.md
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.1.3 with App Router (webpack bundler)
- **UI Library**: React 18.3.1
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: Zustand (UI state) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with interceptors
- **Charts**: Recharts
- **Testing**: Vitest (unit) + Playwright (E2E)

### Backend
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js
- **Database**: Microsoft SQL Server 2022
- **Caching/Queue**: Redis + BullMQ
- **Authentication**: JWT with refresh tokens
- **Messaging**: ⚠️ **NOT USED** - App generates content only; UFOs send via their own email/SMS clients

### Database
- **Microsoft SQL Server** with 30+ tables
- Multi-tenant design (markets, languages)
- High-volume event tracking architecture
- Comprehensive stored procedures and views

## Development Phases

### Phase 1: MVP - Content Sharing Engine (16 weeks) ✅ COMPLETE
- Authentication and user management
- Content library (browse, search, filter)
- Share workflows (SMS, email, social)
- Tracking links and basic analytics
- Admin content management
- **Status**: Production-ready sharing platform ✅

### Phase 2: Contact Management & Engagement (12 weeks) ✅ COMPLETE
- Contact import and management
- Engagement event tracking
- Contact timeline and analytics
- Enhanced reporting dashboards
- **Status**: All features implemented ✅

### Phase 3: Activity Feed & Nudging (10 weeks) ✅ COMPLETE
- Real-time activity feed
- Smart nudging engine
- In-app notifications
- Follow-up recommendations
- **Status**: All features implemented ✅

### Current Phase: Testing & UAT (4 weeks) ← **Current**
- Backend endpoint verification
- Test suite updates and bug fixes
- Performance optimization
- Security audit
- User acceptance testing preparation

### Phase 4: Mobile Apps (16 weeks)
- Native iOS app
- Native Android app
- Mobile API hardening
- Push notifications

### Phase 5: AI Enhancement (12 weeks)
- Content recommendations
- Prospect scoring
- Follow-up optimization
- AI-assisted messaging

## Key Architectural Decisions

1. **API-First Design**: All features exposed through REST APIs to support future mobile apps
2. **Event-Driven Architecture**: Share and engagement events processed asynchronously via BullMQ + Redis
3. **Multi-Tenant**: Support for multiple markets, languages, and compliance rules
4. **Mobile-Ready**: Frontend built with responsive design, PWA capabilities
5. **Modular Monolith → Microservices**: Start with monolith, clear service boundaries for future splitting
6. **Service Layer Pattern**: Controller → Service → Repository (direct SQL via mssql driver, not an ORM)

## Critical Sharing Workflow Architecture

⚠️ **IMPORTANT**: The app does **NOT** send SMS/email messages on behalf of UFOs. This is a web application that:

1. **Generates shareable content** (message + tracking URL)
2. **Provides copy-to-clipboard** functionality
3. **Opens UFO's email/SMS client** with pre-filled content via `mailto:` and `sms:` URL schemes
4. **UFO manually sends** the message from their own device/account

**Why this approach**:
- No carrier/ISP restrictions on sending volume
- Messages come from UFO's personal phone/email (more authentic)
- UFO controls timing and can personalize before sending
- No need for Twilio/SendGrid in MVP
- Compliance: UFO responsible for CAN-SPAM/TCPA, not the platform

**Implementation**:
- Frontend: `SMSShareForm.tsx` and `EmailShareForm.tsx` use clipboard API + URL schemes
- Backend: Generates tracking URLs and logs share events (but doesn't send messages)
- Social: Same pattern - generate content, UFO posts manually

## Critical Database Architecture Notes

⚠️ **IMPORTANT**: This project uses **direct SQL Server queries** with the `mssql` driver, NOT an ORM like Prisma or TypeORM.

- **Always verify table/column names** against actual database schema before writing queries
- Common issue: Documentation/comments may show old names that don't match current schema
- Example: `ContentItems` table uses `ContentItemID` (not `ContentID`), `Title` (not `Name`)
- Use `SELECT * FROM INFORMATION_SCHEMA.TABLES` and `INFORMATION_SCHEMA.COLUMNS` to verify schema
- Database schema is in `database/` folder - these are the source of truth
- See memory file `feedback_content_display_fix.md` for documented schema sync issues

## Code Conventions

### Frontend
- **Next.js 16.x** with App Router - ⚠️ **Has breaking changes from Next.js 14** - check deprecation notices
- Use **functional components** with hooks
- **TypeScript strict mode** enabled
- Components follow **shadcn/ui** patterns
- Use **Zustand** for UI state, **TanStack Query** for server data
- All API calls through typed client in `src/lib/api/`
- React 19.x - check for breaking changes from React 18

### Backend
- **ES Modules** (type: "module") - use `import`/`export`, not `require()`
- All code in TypeScript with **strict mode**
- Service layer pattern: **Controller → Service → Database**
  - Controllers (`src/controllers/`) handle HTTP requests/responses
  - Services (`src/services/`) contain business logic
  - Database queries use `mssql` driver directly (no ORM/repository layer)
  - Example: `authController.ts` → `authService.ts` → SQL queries
- **Zod** for runtime validation at API boundaries
- Comprehensive error handling and logging (Winston)

### Database
- Multi-schema design (identity, content, sharing, notifications, audit)
- All business logic in **stored procedures**
- Comprehensive indexing strategy
- Audit logging for all mutations

## Testing Strategy

### Backend
- **Unit tests**: Vitest for services and utilities
- **Integration tests**: API endpoints with test database
- **Target coverage**: 80%+

### Frontend
- **Unit tests**: Vitest for hooks and utilities
- **Component tests**: React Testing Library
- **E2E tests**: Playwright for critical user flows
- **Target coverage**: 70%+

## Security Considerations

- **Authentication**: JWT with httpOnly cookies
- **Authorization**: Role-based access control (RBAC)
- **Input validation**: Zod schemas on frontend and backend
- **SQL injection prevention**: Parameterized queries, stored procedures
- **XSS prevention**: React auto-escaping, CSP headers
- **Rate limiting**: Per-endpoint limits
- **Audit logging**: All sensitive operations logged

## Performance Targets

- **API response time**: <100ms (auth), <500ms (content queries), <1s (analytics)
- **Concurrent users**: 10,000+
- **Requests/second**: 1,000+
- **Event processing**: 10,000+ events/second
- **Uptime**: 99.5%+

## Environment Variables

### Required for Development
```env
# Database
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrong@Password123
DB_NAME=unfranchise_marketing

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev_secret_change_in_production
```

### Required for Production
- All development vars above (with production values)
- `FRONTEND_URL` and `BACKEND_URL` for CORS

### Optional (Future Features)
⚠️ **Not currently used** - App generates content for UFOs to send manually:
- `SENDGRID_API_KEY` - If implementing automated email sending
- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` - If implementing automated SMS sending

## Common Development Tasks

### Quick Start (Recommended)

**Windows**:
```cmd
start.bat              # Starts both backend and frontend
stop.bat               # Stops all services
```

**Mac/Linux/Git Bash**:
```bash
./start.sh             # Starts both backend and frontend
./stop.sh              # Stops all services
```

See `START_HERE.md` for detailed instructions.

### Manual Start (Alternative)

**Run backend**:
```bash
cd backend
npm install
npm run dev              # Port 3001
```

**Run frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev              # Port 3000
```

### Start with Docker (If available)
```bash
docker-compose up -d
docker-compose logs -f backend    # View backend logs
docker-compose logs -f frontend   # View frontend logs
```

### Database management
```bash
# Initialize database (all scripts)
sqlcmd -S localhost -U sa -P "password" -i database/10_Master_Deploy.sql

# Or with Docker
docker-compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "password" -i /docker-entrypoint-initdb.d/10_Master_Deploy.sql -C

# Run specific script
sqlcmd -S localhost -U sa -P "password" -d unfranchise_marketing -i database/07_Seed_Data.sql
```

### Run tests

**Backend** (Vitest):
```bash
cd backend
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage report
npm run test:ui                # Visual UI for tests

# Run specific test suites
npm run test:auth              # Auth API tests
npm run test:content           # Content API tests
npm run test:contacts          # Contacts API tests
npm run test:followups         # Follow-ups API tests
npm run test:sharing           # Sharing API tests
npm run test:analytics         # Analytics API tests
```

**Frontend** (Vitest + Playwright):
```bash
cd frontend
npm test                       # Run unit tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage

# E2E tests
npm run test:e2e               # All E2E tests
npm run test:e2e:ui            # Playwright UI mode
npm run test:e2e:debug         # Debug mode
npm run test:e2e:chrome        # Chrome only
npm run test:e2e:firefox       # Firefox only
```

### Build for production
```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm start
```

## Important Files to Review

### Current Status (Read These First!)
- `README.md` - **Most up-to-date status** and quick start
- `PROJECT_STATUS.md` - Detailed feature completion status
- `CHANGELOG.md` - Complete change history, errors, and fixes
- `ROADMAP.md` - Remaining work and timeline

### Architecture & Planning
- `docs/PROJECT_PLAN.md` - Original 66-week implementation plan
- `docs/architecture/ARCHITECTURE.md` - Backend architecture
- `docs/architecture/FRONTEND_ARCHITECTURE.md` - Frontend architecture
- `docs/architecture/API_SPECIFICATION.yaml` - OpenAPI spec (may be outdated - verify against code)
- `docs/QA-Testing-Strategy.md` - Comprehensive testing plan

### Database
- `database/02_Schema_Core_Tables.sql` - Core schema (users, content, etc.)
- `database/03_Schema_Sharing_Tracking.sql` - Sharing/tracking tables
- `database/05_Stored_Procedures.sql` - Business logic procedures
- `database/06_Views.sql` and `database/08_Analytics_Views.sql` - Database views
- `database/07_Seed_Data.sql` - Test data

### Setup & Configuration
- `GETTING_STARTED.md` - Detailed setup instructions
- `docker-compose.yml` - Local development environment
- `.env.example` - Environment variable template
- `setup_database_auto.py` - Automated database setup script

### Feature Documentation
- `SPRINT5_SHARING_ENGINE_COMPLETE.md` - Sharing engine guide
- `TEMPLATE_SYSTEM_README.md` - Template system docs
- `AUTHENTICATION_SETUP_COMPLETE.md` - Auth system details

## Troubleshooting & Common Issues

### Database Connection Issues
```bash
# Verify SQL Server is running
docker-compose ps sqlserver

# Check connection
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "SELECT DB_NAME()"

# View database tables
sqlcmd -S localhost -U sa -P "password" -d unfranchise_marketing -Q "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
```

### Backend API Issues
```bash
# Check backend health
curl http://localhost:3001/health

# View backend logs
cd backend && npm run dev
# Or with Docker: docker-compose logs -f backend
```

### Frontend Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Test Database Setup
```bash
cd backend
npm run test:setup    # Create test database
```

## When Working on Features

1. **Check current status** first: `README.md` (most up-to-date), `PROJECT_STATUS.md`, and `CHANGELOG.md`
2. **Review project plan** (`docs/PROJECT_PLAN.md`) for phase and sprint context
3. **Verify database schema** before writing SQL queries (see Critical Database Architecture Notes above)
4. **Check API spec** (`docs/architecture/API_SPECIFICATION.yaml`) for endpoints - may be outdated, verify against actual code
5. **Follow existing patterns** in backend (`src/controllers/`, `src/services/`) and frontend (`src/app/`, `src/components/`)
6. **Write tests** alongside implementation using the specific test commands above
7. **Update relevant documentation** (`README.md`, `CHANGELOG.md`, etc.)

## Integration Points

### External Systems (Future)
The app will integrate with existing internal systems:
- User/member database
- Product catalog
- Media/asset repository
- Content management system
- CRM

For MVP, these are **mocked** or use **seed data**. Production will use adapter pattern for integration.

## Deployment Strategy

### MVP (Phase 1)
- **Frontend**: Vercel (recommended) or similar Next.js-optimized platform
- **Backend**: Cloud VM or container service (AWS/Azure/GCP)
- **Database**: Managed SQL Server (Azure SQL, AWS RDS)
- **Redis**: Managed Redis (Azure Cache, AWS ElastiCache)

### CI/CD
- GitHub Actions for automated testing
- Preview deployments for PRs
- Staging environment for QA
- Production deployment requires approval

## Success Criteria

### MVP Launch
- ✅ UFO can log in securely
- ✅ UFO can browse and search approved content
- ✅ UFO can share content via SMS, email, social
- ✅ Each share generates unique tracking link
- ✅ Admin can create and publish content
- ✅ System records share and engagement events
- ✅ UFO can view engagement analytics
- ✅ Responsive UI works on mobile browsers
- ✅ 67 acceptance criteria met (see QA doc)

## Team Structure

- **1 Project Manager** - Overall coordination
- **2 Backend Developers** - API and services
- **2 Frontend Developers** - UI/UX implementation
- **1 Database Developer** - SQL Server optimization
- **1 QA Engineer** - Testing and quality
- **1 DevOps Engineer** - Infrastructure and deployment
- **1 UX/UI Designer** - Design and prototyping

## Completed Features

### MVP (Phase 1) - 100% Complete ✅
- Authentication system (JWT with refresh tokens)
- Content library (browse, search, filter)
- Sharing engine (generates SMS/email/social content + tracking URLs)
  - **Note**: Generates content for UFO to send manually, doesn't send on their behalf
  - Copy-to-clipboard and `mailto:`/`sms:` URL schemes to open UFO's apps
- Tracking links with click analytics
- Admin content management
- Template system with variable substitution

### Phase 2 - 100% Complete ✅
- Contact management (CRUD, groups, tags, import/export)
- Engagement scoring and history
- Follow-up task management
- Calendar/Kanban views

### Phase 3 - 100% Complete ✅
- Real-time activity feed
- Analytics dashboard with charts
- User management
- Role-based permissions
- System settings

### Current Work - Testing & Polish 🔄
- Backend endpoint verification
- Test suite updates and fixes
- Bug fixes and polish
- UAT preparation

---

**Current Status**: MVP + Phase 2 & 3 Complete (85%+ overall) - Testing & UAT phase
**Last Updated**: April 2026
