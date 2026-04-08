/*******************************************************************************
 * UnFranchise Marketing App - Analytics Views
 * Microsoft SQL Server 2019+
 *
 * Specialized analytics views for tracking and reporting
 *
 * Author: Database Architecture Team
 * Created: 2026-04-05
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. SHARE PERFORMANCE VIEW
 * Aggregated share metrics by content for analytics dashboard
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_SharePerformance
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
    CASE
        WHEN COUNT(DISTINCT se.ShareEventID) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
        ELSE 0
    END AS AverageClicksPerShare,
    MAX(se.ShareDate) AS LastSharedDate,
    MIN(se.ShareDate) AS FirstSharedDate
FROM dbo.ContentItem ci
LEFT JOIN dbo.ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
LEFT JOIN dbo.ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
LEFT JOIN dbo.ShareEvent se ON ci.ContentItemID = se.ContentItemID
WHERE ci.PublishStatus = 'Published'
GROUP BY ci.ContentItemID, ci.Title, ci.ContentType, cc.CategoryName, ci.PublishDate;
GO

/*******************************************************************************
 * 2. USER SHARE ACTIVITY VIEW
 * Share counts and engagement by user for leaderboards
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_UserShareActivity
AS
SELECT
    u.UserID,
    u.MemberID,
    u.FirstName,
    u.LastName,
    u.Email,
    m.MarketCode,
    m.MarketName,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.ContentItemID) AS UniqueContentShared,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks,
    CASE
        WHEN COUNT(DISTINCT se.ShareEventID) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
        ELSE 0
    END AS AverageClicksPerShare,
    MAX(se.ShareDate) AS LastShareDate,
    MIN(se.ShareDate) AS FirstShareDate,
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast7Days,
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast30Days
FROM dbo.[User] u
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
LEFT JOIN dbo.ShareEvent se ON u.UserID = se.UserID
WHERE u.Status = 'Active'
GROUP BY u.UserID, u.MemberID, u.FirstName, u.LastName, u.Email, m.MarketCode, m.MarketName;
GO

/*******************************************************************************
 * 3. CHANNEL PERFORMANCE VIEW
 * Metrics breakdown by sharing channel (SMS, Email, Social)
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_ChannelPerformance
AS
SELECT
    se.ShareChannel,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.UserID) AS UniqueSharers,
    COUNT(DISTINCT se.ContentItemID) AS UniqueContent,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks,
    CASE
        WHEN SUM(se.RecipientCount) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
        ELSE 0
    END AS ClickThroughRatePercent,
    CASE
        WHEN COUNT(DISTINCT se.ShareEventID) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
        ELSE 0
    END AS AverageClicksPerShare,
    MAX(se.ShareDate) AS LastShareDate,
    -- Last 7 days metrics
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast7Days,
    SUM(CASE WHEN se.ShareDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN se.ClickCount ELSE 0 END) AS ClicksLast7Days,
    -- Last 30 days metrics
    COUNT(DISTINCT CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ShareEventID END) AS SharesLast30Days,
    SUM(CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ClickCount ELSE 0 END) AS ClicksLast30Days
FROM dbo.ShareEvent se
GROUP BY se.ShareChannel;
GO

/*******************************************************************************
 * 4. SHARE TRENDS VIEW
 * Daily aggregated share and engagement metrics for trend charts
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_ShareTrends
AS
SELECT
    CAST(se.ShareDate AS DATE) AS ShareDate,
    COUNT(DISTINCT se.ShareEventID) AS TotalShares,
    COUNT(DISTINCT se.UserID) AS UniqueSharers,
    COUNT(DISTINCT se.ContentItemID) AS UniqueContent,
    SUM(se.RecipientCount) AS TotalRecipients,
    SUM(se.ClickCount) AS TotalClicks,
    SUM(se.UniqueClickCount) AS UniqueClicks,
    CASE
        WHEN SUM(se.RecipientCount) > 0
        THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
        ELSE 0
    END AS ClickThroughRatePercent,
    -- Channel breakdown
    COUNT(DISTINCT CASE WHEN se.ShareChannel = 'SMS' THEN se.ShareEventID END) AS SMSShares,
    COUNT(DISTINCT CASE WHEN se.ShareChannel = 'Email' THEN se.ShareEventID END) AS EmailShares,
    COUNT(DISTINCT CASE WHEN se.ShareChannel = 'Social' THEN se.ShareEventID END) AS SocialShares
FROM dbo.ShareEvent se
GROUP BY CAST(se.ShareDate AS DATE);
GO

/*******************************************************************************
 * 5. ENGAGEMENT METRICS VIEW
 * Detailed engagement event metrics for tracking
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_EngagementMetrics
AS
SELECT
    ee.EngagementEventID,
    ee.EventType,
    ee.EventDate,
    ee.DeviceType,
    ee.Browser,
    ee.OperatingSystem,
    ee.IsUniqueVisitor,
    -- Tracking link info
    tl.TrackingLinkID,
    tl.ShortCode,
    -- Share event info
    se.ShareEventID,
    se.ShareChannel,
    se.ShareDate,
    -- Content info
    ci.ContentItemID,
    ci.Title AS ContentTitle,
    ci.ContentType,
    -- Sharer info
    u.UserID AS SharerUserID,
    u.MemberID AS SharerMemberID,
    u.FirstName + ' ' + u.LastName AS SharerName,
    m.MarketCode,
    -- Contact info (if identified)
    c.ContactID,
    c.FirstName + ' ' + c.LastName AS ContactName,
    c.Email AS ContactEmail
FROM dbo.EngagementEvent ee
INNER JOIN dbo.TrackingLink tl ON ee.TrackingLinkID = tl.TrackingLinkID
INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
INNER JOIN dbo.ContentItem ci ON ee.ContentItemID = ci.ContentItemID
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
LEFT JOIN dbo.Contact c ON ee.ContactID = c.ContactID;
GO

/*******************************************************************************
 * 6. CONTENT ENGAGEMENT SUMMARY VIEW
 * Summary of engagement events by content for quick lookups
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_ContentEngagementSummary
AS
SELECT
    ci.ContentItemID,
    ci.Title,
    ci.ContentType,
    COUNT(DISTINCT ee.EngagementEventID) AS TotalEngagements,
    COUNT(DISTINCT CASE WHEN ee.EventType = 'Click' THEN ee.EngagementEventID END) AS TotalClicks,
    COUNT(DISTINCT CASE WHEN ee.EventType = 'View' THEN ee.EngagementEventID END) AS TotalViews,
    COUNT(DISTINCT CASE WHEN ee.EventType = 'VideoStart' THEN ee.EngagementEventID END) AS TotalVideoStarts,
    COUNT(DISTINCT CASE WHEN ee.EventType = 'VideoComplete' THEN ee.EngagementEventID END) AS TotalVideoCompletes,
    COUNT(DISTINCT CASE WHEN ee.IsUniqueVisitor = 1 THEN ee.EngagementEventID END) AS UniqueVisitors,
    COUNT(DISTINCT ee.ContactID) AS UniqueContacts,
    MAX(ee.EventDate) AS LastEngagementDate,
    -- Device breakdown
    COUNT(DISTINCT CASE WHEN ee.DeviceType = 'Mobile' THEN ee.EngagementEventID END) AS MobileEngagements,
    COUNT(DISTINCT CASE WHEN ee.DeviceType = 'Desktop' THEN ee.EngagementEventID END) AS DesktopEngagements,
    COUNT(DISTINCT CASE WHEN ee.DeviceType = 'Tablet' THEN ee.EngagementEventID END) AS TabletEngagements
FROM dbo.ContentItem ci
LEFT JOIN dbo.EngagementEvent ee ON ci.ContentItemID = ee.ContentItemID
WHERE ci.PublishStatus = 'Published'
GROUP BY ci.ContentItemID, ci.Title, ci.ContentType;
GO

/*******************************************************************************
 * 7. RECENT ACTIVITY VIEW
 * Last 100 share and engagement events for activity feeds
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_RecentActivity
AS
SELECT TOP 100
    'Share' AS ActivityType,
    se.ShareDate AS ActivityDate,
    u.UserID,
    u.MemberID,
    u.FirstName + ' ' + u.LastName AS UserName,
    ci.ContentItemID,
    ci.Title AS ContentTitle,
    se.ShareChannel AS Channel,
    se.RecipientCount,
    se.ClickCount,
    NULL AS EventType,
    NULL AS DeviceType
FROM dbo.ShareEvent se
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID

UNION ALL

SELECT TOP 100
    'Engagement' AS ActivityType,
    ee.EventDate AS ActivityDate,
    u.UserID,
    u.MemberID,
    u.FirstName + ' ' + u.LastName AS UserName,
    ci.ContentItemID,
    ci.Title AS ContentTitle,
    se.ShareChannel AS Channel,
    NULL AS RecipientCount,
    NULL AS ClickCount,
    ee.EventType,
    ee.DeviceType
FROM dbo.EngagementEvent ee
INNER JOIN dbo.TrackingLink tl ON ee.TrackingLinkID = tl.TrackingLinkID
INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
INNER JOIN dbo.[User] u ON se.UserID = u.UserID
INNER JOIN dbo.ContentItem ci ON ee.ContentItemID = ci.ContentItemID;
GO

/*******************************************************************************
 * 8. MARKET ANALYTICS VIEW
 * Performance metrics by market for regional analysis
 ******************************************************************************/

CREATE OR ALTER VIEW dbo.v_MarketAnalytics
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
    SUM(CASE WHEN se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME()) THEN se.ClickCount ELSE 0 END) AS ClicksLast30Days,
    CASE
        WHEN COUNT(DISTINCT u.UserID) > 0
        THEN CAST(COUNT(DISTINCT se.ShareEventID) AS FLOAT) / COUNT(DISTINCT u.UserID)
        ELSE 0
    END AS AverageSharesPerUser,
    MAX(se.ShareDate) AS LastShareDate
FROM dbo.Market m
LEFT JOIN dbo.[User] u ON m.MarketID = u.MarketID AND u.Status = 'Active'
LEFT JOIN dbo.ShareEvent se ON u.UserID = se.UserID
WHERE m.IsActive = 1
GROUP BY m.MarketID, m.MarketCode, m.MarketName;
GO

PRINT 'Analytics views created successfully';
GO
