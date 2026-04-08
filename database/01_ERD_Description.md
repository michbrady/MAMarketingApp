# Entity-Relationship Diagram Description
## UnFranchise Marketing App Database Schema

## Core Entity Groups

### 1. Identity & Access Management
- **User**: UFO users, corporate admins, and super admins
- **Role**: Role definitions for RBAC
- **UserSettings**: User-specific preferences and configuration

### 2. Content Management
- **ContentItem**: Core content repository (videos, images, PDFs, landing pages, etc.)
- **ContentCategory**: Hierarchical content categorization
- **ContentTag**: Flexible tagging system for content discovery
- **Campaign**: Marketing campaigns for content grouping
- **Market**: Geographic markets/countries
- **Language**: Supported languages
- **ComplianceRule**: Market-specific compliance requirements

### 3. Sharing & Tracking
- **ShareEvent**: Record of each content share action
- **ShareRecipient**: Recipients of shared content (may or may not be in Contacts)
- **TrackingLink**: Unique trackable URLs for each share
- **Contact**: UFO-owned contact repository

### 4. Engagement & Analytics
- **EngagementEvent**: Click, view, open, and interaction events
- **ActivityFeedItem**: Personalized activity stream items
- **Notification**: System and engagement notifications

### 5. System Administration
- **AuditLog**: Security and administrative audit trail

## Primary Relationships

### User-Centric Relationships
```
User (1) ----< (M) Contact
User (1) ----< (M) ShareEvent
User (1) ----< (M) Notification
User (1) ----< (M) ActivityFeedItem
User (M) >----< (1) Role
User (1) ----< (1) UserSettings
User (1) ----< (M) AuditLog
```

### Content Relationships
```
ContentItem (M) >----< (M) ContentCategory (via ContentItemCategory junction)
ContentItem (M) >----< (M) ContentTag (via ContentItemTag junction)
ContentItem (M) >----< (M) Campaign (via CampaignContent junction)
ContentItem (M) >----< (M) Market (via ContentItemMarket junction)
ContentItem (M) >----< (M) Language (via ContentItemLanguage junction)
ContentItem (1) ----< (M) ShareEvent
ContentItem (1) ----< (M) EngagementEvent
```

### Sharing Flow Relationships
```
ShareEvent (1) ----< (M) ShareRecipient
ShareEvent (1) ----< (1) TrackingLink
ShareEvent (M) >---- (1) User (sharer)
ShareEvent (M) >---- (1) ContentItem
ShareEvent (M) >---- (0..1) Contact (if known contact)
ShareEvent (M) >---- (0..1) Campaign

TrackingLink (1) ----< (M) EngagementEvent
```

### Engagement Relationships
```
EngagementEvent (M) >---- (1) TrackingLink
EngagementEvent (M) >---- (0..1) Contact
EngagementEvent (M) >---- (1) ContentItem
EngagementEvent (M) >---- (0..1) ShareEvent
```

### Notification & Activity Relationships
```
Notification (M) >---- (1) User (recipient)
Notification (M) >---- (0..1) EngagementEvent (trigger)
Notification (M) >---- (0..1) Contact (related contact)

ActivityFeedItem (M) >---- (1) User (owner)
ActivityFeedItem (M) >---- (0..1) Contact
ActivityFeedItem (M) >---- (0..1) ShareEvent
ActivityFeedItem (M) >---- (0..1) EngagementEvent
```

### Compliance & Market Relationships
```
Market (1) ----< (M) User
Market (1) ----< (M) ComplianceRule
Language (1) ----< (M) User (preferred language)
```

## Multi-Tenancy Design

The schema supports multi-tenancy through:
- **Market-based partitioning**: Users and content are scoped to markets
- **Language support**: Content availability by language
- **Compliance rules**: Market-specific regulations

## Indexing Strategy

### Primary Performance Indexes
1. **User lookups**: Email, MemberID, Market+Status
2. **Content discovery**: Category, Tags, Market, Language, PublishStatus, Campaign
3. **Share tracking**: UserID+CreatedDate, ContentID+CreatedDate
4. **Engagement queries**: TrackingLinkID+EventType, ContactID+EventDate
5. **Activity feeds**: UserID+CreatedDate+IsRead
6. **Contact management**: OwnerUserID+Email, OwnerUserID+Mobile

## Partitioning Strategy

For high-volume tables:
- **ShareEvent**: Partition by CreatedDate (monthly or quarterly)
- **EngagementEvent**: Partition by EventDate (monthly)
- **ActivityFeedItem**: Partition by CreatedDate (quarterly)
- **AuditLog**: Partition by EventDate (monthly)

## Data Archival Strategy

- **Hot data**: Last 90 days in primary tables
- **Warm data**: 91-365 days in indexed archived tables
- **Cold data**: 365+ days in compressed archive tables or blob storage
- Archive candidates: EngagementEvent, ShareEvent, ActivityFeedItem, AuditLog
