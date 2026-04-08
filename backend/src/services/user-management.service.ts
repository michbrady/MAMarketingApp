/**
 * User Management Service
 * Service for managing users, roles, and permissions
 */

import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import auditLogService from './audit-log.service.js';
import {
  UserDetails,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  PaginationParams,
  PaginatedResponse,
  UserActivityEvent,
  PasswordResetResponse
} from '../types/user-management.types.js';

const logger = createLogger('UserManagementService');

export class UserManagementService {
  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(
    filters: UserFilters = {},
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<PaginatedResponse<UserDetails>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ['1=1'];
      const params: any = {
        offset,
        limit
      };

      if (filters.roleId) {
        conditions.push('u.RoleID = @roleId');
        params.roleId = filters.roleId;
      }

      if (filters.role) {
        conditions.push('r.RoleName = @roleName');
        params.roleName = filters.role;
      }

      if (filters.marketId) {
        conditions.push('u.MarketID = @marketId');
        params.marketId = filters.marketId;
      }

      if (filters.market) {
        conditions.push('m.MarketCode = @marketCode');
        params.marketCode = filters.market;
      }

      if (filters.status) {
        conditions.push('u.Status = @status');
        params.status = filters.status;
      }

      if (filters.search) {
        conditions.push(`(
          u.Email LIKE @search OR
          u.FirstName LIKE @search OR
          u.LastName LIKE @search OR
          u.MemberID LIKE @search
        )`);
        params.search = `%${filters.search}%`;
      }

      if (filters.dateFrom) {
        conditions.push('u.CreatedDate >= @dateFrom');
        params.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        conditions.push('u.CreatedDate <= @dateTo');
        params.dateTo = filters.dateTo;
      }

      const whereClause = conditions.join(' AND ');

      // Build ORDER BY clause
      let orderByClause = 'u.CreatedDate DESC';
      if (filters.sortBy) {
        const sortColumn = {
          name: 'u.FirstName',
          email: 'u.Email',
          createdDate: 'u.CreatedDate',
          lastLoginDate: 'u.LastLoginDate'
        }[filters.sortBy];

        const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
        orderByClause = `${sortColumn} ${sortOrder}`;
      }

      // Get total count
      const countResult = await query<{ Total: number }>(`
        SELECT COUNT(*) as Total
        FROM dbo.[User] u
        LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
      `, params);

      const total = countResult[0]?.Total || 0;

      // Get paginated data with stats
      const users = await query<any>(`
        SELECT
          u.UserID as userId,
          u.MemberID as memberId,
          u.Email as email,
          u.FirstName as firstName,
          u.LastName as lastName,
          u.Mobile as mobile,
          u.RoleID as roleId,
          r.RoleName as roleName,
          u.MarketID as marketId,
          m.MarketName as marketName,
          m.MarketCode as marketCode,
          u.PreferredLanguageID as preferredLanguageId,
          l.LanguageName as languageName,
          u.Status as status,
          u.EmailVerified as emailVerified,
          u.MobileVerified as mobileVerified,
          u.LastLoginDate as lastLoginDate,
          u.LastActivityDate as lastActivityDate,
          u.ProfileImageURL as profileImageURL,
          u.TimeZone as timeZone,
          u.ExternalAuthProvider as externalAuthProvider,
          u.FailedLoginAttempts as failedLoginAttempts,
          u.LockedOutUntil as lockedOutUntil,
          u.MFAEnabled as mfaEnabled,
          u.CreatedDate as createdDate,
          u.UpdatedDate as updatedDate,
          u.CreatedBy as createdBy,
          u.UpdatedBy as updatedBy,
          (SELECT COUNT(*) FROM dbo.ShareEvent se WHERE se.UserID = u.UserID) as totalShares,
          (SELECT COUNT(*) FROM dbo.Contact c WHERE c.UserID = u.UserID) as totalContacts,
          (SELECT COUNT(*) FROM dbo.FollowUpTask ft WHERE ft.UserID = u.UserID) as totalFollowUps
        FROM dbo.[User] u
        LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Market m ON u.MarketID = m.MarketID
        LEFT JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
        WHERE ${whereClause}
        ORDER BY ${orderByClause}
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, params);

      // Add engagement rate to stats
      const usersWithStats = users.map(user => ({
        ...user,
        stats: {
          totalShares: user.totalShares || 0,
          totalContacts: user.totalContacts || 0,
          totalFollowUps: user.totalFollowUps || 0,
          engagementRate: user.totalShares > 0 ? ((user.totalFollowUps / user.totalShares) * 100) : 0
        }
      }));

      return {
        data: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new Error('Failed to retrieve users');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<UserDetails | null> {
    try {
      const users = await query<any>(`
        SELECT
          u.UserID as userId,
          u.MemberID as memberId,
          u.Email as email,
          u.FirstName as firstName,
          u.LastName as lastName,
          u.Mobile as mobile,
          u.RoleID as roleId,
          r.RoleName as roleName,
          u.MarketID as marketId,
          m.MarketName as marketName,
          m.MarketCode as marketCode,
          u.PreferredLanguageID as preferredLanguageId,
          l.LanguageName as languageName,
          u.Status as status,
          u.EmailVerified as emailVerified,
          u.MobileVerified as mobileVerified,
          u.LastLoginDate as lastLoginDate,
          u.LastActivityDate as lastActivityDate,
          u.ProfileImageURL as profileImageURL,
          u.TimeZone as timeZone,
          u.ExternalAuthProvider as externalAuthProvider,
          u.FailedLoginAttempts as failedLoginAttempts,
          u.LockedOutUntil as lockedOutUntil,
          u.MFAEnabled as mfaEnabled,
          u.CreatedDate as createdDate,
          u.UpdatedDate as updatedDate,
          u.CreatedBy as createdBy,
          u.UpdatedBy as updatedBy,
          (SELECT COUNT(*) FROM dbo.ShareEvent se WHERE se.UserID = u.UserID) as totalShares,
          (SELECT COUNT(*) FROM dbo.Contact c WHERE c.UserID = u.UserID) as totalContacts,
          (SELECT COUNT(*) FROM dbo.FollowUpTask ft WHERE ft.UserID = u.UserID) as totalFollowUps
        FROM dbo.[User] u
        LEFT JOIN dbo.Role r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Market m ON u.MarketID = m.MarketID
        LEFT JOIN dbo.Language l ON u.PreferredLanguageID = l.LanguageID
        WHERE u.UserID = @userId
      `, { userId });

      if (users.length === 0) {
        return null;
      }

      const user = users[0];
      return {
        ...user,
        stats: {
          totalShares: user.totalShares || 0,
          totalContacts: user.totalContacts || 0,
          totalFollowUps: user.totalFollowUps || 0,
          engagementRate: user.totalShares > 0 ? ((user.totalFollowUps / user.totalShares) * 100) : 0
        }
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * Create new user
   */
  async createUser(
    userData: CreateUserRequest,
    createdBy: number,
    createdByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const result = await query<{ UserID: number }>(`
        INSERT INTO dbo.[User] (
          MemberID,
          Email,
          FirstName,
          LastName,
          Mobile,
          RoleID,
          MarketID,
          PreferredLanguageID,
          PasswordHash,
          Status,
          TimeZone,
          CreatedBy,
          UpdatedBy
        )
        VALUES (
          @memberId,
          @email,
          @firstName,
          @lastName,
          @mobile,
          @roleId,
          @marketId,
          @preferredLanguageId,
          @passwordHash,
          'Active',
          @timeZone,
          @createdBy,
          @createdBy
        );
        SELECT SCOPE_IDENTITY() as UserID;
      `, {
        memberId: userData.memberId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        mobile: userData.mobile || null,
        roleId: userData.roleId,
        marketId: userData.marketId,
        preferredLanguageId: userData.preferredLanguageId,
        passwordHash,
        timeZone: userData.timeZone || null,
        createdBy
      });

      const userId = result[0].UserID;

      // Log audit
      await auditLogService.logUserAction(
        'UserCreated',
        createdBy,
        createdByEmail,
        userId,
        `User created: ${userData.email}`,
        null,
        { email: userData.email, role: userData.roleId },
        ipAddress,
        userAgent
      );

      logger.info(`User created: ${userId} - ${userData.email}`);

      // Return created user
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error: any) {
      logger.error('Error creating user:', error);

      if (error.message?.includes('UNIQUE KEY')) {
        if (error.message.includes('Email')) {
          throw new Error('Email already exists');
        }
        if (error.message.includes('MemberID')) {
          throw new Error('Member ID already exists');
        }
      }

      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: number,
    updates: UpdateUserRequest,
    updatedBy: number,
    updatedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      // Get current user data for audit
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Build update query
      const updateFields: string[] = [];
      const params: any = { userId, updatedBy };

      if (updates.email !== undefined) {
        updateFields.push('Email = @email');
        params.email = updates.email;
      }

      if (updates.firstName !== undefined) {
        updateFields.push('FirstName = @firstName');
        params.firstName = updates.firstName;
      }

      if (updates.lastName !== undefined) {
        updateFields.push('LastName = @lastName');
        params.lastName = updates.lastName;
      }

      if (updates.mobile !== undefined) {
        updateFields.push('Mobile = @mobile');
        params.mobile = updates.mobile;
      }

      if (updates.roleId !== undefined) {
        updateFields.push('RoleID = @roleId');
        params.roleId = updates.roleId;
      }

      if (updates.marketId !== undefined) {
        updateFields.push('MarketID = @marketId');
        params.marketId = updates.marketId;
      }

      if (updates.preferredLanguageId !== undefined) {
        updateFields.push('PreferredLanguageID = @preferredLanguageId');
        params.preferredLanguageId = updates.preferredLanguageId;
      }

      if (updates.status !== undefined) {
        updateFields.push('Status = @status');
        params.status = updates.status;
      }

      if (updates.timeZone !== undefined) {
        updateFields.push('TimeZone = @timeZone');
        params.timeZone = updates.timeZone;
      }

      if (updates.profileImageURL !== undefined) {
        updateFields.push('ProfileImageURL = @profileImageURL');
        params.profileImageURL = updates.profileImageURL;
      }

      updateFields.push('UpdatedBy = @updatedBy');
      updateFields.push('UpdatedDate = SYSDATETIME()');

      if (updateFields.length === 2) { // Only UpdatedBy and UpdatedDate
        throw new Error('No fields to update');
      }

      // Execute update
      await query(`
        UPDATE dbo.[User]
        SET ${updateFields.join(', ')}
        WHERE UserID = @userId
      `, params);

      // Log audit
      await auditLogService.logUserAction(
        'UserUpdated',
        updatedBy,
        updatedByEmail,
        userId,
        `User updated: ${currentUser.email}`,
        { ...currentUser },
        { ...updates },
        ipAddress,
        userAgent
      );

      logger.info(`User updated: ${userId}`);

      // Return updated user
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Failed to retrieve updated user');
      }

      return user;
    } catch (error: any) {
      logger.error('Error updating user:', error);

      if (error.message?.includes('UNIQUE KEY')) {
        if (error.message.includes('Email')) {
          throw new Error('Email already exists');
        }
      }

      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(
    userId: number,
    deletedBy: number,
    deletedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Prevent self-deletion
      if (userId === deletedBy) {
        throw new Error('Cannot delete your own account');
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete by setting status to Inactive
      await query(`
        UPDATE dbo.[User]
        SET Status = 'Inactive',
            UpdatedBy = @deletedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, deletedBy });

