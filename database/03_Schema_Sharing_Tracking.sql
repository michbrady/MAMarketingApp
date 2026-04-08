/*******************************************************************************
 * UnFranchise Marketing App - Database Schema
 * Microsoft SQL Server 2019+
 *
 * Part 2: Sharing, Tracking, and Contact Management
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. CONTACT MANAGEMENT
 ******************************************************************************/

CREATE TABLE dbo.Contact (
    ContactID BIGINT IDENTITY(1,1) NOT NULL,
    OwnerUserID BIGINT NOT NULL,                     -- UFO who owns this contact

    -- Identity
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    Email NVARCHAR(255) NULL,
    Mobile NVARCHAR(20) NULL,

    -- Additional Info
    CompanyName NVARCHAR(200) NULL,
    JobTitle NVARCHAR(100) NULL,

    -- Relationship
    RelationshipType NVARCHAR(50) NULL,              -- Prospect, Customer, Distributor, Other
    Source NVARCHAR(100) NULL,                       -- Manual, Import, DeviceSync, WebForm

    -- Tags and Notes
    Tags NVARCHAR(500) NULL,                         -- Comma-separated for quick filtering
    Notes NVARCHAR(MAX) NULL,

    -- Consent and Compliance
    EmailOptIn BIT NOT NULL DEFAULT 0,
    SMSOptIn BIT NOT NULL DEFAULT 0,
    MarketingConsentDate DATETIME2(7) NULL,

    -- Engagement Summary
    TotalSharesReceived INT NOT NULL DEFAULT 0,
    TotalEngagements INT NOT NULL DEFAULT 0,
    LastEngagementDate DATETIME2(7) NULL,
    LastContactDate DATETIME2(7) NULL,

    EngagementScore INT NOT NULL DEFAULT 0,          -- Calculated score 0-100

    -- Status
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',   -- Active, Inactive, DoNotContact, Bounced

    -- Deduplication
    ContactHash NVARCHAR(64) NULL,                   -- Hash of email+mobile for dedup
    DuplicateOfContactID BIGINT NULL,                -- Points to master contact if duplicate

    -- Audit
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Contact PRIMARY KEY CLUSTERED (ContactID),
    CONSTRAINT FK_Contact_Owner FOREIGN KEY (OwnerUserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_Contact_DuplicateOf FOREIGN KEY (DuplicateOfContactID) REFERENCES dbo.Contact(ContactID),
    CONSTRAINT CK_Contact_Status CHECK (Status IN ('Lead', 'Prospect', 'Customer', 'TeamMember', 'Active', 'Inactive', 'DoNotContact', 'Bounced')),
    CONSTRAINT CK_Contact_EmailOrMobile CHECK (Email IS NOT NULL OR Mobile IS NOT NULL)
);
GO

CREATE NONCLUSTERED INDEX IX_Contact_Owner_Status ON dbo.Contact(OwnerUserID, Status) INCLUDE (FirstName, LastName, Email);
CREATE NONCLUSTERED INDEX IX_Contact_Email ON dbo.Contact(Email) WHERE Email IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Contact_Mobile ON dbo.Contact(Mobile) WHERE Mobile IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_Contact_EngagementDate ON dbo.Contact(OwnerUserID, LastEngagementDate DESC);
CREATE NONCLUSTERED INDEX IX_Contact_EngagementScore ON dbo.Contact(OwnerUserID, EngagementScore DESC) WHERE Status = 'Active';
CREATE NONCLUSTERED INDEX IX_Contact_Hash ON dbo.Contact(ContactHash) WHERE ContactHash IS NOT NULL;
GO

/*******************************************************************************
 * 2. SHARE EVENTS
 ******************************************************************************/

CREATE TABLE dbo.ShareEvent (
    ShareEventID BIGINT IDENTITY(1,1) NOT NULL,
    ShareGUID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),

    -- Who and What
    UserID BIGINT NOT NULL,                          -- UFO who shared
    ContentItemID BIGINT NOT NULL,

    -- Campaign Association
    CampaignID INT NULL,

    -- Channel
    ShareChannel NVARCHAR(20) NOT NULL,              -- SMS, Email, Social
    SocialPlatform NVARCHAR(50) NULL,                -- Facebook, Instagram, WeChat, WhatsApp, X, etc.

    -- Message Content
    PersonalMessage NVARCHAR(1000) NULL,             -- UFO's custom message
    ShareTemplate NVARCHAR(50) NULL,                 -- Template used

    -- Tracking
    TrackingCode NVARCHAR(50) NOT NULL,              -- Short code for URL

    -- Status
    Status NVARCHAR(20) NOT NULL DEFAULT 'Sent',     -- Sent, Delivered, Failed, Bounced
    FailureReason NVARCHAR(500) NULL,

    -- Analytics Summary (denormalized for performance)
    RecipientCount INT NOT NULL DEFAULT 0,
    ClickCount INT NOT NULL DEFAULT 0,
    UniqueClickCount INT NOT NULL DEFAULT 0,
    ViewCount INT NOT NULL DEFAULT 0,

    -- Timing
    ShareDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    -- Metadata
    UserAgent NVARCHAR(500) NULL,
    IPAddress NVARCHAR(45) NULL,
    DeviceType NVARCHAR(50) NULL,                    -- Desktop, Mobile, Tablet

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ShareEvent PRIMARY KEY CLUSTERED (ShareEventID),
    CONSTRAINT FK_ShareEvent_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_ShareEvent_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ShareEvent_Campaign FOREIGN KEY (CampaignID) REFERENCES dbo.Campaign(CampaignID),
    CONSTRAINT UQ_ShareEvent_GUID UNIQUE (ShareGUID),
    CONSTRAINT UQ_ShareEvent_TrackingCode UNIQUE (TrackingCode),
    CONSTRAINT CK_ShareEvent_Channel CHECK (ShareChannel IN ('SMS', 'Email', 'Social')),
    CONSTRAINT CK_ShareEvent_Status CHECK (Status IN ('Sent', 'Delivered', 'Failed', 'Bounced'))
);
GO

