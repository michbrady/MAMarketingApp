import express from 'express';
import settingsController from '../controllers/settings.controller.js';
import contentModerationController from '../controllers/content-moderation.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All settings routes require authentication and SuperAdmin role
router.use(authenticate);
router.use(authorize('SuperAdmin'));

// System Settings Routes
router.get('/settings', settingsController.getAllSettings);
router.get('/settings/grouped', settingsController.getSettingsByCategory);
router.get('/settings/:category', settingsController.getCategorySettings);
router.put('/settings/:key', settingsController.updateSetting);
router.put('/settings/bulk', settingsController.bulkUpdateSettings);
router.post('/settings/reset', settingsController.resetToDefaults);

// Feature Flag Routes
router.get('/feature-flags', settingsController.getFeatureFlags);
router.put('/feature-flags/:feature', settingsController.toggleFeatureFlag);

// Maintenance Mode Routes
router.get('/maintenance', settingsController.getMaintenanceStatus);
router.post('/maintenance/enable', settingsController.enableMaintenance);
router.post('/maintenance/disable', settingsController.disableMaintenance);

// Content Moderation Routes
router.get('/content/pending', contentModerationController.getPendingContent);
router.get('/content/all', contentModerationController.getAllContent);
router.get('/content/featured', contentModerationController.getFeaturedContent);
router.post('/content/:id/approve', contentModerationController.approveContent);
router.post('/content/:id/reject', contentModerationController.rejectContent);
router.post('/content/:id/feature', contentModerationController.featureContent);
router.post('/content/:id/unfeature', contentModerationController.unfeatureContent);
router.post('/content/bulk/approve', contentModerationController.bulkApprove);
router.post('/content/bulk/reject', contentModerationController.bulkReject);

export default router;
