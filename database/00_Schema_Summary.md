# Database Schema Summary
## UnFranchise Marketing App

## Quick Reference

**Database Name:** `UnFranchiseMarketingApp`
**SQL Server Version:** 2019+ (Compatibility Level 150)
**Total Tables:** 30+
**Total Stored Procedures:** 10+
**Total Views:** 15+

## Table Overview by Category

### 1. Identity & Access (6 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `User` | 10,000 - 100,000 | UFO users and administrators |
| `Role` | 3-10 | Role definitions for RBAC |
| `UserSettings` | 10,000 - 100,000 | User preferences |
| `UserSession` | 1,000 - 10,000 | Active user sessions |
| `UserFavoriteContent` | 10,000 - 500,000 | Bookmarked content |
| `ContentSearchHistory` | 100,000 - 1M | Search analytics |

### 2. Content Management (9 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `ContentItem` | 1,000 - 10,000 | Core content repository |
| `ContentCategory` | 20-100 | Hierarchical categories |
| `ContentTag` | 50-200 | Flexible tagging |
| `Campaign` | 50-500 | Marketing campaigns |
| `ContentItemCategory` | 2,000 - 20,000 | Content-category mapping |
| `ContentItemTag` | 5,000 - 50,000 | Content-tag mapping |
| `CampaignContent` | 500 - 5,000 | Campaign-content mapping |
| `ContentItemMarket` | 5,000 - 50,000 | Content-market availability |
| `ContentItemLanguage` | 5,000 - 50,000 | Content-language availability |

### 3. Sharing & Tracking (4 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `ShareEvent` | 2M - 20M | Share event records (high volume) |
| `ShareRecipient` | 3M - 30M | Share recipients |
| `TrackingLink` | 2M - 20M | Unique tracking URLs |
| `EngagementEvent` | 1M - 10M | Click/view events (high volume) |

### 4. Contact Management (2 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `Contact` | 100K - 1M | UFO contact repository |
| `ContactTimeline` | 500K - 5M | Contact interaction history |

### 5. Notifications & Activity (2 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `Notification` | 500K - 5M | User notifications |
| `ActivityFeedItem` | 1M - 10M | Personalized activity feed |

### 6. Reference Data (3 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `Market` | 7-50 | Geographic markets |
| `Language` | 8-30 | Supported languages |
| `ComplianceRule` | 10-100 | Market-specific regulations |

### 7. Administration (5 tables)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `AuditLog` | 1M - 10M | Security and compliance audit |
| `SystemConfiguration` | 20-100 | System settings |
| `ScheduledJobLog` | 10K - 100K | Job execution history |
| `NudgeRule` | 10-100 | Automated nudge rules |
| `NudgeExecutionLog` | 500K - 5M | Nudge execution tracking |

### 8. API & Monitoring (1 table)
| Table | Rows (Est.) | Purpose |
|-------|-------------|---------|
| `APIRequestLog` | 10M - 100M | API request logging (optional) |

## Critical Relationships

### User-Centric
```
User
├── owns → Contact (1:M)
├── creates → ShareEvent (1:M)
├── receives → Notification (1:M)
├── has → ActivityFeedItem (1:M)
├── has → UserSettings (1:1)
└── belongs to → Market (M:1)
```

### Content Flow
```
ContentItem
├── belongs to → ContentCategory (M:M)
├── tagged with → ContentTag (M:M)
├── available in → Market (M:M)
├── available in → Language (M:M)
├── part of → Campaign (M:M)
├── shared via → ShareEvent (1:M)
└── tracked via → EngagementEvent (1:M)
```

### Sharing Flow
```
ShareEvent
├── created by → User (M:1)
├── shares → ContentItem (M:1)
├── sent to → ShareRecipient (1:M)
├── generates → TrackingLink (1:1)
├── tracks → EngagementEvent (1:M)
└── part of → Campaign (M:1, optional)
```

