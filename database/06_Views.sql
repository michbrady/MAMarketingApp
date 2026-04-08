/*******************************************************************************
 * UnFranchise Marketing App - Database Views
 * Microsoft SQL Server 2019+
 *
 * Analytical and reporting views
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. USER VIEWS
 ******************************************************************************/

-- Active Users with Profile
CREATE OR ALTER VIEW dbo.vw_ActiveUsers
AS
SELECT
    u.UserID,
    u.MemberID,
    u.Email,
    u.FirstName,
    u.LastName,
    u.Mobile,
    r.RoleName,
    r.PermissionLevel,
    m.MarketCode,
    m.MarketName,
    l.LanguageCode,
    l.LanguageName,
    u.Status,
    u.LastLoginDate,
    u.LastActivityDate,
    u.CreatedDate
FROM dbo.[User] u
INNER JOIN dbo.Role r ON u.RoleID = r.RoleID
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
INNER JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
WHERE u.Status = 'Active';
GO

-- User Activity Summary
CREATE OR ALTER VIEW dbo.vw_UserActivitySummary
AS
SELECT
    u.UserID,
    u.MemberID,
    u.FirstName,
    u.LastName,
    u.Email,
    m.MarketCode,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast30Days,
    COUNT(DISTINCT c.ContactID) AS TotalContacts,
    COUNT(DISTINCT CASE WHEN c.LastEngagementDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN c.ContactID END) AS ActiveContactsLast7Days,
    SUM(se.ClickCount) AS TotalClicks,
    MAX(se.ShareDate) AS LastShareDate,
    u.LastLoginDate
FROM dbo.[User] u
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
LEFT JOIN dbo.ShareEvent se ON u.UserID = se.UserID
LEFT JOIN dbo.Contact c ON u.UserID = c.OwnerUserID AND c.Status = 'Active'
WHERE u.Status = 'Active'
GROUP BY u.UserID, u.MemberID, u.FirstName, u.LastName, u.Email, m.MarketCode, u.LastLoginDate;
GO

/*******************************************************************************
 * 2. CONTENT VIEWS
 ******************************************************************************/

