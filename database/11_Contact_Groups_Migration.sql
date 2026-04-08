/*******************************************************************************
 * UnFranchise Marketing App - Database Schema
 * Microsoft SQL Server 2019+
 *
 * Contact Groups Migration - Sprint 6
 *
 * Author: Backend Development Team
 * Created: 2026-04-05
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/*******************************************************************************
 * CONTACT GROUPS
 ******************************************************************************/

-- Check if ContactGroup table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactGroup')
BEGIN
    CREATE TABLE dbo.ContactGroup (
        GroupID INT IDENTITY(1,1) NOT NULL,
        UserID BIGINT NOT NULL,                          -- UFO who owns this group

        -- Group Details
        GroupName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(1000) NULL,

        -- Audit
        CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_ContactGroup PRIMARY KEY CLUSTERED (GroupID),
        CONSTRAINT FK_ContactGroup_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID),
        CONSTRAINT UQ_ContactGroup_UserName UNIQUE (UserID, GroupName)
    );

    CREATE NONCLUSTERED INDEX IX_ContactGroup_User ON dbo.ContactGroup(UserID, GroupName);

    PRINT 'ContactGroup table created successfully';
END
ELSE
BEGIN
    PRINT 'ContactGroup table already exists';
END
GO

/*******************************************************************************
 * CONTACT GROUP MEMBERS (Many-to-Many relationship)
 ******************************************************************************/

-- Check if ContactGroupMember table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactGroupMember')
BEGIN
    CREATE TABLE dbo.ContactGroupMember (
        ContactID BIGINT NOT NULL,
        GroupID INT NOT NULL,

        -- Audit
        AddedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_ContactGroupMember PRIMARY KEY CLUSTERED (ContactID, GroupID),
        CONSTRAINT FK_ContactGroupMember_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID) ON DELETE CASCADE,
        CONSTRAINT FK_ContactGroupMember_Group FOREIGN KEY (GroupID) REFERENCES dbo.ContactGroup(GroupID) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_ContactGroupMember_Group ON dbo.ContactGroupMember(GroupID);
    CREATE NONCLUSTERED INDEX IX_ContactGroupMember_Contact ON dbo.ContactGroupMember(ContactID);

    PRINT 'ContactGroupMember table created successfully';
END
ELSE
BEGIN
    PRINT 'ContactGroupMember table already exists';
END
GO

/*******************************************************************************
 * CONTACT TAG TABLE (Optional - for better tag management)
 * Currently tags are stored as comma-separated in Contact table
 * This table provides better querying and management
 ******************************************************************************/

-- Check if ContactTag table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactTag')
BEGIN
    CREATE TABLE dbo.ContactTag (
        ContactTagID BIGINT IDENTITY(1,1) NOT NULL,
        ContactID BIGINT NOT NULL,
        Tag NVARCHAR(100) NOT NULL,

        -- Audit
        AddedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_ContactTag PRIMARY KEY CLUSTERED (ContactTagID),
        CONSTRAINT FK_ContactTag_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID) ON DELETE CASCADE,
        CONSTRAINT UQ_ContactTag_ContactTag UNIQUE (ContactID, Tag)
    );

    CREATE NONCLUSTERED INDEX IX_ContactTag_Contact ON dbo.ContactTag(ContactID);
    CREATE NONCLUSTERED INDEX IX_ContactTag_Tag ON dbo.ContactTag(Tag);

    PRINT 'ContactTag table created successfully';
END
ELSE
BEGIN
    PRINT 'ContactTag table already exists';
END
GO

/*******************************************************************************
 * CONTACT NOTE TABLE (Optional - for detailed notes tracking)
 * Currently notes are stored as single text field in Contact table
 * This table provides timestamped notes history
 ******************************************************************************/

-- Check if ContactNote table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactNote')
BEGIN
    CREATE TABLE dbo.ContactNote (
        NoteID BIGINT IDENTITY(1,1) NOT NULL,
        ContactID BIGINT NOT NULL,
        UserID BIGINT NOT NULL,                          -- User who created the note

        -- Note Details
        NoteText NVARCHAR(MAX) NOT NULL,
        NoteType NVARCHAR(50) NULL,                      -- Call, Meeting, Email, General, etc.

        -- Audit
        CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT PK_ContactNote PRIMARY KEY CLUSTERED (NoteID),
        CONSTRAINT FK_ContactNote_Contact FOREIGN KEY (ContactID) REFERENCES dbo.Contact(ContactID) ON DELETE CASCADE,
        CONSTRAINT FK_ContactNote_User FOREIGN KEY (UserID) REFERENCES dbo.[User](UserID)
    );

    CREATE NONCLUSTERED INDEX IX_ContactNote_Contact_Date ON dbo.ContactNote(ContactID, CreatedDate DESC);
    CREATE NONCLUSTERED INDEX IX_ContactNote_User ON dbo.ContactNote(UserID, CreatedDate DESC);

    PRINT 'ContactNote table created successfully';
END
ELSE
BEGIN
    PRINT 'ContactNote table already exists';
END
GO

/*******************************************************************************
 * VERIFICATION
 ******************************************************************************/

PRINT '';
PRINT '========================================';
PRINT 'Contact Groups Migration Summary';
PRINT '========================================';

SELECT 'ContactGroup' AS TableName, COUNT(*) AS RowCount FROM dbo.ContactGroup
UNION ALL
SELECT 'ContactGroupMember', COUNT(*) FROM dbo.ContactGroupMember
UNION ALL
SELECT 'ContactTag', COUNT(*) FROM dbo.ContactTag
UNION ALL
SELECT 'ContactNote', COUNT(*) FROM dbo.ContactNote;

PRINT '';
PRINT 'Migration completed successfully!';
GO
