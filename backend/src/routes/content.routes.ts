import { Router } from 'express';
import contentController from '../controllers/content.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (browsing content)
router.get('/featured', (req, res) => contentController.getFeaturedContent(req, res));
router.get('/recent', (req, res) => contentController.getRecentContent(req, res));
router.get('/search', (req, res) => contentController.searchContent(req, res));
router.get('/categories', (req, res) => contentController.getCategories(req, res));
router.get('/:id', (req, res) => contentController.getContent(req, res));
router.get('/', (req, res) => contentController.listContent(req, res));

// Protected routes (admin only)
router.post('/', authenticate, authorize('Admin', 'CorporateAdmin', 'SuperAdmin'), (req, res) =>
  contentController.createContent(req, res)
);

router.put('/:id', authenticate, authorize('Admin', 'CorporateAdmin', 'SuperAdmin'), (req, res) =>
  contentController.updateContent(req, res)
);

router.delete('/:id', authenticate, authorize('Admin', 'CorporateAdmin', 'SuperAdmin'), (req, res) =>
  contentController.deleteContent(req, res)
);

export default router;
