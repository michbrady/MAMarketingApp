/*******************************************************************************
 * UnFranchise Marketing App - Localization Schema
 * Microsoft SQL Server 2022+
 *
 * Part 12: Multi-Country/Multi-Language Support (i18n)
 *
 * This script creates the database foundation for comprehensive
 * internationalization (i18n) support across 9 countries with multiple
 * language variants (English, Chinese Traditional/Simplified, Indonesian, Malay).
 *
 * Author: Database Architecture Team
 * Created: 2026-04-09
 * Related: docs/I18N_ARCHITECTURE_PLAN.md
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Creating localization schema...';
GO

/*******************************************************************************
 * 1. UPDATE LANGUAGE TABLE - Add Locale Support Fields
 ******************************************************************************/

PRINT 'Updating Language table with locale support fields...';
GO

-- Add new columns for BCP 47 locale codes and fallback support
ALTER TABLE dbo.Language
ADD
    LocaleCode NVARCHAR(10) NULL,                    -- BCP 47 code (e.g., en-US, zh-TW, id-ID)
    FallbackLanguageID INT NULL,                      -- For translation fallback chain
    Direction NVARCHAR(3) NOT NULL DEFAULT 'LTR',     -- Text direction: LTR or RTL (for future RTL support)
    PluralRules NVARCHAR(50) NULL;                    -- CLDR plural rules for i18n
GO

-- Add foreign key constraint for fallback language
ALTER TABLE dbo.Language
ADD CONSTRAINT FK_Language_Fallback
    FOREIGN KEY (FallbackLanguageID) REFERENCES dbo.Language(LanguageID);
GO

-- Add index on LocaleCode for fast lookups
CREATE NONCLUSTERED INDEX IX_Language_Locale
    ON dbo.Language(LocaleCode)
    WHERE IsActive = 1;
GO

PRINT 'Language table updated successfully';
GO

/*******************************************************************************
 * 2. UPDATE USER TABLE - Add Preferred Locale
 ******************************************************************************/

PRINT 'Updating User table with preferred locale...';
GO

-- Add PreferredLocale column (stores BCP 47 locale code)
ALTER TABLE dbo.[User]
ADD PreferredLocale NVARCHAR(10) NULL;  -- e.g., 'en-US', 'zh-TW', 'id-ID'
GO

PRINT 'User table updated successfully';
GO

/*******************************************************************************
 * 3. MARKETLANGUAGE TABLE - Junction Table
 *
 * Maps which languages are available in which markets.
 * Enables market-specific language selection (e.g., Taiwan offers zh-TW and en-TW)
 ******************************************************************************/

PRINT 'Creating MarketLanguage junction table...';
GO

CREATE TABLE dbo.MarketLanguage (
    MarketLanguageID INT IDENTITY(1,1) NOT NULL,
    MarketID INT NOT NULL,
    LanguageID INT NOT NULL,

    IsDefault BIT NOT NULL DEFAULT 0,                 -- Default language for this market
    DisplayOrder INT NOT NULL DEFAULT 0,              -- Order in language selector UI
    IsActive BIT NOT NULL DEFAULT 1,

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT PK_MarketLanguage PRIMARY KEY CLUSTERED (MarketLanguageID),
    CONSTRAINT FK_MarketLanguage_Market FOREIGN KEY (MarketID)
        REFERENCES dbo.Market(MarketID),
    CONSTRAINT FK_MarketLanguage_Language FOREIGN KEY (LanguageID)
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT UQ_MarketLanguage UNIQUE (MarketID, LanguageID)
);
GO

-- Index for querying languages by market
CREATE NONCLUSTERED INDEX IX_MarketLanguage_Market
    ON dbo.MarketLanguage(MarketID, IsActive)
    INCLUDE (LanguageID, IsDefault, DisplayOrder);
GO

-- Index for querying markets by language
CREATE NONCLUSTERED INDEX IX_MarketLanguage_Language
    ON dbo.MarketLanguage(LanguageID, IsActive);
GO

PRINT 'MarketLanguage table created successfully';
GO

/*******************************************************************************
 * 4. TRANSLATIONSTRING TABLE - Admin-Manageable UI Translations
 *
 * Stores translation key/value pairs for UI strings that can be managed
 * via admin panel (in addition to JSON translation files in frontend).
 * Useful for dynamic translations that shouldn't require code deployments.
 ******************************************************************************/

PRINT 'Creating TranslationString table...';
GO

CREATE TABLE dbo.TranslationString (
    TranslationStringID BIGINT IDENTITY(1,1) NOT NULL,
    TranslationKey NVARCHAR(255) NOT NULL,            -- e.g., "dashboard.welcome", "errors.notFound"
    LanguageID INT NOT NULL,
    TranslationValue NVARCHAR(MAX) NOT NULL,          -- Translated text
    Context NVARCHAR(500) NULL,                       -- Help text for translators

    IsActive BIT NOT NULL DEFAULT 1,

    -- Audit trail
    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,
    UpdatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    UpdatedBy BIGINT NULL,

    CONSTRAINT PK_TranslationString PRIMARY KEY CLUSTERED (TranslationStringID),
    CONSTRAINT FK_TranslationString_Language FOREIGN KEY (LanguageID)
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT FK_TranslationString_CreatedBy FOREIGN KEY (CreatedBy)
        REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_TranslationString_UpdatedBy FOREIGN KEY (UpdatedBy)
        REFERENCES dbo.[User](UserID),
    CONSTRAINT UQ_TranslationString UNIQUE (TranslationKey, LanguageID)
);
GO

