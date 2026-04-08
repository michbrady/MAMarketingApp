import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { MaintenanceStatus } from '../types/settings.types.js';

const logger = createLogger('MaintenanceService');

export class MaintenanceService {
  /**
   * Check if maintenance mode is enabled
   */
  async isMaintenanceMode(): Promise<boolean> {
    try {
      const status = await this.getMaintenanceStatus();
      return status.isEnabled;
    } catch (error) {
      logger.error('Error checking maintenance mode:', error);
      return false;
    }
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    try {
      logger.info('Getting maintenance mode status');

      const results = await query<any>(`
        EXEC usp_GetMaintenanceStatus
      `);

      if (results.length === 0) {
        return {
          isEnabled: false,
          message: 'System is currently under maintenance.'
        };
      }

      const row = results[0];
      return {
        isEnabled: row.IsEnabled,
        message: row.Message,
        enabledBy: row.EnabledBy,
        enabledDate: row.EnabledDate
      };
    } catch (error) {
      logger.error('Error getting maintenance status:', error);
      throw error;
    }
  }

  /**
   * Get maintenance message
   */
  async getMaintenanceMessage(): Promise<string> {
    try {
      const status = await this.getMaintenanceStatus();
      return status.message || 'System is currently under maintenance. Please check back soon.';
    } catch (error) {
      logger.error('Error getting maintenance message:', error);
      return 'System is currently under maintenance. Please check back soon.';
    }
  }

  /**
   * Enable maintenance mode
   */
  async enableMaintenanceMode(
    message: string,
    enabledBy: number,
    scheduledEnd?: Date
  ): Promise<MaintenanceStatus> {
    try {
      logger.info('Enabling maintenance mode');

      const results = await query<any>(`
        EXEC usp_EnableMaintenanceMode
          @Message = @message,
          @EnabledBy = @enabledBy,
          @ScheduledEnd = @scheduledEnd
      `, {
        message,
        enabledBy,
        scheduledEnd: scheduledEnd || null
      });

      if (results.length === 0) {
        throw new Error('Failed to enable maintenance mode');
      }

      const row = results[0];
      return {
        isEnabled: row.IsEnabled,
        message: row.Message,
        enabledBy: row.EnabledBy,
        enabledDate: row.EnabledDate
      };
    } catch (error) {
      logger.error('Error enabling maintenance mode:', error);
      throw error;
    }
  }

  /**
   * Disable maintenance mode
   */
  async disableMaintenanceMode(disabledBy: number): Promise<MaintenanceStatus> {
    try {
      logger.info('Disabling maintenance mode');

      const results = await query<any>(`
        EXEC usp_DisableMaintenanceMode
          @DisabledBy = @disabledBy
      `, {
        disabledBy
      });

      if (results.length === 0) {
        throw new Error('Failed to disable maintenance mode');
      }

      const row = results[0];
      return {
        isEnabled: row.IsEnabled,
        message: row.Message,
        enabledBy: row.DisabledBy,
        enabledDate: row.DisabledDate
      };
    } catch (error) {
      logger.error('Error disabling maintenance mode:', error);
      throw error;
    }
  }

  /**
   * Toggle maintenance mode
   */
  async toggleMaintenanceMode(
    isEnabled: boolean,
    userId: number,
    message?: string
  ): Promise<MaintenanceStatus> {
    return isEnabled
      ? this.enableMaintenanceMode(message || 'System is currently under maintenance.', userId)
      : this.disableMaintenanceMode(userId);
  }
}

export default new MaintenanceService();
