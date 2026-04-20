import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ContentModerationService');

interface Content {
  contentId: number;
  title: string;
  description: string;
  contentType: string;
  approvalStatus: string;
  approvedBy?: number;
  approvedDate?: Date;
  rejectedBy?: number;
  rejectedDate?: Date;
  rejectionReason?: string;
  isFeatured: boolean;
  featuredBy?: number;
  featuredDate?: Date;
}

export class ContentModerationService {
  /**
   * Get content pending approval
   */
  async getPendingContent(): Promise<Content[]> {
    try {
      logger.info('Getting pending content');

      const results = await query<any>(`
        SELECT
          ContentItemID,
          Title,
          Description,
          ThumbnailURL,
          ContentType,
          PublishStatus,
          CreatedBy,
          CreatedDate
        FROM ContentItem
        WHERE PublishStatus = 'Review'
        ORDER BY CreatedDate DESC
      `);

      return results.map((row: any) => ({
        ContentItemID: row.ContentItemID,
        Title: row.Title,
        Description: row.Description,
        ThumbnailURL: row.ThumbnailURL,
        ContentType: row.ContentType,
        PublishStatus: row.PublishStatus,
        IsFeatured: false,
        CreatedDate: row.CreatedDate
      }));
    } catch (error) {
      logger.error('Error getting pending content:', error);
      throw error;
    }
  }

  /**
   * Get all content with moderation info
   */
  async getAllContent(status?: string): Promise<Content[]> {
    try {
      logger.info('Getting all content');

      let sql = `
        SELECT
          ContentItemID,
          Title,
          Subtitle,
          Description,
          ThumbnailURL,
          ContentType,
          PublishStatus,
          IsFeatured,
          FeaturedPriority,
          CreatedBy,
          CreatedDate
        FROM ContentItem
      `;

      if (status) {
        sql += ` WHERE PublishStatus = @status`;
      }

      sql += ` ORDER BY CreatedDate DESC`;

      const results = await query<any>(sql, { status: status || null });

      // Return with PascalCase to match frontend expectations
      return results.map((row: any) => ({
        ContentItemID: row.ContentItemID,
        Title: row.Title,
        Subtitle: row.Subtitle,
        Description: row.Description,
        ThumbnailURL: row.ThumbnailURL,
        ContentType: row.ContentType,
        PublishStatus: row.PublishStatus,
        IsFeatured: row.IsFeatured || false,
        FeaturedPriority: row.FeaturedPriority,
        CreatedDate: row.CreatedDate
      }));
    } catch (error) {
      logger.error('Error getting all content:', error);
      throw error;
    }
  }

