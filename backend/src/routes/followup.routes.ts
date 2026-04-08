import { Router } from 'express';
import followupController from '../controllers/followup.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Special endpoints (must come before /:id routes)
router.get('/upcoming', followupController.getUpcomingFollowUps.bind(followupController));
router.get('/overdue', followupController.getOverdueFollowUps.bind(followupController));
router.get('/templates', followupController.getFollowUpTemplates.bind(followupController));
router.get('/stats', followupController.getFollowUpStats.bind(followupController));
router.post('/apply-template', followupController.applyTemplate.bind(followupController));

// Standard CRUD routes
router.post('/', followupController.createFollowUp.bind(followupController));
router.get('/', followupController.getFollowUps.bind(followupController));
router.get('/:id', followupController.getFollowUp.bind(followupController));
router.put('/:id', followupController.updateFollowUp.bind(followupController));
router.delete('/:id', followupController.deleteFollowUp.bind(followupController));

// Follow-up actions
router.post('/:id/complete', followupController.completeFollowUp.bind(followupController));
router.post('/:id/snooze', followupController.snoozeFollowUp.bind(followupController));

export default router;
