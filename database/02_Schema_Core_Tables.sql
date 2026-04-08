/*******************************************************************************
 * UnFranchise Marketing App - Database Schema
 * Microsoft SQL Server 2019+
 *
 * Part 1: Core Tables - Identity, Markets, and Content
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

-- Enable database features
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. REFERENCE DATA TABLES
 ******************************************************************************/

-- Markets (Countries/Regions)
CREATE TABLE dbo.Market (
    MarketID INT IDENTITY(1,1) NOT NULL,
    MarketCode NVARCHAR(10) NOT NULL,                -- US, CA, TW, CN, etc.
    MarketName NVARCHAR(100) NOT NULL,               -- United States, Canada, Taiwan
    CountryCode NVARCHAR(3) NOT NULL,                -- ISO 3166-1 alpha-3
    Region NVARCHAR(50) NULL,                        -- North America, Asia Pacific, etc.
    CurrencyCode NVARCHAR(3) NOT NULL,               -- USD, CAD, TWD
    TimeZone NVARCHAR(50) NOT NULL,                  -- America/New_York, Asia/Taipei
    IsActive BIT NOT NULL DEFAULT 1,
    RequiresCompliance BIT NOT NULL DEFAULT 0,       -- Special compliance requirements
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Market PRIMARY KEY CLUSTERED (MarketID),
    CONSTRAINT UQ_Market_MarketCode UNIQUE (MarketCode)
);
GO

CREATE NONCLUSTERED INDEX IX_Market_Active ON dbo.Market(IsActive, MarketCode);
GO

-- Languages
CREATE TABLE dbo.Language (
    LanguageID INT IDENTITY(1,1) NOT NULL,
    LanguageCode NVARCHAR(10) NOT NULL,              -- en-US, zh-CN, zh-TW
    LanguageName NVARCHAR(100) NOT NULL,             -- English, Chinese Simplified
    NativeName NVARCHAR(100) NOT NULL,               -- English, 简体中文
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Language PRIMARY KEY CLUSTERED (LanguageID),
    CONSTRAINT UQ_Language_LanguageCode UNIQUE (LanguageCode)
);
GO

-- Roles
CREATE TABLE dbo.Role (
    RoleID INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,                  -- UFO, CorporateAdmin, SuperAdmin
    RoleDescription NVARCHAR(255) NULL,
    PermissionLevel INT NOT NULL DEFAULT 1,          -- 1=UFO, 10=CorpAdmin, 100=SuperAdmin
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Role PRIMARY KEY CLUSTERED (RoleID),
    CONSTRAINT UQ_Role_RoleName UNIQUE (RoleName)
);
GO

/*******************************************************************************
 * 2. USER MANAGEMENT
 ******************************************************************************/

CREATE TABLE dbo.[User] (
    UserID BIGINT IDENTITY(1,1) NOT NULL,
    MemberID NVARCHAR(50) NOT NULL,                  -- External UFO ID
    Email NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Mobile NVARCHAR(20) NULL,

    RoleID INT NOT NULL,
    MarketID INT NOT NULL,
    PreferredLanguageID INT NOT NULL,

    PasswordHash NVARCHAR(255) NULL,                 -- If local auth, otherwise NULL for SSO
    PasswordSalt NVARCHAR(255) NULL,

    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',   -- Active, Inactive, Suspended, PendingVerification
    EmailVerified BIT NOT NULL DEFAULT 0,
    MobileVerified BIT NOT NULL DEFAULT 0,

    LastLoginDate DATETIME2(7) NULL,
    LastActivityDate DATETIME2(7) NULL,

    ProfileImageURL NVARCHAR(500) NULL,
    TimeZone NVARCHAR(50) NULL,

    -- SSO Integration
    ExternalAuthProvider NVARCHAR(50) NULL,          -- Azure AD, Okta, etc.
    ExternalAuthID NVARCHAR(255) NULL,

    -- Security
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockedOutUntil DATETIME2(7) NULL,
    MFAEnabled BIT NOT NULL DEFAULT 0,
    MFASecret NVARCHAR(255) NULL,

    -- Audit
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_User PRIMARY KEY CLUSTERED (UserID),
    CONSTRAINT FK_User_Role FOREIGN KEY (RoleID) REFERENCES dbo.Role(RoleID),
    CONSTRAINT FK_User_Market FOREIGN KEY (MarketID) REFERENCES dbo.Market(MarketID),
    CONSTRAINT FK_User_Language FOREIGN KEY (PreferredLanguageID) REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_User_MemberID UNIQUE (MemberID),
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT CK_User_Status CHECK (Status IN ('Active', 'Inactive', 'Suspended', 'PendingVerification'))
);
GO

