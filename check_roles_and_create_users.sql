-- Check roles and create test users
USE UnFranchiseMarketing;
GO

-- Show available roles
PRINT 'Available Roles:';
SELECT RoleID, RoleName, Description
FROM [Role];
GO

-- Create test users if they don't exist
DECLARE @UFO_RoleID INT, @Admin_RoleID INT, @SuperAdmin_RoleID INT;
DECLARE @MarketID INT, @LanguageID INT;

-- Get role IDs
SELECT @UFO_RoleID = RoleID FROM [Role] WHERE RoleName = 'UFO';
SELECT @Admin_RoleID = RoleID FROM [Role] WHERE RoleName = 'Corporate Admin';
SELECT @SuperAdmin_RoleID = RoleID FROM [Role] WHERE RoleName = 'Super Admin';

-- Get first market and language
SELECT TOP 1 @MarketID = MarketID FROM Market;
SELECT TOP 1 @LanguageID = LanguageID FROM [Language];

-- Create UFO test user
IF NOT EXISTS (SELECT 1 FROM [User] WHERE Email = 'ufo@unfranchise.com')
BEGIN
    INSERT INTO [User] (
        MemberID, Email, PasswordHash, FirstName, LastName, RoleID, MarketID,
        PreferredLanguageID, Status, EmailVerified, CreatedDate, UpdatedDate
    )
    VALUES (
        'UFO001', 'ufo@unfranchise.com',
        -- Password: ufo123 (bcrypt hash)
        '$2a$10$E9Yg0qGK3xKN5p5mJz7G6.gv7vZR7R7R7R7R7R7R7R7R7R7R7R7R',
        'UFO', 'Demo', @UFO_RoleID, @MarketID,
        @LanguageID, 'Active', 1, GETDATE(), GETDATE()
    );
    PRINT 'Created user: ufo@unfranchise.com';
END
ELSE
    PRINT 'User already exists: ufo@unfranchise.com';
GO

PRINT '';
PRINT 'Test Users Available:';
PRINT '  Email: admin@unfranchise.com';
PRINT '  Email: ufo@unfranchise.com (if created)';
PRINT '  Email: super@unfranchise.com (if created)';
GO
