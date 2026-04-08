# UnFranchise Marketing App - Database Schema

## Overview

**Database**: Microsoft SQL Server 2019+
**Schema Organization**: Multi-schema design for service separation
**Naming Convention**: snake_case for tables and columns
**Audit Strategy**: Standardized audit columns on all tables

---

## Schema Organization

```
auth            - Authentication and user management
content         - Content library and campaigns
sharing         - Share events and tracking
contacts        - Contact management
engagement      - Analytics and engagement data
notifications   - Notifications and nudges
admin           - System configuration
audit           - Audit logging
```

---

## Common Patterns

### Audit Columns
All tables include these columns:
```sql
created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
created_by      UNIQUEIDENTIFIER NULL
updated_by      UNIQUEIDENTIFIER NULL
deleted_at      DATETIME2 NULL  -- Soft delete
```

### Primary Keys
- Internal: `id INT IDENTITY(1,1) PRIMARY KEY`
- External/Public: `public_id UNIQUEIDENTIFIER DEFAULT NEWID() UNIQUE`

---

## Schema: auth

### Table: auth.users

Stores user accounts and profile information.

```sql
CREATE TABLE auth.users (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Identifiers
    ufoid               NVARCHAR(50) NOT NULL UNIQUE,
    employee_id         NVARCHAR(50) NULL,
    external_id         NVARCHAR(100) NULL,  -- For external system sync

    -- Profile
    email               NVARCHAR(255) NOT NULL UNIQUE,
    email_verified      BIT NOT NULL DEFAULT 0,
    mobile              NVARCHAR(50) NULL,
    mobile_verified     BIT NOT NULL DEFAULT 0,

    first_name          NVARCHAR(100) NOT NULL,
    last_name           NVARCHAR(100) NOT NULL,
    display_name        NVARCHAR(200) NULL,
    avatar_url          NVARCHAR(500) NULL,

    -- Authentication
    password_hash       NVARCHAR(255) NULL,  -- NULL if SSO only
    password_updated_at DATETIME2 NULL,
    mfa_enabled         BIT NOT NULL DEFAULT 0,
    mfa_secret          NVARCHAR(255) NULL,

    -- Location & Market
    market_id           INT NOT NULL,
    language_code       NVARCHAR(10) NOT NULL DEFAULT 'en',
    country_code        NVARCHAR(2) NOT NULL,
    timezone            NVARCHAR(50) NULL,

    -- Status
    status              NVARCHAR(20) NOT NULL DEFAULT 'active',
        -- active, inactive, suspended, pending

    -- Metadata
    last_login_at       DATETIME2 NULL,
    last_login_ip       NVARCHAR(50) NULL,
    login_count         INT NOT NULL DEFAULT 0,

    -- Sync
    sync_source         NVARCHAR(50) NULL,
    synced_at           DATETIME2 NULL,

    -- Audit
    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by          UNIQUEIDENTIFIER NULL,
    updated_by          UNIQUEIDENTIFIER NULL,
    deleted_at          DATETIME2 NULL,

    CONSTRAINT FK_users_market FOREIGN KEY (market_id)
        REFERENCES admin.markets(id),
    CONSTRAINT CK_users_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending'))
);

CREATE NONCLUSTERED INDEX IX_users_ufoid ON auth.users(ufoid);
CREATE NONCLUSTERED INDEX IX_users_email ON auth.users(email);
CREATE NONCLUSTERED INDEX IX_users_market ON auth.users(market_id);
CREATE NONCLUSTERED INDEX IX_users_status ON auth.users(status) WHERE deleted_at IS NULL;
CREATE NONCLUSTERED INDEX IX_users_external_id ON auth.users(external_id) WHERE external_id IS NOT NULL;
```

### Table: auth.roles

Defines user roles.

```sql
CREATE TABLE auth.roles (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name            NVARCHAR(50) NOT NULL UNIQUE,
    display_name    NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500) NULL,

    is_system       BIT NOT NULL DEFAULT 0,  -- Cannot be deleted

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    deleted_at      DATETIME2 NULL
);

-- Seed roles
INSERT INTO auth.roles (name, display_name, is_system) VALUES
    ('ufo', 'UnFranchise Owner', 1),
    ('market_admin', 'Market Administrator', 1),
    ('corporate_admin', 'Corporate Administrator', 1),
    ('super_admin', 'Super Administrator', 1);
```

### Table: auth.permissions

Defines granular permissions.

```sql
CREATE TABLE auth.permissions (
    id              INT IDENTITY(1,1) PRIMARY KEY,

    resource        NVARCHAR(50) NOT NULL,  -- e.g., 'content', 'share', 'user'
    action          NVARCHAR(50) NOT NULL,  -- e.g., 'create', 'read', 'update', 'delete'
    scope           NVARCHAR(50) NULL,      -- e.g., 'own', 'market', 'all'

    code            AS (resource + ':' + action + ISNULL(':' + scope, '')) PERSISTED,
    display_name    NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500) NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT UQ_permissions_code UNIQUE (resource, action, scope)
);

CREATE NONCLUSTERED INDEX IX_permissions_code ON auth.permissions(code);
```

### Table: auth.role_permissions

Maps roles to permissions.

```sql
CREATE TABLE auth.role_permissions (
    role_id         INT NOT NULL,
    permission_id   INT NOT NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES auth.roles(id) ON DELETE CASCADE,
    CONSTRAINT FK_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES auth.permissions(id) ON DELETE CASCADE
);
```

### Table: auth.user_roles

Maps users to roles.

```sql
CREATE TABLE auth.user_roles (
    user_id         INT NOT NULL,
    role_id         INT NOT NULL,

    assigned_by     UNIQUEIDENTIFIER NULL,
    assigned_at     DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id)
        REFERENCES auth.roles(id) ON DELETE CASCADE
);
```

### Table: auth.sessions

Tracks active user sessions.

