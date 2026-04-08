# UnFranchise Marketing App - Backend Architecture

## Executive Summary

This document outlines the complete backend architecture for the UnFranchise Marketing App, a corporate-controlled content sharing and engagement platform for UnFranchise Owners (UFOs).

**Architecture Approach**: Modular Monolith with Service-Oriented Design
**Primary Technology**: Node.js with TypeScript
**API Style**: RESTful with GraphQL for complex queries
**Database**: Microsoft SQL Server (primary), Redis (caching/sessions)

---

## 1. Technology Stack Recommendation

### 1.1 Backend Framework: Node.js with Express & TypeScript

**Selection Rationale**:
- **TypeScript**: Strong typing reduces bugs, improves maintainability, and provides excellent IDE support
- **Node.js/Express**:
  - High performance for I/O-intensive operations (tracking, notifications)
  - Large ecosystem for integrations
  - Easy to hire developers
  - Excellent for event-driven architecture
  - Natural fit with frontend React/Next.js stack
  - Strong async/await support for external integrations

**Alternative Considered**: .NET Core
- Pros: Native SQL Server integration, strong enterprise support, excellent performance
- Cons: Smaller developer pool, potentially higher licensing costs
- Decision: Node.js chosen for ecosystem and team flexibility

### 1.2 API Architecture: Hybrid REST + GraphQL

**Primary API Style: RESTful**
- Used for: CRUD operations, sharing actions, authentication, webhooks
- Standards: OpenAPI 3.0 specification
- Versioning: URL-based (e.g., `/api/v1/`)

**Secondary: GraphQL**
- Used for: Complex reporting, analytics dashboards, admin queries
- Enables flexible data fetching for dashboards without over-fetching
- Reduces API endpoint proliferation for reporting

**Justification**:
- REST provides clear, cacheable endpoints for core operations
- GraphQL handles complex analytics queries efficiently
- Mobile apps benefit from GraphQL's flexible data fetching
- Hybrid approach provides best tool for each use case

### 1.3 Authentication & Authorization

**Strategy**: JWT-based authentication with refresh tokens

**Components**:
- **Access Tokens**: Short-lived (15 minutes), JWT format, stateless validation
- **Refresh Tokens**: Long-lived (7 days), stored in Redis with rotation
- **Token Payload**: UserID, Role, MarketID, Permissions, SessionID
- **Session Management**: Redis-based session tracking
- **SSO Ready**: SAML 2.0/OAuth 2.0 adapter pattern for future integration

**Authorization**: Role-Based Access Control (RBAC)
- Roles: UFO, Corporate Admin, Super Admin, Market Admin
- Permissions: Granular permissions per resource (e.g., content.create, analytics.view)
- Implementation: Custom middleware + Casbin for complex policies

**Password Security**:
- bcrypt hashing (cost factor 12)
- Password complexity requirements
- MFA ready (TOTP-based, optional)

### 1.4 Caching Strategy: Redis

**Use Cases**:
1. **Session Storage**: User sessions and refresh tokens (TTL-based)
2. **Content Metadata Cache**: Frequently accessed content (15-minute TTL)
3. **Rate Limiting**: Token bucket algorithm per user/IP
4. **API Response Cache**: GET endpoints for content library (cache-aside pattern)
5. **Real-time Counters**: Share counts, engagement metrics
6. **Distributed Locks**: For deduplication and concurrent operations

**Cache Invalidation**:
- Event-driven invalidation on content updates
- Time-based expiration for user data
- Manual purge via admin API

**Configuration**:
- Redis Cluster for high availability
- Separate Redis instance for sessions vs. cache
- Persistence: RDB snapshots + AOF for session data

### 1.5 Message Queue: Bull + Redis

**Selected Solution**: Bull.js (Node.js) backed by Redis

**Queues**:
1. **Share Queue**: Process share events, generate tracking links
2. **Engagement Queue**: Process click/view events
3. **Notification Queue**: Deliver in-app and email notifications
4. **Analytics Queue**: Aggregate engagement data
5. **Email Queue**: Send transactional emails
6. **SMS Queue**: Send SMS via provider integrations
7. **Import Queue**: Process contact CSV imports

**Features**:
- Job priorities and delays
- Retry logic with exponential backoff
- Job progress tracking
- Dead letter queue for failed jobs
- Scheduled jobs for periodic tasks (daily reports, content expiration)

**Alternative Considered**: RabbitMQ, AWS SQS
- Decision: Bull chosen for simplicity, Redis integration, and Node.js ecosystem

### 1.6 Email/SMS Provider Integration

**Architecture Pattern**: Strategy pattern with provider abstraction

**Email Integration**:
- **Primary Provider**: SendGrid or AWS SES
- **Abstraction Layer**: `IEmailProvider` interface
- **Features**:
  - Transactional emails (password reset, notifications)
  - Marketing emails (content shares via system)
  - Template management
  - Open/click tracking (compliant)
  - Bounce/complaint handling via webhooks

