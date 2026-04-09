/*******************************************************************************
 * UnFranchise Marketing App - Localization Seed Data
 * Microsoft SQL Server 2022+
 *
 * Part 13: Multi-Country/Multi-Language Support - Seed Data
 *
 * This script populates locale codes, fallback chains, and market-language
 * mappings for comprehensive i18n support.
 *
 * Supported Markets:
 * - USA (US), Canada (CA), United Kingdom (UK), Australia (AU)
 * - Taiwan (TW), China (CN), Hong Kong (HKG), Singapore (SGP)
 * - Malaysia (MYS), Indonesia (IDN)
 *
 * Language Families:
 * - English variants: en-US, en-CA, en-GB, en-AU, en-SG, en-HK, en-TW, en-MY, en-ID
 * - Chinese variants: zh-TW (Traditional Taiwan), zh-HK (Traditional HK), zh-Hans (Simplified)
 * - Indonesian: id-ID
 * - Malay: ms-MY
 *
 * Author: Database Architecture Team
 * Created: 2026-04-09
 * Related: docs/I18N_ARCHITECTURE_PLAN.md
 ******************************************************************************/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Populating localization seed data...';
GO

/*******************************************************************************
 * 1. ADD NEW MARKETS (if needed)
 *
 * Add markets that don't exist yet: Singapore, Hong Kong, Malaysia, Indonesia
 ******************************************************************************/

PRINT 'Adding new markets...';
GO

-- Check and add Singapore
IF NOT EXISTS (SELECT 1 FROM dbo.Market WHERE MarketCode = 'SG')
BEGIN
    INSERT INTO dbo.Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive, RequiresCompliance)
    VALUES ('SG', 'Singapore', 'SGP', 'Asia Pacific', 'SGD', 'Asia/Singapore', 1, 1);
    PRINT '  - Singapore market added';
END
GO

-- Check and add Hong Kong
IF NOT EXISTS (SELECT 1 FROM dbo.Market WHERE MarketCode = 'HK')
BEGIN
    INSERT INTO dbo.Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive, RequiresCompliance)
    VALUES ('HK', 'Hong Kong', 'HKG', 'Asia Pacific', 'HKD', 'Asia/Hong_Kong', 1, 0);
    PRINT '  - Hong Kong market added';
END
GO

-- Check and add Malaysia
IF NOT EXISTS (SELECT 1 FROM dbo.Market WHERE MarketCode = 'MY')
BEGIN
    INSERT INTO dbo.Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive, RequiresCompliance)
    VALUES ('MY', 'Malaysia', 'MYS', 'Asia Pacific', 'MYR', 'Asia/Kuala_Lumpur', 1, 0);
    PRINT '  - Malaysia market added';
END
GO

-- Check and add Indonesia
IF NOT EXISTS (SELECT 1 FROM dbo.Market WHERE MarketCode = 'ID')
BEGIN
    INSERT INTO dbo.Market (MarketCode, MarketName, CountryCode, Region, CurrencyCode, TimeZone, IsActive, RequiresCompliance)
    VALUES ('ID', 'Indonesia', 'IDN', 'Asia Pacific', 'IDR', 'Asia/Jakarta', 1, 0);
    PRINT '  - Indonesia market added';
END
GO

PRINT 'Markets verified/added successfully';
GO

/*******************************************************************************
 * 2. UPDATE EXISTING LANGUAGE RECORDS WITH LOCALE CODES
 *
 * Map existing languages to BCP 47 locale codes and set fallback chains
 ******************************************************************************/

PRINT 'Updating existing languages with locale codes and fallbacks...';
GO

-- English (US) - Base English, no fallback
UPDATE dbo.Language
SET
    LocaleCode = 'en-US',
    FallbackLanguageID = NULL,
    Direction = 'LTR',
    PluralRules = 'en'
WHERE LanguageCode = 'en-US';
PRINT '  - English (US) updated';
GO

-- English (Canada) - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'en-CA',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'en'
WHERE LanguageCode = 'en-CA';
PRINT '  - English (Canada) updated';
GO

-- French (Canada) - No English fallback, standalone
UPDATE dbo.Language
SET
    LocaleCode = 'fr-CA',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'fr'
WHERE LanguageCode = 'fr-CA';
PRINT '  - French (Canada) updated';
GO

-- Chinese Traditional (Taiwan) - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'zh-TW',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'zh'
WHERE LanguageCode = 'zh-TW';
PRINT '  - Chinese Traditional (Taiwan) updated';
GO

