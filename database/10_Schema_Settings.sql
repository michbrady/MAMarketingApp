-- =============================================
-- System Settings Schema
-- Sprint 7: Admin Panel & User Management
-- =============================================

USE unfranchise_marketing;
GO

-- =============================================
-- System Settings Table
-- Stores application-wide configuration settings
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemSettings')
BEGIN
    CREATE TABLE SystemSettings (
        SettingID INT PRIMARY KEY IDENTITY(1,1),
        SettingKey NVARCHAR(100) NOT NULL UNIQUE,
        SettingValue NVARCHAR(MAX),
        Category NVARCHAR(50),
        DataType NVARCHAR(20) NOT NULL, -- string, number, boolean, json
        Description NVARCHAR(500),
        IsEncrypted BIT DEFAULT 0,
        UpdatedBy INT,
        UpdatedDate DATETIME2 DEFAULT GETDATE(),
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_SystemSettings_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES [User](UserID)
    );

    -- Index on category for fast filtering
    CREATE NONCLUSTERED INDEX IDX_SystemSettings_Category ON SystemSettings(Category);

    PRINT 'SystemSettings table created';
END
ELSE
BEGIN
    PRINT 'SystemSettings table already exists';
END
GO

-- =============================================
-- Feature Flags Table
-- Manage feature toggles for the application
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FeatureFlag')
BEGIN
    CREATE TABLE FeatureFlag (
        FeatureFlagID INT PRIMARY KEY IDENTITY(1,1),
        FeatureName NVARCHAR(100) NOT NULL UNIQUE,
        IsEnabled BIT DEFAULT 0,
        Description NVARCHAR(500),
        EnabledBy INT,
        EnabledDate DATETIME2,
        DisabledBy INT,
        DisabledDate DATETIME2,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_FeatureFlag_EnabledBy FOREIGN KEY (EnabledBy) REFERENCES [User](UserID),
        CONSTRAINT FK_FeatureFlag_DisabledBy FOREIGN KEY (DisabledBy) REFERENCES [User](UserID)
    );

    PRINT 'FeatureFlag table created';
END
ELSE
BEGIN
    PRINT 'FeatureFlag table already exists';
END
GO

-- =============================================
-- Maintenance Mode Table
-- Track maintenance mode status and messages
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MaintenanceMode')
BEGIN
    CREATE TABLE MaintenanceMode (
        MaintenanceModeID INT PRIMARY KEY IDENTITY(1,1),
        IsEnabled BIT DEFAULT 0,
        Message NVARCHAR(1000),
        ScheduledStart DATETIME2,
        ScheduledEnd DATETIME2,
        EnabledBy INT,
        EnabledDate DATETIME2,
        DisabledBy INT,
        DisabledDate DATETIME2,
        CONSTRAINT FK_MaintenanceMode_EnabledBy FOREIGN KEY (EnabledBy) REFERENCES [User](UserID),
        CONSTRAINT FK_MaintenanceMode_DisabledBy FOREIGN KEY (DisabledBy) REFERENCES [User](UserID)
    );

    -- Insert default record (disabled)
    INSERT INTO MaintenanceMode (IsEnabled, Message)
    VALUES (0, 'System is currently under maintenance. Please check back soon.');

    PRINT 'MaintenanceMode table created';
END
ELSE
BEGIN
    PRINT 'MaintenanceMode table already exists';
END
GO

-- =============================================
-- Settings Change Audit Log
-- Track all changes to system settings
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SettingsChangeLog')
BEGIN
    CREATE TABLE SettingsChangeLog (
        ChangeLogID INT PRIMARY KEY IDENTITY(1,1),
        SettingKey NVARCHAR(100) NOT NULL,
        OldValue NVARCHAR(MAX),
        NewValue NVARCHAR(MAX),
        ChangedBy INT NOT NULL,
        ChangedDate DATETIME2 DEFAULT GETDATE(),
        IPAddress NVARCHAR(45),
        UserAgent NVARCHAR(500),
        CONSTRAINT FK_SettingsChangeLog_ChangedBy FOREIGN KEY (ChangedBy) REFERENCES [User](UserID)
    );

    -- Index for audit queries
    CREATE NONCLUSTERED INDEX IDX_SettingsChangeLog_SettingKey ON SettingsChangeLog(SettingKey, ChangedDate DESC);
    CREATE NONCLUSTERED INDEX IDX_SettingsChangeLog_ChangedBy ON SettingsChangeLog(ChangedBy, ChangedDate DESC);

    PRINT 'SettingsChangeLog table created';
END
ELSE
BEGIN
    PRINT 'SettingsChangeLog table already exists';
END
GO