```sql
CREATE TABLE auth.sessions (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    session_id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    user_id             INT NOT NULL,

    -- Token info
    refresh_token_hash  NVARCHAR(255) NOT NULL,
    token_family        UNIQUEIDENTIFIER NOT NULL,  -- For rotation tracking

    -- Device info
    user_agent          NVARCHAR(500) NULL,
    device_id           NVARCHAR(100) NULL,
    device_type         NVARCHAR(50) NULL,  -- web, ios, android
    ip_address          NVARCHAR(50) NULL,

    -- Activity
    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    last_activity_at    DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at          DATETIME2 NOT NULL,

    -- Status
    is_revoked          BIT NOT NULL DEFAULT 0,
    revoked_at          DATETIME2 NULL,
    revoked_reason      NVARCHAR(100) NULL,

    CONSTRAINT FK_sessions_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX IX_sessions_user ON auth.sessions(user_id);
CREATE NONCLUSTERED INDEX IX_sessions_expires ON auth.sessions(expires_at);
CREATE NONCLUSTERED INDEX IX_sessions_token_family ON auth.sessions(token_family);
```

---

## Schema: content

### Table: content.content_items

Stores content metadata.

```sql
CREATE TABLE content.content_items (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    public_id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Basic Info
    title                   NVARCHAR(200) NOT NULL,
    subtitle                NVARCHAR(300) NULL,
    description             NVARCHAR(2000) NULL,

    -- Media
    thumbnail_url           NVARCHAR(500) NULL,
    media_url               NVARCHAR(500) NULL,
    destination_url         NVARCHAR(500) NULL,

    -- Classification
    content_type            NVARCHAR(50) NOT NULL,
        -- video, image, pdf, landing_page, product, bundle, share_card
    category_id             INT NULL,

    -- Publishing
    publish_status          NVARCHAR(20) NOT NULL DEFAULT 'draft',
        -- draft, review, approved, published, archived
    published_at            DATETIME2 NULL,
    expires_at              DATETIME2 NULL,

    -- Campaign
    campaign_id             INT NULL,

    -- CTA
    cta_type                NVARCHAR(50) NULL,  -- learn_more, shop_now, watch, join
    cta_label               NVARCHAR(100) NULL,

    -- Sharing Settings
    allow_personal_note     BIT NOT NULL DEFAULT 1,
    allow_sms               BIT NOT NULL DEFAULT 1,
    allow_email             BIT NOT NULL DEFAULT 1,
    allow_social            BIT NOT NULL DEFAULT 1,

    -- Compliance
    compliance_flags        NVARCHAR(MAX) NULL,  -- JSON array
    requires_disclaimer     BIT NOT NULL DEFAULT 0,
    disclaimer_text         NVARCHAR(1000) NULL,

    -- Metrics (cached)
    total_shares            INT NOT NULL DEFAULT 0,
    total_clicks            INT NOT NULL DEFAULT 0,
    total_views             INT NOT NULL DEFAULT 0,

    -- Audit
    created_at              DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by              UNIQUEIDENTIFIER NULL,
    updated_by              UNIQUEIDENTIFIER NULL,
    deleted_at              DATETIME2 NULL,

    CONSTRAINT FK_content_category FOREIGN KEY (category_id)
        REFERENCES content.categories(id),
    CONSTRAINT FK_content_campaign FOREIGN KEY (campaign_id)
        REFERENCES content.campaigns(id),
    CONSTRAINT CK_content_status CHECK (publish_status IN
        ('draft', 'review', 'approved', 'published', 'archived'))
);

CREATE NONCLUSTERED INDEX IX_content_status ON content.content_items(publish_status)
    WHERE deleted_at IS NULL;
CREATE NONCLUSTERED INDEX IX_content_type ON content.content_items(content_type);
CREATE NONCLUSTERED INDEX IX_content_category ON content.content_items(category_id);
CREATE NONCLUSTERED INDEX IX_content_campaign ON content.content_items(campaign_id);
CREATE NONCLUSTERED INDEX IX_content_published ON content.content_items(published_at)
    WHERE publish_status = 'published' AND deleted_at IS NULL;
CREATE FULLTEXT INDEX ON content.content_items(title, description)
    KEY INDEX UQ_content_public_id;
```

### Table: content.categories

Content categorization.

```sql
CREATE TABLE content.categories (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name            NVARCHAR(100) NOT NULL,
    slug            NVARCHAR(100) NOT NULL UNIQUE,
    description     NVARCHAR(500) NULL,

    parent_id       INT NULL,
    sort_order      INT NOT NULL DEFAULT 0,

    icon_url        NVARCHAR(500) NULL,
    color           NVARCHAR(7) NULL,  -- Hex color

    is_active       BIT NOT NULL DEFAULT 1,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    deleted_at      DATETIME2 NULL,

    CONSTRAINT FK_categories_parent FOREIGN KEY (parent_id)
        REFERENCES content.categories(id)
);

CREATE NONCLUSTERED INDEX IX_categories_parent ON content.categories(parent_id);
CREATE NONCLUSTERED INDEX IX_categories_slug ON content.categories(slug);
```

### Table: content.tags

Content tags for filtering.

```sql
CREATE TABLE content.tags (
    id              INT IDENTITY(1,1) PRIMARY KEY,

    name            NVARCHAR(50) NOT NULL UNIQUE,
    slug            NVARCHAR(50) NOT NULL UNIQUE,

    usage_count     INT NOT NULL DEFAULT 0,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX IX_tags_name ON content.tags(name);
```

### Table: content.content_tags

Many-to-many relationship between content and tags.

```sql
CREATE TABLE content.content_tags (
    content_id      INT NOT NULL,
    tag_id          INT NOT NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (content_id, tag_id),
    CONSTRAINT FK_content_tags_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id) ON DELETE CASCADE,
    CONSTRAINT FK_content_tags_tag FOREIGN KEY (tag_id)
        REFERENCES content.tags(id) ON DELETE CASCADE
);
```