-- Chinese Simplified - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'zh-Hans',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'zh'
WHERE LanguageCode = 'zh-CN';
PRINT '  - Chinese Simplified updated';
GO

-- Spanish (Mexico) - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'es-MX',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'es'
WHERE LanguageCode = 'es-MX';
PRINT '  - Spanish (Mexico) updated';
GO

-- English (UK) - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'en-GB',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'en'
WHERE LanguageCode = 'en-GB';
PRINT '  - English (UK) updated';
GO

-- English (Australia) - Falls back to en-US
UPDATE dbo.Language
SET
    LocaleCode = 'en-AU',
    FallbackLanguageID = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
    Direction = 'LTR',
    PluralRules = 'en'
WHERE LanguageCode = 'en-AU';
PRINT '  - English (Australia) updated';
GO

/*******************************************************************************
 * 3. INSERT NEW LANGUAGE RECORDS FOR ALL MARKET VARIANTS
 *
 * Add regional English variants and additional Chinese/Southeast Asian languages
 ******************************************************************************/

PRINT 'Adding new language variants...';
GO

-- Chinese Traditional (Hong Kong variant)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'zh-HK')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'zh-HK',
        'Chinese Traditional (Hong Kong)',
        '繁體中文（香港）',
        'zh-HK',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'zh',
        1
    );
    PRINT '  - Chinese Traditional (Hong Kong) added';
END
GO

-- Indonesian
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'id-ID')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'id-ID',
        'Indonesian',
        'Bahasa Indonesia',
        'id-ID',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'id',
        1
    );
    PRINT '  - Indonesian added';
END
GO

-- Malay (Malaysia)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'ms-MY')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'ms-MY',
        'Malay (Malaysia)',
        'Bahasa Melayu',
        'ms-MY',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'ms',
        1
    );
    PRINT '  - Malay (Malaysia) added';
END
GO

-- Regional English variants for Asian markets
-- English (Singapore)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'en-SG')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'en-SG',
        'English (Singapore)',
        'English',
        'en-SG',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'en',
        1
    );
    PRINT '  - English (Singapore) added';
END
GO

-- English (Hong Kong)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'en-HK')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'en-HK',
        'English (Hong Kong)',
        'English',
        'en-HK',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'en',
        1
    );
    PRINT '  - English (Hong Kong) added';
END
GO

-- English (Taiwan)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'en-TW')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'en-TW',
        'English (Taiwan)',
        'English',
        'en-TW',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'en',
        1
    );
    PRINT '  - English (Taiwan) added';
END
GO

-- English (Malaysia)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'en-MY')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'en-MY',
        'English (Malaysia)',
        'English',
        'en-MY',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'en',
        1
    );
    PRINT '  - English (Malaysia) added';
END
GO

-- English (Indonesia)
IF NOT EXISTS (SELECT 1 FROM dbo.Language WHERE LanguageCode = 'en-ID')
BEGIN
    INSERT INTO dbo.Language (LanguageCode, LanguageName, NativeName, LocaleCode, FallbackLanguageID, Direction, PluralRules, IsActive)
    VALUES (
        'en-ID',
        'English (Indonesia)',
        'English',
        'en-ID',
        (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US'),
        'LTR',
        'en',
        1
    );
    PRINT '  - English (Indonesia) added';
END
GO

PRINT 'New language variants added successfully';
GO

/*******************************************************************************
 * 4. POPULATE MARKETLANGUAGE JUNCTION TABLE
 *
 * Define which languages are available in which markets, with defaults
 *
 * Mapping per architecture plan:
 * - USA: en-US (default), zh-Hans
 * - CAN: en-CA (default), zh-Hans
 * - SGP: en-SG (default), id-ID
 * - HKG: en-HK (default), zh-HK
 * - TWN: en-TW (default), zh-TW
 * - GBR: en-GB (default)
 * - AUS: en-AU (default), zh-Hans
 * - MYS: en-MY (default), id-ID, ms-MY
 * - IDN: en-ID (default), id-ID
 ******************************************************************************/

PRINT 'Populating MarketLanguage junction table...';

-- Helper variables for market and language IDs
DECLARE @UsaMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'US');
DECLARE @CanMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'CA');
DECLARE @UkMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'UK');
DECLARE @AusMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'AU');
DECLARE @TwnMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'TW');
DECLARE @ChnMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'CN');
DECLARE @SgpMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'SG');
DECLARE @HkgMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'HK');
DECLARE @MysMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'MY');
DECLARE @IdnMarketID INT = (SELECT MarketID FROM dbo.Market WHERE MarketCode = 'ID');