-- =============================================
-- Content Approval Status Extension
-- Add approval workflow fields to Content table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Content') AND name = 'ApprovalStatus')
BEGIN
    ALTER TABLE Content
    ADD ApprovalStatus NVARCHAR(20) DEFAULT 'Approved', -- Pending, Approved, Rejected
        ApprovedBy INT NULL,
        ApprovedDate DATETIME2 NULL,
        RejectedBy INT NULL,
        RejectedDate DATETIME2 NULL,
        RejectionReason NVARCHAR(500) NULL,
        IsFeatured BIT DEFAULT 0,
        FeaturedBy INT NULL,
        FeaturedDate DATETIME2 NULL,
        CONSTRAINT FK_Content_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES [User](UserID),
        CONSTRAINT FK_Content_RejectedBy FOREIGN KEY (RejectedBy) REFERENCES [User](UserID),
        CONSTRAINT FK_Content_FeaturedBy FOREIGN KEY (FeaturedBy) REFERENCES [User](UserID);

    PRINT 'Content approval columns added';
END
ELSE
BEGIN
    PRINT 'Content approval columns already exist';
END
GO

-- =============================================
-- Stored Procedures for Settings Management
-- =============================================

-- Get all settings or by category
IF OBJECT_ID('usp_GetSystemSettings', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetSystemSettings;
GO

CREATE PROCEDURE usp_GetSystemSettings
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SettingID,
        SettingKey,
        SettingValue,
        Category,
        DataType,
        Description,
        IsEncrypted,
        UpdatedBy,
        UpdatedDate,
        CreatedDate
    FROM SystemSettings
    WHERE @Category IS NULL OR Category = @Category
    ORDER BY Category, SettingKey;
END
GO

-- Update a single setting
IF OBJECT_ID('usp_UpdateSystemSetting', 'P') IS NOT NULL
    DROP PROCEDURE usp_UpdateSystemSetting;
GO

CREATE PROCEDURE usp_UpdateSystemSetting
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(MAX),
    @UpdatedBy INT,
    @IPAddress NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @OldValue NVARCHAR(MAX);

    -- Get old value for audit
    SELECT @OldValue = SettingValue
    FROM SystemSettings
    WHERE SettingKey = @SettingKey;

    -- Update setting
    UPDATE SystemSettings
    SET SettingValue = @SettingValue,
        UpdatedBy = @UpdatedBy,
        UpdatedDate = GETDATE()
    WHERE SettingKey = @SettingKey;

    -- Log change
    INSERT INTO SettingsChangeLog (SettingKey, OldValue, NewValue, ChangedBy, IPAddress, UserAgent)
    VALUES (@SettingKey, @OldValue, @SettingValue, @UpdatedBy, @IPAddress, @UserAgent);

    COMMIT TRANSACTION;

    -- Return updated setting
    SELECT
        SettingID,
        SettingKey,
        SettingValue,
        Category,
        DataType,
        Description,
        UpdatedBy,
        UpdatedDate
    FROM SystemSettings
    WHERE SettingKey = @SettingKey;
END
GO

-- Get all feature flags
IF OBJECT_ID('usp_GetFeatureFlags', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetFeatureFlags;
GO

CREATE PROCEDURE usp_GetFeatureFlags
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        FeatureFlagID,
        FeatureName,
        IsEnabled,
        Description,
        EnabledBy,
        EnabledDate,
        DisabledBy,
        DisabledDate,
        CreatedDate
    FROM FeatureFlag
    ORDER BY FeatureName;
END
GO

-- Toggle feature flag
IF OBJECT_ID('usp_ToggleFeatureFlag', 'P') IS NOT NULL
    DROP PROCEDURE usp_ToggleFeatureFlag;
GO

CREATE PROCEDURE usp_ToggleFeatureFlag
    @FeatureName NVARCHAR(100),
    @IsEnabled BIT,
    @ToggledBy INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @IsEnabled = 1
    BEGIN
        UPDATE FeatureFlag
        SET IsEnabled = 1,
            EnabledBy = @ToggledBy,
            EnabledDate = GETDATE()
        WHERE FeatureName = @FeatureName;
    END
    ELSE
    BEGIN
        UPDATE FeatureFlag
        SET IsEnabled = 0,
            DisabledBy = @ToggledBy,
            DisabledDate = GETDATE()
        WHERE FeatureName = @FeatureName;
    END

    -- Return updated flag
    SELECT
        FeatureFlagID,
        FeatureName,
        IsEnabled,
        Description,
        EnabledBy,
        EnabledDate,
        DisabledBy,
        DisabledDate
    FROM FeatureFlag
    WHERE FeatureName = @FeatureName;
END
GO

-- Get maintenance mode status
IF OBJECT_ID('usp_GetMaintenanceStatus', 'P') IS NOT NULL
    DROP PROCEDURE usp_GetMaintenanceStatus;
GO

CREATE PROCEDURE usp_GetMaintenanceStatus
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        MaintenanceModeID,
        IsEnabled,
        Message,
        ScheduledStart,
        ScheduledEnd,
        EnabledBy,
        EnabledDate,
        DisabledBy,
        DisabledDate
    FROM MaintenanceMode
    ORDER BY MaintenanceModeID DESC;
END
GO

-- Enable maintenance mode
IF OBJECT_ID('usp_EnableMaintenanceMode', 'P') IS NOT NULL
    DROP PROCEDURE usp_EnableMaintenanceMode;
GO

CREATE PROCEDURE usp_EnableMaintenanceMode
    @Message NVARCHAR(1000),
    @EnabledBy INT,
    @ScheduledEnd DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE MaintenanceMode
    SET IsEnabled = 1,
        Message = @Message,
        ScheduledEnd = @ScheduledEnd,
        EnabledBy = @EnabledBy,
        EnabledDate = GETDATE()
    WHERE MaintenanceModeID = 1;

    SELECT
        MaintenanceModeID,
        IsEnabled,
        Message,
        ScheduledEnd,
        EnabledBy,
        EnabledDate
    FROM MaintenanceMode
    WHERE MaintenanceModeID = 1;
END
GO

-- Disable maintenance mode
IF OBJECT_ID('usp_DisableMaintenanceMode', 'P') IS NOT NULL
    DROP PROCEDURE usp_DisableMaintenanceMode;
GO

CREATE PROCEDURE usp_DisableMaintenanceMode
    @DisabledBy INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE MaintenanceMode
    SET IsEnabled = 0,
        DisabledBy = @DisabledBy,
        DisabledDate = GETDATE()
    WHERE MaintenanceModeID = 1;

    SELECT
        MaintenanceModeID,
        IsEnabled,
        Message,
        DisabledBy,
        DisabledDate
    FROM MaintenanceMode
    WHERE MaintenanceModeID = 1;
END
GO

-- Approve content
IF OBJECT_ID('usp_ApproveContent', 'P') IS NOT NULL
    DROP PROCEDURE usp_ApproveContent;
GO

CREATE PROCEDURE usp_ApproveContent
    @ContentID INT,
    @ApprovedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Content
    SET ApprovalStatus = 'Approved',
        ApprovedBy = @ApprovedBy,
        ApprovedDate = GETDATE(),
        RejectedBy = NULL,
        RejectedDate = NULL,
        RejectionReason = NULL
    WHERE ContentID = @ContentID;

    SELECT
        ContentID,
        Title,
        ApprovalStatus,
        ApprovedBy,
        ApprovedDate
    FROM Content
    WHERE ContentID = @ContentID;
END
GO

-- Reject content
IF OBJECT_ID('usp_RejectContent', 'P') IS NOT NULL
    DROP PROCEDURE usp_RejectContent;
GO

CREATE PROCEDURE usp_RejectContent
    @ContentID INT,
    @RejectedBy INT,
    @RejectionReason NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Content
    SET ApprovalStatus = 'Rejected',
        RejectedBy = @RejectedBy,
        RejectedDate = GETDATE(),
        RejectionReason = @RejectionReason,
        ApprovedBy = NULL,
        ApprovedDate = NULL
    WHERE ContentID = @ContentID;

    SELECT
        ContentID,
        Title,
        ApprovalStatus,
        RejectedBy,
        RejectedDate,
        RejectionReason
    FROM Content
    WHERE ContentID = @ContentID;
END
GO

-- Feature content
IF OBJECT_ID('usp_FeatureContent', 'P') IS NOT NULL
    DROP PROCEDURE usp_FeatureContent;
GO

CREATE PROCEDURE usp_FeatureContent
    @ContentID INT,
    @FeaturedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Content
    SET IsFeatured = 1,
        FeaturedBy = @FeaturedBy,
        FeaturedDate = GETDATE()
    WHERE ContentID = @ContentID;

    SELECT
        ContentID,
        Title,
        IsFeatured,
        FeaturedBy,
        FeaturedDate
    FROM Content
    WHERE ContentID = @ContentID;
END
GO

-- Unfeature content
IF OBJECT_ID('usp_UnfeatureContent', 'P') IS NOT NULL
    DROP PROCEDURE usp_UnfeatureContent;
GO

CREATE PROCEDURE usp_UnfeatureContent
    @ContentID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Content
    SET IsFeatured = 0,
        FeaturedBy = NULL,
        FeaturedDate = NULL
    WHERE ContentID = @ContentID;

    SELECT
        ContentID,
        Title,
        IsFeatured
    FROM Content
    WHERE ContentID = @ContentID;
END
GO

PRINT 'System Settings schema and procedures created successfully';
