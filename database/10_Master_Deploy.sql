/*******************************************************************************
 * UnFranchise Marketing App - Master Deployment Script
 * Microsoft SQL Server 2019+
 *
 * This script orchestrates the complete database deployment.
 * Execute this after creating the database.
 *
 * Usage:
 *   1. Create database: CREATE DATABASE UnFranchiseMarketingApp;
 *   2. Set database context: USE UnFranchiseMarketingApp;
 *   3. Execute this script
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 * Version: 1.0
 ******************************************************************************/

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Verify database context
IF DB_NAME() != 'UnFranchiseMarketingApp'
BEGIN
    RAISERROR('ERROR: This script must be run in the UnFranchiseMarketingApp database context.', 16, 1);
    RETURN;
END
GO

PRINT '===============================================================================';
PRINT 'UnFranchise Marketing App - Database Deployment';
PRINT '===============================================================================';
PRINT 'Database: ' + DB_NAME();
PRINT 'Server: ' + @@SERVERNAME;
PRINT 'Start Time: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '';
GO

/*******************************************************************************
 * PHASE 1: CORE TABLES
 ******************************************************************************/

PRINT 'PHASE 1: Creating Core Tables...';
PRINT '--------------------------------------------------------------------------------';
GO

-- Reference Data Tables
PRINT '  Creating Market table...';
CREATE TABLE dbo.Market (
    MarketID INT IDENTITY(1,1) NOT NULL,
    MarketCode NVARCHAR(10) NOT NULL,
    MarketName NVARCHAR(100) NOT NULL,
    CountryCode NVARCHAR(3) NOT NULL,
    Region NVARCHAR(50) NULL,
    CurrencyCode NVARCHAR(3) NOT NULL,
    TimeZone NVARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    RequiresCompliance BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Market PRIMARY KEY CLUSTERED (MarketID),
    CONSTRAINT UQ_Market_MarketCode UNIQUE (MarketCode)
);
CREATE NONCLUSTERED INDEX IX_Market_Active ON dbo.Market(IsActive, MarketCode);
PRINT '  ✓ Market table created';
GO

PRINT '  Creating Language table...';
CREATE TABLE dbo.Language (
    LanguageID INT IDENTITY(1,1) NOT NULL,
    LanguageCode NVARCHAR(10) NOT NULL,
    LanguageName NVARCHAR(100) NOT NULL,
    NativeName NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Language PRIMARY KEY CLUSTERED (LanguageID),
    CONSTRAINT UQ_Language_LanguageCode UNIQUE (LanguageCode)
);
PRINT '  ✓ Language table created';
GO

PRINT '  Creating Role table...';
CREATE TABLE dbo.Role (
    RoleID INT IDENTITY(1,1) NOT NULL,
    RoleName NVARCHAR(50) NOT NULL,
    RoleDescription NVARCHAR(255) NULL,
    PermissionLevel INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Role PRIMARY KEY CLUSTERED (RoleID),
    CONSTRAINT UQ_Role_RoleName UNIQUE (RoleName)
);
PRINT '  ✓ Role table created';
GO

-- Note: For brevity, this master script creates a subset of tables.
-- In production, this would execute the individual SQL files via sqlcmd or SSMS.
-- The following is a template showing the pattern.

PRINT '';
PRINT 'NOTE: This is a simplified master deployment script.';
PRINT 'For complete deployment, execute individual scripts in order:';
PRINT '  1. 02_Schema_Core_Tables.sql';
PRINT '  2. 03_Schema_Sharing_Tracking.sql';
PRINT '  3. 04_Schema_Notifications_Audit.sql';
PRINT '  4. 05_Stored_Procedures.sql';
PRINT '  5. 06_Views.sql';
PRINT '  6. 07_Seed_Data.sql (development only)';
PRINT '';
PRINT 'Alternatively, use the following PowerShell command from the database directory:';
PRINT '';
PRINT 'Get-ChildItem -Filter "*.sql" | Where-Object { $_.Name -match "^0[2-6]" } | ForEach-Object {';
PRINT '    Write-Host "Executing $($_.Name)...";';
PRINT '    Invoke-Sqlcmd -ServerInstance "localhost" -Database "UnFranchiseMarketingApp" -InputFile $_.FullName;';
PRINT '}';
PRINT '';
GO

/*******************************************************************************
 * ALTERNATIVE: EXECUTE INDIVIDUAL SCRIPTS VIA xp_cmdshell
 * (Requires xp_cmdshell to be enabled - use with caution)
 ******************************************************************************/

