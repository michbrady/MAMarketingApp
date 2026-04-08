/*******************************************************************************
 * UnFranchise Marketing App - Stored Procedures
 * Microsoft SQL Server 2019+
 *
 * Core business logic procedures for common operations
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * 1. USER MANAGEMENT PROCEDURES
 ******************************************************************************/

-- Authenticate User
CREATE OR ALTER PROCEDURE dbo.usp_AuthenticateUser
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255) = NULL,
    @ExternalAuthProvider NVARCHAR(50) = NULL,
    @ExternalAuthID NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID BIGINT;
    DECLARE @IsValid BIT = 0;

    -- Find user
    SELECT @UserID = UserID
    FROM dbo.[User]
    WHERE Email = @Email
        AND Status = 'Active'
        AND (LockedOutUntil IS NULL OR LockedOutUntil < SYSDATETIME());

    IF @UserID IS NULL
    BEGIN
        SELECT 0 AS IsAuthenticated, 'Invalid credentials or account locked' AS Message;
        RETURN;
    END

    -- Validate credentials
    IF @ExternalAuthProvider IS NOT NULL
    BEGIN
        -- SSO authentication
        SELECT @IsValid = CASE
            WHEN ExternalAuthProvider = @ExternalAuthProvider
                AND ExternalAuthID = @ExternalAuthID
            THEN 1
            ELSE 0
        END
        FROM dbo.[User]
        WHERE UserID = @UserID;
    END
    ELSE
    BEGIN
        -- Local password authentication
        SELECT @IsValid = CASE
            WHEN PasswordHash = @PasswordHash
            THEN 1
            ELSE 0
        END
        FROM dbo.[User]
        WHERE UserID = @UserID;
    END

    IF @IsValid = 1
    BEGIN
        -- Update login info
        UPDATE dbo.[User]
        SET LastLoginDate = SYSDATETIME(),
            LastActivityDate = SYSDATETIME(),
            FailedLoginAttempts = 0
        WHERE UserID = @UserID;

        -- Return user info
        SELECT
            1 AS IsAuthenticated,
            u.UserID,
            u.MemberID,
            u.Email,
            u.FirstName,
            u.LastName,
            r.RoleName,
            r.PermissionLevel,
            m.MarketCode,
            l.LanguageCode,
            'Login successful' AS Message
        FROM dbo.[User] u
        INNER JOIN dbo.Role r ON u.RoleID = r.RoleID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        INNER JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
        WHERE u.UserID = @UserID;
    END
    ELSE
    BEGIN
        -- Increment failed attempts
        UPDATE dbo.[User]
        SET FailedLoginAttempts = FailedLoginAttempts + 1,
            LockedOutUntil = CASE
                WHEN FailedLoginAttempts >= 4
                THEN DATEADD(MINUTE, 30, SYSDATETIME())
                ELSE NULL
            END
        WHERE UserID = @UserID;

        SELECT 0 AS IsAuthenticated, 'Invalid credentials' AS Message;
    END
END
GO

-- Get User Dashboard Data
CREATE OR ALTER PROCEDURE dbo.usp_GetUserDashboard
    @UserID BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- User summary stats
    SELECT
        COUNT(DISTINCT se.ShareEventID) AS TotalShares,
        COUNT(DISTINCT c.ContactID) AS TotalContacts,
        COUNT(DISTINCT CASE WHEN c.LastEngagementDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN c.ContactID END) AS ActiveContacts,
        COUNT(DISTINCT n.NotificationID) AS UnreadNotifications,
        COUNT(DISTINCT afi.ActivityFeedItemID) AS UnreadActivities
    FROM dbo.[User] u
    LEFT JOIN dbo.ShareEvent se ON u.UserID = se.UserID AND se.ShareDate >= DATEADD(DAY, -30, SYSDATETIME())
    LEFT JOIN dbo.Contact c ON u.UserID = c.OwnerUserID AND c.Status = 'Active'
    LEFT JOIN dbo.Notification n ON u.UserID = n.UserID AND n.IsRead = 0 AND n.IsArchived = 0
    LEFT JOIN dbo.ActivityFeedItem afi ON u.UserID = afi.UserID AND afi.IsRead = 0 AND afi.IsArchived = 0
    WHERE u.UserID = @UserID;

    -- Recent shares
    SELECT TOP 10
        se.ShareEventID,
        se.ShareChannel,
        ci.Title AS ContentTitle,
        ci.ContentType,
        se.ShareDate,
        se.ClickCount,
        se.RecipientCount
    FROM dbo.ShareEvent se
    INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
    WHERE se.UserID = @UserID
    ORDER BY se.ShareDate DESC;

    -- Hot contacts (high engagement, need follow-up)
    SELECT TOP 10
        c.ContactID,
        c.FirstName,
        c.LastName,
        c.Email,
        c.EngagementScore,
        c.LastEngagementDate,
        c.TotalEngagements
    FROM dbo.Contact c
    WHERE c.OwnerUserID = @UserID
        AND c.Status = 'Active'
        AND c.EngagementScore >= 50
    ORDER BY c.EngagementScore DESC, c.LastEngagementDate DESC;
