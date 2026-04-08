/**
 * Role Management Controller
 * Handles HTTP requests for role management operations
 */

import { Request, Response } from 'express';
import roleManagementService from '../services/role-management.service.js';
import { createLogger } from '../utils/logger.js';
import {
  createRoleSchema,
  updateRoleSchema
} from '../validation/user-management.validation.js';

const logger = createLogger('RoleManagementController');

/**
 * Get all roles
 */
export async function getAllRoles(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await roleManagementService.getAllRoles();

    res.json({
      success: true,
      data: roles
    });
  } catch (error: any) {
    logger.error('Error getting all roles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve roles'
    });
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(req: Request, res: Response): Promise<void> {
  try {
    const roleId = Number(req.params.id);

    if (isNaN(roleId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid role ID'
      });
      return;
    }

    const role = await roleManagementService.getRoleById(roleId);

    if (!role) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Role not found'
      });
      return;
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error: any) {
    logger.error('Error getting role by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve role'
    });
  }
}

/**
 * Create new role (SuperAdmin only)
 */
export async function createRole(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = createRoleSchema.parse(req.body);
    const currentUser = (req as any).user;

    const role = await roleManagementService.createRole(
      validatedData,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error: any) {
    logger.error('Error creating role:', error);

    if (error.message === 'Role name already exists') {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to create role'
    });
  }
}

/**
 * Update role
 */
export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const roleId = Number(req.params.id);

    if (isNaN(roleId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid role ID'
      });
      return;
    }

    const validatedData = updateRoleSchema.parse(req.body);
    const currentUser = (req as any).user;

    const role = await roleManagementService.updateRole(
      roleId,
      validatedData,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error: any) {
    logger.error('Error updating role:', error);

    if (error.message === 'Role not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot modify default system roles') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    if (error.message === 'Role name already exists') {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to update role'
    });
  }
}

/**
 * Delete role
 */
export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const roleId = Number(req.params.id);

    if (isNaN(roleId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid role ID'
      });
      return;
    }

    const currentUser = (req as any).user;

    await roleManagementService.deleteRole(
      roleId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting role:', error);

    if (error.message === 'Role not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot delete default system roles') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    if (error.message?.includes('users are assigned to this role')) {
      res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete role'
    });
  }
}

/**
 * Get active roles only
 */
export async function getActiveRoles(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await roleManagementService.getActiveRoles();

    res.json({
      success: true,
      data: roles
    });
  } catch (error: any) {
    logger.error('Error getting active roles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve active roles'
    });
  }
}
