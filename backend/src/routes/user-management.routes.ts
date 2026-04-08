/**
 * User Management Routes
 * Routes for user management operations (admin only)
 */

import { Router } from 'express';
import * as userManagementController from '../controllers/user-management.controller.js';

const router = Router();

// Note: Authentication is handled by parent admin router
// These routes are already protected by authenticate and requireAdmin middleware

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  CorporateAdmin, SuperAdmin
 * @query   roleId, marketId, status, search, dateFrom, dateTo, sortBy, sortOrder, page, limit
 */
router.get('/', userManagementController.getAllUsers);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  CorporateAdmin, SuperAdmin
 */
router.get('/:id', userManagementController.getUserById);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create new user
 * @access  CorporateAdmin, SuperAdmin
 * @body    { memberId, email, firstName, lastName, password, roleId, marketId, preferredLanguageId, mobile?, timeZone? }
 */
router.post('/', userManagementController.createUser);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  CorporateAdmin, SuperAdmin
 * @body    { email?, firstName?, lastName?, mobile?, roleId?, marketId?, preferredLanguageId?, status?, timeZone?, profileImageURL? }
 */
router.put('/:id', userManagementController.updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  CorporateAdmin, SuperAdmin
 */
router.delete('/:id', userManagementController.deleteUser);

/**
 * @route   POST /api/v1/admin/users/:id/activate
 * @desc    Activate user
 * @access  CorporateAdmin, SuperAdmin
 */
router.post('/:id/activate', userManagementController.activateUser);

/**
 * @route   POST /api/v1/admin/users/:id/deactivate
 * @desc    Deactivate user
 * @access  CorporateAdmin, SuperAdmin
 */
router.post('/:id/deactivate', userManagementController.deactivateUser);

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Assign role to user
 * @access  CorporateAdmin, SuperAdmin
 * @body    { roleId }
 */
router.put('/:id/role', userManagementController.assignRole);

/**
 * @route   PUT /api/v1/admin/users/:id/market
 * @desc    Assign market to user
 * @access  CorporateAdmin, SuperAdmin
 * @body    { marketId }
 */
router.put('/:id/market', userManagementController.assignMarket);

/**
 * @route   POST /api/v1/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  CorporateAdmin, SuperAdmin
 */
router.post('/:id/reset-password', userManagementController.resetPassword);

/**
 * @route   GET /api/v1/admin/users/:id/activity
 * @desc    Get user activity history
 * @access  CorporateAdmin, SuperAdmin
 * @query   days? (default: 30)
 */
router.get('/:id/activity', userManagementController.getUserActivity);

/**
 * @route   POST /api/v1/admin/users/bulk/status
 * @desc    Bulk update user status
 * @access  CorporateAdmin, SuperAdmin
 * @body    { userIds: number[], status: 'Active' | 'Inactive' }
 */
router.post('/bulk/status', userManagementController.bulkUpdateStatus);

/**
 * @route   POST /api/v1/admin/users/bulk/role
 * @desc    Bulk assign role
 * @access  CorporateAdmin, SuperAdmin
 * @body    { userIds: number[], roleId: number }
 */
router.post('/bulk/role', userManagementController.bulkAssignRole);

/**
 * @route   POST /api/v1/admin/users/bulk/delete
 * @desc    Bulk delete users
 * @access  CorporateAdmin, SuperAdmin
 * @body    { userIds: number[] }
 */
router.post('/bulk/delete', userManagementController.bulkDelete);

export default router;
