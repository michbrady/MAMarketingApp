/*******************************************************************************
 * UnFranchise Marketing App - Seed Data
 * Microsoft SQL Server 2019+
 *
 * Initial data for development and testing
 *
 * Author: Database Architecture Team
 * Created: 2026-04-04
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Disable constraints temporarily for bulk insert
ALTER TABLE dbo.[User] NOCHECK CONSTRAINT ALL;
GO

/*******************************************************************************
 * 1. REFERENCE DATA
 ******************************************************************************/

-- Markets
SET IDENTITY_INSERT dbo.Market ON;
GO

INSERT INTO dbo.Market (MarketID, MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive, RequiresCompliance)
VALUES
    (1, 'US', 'United States', 'USA', 'North America', 'USD', 'America/New_York', 1, 1),
    (2, 'CA', 'Canada', 'CAN', 'North America', 'CAD', 'America/Toronto', 1, 1),
    (3, 'TW', 'Taiwan', 'TWN', 'Asia Pacific', 'TWD', 'Asia/Taipei', 1, 0),
    (4, 'CN', 'China', 'CHN', 'Asia Pacific', 'CNY', 'Asia/Shanghai', 1, 1),
    (5, 'AU', 'Australia', 'AUS', 'Asia Pacific', 'AUD', 'Australia/Sydney', 1, 1),
    (6, 'UK', 'United Kingdom', 'GBR', 'Europe', 'GBP', 'Europe/London', 1, 1),
    (7, 'MX', 'Mexico', 'MEX', 'Latin America', 'MXN', 'America/Mexico_City', 1, 0);
GO

SET IDENTITY_INSERT dbo.Market OFF;
GO

-- Languages
SET IDENTITY_INSERT dbo.Language ON;
GO

INSERT INTO dbo.Language (LanguageID, LanguageCode, LanguageName, NativeName, IsActive)
VALUES
    (1, 'en-US', 'English (US)', 'English', 1),
    (2, 'en-CA', 'English (Canada)', 'English', 1),
    (3, 'fr-CA', 'French (Canada)', 'Français', 1),
    (4, 'zh-TW', 'Chinese (Traditional)', '繁體中文', 1),
    (5, 'zh-CN', 'Chinese (Simplified)', '简体中文', 1),
    (6, 'es-MX', 'Spanish (Mexico)', 'Español', 1),
    (7, 'en-GB', 'English (UK)', 'English', 1),
    (8, 'en-AU', 'English (Australia)', 'English', 1);
GO

SET IDENTITY_INSERT dbo.Language OFF;
GO

-- Roles
SET IDENTITY_INSERT dbo.Role ON;
GO

INSERT INTO dbo.Role (RoleID, RoleName, RoleDescription, PermissionLevel, IsActive)
VALUES
    (1, 'UFO', 'UnFranchise Owner - Field User', 1, 1),
    (2, 'CorporateAdmin', 'Corporate Content Administrator', 10, 1),
    (3, 'SuperAdmin', 'Platform Super Administrator', 100, 1);
GO

SET IDENTITY_INSERT dbo.Role OFF;
GO

/*******************************************************************************
 * 2. CONTENT STRUCTURE
 ******************************************************************************/

-- Content Categories
SET IDENTITY_INSERT dbo.ContentCategory ON;
GO

INSERT INTO dbo.ContentCategory (ContentCategoryID, CategoryName, CategoryDescription, ParentCategoryID, CategoryPath, SortOrder, IsActive)
VALUES
    -- Top Level Categories
    (1, 'Products', 'Product information and marketing materials', NULL, '/Products', 1, 1),
    (2, 'Business Opportunity', 'Business opportunity and compensation information', NULL, '/Business Opportunity', 2, 1),
    (3, 'Training', 'Training and educational content', NULL, '/Training', 3, 1),
    (4, 'Events', 'Company events and promotions', NULL, '/Events', 4, 1),
    (5, 'Testimonials', 'Customer and distributor testimonials', NULL, '/Testimonials', 5, 1),

    -- Product Subcategories
    (10, 'Nutrition', 'Nutritional supplements', 1, '/Products/Nutrition', 1, 1),
    (11, 'Beauty', 'Beauty and skincare products', 1, '/Products/Beauty', 2, 1),
    (12, 'Weight Management', 'Weight management solutions', 1, '/Products/Weight Management', 3, 1),
    (13, 'Home Care', 'Home and personal care products', 1, '/Products/Home Care', 4, 1),

    -- Business Opportunity Subcategories
    (20, 'Income Opportunity', 'How to earn income', 2, '/Business Opportunity/Income Opportunity', 1, 1),
    (21, 'Lifestyle', 'Lifestyle benefits', 2, '/Business Opportunity/Lifestyle', 2, 1),
    (22, 'Success Stories', 'Success stories from distributors', 2, '/Business Opportunity/Success Stories', 3, 1);
