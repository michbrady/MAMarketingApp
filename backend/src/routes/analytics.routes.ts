import { Router } from 'express';
import {
  getAnalyticsOverview,
  getShareTrends,
  getChannelPerformance,
  getTopContent,
  getLeaderboard,
  getRecentShares,
  trackClick
} from '../controllers/analytics.controller.js';

const router = Router();

// Analytics endpoints
router.get('/overview', getAnalyticsOverview);
router.get('/trends', getShareTrends);
router.get('/channels', getChannelPerformance);
router.get('/top-content', getTopContent);
router.get('/leaderboard', getLeaderboard);
router.get('/recent-shares', getRecentShares);

// Click tracking endpoint
router.get('/track/:trackingCode', trackClick);

export default router;
