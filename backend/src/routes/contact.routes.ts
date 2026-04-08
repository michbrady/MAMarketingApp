import { Router } from 'express';
import contactController from '../controllers/contact.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All contact routes require authentication
router.use(authenticate);

// Search contacts (must be before /:id to avoid route conflict)
router.get('/search', (req, res) => contactController.searchContacts(req, res));

// Top engaged contacts (must be before /:id to avoid route conflict)
router.get('/top-engaged', (req, res) => contactController.getTopEngagedContacts(req, res));

// Export contacts
router.get('/export', (req, res) => contactController.exportContacts(req, res));

// Import contacts
router.post('/import', (req, res) => contactController.importContacts(req, res));

// Bulk delete contacts (must be before /:id to avoid route conflict)
router.post('/bulk', (req, res) => contactController.bulkDeleteContacts(req, res));

// Contact CRUD operations
router.post('/', (req, res) => contactController.createContact(req, res));
router.get('/', (req, res) => contactController.listContacts(req, res));
router.get('/:id', (req, res) => contactController.getContact(req, res));
router.put('/:id', (req, res) => contactController.updateContact(req, res));
router.delete('/:id', (req, res) => contactController.deleteContact(req, res));

// Contact tags
router.post('/:id/tags', (req, res) => contactController.addTag(req, res));
router.delete('/:id/tags/:tag', (req, res) => contactController.removeTag(req, res));

// Contact activity
router.get('/:id/activity', (req, res) => contactController.getActivity(req, res));

// Engagement score
router.post('/:id/engagement-score', (req, res) => contactController.updateEngagementScore(req, res));

export default router;