GO

SET IDENTITY_INSERT dbo.ContentCategory OFF;
GO

-- Content Tags
SET IDENTITY_INSERT dbo.ContentTag ON;
GO

INSERT INTO dbo.ContentTag (ContentTagID, TagName, TagDescription, TagColor, IsActive)
VALUES
    (1, 'New', 'Newly added content', '#00C853', 1),
    (2, 'Featured', 'Featured content', '#FF6F00', 1),
    (3, 'Limited Time', 'Time-sensitive promotion', '#D32F2F', 1),
    (4, 'Best Seller', 'Top selling products', '#1976D2', 1),
    (5, 'Video', 'Video content', '#7B1FA2', 1),
    (6, 'Beginner', 'Great for beginners', '#388E3C', 1),
    (7, 'Advanced', 'Advanced content', '#0288D1', 1),
    (8, 'Seasonal', 'Seasonal promotion', '#F57C00', 1);
GO

SET IDENTITY_INSERT dbo.ContentTag OFF;
GO

-- Campaigns
SET IDENTITY_INSERT dbo.Campaign ON;
GO

INSERT INTO dbo.Campaign (CampaignID, CampaignName, CampaignCode, CampaignDescription, StartDate, EndDate, Status, CampaignType, TargetMarkets)
VALUES
    (1, 'Spring Launch 2026', 'SPRING2026', 'New product launch for Spring season', '2026-03-01', '2026-05-31', 'Active', 'Product Launch', 'US,CA,TW'),
    (2, 'New Year New You', 'NYNY2026', 'Weight management campaign for January', '2026-01-01', '2026-02-28', 'Completed', 'Seasonal', 'US,CA,UK,AU'),
    (3, 'Summer Success', 'SUMMER2026', 'Business opportunity summer push', '2026-06-01', '2026-08-31', 'Draft', 'Business Opportunity', 'US,CA,MX'),
    (4, 'Holiday Gift Guide', 'HOLIDAY2026', 'Holiday shopping campaign', '2026-11-01', '2026-12-31', 'Draft', 'Seasonal', 'US,CA,UK,AU');
GO

SET IDENTITY_INSERT dbo.Campaign OFF;
GO

/*******************************************************************************
 * 3. SAMPLE USERS
 ******************************************************************************/

SET IDENTITY_INSERT dbo.[User] ON;
GO

INSERT INTO dbo.[User] (
    UserID, MemberID, Email, FirstName, LastName, Mobile,
    RoleID, MarketID, PreferredLanguageID,
    PasswordHash, Status, EmailVerified, MobileVerified
)
VALUES
    -- Super Admin
    (1, 'ADMIN001', 'admin@unfranchise.com', 'System', 'Administrator', '+1-555-0100',
     3, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),

    -- Corporate Admins
    (2, 'CORP001', 'content.manager@unfranchise.com', 'Sarah', 'Johnson', '+1-555-0101',
     2, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),
    (3, 'CORP002', 'marketing.director@unfranchise.com', 'Michael', 'Chen', '+1-555-0102',
     2, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),

    -- UFO Users - US Market
    (10, 'UFO10001', 'john.smith@example.com', 'John', 'Smith', '+1-555-1001',
     1, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),
    (11, 'UFO10002', 'maria.garcia@example.com', 'Maria', 'Garcia', '+1-555-1002',
     1, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),
    (12, 'UFO10003', 'david.wilson@example.com', 'David', 'Wilson', '+1-555-1003',
     1, 1, 1, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),

    -- UFO Users - Canada Market
    (20, 'UFO20001', 'emily.martin@example.ca', 'Emily', 'Martin', '+1-416-555-2001',
     1, 2, 2, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),
    (21, 'UFO20002', 'robert.brown@example.ca', 'Robert', 'Brown', '+1-416-555-2002',
     1, 2, 2, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),

    -- UFO Users - Taiwan Market
    (30, 'UFO30001', 'wang.li@example.tw', 'Li', 'Wang', '+886-2-5555-3001',
     1, 3, 4, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1),
    (31, 'UFO30002', 'chen.mei@example.tw', 'Mei', 'Chen', '+886-2-5555-3002',
     1, 3, 4, 'HASHED_PASSWORD_PLACEHOLDER', 'Active', 1, 1);
