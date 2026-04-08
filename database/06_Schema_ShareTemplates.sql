/*******************************************************************************
 * UnFranchise Marketing App - Database Schema
 * Microsoft SQL Server 2019+
 *
 * Part 6: Share Templates
 *
 * Author: Database Architecture Team
 * Created: 2026-04-05
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * SHARE TEMPLATES
 ******************************************************************************/

CREATE TABLE dbo.ShareTemplate (
    ShareTemplateID INT IDENTITY(1,1) NOT NULL,

    -- Template Identity
    TemplateName NVARCHAR(100) NOT NULL,
    TemplateDescription NVARCHAR(500) NULL,

    -- Channel and Content Type
    ShareChannel NVARCHAR(20) NOT NULL,              -- SMS, Email, Social
    SocialPlatform NVARCHAR(50) NULL,                -- Facebook, Twitter, LinkedIn, Instagram (for Social channel)
    ContentType NVARCHAR(50) NULL,                   -- Product, BusinessOpportunity, Event, General

    -- Template Content
    SubjectTemplate NVARCHAR(255) NULL,              -- For Email
    MessageTemplate NVARCHAR(MAX) NOT NULL,          -- Main template with {variables}

    -- HTML for Email
    HTMLTemplate NVARCHAR(MAX) NULL,                 -- HTML version for email

    -- Template Metadata
    IsDefault BIT NOT NULL DEFAULT 0,                -- Default template for channel+contentType
    IsActive BIT NOT NULL DEFAULT 1,
    IsSystemTemplate BIT NOT NULL DEFAULT 0,         -- System templates can't be deleted

    -- Character Limits (for validation)
    MaxCharacters INT NULL,                          -- NULL = no limit

    -- Performance Tracking
    UsageCount INT NOT NULL DEFAULT 0,
    TotalShares INT NOT NULL DEFAULT 0,
    TotalClicks INT NOT NULL DEFAULT 0,
    ClickThroughRate DECIMAL(5,2) NULL,              -- CTR percentage
    LastUsedDate DATETIME2(7) NULL,

    -- Market/Language Support
    MarketID INT NULL,                               -- NULL = all markets
    LanguageID INT NULL,                             -- NULL = all languages

    -- Audit
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_ShareTemplate PRIMARY KEY CLUSTERED (ShareTemplateID),
    CONSTRAINT FK_ShareTemplate_Market FOREIGN KEY (MarketID) REFERENCES dbo.Market(MarketID),
    CONSTRAINT FK_ShareTemplate_Language FOREIGN KEY (LanguageID) REFERENCES dbo.Language(LanguageID),
    CONSTRAINT FK_ShareTemplate_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_ShareTemplate_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.[User](UserID),
    CONSTRAINT CK_ShareTemplate_Channel CHECK (ShareChannel IN ('SMS', 'Email', 'Social')),
    CONSTRAINT CK_ShareTemplate_SocialPlatform CHECK (
        SocialPlatform IS NULL OR
        SocialPlatform IN ('Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'WhatsApp', 'WeChat')
    )
);
GO

CREATE NONCLUSTERED INDEX IX_ShareTemplate_Channel_Type ON dbo.ShareTemplate(ShareChannel, ContentType, IsActive);
CREATE NONCLUSTERED INDEX IX_ShareTemplate_Default ON dbo.ShareTemplate(ShareChannel, ContentType, IsDefault)
    WHERE IsDefault = 1 AND IsActive = 1;
CREATE NONCLUSTERED INDEX IX_ShareTemplate_Market_Language ON dbo.ShareTemplate(MarketID, LanguageID)
    WHERE MarketID IS NOT NULL OR LanguageID IS NOT NULL;
CREATE NONCLUSTERED INDEX IX_ShareTemplate_Performance ON dbo.ShareTemplate(ClickThroughRate DESC, TotalShares DESC)
    WHERE IsActive = 1;
CREATE NONCLUSTERED INDEX IX_ShareTemplate_Platform ON dbo.ShareTemplate(SocialPlatform, IsActive)
    WHERE SocialPlatform IS NOT NULL;
GO

/*******************************************************************************
 * UPDATE ShareEvent TABLE TO REFERENCE ShareTemplate
 ******************************************************************************/

-- Add foreign key constraint to ShareEvent.ShareTemplate if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ShareEvent_ShareTemplate')
BEGIN
    -- First, we need to change ShareTemplate column type in ShareEvent to INT
    -- This requires careful migration if data exists

    -- For now, we'll add a new column and later migrate
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ShareEvent') AND name = 'ShareTemplateID')
    BEGIN
        ALTER TABLE dbo.ShareEvent
        ADD ShareTemplateID INT NULL;

        ALTER TABLE dbo.ShareEvent
        ADD CONSTRAINT FK_ShareEvent_ShareTemplate
        FOREIGN KEY (ShareTemplateID) REFERENCES dbo.ShareTemplate(ShareTemplateID);

        CREATE NONCLUSTERED INDEX IX_ShareEvent_Template ON dbo.ShareEvent(ShareTemplateID)
        WHERE ShareTemplateID IS NOT NULL;
    END
END
GO

/*******************************************************************************
 * HELPER STORED PROCEDURES
 ******************************************************************************/

-- Get default template for a channel and content type
CREATE OR ALTER PROCEDURE dbo.sp_GetDefaultTemplate
    @ShareChannel NVARCHAR(20),
    @ContentType NVARCHAR(50) = NULL,
    @SocialPlatform NVARCHAR(50) = NULL,
    @MarketID INT = NULL,
    @LanguageID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        ShareTemplateID,
        TemplateName,
        TemplateDescription,
        ShareChannel,
        SocialPlatform,
        ContentType,
        SubjectTemplate,
        MessageTemplate,
        HTMLTemplate,
        IsDefault,
        MaxCharacters,
        ClickThroughRate
    FROM dbo.ShareTemplate
    WHERE ShareChannel = @ShareChannel
        AND IsActive = 1
        AND (ContentType = @ContentType OR ContentType IS NULL OR @ContentType IS NULL)
        AND (SocialPlatform = @SocialPlatform OR SocialPlatform IS NULL OR @SocialPlatform IS NULL)
        AND (MarketID = @MarketID OR MarketID IS NULL)
        AND (LanguageID = @LanguageID OR LanguageID IS NULL)
    ORDER BY
        CASE WHEN IsDefault = 1 THEN 0 ELSE 1 END,
        CASE WHEN ContentType = @ContentType THEN 0 ELSE 1 END,
        CASE WHEN MarketID IS NOT NULL THEN 0 ELSE 1 END,
        ClickThroughRate DESC,
        CreatedDate DESC;
END
GO

-- Update template performance metrics
CREATE OR ALTER PROCEDURE dbo.sp_UpdateTemplatePerformance
    @ShareTemplateID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ShareTemplate
    SET
        TotalShares = (
            SELECT COUNT(*)
            FROM dbo.ShareEvent
            WHERE ShareTemplateID = @ShareTemplateID
        ),
        TotalClicks = (
            SELECT SUM(ClickCount)
            FROM dbo.ShareEvent
            WHERE ShareTemplateID = @ShareTemplateID
        ),
        ClickThroughRate = CASE
            WHEN (SELECT COUNT(*) FROM dbo.ShareEvent WHERE ShareTemplateID = @ShareTemplateID) > 0
            THEN (
                CAST((SELECT SUM(ClickCount) FROM dbo.ShareEvent WHERE ShareTemplateID = @ShareTemplateID) AS DECIMAL(10,2)) /
                CAST((SELECT COUNT(*) FROM dbo.ShareEvent WHERE ShareTemplateID = @ShareTemplateID) AS DECIMAL(10,2))
            ) * 100
            ELSE 0
        END,
        LastUsedDate = (
            SELECT MAX(ShareDate)
            FROM dbo.ShareEvent
            WHERE ShareTemplateID = @ShareTemplateID
        ),
        UpdatedDate = SYSDATETIME()
    WHERE ShareTemplateID = @ShareTemplateID;
END
GO

-- Increment template usage count
CREATE OR ALTER PROCEDURE dbo.sp_IncrementTemplateUsage
    @ShareTemplateID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ShareTemplate
    SET
        UsageCount = UsageCount + 1,
        LastUsedDate = SYSDATETIME(),
        UpdatedDate = SYSDATETIME()
    WHERE ShareTemplateID = @ShareTemplateID;
END
GO

-- Set default template for a channel/content type
CREATE OR ALTER PROCEDURE dbo.sp_SetDefaultTemplate
    @ShareTemplateID INT,
    @ShareChannel NVARCHAR(20),
    @ContentType NVARCHAR(50) = NULL,
    @SocialPlatform NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Remove default flag from other templates with same criteria
        UPDATE dbo.ShareTemplate
        SET IsDefault = 0, UpdatedDate = SYSDATETIME()
        WHERE ShareChannel = @ShareChannel
            AND (ContentType = @ContentType OR (ContentType IS NULL AND @ContentType IS NULL))
            AND (SocialPlatform = @SocialPlatform OR (SocialPlatform IS NULL AND @SocialPlatform IS NULL))
            AND ShareTemplateID != @ShareTemplateID;

        -- Set this template as default
        UPDATE dbo.ShareTemplate
        SET IsDefault = 1, UpdatedDate = SYSDATETIME()
        WHERE ShareTemplateID = @ShareTemplateID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'ShareTemplate table and stored procedures created successfully.';