      // Log audit
      await auditLogService.logUserAction(
        'UserDeleted',
        deletedBy,
        deletedByEmail,
        userId,
        `User deleted: ${user.email}`,
        { status: user.status },
        { status: 'Inactive' },
        ipAddress,
        userAgent
      );

      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(
    userId: number,
    activatedBy: number,
    activatedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await query(`
        UPDATE dbo.[User]
        SET Status = 'Active',
            UpdatedBy = @activatedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, activatedBy });

      // Log audit
      await auditLogService.logUserAction(
        'UserActivated',
        activatedBy,
        activatedByEmail,
        userId,
        `User activated: ${user.email}`,
        { status: user.status },
        { status: 'Active' },
        ipAddress,
        userAgent
      );

      logger.info(`User activated: ${userId}`);

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve activated user');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(
    userId: number,
    deactivatedBy: number,
    deactivatedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      // Prevent self-deactivation
      if (userId === deactivatedBy) {
        throw new Error('Cannot deactivate your own account');
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await query(`
        UPDATE dbo.[User]
        SET Status = 'Inactive',
            UpdatedBy = @deactivatedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, deactivatedBy });

      // Log audit
      await auditLogService.logUserAction(
        'UserDeactivated',
        deactivatedBy,
        deactivatedByEmail,
        userId,
        `User deactivated: ${user.email}`,
        { status: user.status },
        { status: 'Inactive' },
        ipAddress,
        userAgent
      );