GO

SET IDENTITY_INSERT dbo.[User] OFF;
GO

-- User Settings for sample users
INSERT INTO dbo.UserSettings (UserID, EmailNotificationsEnabled, PushNotificationsEnabled, NotifyOnEngagement, DefaultShareChannel)
SELECT UserID, 1, 1, 1, 'Email'
FROM dbo.[User]
WHERE RoleID = 1; -- UFO users
GO

/*******************************************************************************
 * 4. SAMPLE CONTENT ITEMS
 ******************************************************************************/

SET IDENTITY_INSERT dbo.ContentItem ON;
GO

INSERT INTO dbo.ContentItem (
    ContentItemID, Title, Subtitle, Description, ThumbnailURL, MediaURL, DestinationURL,
    ContentType, PublishStatus, PublishDate, AllowSMS, AllowEmail, AllowSocial,
    CTAType, CTALabel, IsFeatured, FeaturedPriority, CreatedBy
)
VALUES
    -- Product Videos
    (1, 'Ultimate Nutrition Shake - Product Overview',
     'Complete nutrition in a delicious shake',
     'Discover the power of our flagship nutrition shake with complete vitamins, minerals, and protein.',
     'https://cdn.unfranchise.com/thumbnails/nutrition-shake.jpg',
     'https://cdn.unfranchise.com/videos/nutrition-shake-overview.mp4',
     'https://shop.unfranchise.com/products/nutrition-shake',
     'Video', 'Published', '2026-03-15', 1, 1, 1, 'LearnMore', 'Shop Now', 1, 100, 2),

    (2, 'Anti-Aging Serum - Transform Your Skin',
     'Clinically proven anti-aging results',
     'Our revolutionary anti-aging serum delivers visible results in just 30 days. Backed by clinical studies.',
     'https://cdn.unfranchise.com/thumbnails/anti-aging-serum.jpg',
     'https://cdn.unfranchise.com/videos/anti-aging-serum.mp4',
     'https://shop.unfranchise.com/products/anti-aging-serum',
     'Video', 'Published', '2026-03-10', 1, 1, 1, 'BuyNow', 'Order Today', 1, 95, 2),

    (3, 'Weight Management System - Success Stories',
     'Real people, real results',
     'Watch inspiring transformations from people who achieved their weight goals with our system.',
     'https://cdn.unfranchise.com/thumbnails/weight-success.jpg',
     'https://cdn.unfranchise.com/videos/weight-management-success.mp4',
     'https://shop.unfranchise.com/products/weight-system',
     'Video', 'Published', '2026-02-01', 1, 1, 1, 'LearnMore', 'Start Your Journey', 1, 90, 2),

    -- Business Opportunity Content
    (10, 'Why Join the UnFranchise Business',
     'Build your own business with unlimited potential',
     'Learn about the UnFranchise opportunity and how you can create income while helping others.',
     'https://cdn.unfranchise.com/thumbnails/business-opportunity.jpg',
     'https://cdn.unfranchise.com/videos/business-opportunity-overview.mp4',
     'https://unfranchise.com/opportunity',
     'Video', 'Published', '2026-01-15', 1, 1, 1, 'JoinNow', 'Get Started', 1, 85, 2),

    (11, 'Income Opportunity Explained',
     'Multiple ways to earn income',
     'Discover the various income streams available through the UnFranchise business model.',
     'https://cdn.unfranchise.com/thumbnails/income-opportunity.jpg',
     'https://cdn.unfranchise.com/pdfs/income-opportunity.pdf',
     'https://unfranchise.com/compensation',
     'PDF', 'Published', '2026-01-20', 1, 1, 1, 'LearnMore', 'Download Guide', 0, 0, 2),

    -- Landing Pages
    (20, 'Spring Product Launch Event',
     'Join us for an exclusive product reveal',
     'Be the first to experience our exciting new product line. Register for our virtual launch event.',
     'https://cdn.unfranchise.com/thumbnails/spring-launch.jpg',
     NULL,
     'https://events.unfranchise.com/spring-launch-2026',
     'LandingPage', 'Published', '2026-03-01', 1, 1, 1, 'Register', 'Register Now', 1, 80, 2),

    -- Images/Share Cards
    (30, 'Daily Motivation - Success Quote',
     'Share inspiration with your team',
     'Beautiful motivational quote card perfect for social sharing.',
     'https://cdn.unfranchise.com/share-cards/motivation-001.jpg',
     'https://cdn.unfranchise.com/share-cards/motivation-001.jpg',
     'https://unfranchise.com/success',
     'ShareCard', 'Published', '2026-04-01', 1, 1, 1, NULL, NULL, 0, 0, 2),

    (31, 'Product of the Month - April',
     'Featured product showcase',
     'Share this months featured product with your network.',
     'https://cdn.unfranchise.com/share-cards/product-month-april.jpg',
     'https://cdn.unfranchise.com/share-cards/product-month-april.jpg',
     'https://shop.unfranchise.com/featured',
     'ShareCard', 'Published', '2026-04-01', 1, 1, 1, 'BuyNow', 'Shop Now', 0, 0, 2);
