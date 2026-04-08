/**
 * User Management Controller
 * Handles HTTP requests for user management operations
 */

import { Request, Response } from 'express';
import userManagementService from '../services/user-management.service.js';
import { createLogger } from '../utils/logger.js';
import {
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  assignRoleSchema,
  assignMarketSchema,
  bulkUpdateStatusSchema,
  bulkAssignRoleSchema,
  bulkDeleteSchema,
  userActivitySchema
} from '../validation/user-management.validation.js';

const logger = createLogger('UserManagementController');

/**
 * Get all users
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    logger.info('getAllUsers called');
    logger.info('Query params:', req.query);

    // Validate and parse query parameters
    const validatedQuery = userFiltersSchema.parse({
      roleId: req.query.roleId ? Number(req.query.roleId) : undefined,
      role: req.query.role as string | undefined,
      marketId: req.query.marketId ? Number(req.query.marketId) : undefined,
      market: req.query.market as string | undefined,
      status: req.query.status,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50
    });

    const { page, limit, dateFrom, dateTo, ...filters } = validatedQuery;

    // Convert date strings to Date objects if provided
    const parsedFilters = {
      ...filters,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    };

    logger.info('Calling service with filters:', parsedFilters);

    const result = await userManagementService.getAllUsers(
      parsedFilters,
      { page: page || 1, limit: limit || 50 }
    );

    logger.info(`Service returned ${result.data.length} users, total: ${result.pagination.total}`);

    // Map backend format to frontend format
    const mappedUsers = result.data.map((user: any) => ({
      id: user.userId.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.roleName,
      market: user.marketName,
      status: user.status,
      lastLogin: user.lastLoginDate,
      createdDate: user.createdDate
    }));

    logger.info(`Mapped ${mappedUsers.length} users`);

    res.json({
      success: true,
      data: {
        users: mappedUsers,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error: any) {
    logger.error('Error getting all users:', error);
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to retrieve users'
    });
  }
}

/**
 * Get user by ID
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const user = await userManagementService.getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    logger.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to retrieve user'
    });
  }
}

/**
 * Create new user
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const currentUser = (req as any).user;

    const user = await userManagementService.createUser(
      validatedData,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error creating user:', error);

    if (error.message?.includes('already exists')) {
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
      message: error.message || 'Failed to create user'
    });
  }
}

/**
 * Update user
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const validatedData = updateUserSchema.parse(req.body);
    const currentUser = (req as any).user;

    const user = await userManagementService.updateUser(
      userId,
      validatedData,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error updating user:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message?.includes('already exists')) {
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
      message: error.message || 'Failed to update user'
    });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const currentUser = (req as any).user;

    await userManagementService.deleteUser(
      userId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting user:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot delete your own account') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete user'
    });
  }
}

/**
 * Activate user
 */
export async function activateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const currentUser = (req as any).user;

    const user = await userManagementService.activateUser(
      userId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'User activated successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error activating user:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to activate user'
    });
  }
}

/**
 * Deactivate user
 */
export async function deactivateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const currentUser = (req as any).user;

    const user = await userManagementService.deactivateUser(
      userId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error deactivating user:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot deactivate your own account') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to deactivate user'
    });
  }
}

/**
 * Assign role to user
 */
export async function assignRole(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const validatedData = assignRoleSchema.parse(req.body);
    const currentUser = (req as any).user;

    const user = await userManagementService.assignRole(
      userId,
      validatedData.roleId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Role assigned successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error assigning role:', error);

    if (error.message === 'User not found' || error.message === 'Role not found or inactive') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot downgrade your own role') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to assign role'
    });
  }
}

/**
 * Assign market to user
 */
export async function assignMarket(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const validatedData = assignMarketSchema.parse(req.body);
    const currentUser = (req as any).user;

    const user = await userManagementService.assignMarket(
      userId,
      validatedData.marketId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Market assigned successfully',
      data: user
    });
  } catch (error: any) {
    logger.error('Error assigning market:', error);

    if (error.message === 'User not found' || error.message === 'Market not found or inactive') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to assign market'
    });
  }
}

/**
 * Reset user password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const currentUser = (req as any).user;

    const result = await userManagementService.resetUserPassword(
      userId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        temporaryPassword: result.resetToken,
        expiresAt: result.expiresAt
      }
    });
  } catch (error: any) {
    logger.error('Error resetting password:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to reset password'
    });
  }
}

/**
 * Get user activity
 */
export async function getUserActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid user ID'
      });
      return;
    }

    const validatedQuery = userActivitySchema.parse({
      days: req.query.days ? Number(req.query.days) : 30
    });

    const activities = await userManagementService.getUserActivity(
      userId,
      validatedQuery.days
    );

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    logger.error('Error getting user activity:', error);
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to retrieve user activity'
    });
  }
}

/**
 * Bulk update user status
 */
export async function bulkUpdateStatus(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = bulkUpdateStatusSchema.parse(req.body);
    const currentUser = (req as any).user;

    const updated = await userManagementService.bulkUpdateStatus(
      validatedData.userIds,
      validatedData.status,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: `${updated} users updated successfully`,
      data: {
        updated
      }
    });
  } catch (error: any) {
    logger.error('Error bulk updating status:', error);

    if (error.message === 'Cannot deactivate your own account') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to update users'
    });
  }
}

/**
 * Bulk assign role
 */
export async function bulkAssignRole(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = bulkAssignRoleSchema.parse(req.body);
    const currentUser = (req as any).user;

    const updated = await userManagementService.bulkAssignRole(
      validatedData.userIds,
      validatedData.roleId,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: `${updated} users updated successfully`,
      data: {
        updated
      }
    });
  } catch (error: any) {
    logger.error('Error bulk assigning role:', error);

    if (error.message === 'Role not found or inactive') {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
      return;
    }

    if (error.message === 'Cannot downgrade your own role') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to assign role to users'
    });
  }
}

/**
 * Bulk delete users
 */
export async function bulkDelete(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = bulkDeleteSchema.parse(req.body);
    const currentUser = (req as any).user;

    const deleted = await userManagementService.bulkDelete(
      validatedData.userIds,
      currentUser.userId,
      currentUser.email,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: `${deleted} users deleted successfully`,
      data: {
        deleted
      }
    });
  } catch (error: any) {
    logger.error('Error bulk deleting users:', error);

    if (error.message === 'Cannot delete your own account') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to delete users'
    });
  }
}
