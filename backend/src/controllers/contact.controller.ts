import { Request, Response } from 'express';
import contactService from '../services/contact.service.js';
import { createLogger } from '../utils/logger.js';
import { transformContact, transformContacts } from '../utils/transform.js';
import {
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  ImportContactRow
} from '../types/contact.types.js';

const logger = createLogger('ContactController');

export class ContactController {
  /**
   * POST /api/v1/contacts - Create new contact
   */
  async createContact(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactData: CreateContactRequest = req.body;

      // Validate required fields
      if (!contactData.email && !contactData.mobile) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Either email or mobile is required'
        });
        return;
      }

      const contact = await contactService.createContact(contactData, userId);

      res.status(201).json({
        success: true,
        data: transformContact(contact)
      });

    } catch (error: any) {
      logger.error('Create contact error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create contact'
      });
    }
  }

  /**
   * GET /api/v1/contacts - List contacts with filters
   */
  async listContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const filters: ContactFilters = {
        search: req.query.search as string,
        status: req.query.status as any,
        relationshipType: req.query.relationshipType as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        hasEmail: req.query.hasEmail === 'true' ? true : req.query.hasEmail === 'false' ? false : undefined,
        hasMobile: req.query.hasMobile === 'true' ? true : req.query.hasMobile === 'false' ? false : undefined,
        minEngagementScore: req.query.minEngagementScore ? parseInt(req.query.minEngagementScore as string) : undefined,
        lastEngagementFrom: req.query.lastEngagementFrom ? new Date(req.query.lastEngagementFrom as string) : undefined,
        lastEngagementTo: req.query.lastEngagementTo ? new Date(req.query.lastEngagementTo as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        sortBy: req.query.sortBy as any || 'updatedDate',
        sortOrder: req.query.sortOrder as any || 'DESC'
      };

      const result = await contactService.getContacts(userId, filters);

      res.json({
        success: true,
        data: transformContacts(result.contacts),
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: (filters.offset || 0) + result.contacts.length < result.total
        }
      });

    } catch (error: any) {
      logger.error('List contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve contacts'
      });
    }
  }

  /**
   * GET /api/v1/contacts/:id - Get single contact
   */
  async getContact(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);

      const contact = await contactService.getContact(contactId, userId);

      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found'
        });
        return;
      }

      res.json({
        success: true,
        data: transformContact(contact)
      });

    } catch (error: any) {
      logger.error('Get contact error:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        contactId: req.params.id,
        userId: (req as any).user?.userId
      });
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to retrieve contact',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * PUT /api/v1/contacts/:id - Update contact
   */
  async updateContact(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);
      const updates: UpdateContactRequest = req.body;

      const contact = await contactService.updateContact(contactId, updates, userId);

      res.json({
        success: true,
        data: transformContact(contact)
      });

    } catch (error: any) {
      logger.error('Update contact error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update contact'
      });
    }
  }

  /**
   * DELETE /api/v1/contacts/:id - Delete contact
   */
  async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);

      const deleted = await contactService.deleteContact(contactId, userId);

      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found'
        });
        return;
      }

      res.json({
        success: true,
        data: null,
        message: 'Contact deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete contact error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete contact'
      });
    }
  }

  /**
   * POST /api/v1/contacts/bulk - Bulk delete contacts
   */
  async bulkDeleteContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { contactIds } = req.body;

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'contactIds array is required'
        });
        return;
      }

      const result = await contactService.bulkDeleteContacts(contactIds, userId);

      res.json({
        success: true,
        data: result,
        message: `${result.deleted} contact(s) deleted successfully`
      });

    } catch (error: any) {
      logger.error('Bulk delete contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete contacts'
      });
    }
  }

  /**
   * GET /api/v1/contacts/search - Search contacts
   */
  async searchContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Search query is required'
        });
        return;
      }

      const contacts = await contactService.searchContacts(userId, query);

      res.json({
        success: true,
        data: transformContacts(contacts)
      });

    } catch (error: any) {
      logger.error('Search contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search contacts'
      });
    }
  }

  /**
   * GET /api/v1/contacts/top-engaged - Get top engaged contacts
   */
  async getTopEngagedContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      // For now, return empty array until we have engagement tracking
      // This prevents 404 errors in the dashboard
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      logger.error('Error getting top engaged contacts:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get top engaged contacts'
      });
    }
  }

  /**
   * POST /api/v1/contacts/import - Import contacts from CSV
   */
  async importContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const csvData: ImportContactRow[] = req.body.contacts;

      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid CSV data. Expected array of contacts.'
        });
        return;
      }

      const result = await contactService.importContacts(csvData, userId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Import contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to import contacts'
      });
    }
  }

  /**
   * GET /api/v1/contacts/export - Export contacts to CSV
   */
  async exportContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const format = (req.query.format as 'csv' | 'json') || 'csv';

      const data = await contactService.exportContacts(userId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.json');
      }

      res.send(data);

    } catch (error: any) {
      logger.error('Export contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to export contacts'
      });
    }
  }

  /**
   * POST /api/v1/contacts/:id/tags - Add tag to contact
   */
  async addTag(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);
      const { tag } = req.body;

      if (!tag || typeof tag !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Tag is required'
        });
        return;
      }

      const contact = await contactService.addContactTag(contactId, tag, userId);

      res.json({
        success: true,
        data: transformContact(contact)
      });

    } catch (error: any) {
      logger.error('Add tag error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to add tag'
      });
    }
  }

  /**
   * DELETE /api/v1/contacts/:id/tags/:tag - Remove tag from contact
   */
  async removeTag(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);
      const tag = req.params.tag as string;

      const contact = await contactService.removeContactTag(contactId, tag, userId);

      res.json({
        success: true,
        data: transformContact(contact)
      });

    } catch (error: any) {
      logger.error('Remove tag error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to remove tag'
      });
    }
  }

  /**
   * GET /api/v1/contacts/:id/activity - Get contact activity history
   */
  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);

      const activities = await contactService.getContactActivity(contactId, userId);

      res.json({
        success: true,
        data: activities
      });

    } catch (error: any) {
      logger.error('Get activity error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve activity'
      });
    }
  }

  /**
   * POST /api/v1/contacts/:id/engagement-score - Update engagement score
   */
  async updateEngagementScore(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const contactId = parseInt(req.params.id as string);

      // Verify ownership
      const contact = await contactService.getContact(contactId, userId);
      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found'
        });
        return;
      }

      const score = await contactService.updateEngagementScore(contactId);

      res.json({
        success: true,
        data: { engagementScore: score }
      });

    } catch (error: any) {
      logger.error('Update engagement score error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update engagement score'
      });
    }
  }
}

export default new ContactController();
