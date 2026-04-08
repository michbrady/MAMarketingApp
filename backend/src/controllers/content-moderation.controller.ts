import { Request, Response } from 'express';
import contentModerationService from '../services/content-moderation.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ContentModerationController');

export class ContentModerationController {
  /**
   * GET /api/v1/admin/content/pending
   * Get content pending approval
   */
  async getPendingContent(_req: Request, res: Response): Promise<void> {
    try {
      const content = await contentModerationService.getPendingContent();

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error getting pending content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get pending content'
      });
    }
  }

  /**
   * GET /api/v1/admin/content/all
   * Get all content with moderation info
   */
  async getAllContent(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      const content = await contentModerationService.getAllContent(status as string);

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error getting all content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get content'
      });
    }
  }

  /**
   * GET /api/v1/admin/content/featured
   * Get featured content
   */
  async getFeaturedContent(_req: Request, res: Response): Promise<void> {
    try {
      const content = await contentModerationService.getFeaturedContent();

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error getting featured content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get featured content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/:id/approve
   * Approve content
   */
  async approveContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const idParam = Array.isArray(id) ? id[0] : id;
      const content = await contentModerationService.approveContent(
        parseInt(idParam),
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error approving content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to approve content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/:id/reject
   * Reject content
   */
  async rejectContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Rejection reason is required'
        });
        return;
      }

      const idParam = Array.isArray(id) ? id[0] : id;
      const content = await contentModerationService.rejectContent(
        parseInt(idParam),
        reason,
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error rejecting content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to reject content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/:id/feature
   * Feature content
   */
  async featureContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const idParam = Array.isArray(id) ? id[0] : id;
      const content = await contentModerationService.featureContent(
        parseInt(idParam),
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error featuring content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to feature content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/:id/unfeature
   * Unfeature content
   */
  async unfeatureContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const idParam = Array.isArray(id) ? id[0] : id;
      const content = await contentModerationService.unfeatureContent(
        parseInt(idParam),
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error unfeaturing content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to unfeature content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/bulk/approve
   * Bulk approve content
   */
  async bulkApprove(req: Request, res: Response): Promise<void> {
    try {
      const { contentIds } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!Array.isArray(contentIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'contentIds must be an array'
        });
        return;
      }

      const content = await contentModerationService.bulkApprove(
        contentIds,
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error bulk approving content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to bulk approve content'
      });
    }
  }

  /**
   * POST /api/v1/admin/content/bulk/reject
   * Bulk reject content
   */
  async bulkReject(req: Request, res: Response): Promise<void> {
    try {
      const { contentIds, reason } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!Array.isArray(contentIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'contentIds must be an array'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Rejection reason is required'
        });
        return;
      }

      const content = await contentModerationService.bulkReject(
        contentIds,
        reason,
        user.userId
      );

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      logger.error('Error bulk rejecting content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to bulk reject content'
      });
    }
  }
}

export default new ContentModerationController();
