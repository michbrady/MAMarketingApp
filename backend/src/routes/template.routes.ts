/**
 * Template Routes
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templatePreviewSchema,
  getTemplatesQuerySchema,
  getDefaultTemplateQuerySchema,
} from '../validation/template.validation.js';
import * as templateService from '../services/template.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TemplateRoutes');

const router = Router();

/**
 * GET /api/v1/templates
 * Get all templates with optional filters
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedQuery = getTemplatesQuerySchema.parse(req.query);

      const templates = await templateService.getAllTemplates(validatedQuery);

      res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      logger.error('Error getting templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates',
      });
    }
  }
);

/**
 * GET /api/v1/templates/defaults/:channel
 * Get default template for a channel
 */
router.get(
  '/defaults/:channel',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const queryParams = {
        ShareChannel: req.params.channel,
        ...req.query,
      };

      const validatedQuery = getDefaultTemplateQuerySchema.parse(queryParams);

      const template = await templateService.getDefaultTemplate(
        validatedQuery.ShareChannel,
        validatedQuery.ContentType,
        validatedQuery.SocialPlatform,
        validatedQuery.MarketID,
        validatedQuery.LanguageID
      );

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'No default template found for the specified criteria',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error('Error getting default template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve default template',
      });
    }
  }
);

/**
 * GET /api/v1/templates/performance
 * Get template performance metrics
 */
router.get(
  '/performance',
  authenticate,
  requireRole(['CorporateAdmin', 'SuperAdmin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        ShareChannel: req.query.ShareChannel as string | undefined,
        ContentType: req.query.ContentType as string | undefined,
        MinShares: req.query.MinShares ? parseInt(req.query.MinShares as string) : undefined,
      };

      const performance = await templateService.getTemplatePerformance(filters);

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      logger.error('Error getting template performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve template performance',
      });
    }
  }
);

/**
 * GET /api/v1/templates/:id
 * Get template by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const templateId = parseInt(idParam);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const template = await templateService.getTemplateById(templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error('Error getting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve template',
      });
    }
  }
);

/**
 * POST /api/v1/templates
 * Create a new template (admin only)
 */
router.post(
  '/',
  authenticate,
  requireRole(['CorporateAdmin', 'SuperAdmin']),
  validateRequest(createTemplateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const template = await templateService.createTemplate(req.body, userId);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully',
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      });
    }
  }
);

/**
 * PUT /api/v1/templates/:id
 * Update a template (admin only)
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['CorporateAdmin', 'SuperAdmin']),
  validateRequest(updateTemplateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const templateId = parseInt(idParam);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const userId = req.user!.userId;
      const template = await templateService.updateTemplate(templateId, req.body, userId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully',
      });
    } catch (error) {
      logger.error('Error updating template:', error);

      if (error instanceof Error && error.message.includes('System templates')) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update template',
      });
    }
  }
);

/**
 * DELETE /api/v1/templates/:id
 * Delete a template (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['CorporateAdmin', 'SuperAdmin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const templateId = parseInt(idParam);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const deleted = await templateService.deleteTemplate(templateId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting template:', error);

      if (error instanceof Error && error.message.includes('System templates')) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
      });
    }
  }
);

/**
 * POST /api/v1/templates/preview
 * Preview a template with sample data
 */
router.post(
  '/preview',
  authenticate,
  validateRequest(templatePreviewSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const preview = await templateService.previewTemplate(req.body);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      logger.error('Error previewing template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to preview template',
      });
    }
  }
);

/**
 * POST /api/v1/templates/:id/set-default
 * Set a template as default for its channel/content type
 */
router.post(
  '/:id/set-default',
  authenticate,
  requireRole(['CorporateAdmin', 'SuperAdmin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const templateId = parseInt(idParam);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid template ID',
        });
        return;
      }

      const template = await templateService.getTemplateById(templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
        return;
      }

      await templateService.setDefaultTemplate(
        templateId,
        template.ShareChannel,
        template.ContentType,
        template.SocialPlatform
      );

      res.json({
        success: true,
        message: 'Template set as default successfully',
      });
    } catch (error) {
      logger.error('Error setting default template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set default template',
      });
    }
  }
);

export default router;