**SMS Integration**:
- **Primary Provider**: Twilio
- **Secondary/International**: AWS SNS, local providers per market
- **Abstraction Layer**: `ISmsProvider` interface
- **Features**:
  - Shortlink generation
  - Delivery receipts
  - Opt-out handling
  - Country-specific routing

**Implementation**:
```typescript
interface IMessagingProvider {
  sendEmail(params: EmailParams): Promise<MessageResult>;
  sendSms(params: SmsParams): Promise<MessageResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}
```

**Multi-Market Support**:
- Provider selection by market configuration
- Message templates per market/language
- Compliance rules per jurisdiction

---

## 2. Service Architecture

### 2.1 Architecture Decision: Modular Monolith

**Chosen Approach**: Modular Monolith with Service Domains

**Rationale**:
- **Phase 1 Needs**: Fast development, simpler deployment, lower operational complexity
- **Future Flexibility**: Clear service boundaries enable microservices extraction later
- **Team Size**: Easier for small teams to manage
- **Data Consistency**: Simplified transactions within single database
- **Performance**: No network overhead between services initially

**Service Boundaries** (within monolith):
Each service is a separate module with:
- Dedicated database schema/tables
- Clear API interfaces
- Independent business logic
- Event publishing capabilities

**Migration Path to Microservices**:
- Services communicate via internal event bus (EventEmitter → Kafka later)
- Database per service schema (future DB split possible)
- API Gateway ready (currently single Express app, can split later)

### 2.2 Service Domains

#### Authentication Service
**Responsibilities**:
- User login/logout
- Token generation and validation
- Password management
- Session management
- MFA (future)
- SSO integration (future)

**Key Operations**:
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password/reset`
- `GET /auth/session`

#### Content Service
**Responsibilities**:
- Content metadata management
- Content library queries
- Content search and filtering
- Category/tag management
- Campaign association
- Content approval workflow
- Asset URL generation

**Key Operations**:
- `GET /content` (list with filters)
- `GET /content/:id`
- `POST /content` (admin)
- `PUT /content/:id` (admin)
- `DELETE /content/:id` (admin)
- `GET /content/featured`
- `GET /content/categories`
- `GET /content/search`

#### Sharing Service
**Responsibilities**:
- Share event creation
- Tracking link generation
- Share history
- Channel-specific share logic
- Share template rendering
- Recipient management

**Key Operations**:
- `POST /shares` (create share)
- `GET /shares` (user's share history)
- `GET /shares/:id`
- `POST /shares/preview` (preview before sending)
- `GET /shares/templates/:channel`

#### Tracking Service
**Responsibilities**:
- Tracking link redirect handling
- Click/view event capture
- Engagement event processing
- Analytics aggregation
- Event storage
- Real-time engagement updates

**Key Operations**:
- `GET /t/:shortcode` (redirect and track)
- `POST /tracking/events` (beacon endpoint)
- `GET /tracking/shares/:shareId/events`
- `GET /tracking/content/:contentId/analytics`

#### Contact Service
**Responsibilities**:
- Contact CRUD operations
- Contact import/export
- Contact deduplication
- Contact search
- Contact tagging
- Relationship management
- Consent/opt-in tracking

**Key Operations**:
- `POST /contacts`
- `GET /contacts`
- `GET /contacts/:id`
- `PUT /contacts/:id`
- `DELETE /contacts/:id`
- `POST /contacts/import`
- `POST /contacts/merge`

#### Engagement Service
**Responsibilities**:
- Engagement analytics calculation
- Top performers identification
- Follow-up opportunity detection
- Engagement scoring
- Contact warming/cooling detection
- Reporting aggregations

**Key Operations**:
- `GET /engagement/dashboard`
- `GET /engagement/contacts/:contactId`
- `GET /engagement/top-content`
- `GET /engagement/follow-ups`
- `GET /engagement/leaderboard`

#### Notification Service
**Responsibilities**:
- Notification creation
- Notification delivery
- Push notification routing (future)
- Email notification sending
- In-app notification management
- Notification preferences
- Nudge rule execution

**Key Operations**:
- `GET /notifications` (user's notifications)
- `PUT /notifications/:id/read`
- `GET /notifications/preferences`
- `PUT /notifications/preferences`
- `POST /notifications/test` (admin)

#### Admin Service
**Responsibilities**:
- Content administration
- User management
- Role/permission management
- System settings
- Compliance rule configuration
- Market/language configuration
- Reporting and analytics

**Key Operations**:
- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/reports/usage`
- `GET /admin/reports/engagement`
- `GET /admin/system/health`
- `PUT /admin/settings`

#### Integration Service
**Responsibilities**:
- External system adapters
- User data sync
- Product catalog sync
- Media repository integration
- CMS integration
- Webhook management
- API client abstraction

