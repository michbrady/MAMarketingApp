/*******************************************************************************
 * Create Test Database for UnFranchise Marketing App
 *
 * This script creates the test database and grants necessary permissions.
 * Run this script as a user with CREATE DATABASE permissions (e.g., sa or DBA)
 *
 * Database: UnFranchiseMarketing_Test
 * User: unfranchise_app
 *
 * Instructions:
 * 1. Open this file in SQL Server Management Studio (SSMS)
 * 2. Connect to: dbms-dwhs.corp.shop.com\DWP01
 * 3. Execute the entire script
 ******************************************************************************/

USE [master];
GO

-- Drop existing test database if it exists (clean slate)
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'UnFranchiseMarketing_Test')
BEGIN
    PRINT 'Dropping existing test database...';
    ALTER DATABASE [UnFranchiseMarketing_Test] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [UnFranchiseMarketing_Test];
    PRINT 'Test database dropped.';
END
GO

-- Create test database
PRINT 'Creating test database...';
CREATE DATABASE [UnFranchiseMarketing_Test]
ON PRIMARY
(
    NAME = N'UnFranchiseMarketing_Test_Data',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.DWP01\MSSQL\DATA\UnFranchiseMarketing_Test.mdf',
    SIZE = 100MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10MB
)
LOG ON
(
    NAME = N'UnFranchiseMarketing_Test_Log',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.DWP01\MSSQL\DATA\UnFranchiseMarketing_Test_log.ldf',
    SIZE = 50MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10MB
);
GO

PRINT 'Test database created successfully.';
GO

-- Switch to test database
USE [UnFranchiseMarketing_Test];
GO

-- Grant permissions to application user
PRINT 'Granting permissions to unfranchise_app user...';

-- Make unfranchise_app a member of db_owner role for full control
EXEC sp_addrolemember 'db_owner', 'unfranchise_app';
GO

-- Verify permissions
PRINT 'Verifying user permissions...';

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
PRINT 'Test Database Setup Complete!';
PRINT '========================================';
PRINT 'Database: UnFranchiseMarketing_Test';
PRINT 'User: unfranchise_app';
PRINT 'Permissions: db_owner (full control)';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Run: node setup-test-db-no-create.js';
PRINT '   (This will create all tables, views, and stored procedures)';
PRINT '';
PRINT '2. Run integration tests:';
PRINT '   npm run test:api';
PRINT '========================================';
GO
