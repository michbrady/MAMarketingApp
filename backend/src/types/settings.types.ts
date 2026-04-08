export interface SystemSetting {
  settingId: number;
  settingKey: string;
  settingValue: any;
  category: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  updatedBy?: number;
  updatedDate?: Date;
}

export interface FeatureFlag {
  featureFlagId: number;
  featureName: string;
  isEnabled: boolean;
  description: string;
  enabledBy?: number;
  enabledDate?: Date;
}

export interface MaintenanceStatus {
  isEnabled: boolean;
  message?: string;
  enabledBy?: number;
  enabledDate?: Date;
}

export interface SettingCategory {
  category: string;
  settings: SystemSetting[];
}

export interface UpdateSettingRequest {
  key: string;
  value: any;
  updatedBy: number;
}

export interface BulkUpdateSettingsRequest {
  settings: Array<{
    key: string;
    value: any;
  }>;
  updatedBy: number;
}

export interface ResetSettingsRequest {
  category?: string;
  resetBy: number;
}

export interface ToggleFeatureRequest {
  featureName: string;
  isEnabled: boolean;
  toggledBy: number;
}

export interface EnableMaintenanceRequest {
  message: string;
  enabledBy: number;
}

export interface DisableMaintenanceRequest {
  disabledBy: number;
}

export interface ContentModerationAction {
  contentId: number;
  actionBy: number;
  reason?: string;
}

export interface BulkModerationAction {
  contentIds: number[];
  actionBy: number;
  reason?: string;
}