### Table: content.content_markets

Content availability by market.

```sql
CREATE TABLE content.content_markets (
    content_id      INT NOT NULL,
    market_id       INT NOT NULL,

    is_active       BIT NOT NULL DEFAULT 1,
    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (content_id, market_id),
    CONSTRAINT FK_content_markets_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id) ON DELETE CASCADE,
    CONSTRAINT FK_content_markets_market FOREIGN KEY (market_id)
        REFERENCES admin.markets(id) ON DELETE CASCADE
);
```

### Table: content.content_languages

Content availability by language.

```sql
CREATE TABLE content.content_languages (
    content_id      INT NOT NULL,
    language_code   NVARCHAR(10) NOT NULL,

    title           NVARCHAR(200) NULL,  -- Translated title if different
    description     NVARCHAR(2000) NULL,  -- Translated description
    media_url       NVARCHAR(500) NULL,  -- Language-specific media

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (content_id, language_code),
    CONSTRAINT FK_content_languages_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id) ON DELETE CASCADE
);
```

### Table: content.campaigns

Marketing campaigns.

```sql
CREATE TABLE content.campaigns (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name            NVARCHAR(100) NOT NULL,
    slug            NVARCHAR(100) NOT NULL UNIQUE,
    description     NVARCHAR(1000) NULL,

    start_date      DATETIME2 NULL,
    end_date        DATETIME2 NULL,

    is_active       BIT NOT NULL DEFAULT 1,

    -- Metrics (cached)
    total_content   INT NOT NULL DEFAULT 0,
    total_shares    INT NOT NULL DEFAULT 0,
    total_clicks    INT NOT NULL DEFAULT 0,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by      UNIQUEIDENTIFIER NULL,
    deleted_at      DATETIME2 NULL
);

CREATE NONCLUSTERED INDEX IX_campaigns_slug ON content.campaigns(slug);
CREATE NONCLUSTERED INDEX IX_campaigns_active ON content.campaigns(is_active, start_date, end_date);
```

---

## Schema: sharing

### Table: sharing.share_events

Records each share action.

```sql
CREATE TABLE sharing.share_events (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Who shared
    user_id             INT NOT NULL,

    -- What was shared
    content_id          INT NOT NULL,

    -- How it was shared
    channel             NVARCHAR(20) NOT NULL,  -- sms, email, social
    send_method         NVARCHAR(20) NOT NULL,  -- system, manual

    -- Personalization
    personal_note       NVARCHAR(500) NULL,

    -- Template used
    template_id         INT NULL,

    -- Status
    status              NVARCHAR(20) NOT NULL DEFAULT 'sent',
        -- sent, delivered, failed, bounced

    error_message       NVARCHAR(500) NULL,

    -- Recipients count
    recipient_count     INT NOT NULL DEFAULT 0,

    -- Engagement metrics (cached)
    click_count         INT NOT NULL DEFAULT 0,
    unique_clicks       INT NOT NULL DEFAULT 0,
    view_count          INT NOT NULL DEFAULT 0,

    -- Metadata
    metadata            NVARCHAR(MAX) NULL,  -- JSON

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    deleted_at          DATETIME2 NULL,

    CONSTRAINT FK_share_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id),
    CONSTRAINT FK_share_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id),
    CONSTRAINT CK_share_channel CHECK (channel IN ('sms', 'email', 'social', 'other')),
    CONSTRAINT CK_share_method CHECK (send_method IN ('system', 'manual'))
);

CREATE NONCLUSTERED INDEX IX_share_user ON sharing.share_events(user_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_share_content ON sharing.share_events(content_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_share_channel ON sharing.share_events(channel);
CREATE NONCLUSTERED INDEX IX_share_created ON sharing.share_events(created_at DESC);
```

### Table: sharing.share_recipients

Individual recipients of shares.

```sql
CREATE TABLE sharing.share_recipients (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    share_event_id  INT NOT NULL,

    -- Recipient info
    contact_id      INT NULL,  -- If from contact list
    recipient_email NVARCHAR(255) NULL,
    recipient_phone NVARCHAR(50) NULL,
    recipient_name  NVARCHAR(200) NULL,

    -- Tracking
    tracking_link_id INT NULL,

    -- Delivery
    sent_at         DATETIME2 NULL,
    delivered_at    DATETIME2 NULL,
    failed_at       DATETIME2 NULL,
    failure_reason  NVARCHAR(500) NULL,

    -- External IDs
    provider_message_id NVARCHAR(100) NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_share_recipients_event FOREIGN KEY (share_event_id)
        REFERENCES sharing.share_events(id) ON DELETE CASCADE,
    CONSTRAINT FK_share_recipients_contact FOREIGN KEY (contact_id)
        REFERENCES contacts.contacts(id)
);

CREATE NONCLUSTERED INDEX IX_share_recipients_event ON sharing.share_recipients(share_event_id);
CREATE NONCLUSTERED INDEX IX_share_recipients_contact ON sharing.share_recipients(contact_id);
```

### Table: sharing.tracking_links

Unique tracking links for shares.

