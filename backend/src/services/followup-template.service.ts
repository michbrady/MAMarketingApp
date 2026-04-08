import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { FollowUpTemplate, ApplyTemplateRequest, CreateFollowUpRequest } from '../types/followup.types.js';
import followupService from './followup.service.js';

const logger = createLogger('FollowUpTemplateService');

interface DbFollowUpTemplate {
  TemplateID: number;
  TemplateName: string;
  Description: string;
  DefaultDays: number;
  DefaultPriority: string;
  DefaultType: string;
  SuggestedAction: string;
  Category?: string;
  IsActive: boolean;
  CreatedDate: Date;
  UpdatedDate: Date;
}

export class FollowUpTemplateService {
  /**
   * Get all active follow-up templates
   */
  async getFollowUpTemplates(): Promise<FollowUpTemplate[]> {
    try {
      logger.info('Getting follow-up templates');

      const results = await query<DbFollowUpTemplate>(`
        SELECT
          TemplateID,
          TemplateName,
          Description,
          DefaultDays,
          DefaultPriority,
          DefaultType,
          SuggestedAction,
          Category,
          IsActive,
          CreatedDate,
          UpdatedDate
        FROM dbo.FollowUpTemplate
        WHERE IsActive = 1
        ORDER BY Category, TemplateName
      `);

      return results.map(r => this.mapDbToTemplate(r));
    } catch (error) {
      logger.error('Error getting follow-up templates:', error);
      throw error;
    }
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(templateId: number): Promise<FollowUpTemplate> {
    try {
      const results = await query<DbFollowUpTemplate>(`
        SELECT
          TemplateID,
          TemplateName,
          Description,
          DefaultDays,
          DefaultPriority,
          DefaultType,
          SuggestedAction,
          Category,
          IsActive,
          CreatedDate,
          UpdatedDate
        FROM dbo.FollowUpTemplate
        WHERE TemplateID = @templateId
      `, { templateId });

      if (results.length === 0) {
        throw new Error('Template not found');
      }

      return this.mapDbToTemplate(results[0]);
    } catch (error) {
      logger.error(`Error getting template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Apply a template to create a follow-up
   */
  async applyTemplate(applyData: ApplyTemplateRequest, userId: number): Promise<any> {
    try {
      logger.info(`Applying template ${applyData.templateId} for user ${userId}, contact ${applyData.contactId}`);

      // Get template
      const template = await this.getTemplate(applyData.templateId);

      // Calculate due date
      const daysToAdd = applyData.customDays !== undefined ? applyData.customDays : template.defaultDays;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      // Prepare notes
      let notes = template.suggestedAction;
      if (applyData.customNotes) {
        notes = `${notes}\n\n${applyData.customNotes}`;
      }

      // Create follow-up request
      const followupData: CreateFollowUpRequest = {
        contactId: applyData.contactId,
        dueDate,
        priority: template.defaultPriority as any,
        type: template.type as any,
        notes
      };

      // Create the follow-up
      const followup = await followupService.createFollowUp(followupData, userId);

      logger.info(`Template ${applyData.templateId} applied successfully, follow-up ID: ${followup.followUpId}`);

      return followup;
    } catch (error) {
      logger.error('Error applying template:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<FollowUpTemplate[]> {
    try {
      const results = await query<DbFollowUpTemplate>(`
        SELECT
          TemplateID,
          TemplateName,
          Description,
          DefaultDays,
          DefaultPriority,
          DefaultType,
          SuggestedAction,
          Category,
          IsActive,
          CreatedDate,
          UpdatedDate
        FROM dbo.FollowUpTemplate
        WHERE IsActive = 1 AND Category = @category
        ORDER BY TemplateName
      `, { category });

      return results.map(r => this.mapDbToTemplate(r));
    } catch (error) {
      logger.error(`Error getting templates by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Map database result to FollowUpTemplate type
   */
  private mapDbToTemplate(db: DbFollowUpTemplate): FollowUpTemplate {
    return {
      templateId: db.TemplateID,
      templateName: db.TemplateName,
      description: db.Description,
      defaultDays: db.DefaultDays,
      defaultPriority: db.DefaultPriority as any,
      suggestedAction: db.SuggestedAction,
      type: db.DefaultType as any,
      isActive: db.IsActive,
      createdDate: db.CreatedDate
    };
  }
}

export default new FollowUpTemplateService();