END
GO

/*******************************************************************************
 * 2. CONTENT DISCOVERY PROCEDURES
 ******************************************************************************/

-- Get Content Library
CREATE OR ALTER PROCEDURE dbo.usp_GetContentLibrary
    @UserID BIGINT,
    @MarketID INT = NULL,
    @LanguageID INT = NULL,
    @CategoryID INT = NULL,
    @SearchQuery NVARCHAR(500) = NULL,
    @ShareChannel NVARCHAR(20) = NULL,
    @CampaignID INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserMarketID INT, @UserLanguageID INT;

    -- Get user's market and language
    SELECT @UserMarketID = MarketID, @UserLanguageID = PreferredLanguageID
    FROM dbo.[User]
    WHERE UserID = @UserID;

    -- Use user's defaults if not specified
    SET @MarketID = ISNULL(@MarketID, @UserMarketID);
    SET @LanguageID = ISNULL(@LanguageID, @UserLanguageID);

    -- Main content query
    ;WITH FilteredContent AS (
        SELECT DISTINCT
            ci.ContentItemID,
            ci.ContentGUID,
            ci.Title,
            ci.Subtitle,
            ci.Description,
            ci.ThumbnailURL,
            ci.ContentType,
            ci.IsFeatured,
            ci.FeaturedPriority,
            ci.PublishDate,
            ci.ViewCount,
            ci.ShareCount,
            ci.AllowSMS,
            ci.AllowEmail,
            ci.AllowSocial
        FROM dbo.ContentItem ci
        INNER JOIN dbo.ContentItemMarket cim ON ci.ContentItemID = cim.ContentItemID
        INNER JOIN dbo.ContentItemLanguage cil ON ci.ContentItemID = cil.ContentItemID
        WHERE ci.PublishStatus = 'Published'
            AND (ci.ExpirationDate IS NULL OR ci.ExpirationDate > SYSDATETIME())
            AND cim.MarketID = @MarketID
            AND cil.LanguageID = @LanguageID
            AND (@CategoryID IS NULL OR EXISTS (
                SELECT 1 FROM dbo.ContentItemCategory cic
                WHERE cic.ContentItemID = ci.ContentItemID
                AND cic.ContentCategoryID = @CategoryID
            ))
            AND (@CampaignID IS NULL OR EXISTS (
                SELECT 1 FROM dbo.CampaignContent cc
                WHERE cc.ContentItemID = ci.ContentItemID
                AND cc.CampaignID = @CampaignID
            ))
            AND (@SearchQuery IS NULL OR ci.Title LIKE '%' + @SearchQuery + '%' OR ci.Description LIKE '%' + @SearchQuery + '%')
            AND (
                @ShareChannel IS NULL OR
                (@ShareChannel = 'SMS' AND ci.AllowSMS = 1) OR
                (@ShareChannel = 'Email' AND ci.AllowEmail = 1) OR
                (@ShareChannel = 'Social' AND ci.AllowSocial = 1)
            )
    )
    SELECT *
    FROM FilteredContent
    ORDER BY IsFeatured DESC, FeaturedPriority DESC, PublishDate DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Return total count
    SELECT COUNT(*) AS TotalCount
    FROM (
        SELECT DISTINCT ci.ContentItemID
        FROM dbo.ContentItem ci
        INNER JOIN dbo.ContentItemMarket cim ON ci.ContentItemID = cim.ContentItemID
        INNER JOIN dbo.ContentItemLanguage cil ON ci.ContentItemID = cil.ContentItemID
        WHERE ci.PublishStatus = 'Published'
            AND (ci.ExpirationDate IS NULL OR ci.ExpirationDate > SYSDATETIME())
            AND cim.MarketID = @MarketID
            AND cil.LanguageID = @LanguageID
            AND (@CategoryID IS NULL OR EXISTS (
                SELECT 1 FROM dbo.ContentItemCategory cic
                WHERE cic.ContentItemID = ci.ContentItemID
                AND cic.ContentCategoryID = @CategoryID
            ))
            AND (@SearchQuery IS NULL OR ci.Title LIKE '%' + @SearchQuery + '%' OR ci.Description LIKE '%' + @SearchQuery + '%')
    ) AS CountQuery;
