import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { createLogger } from '../utils/logger.js';
import { ShareAnalyticsFilters } from '../types/analytics.types.js';

const logger = createLogger('AnalyticsController');
const analyticsService = new AnalyticsService();

/**
 * Get analytics overview metrics
 * GET /api/v1/analytics/overview
 */
export const getAnalyticsOverview = async (req: Request, res: Response) => {
  try {
    const filters: ShareAnalyticsFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      contentId: req.query.contentId ? parseInt(req.query.contentId as string) : undefined,
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
      channel: req.query.channel as string,
      marketCode: req.query.marketCode as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const metrics = await analyticsService.getSharePerformance(filters);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get share trends over time
 * GET /api/v1/analytics/trends
 */
export const getShareTrends = async (req: Request, res: Response) => {
  try {
    const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

    // Default to last 30 days
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filters: ShareAnalyticsFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      contentId: req.query.contentId ? parseInt(req.query.contentId as string) : undefined,
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
      channel: req.query.channel as string,
      marketCode: req.query.marketCode as string
    };

    const trends = await analyticsService.getShareTrends(
      { startDate, endDate },
      groupBy,
      filters
    );

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Error getting share trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve share trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get channel performance breakdown
 * GET /api/v1/analytics/channels
 */
export const getChannelPerformance = async (req: Request, res: Response) => {
  try {
    const filters: ShareAnalyticsFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      contentId: req.query.contentId ? parseInt(req.query.contentId as string) : undefined,
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
      marketCode: req.query.marketCode as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const channels = await analyticsService.getChannelPerformance(filters);

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    logger.error('Error getting channel performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve channel performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get top performing content
 * GET /api/v1/analytics/top-content
 */
export const getTopContent = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const dateRange = req.query.startDate && req.query.endDate ? {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string)
    } : undefined;

    const filters: ShareAnalyticsFilters = {
      userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
      channel: req.query.channel as string,
      marketCode: req.query.marketCode as string
    };

    const topContent = await analyticsService.getTopSharedContent(limit, dateRange, filters);

    res.json({
      success: true,
      data: topContent
    });
  } catch (error) {
    logger.error('Error getting top content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve top content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get leaderboard of top sharers
 * GET /api/v1/analytics/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const dateRange = req.query.startDate && req.query.endDate ? {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string)
    } : undefined;

    const filters: ShareAnalyticsFilters = {
      contentId: req.query.contentId ? parseInt(req.query.contentId as string) : undefined,
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
      channel: req.query.channel as string,
      marketCode: req.query.marketCode as string
    };

    const leaderboard = await analyticsService.getTopSharers(limit, dateRange, filters);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get recent share activity
 * GET /api/v1/analytics/recent-shares
 */
export const getRecentShares = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const recentShares = await analyticsService.getRecentShares(userId, limit);

    res.json({
      success: true,
      data: recentShares
    });
  } catch (error) {
    logger.error('Error getting recent shares:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent shares',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Track click event via tracking code
 * GET /api/v1/track/:trackingCode
 */
export const trackClick = async (req: Request, res: Response) => {
  try {
    const trackingCode = req.params.trackingCode as string;

    if (!trackingCode) {
      return res.status(400).json({
        success: false,
        message: 'Tracking code is required'
      });
    }

    // Get tracking link info
    const trackingLink = await analyticsService.getTrackingLinkByCode(trackingCode);

    if (!trackingLink) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired tracking link'
      });
    }

    // Parse user agent and IP for analytics
    const userAgent = req.headers['user-agent'] || '';
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : '') ||
                      req.socket.remoteAddress || '';

    // Anonymize IP (remove last octet for privacy)
    const anonymizedIP = ipAddress.split('.').slice(0, 3).join('.') + '.0';

    // Basic device type detection
    const deviceType = /mobile/i.test(userAgent) ? 'Mobile' :
                      /tablet/i.test(userAgent) ? 'Tablet' : 'Desktop';

    // Basic browser detection
    let browser = 'Other';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Basic OS detection
    let operatingSystem = 'Other';
    if (userAgent.includes('Windows')) operatingSystem = 'Windows';
    else if (userAgent.includes('Mac')) operatingSystem = 'macOS';
    else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
    else if (userAgent.includes('Android')) operatingSystem = 'Android';
    else if (userAgent.includes('iOS')) operatingSystem = 'iOS';

    // Check if unique visitor (simple check based on IP + User Agent)
    // In production, use more sophisticated session tracking
    const isUniqueVisitor = true; // Simplified for MVP

    // Record engagement event
    await analyticsService.recordEngagementEvent({
      trackingLinkId: trackingLink.TrackingLinkID,
      contentItemId: trackingLink.ContentItemID,
      shareEventId: trackingLink.ShareEventID,
      eventType: 'Click',
      ipAddress: anonymizedIP,
      userAgent: userAgent.substring(0, 500), // Limit length
      deviceType,
      operatingSystem,
      browser,
      referrerURL: req.headers.referer ? req.headers.referer.substring(0, 1000) : undefined,
      isUniqueVisitor
    });

    // Return destination URL for redirect
    return res.json({
      success: true,
      data: {
        destinationURL: trackingLink.DestinationURL
      }
    });
  } catch (error) {
    logger.error('Error tracking click:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