```sql
CREATE TABLE sharing.tracking_links (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Link info
    short_code          NVARCHAR(20) NOT NULL UNIQUE,
    full_url            NVARCHAR(1000) NOT NULL,

    -- Association
    share_event_id      INT NOT NULL,
    share_recipient_id  INT NULL,  -- Specific recipient if personalized

    -- Owner
    user_id             INT NOT NULL,
    content_id          INT NOT NULL,

    -- Metadata
    channel             NVARCHAR(20) NOT NULL,
    campaign_id         INT NULL,

    -- Metrics (cached)
    click_count         INT NOT NULL DEFAULT 0,
    unique_clicks       INT NOT NULL DEFAULT 0,
    last_clicked_at     DATETIME2 NULL,

    -- Lifecycle
    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at          DATETIME2 NULL,
    is_active           BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_tracking_share FOREIGN KEY (share_event_id)
        REFERENCES sharing.share_events(id),
    CONSTRAINT FK_tracking_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id),
    CONSTRAINT FK_tracking_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id)
);

CREATE UNIQUE NONCLUSTERED INDEX IX_tracking_short_code ON sharing.tracking_links(short_code);
CREATE NONCLUSTERED INDEX IX_tracking_share ON sharing.tracking_links(share_event_id);
CREATE NONCLUSTERED INDEX IX_tracking_user ON sharing.tracking_links(user_id);
CREATE NONCLUSTERED INDEX IX_tracking_content ON sharing.tracking_links(content_id);
```

### Table: sharing.share_templates

Templates for share messages.

```sql
CREATE TABLE sharing.share_templates (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name            NVARCHAR(100) NOT NULL,
    channel         NVARCHAR(20) NOT NULL,

    -- Template content
    subject         NVARCHAR(200) NULL,  -- For email
    body_template   NVARCHAR(2000) NOT NULL,

    -- Availability
    market_id       INT NULL,
    language_code   NVARCHAR(10) NOT NULL DEFAULT 'en',

    -- Status
    is_active       BIT NOT NULL DEFAULT 1,
    is_default      BIT NOT NULL DEFAULT 0,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by      UNIQUEIDENTIFIER NULL,
    deleted_at      DATETIME2 NULL,

    CONSTRAINT CK_template_channel CHECK (channel IN ('sms', 'email', 'social'))
);

CREATE NONCLUSTERED INDEX IX_templates_channel ON sharing.share_templates(channel, is_active);
CREATE NONCLUSTERED INDEX IX_templates_market ON sharing.share_templates(market_id, language_code);
```

---

## Schema: contacts

### Table: contacts.contacts

User's contact list.

```sql
CREATE TABLE contacts.contacts (
    id                      INT IDENTITY(1,1) PRIMARY KEY,
    public_id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Owner
    user_id                 INT NOT NULL,

    -- Basic info
    first_name              NVARCHAR(100) NOT NULL,
    last_name               NVARCHAR(100) NOT NULL,
    email                   NVARCHAR(255) NULL,
    mobile                  NVARCHAR(50) NULL,

    -- Additional
    company                 NVARCHAR(200) NULL,
    job_title               NVARCHAR(100) NULL,

    -- Classification
    relationship_type       NVARCHAR(50) NOT NULL DEFAULT 'prospect',
        -- prospect, customer, distributor, partner, other
    source                  NVARCHAR(50) NULL,  -- manual, import, sync, referral

    -- Consent
    consent_email           BIT NOT NULL DEFAULT 0,
    consent_sms             BIT NOT NULL DEFAULT 0,
    consent_date            DATETIME2 NULL,

    opt_out_email           BIT NOT NULL DEFAULT 0,
    opt_out_sms             BIT NOT NULL DEFAULT 0,
    opt_out_date            DATETIME2 NULL,

    -- Notes
    notes                   NVARCHAR(MAX) NULL,

    -- Engagement
    engagement_score        INT NOT NULL DEFAULT 0,
    last_engagement_date    DATETIME2 NULL,
    last_contacted_date     DATETIME2 NULL,

    -- Metrics (cached)
    total_shares_received   INT NOT NULL DEFAULT 0,
    total_clicks            INT NOT NULL DEFAULT 0,
    total_views             INT NOT NULL DEFAULT 0,

    -- Status
    is_active               BIT NOT NULL DEFAULT 1,

    -- Audit
    created_at              DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by              UNIQUEIDENTIFIER NULL,
    updated_by              UNIQUEIDENTIFIER NULL,
    deleted_at              DATETIME2 NULL,

    CONSTRAINT FK_contacts_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT CK_contacts_relationship CHECK (relationship_type IN
        ('prospect', 'customer', 'distributor', 'partner', 'other'))
);

CREATE NONCLUSTERED INDEX IX_contacts_user ON contacts.contacts(user_id, deleted_at);
CREATE NONCLUSTERED INDEX IX_contacts_email ON contacts.contacts(email) WHERE email IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_contacts_mobile ON contacts.contacts(mobile) WHERE mobile IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_contacts_engagement ON contacts.contacts(user_id, engagement_score DESC);
CREATE FULLTEXT INDEX ON contacts.contacts(first_name, last_name, company, notes)
    KEY INDEX UQ_contacts_public_id;
```

### Table: contacts.contact_tags

Tags for contacts.

```sql
CREATE TABLE contacts.contact_tags (
    id              INT IDENTITY(1,1) PRIMARY KEY,

    user_id         INT NOT NULL,
    name            NVARCHAR(50) NOT NULL,
    color           NVARCHAR(7) NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_contact_tags_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT UQ_contact_tags_user_name UNIQUE (user_id, name)
);
```

### Table: contacts.contact_tag_assignments

Many-to-many relationship.

```sql
CREATE TABLE contacts.contact_tag_assignments (
    contact_id      INT NOT NULL,
    tag_id          INT NOT NULL,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    PRIMARY KEY (contact_id, tag_id),
    CONSTRAINT FK_contact_tag_assignments_contact FOREIGN KEY (contact_id)
        REFERENCES contacts.contacts(id) ON DELETE CASCADE,
    CONSTRAINT FK_contact_tag_assignments_tag FOREIGN KEY (tag_id)
        REFERENCES contacts.contact_tags(id) ON DELETE CASCADE
);
```

### Table: contacts.import_jobs

Tracks contact import operations.