CREATE NONCLUSTERED INDEX IX_ShareEvent_User_Date ON dbo.ShareEvent(UserID, ShareDate DESC);
CREATE NONCLUSTERED INDEX IX_ShareEvent_Content_Date ON dbo.ShareEvent(ContentItemID, ShareDate DESC);
CREATE NONCLUSTERED INDEX IX_ShareEvent_Campaign ON dbo.ShareEvent(CampaignID, ShareDate DESC) WHERE CampaignID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ShareEvent_Channel ON dbo.ShareEvent(ShareChannel, ShareDate DESC);
CREATE NONCLUSTERED INDEX IX_ShareEvent_TrackingCode ON dbo.ShareEvent(TrackingCode);
GO

/*******************************************************************************
 * 3. SHARE RECIPIENTS
 ******************************************************************************/

CREATE TABLE dbo.ShareRecipient (
    ShareRecipientID BIGINT IDENTITY(1,1) NOT NULL,
    ShareEventID BIGINT NOT NULL,

    -- Recipient Identity
    ContactID BIGINT NULL,                           -- If known contact

    -- Fallback if not a saved contact
    RecipientEmail NVARCHAR(255) NULL,
    RecipientMobile NVARCHAR(20) NULL,
    RecipientName NVARCHAR(200) NULL,

    -- Delivery Status
    DeliveryStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Sent, Delivered, Failed, Bounced
    DeliveryDate DATETIME2(7) NULL,
    BounceReason NVARCHAR(500) NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ShareRecipient PRIMARY KEY CLUSTERED (ShareRecipientID),
    CONSTRAINT FK_ShareRecipient_ShareEvent FOREIGN KEY (ShareEventID) REFERENCES dbo.ShareEvent(ShareEventID) ON DELETE CASCADE,
    CONSTRAINT FK_ShareRecipient_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID),
    CONSTRAINT CK_ShareRecipient_Identity CHECK (ContactID IS NOT NULL OR RecipientEmail IS NOT NULL OR RecipientMobile IS NOT NULL)
);
GO