  /**
   * Approve content
   */
  async approveContent(contentId: number, approvedBy: number): Promise<Content> {
    try {
      logger.info(`Approving content: ${contentId}`);

      const results = await query<any>(`
        UPDATE ContentItem
        SET PublishStatus = 'Published',
            PublishDate = SYSDATETIME(),
            UpdatedBy = @approvedBy,
            UpdatedDate = SYSDATETIME()
        OUTPUT
          INSERTED.ContentItemID,
          INSERTED.Title,
          INSERTED.PublishStatus,
          INSERTED.PublishDate
        WHERE ContentItemID = @contentId
      `, { contentId, approvedBy });

      if (results.length === 0) {
        throw new Error('Content not found');
      }

      const row = results[0];
      return {
        contentId: row.ContentItemID,
        title: row.Title,
        description: '',
        contentType: '',
        approvalStatus: row.PublishStatus,
        approvedBy,
        approvedDate: row.PublishDate,
        isFeatured: false
      };
    } catch (error) {
      logger.error(`Error approving content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Reject content
   */
  async rejectContent(contentId: number, reason: string, rejectedBy: number): Promise<Content> {
    try {
      logger.info(`Rejecting content: ${contentId}`);

      const results = await query<any>(`
        EXEC usp_RejectContent
          @ContentItemID = @contentId,
          @RejectedBy = @rejectedBy,
          @RejectionReason = @reason
      `, {
        contentId,
        rejectedBy,
        reason
      });

      if (results.length === 0) {
        throw new Error('Content not found');
      }

      const row = results[0];
      return {
        contentId: row.ContentItemID,
        title: row.Title,
        description: '',
        contentType: '',
        approvalStatus: row.ApprovalStatus,
        rejectedBy: row.RejectedBy,
        rejectedDate: row.RejectedDate,
        rejectionReason: row.RejectionReason,
        isFeatured: false
      };
    } catch (error) {
      logger.error(`Error rejecting content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Feature content
   */
  async featureContent(contentId: number, featuredBy: number): Promise<Content> {
    try {
      logger.info(`Featuring content: ${contentId}`);

      const results = await query<any>(`
        EXEC usp_FeatureContent
          @ContentItemID = @contentId,
          @FeaturedBy = @featuredBy
      `, {
        contentId,
        featuredBy
      });

      if (results.length === 0) {
        throw new Error('Content not found');
      }

      const row = results[0];
      return {
        contentId: row.ContentItemID,
        title: row.Title,
        description: '',
        contentType: '',
        approvalStatus: 'Approved',
        isFeatured: row.IsFeatured,
        featuredBy: row.FeaturedBy,
        featuredDate: row.FeaturedDate
      };
    } catch (error) {
      logger.error(`Error featuring content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Unfeature content
   */
  async unfeatureContent(contentId: number, _unfeaturedBy: number): Promise<Content> {
    try {
      logger.info(`Unfeaturing content: ${contentId}`);

      const results = await query<any>(`
        EXEC usp_UnfeatureContent
          @ContentItemID = @contentId
      `, {
        contentId
      });

      if (results.length === 0) {
        throw new Error('Content not found');
      }

      const row = results[0];
      return {
        contentId: row.ContentItemID,
        title: row.Title,
        description: '',
        contentType: '',
        approvalStatus: 'Approved',
        isFeatured: row.IsFeatured
      };
    } catch (error) {
      logger.error(`Error unfeaturing content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk approve content
   */
  async bulkApprove(contentIds: number[], approvedBy: number): Promise<Content[]> {
    try {
      logger.info(`Bulk approving ${contentIds.length} content items`);

      const approved: Content[] = [];

      for (const contentId of contentIds) {
        const content = await this.approveContent(contentId, approvedBy);
        approved.push(content);
      }

      return approved;
    } catch (error) {
      logger.error('Error bulk approving content:', error);
      throw error;
    }
  }

  /**
   * Bulk reject content
   */
  async bulkReject(contentIds: number[], reason: string, rejectedBy: number): Promise<Content[]> {
    try {
      logger.info(`Bulk rejecting ${contentIds.length} content items`);

      const rejected: Content[] = [];

      for (const contentId of contentIds) {
        const content = await this.rejectContent(contentId, reason, rejectedBy);
        rejected.push(content);
      }

      return rejected;
    } catch (error) {
      logger.error('Error bulk rejecting content:', error);
      throw error;
    }
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(): Promise<Content[]> {
    try {
      logger.info('Getting featured content');

      const results = await query<any>(`
        SELECT
          ContentItemID,
          Title,
          Description,
          ThumbnailURL,
          ContentType,
          PublishStatus,
          IsFeatured,
          FeaturedPriority,
          CreatedDate
        FROM ContentItem
        WHERE IsFeatured = 1
        ORDER BY FeaturedPriority DESC, CreatedDate DESC
      `);

      return results.map((row: any) => ({
        ContentItemID: row.ContentItemID,
        Title: row.Title,
        Description: row.Description,
        ThumbnailURL: row.ThumbnailURL,
        ContentType: row.ContentType,
        PublishStatus: row.PublishStatus,
        IsFeatured: row.IsFeatured,
        FeaturedPriority: row.FeaturedPriority,
        CreatedDate: row.CreatedDate
      }));
    } catch (error) {
      logger.error('Error getting featured content:', error);
      throw error;
    }
  }
}

export default new ContentModerationService();
