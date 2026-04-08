# UnFranchise Marketing App - Database Documentation

## Overview

This directory contains the complete Microsoft SQL Server database schema, stored procedures, views, and deployment scripts for the UnFranchise Marketing App - a sales enablement and content sharing platform for UnFranchise Owners (UFOs).

## Architecture Highlights

- **Multi-tenant design** supporting multiple markets and languages
- **Event-driven tracking** for shares and engagement
- **Scalable architecture** with partitioning and archival strategies
- **High-performance indexing** optimized for read-heavy workloads
- **Comprehensive auditing** for compliance and security

## Database Structure

### Core Components

1. **Identity & Access Management**
   - User authentication and authorization
   - Role-based access control (RBAC)
   - User preferences and settings

2. **Content Management**
   - Content library with multi-market/language support
   - Categories, tags, and campaigns
   - Compliance rules and restrictions

3. **Sharing & Tracking**
   - Share events across SMS, email, and social channels
   - Unique tracking links for all shares
   - Real-time engagement tracking

4. **Contact Management**
   - UFO-owned contact repository
   - Engagement scoring and follow-up tracking
   - Timeline of all interactions

5. **Notifications & Activity**
   - Personalized activity feeds
   - Smart notifications and nudges
   - Rules-based engagement alerts

6. **Analytics & Reporting**
   - Performance metrics and KPIs
   - User, content, and campaign analytics
   - Market-level reporting

## File Structure

```
database/
├── 01_ERD_Description.md          # Entity-relationship diagram documentation
├── 02_Schema_Core_Tables.sql      # Core tables: Users, Content, Markets, etc.
├── 03_Schema_Sharing_Tracking.sql # Sharing and engagement tracking tables
├── 04_Schema_Notifications_Audit.sql # Notifications, activity, audit tables
├── 05_Stored_Procedures.sql       # Business logic procedures
├── 06_Views.sql                   # Analytical and reporting views
├── 07_Seed_Data.sql               # Sample data for development
├── 08_Scaling_Strategy.md         # Performance and scaling guide
├── 09_Deployment_Guide.md         # Step-by-step deployment instructions
├── 10_Master_Deploy.sql           # Master deployment script
└── README.md                      # This file
```

## Quick Start

### Prerequisites

- Microsoft SQL Server 2019 or later
- SQL Server Management Studio (SSMS) 18.0+
- Appropriate permissions (`sysadmin` for initial setup)

### Basic Deployment

1. **Create the database:**
```sql
CREATE DATABASE UnFranchiseMarketingApp;
```

2. **Execute the master deployment script:**
```sql
-- In SSMS, open and execute:
-- 10_Master_Deploy.sql
```

3. **For development, load seed data:**
```sql
-- Execute: 07_Seed_Data.sql
```

### Detailed Deployment

For production deployments, see [Deployment Guide](09_Deployment_Guide.md) for comprehensive instructions including:
- Environment-specific configuration
- Security setup
- Backup strategy
- Monitoring configuration
- Post-deployment verification

## Key Tables

### User Management
- `User` - UFO users and administrators
- `Role` - Role definitions (UFO, CorporateAdmin, SuperAdmin)
- `UserSettings` - User preferences and notification settings

### Content
- `ContentItem` - Core content repository
- `ContentCategory` - Hierarchical content organization
- `ContentTag` - Flexible tagging system
- `Campaign` - Marketing campaigns

### Sharing & Tracking
- `ShareEvent` - Record of each share action
- `TrackingLink` - Unique trackable URLs
- `EngagementEvent` - Click, view, and interaction events
- `Contact` - UFO contact management

### Reference Data
- `Market` - Countries/regions
- `Language` - Supported languages
- `ComplianceRule` - Market-specific regulations

## Key Stored Procedures

### User Operations
- `usp_AuthenticateUser` - User authentication
- `usp_GetUserDashboard` - User dashboard data

### Content Discovery
- `usp_GetContentLibrary` - Content search and filtering

### Sharing Operations
- `usp_CreateShareEvent` - Create new share
- `usp_TrackEngagement` - Track clicks and views

### Contact Management
- `usp_UpsertContact` - Create or update contact
- `usp_GetContactEngagementSummary` - Contact details with engagement

### Analytics
- `usp_GetUserAnalytics` - User performance metrics
- `usp_GetContentPerformanceReport` - Content analytics

## Key Views

### User Views
- `vw_ActiveUsers` - Active users with profile details
- `vw_UserActivitySummary` - User engagement summary

### Content Views
- `vw_PublishedContent` - Published content catalog
- `vw_ContentPerformance` - Content metrics and analytics

### Engagement Views
- `vw_ShareEventsDetail` - Share events with context
- `vw_EngagementEventsDetail` - Engagement tracking detail
- `vw_HotContacts` - High-engagement contacts needing follow-up

### Analytics Views
- `vw_DailyShareMetrics` - Daily activity metrics
- `vw_MarketPerformance` - Market-level KPIs
- `vw_CampaignPerformance` - Campaign effectiveness

## Performance Optimization

### Indexing Strategy

All high-traffic tables include:
- Clustered indexes on primary keys
- Non-clustered indexes on foreign keys
- Covering indexes for common queries
- Filtered indexes where appropriate