CREATE NONCLUSTERED INDEX IX_ShareRecipient_ShareEvent ON dbo.ShareRecipient(ShareEventID);
CREATE NONCLUSTERED INDEX IX_ShareRecipient_Contact ON dbo.ShareRecipient(ContactID) WHERE ContactID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ShareRecipient_Email ON dbo.ShareRecipient(RecipientEmail) WHERE RecipientEmail IS NOT NULL;
GO

/*******************************************************************************
 * 4. TRACKING LINKS
 ******************************************************************************/

CREATE TABLE dbo.TrackingLink (
    TrackingLinkID BIGINT IDENTITY(1,1) NOT NULL,
    ShareEventID BIGINT NOT NULL,

    -- Link Details
    ShortCode NVARCHAR(50) NOT NULL,                 -- Short URL code
    FullTrackingURL NVARCHAR(1000) NOT NULL,         -- Complete tracking URL
    DestinationURL NVARCHAR(1000) NOT NULL,          -- Where it redirects to

    -- Context
    LinkType NVARCHAR(50) NOT NULL DEFAULT 'Content', -- Content, CTA, Custom

    -- Analytics (denormalized)
    ClickCount INT NOT NULL DEFAULT 0,
    UniqueClickCount INT NOT NULL DEFAULT 0,
    FirstClickDate DATETIME2(7) NULL,
    LastClickDate DATETIME2(7) NULL,

    -- Status
    IsActive BIT NOT NULL DEFAULT 1,
    ExpirationDate DATETIME2(7) NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_TrackingLink PRIMARY KEY CLUSTERED (TrackingLinkID),
    CONSTRAINT FK_TrackingLink_ShareEvent FOREIGN KEY (ShareEventID) REFERENCES dbo.ShareEvent(ShareEventID) ON DELETE CASCADE,
    CONSTRAINT UQ_TrackingLink_ShortCode UNIQUE (ShortCode)
);
GO

CREATE NONCLUSTERED INDEX IX_TrackingLink_ShareEvent ON dbo.TrackingLink(ShareEventID);
CREATE NONCLUSTERED INDEX IX_TrackingLink_ShortCode ON dbo.TrackingLink(ShortCode, IsActive);
CREATE NONCLUSTERED INDEX IX_TrackingLink_Clicks ON dbo.TrackingLink(ClickCount DESC, LastClickDate DESC);
GO

/*******************************************************************************
 * 5. ENGAGEMENT EVENTS
 ******************************************************************************/

CREATE TABLE dbo.EngagementEvent (
    EngagementEventID BIGINT IDENTITY(1,1) NOT NULL,

    -- What was engaged
    ContentItemID BIGINT NOT NULL,
    TrackingLinkID BIGINT NOT NULL,
    ShareEventID BIGINT NULL,                        -- Source share if known

    -- Who engaged
    ContactID BIGINT NULL,                           -- If we can identify the contact

    -- Event Type
    EventType NVARCHAR(50) NOT NULL,                 -- Click, View, VideoStart, VideoComplete, EmailOpen, Download
    EventValue NVARCHAR(255) NULL,                   -- Additional context (e.g., video % watched)

    -- Event Details
    EventDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    -- Technical Details
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    DeviceType NVARCHAR(50) NULL,                    -- Desktop, Mobile, Tablet
    OperatingSystem NVARCHAR(50) NULL,
    Browser NVARCHAR(50) NULL,

    -- Geolocation (optional future enhancement)
    Country NVARCHAR(100) NULL,
    City NVARCHAR(100) NULL,

    -- Session Tracking
    SessionID NVARCHAR(100) NULL,
    IsUniqueVisitor BIT NOT NULL DEFAULT 0,          -- First visit from this IP/device combo

    -- Referrer
    ReferrerURL NVARCHAR(1000) NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_EngagementEvent PRIMARY KEY CLUSTERED (EngagementEventID),
    CONSTRAINT FK_EngagementEvent_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_EngagementEvent_TrackingLink FOREIGN KEY (TrackingLinkID) REFERENCES dbo.TrackingLink(TrackingLinkID),
    CONSTRAINT FK_EngagementEvent_ShareEvent FOREIGN KEY (ShareEventID) REFERENCES dbo.ShareEvent(ShareEventID),
    CONSTRAINT FK_EngagementEvent_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID)
);
GO

