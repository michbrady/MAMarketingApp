-- Migration: Fix Contact Status Constraint
-- Date: 2026-04-07
-- Description: Update Contact.Status CHECK constraint to support CRM status values

USE UnFranchiseMarketing;
GO

-- Drop the old constraint
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Contact_Status')
BEGIN
    ALTER TABLE dbo.Contact DROP CONSTRAINT CK_Contact_Status;
    PRINT 'Dropped old CK_Contact_Status constraint';
END
GO

-- Add new constraint with CRM-appropriate values
ALTER TABLE dbo.Contact
ADD CONSTRAINT CK_Contact_Status
CHECK (Status IN ('Lead', 'Prospect', 'Customer', 'TeamMember', 'Active', 'Inactive', 'DoNotContact', 'Bounced'));
GO

PRINT 'Created new CK_Contact_Status constraint with expanded status values';
GO
