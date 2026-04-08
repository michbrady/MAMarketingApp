import { Request, Response } from 'express';
import contentService from '../services/content.service.js';
import { createLogger } from '../utils/logger.js';
import { ContentFilters, ContentItemWithRelations } from '../types/content.types.js';

const logger = createLogger('ContentController');

export class ContentController {
  /**
   * List content with filtering
   * GET /api/v1/content
   */
  async listContent(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        market,
        language,
        contentType,
        publishStatus,
        isFeatured,
        tags,
        campaignId,
        limit = '20',
        offset = '0'
      } = req.query;

      const filters: ContentFilters = {
        search: search as string,
        category: category ? parseInt(category as string) : undefined,
        market: market as string,
        language: language as string,
        contentType: contentType as string,
        publishStatus: (publishStatus as string) || 'Published',
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        campaignId: campaignId ? parseInt(campaignId as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const result = await contentService.getContentList(filters);

      res.status(200).json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: (filters.offset || 0) + result.items.length < result.total
        }
      });

    } catch (error) {
      logger.error('Error listing content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve content list'
      });
    }
  }

  /**
   * Get content detail
   * GET /api/v1/content/:id
   */
  async getContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contentId = parseInt(id as string);

      if (isNaN(contentId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid content ID'
        });
        return;
      }

      const content = await contentService.getContentById(contentId);

      if (!content) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Content not found'
        });
        return;
      }

      // Get related content (same category, limit 5)
      let relatedContent: ContentItemWithRelations[] = [];
      if (content.CategoryID) {
        const related = await contentService.getContentList({
          category: content.CategoryID,
          publishStatus: 'Published',
          limit: 6
        });
        relatedContent = related.items.filter(item => item.ContentItemID !== contentId).slice(0, 5);
      }

      res.status(200).json({
        success: true,
        data: {
          content,
          relatedContent
        }
      });

    } catch (error) {
      logger.error('Error getting content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve content'
      });
    }
  }

  /**
   * Get featured content
   * GET /api/v1/content/featured
   */
  async getFeaturedContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 10;
      const items = await contentService.getFeaturedContent(limitNum);

      res.status(200).json({
        success: true,
        data: {
          items
        }
      });

    } catch (error) {
      logger.error('Error getting featured content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve featured content'
      });
    }
  }

  /**
   * Get recent content
   * GET /api/v1/content/recent
   */
  async getRecentContent(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const limitNum = typeof limit === 'string' ? parseInt(limit) : 10;
      const items = await contentService.getRecentContent(limitNum);

      res.status(200).json({
        success: true,
        data: {
          items
        }
      });

    } catch (error) {
      logger.error('Error getting recent content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve recent content'
      });
    }
  }

  /**
   * Search content
   * GET /api/v1/content/search
   */
  async searchContent(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = '20' } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Search query is required'
        });
        return;
      }

      const limitNum = typeof limit === 'string' ? parseInt(limit) : 20;
      const items = await contentService.searchContent(q, limitNum);

      res.status(200).json({
        success: true,
        data: {
          items,
          query: q
        }
      });

    } catch (error) {
      logger.error('Error searching content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search content'
      });
    }
  }

  /**
   * Get categories
   * GET /api/v1/content/categories
   */
  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await contentService.getCategories();

      res.status(200).json({
        success: true,
        data: {
          categories
        }
      });

    } catch (error) {
      logger.error('Error getting categories:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve categories'
      });
    }
  }

  /**
   * Create content (admin only)
   * POST /api/v1/content
   */
  async createContent(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const {
        title,
        subtitle,
        description,
        thumbnailURL,
        mediaURL,
        destinationURL,
        contentType,
        mimeType,
        fileSizeBytes,
        durationSeconds,
        externalContentID,
        publishStatus,
        publishDate,
        expirationDate,
        allowSMS,
        allowEmail,
        allowSocial,
        allowPersonalNote,
        ctaType,
        ctaLabel,
        requiresDisclaimer,
        disclaimerText,
        isRegulatedContent,
        isFeatured,
        featuredPriority,
        categoryIds,
        tagIds,
        marketIds,
        languageIds,
        campaignIds
      } = req.body;

      // Validation
      if (!title || !contentType) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Title and content type are required'
        });
        return;
      }

      const content = await contentService.createContent({
        title,
        subtitle,
        description,
        thumbnailURL,
        mediaURL,
        destinationURL,
        contentType,
        mimeType,
        fileSizeBytes,
        durationSeconds,
        externalContentID,
        publishStatus,
        publishDate: publishDate ? new Date(publishDate) : undefined,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        allowSMS,
        allowEmail,
        allowSocial,
        allowPersonalNote,
        ctaType,
        ctaLabel,
        requiresDisclaimer,
        disclaimerText,
        isRegulatedContent,
        isFeatured,
        featuredPriority,
        categoryIds,
        tagIds,
        marketIds,
        languageIds,
        campaignIds
      }, user.userId);

      res.status(201).json({
        success: true,
        data: {
          content
        }
      });

    } catch (error) {
      logger.error('Error creating content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create content'
      });
    }
  }

  /**
   * Update content (admin only)
   * PUT /api/v1/content/:id
   */
  async updateContent(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const contentItemId = parseInt(id as string);

      if (isNaN(contentItemId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid content ID'
        });
        return;
      }

      const content = await contentService.updateContent({
        contentItemId,
        ...req.body,
        publishDate: req.body.publishDate ? new Date(req.body.publishDate) : undefined,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      }, user.userId);

      res.status(200).json({
        success: true,
        data: {
          content
        }
      });

    } catch (error) {
      logger.error('Error updating content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update content'
      });
    }
  }

  /**
   * Delete content (admin only)
   * DELETE /api/v1/content/:id
   */
  async deleteContent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contentId = parseInt(id as string);

      if (isNaN(contentId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid content ID'
        });
        return;
      }

      await contentService.deleteContent(contentId);

      res.status(200).json({
        success: true,
        message: 'Content deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting content:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete content'
      });
    }
  }

  /**
   * Get all categories (including inactive, admin only)
   * GET /api/v1/admin/categories
   */
  async getAllCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await contentService.getAllCategories();

      res.status(200).json({
        success: true,
        data: {
          categories
        }
      });

    } catch (error) {
      logger.error('Error getting all categories:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve categories'
      });
    }
  }

  /**
   * Create a category (admin only)
   * POST /api/v1/admin/categories
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryName, description, sortOrder, isActive } = req.body;

      if (!categoryName || !categoryName.trim()) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Category name is required'
        });
        return;
      }

      const category = await contentService.createCategory({
        categoryName: categoryName.trim(),
        description,
        sortOrder,
        isActive
      });

      res.status(201).json({
        success: true,
        data: category
      });

    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create category'
      });
    }
  }

  /**
   * Update a category (admin only)
   * PUT /api/v1/admin/categories/:id
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id as string);

      if (isNaN(categoryId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid category ID'
        });
        return;
      }

      const { categoryName, description, sortOrder, isActive } = req.body;

      const category = await contentService.updateCategory(categoryId, {
        categoryName,
        description,
        sortOrder,
        isActive
      });

      res.status(200).json({
        success: true,
        data: category
      });

    } catch (error: any) {
      logger.error('Error updating category:', error);
      if (error.message === 'Category not found') {
        res.status(404).json({
          error: 'Not Found',
          message: 'Category not found'
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to update category'
        });
      }
    }
  }

  /**
   * Delete a category (admin only)
   * DELETE /api/v1/admin/categories/:id
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id as string);

      if (isNaN(categoryId)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid category ID'
        });
        return;
      }

      await contentService.deleteCategory(categoryId);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error: any) {
      logger.error('Error deleting category:', error);
      if (error.message?.includes('in use')) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot delete category that is in use by content items'
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to delete category'
        });
      }
    }
  }
}

export default new ContentController();