**Key Operations**:
- `POST /integrations/sync/users`
- `POST /integrations/sync/products`
- `GET /integrations/status`
- `POST /integrations/webhooks/:provider`

### 2.3 Inter-Service Communication

**Within Monolith**: Event-Driven + Direct Calls

**Pattern 1: Synchronous (Direct Method Calls)**
- Used for: Reading data, immediate validations
- Example: Sharing Service → Content Service (get content details)

**Pattern 2: Asynchronous (Internal Event Bus)**
- Used for: Side effects, notifications, analytics
- Implementation: Node.js EventEmitter (Phase 1) → Redis Pub/Sub or Kafka (future)
- Example Events:
  - `share.created` → triggers notification, analytics update
  - `engagement.recorded` → triggers follow-up detection
  - `content.published` → triggers cache invalidation
  - `user.registered` → triggers welcome notification

**Event Structure**:
```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  metadata: {
    userId?: string;
    correlationId: string;
    causationId?: string;
  };
}
```

**Benefits**:
- Loose coupling between services
- Audit trail via event log
- Easy to add new subscribers
- Replay capability for analytics

### 2.4 Future Microservices Migration Path

**Services to Extract First** (when needed):
1. **Tracking Service**: High volume, independent scaling needs
2. **Notification Service**: Background processing, separate lifecycle
3. **Analytics Service**: Resource-intensive computations

**Migration Strategy**:
- Extract service code (already modular)
- Split database schema to separate DB
- Replace internal events with message queue (Kafka/RabbitMQ)
- Add API gateway for routing
- Deploy independently

---

## 3. Integration Layer Design

### 3.1 Adapter Pattern Architecture

**Design Philosophy**: Abstract external dependencies behind interfaces

**Adapter Categories**:

#### User Database Adapter
**Purpose**: Integrate with existing user/member system

**Interface**:
```typescript
interface IUserAdapter {
  getUserById(ufoid: string): Promise<UserProfile>;
  searchUsers(criteria: UserSearchCriteria): Promise<UserProfile[]>;
  validateCredentials(username: string, password: string): Promise<AuthResult>;
  syncUser(ufoid: string): Promise<void>;
}
```

**Implementation Options**:
- Direct SQL queries (if SQL Server)
- REST API calls (if exposed)
- LDAP/Active Directory (for auth)
- Database views/stored procedures

**Caching Strategy**:
- Cache user profiles for 1 hour
- Invalidate on explicit sync

#### Product Catalog Adapter
**Purpose**: Fetch product information for content

**Interface**:
```typescript
interface IProductAdapter {
  getProduct(productId: string): Promise<Product>;
  getProducts(filters: ProductFilters): Promise<Product[]>;
  getProductAvailability(productId: string, market: string): Promise<Availability>;
}
```

**Integration Methods**:
- REST API
- Database read replica
- GraphQL endpoint (if available)

#### Media Repository Adapter
**Purpose**: Access corporate media assets

**Interface**:
```typescript
interface IMediaAdapter {
  getAssetUrl(assetId: string, variant?: string): Promise<string>;
  getAssetMetadata(assetId: string): Promise<AssetMetadata>;
  uploadAsset(file: Buffer, metadata: AssetMetadata): Promise<string>;
}
```

**Storage Options**:
- AWS S3 or Azure Blob Storage
- Existing DAM (Digital Asset Management) system
- CDN integration for delivery

#### CMS Adapter
**Purpose**: Sync approved content from corporate CMS

**Interface**:
```typescript
interface ICmsAdapter {
  getContent(contentId: string): Promise<CmsContent>;
  syncContent(since?: Date): Promise<CmsContent[]>;
  handleWebhook(payload: WebhookPayload): Promise<void>;
}
```

**Integration Strategy**:
- Webhook-based real-time sync (preferred)
- Scheduled polling (fallback)
- Manual import tool

### 3.2 Error Handling & Retry Logic

**Strategy**: Resilient integration with graceful degradation

**Retry Policy**:
```typescript
interface RetryPolicy {
  maxRetries: 3;
  initialDelay: 1000; // ms
  backoffMultiplier: 2;
  maxDelay: 30000; // ms
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'HTTP_502',
    'HTTP_503',
    'HTTP_504'
  ];
}
```

**Circuit Breaker Pattern**:
```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5; // failures before opening
  resetTimeout: 60000; // ms before attempting half-open
  monitoringPeriod: 120000; // ms
}
```

**States**:
- **Closed**: Normal operation, requests pass through
- **Open**: Too many failures, requests fail fast
- **Half-Open**: Testing if service recovered

**Implementation**: Use `opossum` library

**Fallback Strategies**:
1. **Cached Data**: Return stale data if external service unavailable
2. **Default Values**: Use sensible defaults
3. **Degraded Mode**: Disable non-critical features
4. **User Notification**: Inform users of limited functionality

