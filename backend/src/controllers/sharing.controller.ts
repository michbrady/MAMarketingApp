import { Request, Response } from 'express';
import sharingService from '../services/sharing.service.js';
import { createLogger } from '../utils/logger.js';
import { CreateShareRequest, ShareAnalyticsFilters } from '../types/sharing.types.js';

const logger = createLogger('SharingController');

export class SharingController {
  /**
   * POST /api/v1/share
   * Create and log a share event
   */
  async createShare(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { contentId, channel, recipientInfo, messageContent } = req.body;

      // Validate required fields
      if (!contentId) {
        res.status(400).json({
          success: false,
          message: 'Content ID is required'
        });
        return;
      }

      if (!channel) {
        res.status(400).json({
          success: false,
          message: 'Share channel is required'
        });
        return;
      }

      // Map channel types (frontend uses Facebook/Twitter/LinkedIn, backend uses Social)
      let backendChannel: 'SMS' | 'Email' | 'Social' = 'Social';
      let socialPlatform: string | undefined;

      if (channel === 'Email') {
        backendChannel = 'Email';
      } else if (channel === 'SMS') {
        backendChannel = 'SMS';
      } else if (['Facebook', 'Twitter', 'LinkedIn', 'CopyLink'].includes(channel)) {
        backendChannel = 'Social';
        socialPlatform = channel === 'CopyLink' ? undefined : channel;
      }

      // Build recipients array based on channel
      const recipients = [];
      if (recipientInfo && recipientInfo !== 'social-share') {
        if (backendChannel === 'Email') {
          recipients.push({ email: recipientInfo });
        } else if (backendChannel === 'SMS') {
          recipients.push({ mobile: recipientInfo });
        }
      }

      // Build share request
      const shareData: CreateShareRequest = {
        contentItemId: parseInt(contentId),
        channel: backendChannel,
        socialPlatform,
        personalMessage: messageContent,
        recipients: recipients.length > 0 ? recipients : undefined
      };

      // Extract metadata from request
      const metadata = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        deviceType: this.getDeviceType(req.headers['user-agent'] || '')
      };

      // Log share event
      const result = await sharingService.logShareEvent(shareData, userId, metadata);

      logger.info(`Share created successfully: ${result.data.shareEventId}`);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error creating share:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create share event',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/v1/share/:trackingCode/track
   * Track a click and redirect to content
   */
  async trackClick(req: Request, res: Response): Promise<void> {
    try {
      const { trackingCode } = req.params;

      if (!trackingCode) {
        res.status(400).json({
          success: false,
          message: 'Tracking code is required'
        });
        return;
      }

      const trackingData = {
        trackingCode: Array.isArray(trackingCode) ? trackingCode[0] : trackingCode,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        referrer: (req.headers['referer'] || req.headers['referrer']) as string | undefined
      };

      const result = await sharingService.trackClick(trackingData);

      if (result.success && result.recorded) {
        logger.info(`Click tracked and redirecting to: ${result.redirectUrl}`);
        // Redirect to destination URL
        res.redirect(302, result.redirectUrl);
      } else {
        logger.warn(`Click tracking failed for code: ${trackingCode}`);
        // Redirect to fallback URL
        res.redirect(302, result.redirectUrl);
      }
    } catch (error) {
      logger.error('Error tracking click:', error);
      // Even on error, redirect to a fallback URL
      const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(302, fallbackUrl);
    }
  }

  /**
   * GET /api/v1/share/history
   * Get user's share history
   */
  async getShareHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const filters = {
        channel: req.query.channel as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await sharingService.getUserShares(userId, filters);

      logger.info(`Share history fetched for user ${userId}`);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching share history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch share history',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/v1/share/analytics
   * Get share analytics with filters
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRoleId = (req as any).user?.roleId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const filters: ShareAnalyticsFilters = {
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        contentId: req.query.contentId ? parseInt(req.query.contentId as string) : undefined,
        channel: req.query.channel as 'SMS' | 'Email' | 'Social' | undefined,
        campaignId: req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };

      // Non-admin users can only see their own analytics
      // RoleID 1 = Admin, RoleID 2 = UFO (based on typical RBAC)
      if (userRoleId !== 1 && filters.userId && filters.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot access other users\' analytics'
        });
        return;
      }

      // If no userId filter and not admin, default to current user
      if (!filters.userId && userRoleId !== 1) {
        filters.userId = userId;
      }

      const analytics = await sharingService.getShareAnalytics(filters);

      logger.info(`Analytics fetched for user ${userId}`);

      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * GET /api/v1/share/templates/:channel
   * Get template for a specific channel
   */
  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const channel = req.params.channel;
      const platform = req.query.platform;

      if (!channel) {
        res.status(400).json({
          success: false,
          message: 'Channel is required'
        });
        return;
      }

      const channelStr = Array.isArray(channel) ? channel[0] : channel;

      if (!['SMS', 'Email', 'Social'].includes(channelStr)) {
        res.status(400).json({
          success: false,
          message: 'Invalid channel. Must be SMS, Email, or Social'
        });
        return;
      }

      const platformStr = Array.isArray(platform) ? platform[0] : platform;

      const template = sharingService.getTemplateForChannel(
        channelStr as 'SMS' | 'Email' | 'Social',
        platformStr as string | undefined
      );

      logger.info(`Template fetched for channel: ${channelStr}`);

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  /**
   * Helper method to determine device type from user agent
   */
  private getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    return 'Desktop';
  }
}

export default new SharingController();
