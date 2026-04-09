import { Router } from 'express';
import localeController from '../controllers/locale.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes - Get available locales for a market
router.get('/markets/:marketCode', (req, res) => localeController.getMarketLocales(req, res));

// Protected routes - Update user's preferred locale
router.put('/user', authenticate, (req, res) => localeController.updateUserLocale(req, res));

export default router;
