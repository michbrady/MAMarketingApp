# UnFranchise Marketing App - Backend Documentation

## Overview

Complete backend architecture and implementation guide for the UnFranchise Marketing App, a corporate-controlled content sharing and engagement platform for UnFranchise Owners (UFOs).

---

## Documentation Index

### 1. [Architecture Documentation](./ARCHITECTURE.md)
**Comprehensive backend architecture covering**:
- Technology stack selection and rationale
- Service architecture (modular monolith with microservices path)
- API design (REST + GraphQL hybrid)
- Security architecture (JWT, RBAC, encryption)
- Integration layer design
- Caching and messaging strategies
- Non-functional requirements

**Key Decisions**:
- **Framework**: Node.js + TypeScript + Express
- **Database**: Microsoft SQL Server
- **Cache/Queue**: Redis + Bull.js
- **API Style**: RESTful primary, GraphQL for analytics
- **Authentication**: JWT with refresh tokens
- **Architecture**: Modular monolith (microservices-ready)

### 2. [Database Schema](./DATABASE_SCHEMA.md)
**Complete database design including**:
- Multi-schema organization (auth, content, sharing, contacts, engagement, etc.)
- Detailed table definitions with all columns
- Indexes and performance optimization
- Stored procedures and views
- Triggers and constraints
- Data retention and archival strategies
- Backup and recovery plans

**Total Tables**: 40+ tables across 8 schemas

**Key Features**:
- Soft deletes for audit trail
- Full-text search for content and contacts
- Partitioning for high-volume tables
- Comprehensive audit logging

### 3. [API Specification](./API_SPECIFICATION.yaml)
**OpenAPI 3.0 specification with**:
- Complete endpoint definitions for all services
- Request/response schemas
- Authentication requirements
- Error responses
- Rate limiting rules
- Pagination and filtering

**Service Endpoints**:
- Authentication (7 endpoints)
- Content (10+ endpoints)
- Sharing (6 endpoints)
- Tracking (3 endpoints)
- Contacts (10 endpoints)
- Engagement (5 endpoints)
- Notifications (6 endpoints)
- Admin (5+ endpoints)

**View Specification**:
- Import into Swagger UI/Postman
- Use for API testing
- Reference for frontend development

### 4. [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
**Phased delivery plan with**:
- 5 phases from MVP to AI enhancements
- Sprint-by-sprint breakdown
- Detailed task lists
- Success criteria for each phase
- Resource requirements
- Risk mitigation strategies
- Deployment strategy

**Timeline**:
- **Phase 1 (MVP)**: 8-10 weeks
- **Phase 2 (Contacts)**: 6 weeks
- **Phase 3 (Notifications)**: 4 weeks
- **Phase 4 (Mobile)**: 3 weeks
- **Phase 5 (AI)**: 6-8 weeks

---

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- Docker Desktop (for local SQL Server and Redis)
- Git
- Visual Studio Code (recommended)

### Local Development Setup

1. **Clone Repository**
```bash
git clone https://github.com/yourorg/unfranchise-app.git
cd unfranchise-app/backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Local Infrastructure**
```bash
docker-compose up -d
```

This starts:
- SQL Server 2019 (port 1433)
- Redis (port 6379)

4. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run Database Migrations**
```bash
npm run migration:run
```

6. **Seed Initial Data**
```bash
npm run seed
```

7. **Start Development Server**
```bash
npm run dev
```

Server runs at: http://localhost:3000

8. **View API Documentation**

Navigate to: http://localhost:3000/api-docs

---

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   │   ├── auth/        # Authentication service
│   │   ├── content/     # Content service
│   │   ├── sharing/     # Sharing service
│   │   ├── tracking/    # Tracking service
│   │   ├── contacts/    # Contact service
│   │   ├── engagement/  # Engagement service
│   │   ├── notifications/ # Notification service
│   │   └── admin/       # Admin service
│   ├── models/          # Database models (TypeORM entities)
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── utils/           # Utility functions
│   ├── adapters/        # External system adapters
│   ├── queues/          # Background job queues
│   ├── events/          # Event handlers
│   └── app.ts           # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── migrations/          # Database migrations
├── seeds/               # Database seed data
├── docs/                # Additional documentation
├── docker-compose.yml   # Local development services
├── Dockerfile           # Production container
├── package.json
├── tsconfig.json
└── README.md
```

---

## Architecture Highlights

### Service Domains

The application is organized into distinct service domains:

```
┌─────────────────┐
│  API Gateway    │  Express + TypeScript
└────────┬────────┘
         │
    ┌────┴────────────────────────────────┐
    │                                     │
┌───▼────┐  ┌─────────┐  ┌──────────┐  ┌─▼──────┐
│  Auth  │  │ Content │  │ Sharing  │  │Tracking│
└───┬────┘  └────┬────┘  └────┬─────┘  └────┬───┘
    │            │            │             │
┌───▼────┐  ┌───▼─────┐  ┌───▼────┐  ┌────▼───────┐
│Contacts│  │Engagement│ │Notifs  │  │Integration │
└────────┘  └──────────┘  └────────┘  └────────────┘
```

### Data Flow

**Share Creation Flow**:
```
User Request → Auth Middleware → Share Controller → Share Service
                                                          ↓
                                                  Tracking Service
                                                  (Generate Link)
                                                          ↓
                                                    Share Queue
                                                          ↓
                                            ┌─────────────┴──────────────┐
                                            │                            │
                                      Email Worker                  SMS Worker
                                            │                            │
                                      SendGrid/SES                   Twilio
```

**Engagement Tracking Flow**:
```
Click on Link → /t/:shortcode → Tracking Service → Record Event
                                                          ↓
                                                  Engagement Queue
                                                          ↓
                                            ┌─────────────┴──────────────┐
                                            │                            │
                                   Update Metrics                Create Notification
                                   (Redis Cache)                  (Nudge Engine)
```

---

## Technology Stack

### Core Framework
- **Node.js** 18 LTS
- **TypeScript** 5.x
- **Express** 4.x
- **TypeORM** or **Prisma** (ORM)

### Database
- **Microsoft SQL Server** 2019+ (primary database)
- **Redis** 7.x (cache, sessions, queues)

### Authentication & Security
- **jsonwebtoken** (JWT)
- **bcrypt** (password hashing)
- **helmet** (security headers)
- **express-rate-limit** (rate limiting)
- **joi** or **zod** (validation)

### Background Jobs
- **Bull** (Redis-based queue)
- **node-cron** (scheduled jobs)

### External Integrations
- **SendGrid** or **AWS SES** (email)
- **Twilio** (SMS)
- **axios** (HTTP client)
- **opossum** (circuit breaker)

### Testing
- **Jest** (test runner)
- **Supertest** (API testing)
- **k6** (load testing)

### Development Tools
- **ESLint** + **Prettier** (code quality)
- **Husky** (git hooks)
- **Winston** (logging)
- **Swagger/OpenAPI** (API docs)

---

## API Overview

### Authentication
```http
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/password/reset
```

### Content
```http
GET    /api/v1/content
GET    /api/v1/content/:id
POST   /api/v1/content              # Admin
PUT    /api/v1/content/:id          # Admin
DELETE /api/v1/content/:id          # Admin
GET    /api/v1/content/featured
GET    /api/v1/content/categories
```

### Sharing
```http
POST   /api/v1/shares
GET    /api/v1/shares
GET    /api/v1/shares/:id
POST   /api/v1/shares/preview
```

### Tracking
```http
GET    /api/v1/t/:shortcode         # Redirect
POST   /api/v1/tracking/events      # Beacon
GET    /api/v1/tracking/content/:id/analytics
```

### Contacts
```http
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id
POST   /api/v1/contacts/import
```

### Engagement
```http
GET    /api/v1/engagement/dashboard
GET    /api/v1/engagement/contacts/:id
GET    /api/v1/engagement/follow-ups
GET    /api/v1/engagement/top-content
```

### Notifications
```http
GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
GET    /api/v1/notifications/preferences
PUT    /api/v1/notifications/preferences
```

---

## Security Best Practices

### Implemented Security Measures

1. **Authentication**
   - JWT with short expiry (15 minutes)
   - Refresh token rotation
   - Session tracking and revocation
   - Password complexity requirements
   - bcrypt with cost factor 12

2. **Authorization**
   - Role-based access control (RBAC)
   - Permission-based authorization
   - Resource ownership validation

3. **Input Validation**
   - Schema validation for all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (input sanitization)

4. **Rate Limiting**
   - Per-user and per-IP limits
   - Aggressive limits on auth endpoints
   - Configurable limits per endpoint

5. **Data Protection**
   - TLS 1.3 for all connections
   - Database encryption at rest (TDE)
   - Sensitive field encryption
   - Secure cookie configuration

6. **Monitoring**
   - Comprehensive audit logging
   - Security event tracking
   - Suspicious activity alerts

