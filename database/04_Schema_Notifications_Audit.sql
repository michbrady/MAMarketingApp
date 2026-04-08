/*******************************************************************************
 * UnFranchise Marketing App - Database Schema
 * Microsoft SQL Server 2019+
 *
 * Part 3: Notifications, Activity Feed, and Audit
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. NOTIFICATIONS
 ******************************************************************************/

CREATE TABLE dbo.Notification (
    NotificationID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,                          -- Recipient

    -- Classification
    NotificationType NVARCHAR(50) NOT NULL,          -- Engagement, FollowUp, ContentUpdate, System, Achievement
    NotificationCategory NVARCHAR(50) NULL,          -- Info, Warning, Success, Action

    -- Content
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NULL,
    ActionURL NVARCHAR(500) NULL,                    -- Deep link or URL for action
    ActionLabel NVARCHAR(100) NULL,                  -- "View Contact", "See Content", etc.

    -- Context References
    RelatedContactID BIGINT NULL,
    RelatedShareEventID BIGINT NULL,
    RelatedEngagementEventID BIGINT NULL,
    RelatedContentItemID BIGINT NULL,

    -- Status
    IsRead BIT NOT NULL DEFAULT 0,
    ReadDate DATETIME2(7) NULL,

    IsDismissed BIT NOT NULL DEFAULT 0,
    DismissedDate DATETIME2(7) NULL,

    IsArchived BIT NOT NULL DEFAULT 0,

    -- Priority
    Priority INT NOT NULL DEFAULT 0,                 -- Higher = more important

    -- Delivery
    DeliveryChannel NVARCHAR(50) NOT NULL DEFAULT 'InApp', -- InApp, Email, SMS, Push
    SentDate DATETIME2(7) NULL,
    DeliveryStatus NVARCHAR(20) NULL,                -- Pending, Sent, Failed

    -- Expiration
    ExpirationDate DATETIME2(7) NULL,                -- Auto-dismiss after this date

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_Notification PRIMARY KEY CLUSTERED (NotificationID),
    CONSTRAINT FK_Notification_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID) ON DELETE CASCADE,
    CONSTRAINT FK_Notification_Contact FOREIGN KEY (RelatedContactID) REFERENCES dbo.Contact(ContactID),
    CONSTRAINT FK_Notification_ShareEvent FOREIGN KEY (RelatedShareEventID) REFERENCES dbo.ShareEvent(ShareEventID),
    CONSTRAINT FK_Notification_EngagementEvent FOREIGN KEY (RelatedEngagementEventID) REFERENCES dbo.EngagementEvent(EngagementEventID),
    CONSTRAINT FK_Notification_ContentItem FOREIGN KEY (RelatedContentItemID) REFERENCES dbo.ContentItem(ContentItemID)
);
GO

CREATE NONCLUSTERED INDEX IX_Notification_User_Unread ON dbo.Notification(UserID, IsRead, CreatedDate DESC)
    WHERE IsArchived = 0;
CREATE NONCLUSTERED INDEX IX_Notification_User_Priority ON dbo.Notification(UserID, Priority DESC, CreatedDate DESC)
    WHERE IsRead = 0 AND IsArchived = 0;
CREATE NONCLUSTERED INDEX IX_Notification_Type ON dbo.Notification(NotificationType, CreatedDate DESC);
CREATE NONCLUSTERED INDEX IX_Notification_Expiration ON dbo.Notification(ExpirationDate)
    WHERE ExpirationDate IS NOT NULL AND IsDismissed = 0;
GO

/*******************************************************************************
 * 2. ACTIVITY FEED
 ******************************************************************************/

