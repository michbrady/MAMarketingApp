import { Router } from 'express';
import sharingController from '../controllers/sharing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/v1/share
 * @desc    Create and log a share event
 * @access  Protected
 */
router.post('/', authenticate, (req, res) => {
  sharingController.createShare(req, res);
});

/**
 * @route   GET /api/v1/share/:trackingCode/track
 * @desc    Track a click and redirect to content
 * @access  Public (no auth required for tracking)
 */
router.get('/:trackingCode/track', (req, res) => {
  sharingController.trackClick(req, res);
});

/**
 * @route   GET /api/v1/share/:trackingCode/preview
 * @desc    Return content metadata for Open Graph tags (no click recorded)
 * @access  Public
 */
router.get('/:trackingCode/preview', (req, res) => {
  sharingController.getPreview(req, res);
});

/**
 * @route   GET /api/v1/share/history
 * @desc    Get user's share history
 * @access  Protected
 */
router.get('/history', authenticate, (req, res) => {
  sharingController.getShareHistory(req, res);
});

/**
 * @route   GET /api/v1/share/analytics
 * @desc    Get share analytics with optional filters
 * @access  Protected
 */
router.get('/analytics', authenticate, (req, res) => {
  sharingController.getAnalytics(req, res);
});

/**
 * @route   GET /api/v1/share/templates/:channel
 * @desc    Get template for a specific channel
 * @access  Public (templates are not sensitive)
 */
router.get('/templates/:channel', (req, res) => {
  sharingController.getTemplate(req, res);
});

export default router;