CREATE NONCLUSTERED INDEX IX_EngagementEvent_TrackingLink_Date ON dbo.EngagementEvent(TrackingLinkID, EventDate DESC);
CREATE NONCLUSTERED INDEX IX_EngagementEvent_Contact_Date ON dbo.EngagementEvent(ContactID, EventDate DESC) WHERE ContactID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_EngagementEvent_Content_Type ON dbo.EngagementEvent(ContentItemID, EventType, EventDate DESC);
CREATE NONCLUSTERED INDEX IX_EngagementEvent_ShareEvent ON dbo.EngagementEvent(ShareEventID, EventDate DESC) WHERE ShareEventID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_EngagementEvent_Date ON dbo.EngagementEvent(EventDate DESC);
CREATE NONCLUSTERED INDEX IX_EngagementEvent_Session ON dbo.EngagementEvent(SessionID, EventDate) WHERE SessionID IS NOT NULL;
GO

/*******************************************************************************
 * 6. CONTACT TIMELINE (For detailed contact history)
 ******************************************************************************/

CREATE TABLE dbo.ContactTimeline (
    ContactTimelineID BIGINT IDENTITY(1,1) NOT NULL,
    ContactID BIGINT NOT NULL,

    -- Event Classification
    TimelineEventType NVARCHAR(50) NOT NULL,         -- Shared, Clicked, Viewed, Called, Met, Note, StatusChange

    -- References
    ShareEventID BIGINT NULL,
    EngagementEventID BIGINT NULL,

    -- Event Details
    EventTitle NVARCHAR(255) NULL,
    EventDescription NVARCHAR(MAX) NULL,

    EventDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    -- System or Manual
    IsSystemGenerated BIT NOT NULL DEFAULT 1,
    CreatedByUserID BIGINT NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContactTimeline PRIMARY KEY CLUSTERED (ContactTimelineID),
    CONSTRAINT FK_ContactTimeline_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID) ON DELETE CASCADE,
    CONSTRAINT FK_ContactTimeline_ShareEvent FOREIGN KEY (ShareEventID) REFERENCES dbo.ShareEvent(ShareEventID),
    CONSTRAINT FK_ContactTimeline_EngagementEvent FOREIGN KEY (EngagementEventID) REFERENCES dbo.EngagementEvent(EngagementEventID),
    CONSTRAINT FK_ContactTimeline_User FOREIGN KEY (CreatedByUserID) REFERENCES dbo.[User](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContactTimeline_Contact_Date ON dbo.ContactTimeline(ContactID, EventDate DESC);
CREATE NONCLUSTERED INDEX IX_ContactTimeline_EventType ON dbo.ContactTimeline(TimelineEventType, EventDate DESC);
GO

/*******************************************************************************
 * PARTITIONING PREPARATION
 *
 * For high-volume tables, consider partitioning by date.
 * Below is an example partition scheme for ShareEvent table.
 ******************************************************************************/

-- Create partition function for monthly partitioning
-- Uncomment when ready to implement partitioning

/*
CREATE PARTITION FUNCTION PF_MonthlyPartition (DATETIME2(7))
AS RANGE RIGHT FOR VALUES (
    '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
    '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01',
    '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01'
);
GO

CREATE PARTITION SCHEME PS_MonthlyPartition
AS PARTITION PF_MonthlyPartition
ALL TO ([PRIMARY]);
GO
*/

-- To apply partitioning to ShareEvent:
-- 1. Drop the existing clustered index
-- 2. Recreate it with ON PS_MonthlyPartition(ShareDate)
--
-- Note: This is best done during initial deployment or a maintenance window.
