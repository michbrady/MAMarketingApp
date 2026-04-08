import { Request, Response } from 'express';
import systemSettingsService from '../services/system-settings.service.js';
import featureFlagService from '../services/feature-flag.service.js';
import maintenanceService from '../services/maintenance.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SettingsController');

export class SettingsController {
  /**
   * GET /api/v1/admin/settings
   * Get all settings
   */
  async getAllSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await systemSettingsService.getSettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting all settings:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get settings'
      });
    }
  }

  /**
   * GET /api/v1/admin/settings/grouped
   * Get settings grouped by category
   */
  async getSettingsByCategory(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await systemSettingsService.getSettingsByCategory();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting settings by category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get settings'
      });
    }
  }

  /**
   * GET /api/v1/admin/settings/:category
   * Get settings for a specific category
   */
  async getCategorySettings(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const categoryParam = Array.isArray(category) ? category[0] : category;

      const settings = await systemSettingsService.getSettings(categoryParam);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting category settings:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get settings'
      });
    }
  }

  /**
   * PUT /api/v1/admin/settings/:key
   * Update a single setting
   */
  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const keyParam = Array.isArray(key) ? key[0] : key;
      const updated = await systemSettingsService.updateSetting(
        keyParam,
        value,
        user.userId,
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error updating setting:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update setting'
      });
    }
  }

  /**
   * PUT /api/v1/admin/settings/bulk
   * Bulk update settings
   */
  async bulkUpdateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { settings } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!Array.isArray(settings)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'settings must be an array'
        });
        return;
      }

      const updated = await systemSettingsService.bulkUpdateSettings(
        settings,
        user.userId,
        req.ip,
        req.get('user-agent')
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error bulk updating settings:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update settings'
      });
    }
  }

  /**
   * POST /api/v1/admin/settings/reset
   * Reset settings to defaults
   */
  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const reset = await systemSettingsService.resetToDefaults(category, user.userId);

      res.json({
        success: true,
        data: reset
      });
    } catch (error) {
      logger.error('Error resetting settings:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset settings'
      });
    }
  }

  /**
   * GET /api/v1/admin/feature-flags
   * Get all feature flags
   */
  async getFeatureFlags(_req: Request, res: Response): Promise<void> {
    try {
      const flags = await featureFlagService.getFeatureFlags();

      res.json({
        success: true,
        data: flags
      });
    } catch (error) {
      logger.error('Error getting feature flags:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get feature flags'
      });
    }
  }

  /**
   * PUT /api/v1/admin/feature-flags/:feature
   * Toggle a feature flag
   */
  async toggleFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { feature } = req.params;
      const { isEnabled } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (typeof isEnabled !== 'boolean') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'isEnabled must be a boolean'
        });
        return;
      }

      const featureParam = Array.isArray(feature) ? feature[0] : feature;
      const updated = await featureFlagService.toggleFeature(
        featureParam,
        isEnabled,
        user.userId
      );

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      logger.error('Error toggling feature flag:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to toggle feature flag'
      });
    }
  }

  /**
   * GET /api/v1/admin/maintenance
   * Get maintenance mode status
   */
  async getMaintenanceStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await maintenanceService.getMaintenanceStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting maintenance status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get maintenance status'
      });
    }
  }

  /**
   * POST /api/v1/admin/maintenance/enable
   * Enable maintenance mode
   */
  async enableMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { message, scheduledEnd } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const status = await maintenanceService.enableMaintenanceMode(
        message || 'System is currently under maintenance.',
        user.userId,
        scheduledEnd ? new Date(scheduledEnd) : undefined
      );

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error enabling maintenance mode:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to enable maintenance mode'
      });
    }
  }

  /**
   * POST /api/v1/admin/maintenance/disable
   * Disable maintenance mode
   */
  async disableMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const status = await maintenanceService.disableMaintenanceMode(user.userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error disabling maintenance mode:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to disable maintenance mode'
      });
    }
  }
}

export default new SettingsController();