GO

SET IDENTITY_INSERT dbo.ContentItem OFF;
GO

-- Link Content to Categories
INSERT INTO dbo.ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary)
VALUES
    (1, 10, 1), -- Nutrition Shake -> Nutrition (primary)
    (1, 1, 0),  -- Nutrition Shake -> Products
    (2, 11, 1), -- Anti-Aging -> Beauty (primary)
    (2, 1, 0),  -- Anti-Aging -> Products
    (3, 12, 1), -- Weight Management -> Weight Management (primary)
    (3, 1, 0),  -- Weight Management -> Products
    (10, 20, 1), -- Business Opportunity -> Income Opportunity (primary)
    (10, 2, 0),  -- Business Opportunity -> Business Opportunity
    (11, 20, 1), -- Income Opportunity -> Income Opportunity (primary)
    (20, 4, 1),  -- Spring Launch -> Events (primary)
    (30, 5, 1),  -- Motivation -> Testimonials (primary)
    (31, 1, 1);  -- Product of Month -> Products (primary)
GO

-- Link Content to Tags
INSERT INTO dbo.ContentItemTag (ContentItemID, ContentTagID)
VALUES
    (1, 1), -- Nutrition Shake -> New
    (1, 2), -- Nutrition Shake -> Featured
    (1, 4), -- Nutrition Shake -> Best Seller
    (1, 5), -- Nutrition Shake -> Video
    (2, 2), -- Anti-Aging -> Featured
    (2, 5), -- Anti-Aging -> Video
    (3, 5), -- Weight Management -> Video
    (3, 6), -- Weight Management -> Beginner
    (10, 5), -- Business Opp -> Video
    (10, 6), -- Business Opp -> Beginner
    (20, 1), -- Spring Launch -> New
    (20, 3); -- Spring Launch -> Limited Time
GO

-- Link Content to Markets
INSERT INTO dbo.ContentItemMarket (ContentItemID, MarketID)
VALUES
    -- US, CA, TW for most product content
    (1, 1), (1, 2), (1, 3),
    (2, 1), (2, 2), (2, 3), (2, 5), (2, 6),
    (3, 1), (3, 2), (3, 5), (3, 6),
    (10, 1), (10, 2), (10, 3), (10, 5), (10, 6), (10, 7),
    (11, 1), (11, 2), (11, 3), (11, 5), (11, 6), (11, 7),
    (20, 1), (20, 2), (20, 3),
    (30, 1), (30, 2), (30, 3), (30, 5), (30, 6), (30, 7),
    (31, 1), (31, 2), (31, 3), (31, 5), (31, 6), (31, 7);
GO