```sql
CREATE TABLE contacts.import_jobs (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    user_id             INT NOT NULL,

    filename            NVARCHAR(255) NOT NULL,
    file_url            NVARCHAR(500) NULL,

    status              NVARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending, processing, completed, failed

    total_rows          INT NULL,
    processed_rows      INT NOT NULL DEFAULT 0,
    successful_imports  INT NOT NULL DEFAULT 0,
    failed_imports      INT NOT NULL DEFAULT 0,

    error_log           NVARCHAR(MAX) NULL,  -- JSON

    started_at          DATETIME2 NULL,
    completed_at        DATETIME2 NULL,

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_import_jobs_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
);

CREATE NONCLUSTERED INDEX IX_import_jobs_user ON contacts.import_jobs(user_id, created_at DESC);
```

---

## Schema: engagement

### Table: engagement.events

Records all engagement events.

```sql
CREATE TABLE engagement.events (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    -- Event type
    event_type          NVARCHAR(50) NOT NULL,
        -- click, view, video_start, video_complete, email_open, etc.

    -- Associations
    tracking_link_id    INT NULL,
    share_event_id      INT NULL,
    content_id          INT NOT NULL,
    user_id             INT NOT NULL,  -- UFO who created the share
    contact_id          INT NULL,      -- Recipient if known

    -- Event details
    event_data          NVARCHAR(MAX) NULL,  -- JSON (e.g., video progress, page scroll)

    -- Context
    user_agent          NVARCHAR(500) NULL,
    ip_address          NVARCHAR(50) NULL,
    referrer            NVARCHAR(500) NULL,
    device_type         NVARCHAR(50) NULL,  -- desktop, mobile, tablet
    browser             NVARCHAR(100) NULL,
    os                  NVARCHAR(100) NULL,
    country             NVARCHAR(2) NULL,

    -- Session
    session_id          NVARCHAR(100) NULL,  -- Client session for deduplication

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_engagement_tracking FOREIGN KEY (tracking_link_id)
        REFERENCES sharing.tracking_links(id),
    CONSTRAINT FK_engagement_share FOREIGN KEY (share_event_id)
        REFERENCES sharing.share_events(id),
    CONSTRAINT FK_engagement_content FOREIGN KEY (content_id)
        REFERENCES content.content_items(id),
    CONSTRAINT FK_engagement_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id),
    CONSTRAINT FK_engagement_contact FOREIGN KEY (contact_id)
        REFERENCES contacts.contacts(id)
);

CREATE NONCLUSTERED INDEX IX_engagement_tracking ON engagement.events(tracking_link_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_share ON engagement.events(share_event_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_content ON engagement.events(content_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_user ON engagement.events(user_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_contact ON engagement.events(contact_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_type ON engagement.events(event_type, created_at DESC);
CREATE NONCLUSTERED INDEX IX_engagement_created ON engagement.events(created_at DESC);

-- Partition by date (future optimization for high volume)
-- ALTER TABLE engagement.events
-- SWITCH PARTITION TO engagement.events_archive;
```

### Table: engagement.daily_aggregates

Pre-aggregated daily engagement metrics.

```sql
CREATE TABLE engagement.daily_aggregates (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,

    aggregate_date      DATE NOT NULL,

    -- Dimensions
    user_id             INT NULL,
    content_id          INT NULL,
    market_id           INT NULL,
    campaign_id         INT NULL,
    channel             NVARCHAR(20) NULL,

    -- Metrics
    total_shares        INT NOT NULL DEFAULT 0,
    total_clicks        INT NOT NULL DEFAULT 0,
    unique_clicks       INT NOT NULL DEFAULT 0,
    total_views         INT NOT NULL DEFAULT 0,
    unique_views        INT NOT NULL DEFAULT 0,

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT UQ_daily_aggregates UNIQUE (
        aggregate_date,
        ISNULL(user_id, 0),
        ISNULL(content_id, 0),
        ISNULL(market_id, 0),
        ISNULL(campaign_id, 0),
        ISNULL(channel, '')
    )
);

CREATE NONCLUSTERED INDEX IX_daily_agg_date ON engagement.daily_aggregates(aggregate_date DESC);
CREATE NONCLUSTERED INDEX IX_daily_agg_user ON engagement.daily_aggregates(user_id, aggregate_date DESC);
CREATE NONCLUSTERED INDEX IX_daily_agg_content ON engagement.daily_aggregates(content_id, aggregate_date DESC);
```

---

## Schema: notifications

### Table: notifications.notifications

User notifications.

```sql
CREATE TABLE notifications.notifications (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    user_id             INT NOT NULL,

    -- Notification content
    type                NVARCHAR(50) NOT NULL,
        -- engagement, content_update, follow_up, achievement, reminder, system
    title               NVARCHAR(200) NOT NULL,
    message             NVARCHAR(1000) NOT NULL,

    -- Action
    action_url          NVARCHAR(500) NULL,
    action_label        NVARCHAR(100) NULL,

    -- Related entities
    related_content_id  INT NULL,
    related_contact_id  INT NULL,
    related_share_id    INT NULL,

    -- Metadata
    metadata            NVARCHAR(MAX) NULL,  -- JSON

    -- Status
    is_read             BIT NOT NULL DEFAULT 0,
    read_at             DATETIME2 NULL,

    -- Delivery
    sent_via_email      BIT NOT NULL DEFAULT 0,
    sent_via_push       BIT NOT NULL DEFAULT 0,

    -- Priority
    priority            NVARCHAR(20) NOT NULL DEFAULT 'normal',
        -- low, normal, high, urgent

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at          DATETIME2 NULL,

    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT CK_notifications_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE NONCLUSTERED INDEX IX_notifications_user ON notifications.notifications(user_id, is_read, created_at DESC);
CREATE NONCLUSTERED INDEX IX_notifications_type ON notifications.notifications(type, created_at DESC);
```

### Table: notifications.notification_preferences

User notification preferences.