**Error Response Format**:
```json
{
  "error": {
    "code": "INTEGRATION_ERROR",
    "message": "Unable to fetch user data",
    "source": "UserAdapter",
    "retryable": true,
    "details": {
      "upstreamService": "MemberDatabase",
      "upstreamError": "Connection timeout"
    }
  }
}
```

### 3.3 Integration Monitoring

**Health Checks**:
- `GET /health` - Overall system health
- `GET /health/integrations` - Per-adapter status

**Metrics to Track**:
- Request success/failure rate per adapter
- Response time percentiles (p50, p95, p99)
- Circuit breaker state changes
- Retry counts
- Cache hit/miss rates

**Alerting**:
- Circuit breaker opens
- Error rate exceeds threshold
- Response time degradation

---

## 4. Security Architecture

### 4.1 JWT & Session Management

**Token Strategy**: Dual-token approach

**Access Token**:
```typescript
interface AccessTokenPayload {
  sub: string; // userId
  role: string;
  marketId: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number; // 15 minutes
}
```

**Refresh Token**:
- Stored in Redis: `session:{sessionId}` → { userId, refreshToken, deviceInfo }
- TTL: 7 days
- Rotation: New refresh token issued on each refresh
- Family tracking: Detect token reuse attacks

**Token Storage** (Client):
- Access token: Memory only (React state)
- Refresh token: HttpOnly cookie (secure, sameSite: strict)

**Session Management**:
```typescript
interface Session {
  sessionId: string;
  userId: string;
  refreshToken: string;
  createdAt: Date;
  lastActivity: Date;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId?: string;
  };
  expiresAt: Date;
}
```

**Session Features**:
- Concurrent session limit (5 per user)
- Active session management (view/revoke)
- Suspicious activity detection
- Force logout on password change

### 4.2 Role-Based Access Control (RBAC)

**Roles**:

| Role | Permissions |
|------|-------------|
| **UFO** | Browse content, share content, manage own contacts, view own analytics |
| **Market Admin** | UFO permissions + manage users in market, view market analytics |
| **Corporate Admin** | Manage all content, campaigns, view all analytics, manage compliance rules |
| **Super Admin** | All permissions + system settings, integrations, user management |

**Permission Model**:
```typescript
enum Permission {
  // Content
  CONTENT_VIEW = 'content:view',
  CONTENT_CREATE = 'content:create',
  CONTENT_EDIT = 'content:edit',
  CONTENT_DELETE = 'content:delete',
  CONTENT_PUBLISH = 'content:publish',

  // Sharing
  SHARE_CREATE = 'share:create',
  SHARE_VIEW_OWN = 'share:view:own',
  SHARE_VIEW_ALL = 'share:view:all',

  // Contacts
  CONTACT_MANAGE_OWN = 'contact:manage:own',
  CONTACT_VIEW_ALL = 'contact:view:all',

  // Analytics
  ANALYTICS_VIEW_OWN = 'analytics:view:own',
  ANALYTICS_VIEW_ALL = 'analytics:view:all',

  // Admin
  USER_MANAGE = 'user:manage',
  SYSTEM_SETTINGS = 'system:settings',

  // Reporting
  REPORT_VIEW_MARKET = 'report:view:market',
  REPORT_VIEW_ALL = 'report:view:all',
}
```

**Authorization Middleware**:
```typescript
const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // from auth middleware
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage
router.post('/content',
  authenticate,
  requirePermission(Permission.CONTENT_CREATE),
  createContent
);
```

**Resource-Based Authorization**:
- Users can only access their own shares/contacts
- Market admins can only access users in their market
- Check ownership in controller/service layer

### 4.3 API Security Best Practices

**Input Validation**:
- Use Joi or Zod for schema validation
- Sanitize all user inputs
- Validate content type headers
- File upload restrictions (type, size)

**Rate Limiting**:
```typescript
const rateLimits = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 login attempts per 15min
  api: { windowMs: 1 * 60 * 1000, max: 100 }, // 100 requests per minute
  share: { windowMs: 60 * 60 * 1000, max: 500 }, // 500 shares per hour
  upload: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 uploads per hour
};
```