CREATE TABLE dbo.ActivityFeedItem (
    ActivityFeedItemID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,                          -- Feed owner

    -- Activity Classification
    ActivityType NVARCHAR(50) NOT NULL,              -- Engagement, NewContent, FollowUpNeeded, Achievement, System

    -- Display Content
    ActivityTitle NVARCHAR(255) NOT NULL,
    ActivityMessage NVARCHAR(MAX) NULL,
    ActivityIcon NVARCHAR(100) NULL,                 -- Icon identifier
    ActivityColor NVARCHAR(7) NULL,                  -- Hex color for theming

    -- Context References
    RelatedContactID BIGINT NULL,
    RelatedShareEventID BIGINT NULL,
    RelatedEngagementEventID BIGINT NULL,
    RelatedContentItemID BIGINT NULL,
    RelatedCampaignID INT NULL,

    -- Action
    ActionURL NVARCHAR(500) NULL,
    ActionLabel NVARCHAR(100) NULL,

    -- Engagement
    IsRead BIT NOT NULL DEFAULT 0,
    ReadDate DATETIME2(7) NULL,

    IsStarred BIT NOT NULL DEFAULT 0,                -- User can star important items
    IsArchived BIT NOT NULL DEFAULT 0,

    -- Priority and Sorting
    Priority INT NOT NULL DEFAULT 0,
    DisplayOrder INT NOT NULL DEFAULT 0,             -- For custom ordering

    -- Timing
    ActivityDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ActivityFeedItem PRIMARY KEY CLUSTERED (ActivityFeedItemID),
    CONSTRAINT FK_ActivityFeedItem_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID) ON DELETE CASCADE,
    CONSTRAINT FK_ActivityFeedItem_Contact FOREIGN KEY (RelatedContactID) REFERENCES dbo.Contact(ContactID),
    CONSTRAINT FK_ActivityFeedItem_ShareEvent FOREIGN KEY (RelatedShareEventID) REFERENCES dbo.ShareEvent(ShareEventID),
    CONSTRAINT FK_ActivityFeedItem_EngagementEvent FOREIGN KEY (RelatedEngagementEventID) REFERENCES dbo.EngagementEvent(EngagementEventID),
    CONSTRAINT FK_ActivityFeedItem_ContentItem FOREIGN KEY (RelatedContentItemID) REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ActivityFeedItem_Campaign FOREIGN KEY (RelatedCampaignID) REFERENCES dbo.Campaign(CampaignID)
);
GO

CREATE NONCLUSTERED INDEX IX_ActivityFeedItem_User_Date ON dbo.ActivityFeedItem(UserID, ActivityDate DESC)
    WHERE IsArchived = 0;
CREATE NONCLUSTERED INDEX IX_ActivityFeedItem_User_Unread ON dbo.ActivityFeedItem(UserID, IsRead, ActivityDate DESC)
    WHERE IsArchived = 0;
CREATE NONCLUSTERED INDEX IX_ActivityFeedItem_User_Starred ON dbo.ActivityFeedItem(UserID, IsStarred, ActivityDate DESC)
    WHERE IsStarred = 1 AND IsArchived = 0;
CREATE NONCLUSTERED INDEX IX_ActivityFeedItem_Type ON dbo.ActivityFeedItem(ActivityType, ActivityDate DESC);
GO

/*******************************************************************************
 * 3. AUDIT LOG
 ******************************************************************************/

