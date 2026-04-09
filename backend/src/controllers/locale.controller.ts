import { Request, Response } from 'express';
import localeService from '../services/locale.service.js';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('LocaleController');

export class LocaleController {
  /**
   * Get available locales for a market
   * GET /api/v1/locales/markets/:marketCode
   */
  async getMarketLocales(req: Request, res: Response): Promise<void> {
    try {
      const marketCode = req.params.marketCode as string;

      if (!marketCode || typeof marketCode !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Market code is required'
        });
        return;
      }

      const locales = await localeService.getMarketLocales(marketCode);

      res.status(200).json({
        success: true,
        data: {
          marketCode,
          locales
        }
      });

    } catch (error) {
      logger.error('Get market locales error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while fetching locales'
      });
    }
  }

  /**
   * Update authenticated user's preferred locale
   * PUT /api/v1/users/locale
   */
  async updateUserLocale(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { locale, marketCode } = req.body;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        });
        return;
      }

      if (!locale) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Locale is required'
        });
        return;
      }

      // Validate locale format (basic BCP 47 check)
      const localeRegex = /^[a-z]{2}-[A-Z]{2}$|^[a-z]{2}-[A-Z][a-z]{3}$/;
      if (!localeRegex.test(locale)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid locale format. Expected BCP 47 format (e.g., en-US, zh-TW)'
        });
        return;
      }

      // Validate locale is available for user's market
      const userMarket = marketCode || user.market;
      if (userMarket) {
        const isValid = await localeService.validateMarketLocale(userMarket, locale);

        if (!isValid) {
          res.status(400).json({
            error: 'Bad Request',
            message: `Locale ${locale} is not available for market ${userMarket}`
          });
          return;
        }
      }

      // Update user's preferred locale
      await query(`
        UPDATE [User]
        SET PreferredLocale = @locale,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { locale, userId: user.userId });

      logger.info(`Updated locale for user ${user.email} to ${locale}`);

      res.status(200).json({
        success: true,
        message: 'Locale updated successfully',
        data: {
          locale
        }
      });

    } catch (error) {
      logger.error('Update user locale error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while updating locale'
      });
    }
  }
}

export default new LocaleController();
