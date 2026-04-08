/*******************************************************************************
 * Create Test Database - Simple Version
 * Uses SQL Server default file locations
 ******************************************************************************/

USE [master];
GO

-- Drop existing test database if it exists
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'UnFranchiseMarketing_Test')
BEGIN
    PRINT 'Dropping existing test database...';
    ALTER DATABASE [UnFranchiseMarketing_Test] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [UnFranchiseMarketing_Test];
    PRINT 'Test database dropped.';
END
GO

-- Create test database (using default file locations)
PRINT 'Creating test database...';
CREATE DATABASE [UnFranchiseMarketing_Test];
GO

PRINT 'Test database created successfully.';
GO

-- Switch to test database
USE [UnFranchiseMarketing_Test];
GO

-- Create SQL login if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'unfranchise_app')
BEGIN
    PRINT 'Creating SQL Server login for unfranchise_app...';
    -- Note: You may need to set a different password
    CREATE LOGIN [unfranchise_app] WITH PASSWORD = 'UnFr@nch1se2026!';
    PRINT 'Login created.';
END
ELSE
BEGIN
    PRINT 'Login unfranchise_app already exists.';
END
GO

-- Create database user
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'unfranchise_app')
BEGIN
    PRINT 'Creating database user for unfranchise_app...';
    CREATE USER [unfranchise_app] FOR LOGIN [unfranchise_app];
    PRINT 'User created.';
END
ELSE
BEGIN
    PRINT 'User unfranchise_app already exists.';
END
GO

-- Grant db_owner permissions
PRINT 'Granting db_owner permissions...';
EXEC sp_addrolemember 'db_owner', 'unfranchise_app';
GO

PRINT 'Permissions granted.';
GO

-- Verify
SELECT
    dp.name as UserName,
    dp.type_desc as UserType,
    r.name as RoleName
FROM sys.database_principals dp
LEFT JOIN sys.database_role_members drm ON dp.principal_id = drm.member_principal_id
LEFT JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'unfranchise_app';
GO

PRINT '';
PRINT '========================================';
PRINT 'Test Database Created Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Next: Run the schema setup script';
PRINT 'Command: node setup-test-db-no-create.js';
PRINT '========================================';
GO
