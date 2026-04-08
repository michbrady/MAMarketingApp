/**
 * Role Management Service
 * Service for managing roles and permissions
 */

import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import auditLogService from './audit-log.service.js';
import {
  RoleDetails,
  CreateRoleRequest,
  UpdateRoleRequest
} from '../types/user-management.types.js';

const logger = createLogger('RoleManagementService');

export class RoleManagementService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<RoleDetails[]> {
    try {
      const roles = await query<any>(`
        SELECT
          r.RoleID as id,
          r.RoleName as name,
          r.RoleDescription as description,
          r.PermissionLevel as permissionLevel,
          r.IsActive as isActive,
          r.CreatedDate as createdDate,
          (SELECT COUNT(*) FROM dbo.[User] u WHERE u.RoleID = r.RoleID) as userCount,
          CASE WHEN r.RoleName IN ('SuperAdmin', 'CorporateAdmin', 'UFO') THEN 1 ELSE 0 END as isSystem
        FROM dbo.Role r
        ORDER BY r.PermissionLevel DESC, r.RoleName ASC
      `);

      // Add permissions array (empty for now - would need separate permissions table)
      return roles.map(role => ({
        ...role,
        isSystem: role.isSystem === 1,
        permissions: []
      }));
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw new Error('Failed to retrieve roles');
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: number): Promise<RoleDetails | null> {
    try {
      const roles = await query<any>(`
        SELECT
          r.RoleID as roleId,
          r.RoleName as roleName,
          r.RoleDescription as roleDescription,
          r.PermissionLevel as permissionLevel,
          r.IsActive as isActive,
          r.CreatedDate as createdDate,
          (SELECT COUNT(*) FROM dbo.[User] u WHERE u.RoleID = r.RoleID) as userCount
        FROM dbo.Role r
        WHERE r.RoleID = @roleId
      `, { roleId });

      if (roles.length === 0) {
        return null;
      }

      return roles[0];
    } catch (error) {
      logger.error('Error getting role by ID:', error);
      throw new Error('Failed to retrieve role');
    }
  }