CREATE NONCLUSTERED INDEX IX_User_Email ON dbo.[User](Email) WHERE Status = 'Active';
CREATE NONCLUSTERED INDEX IX_User_Market_Status ON dbo.[User](MarketID, Status) INCLUDE (RoleID, PreferredLanguageID);
CREATE NONCLUSTERED INDEX IX_User_LastActivity ON dbo.[User](LastActivityDate DESC) WHERE Status = 'Active';
CREATE NONCLUSTERED INDEX IX_User_ExternalAuth ON dbo.[User](ExternalAuthProvider, ExternalAuthID);
GO

-- User Settings
CREATE TABLE dbo.UserSettings (
    UserSettingsID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,

    -- Notification Preferences
    EmailNotificationsEnabled BIT NOT NULL DEFAULT 1,
    SMSNotificationsEnabled BIT NOT NULL DEFAULT 0,
    PushNotificationsEnabled BIT NOT NULL DEFAULT 1,

    NotifyOnEngagement BIT NOT NULL DEFAULT 1,
    NotifyOnNewContent BIT NOT NULL DEFAULT 1,
    NotifyOnFollowUpNeeded BIT NOT NULL DEFAULT 1,
    NotifyOnCampaignUpdate BIT NOT NULL DEFAULT 1,

    QuietHoursStart TIME NULL,                       -- e.g., 22:00:00
    QuietHoursEnd TIME NULL,                         -- e.g., 08:00:00
    QuietHoursEnabled BIT NOT NULL DEFAULT 0,

    -- Display Preferences
    DefaultShareChannel NVARCHAR(20) NULL,           -- SMS, Email, Social
    ShowFeaturedContentFirst BIT NOT NULL DEFAULT 1,
    ItemsPerPage INT NOT NULL DEFAULT 20,

    -- Privacy
    AllowDataCollection BIT NOT NULL DEFAULT 1,
    AllowAIRecommendations BIT NOT NULL DEFAULT 1,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_UserSettings PRIMARY KEY CLUSTERED (UserSettingsID),
    CONSTRAINT FK_UserSettings_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_UserSettings_UserID UNIQUE (UserID)
);
GO

/*******************************************************************************
 * 3. COMPLIANCE RULES
 ******************************************************************************/

CREATE TABLE dbo.ComplianceRule (
    ComplianceRuleID INT IDENTITY(1,1) NOT NULL,
    RuleName NVARCHAR(100) NOT NULL,
    RuleType NVARCHAR(50) NOT NULL,                  -- EmailConsent, SMSOptIn, ContentRestriction
    MarketID INT NULL,                               -- NULL = global rule

    RuleDescription NVARCHAR(MAX) NULL,
    EnforcementLevel NVARCHAR(20) NOT NULL DEFAULT 'Warning', -- Warning, Block, Audit

    IsActive BIT NOT NULL DEFAULT 1,
    EffectiveDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    ExpirationDate DATETIME2(7) NULL,

    ConfigurationJSON NVARCHAR(MAX) NULL,            -- Flexible rule configuration

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_ComplianceRule PRIMARY KEY CLUSTERED (ComplianceRuleID),
    CONSTRAINT FK_ComplianceRule_Market FOREIGN KEY (MarketID) REFERENCES dbo.Market(MarketID)
);
GO

CREATE NONCLUSTERED INDEX IX_ComplianceRule_Market_Active ON dbo.ComplianceRule(MarketID, IsActive);
CREATE NONCLUSTERED INDEX IX_ComplianceRule_Type ON dbo.ComplianceRule(RuleType, IsActive);
GO

/*******************************************************************************
 * 4. CONTENT MANAGEMENT
 ******************************************************************************/