DECLARE @enUS_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-US');
DECLARE @enCA_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-CA');
DECLARE @enGB_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-GB');
DECLARE @enAU_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-AU');
DECLARE @enSG_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-SG');
DECLARE @enHK_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-HK');
DECLARE @enTW_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-TW');
DECLARE @enMY_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-MY');
DECLARE @enID_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'en-ID');
DECLARE @zhTW_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'zh-TW');
DECLARE @zhHK_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'zh-HK');
DECLARE @zhHans_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'zh-Hans');
DECLARE @idID_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'id-ID');
DECLARE @msMY_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'ms-MY');
DECLARE @frCA_ID INT = (SELECT LanguageID FROM dbo.Language WHERE LocaleCode = 'fr-CA');

-- Clear existing data (for idempotency)
DELETE FROM dbo.MarketLanguage;

-- USA: en-US (default), zh-Hans
IF @UsaMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@UsaMarketID, @enUS_ID, 1, 1, 1),       -- English (US) - default
        (@UsaMarketID, @zhHans_ID, 0, 2, 1);     -- Simplified Chinese
    PRINT '  - USA market languages configured';
END

-- Canada: en-CA (default), fr-CA, zh-Hans
IF @CanMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@CanMarketID, @enCA_ID, 1, 1, 1),       -- English (Canada) - default
        (@CanMarketID, @frCA_ID, 0, 2, 1),       -- French (Canada)
        (@CanMarketID, @zhHans_ID, 0, 3, 1);     -- Simplified Chinese
    PRINT '  - Canada market languages configured';
END

-- United Kingdom: en-GB (default)
IF @UkMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@UkMarketID, @enGB_ID, 1, 1, 1);        -- English (UK) - default
    PRINT '  - UK market languages configured';
END

-- Australia: en-AU (default), zh-Hans
IF @AusMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@AusMarketID, @enAU_ID, 1, 1, 1),       -- English (Australia) - default
        (@AusMarketID, @zhHans_ID, 0, 2, 1);     -- Simplified Chinese
    PRINT '  - Australia market languages configured';
END

-- Taiwan: en-TW (default), zh-TW
IF @TwnMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@TwnMarketID, @enTW_ID, 1, 1, 1),       -- English (Taiwan) - default
        (@TwnMarketID, @zhTW_ID, 0, 2, 1);       -- Chinese Traditional (Taiwan)
    PRINT '  - Taiwan market languages configured';
END

-- China: zh-Hans (default), en-US
IF @ChnMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@ChnMarketID, @zhHans_ID, 1, 1, 1),     -- Simplified Chinese - default
        (@ChnMarketID, @enUS_ID, 0, 2, 1);       -- English (US)
    PRINT '  - China market languages configured';
END

-- Singapore: en-SG (default), id-ID
IF @SgpMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@SgpMarketID, @enSG_ID, 1, 1, 1),       -- English (Singapore) - default
        (@SgpMarketID, @idID_ID, 0, 2, 1);       -- Indonesian
    PRINT '  - Singapore market languages configured';
END

-- Hong Kong: en-HK (default), zh-HK
IF @HkgMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@HkgMarketID, @enHK_ID, 1, 1, 1),       -- English (Hong Kong) - default
        (@HkgMarketID, @zhHK_ID, 0, 2, 1);       -- Chinese Traditional (Hong Kong)
    PRINT '  - Hong Kong market languages configured';
END

-- Malaysia: en-MY (default), ms-MY, id-ID
IF @MysMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@MysMarketID, @enMY_ID, 1, 1, 1),       -- English (Malaysia) - default
        (@MysMarketID, @msMY_ID, 0, 2, 1),       -- Malay
        (@MysMarketID, @idID_ID, 0, 3, 1);       -- Indonesian
    PRINT '  - Malaysia market languages configured';
END

-- Indonesia: en-ID (default), id-ID
IF @IdnMarketID IS NOT NULL
BEGIN
    INSERT INTO dbo.MarketLanguage (MarketID, LanguageID, IsDefault, DisplayOrder, IsActive)
    VALUES
        (@IdnMarketID, @enID_ID, 1, 1, 1),       -- English (Indonesia) - default
        (@IdnMarketID, @idID_ID, 0, 2, 1);       -- Indonesian
    PRINT '  - Indonesia market languages configured';
END

PRINT 'MarketLanguage junction table populated successfully';
GO