  /**
   * Create new role (SuperAdmin only)
   */
  async createRole(
    roleData: CreateRoleRequest,
    createdBy: number,
    createdByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RoleDetails> {
    try {
      // Check if role name already exists
      const existing = await query<{ RoleID: number }>(`
        SELECT RoleID FROM dbo.Role WHERE RoleName = @roleName
      `, { roleName: roleData.roleName });

      if (existing.length > 0) {
        throw new Error('Role name already exists');
      }

      const result = await query<{ RoleID: number }>(`
        INSERT INTO dbo.Role (
          RoleName,
          RoleDescription,
          PermissionLevel,
          IsActive
        )
        VALUES (
          @roleName,
          @roleDescription,
          @permissionLevel,
          1
        );
        SELECT SCOPE_IDENTITY() as RoleID;
      `, {
        roleName: roleData.roleName,
        roleDescription: roleData.roleDescription || null,
        permissionLevel: roleData.permissionLevel
      });

      const roleId = result[0].RoleID;

      // Log audit
      await auditLogService.logAction({
        userId: createdBy,
        userEmail: createdByEmail,
        entityType: 'Role',
        entityId: roleId,
        action: 'RoleCreated',
        description: `Role created: ${roleData.roleName}`,
        newValues: roleData,
        ipAddress,
        userAgent,
        complianceFlag: true,
        securityFlag: true
      });

      logger.info(`Role created: ${roleId} - ${roleData.roleName}`);

      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new Error('Failed to retrieve created role');
      }

      return role;
    } catch (error: any) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: number,
    updates: UpdateRoleRequest,
    updatedBy: number,
    updatedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RoleDetails> {
    try {
      const currentRole = await this.getRoleById(roleId);
      if (!currentRole) {
        throw new Error('Role not found');
      }

      // Prevent updating default roles
      const protectedRoles = ['UFO', 'CorporateAdmin', 'SuperAdmin'];
      if (protectedRoles.includes(currentRole.roleName)) {
        throw new Error('Cannot modify default system roles');
      }

      // Build update query
      const updateFields: string[] = [];
      const params: any = { roleId };

      if (updates.roleName !== undefined) {
        // Check if new name already exists
        const existing = await query<{ RoleID: number }>(`
          SELECT RoleID FROM dbo.Role WHERE RoleName = @roleName AND RoleID != @roleId
        `, { roleName: updates.roleName, roleId });

        if (existing.length > 0) {
          throw new Error('Role name already exists');
        }

        updateFields.push('RoleName = @roleName');
        params.roleName = updates.roleName;
      }

      if (updates.roleDescription !== undefined) {
        updateFields.push('RoleDescription = @roleDescription');
        params.roleDescription = updates.roleDescription;
      }

      if (updates.permissionLevel !== undefined) {
        updateFields.push('PermissionLevel = @permissionLevel');
        params.permissionLevel = updates.permissionLevel;
      }

      if (updates.isActive !== undefined) {
        updateFields.push('IsActive = @isActive');
        params.isActive = updates.isActive;
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      await query(`
        UPDATE dbo.Role
        SET ${updateFields.join(', ')}
        WHERE RoleID = @roleId
      `, params);

      // Log audit
      await auditLogService.logAction({
        userId: updatedBy,
        userEmail: updatedByEmail,
        entityType: 'Role',
        entityId: roleId,
        action: 'RoleUpdated',
        description: `Role updated: ${currentRole.roleName}`,
        oldValues: currentRole,
        newValues: updates,
        ipAddress,
        userAgent,
        complianceFlag: true,
        securityFlag: true
      });

      logger.info(`Role updated: ${roleId}`);

      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new Error('Failed to retrieve updated role');
      }

      return role;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(
    roleId: number,
    deletedBy: number,
    deletedByEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deleting default roles
      const protectedRoles = ['UFO', 'CorporateAdmin', 'SuperAdmin'];
      if (protectedRoles.includes(role.roleName)) {
        throw new Error('Cannot delete default system roles');
      }

      // Check if role is in use
      if (role.userCount && role.userCount > 0) {
        throw new Error(`Cannot delete role: ${role.userCount} users are assigned to this role`);
      }

      // Soft delete by setting IsActive to false
      await query(`
        UPDATE dbo.Role
        SET IsActive = 0
        WHERE RoleID = @roleId
      `, { roleId });

      // Log audit
      await auditLogService.logAction({
        userId: deletedBy,
        userEmail: deletedByEmail,
        entityType: 'Role',
        entityId: roleId,
        action: 'RoleDeleted',
        description: `Role deleted: ${role.roleName}`,
        oldValues: role,
        ipAddress,
        userAgent,
        complianceFlag: true,
        securityFlag: true
      });

      logger.info(`Role deleted: ${roleId}`);
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get active roles only
   */
  async getActiveRoles(): Promise<RoleDetails[]> {
    try {
      const roles = await query<any>(`
        SELECT
          r.RoleID as roleId,
          r.RoleName as roleName,
          r.RoleDescription as roleDescription,
          r.PermissionLevel as permissionLevel,
          r.IsActive as isActive,
          r.CreatedDate as createdDate,
          (SELECT COUNT(*) FROM dbo.[User] u WHERE u.RoleID = r.RoleID) as userCount
        FROM dbo.Role r
        WHERE r.IsActive = 1
        ORDER BY r.PermissionLevel DESC, r.RoleName ASC
      `);

      return roles;
    } catch (error) {
      logger.error('Error getting active roles:', error);
      throw new Error('Failed to retrieve active roles');
    }
  }

  /**
   * Check if user has permission level
   */
  async hasPermissionLevel(userId: number, requiredLevel: number): Promise<boolean> {
    try {
      const result = await query<{ PermissionLevel: number }>(`
        SELECT r.PermissionLevel
        FROM dbo.[User] u
        JOIN dbo.Role r ON u.RoleID = r.RoleID
        WHERE u.UserID = @userId AND u.Status = 'Active'
      `, { userId });

      if (result.length === 0) {
        return false;
      }

      return result[0].PermissionLevel >= requiredLevel;
    } catch (error) {
      logger.error('Error checking permission level:', error);
      return false;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName: string): Promise<RoleDetails | null> {
    try {
      const roles = await query<any>(`
        SELECT
          r.RoleID as roleId,
          r.RoleName as roleName,
          r.RoleDescription as roleDescription,
          r.PermissionLevel as permissionLevel,
          r.IsActive as isActive,
          r.CreatedDate as createdDate,
          (SELECT COUNT(*) FROM dbo.[User] u WHERE u.RoleID = r.RoleID) as userCount
        FROM dbo.Role r
        WHERE r.RoleName = @roleName
      `, { roleName });

      if (roles.length === 0) {
        return null;
      }

      return roles[0];
    } catch (error) {
      logger.error('Error getting role by name:', error);
      throw new Error('Failed to retrieve role');
    }
  }
}

export default new RoleManagementService();
