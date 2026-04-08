import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { FeatureFlag } from '../types/settings.types.js';

const logger = createLogger('FeatureFlagService');

export class FeatureFlagService {
  /**
   * Get all feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      logger.info('Getting all feature flags');

      const results = await query<any>(`
        EXEC usp_GetFeatureFlags
      `);

      return results.map((row: any) => ({
        featureFlagId: row.FeatureFlagID,
        featureName: row.FeatureName,
        isEnabled: row.IsEnabled,
        description: row.Description,
        enabledBy: row.EnabledBy,
        enabledDate: row.EnabledDate
      }));
    } catch (error) {
      logger.error('Error getting feature flags:', error);
      throw error;
    }
  }

  /**
   * Get a single feature flag by name
   */
  async getFeatureFlag(featureName: string): Promise<FeatureFlag | null> {
    try {
      const flags = await this.getFeatureFlags();
      return flags.find(f => f.featureName === featureName) || null;
    } catch (error) {
      logger.error(`Error getting feature flag ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureName: string): Promise<boolean> {
    try {
      const flag = await this.getFeatureFlag(featureName);
      return flag ? flag.isEnabled : false;
    } catch (error) {
      logger.error(`Error checking feature ${featureName}:`, error);
      return false;
    }
  }

  /**
   * Enable a feature
   */
  async enableFeature(featureName: string, enabledBy: number): Promise<FeatureFlag> {
    try {
      logger.info(`Enabling feature: ${featureName}`);

      const results = await query<any>(`
        EXEC usp_ToggleFeatureFlag
          @FeatureName = @featureName,
          @IsEnabled = 1,
          @ToggledBy = @enabledBy
      `, {
        featureName,
        enabledBy
      });

      if (results.length === 0) {
        throw new Error(`Feature not found: ${featureName}`);
      }

      const row = results[0];
      return {
        featureFlagId: row.FeatureFlagID,
        featureName: row.FeatureName,
        isEnabled: row.IsEnabled,
        description: row.Description,
        enabledBy: row.EnabledBy,
        enabledDate: row.EnabledDate
      };
    } catch (error) {
      logger.error(`Error enabling feature ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Disable a feature
   */
  async disableFeature(featureName: string, disabledBy: number): Promise<FeatureFlag> {
    try {
      logger.info(`Disabling feature: ${featureName}`);

      const results = await query<any>(`
        EXEC usp_ToggleFeatureFlag
          @FeatureName = @featureName,
          @IsEnabled = 0,
          @ToggledBy = @disabledBy
      `, {
        featureName,
        disabledBy
      });

      if (results.length === 0) {
        throw new Error(`Feature not found: ${featureName}`);
      }

      const row = results[0];
      return {
        featureFlagId: row.FeatureFlagID,
        featureName: row.FeatureName,
        isEnabled: row.IsEnabled,
        description: row.Description,
        enabledBy: row.DisabledBy,
        enabledDate: row.DisabledDate
      };
    } catch (error) {
      logger.error(`Error disabling feature ${featureName}:`, error);
      throw error;
    }
  }

  /**
   * Toggle a feature
   */
  async toggleFeature(featureName: string, isEnabled: boolean, toggledBy: number): Promise<FeatureFlag> {
    return isEnabled
      ? this.enableFeature(featureName, toggledBy)
      : this.disableFeature(featureName, toggledBy);
  }

  /**
   * Get enabled features as a map
   */
  async getEnabledFeaturesMap(): Promise<{ [key: string]: boolean }> {
    try {
      const flags = await this.getFeatureFlags();
      const map: { [key: string]: boolean } = {};

      flags.forEach(flag => {
        map[flag.featureName] = flag.isEnabled;
      });

      return map;
    } catch (error) {
      logger.error('Error getting enabled features map:', error);
      throw error;
    }
  }
}

export default new FeatureFlagService();
