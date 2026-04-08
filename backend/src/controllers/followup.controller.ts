import { Request, Response } from 'express';
import { createLogger } from '../utils/logger.js';
import followupService from '../services/followup.service.js';
import followupTemplateService from '../services/followup-template.service.js';
import {
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  CompleteFollowUpRequest,
  SnoozeFollowUpRequest,
  FollowUpFilters,
  ApplyTemplateRequest,
  FollowUp as BackendFollowUp,
  FollowUpStats as BackendFollowUpStats
} from '../types/followup.types.js';

const logger = createLogger('FollowUpController');

/**
 * Map backend FollowUp to frontend format
 */
function mapFollowUpToFrontend(followUp: BackendFollowUp): any {
  const dueDate = new Date(followUp.dueDate);
  const dateStr = dueDate.toISOString().split('T')[0];
  const timeStr = dueDate.toTimeString().slice(0, 5);

  return {
    id: followUp.followUpId.toString(),
    contactId: followUp.contactId.toString(),
    contactName: followUp.contactName || '',
    contactEmail: followUp.contactEmail,
    contactPhone: followUp.contactMobile,
    dueDate: dateStr,
    dueTime: timeStr,
    priority: followUp.priority,
    status: followUp.status,
    type: followUp.type,
    notes: followUp.notes,
    completedDate: followUp.completedDate?.toISOString(),
    completedNotes: followUp.completedNotes,
    createdAt: followUp.createdDate.toISOString(),
    updatedAt: followUp.updatedDate.toISOString(),
  };
}

/**
 * Map backend stats to frontend format
 */
function mapStatsToFrontend(stats: BackendFollowUpStats): any {
  return {
    totalPending: stats.totalPending,
    overdueCount: stats.totalOverdue,
    completedToday: stats.completedToday,
    upcomingThisWeek: stats.upcomingThisWeek,
  };
}

export class FollowUpController {
  /**
   * Create a new follow-up
   * POST /api/v1/followups
   */
  async createFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const followupData: CreateFollowUpRequest = req.body;