-- Index for fast key lookups
CREATE NONCLUSTERED INDEX IX_TranslationString_Key
    ON dbo.TranslationString(TranslationKey, LanguageID)
    WHERE IsActive = 1;
GO

-- Index for querying all translations for a language
CREATE NONCLUSTERED INDEX IX_TranslationString_Language
    ON dbo.TranslationString(LanguageID, IsActive)
    INCLUDE (TranslationKey, TranslationValue);
GO

PRINT 'TranslationString table created successfully';
GO

/*******************************************************************************
 * 5. CONTENTTRANSLATIONGROUP TABLE - Content Localization
 *
 * Links master content items to their translated versions.
 * Enables tracking of translation quality, review status, and relationships
 * between content in different languages.
 ******************************************************************************/

PRINT 'Creating ContentTranslationGroup table...';
GO

CREATE TABLE dbo.ContentTranslationGroup (
    ContentTranslationGroupID INT IDENTITY(1,1) NOT NULL,
    MasterContentItemID BIGINT NOT NULL,              -- Original/master content item
    TranslationContentItemID BIGINT NOT NULL,         -- Translated version
    LanguageID INT NOT NULL,                          -- Language of the translation

    TranslationQuality NVARCHAR(20) NULL,             -- Professional, Machine, Community
    ReviewStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected, NeedsWork
    ReviewedBy BIGINT NULL,                           -- User who reviewed the translation
    ReviewedDate DATETIME2(7) NULL,
    ReviewNotes NVARCHAR(MAX) NULL,                   -- Reviewer's feedback

    CreatedDate DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy BIGINT NULL,

    CONSTRAINT PK_ContentTranslationGroup PRIMARY KEY CLUSTERED (ContentTranslationGroupID),
    CONSTRAINT FK_ContentTranslation_Master FOREIGN KEY (MasterContentItemID)
        REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ContentTranslation_Translation FOREIGN KEY (TranslationContentItemID)
        REFERENCES dbo.ContentItem(ContentItemID),
    CONSTRAINT FK_ContentTranslation_Language FOREIGN KEY (LanguageID)
        REFERENCES dbo.Language(LanguageID),
    CONSTRAINT FK_ContentTranslation_ReviewedBy FOREIGN KEY (ReviewedBy)
        REFERENCES dbo.[User](UserID),
    CONSTRAINT FK_ContentTranslation_CreatedBy FOREIGN KEY (CreatedBy)
        REFERENCES dbo.[User](UserID),
    CONSTRAINT UQ_ContentTranslation UNIQUE (MasterContentItemID, LanguageID),
    CONSTRAINT CK_ContentTranslation_Quality CHECK (
        TranslationQuality IS NULL OR
        TranslationQuality IN ('Professional', 'Machine', 'Community')
    ),
    CONSTRAINT CK_ContentTranslation_ReviewStatus CHECK (
        ReviewStatus IN ('Pending', 'Approved', 'Rejected', 'NeedsWork')
    ),
    -- Ensure master and translation are different items
    CONSTRAINT CK_ContentTranslation_Different CHECK (
        MasterContentItemID <> TranslationContentItemID
    )
);
GO

-- Index for finding translations of a master content item
CREATE NONCLUSTERED INDEX IX_ContentTranslation_Master
    ON dbo.ContentTranslationGroup(MasterContentItemID, LanguageID)
    INCLUDE (TranslationContentItemID, ReviewStatus);
GO

-- Index for finding all content items that are translations
CREATE NONCLUSTERED INDEX IX_ContentTranslation_Translation
    ON dbo.ContentTranslationGroup(TranslationContentItemID);
GO

-- Index for finding content by language
CREATE NONCLUSTERED INDEX IX_ContentTranslation_Language
    ON dbo.ContentTranslationGroup(LanguageID, ReviewStatus)
    INCLUDE (MasterContentItemID, TranslationContentItemID);
GO

-- Index for review workflow
CREATE NONCLUSTERED INDEX IX_ContentTranslation_Review
    ON dbo.ContentTranslationGroup(ReviewStatus, CreatedDate)
    WHERE ReviewStatus IN ('Pending', 'NeedsWork');
GO

PRINT 'ContentTranslationGroup table created successfully';
GO

/*******************************************************************************
 * 6. UPDATE EXISTING USER RECORDS WITH DEFAULT LOCALES
 *
 * Set PreferredLocale for existing users based on their market and language.
 * This ensures smooth migration for existing users.
 ******************************************************************************/

PRINT 'Updating existing users with default preferred locales...';
GO

-- Note: This will be populated with actual locale codes after seed data is loaded
-- For now, we'll leave it NULL and update it in the seed data script
-- after the Language.LocaleCode values are populated

PRINT 'User locale update prepared (will be executed with seed data)';
GO

/*******************************************************************************
 * SCHEMA CREATION COMPLETE
 ******************************************************************************/

PRINT '';
PRINT '=============================================================================';
PRINT 'Localization schema created successfully!';
PRINT '';
PRINT 'New tables created:';
PRINT '  - MarketLanguage (junction table for market-language relationships)';
PRINT '  - TranslationString (admin-manageable UI translations)';
PRINT '  - ContentTranslationGroup (content localization tracking)';
PRINT '';
PRINT 'Updated tables:';
PRINT '  - Language (added LocaleCode, FallbackLanguageID, Direction, PluralRules)';
PRINT '  - User (added PreferredLocale)';
PRINT '';
PRINT 'Next step: Run 13_Seed_Localization_Data.sql to populate locale data';
PRINT '=============================================================================';
GO
