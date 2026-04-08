/**
 * Template Service
 * Handles template management, rendering, and variable substitution
 */

import sql from 'mssql';
import { getPool } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TemplateService');
import type {
  ShareTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TemplateVariables,
  RenderTemplateResult,
  TemplatePreviewRequest,
  TemplatePerformance,
} from '../types/template.types.js';

/**
 * Get all templates with optional filters
 */
export async function getAllTemplates(filters?: {
  ShareChannel?: string;
  ContentType?: string;
  SocialPlatform?: string;
  IsActive?: boolean;
  IsDefault?: boolean;
  MarketID?: number;
  LanguageID?: number;
}): Promise<ShareTemplate[]> {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        ShareTemplateID,
        TemplateName,
        TemplateDescription,
        ShareChannel,
        SocialPlatform,
        ContentType,
        SubjectTemplate,
        MessageTemplate,
        HTMLTemplate,
        IsDefault,
        IsActive,
        IsSystemTemplate,
        MaxCharacters,
        UsageCount,
        TotalShares,
        TotalClicks,
        ClickThroughRate,
        LastUsedDate,
        MarketID,
        LanguageID,
        CreatedDate,
        CreatedBy,
        UpdatedDate,
        UpdatedBy
      FROM dbo.ShareTemplate
      WHERE 1=1
    `;

    if (filters?.ShareChannel) {
      query += ' AND ShareChannel = @ShareChannel';
      request.input('ShareChannel', sql.NVarChar(20), filters.ShareChannel);
    }

    if (filters?.ContentType) {
      query += ' AND ContentType = @ContentType';
      request.input('ContentType', sql.NVarChar(50), filters.ContentType);
    }

    if (filters?.SocialPlatform) {
      query += ' AND SocialPlatform = @SocialPlatform';
      request.input('SocialPlatform', sql.NVarChar(50), filters.SocialPlatform);
    }

    if (filters?.IsActive !== undefined) {
      query += ' AND IsActive = @IsActive';
      request.input('IsActive', sql.Bit, filters.IsActive);
    }

    if (filters?.IsDefault !== undefined) {
      query += ' AND IsDefault = @IsDefault';
      request.input('IsDefault', sql.Bit, filters.IsDefault);
    }

    if (filters?.MarketID) {
      query += ' AND (MarketID = @MarketID OR MarketID IS NULL)';
      request.input('MarketID', sql.Int, filters.MarketID);
    }

    if (filters?.LanguageID) {
      query += ' AND (LanguageID = @LanguageID OR LanguageID IS NULL)';
      request.input('LanguageID', sql.Int, filters.LanguageID);
    }

    query += ' ORDER BY ShareChannel, ContentType, IsDefault DESC, ClickThroughRate DESC';

    const result = await request.query(query);
    return result.recordset as ShareTemplate[];
  } catch (error) {
    logger.error('Error getting templates:', error);
    throw error;
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: number): Promise<ShareTemplate | null> {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ShareTemplateID', sql.Int, templateId)
      .query(`
        SELECT
          ShareTemplateID,
          TemplateName,
          TemplateDescription,
          ShareChannel,
          SocialPlatform,
          ContentType,
          SubjectTemplate,
          MessageTemplate,
          HTMLTemplate,
          IsDefault,
          IsActive,
          IsSystemTemplate,
          MaxCharacters,
          UsageCount,
          TotalShares,
          TotalClicks,
          ClickThroughRate,
          LastUsedDate,
          MarketID,
          LanguageID,
          CreatedDate,
          CreatedBy,
          UpdatedDate,
          UpdatedBy
        FROM dbo.ShareTemplate
        WHERE ShareTemplateID = @ShareTemplateID
      `);

    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Error getting template by ID:', error);
    throw error;
  }
}

/**
 * Get default template for a channel and content type
 */
export async function getDefaultTemplate(
  shareChannel: string,
  contentType?: string,
  socialPlatform?: string,
  marketId?: number,
  languageId?: number
): Promise<ShareTemplate | null> {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('ShareChannel', sql.NVarChar(20), shareChannel)
      .input('ContentType', sql.NVarChar(50), contentType || null)
      .input('SocialPlatform', sql.NVarChar(50), socialPlatform || null)
      .input('MarketID', sql.Int, marketId || null)
      .input('LanguageID', sql.Int, languageId || null)
      .execute('dbo.sp_GetDefaultTemplate');

    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Error getting default template:', error);
    throw error;
  }
}

/**
 * Create a new template
 */
export async function createTemplate(
  templateData: CreateTemplateDTO,
  createdBy: number
): Promise<ShareTemplate> {
  try {
    const pool = await getPool();

    // Validate character limit for SMS
    if (templateData.ShareChannel === 'SMS' && !templateData.MaxCharacters) {
      templateData.MaxCharacters = 160;
    }

    const result = await pool
      .request()
      .input('TemplateName', sql.NVarChar(100), templateData.TemplateName)
      .input('TemplateDescription', sql.NVarChar(500), templateData.TemplateDescription || null)
      .input('ShareChannel', sql.NVarChar(20), templateData.ShareChannel)
      .input('SocialPlatform', sql.NVarChar(50), templateData.SocialPlatform || null)
      .input('ContentType', sql.NVarChar(50), templateData.ContentType || null)
      .input('SubjectTemplate', sql.NVarChar(255), templateData.SubjectTemplate || null)
      .input('MessageTemplate', sql.NVarChar(sql.MAX), templateData.MessageTemplate)
      .input('HTMLTemplate', sql.NVarChar(sql.MAX), templateData.HTMLTemplate || null)
      .input('IsDefault', sql.Bit, templateData.IsDefault || false)
      .input('MaxCharacters', sql.Int, templateData.MaxCharacters || null)
      .input('MarketID', sql.Int, templateData.MarketID || null)
      .input('LanguageID', sql.Int, templateData.LanguageID || null)
      .input('CreatedBy', sql.BigInt, createdBy)
      .query(`
        INSERT INTO dbo.ShareTemplate (
          TemplateName, TemplateDescription, ShareChannel, SocialPlatform,
          ContentType, SubjectTemplate, MessageTemplate, HTMLTemplate,
          IsDefault, MaxCharacters, MarketID, LanguageID, CreatedBy, UpdatedBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @TemplateName, @TemplateDescription, @ShareChannel, @SocialPlatform,
          @ContentType, @SubjectTemplate, @MessageTemplate, @HTMLTemplate,
          @IsDefault, @MaxCharacters, @MarketID, @LanguageID, @CreatedBy, @CreatedBy
        )
      `);

    const newTemplate = result.recordset[0];

    // If this is set as default, update other templates
    if (templateData.IsDefault) {
      await setDefaultTemplate(
        newTemplate.ShareTemplateID,
        templateData.ShareChannel,
        templateData.ContentType,
        templateData.SocialPlatform
      );
    }

    logger.info(`Template created: ${newTemplate.ShareTemplateID}`);
    return newTemplate;
  } catch (error) {
    logger.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  templateId: number,
  templateData: UpdateTemplateDTO,
  updatedBy: number
): Promise<ShareTemplate | null> {
  try {
    const pool = await getPool();

    // Check if template exists and is not a system template
    const existing = await getTemplateById(templateId);
    if (!existing) {
      return null;
    }

    if (existing.IsSystemTemplate && templateData.IsActive === false) {
      throw new Error('System templates cannot be deactivated');
    }

    const updates: string[] = [];
    const request = pool.request();
    request.input('ShareTemplateID', sql.Int, templateId);
    request.input('UpdatedBy', sql.BigInt, updatedBy);

    if (templateData.TemplateName !== undefined) {
      updates.push('TemplateName = @TemplateName');
      request.input('TemplateName', sql.NVarChar(100), templateData.TemplateName);
    }

    if (templateData.TemplateDescription !== undefined) {
      updates.push('TemplateDescription = @TemplateDescription');
      request.input('TemplateDescription', sql.NVarChar(500), templateData.TemplateDescription);
    }

    if (templateData.SubjectTemplate !== undefined) {
      updates.push('SubjectTemplate = @SubjectTemplate');
      request.input('SubjectTemplate', sql.NVarChar(255), templateData.SubjectTemplate);
    }

    if (templateData.MessageTemplate !== undefined) {
      updates.push('MessageTemplate = @MessageTemplate');
      request.input('MessageTemplate', sql.NVarChar(sql.MAX), templateData.MessageTemplate);
    }

    if (templateData.HTMLTemplate !== undefined) {
      updates.push('HTMLTemplate = @HTMLTemplate');
      request.input('HTMLTemplate', sql.NVarChar(sql.MAX), templateData.HTMLTemplate);
    }

    if (templateData.IsDefault !== undefined) {
      updates.push('IsDefault = @IsDefault');
      request.input('IsDefault', sql.Bit, templateData.IsDefault);
    }

    if (templateData.IsActive !== undefined) {
      updates.push('IsActive = @IsActive');
      request.input('IsActive', sql.Bit, templateData.IsActive);
    }

    if (templateData.MaxCharacters !== undefined) {
      updates.push('MaxCharacters = @MaxCharacters');
      request.input('MaxCharacters', sql.Int, templateData.MaxCharacters);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('UpdatedBy = @UpdatedBy');
    updates.push('UpdatedDate = SYSDATETIME()');

    const result = await request.query(`
      UPDATE dbo.ShareTemplate
      SET ${updates.join(', ')}
      OUTPUT INSERTED.*
      WHERE ShareTemplateID = @ShareTemplateID
    `);

    const updatedTemplate = result.recordset[0];

    // If this is set as default, update other templates
    if (templateData.IsDefault && updatedTemplate) {
      await setDefaultTemplate(
        templateId,
        existing.ShareChannel,
        existing.ContentType,
        existing.SocialPlatform
      );
    }

    logger.info(`Template updated: ${templateId}`);
    return updatedTemplate;
  } catch (error) {
    logger.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: number): Promise<boolean> {
  try {
    const pool = await getPool();

    // Check if it's a system template
    const template = await getTemplateById(templateId);
    if (!template) {
      return false;
    }

    if (template.IsSystemTemplate) {
      throw new Error('System templates cannot be deleted');
    }

    const result = await pool
      .request()
      .input('ShareTemplateID', sql.Int, templateId)
      .query(`
        DELETE FROM dbo.ShareTemplate
        WHERE ShareTemplateID = @ShareTemplateID AND IsSystemTemplate = 0
      `);

    logger.info(`Template deleted: ${templateId}`);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * Set a template as default for its channel/content type
 */
export async function setDefaultTemplate(
  templateId: number,
  shareChannel: string,
  contentType?: string,
  socialPlatform?: string
): Promise<void> {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('ShareTemplateID', sql.Int, templateId)
      .input('ShareChannel', sql.NVarChar(20), shareChannel)
      .input('ContentType', sql.NVarChar(50), contentType || null)
      .input('SocialPlatform', sql.NVarChar(50), socialPlatform || null)
      .execute('dbo.sp_SetDefaultTemplate');

    logger.info(`Template ${templateId} set as default for ${shareChannel}`);
  } catch (error) {
    logger.error('Error setting default template:', error);
    throw error;
  }
}

/**
 * Extract variables from a template string
 */
export function extractVariables(template: string): string[] {
  const regex = /\{([a-zA-Z0-9_]+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Render a template with variables
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template;

  // Replace all variables
  Object.keys(variables).forEach((key) => {
    const value = variables[key] || '';
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  // Remove any unreplaced variables
  rendered = rendered.replace(/\{[a-zA-Z0-9_]+\}/g, '');

  return rendered.trim();
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  // Basic sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Preview a template with sample data
 */
export async function previewTemplate(
  previewRequest: TemplatePreviewRequest
): Promise<RenderTemplateResult> {
  try {
    let template: ShareTemplate | null = null;

    // Get template if ID provided
    if (previewRequest.ShareTemplateID) {
      template = await getTemplateById(previewRequest.ShareTemplateID);
      if (!template) {
        throw new Error('Template not found');
      }
    }

    // Use provided templates or template from DB
    const messageTemplate = previewRequest.MessageTemplate || template?.MessageTemplate || '';
    const subjectTemplate = previewRequest.SubjectTemplate || template?.SubjectTemplate;
    const htmlTemplate = previewRequest.HTMLTemplate || template?.HTMLTemplate;

    // Extract variables
    const variables = extractVariables(messageTemplate);
    if (subjectTemplate) {
      variables.push(...extractVariables(subjectTemplate));
    }
    if (htmlTemplate) {
      variables.push(...extractVariables(htmlTemplate));
    }

    // Render templates
    const message = renderTemplate(messageTemplate, previewRequest.Variables);
    const subject = subjectTemplate ? renderTemplate(subjectTemplate, previewRequest.Variables) : undefined;
    const html = htmlTemplate ? sanitizeHTML(renderTemplate(htmlTemplate, previewRequest.Variables)) : undefined;

    // Calculate character count
    const characterCount = message.length;
    const maxCharacters = template?.MaxCharacters || 0;
    const exceedsLimit = maxCharacters > 0 && characterCount > maxCharacters;

    return {
      subject,
      message,
      html,
      characterCount,
      exceedsLimit,
      variables: [...new Set(variables)],
    };
  } catch (error) {
    logger.error('Error previewing template:', error);
    throw error;
  }
}

/**
 * Get template performance metrics
 */
export async function getTemplatePerformance(
  filters?: {
    ShareChannel?: string;
    ContentType?: string;
    MinShares?: number;
  }
): Promise<TemplatePerformance[]> {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        ShareTemplateID,
        TemplateName,
        ShareChannel,
        ContentType,
        TotalShares,
        TotalClicks,
        ISNULL(ClickThroughRate, 0) as ClickThroughRate,
        UsageCount,
        LastUsedDate
      FROM dbo.ShareTemplate
      WHERE IsActive = 1
    `;

    if (filters?.ShareChannel) {
      query += ' AND ShareChannel = @ShareChannel';
      request.input('ShareChannel', sql.NVarChar(20), filters.ShareChannel);
    }

    if (filters?.ContentType) {
      query += ' AND ContentType = @ContentType';
      request.input('ContentType', sql.NVarChar(50), filters.ContentType);
    }

    if (filters?.MinShares) {
      query += ' AND TotalShares >= @MinShares';
      request.input('MinShares', sql.Int, filters.MinShares);
    }

    query += ' ORDER BY ClickThroughRate DESC, TotalShares DESC';

    const result = await request.query(query);
    return result.recordset as TemplatePerformance[];
  } catch (error) {
    logger.error('Error getting template performance:', error);
    throw error;
  }
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: number): Promise<void> {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('ShareTemplateID', sql.Int, templateId)
      .execute('dbo.sp_IncrementTemplateUsage');
  } catch (error) {
    logger.error('Error incrementing template usage:', error);
    throw error;
  }
}

/**
 * Update template performance metrics
 */
export async function updateTemplatePerformance(templateId: number): Promise<void> {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('ShareTemplateID', sql.Int, templateId)
      .execute('dbo.sp_UpdateTemplatePerformance');
  } catch (error) {
    logger.error('Error updating template performance:', error);
    throw error;
  }
}
