-- Create SQL Server Login and User for UnFranchise Marketing App
-- Run this on your SQL Server to create application credentials

USE master;
GO

-- Create SQL Server login
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'unfranchise_app')
BEGIN
    CREATE LOGIN unfranchise_app
    WITH PASSWORD = 'UnFr@nch1se2026!',
    DEFAULT_DATABASE = UnFranchiseMarketing,
    CHECK_POLICY = OFF,
    CHECK_EXPIRATION = OFF;

    PRINT 'Login created: unfranchise_app';
END
ELSE
BEGIN
    PRINT 'Login already exists: unfranchise_app';
END
GO

-- Switch to application database
USE UnFranchiseMarketing;
GO

-- Create database user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'unfranchise_app')
BEGIN
    CREATE USER unfranchise_app FOR LOGIN unfranchise_app;
    PRINT 'User created: unfranchise_app';
END
ELSE
BEGIN
    PRINT 'User already exists: unfranchise_app';
END
GO

-- Grant permissions
-- db_datareader: Read all tables
-- db_datawriter: Insert/Update/Delete on all tables
ALTER ROLE db_datareader ADD MEMBER unfranchise_app;
ALTER ROLE db_datawriter ADD MEMBER unfranchise_app;
GO

-- Grant EXECUTE on all stored procedures
GRANT EXECUTE TO unfranchise_app;
GO

PRINT 'Permissions granted successfully!';
PRINT '';
PRINT 'Connection details:';
PRINT '  Server:   dbms-dwhs.corp.shop.com\DWP01';
PRINT '  Database: UnFranchiseMarketing';
PRINT '  Username: unfranchise_app';
PRINT '  Password: UnFr@nch1se2026!';
GO
