/**
 * Role Management Routes
 * Routes for role management operations
 */

import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import * as roleManagementController from '../controllers/role-management.controller.js';

const router = Router();

// Note: Authentication is handled by parent admin router

/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles
 * @access  CorporateAdmin, SuperAdmin
 */
router.get('/', roleManagementController.getAllRoles);

/**
 * @route   GET /api/v1/admin/roles/active
 * @desc    Get active roles only
 * @access  CorporateAdmin, SuperAdmin
 */
router.get('/active', roleManagementController.getActiveRoles);

/**
 * @route   GET /api/v1/admin/roles/:id
 * @desc    Get role by ID
 * @access  CorporateAdmin, SuperAdmin
 */
router.get('/:id', roleManagementController.getRoleById);

/**
 * @route   POST /api/v1/admin/roles
 * @desc    Create new role (SuperAdmin only)
 * @access  SuperAdmin
 * @body    { roleName, roleDescription?, permissionLevel }
 */
router.post('/', authorize('SuperAdmin'), roleManagementController.createRole);

/**
 * @route   PUT /api/v1/admin/roles/:id
 * @desc    Update role (SuperAdmin only)
 * @access  SuperAdmin
 * @body    { roleName?, roleDescription?, permissionLevel?, isActive? }
 */
router.put('/:id', authorize('SuperAdmin'), roleManagementController.updateRole);

/**
 * @route   DELETE /api/v1/admin/roles/:id
 * @desc    Delete role (SuperAdmin only)
 * @access  SuperAdmin
 */
router.delete('/:id', authorize('SuperAdmin'), roleManagementController.deleteRole);

export default router;
