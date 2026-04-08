/*******************************************************************************
 * Clear all dummy/seed content data
 * This will delete all content items and related data
 ******************************************************************************/

USE [UnFranchiseMarketing];
GO

PRINT 'Starting content cleanup...';

-- Disable foreign key constraints temporarily
ALTER TABLE dbo.ShareEvent NOCHECK CONSTRAINT ALL;
ALTER TABLE dbo.EngagementEvent NOCHECK CONSTRAINT ALL;
GO

-- Delete engagement events related to content
DELETE FROM dbo.EngagementEvent
WHERE ShareEventID IN (
    SELECT ShareEventID FROM dbo.ShareEvent
);
PRINT 'Deleted engagement events';

-- Delete share events
DELETE FROM dbo.ShareEvent;
PRINT 'Deleted share events';

-- Re-enable foreign key constraints
ALTER TABLE dbo.ShareEvent CHECK CONSTRAINT ALL;
ALTER TABLE dbo.EngagementEvent CHECK CONSTRAINT ALL;
GO

-- Delete campaign content associations
DELETE FROM dbo.CampaignContent;
PRINT 'Deleted campaign content associations';

-- Delete content items
DELETE FROM dbo.ContentItem;
PRINT 'Deleted content items';

-- Reset identity seeds (optional - restarts IDs from 1)
DBCC CHECKIDENT ('dbo.ContentItem', RESEED, 0);
DBCC CHECKIDENT ('dbo.ShareEvent', RESEED, 0);
DBCC CHECKIDENT ('dbo.EngagementEvent', RESEED, 0);
DBCC CHECKIDENT ('dbo.CampaignContent', RESEED, 0);
GO

PRINT 'Content cleanup completed successfully';
PRINT 'Database is now ready for real content';