**CORS Policy**:
```typescript
const corsOptions = {
  origin: [
    'https://app.unfranchise.com',
    'https://admin.unfranchise.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

**Security Headers** (using Helmet.js):
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- X-XSS-Protection

**SQL Injection Prevention**:
- Use parameterized queries (TypeORM/Prisma)
- Never concatenate user input into queries
- Use ORM query builders

**XSS Prevention**:
- Escape output in templates
- Use Content-Security-Policy
- Sanitize rich text inputs

**CSRF Protection**:
- Use SameSite cookies
- CSRF tokens for state-changing operations
- Double-submit cookie pattern

### 4.4 Secrets Management

**Strategy**: Environment-based configuration with secure storage

**Secrets Categories**:
1. Database credentials
2. JWT signing keys
3. API keys (SendGrid, Twilio, etc.)
4. OAuth client secrets
5. Encryption keys

**Storage Solutions**:

**Development**: `.env` files (git-ignored)

**Production**:
- **Preferred**: AWS Secrets Manager or Azure Key Vault
- **Alternative**: HashiCorp Vault
- **Fallback**: Environment variables in container orchestration

**Secret Rotation**:
- JWT keys: Rotate every 90 days, support multiple active keys
- API keys: Rotate per provider recommendations
- Database passwords: Rotate every 180 days

**Access Pattern**:
```typescript
class SecretManager {
  async getSecret(key: string): Promise<string> {
    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fetch from secret store
    const secret = await this.secretStore.get(key);

    // Cache with TTL
    this.cache.set(key, secret, { ttl: 3600 });

    return secret;
  }
}
```

**Encryption at Rest**:
- Database: Transparent Data Encryption (TDE) for SQL Server
- Files: Server-side encryption for S3/Azure Storage
- Sensitive fields: AES-256 encryption (e.g., contact notes)

**Encryption in Transit**:
- TLS 1.3 for all API endpoints
- Certificate pinning for mobile apps (future)

---

## 5. Data Model & Database Design

### 5.1 Database Selection: Microsoft SQL Server

**Justification**:
- Enterprise-grade reliability
- Excellent performance for transactional workloads
- Strong ACID guarantees
- Built-in full-text search
- Native JSON support
- Existing organizational expertise
- Integration with .NET ecosystem if needed

**Version**: SQL Server 2019 or later (for JSON features)

### 5.2 Schema Design

**Schema Organization**: Separate schemas per service domain

**Schemas**:
- `auth` - Authentication and users
- `content` - Content and campaigns
- `sharing` - Share events and tracking
- `contacts` - Contact management
- `engagement` - Analytics and engagement
- `notifications` - Notifications and nudges
- `admin` - System configuration
- `audit` - Audit logs

### 5.3 Core Tables

*See separate DATABASE_SCHEMA.md for detailed table definitions*

**Key Design Decisions**:

1. **Soft Deletes**: Use `deletedAt` timestamp for audit trail
2. **Audit Columns**: All tables include `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
3. **UUIDs**: Use UNIQUEIDENTIFIER for public-facing IDs, INT for internal PKs
4. **Indexing Strategy**:
   - Clustered index on primary key
   - Non-clustered indexes on foreign keys
   - Composite indexes for common query patterns
   - Full-text indexes for search fields

5. **Partitioning** (future):
   - Partition `engagement_events` by date
   - Partition `share_events` by date
   - Improves query performance and archival

---

## 6. API Specification Summary

### 6.1 API Conventions

**Base URL**: `https://api.unfranchise.com/v1`

**HTTP Methods**:
- `GET` - Read resources
- `POST` - Create resources or trigger actions
- `PUT` - Update entire resource
- `PATCH` - Partial update
- `DELETE` - Delete resource

**Response Format**:
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-04T12:00:00Z",
    "requestId": "uuid"
  }
}
```

**Error Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-04T12:00:00Z",
    "requestId": "uuid"
  }
}
```

**Pagination**:
```
GET /content?page=1&limit=20&sort=-createdAt
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Filtering**:
```
GET /content?category=videos&market=US&language=en
```

**Rate Limiting Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643932800
```

### 6.2 Authentication Endpoints

**Login**
```
POST /auth/login
Content-Type: application/json

{
  "username": "ufo12345",
  "password": "securePassword123"
}

Response 200:
{
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "ufoid": "ufo12345",
      "name": "John Doe",
      "role": "UFO",
      "marketId": "US"
    }
  }
}
```

**Refresh Token**
```
POST /auth/refresh
Cookie: refreshToken=xxx

Response 200:
{
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Logout**
```
POST /auth/logout
Authorization: Bearer {token}

Response 204
```

### 6.3 Content Service Endpoints

**List Content**
```
GET /content?page=1&limit=20&category=videos&market=US
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "title": "Product Demo Video",
      "description": "...",
      "thumbnailUrl": "https://...",
      "contentType": "video",
      "category": "product",
      "tags": ["skincare", "demo"],
      "channels": ["sms", "email", "social"],
      "market": "US",
      "language": "en",
      "createdAt": "2026-04-01T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Get Content Detail**
```
GET /content/:id
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "mediaUrl": "https://...",
    "destinationUrl": "https://...",
    "thumbnailUrl": "https://...",
    "contentType": "video",
    "category": "product",
    "tags": ["skincare"],
    "channels": ["sms", "email", "social"],
    "market": "US",
    "language": "en",
    "campaignName": "Spring Launch",
    "ctaType": "learn_more",
    "ctaLabel": "Watch Now",
    "allowPersonalNote": true,
    "complianceFlags": [],
    "createdAt": "2026-04-01T10:00:00Z"
  }
}
```