END
GO

/*******************************************************************************
 * 3. SHARING PROCEDURES
 ******************************************************************************/

-- Create Share Event
CREATE OR ALTER PROCEDURE dbo.usp_CreateShareEvent
    @UserID BIGINT,
    @ContentItemID BIGINT,
    @ShareChannel NVARCHAR(20),
    @CampaignID INT = NULL,
    @PersonalMessage NVARCHAR(1000) = NULL,
    @SocialPlatform NVARCHAR(50) = NULL,
    @Recipients NVARCHAR(MAX) = NULL, -- JSON array of recipients
    @IPAddress NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @ShareEventID BIGINT OUTPUT,
    @TrackingCode NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Generate unique tracking code
        SET @TrackingCode = SUBSTRING(CONVERT(NVARCHAR(50), NEWID()), 1, 10);

        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM dbo.ShareEvent WHERE TrackingCode = @TrackingCode)
        BEGIN
            SET @TrackingCode = SUBSTRING(CONVERT(NVARCHAR(50), NEWID()), 1, 10);
        END

        -- Create share event
        INSERT INTO dbo.ShareEvent (
            UserID, ContentItemID, CampaignID, ShareChannel, SocialPlatform,
            PersonalMessage, TrackingCode, ShareDate, IPAddress, UserAgent
        )
        VALUES (
            @UserID, @ContentItemID, @CampaignID, @ShareChannel, @SocialPlatform,
            @PersonalMessage, @TrackingCode, SYSDATETIME(), @IPAddress, @UserAgent
        );

        SET @ShareEventID = SCOPE_IDENTITY();

        -- Create tracking link
        DECLARE @DestinationURL NVARCHAR(1000);
        SELECT @DestinationURL = ISNULL(DestinationURL, MediaURL)
        FROM dbo.ContentItem
        WHERE ContentItemID = @ContentItemID;

        INSERT INTO dbo.TrackingLink (
            ShareEventID, ShortCode, FullTrackingURL, DestinationURL
        )
        VALUES (
            @ShareEventID,
            @TrackingCode,
            'https://track.unfranchise.app/' + @TrackingCode,
            @DestinationURL
        );

        -- Parse and insert recipients if provided
        IF @Recipients IS NOT NULL
        BEGIN
            INSERT INTO dbo.ShareRecipient (ShareEventID, ContactID, RecipientEmail, RecipientMobile, RecipientName)
            SELECT
                @ShareEventID,
                JSON_VALUE(value, '$.contactId'),
                JSON_VALUE(value, '$.email'),
                JSON_VALUE(value, '$.mobile'),
                JSON_VALUE(value, '$.name')
            FROM OPENJSON(@Recipients);

            -- Update recipient count
            UPDATE dbo.ShareEvent
            SET RecipientCount = (SELECT COUNT(*) FROM dbo.ShareRecipient WHERE ShareEventID = @ShareEventID)
            WHERE ShareEventID = @ShareEventID;
        END

        -- Update content share count
        UPDATE dbo.ContentItem
        SET ShareCount = ShareCount + 1
        WHERE ContentItemID = @ContentItemID;

        -- Create activity feed item
        INSERT INTO dbo.ActivityFeedItem (
            UserID, ActivityType, ActivityTitle, ActivityMessage,
            RelatedShareEventID, RelatedContentItemID
        )
        SELECT
            @UserID,
            'Share',
            'Content Shared',
            'You shared "' + ci.Title + '" via ' + @ShareChannel,
            @ShareEventID,
            @ContentItemID
        FROM dbo.ContentItem ci
        WHERE ci.ContentItemID = @ContentItemID;

        COMMIT TRANSACTION;

        SELECT @ShareEventID AS ShareEventID, @TrackingCode AS TrackingCode, 'Success' AS Status;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 50000, @ErrorMessage, 1;
    END CATCH
END
GO

/*******************************************************************************
 * 4. ENGAGEMENT TRACKING PROCEDURES
 ******************************************************************************/