/*
-- Enable xp_cmdshell (if needed)
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
GO

DECLARE @ScriptPath NVARCHAR(500) = 'C:\Path\To\Database\Scripts\';
DECLARE @Command NVARCHAR(1000);

-- Execute Core Tables
SET @Command = 'sqlcmd -S ' + @@SERVERNAME + ' -d UnFranchiseMarketingApp -i "' + @ScriptPath + '02_Schema_Core_Tables.sql"';
EXEC xp_cmdshell @Command;

-- Execute Sharing/Tracking Tables
SET @Command = 'sqlcmd -S ' + @@SERVERNAME + ' -d UnFranchiseMarketingApp -i "' + @ScriptPath + '03_Schema_Sharing_Tracking.sql"';
EXEC xp_cmdshell @Command;

-- Execute Notifications/Audit Tables
SET @Command = 'sqlcmd -S ' + @@SERVERNAME + ' -d UnFranchiseMarketingApp -i "' + @ScriptPath + '04_Schema_Notifications_Audit.sql"';
EXEC xp_cmdshell @Command;

-- Execute Stored Procedures
SET @Command = 'sqlcmd -S ' + @@SERVERNAME + ' -d UnFranchiseMarketingApp -i "' + @ScriptPath + '05_Stored_Procedures.sql"';
EXEC xp_cmdshell @Command;

-- Execute Views
SET @Command = 'sqlcmd -S ' + @@SERVERNAME + ' -d UnFranchiseMarketingApp -i "' + @ScriptPath + '06_Views.sql"';
EXEC xp_cmdshell @Command;

-- Disable xp_cmdshell
EXEC sp_configure 'xp_cmdshell', 0;
RECONFIGURE;
EXEC sp_configure 'show advanced options', 0;
RECONFIGURE;
GO
*/

/*******************************************************************************
 * POST-DEPLOYMENT CONFIGURATION
 ******************************************************************************/

PRINT '===============================================================================';
PRINT 'Post-Deployment Configuration';
PRINT '===============================================================================';
GO

-- Enable Query Store
PRINT 'Enabling Query Store...';
ALTER DATABASE UnFranchiseMarketingApp
SET QUERY_STORE = ON;

ALTER DATABASE UnFranchiseMarketingApp
SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO
);
PRINT '✓ Query Store enabled';
GO

-- Set database options
PRINT 'Configuring database options...';
ALTER DATABASE UnFranchiseMarketingApp
SET READ_COMMITTED_SNAPSHOT ON;

ALTER DATABASE UnFranchiseMarketingApp
SET AUTO_CREATE_STATISTICS ON;

ALTER DATABASE UnFranchiseMarketingApp
SET AUTO_UPDATE_STATISTICS ON;

ALTER DATABASE UnFranchiseMarketingApp
SET AUTO_UPDATE_STATISTICS_ASYNC OFF;
PRINT '✓ Database options configured';
GO

/*******************************************************************************
 * DEPLOYMENT VERIFICATION
 ******************************************************************************/

PRINT '';
PRINT '===============================================================================';
PRINT 'Deployment Verification';
PRINT '===============================================================================';
GO

-- Check tables
DECLARE @TableCount INT;
SELECT @TableCount = COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0;
PRINT 'Tables created: ' + CAST(@TableCount AS NVARCHAR(10));

-- Check stored procedures
DECLARE @ProcCount INT;
SELECT @ProcCount = COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0;
PRINT 'Stored procedures created: ' + CAST(@ProcCount AS NVARCHAR(10));

-- Check views
DECLARE @ViewCount INT;
SELECT @ViewCount = COUNT(*) FROM sys.views WHERE is_ms_shipped = 0;
PRINT 'Views created: ' + CAST(@ViewCount AS NVARCHAR(10));

-- Check indexes
DECLARE @IndexCount INT;
SELECT @IndexCount = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.type > 0 AND t.is_ms_shipped = 0;
PRINT 'Indexes created: ' + CAST(@IndexCount AS NVARCHAR(10));

-- Check foreign keys
DECLARE @FKCount INT;
SELECT @FKCount = COUNT(*) FROM sys.foreign_keys;
PRINT 'Foreign key constraints: ' + CAST(@FKCount AS NVARCHAR(10));
GO

/*******************************************************************************
 * DEPLOYMENT SUMMARY
 ******************************************************************************/

PRINT '';
PRINT '===============================================================================';
PRINT 'Deployment Summary';
PRINT '===============================================================================';
PRINT 'End Time: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '';
PRINT 'Deployment Status: PARTIAL DEPLOYMENT COMPLETED';
PRINT '';
PRINT 'IMPORTANT: This master script created reference tables only.';
PRINT '';
PRINT 'To complete deployment, execute the following scripts in order:';
PRINT '  1. 02_Schema_Core_Tables.sql';
PRINT '  2. 03_Schema_Sharing_Tracking.sql';
PRINT '  3. 04_Schema_Notifications_Audit.sql';
PRINT '  4. 05_Stored_Procedures.sql';
PRINT '  5. 06_Views.sql';
PRINT '  6. 07_Seed_Data.sql (optional - development only)';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Execute remaining schema scripts';
PRINT '  2. Create database users and assign roles';
PRINT '  3. Configure SQL Server Agent jobs (see 09_Deployment_Guide.md)';
PRINT '  4. Set up backup strategy';
PRINT '  5. Enable monitoring and alerts';
PRINT '  6. Load production data or seed data';
PRINT '';
PRINT 'For detailed instructions, see: 09_Deployment_Guide.md';
PRINT '===============================================================================';
GO

-- Reset SET options
SET NOCOUNT OFF;
GO