      logger.info(`User deactivated: ${userId}`);

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve deactivated user');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: number,
    roleId: number,
    assignedBy: number,
    assignedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      // Prevent self-role-change to lower permission level
      if (userId === assignedBy) {
        const currentUser = await this.getUserById(userId);
        const currentRole = await query<{ PermissionLevel: number }>(`
          SELECT PermissionLevel FROM dbo.Role WHERE RoleID = @roleId
        `, { roleId: currentUser?.roleId });

        const newRole = await query<{ PermissionLevel: number }>(`
          SELECT PermissionLevel FROM dbo.Role WHERE RoleID = @roleId
        `, { roleId });

        if (newRole[0]?.PermissionLevel < currentRole[0]?.PermissionLevel) {
          throw new Error('Cannot downgrade your own role');
        }
      }

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify role exists
      const roles = await query<{ RoleID: number }>(`
        SELECT RoleID FROM dbo.Role WHERE RoleID = @roleId AND IsActive = 1
      `, { roleId });

      if (roles.length === 0) {
        throw new Error('Role not found or inactive');
      }

      await query(`
        UPDATE dbo.[User]
        SET RoleID = @roleId,
            UpdatedBy = @assignedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, roleId, assignedBy });

      // Log audit
      await auditLogService.logUserAction(
        'RoleAssigned',
        assignedBy,
        assignedByEmail,
        userId,
        `Role changed for: ${user.email}`,
        { roleId: user.roleId, roleName: user.roleName },
        { roleId },
        ipAddress,
        userAgent
      );

      logger.info(`Role assigned: ${userId} -> Role ${roleId}`);

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Assign market to user
   */
  async assignMarket(
    userId: number,
    marketId: number,
    assignedBy: number,
    assignedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserDetails> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify market exists
      const markets = await query<{ MarketID: number }>(`
        SELECT MarketID FROM dbo.Market WHERE MarketID = @marketId AND IsActive = 1
      `, { marketId });

      if (markets.length === 0) {
        throw new Error('Market not found or inactive');
      }

      await query(`
        UPDATE dbo.[User]
        SET MarketID = @marketId,
            UpdatedBy = @assignedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, marketId, assignedBy });

      // Log audit
      await auditLogService.logUserAction(
        'MarketAssigned',
        assignedBy,
        assignedByEmail,
        userId,
        `Market changed for: ${user.email}`,
        { marketId: user.marketId, marketName: user.marketName },
        { marketId },
        ipAddress,
        userAgent
      );

      logger.info(`Market assigned: ${userId} -> Market ${marketId}`);

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error assigning market:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetUserPassword(
    userId: number,
    resetBy: number,
    resetByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PasswordResetResponse> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      await query(`
        UPDATE dbo.[User]
        SET PasswordHash = @passwordHash,
            UpdatedBy = @resetBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID = @userId
      `, { userId, passwordHash, resetBy });

      // Log audit
      await auditLogService.logUserAction(
        'PasswordReset',
        resetBy,
        resetByEmail,
        userId,
        `Password reset for: ${user.email}`,
        null,
        null,
        ipAddress,
        userAgent
      );

      logger.info(`Password reset: ${userId}`);

      return {
        success: true,
        message: 'Password reset successfully',
        resetToken: tempPassword,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: number,
    days: number = 30
  ): Promise<UserActivityEvent[]> {
    try {
      const activities = await query<any>(`
        SELECT
          Action as eventType,
          EventDate as eventDate,
          Description as description,
          EntityType as entityType,
          EntityID as entityId
        FROM dbo.AuditLog
        WHERE UserID = @userId
          AND EventDate >= DATEADD(day, -@days, SYSDATETIME())
        ORDER BY EventDate DESC
      `, { userId, days });

      return activities;
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw new Error('Failed to retrieve user activity');
    }
  }

  /**
   * Bulk update user status
   */
  async bulkUpdateStatus(
    userIds: number[],
    status: 'Active' | 'Inactive',
    updatedBy: number,
    updatedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<number> {
    try {
      // Prevent self-deactivation
      if (status === 'Inactive' && userIds.includes(updatedBy)) {
        throw new Error('Cannot deactivate your own account');
      }

      const userIdsParam = userIds.join(',');

      const result = await query<{ Updated: number }>(`
        UPDATE dbo.[User]
        SET Status = @status,
            UpdatedBy = @updatedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID IN (${userIdsParam});
        SELECT @@ROWCOUNT as Updated;
      `, { status, updatedBy });

      const updated = result[0]?.Updated || 0;

      // Log audit
      await auditLogService.logUserAction(
        'BulkStatusUpdate',
        updatedBy,
        updatedByEmail,
        undefined,
        `Bulk status update: ${updated} users set to ${status}`,
        null,
        { userIds, status },
        ipAddress,
        userAgent
      );

      logger.info(`Bulk status update: ${updated} users set to ${status}`);

      return updated;
    } catch (error) {
      logger.error('Error bulk updating status:', error);
      throw error;
    }
  }

  /**
   * Bulk assign role
   */
  async bulkAssignRole(
    userIds: number[],
    roleId: number,
    assignedBy: number,
    assignedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<number> {
    try {
      // Verify role exists
      const roles = await query<{ RoleID: number, PermissionLevel: number }>(`
        SELECT RoleID, PermissionLevel FROM dbo.Role WHERE RoleID = @roleId AND IsActive = 1
      `, { roleId });

      if (roles.length === 0) {
        throw new Error('Role not found or inactive');
      }

      // Prevent self-role-downgrade
      if (userIds.includes(assignedBy)) {
        const currentUser = await this.getUserById(assignedBy);
        const currentRole = await query<{ PermissionLevel: number }>(`
          SELECT PermissionLevel FROM dbo.Role WHERE RoleID = @roleId
        `, { roleId: currentUser?.roleId });

        if (roles[0].PermissionLevel < currentRole[0]?.PermissionLevel) {
          throw new Error('Cannot downgrade your own role');
        }
      }

      const userIdsParam = userIds.join(',');

      const result = await query<{ Updated: number }>(`
        UPDATE dbo.[User]
        SET RoleID = @roleId,
            UpdatedBy = @assignedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID IN (${userIdsParam});
        SELECT @@ROWCOUNT as Updated;
      `, { roleId, assignedBy });

      const updated = result[0]?.Updated || 0;

      // Log audit
      await auditLogService.logUserAction(
        'BulkRoleAssignment',
        assignedBy,
        assignedByEmail,
        undefined,
        `Bulk role assignment: ${updated} users assigned to role ${roleId}`,
        null,
        { userIds, roleId },
        ipAddress,
        userAgent
      );

      logger.info(`Bulk role assignment: ${updated} users assigned to role ${roleId}`);

      return updated;
    } catch (error) {
      logger.error('Error bulk assigning role:', error);
      throw error;
    }
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(
    userIds: number[],
    deletedBy: number,
    deletedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<number> {
    try {
      // Prevent self-deletion
      if (userIds.includes(deletedBy)) {
        throw new Error('Cannot delete your own account');
      }

      const userIdsParam = userIds.join(',');

      const result = await query<{ Deleted: number }>(`
        UPDATE dbo.[User]
        SET Status = 'Inactive',
            UpdatedBy = @deletedBy,
            UpdatedDate = SYSDATETIME()
        WHERE UserID IN (${userIdsParam});
        SELECT @@ROWCOUNT as Deleted;
      `, { deletedBy });

      const deleted = result[0]?.Deleted || 0;

      // Log audit
      await auditLogService.logUserAction(
        'BulkUserDelete',
        deletedBy,
        deletedByEmail,
        undefined,
        `Bulk delete: ${deleted} users deleted`,
        null,
        { userIds },
        ipAddress,
        userAgent
      );

      logger.info(`Bulk delete: ${deleted} users deleted`);

      return deleted;
    } catch (error) {
      logger.error('Error bulk deleting users:', error);
      throw error;
    }
  }
}

export default new UserManagementService();