### Partitioning

High-volume tables support partitioning by date:
- `ShareEvent` - Monthly partitions
- `EngagementEvent` - Monthly partitions
- `AuditLog` - Quarterly partitions

See [Scaling Strategy](08_Scaling_Strategy.md) for implementation details.

### Archival

Automated archival process for old data:
- Hot data: Last 90 days (primary tables)
- Warm data: 91-365 days (archive tables)
- Cold data: 365+ days (compressed storage)

## Data Volume Estimates

### Initial Scale (10,000 users)
- **ShareEvent**: ~200,000 records/month
- **EngagementEvent**: ~10,000 records/month
- **Storage**: ~50 GB/year

### Growth Projection (5 years, 28,000 users)
- **Total records**: ~22M+ events
- **Storage**: ~1 TB (500 GB with compression)

See [Scaling Strategy](08_Scaling_Strategy.md) for detailed projections.

## Security Features

- **Role-based access control** (RBAC)
- **Audit logging** for all sensitive operations
- **Compliance rules** by market
- **Password hashing** support
- **MFA-ready** architecture
- **Session management** with expiration

### Security Best Practices

1. Use strong passwords for database users
2. Enable Transparent Data Encryption (TDE) in production
3. Implement SSL/TLS for all connections
4. Regular security audits via `AuditLog` table
5. Restrict `sysadmin` access
6. Regular backup and disaster recovery testing

## Monitoring and Maintenance

### Recommended SQL Server Agent Jobs

1. **Daily Statistics Update** (2:00 AM)
2. **Weekly Index Maintenance** (Sunday 1:00 AM)
3. **Weekly Data Archival** (Saturday 3:00 AM)
4. **Full Database Backup** (Sunday 2:00 AM)
5. **Transaction Log Backup** (Every 15 minutes)

See [Deployment Guide](09_Deployment_Guide.md) for job configuration.

### Performance Monitoring

Monitor these key metrics:
- Query execution time (target: < 1 second for 95%)
- Index fragmentation (rebuild when > 30%)
- Blocking chains (alert on > 10 seconds)
- Database growth rate
- Resource utilization (CPU, memory, I/O)

## Backup and Recovery

### Backup Strategy

- **Full backups**: Weekly (Sunday 2:00 AM)
- **Differential backups**: Daily (2:00 AM)
- **Transaction log backups**: Every 15 minutes

### Recovery Objectives

- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 15 minutes

See [Deployment Guide](09_Deployment_Guide.md) for backup configuration.

## Multi-Market Support

The schema supports multiple markets with:
- Market-specific content availability
- Language localization
- Compliance rules by market
- Time zone support
- Currency support

### Supported Markets (Initial)

- United States (US)
- Canada (CA)
- Taiwan (TW)
- China (CN)
- Australia (AU)
- United Kingdom (UK)
- Mexico (MX)

## API Integration Points

The database is designed to support REST/GraphQL APIs with procedures for:
- User authentication and session management
- Content discovery and search
- Share creation and tracking
- Engagement event recording
- Contact management
- Analytics and reporting

## Development Workflow

### Local Development Setup

1. Create local SQL Server database
2. Execute schema scripts (02-04)
3. Execute stored procedures (05)
4. Execute views (06)
5. Load seed data (07)
6. Begin application development

### Sample Data

Seed data includes:
- 3 roles (UFO, CorporateAdmin, SuperAdmin)
- 7 markets with 8 languages
- 10+ sample users across markets
- 8 content items with categories and tags
- 4 campaigns

## Migration Strategy

### From Existing Systems

If migrating from an existing system:

1. **Extract** data from legacy system
2. **Transform** to match schema (use staging tables)
3. **Load** via bulk insert or SSIS
4. **Validate** data integrity
5. **Update** statistics and rebuild indexes

See data model in [ERD Description](01_ERD_Description.md).

## Troubleshooting

### Common Issues

**Slow queries**
- Check Query Store for resource-intensive queries
- Review and rebuild fragmented indexes
- Update statistics on high-volume tables

**High transaction log growth**
- Verify log backups are running
- Check for long-running transactions
- Review recovery model

**Blocking/Deadlocks**
- Enable Extended Events for blocking detection
- Review transaction isolation levels
- Check for missing indexes

See [Deployment Guide](09_Deployment_Guide.md) for monitoring queries.

## Version History

### Version 1.0 (2026-04-04)
- Initial database schema
- Core tables for users, content, sharing, tracking
- Stored procedures for key operations
- Analytical views
- Seed data for development
- Scaling and deployment documentation

## Contributing

When making schema changes:

1. Document changes in ERD description
2. Update affected stored procedures
3. Update affected views
4. Create migration script for existing databases
5. Update seed data if needed
6. Update documentation

## Support

For questions or issues:
- Review [Deployment Guide](09_Deployment_Guide.md)
- Check [Scaling Strategy](08_Scaling_Strategy.md)
- Review stored procedures for business logic
- Consult [ERD Description](01_ERD_Description.md) for relationships

## License

Copyright © 2026 UnFranchise. All rights reserved.

---

**Database Architecture Team**
Last Updated: 2026-04-04