-- Track Click/Engagement Event
CREATE OR ALTER PROCEDURE dbo.usp_TrackEngagement
    @TrackingCode NVARCHAR(50),
    @EventType NVARCHAR(50) = 'Click',
    @IPAddress NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @SessionID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @TrackingLinkID BIGINT;
        DECLARE @ContentItemID BIGINT;
        DECLARE @ShareEventID BIGINT;
        DECLARE @ContactID BIGINT = NULL;

        -- Find tracking link
        SELECT
            @TrackingLinkID = tl.TrackingLinkID,
            @ContentItemID = se.ContentItemID,
            @ShareEventID = se.ShareEventID
        FROM dbo.TrackingLink tl
        INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
        WHERE tl.ShortCode = @TrackingCode
            AND tl.IsActive = 1
            AND (tl.ExpirationDate IS NULL OR tl.ExpirationDate > SYSDATETIME());

        IF @TrackingLinkID IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 'Invalid or expired tracking link' AS ErrorMessage;
            RETURN;
        END

        -- Try to identify contact by IP/session correlation
        -- This is a simplified example - real implementation would be more sophisticated

        -- Check if this is unique visitor
        DECLARE @IsUniqueVisitor BIT = 0;
        IF NOT EXISTS (
            SELECT 1 FROM dbo.EngagementEvent
            WHERE TrackingLinkID = @TrackingLinkID
            AND IPAddress = @IPAddress
        )
        BEGIN
            SET @IsUniqueVisitor = 1;
        END

        -- Record engagement event
        INSERT INTO dbo.EngagementEvent (
            ContentItemID, TrackingLinkID, ShareEventID, ContactID,
            EventType, EventDate, IPAddress, UserAgent, SessionID, IsUniqueVisitor
        )
        VALUES (
            @ContentItemID, @TrackingLinkID, @ShareEventID, @ContactID,
            @EventType, SYSDATETIME(), @IPAddress, @UserAgent, @SessionID, @IsUniqueVisitor
        );

        -- Update tracking link stats
        UPDATE dbo.TrackingLink
        SET ClickCount = ClickCount + 1,
            UniqueClickCount = UniqueClickCount + CASE WHEN @IsUniqueVisitor = 1 THEN 1 ELSE 0 END,
            FirstClickDate = CASE WHEN FirstClickDate IS NULL THEN SYSDATETIME() ELSE FirstClickDate END,
            LastClickDate = SYSDATETIME()
        WHERE TrackingLinkID = @TrackingLinkID;

        -- Update share event stats
        UPDATE dbo.ShareEvent
        SET ClickCount = ClickCount + 1,
            UniqueClickCount = UniqueClickCount + CASE WHEN @IsUniqueVisitor = 1 THEN 1 ELSE 0 END
        WHERE ShareEventID = @ShareEventID;

        -- Update content stats
        UPDATE dbo.ContentItem
        SET ClickCount = ClickCount + 1,
            ViewCount = ViewCount + CASE WHEN @EventType IN ('View', 'VideoStart') THEN 1 ELSE 0 END
        WHERE ContentItemID = @ContentItemID;

        -- Create notification for UFO if this is a new click
        IF @IsUniqueVisitor = 1
        BEGIN
            DECLARE @UFOUserID BIGINT;
            SELECT @UFOUserID = UserID FROM dbo.ShareEvent WHERE ShareEventID = @ShareEventID;

            INSERT INTO dbo.Notification (
                UserID, NotificationType, NotificationCategory, Title, Message,
                RelatedShareEventID, RelatedContentItemID, Priority
            )
            SELECT
                @UFOUserID,
                'Engagement',
                'Info',
                'New Click on Your Shared Content',
                'Someone clicked on "' + ci.Title + '" that you shared',
                @ShareEventID,
                @ContentItemID,
                1
            FROM dbo.ContentItem ci
            WHERE ci.ContentItemID = @ContentItemID;

            -- Also create activity feed item
            INSERT INTO dbo.ActivityFeedItem (
                UserID, ActivityType, ActivityTitle, ActivityMessage,
                RelatedShareEventID, RelatedContentItemID
            )
            SELECT
                @UFOUserID,
                'Engagement',
                'Content Clicked',
                'Someone clicked your shared content: "' + ci.Title + '"',
                @ShareEventID,
                @ContentItemID
            FROM dbo.ContentItem ci
            WHERE ci.ContentItemID = @ContentItemID;
        END

        COMMIT TRANSACTION;

        -- Return destination URL for redirect
        SELECT DestinationURL
        FROM dbo.TrackingLink
        WHERE TrackingLinkID = @TrackingLinkID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        THROW 50000, @ErrorMessage, 1;
    END CATCH