**Create Content** (Admin)
```
POST /content
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Product Video",
  "description": "...",
  "mediaUrl": "https://...",
  "thumbnailUrl": "https://...",
  "contentType": "video",
  "category": "product",
  "tags": ["new", "featured"],
  "channels": ["sms", "email", "social"],
  "markets": ["US", "CA"],
  "languages": ["en"],
  "campaignId": "uuid",
  "allowPersonalNote": true,
  "publishStatus": "draft"
}

Response 201:
{
  "data": { ... }
}
```

### 6.4 Sharing Service Endpoints

**Create Share**
```
POST /shares
Authorization: Bearer {token}
Content-Type: application/json

{
  "contentId": "uuid",
  "channel": "sms",
  "recipients": [
    {
      "contactId": "uuid",
      "phone": "+1234567890"
    }
  ],
  "personalNote": "Check this out!",
  "sendMethod": "system" // or "manual"
}

Response 201:
{
  "data": {
    "shareId": "uuid",
    "trackingLinks": [
      {
        "recipientId": "uuid",
        "shortUrl": "https://unfrn.ch/abc123",
        "fullUrl": "https://unfranchise.com/content/xyz?t=abc123"
      }
    ],
    "messagePreview": "Check this out! https://unfrn.ch/abc123",
    "status": "sent"
  }
}
```

**Get Share History**
```
GET /shares?page=1&limit=20&startDate=2026-04-01&endDate=2026-04-04
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "contentTitle": "Product Demo",
      "channel": "sms",
      "recipientCount": 3,
      "clicks": 2,
      "views": 1,
      "createdAt": "2026-04-03T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 6.5 Tracking Service Endpoints

**Redirect & Track**
```
GET /t/:shortcode
User-Agent: ...
X-Forwarded-For: ...

Response 302:
Location: https://unfranchise.com/content/xyz
```
*Background: Records click event*

**Tracking Beacon** (for client-side events)
```
POST /tracking/events
Content-Type: application/json

{
  "eventType": "view",
  "trackingCode": "abc123",
  "duration": 45,
  "metadata": {
    "videoProgress": 0.75
  }
}

Response 204
```

**Get Engagement Analytics**
```
GET /tracking/content/:contentId/analytics
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "totalShares": 150,
    "totalClicks": 89,
    "totalViews": 67,
    "clickRate": 0.593,
    "viewRate": 0.447,
    "topChannels": [
      { "channel": "sms", "shares": 80, "clicks": 52 },
      { "channel": "email", "shares": 50, "clicks": 30 },
      { "channel": "social", "shares": 20, "clicks": 7 }
    ],
    "engagementOverTime": [
      { "date": "2026-04-01", "shares": 45, "clicks": 28 },
      { "date": "2026-04-02", "shares": 52, "clicks": 31 }
    ]
  }
}
```

### 6.6 Contact Service Endpoints

**Create Contact**
```
POST /contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "mobile": "+1234567890",
  "relationshipType": "prospect",
  "tags": ["hot_lead"],
  "source": "manual",
  "consentEmail": true,
  "consentSms": true
}

Response 201:
{
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    ...
  }
}
```

**List Contacts**
```
GET /contacts?search=jane&tags=hot_lead&page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "mobile": "+1234567890",
      "relationshipType": "prospect",
      "tags": ["hot_lead"],
      "lastEngagementDate": "2026-04-03T10:00:00Z",
      "engagementScore": 85
    }
  ],
  "pagination": { ... }
}
```

**Import Contacts**
```
POST /contacts/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: contacts.csv

Response 202:
{
  "data": {
    "jobId": "uuid",
    "status": "processing",
    "estimatedCompletion": "2026-04-04T12:05:00Z"
  }
}
```

### 6.7 Engagement Service Endpoints

**Get Dashboard**
```
GET /engagement/dashboard?period=30d
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "totalShares": 245,
    "totalClicks": 178,
    "totalContacts": 56,
    "engagementRate": 0.726,
    "topPerformingContent": [
      {
        "contentId": "uuid",
        "title": "Product Demo",
        "shares": 45,
        "clicks": 38,
        "clickRate": 0.844
      }
    ],
    "hotContacts": [
      {
        "contactId": "uuid",
        "name": "Jane Smith",
        "recentEngagements": 5,
        "lastEngagement": "2026-04-04T09:30:00Z",
        "score": 95
      }
    ],
    "followUpOpportunities": 12
  }
}
```

**Get Follow-up Opportunities**
```
GET /engagement/follow-ups
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "contactId": "uuid",
      "contactName": "John Doe",
      "reason": "clicked_multiple_times",
      "lastEngagement": "2026-04-03T14:00:00Z",
      "daysSinceLastContact": 3,
      "engagementCount": 4,
      "recommendedAction": "Send follow-up message"
    }
  ]
}
```

### 6.8 Notification Service Endpoints

**Get Notifications**
```
GET /notifications?unreadOnly=true&page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "engagement",
      "title": "Jane Smith clicked your link",
      "message": "Jane clicked your Product Demo share 3 times today",
      "actionUrl": "/contacts/uuid",
      "isRead": false,
      "createdAt": "2026-04-04T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Mark as Read**