CREATE TABLE dbo.AuditLog (
    AuditLogID BIGINT IDENTITY(1,1) NOT NULL,

    -- Who
    UserID BIGINT NULL,                              -- NULL for system actions
    UserEmail NVARCHAR(255) NULL,                    -- Snapshot at time of action

    -- What
    EntityType NVARCHAR(100) NOT NULL,               -- User, ContentItem, ShareEvent, etc.
    EntityID BIGINT NULL,
    Action NVARCHAR(50) NOT NULL,                    -- Create, Update, Delete, Login, Logout, View, Export

    -- Details
    Description NVARCHAR(MAX) NULL,
    OldValues NVARCHAR(MAX) NULL,                    -- JSON snapshot of old values
    NewValues NVARCHAR(MAX) NULL,                    -- JSON snapshot of new values

    -- Context
    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    SessionID NVARCHAR(100) NULL,

    -- Compliance
    ComplianceFlag BIT NOT NULL DEFAULT 0,           -- Flag for compliance-relevant actions
    SecurityFlag BIT NOT NULL DEFAULT 0,             -- Flag for security events

    -- Timing
    EventDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (AuditLogID),
    CONSTRAINT FK_AuditLog_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_AuditLog_User_Date ON dbo.AuditLog(UserID, EventDate DESC) WHERE UserID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_AuditLog_Entity ON dbo.AuditLog(EntityType, EntityID, EventDate DESC);
CREATE NONCLUSTERED INDEX IX_AuditLog_Action ON dbo.AuditLog(Action, EventDate DESC);
CREATE NONCLUSTERED INDEX IX_AuditLog_Date ON dbo.AuditLog(EventDate DESC);
CREATE NONCLUSTERED INDEX IX_AuditLog_Security ON dbo.AuditLog(SecurityFlag, EventDate DESC) WHERE SecurityFlag = 1;
CREATE NONCLUSTERED INDEX IX_AuditLog_Compliance ON dbo.AuditLog(ComplianceFlag, EventDate DESC) WHERE ComplianceFlag = 1;
GO

/*******************************************************************************
 * 4. SYSTEM CONFIGURATION
 ******************************************************************************/

CREATE TABLE dbo.SystemConfiguration (
    ConfigurationID INT IDENTITY(1,1) NOT NULL,
    ConfigKey NVARCHAR(100) NOT NULL,
    ConfigValue NVARCHAR(MAX) NULL,
    ConfigType NVARCHAR(50) NOT NULL DEFAULT 'String', -- String, Int, Bool, JSON
    Description NVARCHAR(500) NULL,
    IsEncrypted BIT NOT NULL DEFAULT 0,
    Category NVARCHAR(50) NULL,                      -- Integration, Feature, Security, etc.

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_SystemConfiguration PRIMARY KEY CLUSTERED (ConfigurationID),
    CONSTRAINT UQ_SystemConfiguration_Key UNIQUE (ConfigKey),
    CONSTRAINT FK_SystemConfiguration_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.[User](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_SystemConfiguration_Category ON dbo.SystemConfiguration(Category);
GO

/*******************************************************************************
 * 5. SCHEDULED JOBS LOG
 ******************************************************************************/

CREATE TABLE dbo.ScheduledJobLog (
    ScheduledJobLogID BIGINT IDENTITY(1,1) NOT NULL,

    JobName NVARCHAR(100) NOT NULL,
    JobType NVARCHAR(50) NOT NULL,                   -- DataSync, Notification, Analytics, Cleanup

    StartTime DATETIME2(7) NOT NULL,
    EndTime DATETIME2(7) NULL,
    DurationSeconds AS DATEDIFF(SECOND, StartTime, EndTime) PERSISTED,

    Status NVARCHAR(20) NOT NULL,                    -- Running, Completed, Failed, Cancelled
    ResultMessage NVARCHAR(MAX) NULL,
    ErrorMessage NVARCHAR(MAX) NULL,

    RecordsProcessed INT NULL,
    RecordsFailed INT NULL,

    CONSTRAINT PK_ScheduledJobLog PRIMARY KEY CLUSTERED (ScheduledJobLogID)
);
GO

CREATE NONCLUSTERED INDEX IX_ScheduledJobLog_JobName_Date ON dbo.ScheduledJobLog(JobName, StartTime DESC);
CREATE NONCLUSTERED INDEX IX_ScheduledJobLog_Status ON dbo.ScheduledJobLog(Status, StartTime DESC);
GO

/*******************************************************************************
 * 6. USER FAVORITE CONTENT (Bookmarks)
 ******************************************************************************/

CREATE TABLE dbo.UserFavoriteContent (
    UserFavoriteContentID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,
    ContentItemID BIGINT NOT NULL,

    Notes NVARCHAR(500) NULL,
    SortOrder INT NOT NULL DEFAULT 0,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_UserFavoriteContent PRIMARY KEY CLUSTERED (UserFavoriteContentID),
    CONSTRAINT FK_UserFavoriteContent_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID) ON DELETE CASCADE,
    CONSTRAINT FK_UserFavoriteContent_Content FOREIGN KEY (ContentItemID) REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT UQ_UserFavoriteContent UNIQUE (UserID, ContentItemID)
);
GO

CREATE NONCLUSTERED INDEX IX_UserFavoriteContent_User ON dbo.UserFavoriteContent(UserID, SortOrder);
GO

/*******************************************************************************
 * 7. CONTENT SEARCH HISTORY
 ******************************************************************************/

CREATE TABLE dbo.ContentSearchHistory (
    ContentSearchHistoryID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,

    SearchQuery NVARCHAR(500) NOT NULL,
    FilterMarket NVARCHAR(50) NULL,
    FilterLanguage NVARCHAR(50) NULL,
    FilterCategory NVARCHAR(100) NULL,
    FilterChannel NVARCHAR(20) NULL,

    ResultCount INT NOT NULL DEFAULT 0,

    SearchDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_ContentSearchHistory PRIMARY KEY CLUSTERED (ContentSearchHistoryID),
    CONSTRAINT FK_ContentSearchHistory_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_ContentSearchHistory_User_Date ON dbo.ContentSearchHistory(UserID, SearchDate DESC);
CREATE NONCLUSTERED INDEX IX_ContentSearchHistory_Query ON dbo.ContentSearchHistory(SearchQuery, SearchDate DESC);
GO

/*******************************************************************************
 * 8. USER SESSIONS
 ******************************************************************************/

CREATE TABLE dbo.UserSession (
    UserSessionID BIGINT IDENTITY(1,1) NOT NULL,
    UserID BIGINT NOT NULL,

    SessionToken NVARCHAR(255) NOT NULL,
    SessionGUID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),

    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,
    DeviceType NVARCHAR(50) NULL,

    LoginDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    LastActivityDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    LogoutDate DATETIME2(7) NULL,

    IsActive BIT NOT NULL DEFAULT 1,
    ExpirationDate DATETIME2(7) NOT NULL,

    -- Refresh token for mobile apps
    RefreshToken NVARCHAR(255) NULL,
    RefreshTokenExpiration DATETIME2(7) NULL,

    CONSTRAINT PK_UserSession PRIMARY KEY CLUSTERED (UserSessionID),
    CONSTRAINT FK_UserSession_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT UQ_UserSession_Token UNIQUE (SessionToken),
    CONSTRAINT UQ_UserSession_GUID UNIQUE (SessionGUID)
);
GO

CREATE NONCLUSTERED INDEX IX_UserSession_User_Active ON dbo.UserSession(UserID, IsActive, LastActivityDate DESC);
CREATE NONCLUSTERED INDEX IX_UserSession_Token_Active ON dbo.UserSession(SessionToken, IsActive) WHERE IsActive = 1;
CREATE NONCLUSTERED INDEX IX_UserSession_Expiration ON dbo.UserSession(ExpirationDate) WHERE IsActive = 1;
GO

/*******************************************************************************
 * 9. API REQUEST LOG (Optional - for monitoring and rate limiting)
 ******************************************************************************/

CREATE TABLE dbo.APIRequestLog (
    APIRequestLogID BIGINT IDENTITY(1,1) NOT NULL,

    UserID BIGINT NULL,
    SessionID BIGINT NULL,

    Endpoint NVARCHAR(500) NOT NULL,
    HTTPMethod NVARCHAR(10) NOT NULL,                -- GET, POST, PUT, DELETE
    RequestPath NVARCHAR(1000) NULL,
    QueryString NVARCHAR(2000) NULL,

    StatusCode INT NOT NULL,
    ResponseTimeMS INT NULL,

    IPAddress NVARCHAR(45) NULL,
    UserAgent NVARCHAR(500) NULL,

    ErrorMessage NVARCHAR(MAX) NULL,

    RequestDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_APIRequestLog PRIMARY KEY CLUSTERED (APIRequestLogID),
    CONSTRAINT FK_APIRequestLog_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_APIRequestLog_Session FOREIGN KEY (SessionID) REFERENCES dbo.UserSession(UserSessionID)
);
GO

CREATE NONCLUSTERED INDEX IX_APIRequestLog_User_Date ON dbo.APIRequestLog(UserID, RequestDate DESC) WHERE UserID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_APIRequestLog_Endpoint ON dbo.APIRequestLog(Endpoint, RequestDate DESC);
CREATE NONCLUSTERED INDEX IX_APIRequestLog_StatusCode ON dbo.APIRequestLog(StatusCode, RequestDate DESC);
CREATE NONCLUSTERED INDEX IX_APIRequestLog_Date ON dbo.APIRequestLog(RequestDate DESC);
GO

/*******************************************************************************
 * 10. NUDGE RULES (Future AI/Rules Engine)
 ******************************************************************************/

CREATE TABLE dbo.NudgeRule (
    NudgeRuleID INT IDENTITY(1,1) NOT NULL,

    RuleName NVARCHAR(100) NOT NULL,
    RuleDescription NVARCHAR(500) NULL,

    -- Trigger Conditions (stored as JSON for flexibility)
    TriggerConditions NVARCHAR(MAX) NOT NULL,        -- JSON: {type: 'ContactEngaged', threshold: 2, timeframe: '24h'}

    -- Action Configuration
    ActionType NVARCHAR(50) NOT NULL,                -- Notification, ActivityFeedItem, Email
    ActionTemplate NVARCHAR(MAX) NULL,               -- Message template

    -- Targeting
    TargetRoles NVARCHAR(100) NULL,                  -- Comma-separated role names, NULL = all
    TargetMarkets NVARCHAR(100) NULL,                -- Comma-separated market codes, NULL = all

    -- Status
    IsActive BIT NOT NULL DEFAULT 1,
    Priority INT NOT NULL DEFAULT 0,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_NudgeRule PRIMARY KEY CLUSTERED (NudgeRuleID),
    CONSTRAINT FK_NudgeRule_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_NudgeRule_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.[User](UserID)
);
GO

CREATE NONCLUSTERED INDEX IX_NudgeRule_Active ON dbo.NudgeRule(IsActive, Priority DESC);
GO

/*******************************************************************************
 * 11. NUDGE EXECUTION LOG
 ******************************************************************************/

CREATE TABLE dbo.NudgeExecutionLog (
    NudgeExecutionLogID BIGINT IDENTITY(1,1) NOT NULL,

    NudgeRuleID INT NOT NULL,
    UserID BIGINT NOT NULL,

    ExecutionDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    Status NVARCHAR(20) NOT NULL,                    -- Sent, Skipped, Failed

    ResultNotificationID BIGINT NULL,
    ResultActivityFeedItemID BIGINT NULL,

    Notes NVARCHAR(MAX) NULL,

    CONSTRAINT PK_NudgeExecutionLog PRIMARY KEY CLUSTERED (NudgeExecutionLogID),
    CONSTRAINT FK_NudgeExecutionLog_Rule FOREIGN KEY (NudgeRuleID) REFERENCES dbo.NudgeRule(NudgeRuleID),
    CONSTRAINT FK_NudgeExecutionLog_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_NudgeExecutionLog_Notification FOREIGN KEY (ResultNotificationID) REFERENCES dbo.Notification(NotificationID),
    CONSTRAINT FK_NudgeExecutionLog_ActivityFeed FOREIGN KEY (ResultActivityFeedItemID) REFERENCES dbo.ActivityFeedItem(ActivityFeedItemID)
);
GO

CREATE NONCLUSTERED INDEX IX_NudgeExecutionLog_Rule_Date ON dbo.NudgeExecutionLog(NudgeRuleID, ExecutionDate DESC);
CREATE NONCLUSTERED INDEX IX_NudgeExecutionLog_User_Date ON dbo.NudgeExecutionLog(UserID, ExecutionDate DESC);
GO