END
GO

/*******************************************************************************
 * 5. CONTACT MANAGEMENT PROCEDURES
 ******************************************************************************/

-- Upsert Contact
CREATE OR ALTER PROCEDURE dbo.usp_UpsertContact
    @OwnerUserID BIGINT,
    @FirstName NVARCHAR(100) = NULL,
    @LastName NVARCHAR(100) = NULL,
    @Email NVARCHAR(255) = NULL,
    @Mobile NVARCHAR(20) = NULL,
    @RelationshipType NVARCHAR(50) = NULL,
    @Tags NVARCHAR(500) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @ContactID BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Generate hash for deduplication
    DECLARE @ContactHash NVARCHAR(64);
    SET @ContactHash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256',
        ISNULL(@Email, '') + '|' + ISNULL(@Mobile, '')), 2);

    -- Check for existing contact
    SELECT @ContactID = ContactID
    FROM dbo.Contact
    WHERE OwnerUserID = @OwnerUserID
        AND ContactHash = @ContactHash
        AND Status != 'DoNotContact';

    IF @ContactID IS NULL
    BEGIN
        -- Insert new contact
        INSERT INTO dbo.Contact (
            OwnerUserID, FirstName, LastName, Email, Mobile,
            RelationshipType, Tags, Notes, ContactHash, Status
        )
        VALUES (
            @OwnerUserID, @FirstName, @LastName, @Email, @Mobile,
            @RelationshipType, @Tags, @Notes, @ContactHash, 'Active'
        );

        SET @ContactID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update existing contact
        UPDATE dbo.Contact
        SET FirstName = ISNULL(@FirstName, FirstName),
            LastName = ISNULL(@LastName, LastName),
            Email = ISNULL(@Email, Email),
            Mobile = ISNULL(@Mobile, Mobile),
            RelationshipType = ISNULL(@RelationshipType, RelationshipType),
            Tags = ISNULL(@Tags, Tags),
            Notes = CASE WHEN @Notes IS NOT NULL THEN ISNULL(Notes, '') + CHAR(13) + CHAR(10) + @Notes ELSE Notes END,
            UpdatedDate = SYSDATETIME()
        WHERE ContactID = @ContactID;
    END

    SELECT @ContactID AS ContactID;
END
GO

-- Get Contact Engagement Summary
CREATE OR ALTER PROCEDURE dbo.usp_GetContactEngagementSummary
    @ContactID BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    -- Contact details with engagement summary
    SELECT
        c.*,
        COUNT(DISTINCT se.ShareEventID) AS TotalSharesReceived,
        COUNT(DISTINCT ee.EngagementEventID) AS TotalEngagements,
        MAX(ee.EventDate) AS LastEngagementDate
    FROM dbo.Contact c
    LEFT JOIN dbo.ShareRecipient sr ON c.ContactID = sr.ContactID
    LEFT JOIN dbo.ShareEvent se ON sr.ShareEventID = se.ShareEventID
    LEFT JOIN dbo.EngagementEvent ee ON c.ContactID = ee.ContactID
    WHERE c.ContactID = @ContactID
    GROUP BY c.ContactID, c.OwnerUserID, c.FirstName, c.LastName, c.Email, c.Mobile,
             c.CompanyName, c.JobTitle, c.RelationshipType, c.Source, c.Tags, c.Notes,
             c.EmailOptIn, c.SMSOptIn, c.MarketingConsentDate, c.TotalSharesReceived,
             c.TotalEngagements, c.LastEngagementDate, c.LastContactDate, c.EngagementScore,
             c.Status, c.ContactHash, c.DuplicateOfContactID, c.CreatedDate, c.UpdatedDate;

    -- Timeline of interactions
    SELECT
        ct.ContactTimelineID,
        ct.TimelineEventType,
        ct.EventTitle,
        ct.EventDescription,
        ct.EventDate,
        ci.Title AS RelatedContentTitle
    FROM dbo.ContactTimeline ct
    LEFT JOIN dbo.ShareEvent se ON ct.ShareEventID = se.ShareEventID
    LEFT JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
    WHERE ct.ContactID = @ContactID
    ORDER BY ct.EventDate DESC;

    -- Recent engagements
    SELECT TOP 20
        ee.EventType,
        ee.EventDate,
        ci.Title AS ContentTitle,
        ci.ContentType
    FROM dbo.EngagementEvent ee
    INNER JOIN dbo.ContentItem ci ON ee.ContentItemID = ci.ContentItemID
    WHERE ee.ContactID = @ContactID
    ORDER BY ee.EventDate DESC;