      // Validation
      if (!followupData.contactId || !followupData.dueDate || !followupData.priority || !followupData.type) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: contactId, dueDate, priority, type'
        });
        return;
      }

      const followup = await followupService.createFollowUp(followupData, userId);

      logger.info(`Follow-up created: ${followup.followUpId} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: mapFollowUpToFrontend(followup),
        message: 'Follow-up created successfully'
      });
    } catch (error: any) {
      logger.error('Error creating follow-up:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create follow-up'
      });
    }
  }

  /**
   * Get follow-ups with filters
   * GET /api/v1/followups
   */
  async getFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const filters: FollowUpFilters = {
        userId,
        contactId: req.query.contactId ? parseInt(req.query.contactId as string) : undefined,
        status: req.query.status as any,
        priority: req.query.priority as any,
        type: req.query.type as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        overdue: req.query.overdue === 'true',
        upcoming: req.query.upcoming === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await followupService.getFollowUps(userId, filters);

      res.json({
        success: true,
        data: {
          followUps: result.followUps.map(mapFollowUpToFrontend),
          total: result.total
        }
      });
    } catch (error: any) {
      logger.error('Error getting follow-ups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get follow-ups'
      });
    }
  }

  /**
   * Get a single follow-up
   * GET /api/v1/followups/:id
   */
  async getFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const followUpId = parseInt(idParam);

      const followup = await followupService.getFollowUp(followUpId, userId);

      res.json({
        success: true,
        data: mapFollowUpToFrontend(followup)
      });
    } catch (error: any) {
      logger.error('Error getting follow-up:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get follow-up'
      });
    }
  }

  /**
   * Update a follow-up
   * PUT /api/v1/followups/:id
   */
  async updateFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const followUpId = parseInt(idParam);
      const updates: UpdateFollowUpRequest = req.body;

      const followup = await followupService.updateFollowUp(followUpId, updates, userId);

      logger.info(`Follow-up updated: ${followUpId} by user ${userId}`);

      res.json({
        success: true,
        data: mapFollowUpToFrontend(followup),
        message: 'Follow-up updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating follow-up:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update follow-up'
      });
    }
  }

  /**
   * Delete a follow-up
   * DELETE /api/v1/followups/:id
   */
  async deleteFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const followUpId = parseInt(idParam);

      await followupService.deleteFollowUp(followUpId, userId);

      logger.info(`Follow-up deleted: ${followUpId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Follow-up deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting follow-up:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete follow-up'
      });
    }
  }

  /**
   * Mark follow-up as complete
   * POST /api/v1/followups/:id/complete
   */
  async completeFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const followUpId = parseInt(idParam);
      const completionData: CompleteFollowUpRequest = req.body;

      const followup = await followupService.completeFollowUp(followUpId, userId, completionData);

      logger.info(`Follow-up completed: ${followUpId} by user ${userId}`);

      res.json({
        success: true,
        data: mapFollowUpToFrontend(followup),
        message: 'Follow-up marked as complete'
      });
    } catch (error: any) {
      logger.error('Error completing follow-up:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to complete follow-up'
      });
    }
  }

  /**
   * Snooze a follow-up
   * POST /api/v1/followups/:id/snooze
   */
  async snoozeFollowUp(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const followUpId = parseInt(idParam);
      const snoozeData: SnoozeFollowUpRequest = req.body;

      if (!snoozeData.newDueDate) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: newDueDate'
        });
        return;
      }

      const followup = await followupService.snoozeFollowUp(followUpId, snoozeData, userId);

      logger.info(`Follow-up snoozed: ${followUpId} by user ${userId}`);

      res.json({
        success: true,
        data: mapFollowUpToFrontend(followup),
        message: 'Follow-up snoozed successfully'
      });
    } catch (error: any) {
      logger.error('Error snoozing follow-up:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to snooze follow-up'
      });
    }
  }

  /**
   * Get upcoming follow-ups
   * GET /api/v1/followups/upcoming
   */
  async getUpcomingFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const followups = await followupService.getUpcomingFollowUps(userId, days);

      res.json({
        success: true,
        data: {
          followUps: followups.map(mapFollowUpToFrontend),
          total: followups.length,
          days
        }
      });
    } catch (error: any) {
      logger.error('Error getting upcoming follow-ups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get upcoming follow-ups'
      });
    }
  }

  /**
   * Get overdue follow-ups
   * GET /api/v1/followups/overdue
   */
  async getOverdueFollowUps(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const followups = await followupService.getOverdueFollowUps(userId);

      res.json({
        success: true,
        data: {
          followUps: followups.map(mapFollowUpToFrontend),
          total: followups.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting overdue follow-ups:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get overdue follow-ups'
      });
    }
  }

  /**
   * Get follow-up templates
   * GET /api/v1/followups/templates
   */
  async getFollowUpTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const templates = await followupTemplateService.getFollowUpTemplates();

      res.json({
        success: true,
        data: {
          templates,
          total: templates.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting follow-up templates:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get follow-up templates'
      });
    }
  }

  /**
   * Apply a template to create a follow-up
   * POST /api/v1/followups/apply-template
   */
  async applyTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const applyData: ApplyTemplateRequest = req.body;

      if (!applyData.templateId || !applyData.contactId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: templateId, contactId'
        });
        return;
      }

      const followup = await followupTemplateService.applyTemplate(applyData, userId);

      logger.info(`Template ${applyData.templateId} applied by user ${userId}`);

      res.status(201).json({
        success: true,
        data: mapFollowUpToFrontend(followup),
        message: 'Template applied successfully'
      });
    } catch (error: any) {
      logger.error('Error applying template:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to apply template'
      });
    }
  }

  /**
   * Get follow-up statistics
   * GET /api/v1/followups/stats
   */
  async getFollowUpStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const stats = await followupService.getFollowUpStats(userId);

      res.json({
        success: true,
        data: mapStatsToFrontend(stats)
      });
    } catch (error: any) {
      logger.error('Error getting follow-up stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get follow-up stats'
      });
    }
  }
}

export default new FollowUpController();
