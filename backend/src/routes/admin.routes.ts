/**
 * Admin Routes
 * Protected routes for admin dashboard and system management
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
  getSystemMetrics,
  getRecentActivity,
  getSystemHealth,
  getUserGrowth,
  getContentGrowth,
  getShareTrends,
  getEngagementMetrics
} from '../controllers/admin-dashboard.controller.js';
import settingsController from '../controllers/settings.controller.js';
import contentModerationController from '../controllers/content-moderation.controller.js';
import contentController from '../controllers/content.controller.js';
import userManagementRoutes from './user-management.routes.js';
import roleManagementRoutes from './role-management.routes.js';
import auditLogRoutes from './audit-log.routes.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Dashboard routes
 */

// GET /api/v1/admin/dashboard/metrics - Get system metrics
router.get('/dashboard/metrics', getSystemMetrics);

// GET /api/v1/admin/dashboard/activity - Get recent activity (paginated)
router.get('/dashboard/activity', getRecentActivity);

// GET /api/v1/admin/dashboard/health - Get system health
router.get('/dashboard/health', getSystemHealth);

// GET /api/v1/admin/dashboard/growth/users - User growth trends
router.get('/dashboard/growth/users', getUserGrowth);

// GET /api/v1/admin/dashboard/growth/content - Content growth trends
router.get('/dashboard/growth/content', getContentGrowth);

// GET /api/v1/admin/dashboard/growth/shares - Share trends
router.get('/dashboard/growth/shares', getShareTrends);

// GET /api/v1/admin/dashboard/engagement - Engagement metrics
router.get('/dashboard/engagement', getEngagementMetrics);

/**
 * System Settings routes
 */

// GET /api/v1/admin/settings - Get all settings
router.get('/settings', settingsController.getAllSettings);

// GET /api/v1/admin/settings/grouped - Get settings grouped by category
router.get('/settings/grouped', settingsController.getSettingsByCategory);

// GET /api/v1/admin/settings/:category - Get settings for a category
router.get('/settings/:category', settingsController.getCategorySettings);

// PUT /api/v1/admin/settings/:key - Update a single setting
router.put('/settings/:key', settingsController.updateSetting);

// PUT /api/v1/admin/settings/bulk - Bulk update settings
router.put('/settings/bulk', settingsController.bulkUpdateSettings);

// POST /api/v1/admin/settings/reset - Reset settings to defaults
router.post('/settings/reset', settingsController.resetToDefaults);

/**
 * Feature Flag routes
 */

// GET /api/v1/admin/feature-flags - Get all feature flags
router.get('/feature-flags', settingsController.getFeatureFlags);

// PUT /api/v1/admin/feature-flags/:feature - Toggle a feature flag
router.put('/feature-flags/:feature', settingsController.toggleFeatureFlag);

/**
 * Maintenance Mode routes
 */

// GET /api/v1/admin/maintenance - Get maintenance mode status
router.get('/maintenance', settingsController.getMaintenanceStatus);

// POST /api/v1/admin/maintenance/enable - Enable maintenance mode
router.post('/maintenance/enable', settingsController.enableMaintenance);

// POST /api/v1/admin/maintenance/disable - Disable maintenance mode
router.post('/maintenance/disable', settingsController.disableMaintenance);

/**
 * Content Moderation routes
 */

// GET /api/v1/admin/content/pending - Get content pending approval
router.get('/content/pending', contentModerationController.getPendingContent);

// GET /api/v1/admin/content/all - Get all content with moderation info
router.get('/content/all', contentModerationController.getAllContent);

// GET /api/v1/admin/content/featured - Get featured content
router.get('/content/featured', contentModerationController.getFeaturedContent);

// POST /api/v1/admin/content/:id/approve - Approve content
router.post('/content/:id/approve', contentModerationController.approveContent);

// POST /api/v1/admin/content/:id/reject - Reject content
router.post('/content/:id/reject', contentModerationController.rejectContent);

// POST /api/v1/admin/content/:id/feature - Feature content
router.post('/content/:id/feature', contentModerationController.featureContent);

// POST /api/v1/admin/content/:id/unfeature - Unfeature content
router.post('/content/:id/unfeature', contentModerationController.unfeatureContent);

// POST /api/v1/admin/content/bulk/approve - Bulk approve content
router.post('/content/bulk/approve', contentModerationController.bulkApprove);

// POST /api/v1/admin/content/bulk/reject - Bulk reject content
router.post('/content/bulk/reject', contentModerationController.bulkReject);

/**
 * Category Management routes
 */

// GET /api/v1/admin/categories - Get all categories (including inactive)
router.get('/categories', contentController.getAllCategories.bind(contentController));

// POST /api/v1/admin/categories - Create a category
router.post('/categories', contentController.createCategory.bind(contentController));

// PUT /api/v1/admin/categories/:id - Update a category
router.put('/categories/:id', contentController.updateCategory.bind(contentController));

// DELETE /api/v1/admin/categories/:id - Delete a category
router.delete('/categories/:id', contentController.deleteCategory.bind(contentController));

/**
 * User Management routes
 */
router.use('/users', userManagementRoutes);

/**
 * Role Management routes
 */
router.use('/roles', roleManagementRoutes);

/**
 * Audit Log routes
 */
router.use('/audit-logs', auditLogRoutes);

export default router;