/*******************************************************************************
 * 5. UPDATE EXISTING USER RECORDS WITH PREFERRED LOCALES
 *
 * Set PreferredLocale for existing users based on their market and language
 ******************************************************************************/

PRINT 'Updating existing users with preferred locales...';

-- Update users with their preferred locale based on current market and language
UPDATE u
SET PreferredLocale = l.LocaleCode
FROM dbo.[User] u
INNER JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
WHERE l.LocaleCode IS NOT NULL;

DECLARE @UpdatedUserCount INT = @@ROWCOUNT;
PRINT '  - Updated ' + CAST(@UpdatedUserCount AS NVARCHAR(10)) + ' existing users with preferred locales';

-- For any users without a preferred locale, default to their market's default language
UPDATE u
SET PreferredLocale = l.LocaleCode
FROM dbo.[User] u
INNER JOIN dbo.MarketLanguage ml ON u.MarketID = ml.MarketID AND ml.IsDefault = 1
INNER JOIN dbo.Language l ON ml.LanguageID = l.LanguageID
WHERE u.PreferredLocale IS NULL;

DECLARE @DefaultedUserCount INT = @@ROWCOUNT;
PRINT '  - Set default locale for ' + CAST(@DefaultedUserCount AS NVARCHAR(10)) + ' users without preferences';
GO

/*******************************************************************************
 * 6. SAMPLE TRANSLATION STRINGS (OPTIONAL)
 *
 * Add a few sample translation strings to demonstrate the system
 ******************************************************************************/

PRINT 'Adding sample translation strings...';

-- Get sample admin user for CreatedBy
DECLARE @AdminUserID BIGINT = (SELECT TOP 1 UserID FROM dbo.[User] WHERE RoleID = 3);

-- Sample: Welcome message
INSERT INTO dbo.TranslationString (TranslationKey, LanguageID, TranslationValue, Context, CreatedBy, UpdatedBy)
SELECT
    'common.welcome',
    LanguageID,
    CASE LocaleCode
        WHEN 'en-US' THEN 'Welcome'
        WHEN 'zh-TW' THEN '歡迎'
        WHEN 'zh-Hans' THEN '欢迎'
        WHEN 'id-ID' THEN 'Selamat datang'
        WHEN 'ms-MY' THEN 'Selamat datang'
        ELSE 'Welcome'
    END,
    'Common welcome message displayed throughout the app',
    @AdminUserID,
    @AdminUserID
FROM dbo.Language
WHERE LocaleCode IN ('en-US', 'zh-TW', 'zh-Hans', 'id-ID', 'ms-MY');

PRINT '  - Sample translation strings added';
GO

/*******************************************************************************
 * SEED DATA POPULATION COMPLETE
 ******************************************************************************/

PRINT '';
PRINT '=============================================================================';
PRINT 'Localization seed data populated successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '  - Language table updated with BCP 47 locale codes and fallback chains';
PRINT '  - New language variants added for all markets';
PRINT '  - MarketLanguage junction table populated with market-language mappings';
PRINT '  - Existing users updated with preferred locales';
PRINT '  - Sample translation strings added';
PRINT '';
PRINT 'Supported Locales:';
PRINT '  English: en-US, en-CA, en-GB, en-AU, en-SG, en-HK, en-TW, en-MY, en-ID';
PRINT '  Chinese: zh-TW (Traditional Taiwan), zh-HK (Traditional HK), zh-Hans (Simplified)';
PRINT '  Southeast Asian: id-ID (Indonesian), ms-MY (Malay)';
PRINT '  Other: fr-CA (French Canada), es-MX (Spanish Mexico)';
PRINT '';
PRINT 'Market-Language Mappings:';
PRINT '  USA: en-US (default), zh-Hans';
PRINT '  Canada: en-CA (default), fr-CA, zh-Hans';
PRINT '  UK: en-GB (default)';
PRINT '  Australia: en-AU (default), zh-Hans';
PRINT '  Taiwan: en-TW (default), zh-TW';
PRINT '  China: zh-Hans (default), en-US';
PRINT '  Singapore: en-SG (default), id-ID';
PRINT '  Hong Kong: en-HK (default), zh-HK';
PRINT '  Malaysia: en-MY (default), ms-MY, id-ID';
PRINT '  Indonesia: en-ID (default), id-ID';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Run backend implementation (LocaleService, AuthService updates)';
PRINT '  2. Run frontend implementation (next-intl setup, translation files)';
PRINT '  3. Create translation files in frontend/messages/';
PRINT '=============================================================================';
GO