```sql
CREATE TABLE notifications.notification_preferences (
    user_id             INT NOT NULL PRIMARY KEY,

    -- In-app
    in_app_engagement   BIT NOT NULL DEFAULT 1,
    in_app_content      BIT NOT NULL DEFAULT 1,
    in_app_follow_up    BIT NOT NULL DEFAULT 1,
    in_app_system       BIT NOT NULL DEFAULT 1,

    -- Email
    email_engagement    BIT NOT NULL DEFAULT 1,
    email_content       BIT NOT NULL DEFAULT 1,
    email_follow_up     BIT NOT NULL DEFAULT 1,
    email_daily_digest  BIT NOT NULL DEFAULT 0,
    email_weekly_report BIT NOT NULL DEFAULT 1,

    -- Push (future)
    push_engagement     BIT NOT NULL DEFAULT 1,
    push_follow_up      BIT NOT NULL DEFAULT 1,

    -- SMS (future)
    sms_urgent_only     BIT NOT NULL DEFAULT 1,

    updated_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_notification_prefs_user FOREIGN KEY (user_id)
        REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### Table: notifications.nudge_rules

Configurable nudge rules.

```sql
CREATE TABLE notifications.nudge_rules (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    public_id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name                NVARCHAR(100) NOT NULL,
    description         NVARCHAR(500) NULL,

    -- Trigger
    trigger_type        NVARCHAR(50) NOT NULL,
        -- engagement_threshold, inactivity, content_performance, follow_up_due
    trigger_config      NVARCHAR(MAX) NOT NULL,  -- JSON

    -- Notification template
    notification_type   NVARCHAR(50) NOT NULL,
    notification_title  NVARCHAR(200) NOT NULL,
    notification_body   NVARCHAR(1000) NOT NULL,

    -- Targeting
    target_roles        NVARCHAR(MAX) NULL,  -- JSON array
    target_markets      NVARCHAR(MAX) NULL,  -- JSON array

    -- Status
    is_active           BIT NOT NULL DEFAULT 1,

    -- Throttling
    max_per_user_day    INT NULL,

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by          UNIQUEIDENTIFIER NULL,
    deleted_at          DATETIME2 NULL
);
```

---

## Schema: admin

### Table: admin.markets

Geographic markets.

```sql
CREATE TABLE admin.markets (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    code            NVARCHAR(10) NOT NULL UNIQUE,  -- US, CA, UK, etc.
    name            NVARCHAR(100) NOT NULL,

    country_code    NVARCHAR(2) NOT NULL,
    region          NVARCHAR(50) NULL,

    default_language NVARCHAR(10) NOT NULL,
    timezone        NVARCHAR(50) NULL,
    currency        NVARCHAR(3) NULL,

    is_active       BIT NOT NULL DEFAULT 1,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    deleted_at      DATETIME2 NULL
);

CREATE NONCLUSTERED INDEX IX_markets_code ON admin.markets(code);
CREATE NONCLUSTERED INDEX IX_markets_active ON admin.markets(is_active);
```

### Table: admin.settings

System-wide configuration.

```sql
CREATE TABLE admin.settings (
    id              INT IDENTITY(1,1) PRIMARY KEY,

    category        NVARCHAR(50) NOT NULL,  -- e.g., 'email', 'sms', 'sharing', 'security'
    key             NVARCHAR(100) NOT NULL,
    value           NVARCHAR(MAX) NOT NULL,

    data_type       NVARCHAR(20) NOT NULL DEFAULT 'string',
        -- string, number, boolean, json

    description     NVARCHAR(500) NULL,
    is_sensitive    BIT NOT NULL DEFAULT 0,  -- Mask in UI

    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_by      UNIQUEIDENTIFIER NULL,

    CONSTRAINT UQ_settings_key UNIQUE (category, key)
);