---

## Performance Targets

### API Response Times (p95)
- Authentication: < 200ms
- Content listing: < 300ms
- Content search: < 500ms
- Share creation: < 400ms
- Tracking redirect: < 100ms
- Analytics queries: < 1000ms

### Scalability Targets
- **Concurrent Users**: 10,000+
- **Requests/Second**: 1,000+
- **Shares/Month**: 5,000,000+
- **Events/Second**: 10,000+

### Availability Target
- **Uptime**: 99.5% (43 minutes downtime/month)

---

## Testing Strategy

### Test Coverage
- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Load Tests**: Performance benchmarks

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Load tests
npm run test:load
```

---

## Deployment

### Environments

1. **Development** (local)
   - Docker Compose
   - Hot reload enabled
   - Debug logging

2. **Staging**
   - AWS/Azure cloud
   - Production-like data
   - UAT environment

3. **Production**
   - Multi-AZ deployment
   - Auto-scaling
   - Blue-green deployment

### CI/CD Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Lint   │ -> │   Test   │ -> │  Build   │ -> │  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Stages**:
1. Lint (ESLint + Prettier)
2. Type check (TypeScript)
3. Unit tests
4. Integration tests
5. Security scan
6. Build Docker image
7. Deploy to environment

---

## Monitoring & Observability

### Metrics
- Application: Request rate, error rate, latency
- Business: Shares, clicks, engagement rate
- Infrastructure: CPU, memory, disk, network

### Logging
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized aggregation (ELK/Datadog)
- Correlation IDs for request tracing

### Alerting
- Error rate > 5% (5 minutes)
- Response time p95 > 1000ms (5 minutes)
- Database connection pool exhaustion
- Integration failures
- Disk space < 20%

---

## Troubleshooting

### Common Issues

**Database Connection Failures**
```bash
# Check SQL Server is running
docker ps | grep sqlserver

# Test connection
npm run db:test-connection

# Check connection pool
npm run db:pool-status
```

**Redis Connection Issues**
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Check keys
redis-cli KEYS '*'
```

**Migration Failures**
```bash
# Revert last migration
npm run migration:revert

# Check migration status
npm run migration:show
```

**Performance Issues**
```bash
# Check slow queries
npm run db:slow-queries

# Analyze cache hit rate
npm run cache:stats

# View active connections
npm run db:connections
```

---

## Contributing

### Code Standards
- Follow TypeScript best practices
- Use async/await (no callbacks)
- Meaningful variable names
- JSDoc comments for public APIs
- Keep functions small and focused

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/description

# Commit with conventional commits
git commit -m "feat: add contact search"

# Push and create PR
git push origin feature/description
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Add tests
- `chore`: Maintenance

### Pull Request Process
1. Create feature branch
2. Write tests for new code
3. Ensure all tests pass
4. Update documentation
5. Create PR with description
6. Address review feedback
7. Squash and merge

---

## Support

### Documentation
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Database: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- API: [API_SPECIFICATION.yaml](./API_SPECIFICATION.yaml)
- Roadmap: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)

### Team Contacts
- Tech Lead: [email]
- DevOps: [email]
- Product Owner: [email]

### Resources
- API Documentation: http://localhost:3000/api-docs
- Project Board: [URL]
- Monitoring Dashboard: [URL]
- CI/CD Pipeline: [URL]

---

## License

Proprietary - Market America, Inc.

---

## Changelog

### Version 1.0.0 (MVP - Phase 1)
- User authentication and authorization
- Content library and search
- Content sharing (SMS, email, social)
- Tracking links and engagement events
- Basic analytics and reporting
- Admin content management

### Version 1.1.0 (Phase 2)
- Contact management
- Contact import/export
- Engagement dashboard
- Follow-up opportunities
- Advanced reporting

### Version 1.2.0 (Phase 3)
- Notification system
- Activity feed
- Nudging engine
- Email digests

### Version 2.0.0 (Phase 4)
- Mobile API optimization
- Push notifications
- Deep linking
- Offline sync support

---

## Next Steps

1. **Review Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) thoroughly
2. **Understand Database**: Study [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
3. **Explore API**: Import [API_SPECIFICATION.yaml](./API_SPECIFICATION.yaml) into Swagger
4. **Plan Implementation**: Follow [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
5. **Set Up Environment**: Follow Quick Start guide above
6. **Start Development**: Begin with Sprint 1 tasks

**Ready to build an amazing platform!** 🚀
