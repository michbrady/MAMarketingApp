import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { MarketLocale, LocaleMapping } from '../types/locale.types.js';

const logger = createLogger('LocaleService');

/**
 * Service code → BCP 47 locale mappings
 * Maps internal service codes (ENG, CHI, etc.) to standard BCP 47 locale codes
 */
export const LOCALE_MAPPINGS: LocaleMapping = {
  USA: {
    ENG: 'en-US',
    CHI: 'zh-Hans', // Simplified Chinese for USA
  },
  CAN: {
    ENG: 'en-CA',
    CHI: 'zh-Hans',
  },
  SGP: {
    ENG: 'en-SG',
    IDN: 'id-ID',
  },
  HKG: {
    ENG: 'en-HK',
    CHI: 'zh-HK', // Traditional with HK variant
  },
  TWN: {
    ENG: 'en-TW',
    CHI: 'zh-TW', // Traditional Taiwanese
  },
  GBR: {
    ENG: 'en-GB',
  },
  AUS: {
    ENG: 'en-AU',
    CHI: 'zh-Hans',
  },
  MYS: {
    ENG: 'en-MY',
    IDN: 'id-ID',
    MSA: 'ms-MY',
  },
  IDN: {
    ENG: 'en-ID',
    IDN: 'id-ID',
  },
};

export class LocaleService {
  /**
   * Get available locales for a market
   */
  async getMarketLocales(marketCode: string): Promise<MarketLocale[]> {
    try {
      logger.info(`Getting locales for market: ${marketCode}`);

      const result = await query<MarketLocale>(`
        SELECT
          l.LanguageCode as LocaleCode,
          l.LanguageName,
          l.NativeName,
          ml.IsDefault,
          ml.DisplayOrder,
          l.LanguageID
        FROM dbo.MarketLanguage ml
        INNER JOIN dbo.Market m ON ml.MarketID = m.MarketID
        INNER JOIN dbo.Language l ON ml.LanguageID = l.LanguageID
        WHERE m.MarketCode = @marketCode
          AND ml.IsActive = 1
          AND l.IsActive = 1
        ORDER BY ml.DisplayOrder, l.LanguageName
      `, { marketCode });

      logger.info(`Found ${result.length} locales for market ${marketCode}`);
      return result;

    } catch (error) {
      logger.error(`Error getting market locales for ${marketCode}:`, error);
      throw error;
    }
  }

  /**
   * Validate that a locale is available for a given market
   */
  async validateMarketLocale(marketCode: string, locale: string): Promise<boolean> {
    try {
      logger.info(`Validating locale ${locale} for market ${marketCode}`);

      const result = await query<{ Count: number }>(`
        SELECT COUNT(*) as Count
        FROM dbo.MarketLanguage ml
        INNER JOIN dbo.Market m ON ml.MarketID = m.MarketID
        INNER JOIN dbo.Language l ON ml.LanguageID = l.LanguageID
        WHERE m.MarketCode = @marketCode
          AND l.LanguageCode = @locale
          AND ml.IsActive = 1
          AND l.IsActive = 1
      `, { marketCode, locale });

      const isValid = result.length > 0 && result[0].Count > 0;
      logger.info(`Locale ${locale} is ${isValid ? 'valid' : 'invalid'} for market ${marketCode}`);

      return isValid;

    } catch (error) {
      logger.error(`Error validating locale ${locale} for market ${marketCode}:`, error);
      return false;
    }
  }

  /**
   * Get the default locale for a market
   */
  async getDefaultLocale(marketCode: string): Promise<string> {
    try {
      logger.info(`Getting default locale for market: ${marketCode}`);

      const result = await query<{ LocaleCode: string }>(`
        SELECT TOP 1
          l.LanguageCode as LocaleCode
        FROM dbo.MarketLanguage ml
        INNER JOIN dbo.Market m ON ml.MarketID = m.MarketID
        INNER JOIN dbo.Language l ON ml.LanguageID = l.LanguageID
        WHERE m.MarketCode = @marketCode
          AND ml.IsDefault = 1
          AND ml.IsActive = 1
          AND l.IsActive = 1
      `, { marketCode });

      if (result.length > 0) {
        logger.info(`Default locale for ${marketCode}: ${result[0].LocaleCode}`);
        return result[0].LocaleCode;
      }

      logger.warn(`No default locale found for market ${marketCode}, using en-US`);
      return 'en-US';

    } catch (error) {
      logger.error(`Error getting default locale for market ${marketCode}:`, error);
      return 'en-US';
    }
  }

  /**
   * Map service codes (ENG, CHI, IDN, MSA) to BCP 47 locale codes
   * @param countryCode - Three-letter country code (e.g., 'USA', 'TWN')
   * @param languageCode - Service language code (e.g., 'ENG', 'CHI')
   * @returns BCP 47 locale code (e.g., 'en-US', 'zh-TW')
   */
  mapServiceCodeToLocale(countryCode: string, languageCode: string): string {
    try {
      const countryMapping = LOCALE_MAPPINGS[countryCode];

      if (!countryMapping) {
        logger.warn(`Unknown country code: ${countryCode}, falling back to en-US`);
        return 'en-US';
      }

      const locale = countryMapping[languageCode];

      if (!locale) {
        logger.warn(`Unknown language code ${languageCode} for country ${countryCode}, falling back to en-US`);
        return 'en-US';
      }

      logger.info(`Mapped ${countryCode}/${languageCode} → ${locale}`);
      return locale;

    } catch (error) {
      logger.error(`Error mapping service codes ${countryCode}/${languageCode}:`, error);
      return 'en-US';
    }
  }
}

export default new LocaleService();