-- Link Content to Languages
INSERT INTO dbo.ContentItemLanguage (ContentItemID, LanguageID)
VALUES
    (1, 1), (1, 2), (1, 4), -- English US, CA, Chinese Traditional
    (2, 1), (2, 2), (2, 4), (2, 7), (2, 8),
    (3, 1), (3, 2), (3, 7), (3, 8),
    (10, 1), (10, 2), (10, 4), (10, 5), (10, 6), (10, 7), (10, 8),
    (11, 1), (11, 2), (11, 4), (11, 5), (11, 6), (11, 7), (11, 8),
    (20, 1), (20, 2), (20, 4),
    (30, 1), (30, 2), (30, 4), (30, 5), (30, 6), (30, 7), (30, 8),
    (31, 1), (31, 2), (31, 4), (31, 5), (31, 6), (31, 7), (31, 8);
GO

-- Link Content to Campaigns
INSERT INTO dbo.CampaignContent (CampaignID, ContentItemID, SortOrder)
VALUES
    (1, 1, 1),  -- Spring Launch -> Nutrition Shake
    (1, 2, 2),  -- Spring Launch -> Anti-Aging
    (1, 20, 3), -- Spring Launch -> Event Landing Page
    (2, 3, 1);  -- New Year -> Weight Management
GO

/*******************************************************************************
 * 5. COMPLIANCE RULES
 ******************************************************************************/

SET IDENTITY_INSERT dbo.ComplianceRule ON;
GO

INSERT INTO dbo.ComplianceRule (
    ComplianceRuleID, RuleName, RuleType, MarketID, RuleDescription,
    EnforcementLevel, IsActive
)
VALUES
    (1, 'US Email CAN-SPAM Compliance', 'EmailConsent', 1,
     'All emails must include unsubscribe link and physical address per CAN-SPAM Act',
     'Block', 1),
    (2, 'US SMS TCPA Compliance', 'SMSOptIn', 1,
     'SMS messages require explicit opt-in consent per TCPA regulations',
     'Block', 1),
    (3, 'Canada CASL Compliance', 'EmailConsent', 2,
     'Electronic messages must have express consent per CASL',
     'Block', 1),
    (4, 'UK GDPR Email Consent', 'EmailConsent', 6,
     'Email marketing requires GDPR-compliant consent',
     'Block', 1),
    (5, 'China Content Restriction', 'ContentRestriction', 4,
     'Content must comply with local advertising regulations',
     'Warning', 1);
GO

SET IDENTITY_INSERT dbo.ComplianceRule OFF;
GO

/*******************************************************************************
 * 6. SYSTEM CONFIGURATION
 ******************************************************************************/

INSERT INTO dbo.SystemConfiguration (ConfigKey, ConfigValue, ConfigType, Description, Category)
VALUES
    ('TrackingDomain', 'https://track.unfranchise.app', 'String', 'Base domain for tracking links', 'Integration'),
    ('ShortLinkLength', '10', 'Int', 'Length of short tracking codes', 'Feature'),
    ('SessionTimeoutMinutes', '60', 'Int', 'User session timeout in minutes', 'Security'),
    ('MaxFailedLoginAttempts', '5', 'Int', 'Max failed login attempts before lockout', 'Security'),
    ('LockoutDurationMinutes', '30', 'Int', 'Account lockout duration after failed logins', 'Security'),
    ('EnableMFA', 'false', 'Bool', 'Enable multi-factor authentication', 'Security'),
    ('EnablePushNotifications', 'false', 'Bool', 'Enable push notifications (mobile)', 'Feature'),
    ('DefaultPageSize', '20', 'Int', 'Default items per page in lists', 'Feature'),
    ('EngagementScoreThreshold', '50', 'Int', 'Score threshold for hot contacts', 'Feature'),
    ('ArchiveDataAfterDays', '365', 'Int', 'Archive old data after this many days', 'Feature');
GO

-- Re-enable constraints
ALTER TABLE dbo.[User] WITH CHECK CHECK CONSTRAINT ALL;
GO

PRINT 'Seed data inserted successfully';
PRINT 'Sample users created:';
PRINT '  Super Admin: admin@unfranchise.com';
PRINT '  Corporate Admin: content.manager@unfranchise.com';
PRINT '  UFO Users: john.smith@example.com, maria.garcia@example.com, etc.';
PRINT '';
PRINT 'Note: All passwords are set to HASHED_PASSWORD_PLACEHOLDER';
PRINT 'Replace with actual hashed passwords in production';
GO
