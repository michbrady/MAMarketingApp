/**
 * Locale Types for UnFranchise Marketing App
 */

/**
 * Market locale information returned by API
 */
export interface MarketLocale {
  LocaleCode: string;          // BCP 47 code (e.g., 'en-US', 'zh-TW')
  LanguageName: string;         // English name (e.g., 'English', 'Chinese')
  NativeName: string;           // Native name (e.g., 'English', '中文')
  IsDefault: boolean;           // Is this the default locale for the market
  DisplayOrder: number;         // Order in language selector UI
  LanguageID: number;           // Database language ID
}

/**
 * Locale mapping structure for service code → BCP 47 conversion
 */
export interface LocaleMapping {
  [countryCode: string]: {
    [languageCode: string]: string;  // e.g., USA: { ENG: 'en-US' }
  };
}

/**
 * User interface with locale field
 */
export interface UserWithLocale {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  locale?: string;              // BCP 47 locale code
  market?: string;              // Market code (e.g., 'USA', 'TWN')
  timezone?: string;
  dateFormat?: string;
  createdAt: string;
}

/**
 * Update user locale request
 */
export interface UpdateUserLocaleRequest {
  locale: string;               // BCP 47 locale code
  marketCode?: string;          // Optional market code for validation
}

/**
 * Locale validation result
 */
export interface LocaleValidationResult {
  isValid: boolean;
  locale?: string;
  error?: string;
}
