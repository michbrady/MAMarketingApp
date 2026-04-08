import { Request, Response } from 'express';
import contactGroupService from '../services/contact-group.service.js';
import { createLogger } from '../utils/logger.js';
import { CreateContactGroupRequest, UpdateContactGroupRequest } from '../types/contact.types.js';

const logger = createLogger('ContactGroupController');

export class ContactGroupController {
  /**
   * POST /api/v1/contact-groups - Create new contact group
   */
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupData: CreateContactGroupRequest = req.body;

      if (!groupData.groupName || groupData.groupName.trim().length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Group name is required'
        });
        return;
      }

      const group = await contactGroupService.createGroup(groupData, userId);

      res.status(201).json({
        success: true,
        data: group
      });

    } catch (error: any) {
      logger.error('Create group error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to create group'
      });
    }
  }

  /**
   * GET /api/v1/contact-groups - List all groups
   */
  async listGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const groups = await contactGroupService.getGroups(userId);

      res.json({
        success: true,
        data: groups
      });

    } catch (error: any) {
      logger.error('List groups error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve groups'
      });
    }
  }

  /**
   * GET /api/v1/contact-groups/:id - Get single group
   */
  async getGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);

      const group = await contactGroupService.getGroup(groupId, userId);

      if (!group) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Group not found'
        });
        return;
      }

      res.json({
        success: true,
        data: group
      });

    } catch (error: any) {
      logger.error('Get group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve group'
      });
    }
  }

  /**
   * PUT /api/v1/contact-groups/:id - Update group
   */
  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);
      const updates: UpdateContactGroupRequest = req.body;

      const group = await contactGroupService.updateGroup(groupId, updates, userId);

      res.json({
        success: true,
        data: group
      });

    } catch (error: any) {
      logger.error('Update group error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to update group'
      });
    }
  }

  /**
   * DELETE /api/v1/contact-groups/:id - Delete group
   */
  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);

      const deleted = await contactGroupService.deleteGroup(groupId, userId);

      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Group not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Group deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete group'
      });
    }
  }

  /**
   * GET /api/v1/contact-groups/:id/contacts - Get contacts in group
   */
  async getGroupContacts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);

      const contacts = await contactGroupService.getGroupContacts(groupId, userId);

      res.json({
        success: true,
        data: contacts
      });

    } catch (error: any) {
      logger.error('Get group contacts error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve group contacts'
      });
    }
  }

  /**
   * POST /api/v1/contact-groups/:id/contacts - Add contacts to group
   */
  async addContactsToGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);
      const { contactIds } = req.body;

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Contact IDs array is required'
        });
        return;
      }

      const addedCount = await contactGroupService.addContactsToGroup(groupId, contactIds, userId);

      res.json({
        success: true,
        message: `Added ${addedCount} contacts to group`,
        data: { addedCount }
      });

    } catch (error: any) {
      logger.error('Add contacts to group error:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Failed to add contacts to group'
      });
    }
  }

  /**
   * DELETE /api/v1/contact-groups/:id/contacts/:contactId - Remove contact from group
   */
  async removeContactFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const groupId = parseInt(req.params.id as string);
      const contactId = parseInt(req.params.contactId as string);

      const removed = await contactGroupService.removeContactFromGroup(groupId, contactId, userId);

      if (!removed) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found in group'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Contact removed from group'
      });

    } catch (error: any) {
      logger.error('Remove contact from group error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove contact from group'
      });
    }
  }
}

export default new ContactGroupController();