END
GO

/*******************************************************************************
 * 6. ANALYTICS PROCEDURES
 ******************************************************************************/

-- Get User Analytics
CREATE OR ALTER PROCEDURE dbo.usp_GetUserAnalytics
    @UserID BIGINT,
    @StartDate DATETIME2(7) = NULL,
    @EndDate DATETIME2(7) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Default to last 30 days
    SET @StartDate = ISNULL(@StartDate, DATEADD(DAY, -30, SYSDATETIME()));
    SET @EndDate = ISNULL(@EndDate, SYSDATETIME());

    -- Share summary by channel
    SELECT
        ShareChannel,
        COUNT(*) AS ShareCount,
        SUM(RecipientCount) AS TotalRecipients,
        SUM(ClickCount) AS TotalClicks,
        SUM(UniqueClickCount) AS UniqueClicks,
        CAST(SUM(ClickCount) AS FLOAT) / NULLIF(COUNT(*), 0) AS AvgClicksPerShare
    FROM dbo.ShareEvent
    WHERE UserID = @UserID
        AND ShareDate BETWEEN @StartDate AND @EndDate
    GROUP BY ShareChannel;

    -- Top performing content
    SELECT TOP 10
        ci.ContentItemID,
        ci.Title,
        ci.ContentType,
        COUNT(DISTINCT se.ShareEventID) AS TimesShared,
        SUM(se.ClickCount) AS TotalClicks,
        SUM(se.UniqueClickCount) AS UniqueClicks
    FROM dbo.ShareEvent se
    INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
    WHERE se.UserID = @UserID
        AND se.ShareDate BETWEEN @StartDate AND @EndDate
    GROUP BY ci.ContentItemID, ci.Title, ci.ContentType
    ORDER BY SUM(se.ClickCount) DESC;

    -- Engagement over time (daily)
    SELECT
        CAST(se.ShareDate AS DATE) AS ShareDate,
        COUNT(DISTINCT se.ShareEventID) AS Shares,
        SUM(se.ClickCount) AS Clicks
    FROM dbo.ShareEvent se
    WHERE se.UserID = @UserID
        AND se.ShareDate BETWEEN @StartDate AND @EndDate
    GROUP BY CAST(se.ShareDate AS DATE)
    ORDER BY CAST(se.ShareDate AS DATE);
END
GO

-- Get Content Performance Report
CREATE OR ALTER PROCEDURE dbo.usp_GetContentPerformanceReport
    @StartDate DATETIME2(7) = NULL,
    @EndDate DATETIME2(7) = NULL,
    @MarketID INT = NULL,
    @CampaignID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @StartDate = ISNULL(@StartDate, DATEADD(DAY, -30, SYSDATETIME()));
    SET @EndDate = ISNULL(@EndDate, SYSDATETIME());

    SELECT
        ci.ContentItemID,
        ci.Title,
        ci.ContentType,
        cc.CategoryName,
        COUNT(DISTINCT se.ShareEventID) AS TotalShares,
        COUNT(DISTINCT se.UserID) AS UniqueSharers,
        SUM(se.RecipientCount) AS TotalRecipients,
        SUM(se.ClickCount) AS TotalClicks,
        SUM(se.UniqueClickCount) AS UniqueClicks,
        CAST(SUM(se.ClickCount) AS FLOAT) / NULLIF(SUM(se.RecipientCount), 0) * 100 AS ClickThroughRate
    FROM dbo.ContentItem ci
    LEFT JOIN dbo.ShareEvent se ON ci.ContentItemID = se.ContentItemID
        AND se.ShareDate BETWEEN @StartDate AND @EndDate
    LEFT JOIN dbo.ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
    LEFT JOIN dbo.ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
    LEFT JOIN dbo.ContentItemMarket cim ON ci.ContentItemID = cim.ContentItemID
    LEFT JOIN dbo.CampaignContent cmc ON ci.ContentItemID = cmc.ContentItemID
    WHERE ci.PublishStatus = 'Published'
        AND (@MarketID IS NULL OR cim.MarketID = @MarketID)
        AND (@CampaignID IS NULL OR cmc.CampaignID = @CampaignID)
    GROUP BY ci.ContentItemID, ci.Title, ci.ContentType, cc.CategoryName
    ORDER BY COUNT(DISTINCT se.ShareEventID) DESC;
END
GO

PRINT 'Stored procedures created successfully';
GO
