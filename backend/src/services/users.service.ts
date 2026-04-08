/**
 * Users Service
 * Business logic for user self-service operations
 */

import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

const logger = createLogger('UsersService');

interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest?: boolean;
  engagementAlerts: boolean;
  contentUpdates: boolean;
}

interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  defaultView: string;
}

export class UsersService {
  /**
   * Update user profile information
   */
  async updateProfile(userId: number, data: ProfileUpdateData) {
    try {
      const sql = `
        UPDATE dbo.[User]
        SET
          FirstName = @firstName,
          LastName = @lastName,
          Email = @email,
          Mobile = @phoneNumber,
          UpdatedDate = SYSDATETIME(),
          UpdatedBy = @userId
        WHERE UserID = @userId;

        SELECT
          UserID as id,
          MemberID as memberId,
          Email as email,
          FirstName as firstName,
          LastName as lastName,
          Mobile as phoneNumber,
          TimeZone as timezone,
          RoleID as roleId,
          MarketID as marketId,
          PreferredLanguageID as preferredLanguageId,
          Status as status
        FROM dbo.[User]
        WHERE UserID = @userId;
      `;

      const result = await query(sql, {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
      });

      logger.info(`Profile updated for user ${userId}`);
      return result[0];
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      // Get current password hash
      const getUserSql = `
        SELECT PasswordHash
        FROM dbo.[User]
        WHERE UserID = @userId;
      `;
      const userResult = await query(getUserSql, { userId });

      if (!userResult || userResult.length === 0) {
        throw new Error('User not found');
      }

      const currentHash = userResult[0].PasswordHash;

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, currentHash);
      if (!isValid) {
        throw new Error('Invalid current password');
      }

      // Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateSql = `
        UPDATE dbo.[User]
        SET
          PasswordHash = @newHash,
          UpdatedDate = SYSDATETIME(),
          UpdatedBy = @userId
        WHERE UserID = @userId;
      `;

      await query(updateSql, { userId, newHash });

      logger.info(`Password updated for user ${userId}`);
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotifications(userId: number, prefs: NotificationPreferences) {
    try {
      // Map frontend field names to database field names
      const sql = `
        MERGE dbo.UserSettings AS target
        USING (SELECT @userId AS UserID) AS source
        ON target.UserID = source.UserID
        WHEN MATCHED THEN
          UPDATE SET
            EmailNotificationsEnabled = @emailNotifications,
            SMSNotificationsEnabled = @smsNotifications,
            PushNotificationsEnabled = @pushNotifications,
            NotifyOnEngagement = @engagementAlerts,
            NotifyOnNewContent = @contentUpdates,
            UpdatedDate = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (
            UserID,
            EmailNotificationsEnabled,
            SMSNotificationsEnabled,
            PushNotificationsEnabled,
            NotifyOnEngagement,
            NotifyOnNewContent,
            CreatedDate,
            UpdatedDate
          )
          VALUES (
            @userId,
            @emailNotifications,
            @smsNotifications,
            @pushNotifications,
            @engagementAlerts,
            @contentUpdates,
            SYSDATETIME(),
            SYSDATETIME()
          );
      `;

      await query(sql, {
        userId,
        emailNotifications: prefs.emailNotifications,
        smsNotifications: prefs.smsNotifications,
        pushNotifications: prefs.pushNotifications,
        engagementAlerts: prefs.engagementAlerts,
        contentUpdates: prefs.contentUpdates,
      });

      logger.info(`Notification preferences updated for user ${userId}`);
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences (language, timezone, date format, default view)
   */
  async updatePreferences(userId: number, prefs: UserPreferences) {
    try {
      // Get language ID from language code
      const getLanguageIdSql = `
        SELECT LanguageID
        FROM dbo.Language
        WHERE LanguageCode = @languageCode;
      `;
      const langResult = await query(getLanguageIdSql, { languageCode: prefs.language });
      const languageId = langResult && langResult.length > 0 ? langResult[0].LanguageID : 1; // Default to English (ID 1) if not found

      // Update User table (timezone, language)
      const updateUserSql = `
        UPDATE dbo.[User]
        SET
          TimeZone = @timezone,
          PreferredLanguageID = @languageId,
          UpdatedDate = SYSDATETIME(),
          UpdatedBy = @userId
        WHERE UserID = @userId;
      `;

      await query(updateUserSql, { userId, timezone: prefs.timezone, languageId });

      // Update UserSettings table (default view)
      // Store defaultView in DefaultShareChannel for now (or we can add a new column)
      const updateSettingsSql = `
        MERGE dbo.UserSettings AS target
        USING (SELECT @userId AS UserID) AS source
        ON target.UserID = source.UserID
        WHEN MATCHED THEN
          UPDATE SET
            DefaultShareChannel = @defaultView,
            UpdatedDate = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (UserID, DefaultShareChannel, CreatedDate, UpdatedDate)
          VALUES (@userId, @defaultView, SYSDATETIME(), SYSDATETIME());
      `;

      await query(updateSettingsSql, { userId, defaultView: prefs.defaultView });

      logger.info(`Preferences updated for user ${userId}`);
    } catch (error) {
      logger.error('Error updating preferences:', error);
      throw error;
    }
  }
}
