/*******************************************************************************
 * Add IsDeleted column to Contact table
 * Allows soft delete without affecting Status field
 ******************************************************************************/

USE [UnFranchiseMarketing];
GO

-- Add IsDeleted column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Contact')
    AND name = 'IsDeleted'
)
BEGIN
    ALTER TABLE dbo.Contact
    ADD IsDeleted BIT NOT NULL DEFAULT 0;

    PRINT 'IsDeleted column added to Contact table';
END
ELSE
BEGIN
    PRINT 'IsDeleted column already exists';
END
GO

-- Create index for better query performance
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'IX_Contact_IsDeleted'
    AND object_id = OBJECT_ID(N'dbo.Contact')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Contact_IsDeleted
    ON dbo.Contact(IsDeleted, OwnerUserID);

    PRINT 'Index IX_Contact_IsDeleted created';
END
ELSE
BEGIN
    PRINT 'Index IX_Contact_IsDeleted already exists';
END
GO

PRINT 'Migration completed successfully';