```
PUT /notifications/:id/read
Authorization: Bearer {token}

Response 204
```

**Get Preferences**
```
GET /notifications/preferences
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "emailNotifications": {
      "engagement": true,
      "contentUpdates": true,
      "followUpReminders": true,
      "dailyDigest": false
    },
    "inAppNotifications": {
      "engagement": true,
      "contentUpdates": true,
      "followUpReminders": true
    }
  }
}
```

### 6.9 Admin Service Endpoints

**Get Usage Report**
```
GET /admin/reports/usage?startDate=2026-04-01&endDate=2026-04-04&groupBy=market
Authorization: Bearer {token}
X-Require-Permission: report:view:all

Response 200:
{
  "data": {
    "totalUsers": 1234,
    "activeUsers": 856,
    "totalShares": 5678,
    "totalClicks": 3421,
    "byMarket": [
      {
        "market": "US",
        "users": 800,
        "shares": 4000,
        "clicks": 2500
      },
      {
        "market": "CA",
        "users": 200,
        "shares": 900,
        "clicks": 550
      }
    ]
  }
}
```

**Manage Users**
```
GET /admin/users?role=UFO&market=US&status=active
Authorization: Bearer {token}
X-Require-Permission: user:manage

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "ufoid": "ufo12345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "UFO",
      "market": "US",
      "status": "active",
      "lastLogin": "2026-04-04T08:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## 7. Non-Functional Requirements

### 7.1 Performance Targets

**API Response Times** (p95):
- Authentication: < 200ms
- Content listing: < 300ms
- Content search: < 500ms
- Share creation: < 400ms
- Tracking redirect: < 100ms
- Analytics queries: < 1000ms

**Database Query Optimization**:
- All queries optimized with proper indexes
- Query execution plans reviewed
- N+1 query prevention via eager loading
- Connection pooling (max 50 connections)

**Caching Strategy**:
- Cache hit rate target: > 80% for content queries
- Cache warming for popular content
- Edge caching for static assets (CloudFront/Fastly)

### 7.2 Scalability

**Horizontal Scaling**:
- Stateless API servers (scale via load balancer)
- Session data in Redis (shared state)
- File uploads to object storage (not local disk)

**Vertical Scaling** (if needed):
- Database read replicas for reporting
- Redis cluster for cache/queue distribution
- Background worker scaling (Bull queue workers)

**Capacity Planning**:
- Initial: 10,000 UFOs, 500K shares/month
- Year 1: 25,000 UFOs, 1.5M shares/month
- Year 3: 50,000 UFOs, 5M shares/month

### 7.3 Reliability

**Availability Target**: 99.5% uptime (43 minutes downtime/month)

**Fault Tolerance**:
- Graceful degradation on integration failures
- Retry logic for transient errors
- Circuit breakers for external dependencies
- Health checks for all critical services

**Backup & Recovery**:
- Database: Automated daily backups, 30-day retention
- Point-in-time recovery (PITR) capability
- Backup restoration tested quarterly
- Redis AOF persistence for session data

**Disaster Recovery**:
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 15 minutes
- Multi-region deployment (future)

### 7.4 Monitoring & Observability

**Logging**:
- Structured JSON logging (Winston or Pino)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation (ELK, Datadog, or CloudWatch)
- Correlation IDs for request tracing

**Metrics**:
- Application metrics: Request rate, error rate, latency
- Business metrics: Shares created, click rate, active users
- Infrastructure metrics: CPU, memory, disk, network
- Database metrics: Query time, connection pool, deadlocks

**Tracing**:
- Distributed tracing (OpenTelemetry)
- End-to-end request tracking
- Performance bottleneck identification

**Alerting**:
- Error rate > 5% for 5 minutes
- Response time p95 > 1000ms for 5 minutes
- Database connection pool exhaustion
- External integration failures
- Disk space < 20%

**Dashboards**:
- Operations dashboard (system health)
- Business dashboard (key metrics)
- User activity dashboard
- Content performance dashboard

---

## 8. Development & Deployment

### 8.1 Development Environment

**Local Setup**:
- Docker Compose for local dependencies (SQL Server, Redis)
- Node.js 18+ LTS
- TypeScript 5.x
- Hot reload for development

**Environment Variables**:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=mssql://localhost:1433/unfranchise
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret
```