### Engagement Tracking
```
EngagementEvent
├── tracks → TrackingLink (M:1)
├── for → ContentItem (M:1)
├── from → Contact (M:1, optional)
├── source → ShareEvent (M:1, optional)
└── triggers → Notification (1:M)
```

## Key Indexes

### High-Performance Indexes
- `IX_User_Email` - User authentication
- `IX_ContentItem_PublishStatus` - Content discovery
- `IX_ShareEvent_User_Date` - User dashboard
- `IX_EngagementEvent_TrackingLink_Date` - Engagement tracking
- `IX_Contact_Owner_Status` - Contact management

### Covering Indexes
- `IX_ShareEvent_UserDashboard` - Dashboard queries
- `IX_ShareEvent_ContentPerformance` - Analytics
- `IX_EngagementEvent_ContactEngagement` - Contact detail

### Filtered Indexes
- `IX_User_Email` (WHERE Status = 'Active')
- `IX_ContentItem_Featured` (WHERE IsFeatured = 1)
- `IX_Notification_User_Unread` (WHERE IsArchived = 0)

## Storage Estimates

### By Volume Category

**Low Volume (< 100K rows)**
- Reference tables: Market, Language, Role, ContentCategory, ContentTag
- Configuration: SystemConfiguration, ComplianceRule, NudgeRule
- Total: ~10 MB

**Medium Volume (100K - 1M rows)**
- User, Contact, Campaign, ContentItem
- UserSettings, UserFavoriteContent
- Total: ~500 MB

**High Volume (1M - 10M rows)**
- ShareEvent, EngagementEvent, ActivityFeedItem
- Notification, ContactTimeline, AuditLog
- Total: ~50 GB/year

**Very High Volume (10M+ rows, optional)**
- APIRequestLog
- Total: ~100 GB/year (if enabled)

### Total Storage Projection

| Timeframe | Hot Data | Warm Data | Cold Data | Total |
|-----------|----------|-----------|-----------|-------|
| Year 1 | 15 GB | 5 GB | - | 20 GB |
| Year 2 | 20 GB | 15 GB | 10 GB | 45 GB |
| Year 3 | 25 GB | 25 GB | 30 GB | 80 GB |
| Year 5 | 50 GB | 200 GB | 800 GB | 1,050 GB |

*With compression: ~50% reduction*

## Performance Characteristics

### Query Performance Targets

| Query Type | Target | Notes |
|------------|--------|-------|
| User authentication | < 100ms | Indexed on email |
| Content library | < 500ms | Filtered, paginated |
| User dashboard | < 1s | Denormalized metrics |
| Share creation | < 200ms | Transactional |
| Engagement tracking | < 100ms | High-volume insert |
| Analytics queries | < 5s | Aggregate reports |

### Concurrency

- **Expected concurrent users:** 1,000 - 5,000
- **Peak transactions/second:** 500 - 1,000
- **Read/write ratio:** 80/20 (read-heavy)

### Scalability

- **Partitioning:** ShareEvent, EngagementEvent (by date)
- **Read replicas:** Analytics and reporting
- **Caching:** Redis for active sessions and content library
- **Sharding:** By MarketID (future growth > 100K users)

## Data Retention Policies

### Hot Data (Primary Tables)
- **Retention:** 90 days
- **Access:** Real-time, high performance
- **Tables:** ShareEvent, EngagementEvent, Notification, ActivityFeedItem

### Warm Data (Archive Tables)
- **Retention:** 91-365 days
- **Access:** Occasional reporting
- **Storage:** Archive tables with columnstore indexes

### Cold Data (Long-term Storage)
- **Retention:** 365+ days
- **Access:** Compliance and legal only
- **Storage:** Compressed tables or blob storage

### Permanent Data
- **Retention:** Indefinite
- **Tables:** User, Contact, ContentItem, Campaign, AuditLog (summary)

## Compliance & Security