CREATE NONCLUSTERED INDEX IX_settings_category ON admin.settings(category);
```

### Table: admin.compliance_rules

Compliance and regulatory rules.

```sql
CREATE TABLE admin.compliance_rules (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    public_id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() UNIQUE,

    name            NVARCHAR(100) NOT NULL,
    description     NVARCHAR(1000) NULL,

    rule_type       NVARCHAR(50) NOT NULL,
        -- content_restriction, channel_restriction, frequency_limit, disclaimer_required

    market_id       INT NULL,  -- NULL = global

    rule_config     NVARCHAR(MAX) NOT NULL,  -- JSON

    is_active       BIT NOT NULL DEFAULT 1,

    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    created_by      UNIQUEIDENTIFIER NULL,
    deleted_at      DATETIME2 NULL,

    CONSTRAINT FK_compliance_market FOREIGN KEY (market_id)
        REFERENCES admin.markets(id)
);
```

---

## Schema: audit

### Table: audit.audit_logs

Comprehensive audit trail.

```sql
CREATE TABLE audit.audit_logs (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,

    -- Who
    user_id             INT NULL,
    user_ufoid          NVARCHAR(50) NULL,
    ip_address          NVARCHAR(50) NULL,
    user_agent          NVARCHAR(500) NULL,

    -- What
    action              NVARCHAR(100) NOT NULL,  -- login, create_content, share, etc.
    entity_type         NVARCHAR(50) NULL,       -- user, content, share, etc.
    entity_id           NVARCHAR(100) NULL,

    -- Details
    description         NVARCHAR(500) NULL,
    old_values          NVARCHAR(MAX) NULL,      -- JSON
    new_values          NVARCHAR(MAX) NULL,      -- JSON

    -- Result
    success             BIT NOT NULL DEFAULT 1,
    error_message       NVARCHAR(1000) NULL,

    -- Context
    request_id          UNIQUEIDENTIFIER NULL,
    session_id          UNIQUEIDENTIFIER NULL,

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX IX_audit_user ON audit.audit_logs(user_id, created_at DESC);
CREATE NONCLUSTERED INDEX IX_audit_action ON audit.audit_logs(action, created_at DESC);
CREATE NONCLUSTERED INDEX IX_audit_entity ON audit.audit_logs(entity_type, entity_id);
CREATE NONCLUSTERED INDEX IX_audit_created ON audit.audit_logs(created_at DESC);

-- Partition by month (for long-term retention and archival)
```

### Table: audit.security_events

Security-specific events.

```sql
CREATE TABLE audit.security_events (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,

    event_type          NVARCHAR(50) NOT NULL,
        -- failed_login, suspicious_activity, token_reuse, unauthorized_access

    user_id             INT NULL,
    username            NVARCHAR(100) NULL,
    ip_address          NVARCHAR(50) NULL,

    severity            NVARCHAR(20) NOT NULL,  -- low, medium, high, critical

    description         NVARCHAR(1000) NOT NULL,
    event_data          NVARCHAR(MAX) NULL,  -- JSON

    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

CREATE NONCLUSTERED INDEX IX_security_events_type ON audit.security_events(event_type, created_at DESC);
CREATE NONCLUSTERED INDEX IX_security_events_severity ON audit.security_events(severity, created_at DESC);
CREATE NONCLUSTERED INDEX IX_security_events_user ON audit.security_events(user_id, created_at DESC);
```

---

## Views

### View: vw_user_dashboard_stats

User dashboard summary.

```sql
CREATE VIEW sharing.vw_user_dashboard_stats AS
SELECT
    u.id AS user_id,
    u.public_id,
    COUNT(DISTINCT se.id) AS total_shares,
    COUNT(DISTINCT ee.id) FILTER (WHERE ee.event_type = 'click') AS total_clicks,
    COUNT(DISTINCT ee.contact_id) AS unique_engaged_contacts,
    MAX(se.created_at) AS last_share_date
FROM auth.users u
LEFT JOIN sharing.share_events se ON se.user_id = u.id AND se.deleted_at IS NULL
LEFT JOIN engagement.events ee ON ee.user_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.public_id;
```

### View: vw_content_performance

Content performance metrics.

```sql
CREATE VIEW content.vw_content_performance AS
SELECT
    c.id AS content_id,
    c.public_id,
    c.title,
    c.content_type,
    c.publish_status,
    COUNT(DISTINCT se.id) AS total_shares,
    COUNT(DISTINCT ee.id) FILTER (WHERE ee.event_type = 'click') AS total_clicks,
    COUNT(DISTINCT ee.id) FILTER (WHERE ee.event_type = 'view') AS total_views,
    CASE
        WHEN COUNT(DISTINCT se.id) > 0
        THEN CAST(COUNT(DISTINCT ee.id) FILTER (WHERE ee.event_type = 'click') AS FLOAT) / COUNT(DISTINCT se.id)
        ELSE 0
    END AS click_rate,
    MAX(se.created_at) AS last_shared_at
FROM content.content_items c
LEFT JOIN sharing.share_events se ON se.content_id = c.id AND se.deleted_at IS NULL
LEFT JOIN engagement.events ee ON ee.content_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.public_id, c.title, c.content_type, c.publish_status;
```

---

## Stored Procedures

### Procedure: sp_record_engagement_event

Efficiently record engagement events and update cached metrics.

```sql
CREATE PROCEDURE engagement.sp_record_engagement_event
    @event_type NVARCHAR(50),
    @tracking_link_id INT,
    @ip_address NVARCHAR(50) = NULL,
    @user_agent NVARCHAR(500) = NULL,
    @event_data NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @share_event_id INT;
    DECLARE @content_id INT;
    DECLARE @user_id INT;
    DECLARE @contact_id INT;

    -- Get related IDs from tracking link
    SELECT
        @share_event_id = share_event_id,
        @content_id = content_id,
        @user_id = user_id
    FROM sharing.tracking_links
    WHERE id = @tracking_link_id;

    -- Get contact from share recipient if exists
    SELECT TOP 1 @contact_id = contact_id
    FROM sharing.share_recipients
    WHERE tracking_link_id = @tracking_link_id;

    -- Insert engagement event
    INSERT INTO engagement.events (
        event_type, tracking_link_id, share_event_id, content_id,
        user_id, contact_id, ip_address, user_agent, event_data
    )
    VALUES (
        @event_type, @tracking_link_id, @share_event_id, @content_id,
        @user_id, @contact_id, @ip_address, @user_agent, @event_data
    );

    -- Update cached metrics
    IF @event_type = 'click'
    BEGIN
        UPDATE sharing.tracking_links
        SET click_count = click_count + 1,
            last_clicked_at = GETUTCDATE()
        WHERE id = @tracking_link_id;

        UPDATE sharing.share_events
        SET click_count = click_count + 1
        WHERE id = @share_event_id;

        UPDATE content.content_items
        SET total_clicks = total_clicks + 1
        WHERE id = @content_id;

        IF @contact_id IS NOT NULL
        BEGIN
            UPDATE contacts.contacts
            SET total_clicks = total_clicks + 1,
                last_engagement_date = GETUTCDATE()
            WHERE id = @contact_id;
        END
    END
END;
```

### Procedure: sp_get_follow_up_opportunities

Identify contacts needing follow-up.

```sql
CREATE PROCEDURE engagement.sp_get_follow_up_opportunities
    @user_id INT,
    @days_threshold INT = 3,
    @min_engagement_score INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.public_id AS contact_id,
        c.first_name + ' ' + c.last_name AS contact_name,
        c.engagement_score,
        c.last_engagement_date,
        c.last_contacted_date,
        DATEDIFF(day, c.last_contacted_date, GETUTCDATE()) AS days_since_contact,
        COUNT(ee.id) AS recent_engagements,
        STRING_AGG(DISTINCT ci.title, ', ') AS engaged_content
    FROM contacts.contacts c
    INNER JOIN engagement.events ee ON ee.contact_id = c.id
    INNER JOIN content.content_items ci ON ci.id = ee.content_id
    WHERE c.user_id = @user_id
        AND c.deleted_at IS NULL
        AND c.engagement_score >= @min_engagement_score
        AND ee.created_at >= DATEADD(day, -7, GETUTCDATE())
        AND (c.last_contacted_date IS NULL
             OR c.last_contacted_date < DATEADD(day, -@days_threshold, GETUTCDATE()))
    GROUP BY
        c.public_id, c.first_name, c.last_name, c.engagement_score,
        c.last_engagement_date, c.last_contacted_date
    ORDER BY c.engagement_score DESC, recent_engagements DESC;
END;
```

---

## Triggers

### Trigger: tr_users_updated

Update timestamp on user modifications.

```sql
CREATE TRIGGER tr_users_updated
ON auth.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE auth.users
    SET updated_at = GETUTCDATE()
    FROM auth.users u
    INNER JOIN inserted i ON u.id = i.id;
END;
```

### Trigger: tr_content_items_updated

Update timestamp and invalidate cache.

```sql
CREATE TRIGGER tr_content_items_updated
ON content.content_items
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE content.content_items
    SET updated_at = GETUTCDATE()
    FROM content.content_items c
    INNER JOIN inserted i ON c.id = i.id;

    -- Could also publish cache invalidation event here
END;
```

---

## Indexes Summary

### Performance Optimization Strategy

1. **Clustered Indexes**: Primary keys (default)
2. **Non-Clustered Indexes**:
   - Foreign keys
   - Frequently filtered columns
   - Common query patterns
3. **Composite Indexes**: Multi-column queries
4. **Filtered Indexes**: WHERE clauses with specific conditions
5. **Full-Text Indexes**: Search functionality

### Maintenance

- **Index Rebuild**: Weekly for high-traffic tables
- **Statistics Update**: Daily
- **Fragmentation Check**: Monitor > 30% fragmentation
- **Missing Index Recommendations**: Review query execution plans quarterly

---

## Data Retention & Archival

### Retention Policies

| Table | Retention Period | Archival Strategy |
|-------|------------------|-------------------|
| engagement.events | 2 years online | Partition by month, archive to cold storage |
| audit.audit_logs | 7 years | Partition by quarter, archive after 2 years |
| notifications.notifications | 90 days | Soft delete, hard delete after 90 days |
| sharing.share_events | Indefinite | Partition old data (>3 years) |

### Archival Process

1. Monthly job to partition old data
2. Copy to archival database/storage
3. Verify data integrity
4. Drop/truncate old partitions
5. Update retention metadata

---

## Backup & Recovery

### Backup Strategy

- **Full Backup**: Daily at 2 AM UTC
- **Differential Backup**: Every 6 hours
- **Transaction Log Backup**: Every 15 minutes
- **Retention**: 30 days online, 1 year in archive

### Recovery Objectives

- **RPO** (Recovery Point Objective): 15 minutes
- **RTO** (Recovery Time Objective): 4 hours
- **Test Restores**: Monthly

---

## Security Considerations

### Encryption

- **At Rest**: Transparent Data Encryption (TDE)
- **In Transit**: TLS 1.3 for all connections
- **Column-Level**: Sensitive fields (e.g., notes with PII)

### Access Control

- **Principle of Least Privilege**: Application accounts have minimal permissions
- **Read-Only Replicas**: For reporting/analytics
- **Audit All DDL**: Schema changes tracked

### Row-Level Security (Future)

Implement RLS for multi-tenant isolation if needed:
```sql
CREATE SECURITY POLICY user_data_filter
ADD FILTER PREDICATE auth.fn_security_predicate(user_id)
ON contacts.contacts;
```

---

## Migration Scripts

### Initial Schema Creation

Run scripts in order:
1. `01_create_schemas.sql`
2. `02_create_admin_tables.sql`
3. `03_create_auth_tables.sql`
4. `04_create_content_tables.sql`
5. `05_create_sharing_tables.sql`
6. `06_create_contacts_tables.sql`
7. `07_create_engagement_tables.sql`
8. `08_create_notifications_tables.sql`
9. `09_create_audit_tables.sql`
10. `10_create_views.sql`
11. `11_create_procedures.sql`
12. `12_create_triggers.sql`
13. `13_seed_data.sql`

### Version Control

- Use migration tool: **Entity Framework Migrations** or **Flyway**
- Track all schema changes in version control
- Test migrations in dev → staging → production

---

## Performance Benchmarks

### Query Performance Targets

| Query Type | Target Time (p95) |
|------------|-------------------|
| User login validation | < 50ms |
| Content listing (paginated) | < 100ms |
| Search content (full-text) | < 200ms |
| Dashboard aggregates | < 500ms |
| Engagement event insert | < 10ms |
| Follow-up opportunities | < 300ms |

### Connection Pooling

- **Min Connections**: 10
- **Max Connections**: 50
- **Connection Lifetime**: 30 minutes
- **Command Timeout**: 30 seconds

---

## Monitoring Queries

### Active Connections
```sql
SELECT
    DB_NAME(dbid) AS database_name,
    COUNT(dbid) AS connection_count
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid;
```

### Blocking Queries
```sql
SELECT
    blocking_session_id,
    session_id,
    wait_type,
    wait_time,
    last_wait_type
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0;
```

### Index Fragmentation
```sql
SELECT
    OBJECT_NAME(ips.object_id) AS table_name,
    i.name AS index_name,
    ips.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'DETAILED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 30
    AND ips.page_count > 1000
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

---

## Conclusion

This database schema provides:

- **Scalability**: Partitioning strategy for high-volume tables
- **Performance**: Comprehensive indexing and caching
- **Flexibility**: JSON fields for extensibility
- **Auditability**: Complete audit trail
- **Security**: Encryption and access controls
- **Maintainability**: Clear structure and documentation

**Next Steps**:
1. Generate actual SQL migration scripts
2. Set up development database
3. Load seed data
4. Performance testing with realistic data volumes
5. Establish backup and monitoring procedures