-- Published Content with Metadata
CREATE OR ALTER VIEW dbo.vw_PublishedContent
AS
SELECT
    ci.ContentItemID,
    ci.ContentGUID,
    ci.Title,
    ci.Subtitle,
    ci.Description,
    ci.ThumbnailURL,
    ci.MediaURL,
    ci.DestinationURL,
    ci.ContentType,
    ci.PublishDate,
    ci.ExpirationDate,
    ci.IsFeatured,
    ci.AllowSMS,
    ci.AllowEmail,
    ci.AllowSocial,
    ci.CTAType,
    ci.CTALabel,
    ci.ViewCount,
    ci.ShareCount,
    ci.ClickCount,
    -- Primary category
    cc.CategoryName AS PrimaryCategory,
    -- Markets (comma-separated)
    STUFF((
        SELECT ',' + m.MarketCode
        FROM dbo.ContentItemMarket cim
        INNER JOIN dbo.Market m ON cim.MarketID = m.MarketID
        WHERE cim.ContentItemID = ci.ContentItemID
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Markets,
    -- Languages (comma-separated)
    STUFF((
        SELECT ',' + l.LanguageCode
        FROM dbo.ContentItemLanguage cil
        INNER JOIN dbo.Language l ON cil.LanguageID = l.LanguageID
        WHERE cil.ContentItemID = ci.ContentItemID
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Languages,
    -- Tags (comma-separated)
    STUFF((
        SELECT ',' + ct.TagName
        FROM dbo.ContentItemTag cit
        INNER JOIN dbo.ContentTag ct ON cit.ContentTagID = ct.ContentTagID
        WHERE cit.ContentItemID = ci.ContentItemID
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS Tags
FROM dbo.ContentItem ci
LEFT JOIN dbo.ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
LEFT JOIN dbo.ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
WHERE ci.PublishStatus = 'Published'
    AND (ci.ExpirationDate IS NULL OR ci.ExpirationDate > SYSDATETIME());
GO

-- Content Performance Metrics
CREATE OR ALTER VIEW dbo.vw_ContentPerformance
AS
SELECT
    ci.ContentItemID,
    ci.Title,
    ci.ContentType,
    cc.CategoryName AS PrimaryCategory,
    ci.PublishDate,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.UserID) AS UniqueSharers,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks,
    CASE
        WHEN SUM(se.RecipientCount) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
        ELSE 0
    END AS ClickThroughRatePercent,
    MAX(se.ShareDate) AS LastSharedDate
FROM dbo.ContentItem ci
LEFT JOIN dbo.ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
LEFT JOIN dbo.ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
LEFT JOIN dbo.ShareEvent se ON ci.ContentItemID = se.ContentItemID
WHERE ci.PublishStatus = 'Published'
GROUP BY ci.ContentItemID, ci.Title, ci.ContentType, cc.CategoryName, ci.PublishDate;
GO

/*******************************************************************************
 * 3. SHARING AND ENGAGEMENT VIEWS
 ******************************************************************************/

-- Share Events with Details
CREATE OR ALTER VIEW dbo.vw_ShareEventsDetail
AS
SELECT
    se.ShareEventID,
    se.ShareGUID,
    se.ShareDate,
    se.ShareChannel,
    se.SocialPlatform,
    -- User/Sharer
    u.UserID,
    u.MemberID,
    u.FirstName + ' ' + u.LastName AS SharerName,
    u.Email AS SharerEmail,
    m.MarketCode,
    -- Content
    ci.ContentItemID,
    ci.Title AS ContentTitle,
    ci.ContentType,
    -- Campaign
    c.CampaignID,
    c.CampaignName,
    -- Tracking
    tl.ShortCode AS TrackingCode,
    tl.FullTrackingURL,
    -- Metrics
    se.RecipientCount,
    se.ClickCount,
    se.UniqueClickCount,
    se.Status
FROM dbo.ShareEvent se
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
LEFT JOIN dbo.Campaign c ON se.CampaignID = c.CampaignID
LEFT JOIN dbo.TrackingLink tl ON se.ShareEventID = tl.ShareEventID;
GO

-- Engagement Events Detail
CREATE OR ALTER VIEW dbo.vw_EngagementEventsDetail
AS
SELECT
    ee.EngagementEventID,
    ee.EventType,
    ee.EventDate,
    -- Tracking link
    tl.ShortCode AS TrackingCode,
    -- Share event
    se.ShareEventID,
    se.ShareDate,
    -- Sharer (UFO)
    u.UserID AS SharerUserID,
    u.MemberID AS SharerMemberID,
    u.FirstName + ' ' + u.LastName AS SharerName,
    -- Content
    ci.ContentItemID,
    ci.Title AS ContentTitle,
    ci.ContentType,
    -- Contact (if identified)
    c.ContactID,
    c.FirstName + ' ' + c.LastName AS ContactName,
    c.Email AS ContactEmail,
    -- Technical details
    ee.IPAddress,
    ee.DeviceType,
    ee.Browser,
    ee.IsUniqueVisitor
FROM dbo.EngagementEvent ee
INNER JOIN dbo.TrackingLink tl ON ee.TrackingLinkID = tl.TrackingLinkID
INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.ContentItem ci ON ee.ContentItemID = ci.ContentItemID
LEFT JOIN dbo.Contact c ON ee.ContactID = c.ContactID;
GO

-- Recent Engagement Activity (Last 7 Days)
CREATE OR ALTER VIEW dbo.vw_RecentEngagementActivity
AS
SELECT
    ee.EngagementEventID,
    ee.EventType,
    ee.EventDate,
    u.UserID,
    u.MemberID,
    u.FirstName + ' ' + u.LastName AS UFOName,
    ci.Title AS ContentTitle,
    c.ContactID,
    c.FirstName + ' ' + c.LastName AS ContactName,
    ee.IsUniqueVisitor
FROM dbo.EngagementEvent ee
INNER JOIN dbo.TrackingLink tl ON ee.TrackingLinkID = tl.TrackingLinkID
INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.ContentItem ci ON ee.ContentItemID = ci.ContentItemID
LEFT JOIN dbo.Contact c ON ee.ContactID = c.ContactID
WHERE ee.EventDate >= DATEADD(DAY, -7, SYSDATETIME());
GO

/*******************************************************************************
 * 4. CONTACT VIEWS
 ******************************************************************************/

-- Contact Summary with Engagement
CREATE OR ALTER VIEW dbo.vw_ContactSummary
AS
SELECT
    c.ContactID,
    c.OwnerUserID,
    u.MemberID AS OwnerMemberID,
    u.FirstName + ' ' + u.LastName AS OwnerName,
    c.FirstName,
    c.LastName,
    c.Email,
    c.Mobile,
    c.RelationshipType,
    c.Status,
    c.EngagementScore,
    c.TotalSharesReceived,
    c.TotalEngagements,
    c.LastEngagementDate,
    c.LastContactDate,
    c.EmailOptIn,
    c.SMSOptIn,
    c.CreatedDate,
    DATEDIFF(DAY, c.LastEngagementDate, SYSDATETIME()) AS DaysSinceLastEngagement,
    DATEDIFF(DAY, c.LastContactDate, SYSDATETIME()) AS DaysSinceLastContact
FROM dbo.Contact c
INNER JOIN dbo.[User] u ON c.OwnerUserID = u.UserID
WHERE c.Status = 'Active';
GO

-- Hot Contacts (High Engagement, Need Follow-up)
CREATE OR ALTER VIEW dbo.vw_HotContacts
AS
SELECT
    c.ContactID,
    c.OwnerUserID,
    u.MemberID AS OwnerMemberID,
    u.FirstName + ' ' + u.LastName AS OwnerName,
    c.FirstName,
    c.LastName,
    c.Email,
    c.Mobile,
    c.EngagementScore,
    c.TotalEngagements,
    c.LastEngagementDate,
    c.LastContactDate,
    DATEDIFF(DAY, c.LastEngagementDate, SYSDATETIME()) AS DaysSinceEngagement,
    CASE
        WHEN c.LastEngagementDate >= DATEADD(DAY, -1, SYSDATETIME()) THEN 'Today'
        WHEN c.LastEngagementDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 'This Week'
        WHEN c.LastEngagementDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN 'This Month'
        ELSE 'Older'
    END AS EngagementRecency
FROM dbo.Contact c
INNER JOIN dbo.[User] u ON c.OwnerUserID = u.UserID
WHERE c.Status = 'Active'
    AND c.EngagementScore >= 50
    AND c.LastEngagementDate >= DATEADD(DAY, -30, SYSDATETIME());
GO

/*******************************************************************************
 * 5. CAMPAIGN VIEWS
 ******************************************************************************/

-- Campaign Performance
CREATE OR ALTER VIEW dbo.vw_CampaignPerformance
AS
SELECT
    c.CampaignID,
    c.CampaignName,
    c.CampaignCode,
    c.CampaignType,
    c.Status,
    c.StartDate,
    c.EndDate,
    -- Content count
    COUNT(DISTINCT cc.ContentItemID) AS ContentItemCount,
    -- Share metrics
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.UserID) AS UniqueSharers,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks,
    CASE
        WHEN SUM(se.RecipientCount) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
        ELSE 0
    END AS ClickThroughRatePercent,
    MAX(se.ShareDate) AS LastShareDate
FROM dbo.Campaign c
LEFT JOIN dbo.CampaignContent cc ON c.CampaignID = cc.CampaignID
LEFT JOIN dbo.ShareEvent se ON c.CampaignID = se.CampaignID
GROUP BY c.CampaignID, c.CampaignName, c.CampaignCode, c.CampaignType,
         c.Status, c.StartDate, c.EndDate;
GO

/*******************************************************************************
 * 6. NOTIFICATION AND ACTIVITY VIEWS
 ******************************************************************************/

-- Unread Notifications Summary
CREATE OR ALTER VIEW dbo.vw_UnreadNotifications
AS
SELECT
    n.NotificationID,
    n.UserID,
    u.MemberID,
    u.Email,
    n.NotificationType,
    n.NotificationCategory,
    n.Title,
    n.Message,
    n.Priority,
    n.CreatedDate,
    DATEDIFF(HOUR, n.CreatedDate, SYSDATETIME()) AS HoursOld
FROM dbo.Notification n
INNER JOIN dbo.[User] u ON n.UserID = u.UserID
WHERE n.IsRead = 0
    AND n.IsArchived = 0
    AND (n.ExpirationDate IS NULL OR n.ExpirationDate > SYSDATETIME());
GO

-- Activity Feed Summary
CREATE OR ALTER VIEW dbo.vw_ActivityFeedSummary
AS
SELECT
    afi.ActivityFeedItemID,
    afi.UserID,
    u.MemberID,
    u.Email,
    afi.ActivityType,
    afi.ActivityTitle,
    afi.ActivityMessage,
    afi.ActivityDate,
    afi.IsRead,
    afi.IsStarred,
    c.FirstName + ' ' + c.LastName AS RelatedContactName,
    ci.Title AS RelatedContentTitle
FROM dbo.ActivityFeedItem afi
INNER JOIN dbo.[User] u ON afi.UserID = u.UserID
LEFT JOIN dbo.Contact c ON afi.RelatedContactID = c.ContactID
LEFT JOIN dbo.ContentItem ci ON afi.RelatedContentItemID = ci.ContentItemID
WHERE afi.IsArchived = 0;
GO

/*******************************************************************************
 * 7. ANALYTICS VIEWS
 ******************************************************************************/

-- Daily Share Metrics
CREATE OR ALTER VIEW dbo.vw_DailyShareMetrics
AS
SELECT
    CAST(se.ShareDate AS DATE) AS ShareDate,
    m.MarketCode,
    se.ShareChannel,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.UserID) AS UniqueUsers,
    COUNT(DISTINCT se.ContentItemID) AS UniqueContent,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks
FROM dbo.ShareEvent se
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
GROUP BY CAST(se.ShareDate AS DATE), m.MarketCode, se.ShareChannel;
GO

-- Market Performance Summary
CREATE OR ALTER VIEW dbo.vw_MarketPerformance
AS
SELECT
    m.MarketID,
    m.MarketCode,
    m.MarketName,
    COUNT(DISTINCT u.UserID) AS TotalUsers,
    COUNT(DISTINCT CASE WHEN u.LastLoginDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN u.UserID END) AS ActiveUsersLast30Days,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast30Days,
    SUM(se.ClickCount) AS TotalClicks,
    COUNT(DISTINCT c.ContactID) AS TotalContacts
FROM dbo.Market m
LEFT JOIN dbo.[User] u ON m.MarketID = u.MarketID AND u.Status = 'Active'
LEFT JOIN dbo.ShareEvent se ON u.UserID = se.UserID
LEFT JOIN dbo.Contact c ON u.UserID = c.OwnerUserID AND c.Status = 'Active'
WHERE m.IsActive = 1
GROUP BY m.MarketID, m.MarketCode, m.MarketName;
GO

-- Content Category Performance
CREATE OR ALTER VIEW dbo.vw_CategoryPerformance
AS
SELECT
    cc.ContentCategoryID,
    cc.CategoryName,
    cc.ParentCategoryID,
    COUNT(DISTINCT cic.ContentItemID) AS ContentCount,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    SUM(se.ClickCount) AS TotalClicks,
    AVG(CAST(se.ClickCount AS FLOAT)) AS AvgClicksPerShare
FROM dbo.ContentCategory cc
LEFT JOIN dbo.ContentItemCategory cic ON cc.ContentCategoryID = cic.ContentCategoryID
LEFT JOIN dbo.ShareEvent se ON cic.ContentItemID = se.ContentItemID
WHERE cc.IsActive = 1
GROUP BY cc.ContentCategoryID, cc.CategoryName, cc.ParentCategoryID;
GO

PRINT 'Views created successfully';
GO