### Audit Tables
- `AuditLog` - All security-relevant operations
- `APIRequestLog` - API access patterns
- `ScheduledJobLog` - System operations

### Compliance Features
- `ComplianceRule` - Market-specific regulations
- `Contact.EmailOptIn` - Email consent tracking
- `Contact.SMSOptIn` - SMS consent tracking
- `User.MFAEnabled` - Multi-factor authentication

### Data Protection
- Password hashing (PasswordHash, PasswordSalt)
- Session token management
- Encrypted communication (application layer)
- TDE-ready (Transparent Data Encryption)

## API Surface

### Key Stored Procedures

**Authentication & User Management**
- `usp_AuthenticateUser` - Login
- `usp_GetUserDashboard` - Dashboard data

**Content Operations**
- `usp_GetContentLibrary` - Browse content
- No direct content creation via procedure (use application layer)

**Sharing & Tracking**
- `usp_CreateShareEvent` - Create share
- `usp_TrackEngagement` - Track click/view

**Contact Management**
- `usp_UpsertContact` - Create/update contact
- `usp_GetContactEngagementSummary` - Contact details

**Analytics**
- `usp_GetUserAnalytics` - User metrics
- `usp_GetContentPerformanceReport` - Content analytics

### Key Views

**User & Activity**
- `vw_ActiveUsers`
- `vw_UserActivitySummary`
- `vw_UnreadNotifications`

**Content & Performance**
- `vw_PublishedContent`
- `vw_ContentPerformance`
- `vw_CategoryPerformance`

**Engagement & Contacts**
- `vw_ShareEventsDetail`
- `vw_EngagementEventsDetail`
- `vw_HotContacts`
- `vw_ContactSummary`

**Analytics**
- `vw_DailyShareMetrics`
- `vw_MarketPerformance`
- `vw_CampaignPerformance`

## Deployment Checklist

- [ ] Create database with appropriate file sizes
- [ ] Execute schema scripts (02-04)
- [ ] Execute stored procedures (05)
- [ ] Execute views (06)
- [ ] Load seed data (dev) or production data
- [ ] Create database users and assign roles
- [ ] Configure SQL Server Agent jobs
- [ ] Set up backup strategy
- [ ] Enable Query Store
- [ ] Configure monitoring and alerts
- [ ] Test key procedures and views
- [ ] Document connection strings
- [ ] Plan for partitioning (if needed)
- [ ] Set up read replica (if needed)

## Monitoring Recommendations

### Key Metrics to Track

1. **Performance**
   - Query execution time (p95, p99)
   - Index fragmentation
   - Wait statistics
   - Blocking chains

2. **Growth**
   - Table row counts
   - Database size
   - Transaction log usage
   - Partition fill rates

3. **Usage**
   - Active users
   - Shares per day
   - Engagement rate
   - Top content

4. **Health**
   - Failed jobs
   - Backup status
   - Replication lag (if applicable)
   - Error log entries

## Disaster Recovery

### Backup Strategy
- **Full:** Weekly (Sunday 2 AM)
- **Differential:** Daily (2 AM)
- **Transaction Log:** Every 15 minutes

### Recovery Objectives
- **RTO:** < 1 hour (critical data)
- **RPO:** < 15 minutes (transaction log frequency)

### Restore Points
- Pre-deployment backup
- Weekly full backups (4 week retention)
- Daily differential backups (7 day retention)
- Transaction log backups (24 hour retention)

## Version Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-04 | Initial schema | Database Architecture Team |

## Related Documentation

- **[ERD Description](01_ERD_Description.md)** - Detailed entity relationships
- **[Scaling Strategy](08_Scaling_Strategy.md)** - Performance optimization
- **[Deployment Guide](09_Deployment_Guide.md)** - Step-by-step deployment
- **[README](README.md)** - Complete documentation index

---

**Quick Start:** See [README.md](README.md)
**Full Documentation:** See individual SQL scripts and markdown files
**Support:** Consult deployment guide for troubleshooting