-- Content Categories
CREATE TABLE dbo.ContentCategory (
    ContentCategoryID INT IDENTITY(1,1) NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    CategoryDescription NVARCHAR(500) NULL,
    ParentCategoryID INT NULL,                       -- For hierarchical categories
    CategoryPath NVARCHAR(500) NULL,                 -- Computed: /Parent/Child/GrandChild
    SortOrder INT NOT NULL DEFAULT 0,
    IconURL NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentCategory PRIMARY KEY CLUSTERED (ContentCategoryID),
    CONSTRAINT FK_ContentCategory_Parent FOREIGN KEY (ParentCategoryID) REFERENCES dbo.ContentCategory(ContentCategoryID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentCategory_Parent ON dbo.ContentCategory(ParentCategoryID);
CREATE NONCLUSTERED INDEX IX_ContentCategory_Active ON dbo.ContentCategory(IsActive, SortOrder);
GO

-- Content Tags
CREATE TABLE dbo.ContentTag (
    ContentTagID INT IDENTITY(1,1) NOT NULL,
    TagName NVARCHAR(50) NOT NULL,
    TagDescription NVARCHAR(255) NULL,
    TagColor NVARCHAR(7) NULL,                       -- Hex color code
    IsActive BIT NOT NULL DEFAULT 1,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentTag PRIMARY KEY CLUSTERED (ContentTagID),
    CONSTRAINT UQ_ContentTag_TagName UNIQUE (TagName)
);
GO

-- Campaigns
CREATE TABLE dbo.Campaign (
    CampaignID INT IDENTITY(1,1) NOT NULL,
    CampaignName NVARCHAR(200) NOT NULL,
    CampaignCode NVARCHAR(50) NULL,                  -- Short code for tracking
    CampaignDescription NVARCHAR(MAX) NULL,

    StartDate DATETIME2(7) NOT NULL,
    EndDate DATETIME2(7) NULL,

    Status NVARCHAR(20) NOT NULL DEFAULT 'Draft',    -- Draft, Active, Paused, Completed, Archived
    CampaignType NVARCHAR(50) NULL,                  -- Product Launch, Seasonal, Event, etc.

    TargetMarkets NVARCHAR(500) NULL,                -- Comma-separated market codes
    OwnerUserID BIGINT NULL,                         -- Campaign owner

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_Campaign PRIMARY KEY CLUSTERED (CampaignID),
    CONSTRAINT FK_Campaign_Owner FOREIGN KEY (OwnerUserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT CK_Campaign_Status CHECK (Status IN ('Draft', 'Active', 'Paused', 'Completed', 'Archived'))
);
GO

CREATE NONCLUSTERED INDEX IX_Campaign_Status_Dates ON dbo.Campaign(Status, StartDate, EndDate);
CREATE NONCLUSTERED INDEX IX_Campaign_Owner ON dbo.Campaign(OwnerUserID);
GO

-- Content Items
CREATE TABLE dbo.ContentItem (
    ContentItemID BIGINT IDENTITY(1,1) NOT NULL,
    ContentGUID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(), -- For external references

    -- Basic Info
    Title NVARCHAR(255) NOT NULL,
    Subtitle NVARCHAR(255) NULL,
    Description NVARCHAR(MAX) NULL,

    -- Media
    ThumbnailURL NVARCHAR(500) NULL,
    MediaURL NVARCHAR(500) NULL,
    DestinationURL NVARCHAR(500) NULL,               -- Landing page or target URL

    -- Content Type
    ContentType NVARCHAR(50) NOT NULL,               -- Video, Image, PDF, LandingPage, ProductPage, ShareCard
    MIMEType NVARCHAR(100) NULL,
    FileSizeBytes BIGINT NULL,
    DurationSeconds INT NULL,                        -- For video/audio

    -- Metadata
    ExternalContentID NVARCHAR(100) NULL,            -- ID from upstream CMS

    -- Publishing
    PublishStatus NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft, Review, Approved, Published, Archived
    PublishDate DATETIME2(7) NULL,
    ExpirationDate DATETIME2(7) NULL,

    -- Sharing Controls
    AllowSMS BIT NOT NULL DEFAULT 1,
    AllowEmail BIT NOT NULL DEFAULT 1,
    AllowSocial BIT NOT NULL DEFAULT 1,
    AllowPersonalNote BIT NOT NULL DEFAULT 1,

    -- CTA
    CTAType NVARCHAR(50) NULL,                       -- LearnMore, BuyNow, JoinNow, Contact, Register
    CTALabel NVARCHAR(100) NULL,

    -- Compliance
    RequiresDisclaimer BIT NOT NULL DEFAULT 0,
    DisclaimerText NVARCHAR(MAX) NULL,
    IsRegulatedContent BIT NOT NULL DEFAULT 0,

    -- Analytics
    ViewCount BIGINT NOT NULL DEFAULT 0,
    ShareCount BIGINT NOT NULL DEFAULT 0,
    ClickCount BIGINT NOT NULL DEFAULT 0,

    -- Features
    IsFeatured BIT NOT NULL DEFAULT 0,
    FeaturedPriority INT NOT NULL DEFAULT 0,

    -- Audit
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_ContentItem PRIMARY KEY CLUSTERED (ContentItemID),
    CONSTRAINT FK_ContentItem_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_ContentItem_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.[User](UserID),
    CONSTRAINT UQ_ContentItem_GUID UNIQUE (ContentGUID),
    CONSTRAINT CK_ContentItem_PublishStatus CHECK (PublishStatus IN ('Draft', 'Review', 'Approved', 'Published', 'Archived'))
);
GO

CREATE NONCLUSTERED INDEX IX_ContentItem_PublishStatus ON dbo.ContentItem(PublishStatus, PublishDate DESC);
CREATE NONCLUSTERED INDEX IX_ContentItem_Type_Status ON dbo.ContentItem(ContentType, PublishStatus);
CREATE NONCLUSTERED INDEX IX_ContentItem_Featured ON dbo.ContentItem(IsFeatured, FeaturedPriority DESC) WHERE IsFeatured = 1;
CREATE NONCLUSTERED INDEX IX_ContentItem_ExpirationDate ON dbo.ContentItem(ExpirationDate) WHERE ExpirationDate IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ContentItem_ExternalID ON dbo.ContentItem(ExternalContentID);
GO

/*******************************************************************************
 * 5. CONTENT RELATIONSHIP JUNCTION TABLES
 ******************************************************************************/

-- Content-to-Category Mapping
CREATE TABLE dbo.ContentItemCategory (
    ContentItemCategoryID BIGINT IDENTITY(1,1) NOT NULL,
    ContentItemID BIGINT NOT NULL,
    ContentCategoryID INT NOT NULL,
    IsPrimary BIT NOT NULL DEFAULT 0,                -- Primary category for display

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentItemCategory PRIMARY KEY CLUSTERED (ContentItemCategoryID),
    CONSTRAINT FK_ContentItemCategory_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID) ON DELETE CASCADE,
    CONSTRAINT FK_ContentItemCategory_Category FOREIGN KEY (ContentCategoryID) REFERENCES dbo.ContentCategory(ContentCategoryID),
    CONSTRAINT UQ_ContentItemCategory UNIQUE (ContentItemID, ContentCategoryID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentItemCategory_Category ON dbo.ContentItemCategory(ContentCategoryID);
GO

-- Content-to-Tag Mapping
CREATE TABLE dbo.ContentItemTag (
    ContentItemTagID BIGINT IDENTITY(1,1) NOT NULL,
    ContentItemID BIGINT NOT NULL,
    ContentTagID INT NOT NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentItemTag PRIMARY KEY CLUSTERED (ContentItemTagID),
    CONSTRAINT FK_ContentItemTag_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID) ON DELETE CASCADE,
    CONSTRAINT FK_ContentItemTag_Tag FOREIGN KEY (ContentTagID) REFERENCES dbo.ContentTag(ContentTagID),
    CONSTRAINT UQ_ContentItemTag UNIQUE (ContentItemID, ContentTagID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentItemTag_Tag ON dbo.ContentItemTag(ContentTagID);
GO

-- Campaign-to-Content Mapping
CREATE TABLE dbo.CampaignContent (
    CampaignContentID BIGINT IDENTITY(1,1) NOT NULL,
    CampaignID INT NOT NULL,
    ContentItemID BIGINT NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_CampaignContent PRIMARY KEY CLUSTERED (CampaignContentID),
    CONSTRAINT FK_CampaignContent_Campaign FOREIGN KEY (CampaignID) REFERENCES dbo.Campaign(CampaignID) ON DELETE CASCADE,
    CONSTRAINT FK_CampaignContent_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT UQ_CampaignContent UNIQUE (CampaignID, ContentItemID)
);
GO

CREATE NONCLUSTERED INDEX IX_CampaignContent_Content ON dbo.CampaignContent(ContentItemID);
GO

-- Content-to-Market Mapping
CREATE TABLE dbo.ContentItemMarket (
    ContentItemMarketID BIGINT IDENTITY(1,1) NOT NULL,
    ContentItemID BIGINT NOT NULL,
    MarketID INT NOT NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentItemMarket PRIMARY KEY CLUSTERED (ContentItemMarketID),
    CONSTRAINT FK_ContentItemMarket_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID) ON DELETE CASCADE,
    CONSTRAINT FK_ContentItemMarket_Market FOREIGN KEY (MarketID) REFERENCES dbo.Market(MarketID),
    CONSTRAINT UQ_ContentItemMarket UNIQUE (ContentItemID, MarketID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentItemMarket_Market ON dbo.ContentItemMarket(MarketID);
GO

-- Content-to-Language Mapping
CREATE TABLE dbo.ContentItemLanguage (
    ContentItemLanguageID BIGINT IDENTITY(1,1) NOT NULL,
    ContentItemID BIGINT NOT NULL,
    LanguageID INT NOT NULL,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentItemLanguage PRIMARY KEY CLUSTERED (ContentItemLanguageID),
    CONSTRAINT FK_ContentItemLanguage_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID) ON DELETE CASCADE,
    CONSTRAINT FK_ContentItemLanguage_Language FOREIGN KEY (LanguageID) REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_ContentItemLanguage UNIQUE (ContentItemID, LanguageID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentItemLanguage_Language ON dbo.ContentItemLanguage(LanguageID);
GO
