-- Run this with admin credentials (sa user)
-- This fixes the Contact Status constraint to allow CRM status values

USE UnFranchiseMarketing;
GO

-- Drop the old constraint
ALTER TABLE dbo.Contact DROP CONSTRAINT CK_Contact_Status;
GO

-- Add new constraint with correct CRM status values
ALTER TABLE dbo.Contact
ADD CONSTRAINT CK_Contact_Status
CHECK (Status IN ('Lead', 'Prospect', 'Customer', 'TeamMember', 'Active', 'Inactive', 'DoNotContact', 'Bounced'));
GO

PRINT '✓ Constraint updated successfully';
PRINT 'Allowed status values: Lead, Prospect, Customer, TeamMember, Active, Inactive, DoNotContact, Bounced';
GO
