import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { EncryptionService } from '../utils/encryption.js';
import { SystemSetting, SettingCategory } from '../types/settings.types.js';

const logger = createLogger('SystemSettingsService');

export class SystemSettingsService {
  /**
   * Get all settings or by category
   */
  async getSettings(category?: string): Promise<SystemSetting[]> {
    try {
      logger.info(`Getting settings${category ? ` for category: ${category}` : ''}`);

      const results = await query<any>(`
        EXEC usp_GetSystemSettings @Category = @category
      `, { category: category || null });

      // Decrypt encrypted settings
      const settings = results.map((row: any) => {
        let settingValue = row.SettingValue;

        // Decrypt if encrypted
        if (row.IsEncrypted) {
          try {
            settingValue = EncryptionService.decrypt(settingValue);
          } catch (error) {
            logger.error(`Failed to decrypt setting: ${row.SettingKey}`, error);
          }
        }

        // Parse value based on data type
        if (row.DataType === 'number') {
          settingValue = parseFloat(settingValue);
        } else if (row.DataType === 'boolean') {
          settingValue = settingValue === 'true' || settingValue === '1';
        } else if (row.DataType === 'json') {
          try {
            settingValue = JSON.parse(settingValue);
          } catch (error) {
            logger.error(`Failed to parse JSON setting: ${row.SettingKey}`, error);
          }
        }

        return {
          settingId: row.SettingID,
          settingKey: row.SettingKey,
          settingValue,
          category: row.Category,
          dataType: row.DataType,
          description: row.Description,
          updatedBy: row.UpdatedBy,
          updatedDate: row.UpdatedDate
        };
      });

      return settings;
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Get settings grouped by category
   */
  async getSettingsByCategory(): Promise<SettingCategory[]> {
    try {
      const settings = await this.getSettings();

      const categories: { [key: string]: SystemSetting[] } = {};

      settings.forEach(setting => {
        if (!categories[setting.category]) {
          categories[setting.category] = [];
        }
        categories[setting.category].push(setting);
      });

      return Object.keys(categories).map(category => ({
        category,
        settings: categories[category]
      }));
    } catch (error) {
      logger.error('Error getting settings by category:', error);
      throw error;
    }
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    try {
      const settings = await this.getSettings();
      return settings.find(s => s.settingKey === key) || null;
    } catch (error) {
      logger.error(`Error getting setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting(
    key: string,
    value: any,
    updatedBy: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SystemSetting> {
    try {
      logger.info(`Updating setting: ${key}`);

      // Get setting info
      const setting = await this.getSetting(key);
      if (!setting) {
        throw new Error(`Setting not found: ${key}`);
      }

      // Convert value to string based on data type
      let stringValue: string;
      if (setting.dataType === 'json') {
        stringValue = JSON.stringify(value);
      } else if (setting.dataType === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else if (setting.dataType === 'number') {
        stringValue = value.toString();
      } else {
        stringValue = value;
      }

      // Encrypt if this is a sensitive setting
      const encryptedKeys = [
        'email_smtp_password',
        'sms_twilio_auth_token',
        'sms_twilio_account_sid',
        'encryption_key'
      ];

      if (encryptedKeys.includes(key)) {
        stringValue = EncryptionService.encrypt(stringValue);
      }

      // Update in database
      const results = await query<any>(`
        EXEC usp_UpdateSystemSetting
          @SettingKey = @key,
          @SettingValue = @value,
          @UpdatedBy = @updatedBy,
          @IPAddress = @ipAddress,
          @UserAgent = @userAgent
      `, {
        key,
        value: stringValue,
        updatedBy,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      });

      if (results.length === 0) {
        throw new Error('Failed to update setting');
      }

      // Return updated setting (decrypt if needed)
      const updated = results[0];
      return {
        settingId: updated.SettingID,
        settingKey: updated.SettingKey,
        settingValue: value, // Use original value (already decrypted/parsed)
        category: updated.Category,
        dataType: updated.DataType,
        description: updated.Description,
        updatedBy: updated.UpdatedBy,
        updatedDate: updated.UpdatedDate
      };
    } catch (error) {
      logger.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(
    settings: Array<{ key: string; value: any }>,
    updatedBy: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SystemSetting[]> {
    try {
      logger.info(`Bulk updating ${settings.length} settings`);

      const updatedSettings: SystemSetting[] = [];

      for (const setting of settings) {
        const updated = await this.updateSetting(
          setting.key,
          setting.value,
          updatedBy,
          ipAddress,
          userAgent
        );
        updatedSettings.push(updated);
      }

      return updatedSettings;
    } catch (error) {
      logger.error('Error bulk updating settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(category?: string, resetBy?: number): Promise<SystemSetting[]> {
    try {
      logger.info(`Resetting settings to defaults${category ? ` for category: ${category}` : ''}`);

      // Get default values
      const defaults = this.getDefaultSettings();

      // Filter by category if provided
      const settingsToReset = category
        ? defaults.filter(s => s.category === category)
        : defaults;

      // Update each setting
      const resetSettings: SystemSetting[] = [];

      for (const setting of settingsToReset) {
        const updated = await this.updateSetting(
          setting.settingKey,
          setting.settingValue,
          resetBy || 1 // System user
        );
        resetSettings.push(updated);
      }

      return resetSettings;
    } catch (error) {
      logger.error('Error resetting settings to defaults:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SystemSetting[] {
    return [
      // Application Settings
      {
        settingId: 0,
        settingKey: 'app_name',
        settingValue: 'UnFranchise Marketing App',
        category: 'application',
        dataType: 'string',
        description: 'Application name displayed in UI'
      },
      {
        settingId: 0,
        settingKey: 'app_logo_url',
        settingValue: '/images/logo.png',
        category: 'application',
        dataType: 'string',
        description: 'URL to application logo'
      },
      {
        settingId: 0,
        settingKey: 'app_theme_primary_color',
        settingValue: '#2563eb',
        category: 'application',
        dataType: 'string',
        description: 'Primary theme color'
      },

      // Email Settings
      {
        settingId: 0,
        settingKey: 'email_enabled',
        settingValue: true,
        category: 'email',
        dataType: 'boolean',
        description: 'Enable email notifications'
      },
      {
        settingId: 0,
        settingKey: 'email_smtp_host',
        settingValue: 'smtp.sendgrid.net',
        category: 'email',
        dataType: 'string',
        description: 'SMTP server host'
      },
      {
        settingId: 0,
        settingKey: 'email_smtp_port',
        settingValue: 587,
        category: 'email',
        dataType: 'number',
        description: 'SMTP server port'
      },
      {
        settingId: 0,
        settingKey: 'email_from_address',
        settingValue: 'noreply@unfranchise.com',
        category: 'email',
        dataType: 'string',
        description: 'Default from email address'
      },

      // SMS Settings
      {
        settingId: 0,
        settingKey: 'sms_enabled',
        settingValue: true,
        category: 'sms',
        dataType: 'boolean',
        description: 'Enable SMS notifications'
      },

      // Notification Settings
      {
        settingId: 0,
        settingKey: 'notifications_email_enabled',
        settingValue: true,
        category: 'notifications',
        dataType: 'boolean',
        description: 'Enable email notifications'
      },
      {
        settingId: 0,
        settingKey: 'notifications_sms_enabled',
        settingValue: true,
        category: 'notifications',
        dataType: 'boolean',
        description: 'Enable SMS notifications'
      },
      {
        settingId: 0,
        settingKey: 'notifications_push_enabled',
        settingValue: true,
        category: 'notifications',
        dataType: 'boolean',
        description: 'Enable push notifications'
      }
    ];
  }
}

export default new SystemSettingsService();