### 8.2 CI/CD Pipeline

**Stages**:
1. **Lint**: ESLint + Prettier
2. **Type Check**: TypeScript compiler
3. **Test**: Unit tests (Jest) + Integration tests
4. **Build**: Compile TypeScript, bundle assets
5. **Security Scan**: Dependency vulnerabilities (Snyk)
6. **Deploy**:
   - Dev (auto on main branch)
   - Staging (auto on release branch)
   - Production (manual approval)

**Tools**: GitHub Actions or GitLab CI

### 8.3 Deployment Architecture

**Infrastructure**:
- **Compute**: AWS ECS (Fargate) or Azure Container Instances
- **Database**: AWS RDS SQL Server or Azure SQL Database
- **Cache**: AWS ElastiCache (Redis) or Azure Cache for Redis
- **Storage**: AWS S3 or Azure Blob Storage
- **CDN**: CloudFront or Azure CDN
- **Load Balancer**: AWS ALB or Azure Application Gateway

**Environments**:
- **Development**: Single instance, shared resources
- **Staging**: Production-like, scaled down
- **Production**: Multi-AZ, auto-scaling, HA

**Container Strategy**:
- Docker images for API server
- Multi-stage builds for optimization
- Image scanning for vulnerabilities
- Semantic versioning for images

---

## 9. Testing Strategy

### 9.1 Test Types

**Unit Tests**:
- Coverage target: > 80%
- Test business logic in isolation
- Mock external dependencies
- Framework: Jest

**Integration Tests**:
- Test API endpoints end-to-end
- Test database operations
- Test external integrations with mocks
- Framework: Jest + Supertest

**E2E Tests**:
- Test critical user flows
- Test against staging environment
- Framework: Playwright or Cypress

**Performance Tests**:
- Load testing with k6 or Artillery
- Baseline performance benchmarks
- Regression testing on releases

### 9.2 Test Data Management

**Seed Data**:
- Sample users (all roles)
- Sample content library
- Sample contacts and shares
- Consistent across environments

**Test Fixtures**:
- Reusable test data builders
- Factory pattern for entities
- Database reset between test suites

---

## 10. Migration & Rollout Strategy

### 10.1 Data Migration

**User Data**:
- Sync from existing member database
- Map UFOID to new user IDs
- Migrate essential profile data only

**Content Data**:
- Import existing approved content
- Migrate media URLs from asset repository
- Categorize and tag content

**Migration Tools**:
- One-time migration scripts
- Idempotent operations (re-runnable)
- Validation and reconciliation reports

### 10.2 Phased Rollout

**Phase 1: Pilot** (Month 1-2)
- 50-100 selected UFOs
- Single market (e.g., US)
- Focus on content sharing
- Gather feedback

**Phase 2: Expanded Pilot** (Month 3)
- 500 UFOs
- 2-3 markets
- Add contact management features
- Refine based on feedback

**Phase 3: General Availability** (Month 4-6)
- All UFOs
- All markets
- Full feature set
- Marketing campaign

---

## 11. Future Enhancements

### 11.1 Mobile App Support

**API Readiness**:
- All endpoints support mobile clients
- Token-based auth for mobile
- Push notification infrastructure
- Deep linking support

**Mobile-Specific Features**:
- Device contact sync
- Native share sheets
- Offline mode
- Biometric authentication

### 11.2 AI/ML Capabilities

**Recommendation Engine**:
- Content recommendations based on performance
- Next-best-action suggestions
- Optimal send time prediction

**Sentiment Analysis**:
- Analyze engagement patterns
- Identify hot/warm/cold contacts
- Predictive follow-up scoring

**Natural Language**:
- AI-assisted message personalization (compliant)
- Automated engagement summaries
- Chatbot for UFO support

### 11.3 Advanced Analytics

**Predictive Analytics**:
- Churn prediction
- Conversion likelihood
- Content performance forecasting

**Data Warehouse**:
- Separate analytical database
- ETL pipeline from operational DB
- Business intelligence tools integration

---

## Conclusion

This backend architecture provides a solid foundation for the UnFranchise Marketing App with:

- **Scalability**: Modular monolith with clear microservices migration path
- **Security**: Robust authentication, authorization, and data protection
- **Reliability**: Resilient integrations, comprehensive error handling
- **Performance**: Caching, optimization, and efficient data access
- **Maintainability**: Clean code structure, comprehensive testing, observability
- **Extensibility**: API-first design, event-driven architecture, plugin-ready

The architecture supports the immediate MVP needs while providing flexibility for future mobile apps, AI enhancements, and global scale.

**Next Steps**:
1. Review and approve architecture
2. Detailed API specification (OpenAPI)
3. Database schema finalization
4. Development environment setup
5. Phase 1 implementation sprint planning
