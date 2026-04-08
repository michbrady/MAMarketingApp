import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  ContentItemWithRelations,
  ContentCategory,
  ContentFilters,
  CreateContentRequest,
  UpdateContentRequest
} from '../types/content.types.js';

const logger = createLogger('ContentService');

export class ContentService {
  /**
   * Get content list with filters
   */
  async getContentList(filters: ContentFilters = {}): Promise<{
    items: ContentItemWithRelations[];
    total: number;
  }> {
    try {
      const {
        search,
        category,
        market,
        language,
        contentType,
        publishStatus = 'Published',
        isFeatured,
        campaignId,
        limit = 20,
        offset = 0
      } = filters;

      let whereClause = 'WHERE ci.PublishStatus = @publishStatus';
      const params: any = { publishStatus };

      // Add expiration check for published content
      if (publishStatus === 'Published') {
        whereClause += ' AND (ci.ExpirationDate IS NULL OR ci.ExpirationDate > SYSDATETIME())';
      }

      if (search) {
        whereClause += ' AND (ci.Title LIKE @searchPattern OR ci.Description LIKE @searchPattern)';
        params.searchPattern = `%${search}%`;
      }

      if (category) {
        whereClause += ' AND cic.ContentCategoryID = @category';
        params.category = category;
      }

      if (market) {
        whereClause += ' AND cim.MarketID IN (SELECT MarketID FROM Market WHERE MarketCode = @market)';
        params.market = market;
      }

      if (language) {
        whereClause += ' AND cil.LanguageID IN (SELECT LanguageID FROM Language WHERE LanguageCode = @language)';
        params.language = language;
      }

      if (contentType) {
        whereClause += ' AND ci.ContentType = @contentType';
        params.contentType = contentType;
      }

      if (isFeatured !== undefined) {
        whereClause += ' AND ci.IsFeatured = @isFeatured';
        params.isFeatured = isFeatured ? 1 : 0;
      }

      if (campaignId) {
        whereClause += ' AND cc.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }

      params.limit = limit;
      params.offset = offset;

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT ci.ContentItemID) AS Total
        FROM ContentItem ci
        LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID
        LEFT JOIN ContentItemMarket cim ON ci.ContentItemID = cim.ContentItemID
        LEFT JOIN ContentItemLanguage cil ON ci.ContentItemID = cil.ContentItemID
        LEFT JOIN CampaignContent cc ON ci.ContentItemID = cc.ContentItemID
        ${whereClause}
      `;

      const countResult = await query<{ Total: number }>(countQuery, params);
      const total = countResult[0]?.Total || 0;

      // Get items with details
      const itemsQuery = `
        SELECT DISTINCT
          ci.*,
          cc_cat.CategoryName,
          cc_cat.ContentCategoryID AS CategoryID,
          (
            SELECT STRING_AGG(ct.TagName, ',')
            FROM ContentItemTag cit
            JOIN ContentTag ct ON cit.ContentTagID = ct.ContentTagID
            WHERE cit.ContentItemID = ci.ContentItemID
          ) AS Tags,
          (
            SELECT STRING_AGG(m.MarketCode, ',')
            FROM ContentItemMarket cim_inner
            JOIN Market m ON cim_inner.MarketID = m.MarketID
            WHERE cim_inner.ContentItemID = ci.ContentItemID
          ) AS Markets,
          (
            SELECT STRING_AGG(l.LanguageCode, ',')
            FROM ContentItemLanguage cil_inner
            JOIN Language l ON cil_inner.LanguageID = l.LanguageID
            WHERE cil_inner.ContentItemID = ci.ContentItemID
          ) AS Languages
        FROM ContentItem ci
        LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
        LEFT JOIN ContentCategory cc_cat ON cic.ContentCategoryID = cc_cat.ContentCategoryID
        LEFT JOIN ContentItemMarket cim ON ci.ContentItemID = cim.ContentItemID
        LEFT JOIN ContentItemLanguage cil ON ci.ContentItemID = cil.ContentItemID
        LEFT JOIN CampaignContent cc ON ci.ContentItemID = cc.ContentItemID
        ${whereClause}
        ORDER BY
          ci.IsFeatured DESC,
          ci.FeaturedPriority DESC,
          ci.PublishDate DESC,
          ci.CreatedDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      const items = await query<ContentItemWithRelations>(itemsQuery, params);

      // Parse comma-separated strings into arrays and map to camelCase for frontend
      const processedItems = items.map(item => ({
        id: item.ContentItemID,
        title: item.Title,
        subtitle: item.Subtitle,
        description: item.Description,
        type: item.ContentType?.toLowerCase(),
        thumbnailUrl: item.ThumbnailURL,
        mediaUrl: item.MediaURL,
        destinationUrl: item.DestinationURL,
        mimeType: item.MIMEType,
        fileSize: item.FileSizeBytes,
        duration: item.DurationSeconds,
        publishStatus: item.PublishStatus,
        publishDate: item.PublishDate,
        expirationDate: item.ExpirationDate,
        allowSMS: item.AllowSMS,
        allowEmail: item.AllowEmail,
        allowSocial: item.AllowSocial,
        isFeatured: item.IsFeatured,
        featuredPriority: item.FeaturedPriority,
        category: item.CategoryID ? {
          id: item.CategoryID,
          name: item.CategoryName,
          slug: item.CategoryName?.toLowerCase().replace(/\s+/g, '-')
        } : null,
        tags: item.Tags && typeof item.Tags === 'string' ? item.Tags.split(',') : [],
        markets: item.Markets && typeof item.Markets === 'string' ? item.Markets.split(',') : [],
        languages: item.Languages && typeof item.Languages === 'string' ? item.Languages.split(',') : [],
        market: item.Markets && typeof item.Markets === 'string' ? item.Markets.split(',')[0] : 'US',
        language: item.Languages && typeof item.Languages === 'string' ? item.Languages.split(',')[0] : 'en',
        createdBy: item.CreatedBy,
        createdAt: item.CreatedDate,
        isActive: item.PublishStatus === 'Published'
      }));

      logger.info(`Retrieved ${items.length} content items (total: ${total})`);

      return {
        items: processedItems,
        total
      };

    } catch (error) {
      logger.error('Error getting content list:', error);
      throw error;
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(id: number): Promise<ContentItemWithRelations | null> {
    try {
      const items = await query<ContentItemWithRelations>(`
        SELECT
          ci.*,
          cc.CategoryName,
          cc.ContentCategoryID AS CategoryID,
          (
            SELECT STRING_AGG(ct.TagName, ',')
            FROM ContentItemTag cit
            JOIN ContentTag ct ON cit.ContentTagID = ct.ContentTagID
            WHERE cit.ContentItemID = ci.ContentItemID
          ) AS Tags,
          (
            SELECT STRING_AGG(m.MarketCode, ',')
            FROM ContentItemMarket cim
            JOIN Market m ON cim.MarketID = m.MarketID
            WHERE cim.ContentItemID = ci.ContentItemID
          ) AS Markets,
          (
            SELECT STRING_AGG(l.LanguageCode, ',')
            FROM ContentItemLanguage cil
            JOIN Language l ON cil.LanguageID = l.LanguageID
            WHERE cil.ContentItemID = ci.ContentItemID
          ) AS Languages,
          (
            SELECT TOP 1 c.CampaignName
            FROM CampaignContent ccamp
            JOIN Campaign c ON ccamp.CampaignID = c.CampaignID
            WHERE ccamp.ContentItemID = ci.ContentItemID
            ORDER BY c.StartDate DESC
          ) AS CampaignName,
          (
            SELECT TOP 1 c.CampaignID
            FROM CampaignContent ccamp
            JOIN Campaign c ON ccamp.CampaignID = c.CampaignID
            WHERE ccamp.ContentItemID = ci.ContentItemID
            ORDER BY c.StartDate DESC
          ) AS CampaignID
        FROM ContentItem ci
        LEFT JOIN ContentItemCategory cic ON ci.ContentItemID = cic.ContentItemID AND cic.IsPrimary = 1
        LEFT JOIN ContentCategory cc ON cic.ContentCategoryID = cc.ContentCategoryID
        WHERE ci.ContentItemID = @id
      `, { id });

      if (items.length === 0) {
        return null;
      }

      const item = items[0];

      // Map to camelCase for frontend
      const processedItem: any = {
        id: item.ContentItemID,
        title: item.Title,
        subtitle: item.Subtitle,
        description: item.Description,
        type: item.ContentType?.toLowerCase(),
        thumbnailUrl: item.ThumbnailURL,
        mediaUrl: item.MediaURL,
        destinationUrl: item.DestinationURL,
        mimeType: item.MIMEType,
        fileSize: item.FileSizeBytes,
        duration: item.DurationSeconds,
        publishStatus: item.PublishStatus,
        publishDate: item.PublishDate,
        expirationDate: item.ExpirationDate,
        allowSMS: item.AllowSMS,
        allowEmail: item.AllowEmail,
        allowSocial: item.AllowSocial,
        isFeatured: item.IsFeatured,
        featuredPriority: item.FeaturedPriority,
        category: item.CategoryID ? {
          id: item.CategoryID,
          name: item.CategoryName,
          slug: item.CategoryName?.toLowerCase().replace(/\s+/g, '-')
        } : null,
        tags: item.Tags && typeof item.Tags === 'string' ? item.Tags.split(',') : [],
        markets: item.Markets && typeof item.Markets === 'string' ? item.Markets.split(',') : [],
        languages: item.Languages && typeof item.Languages === 'string' ? item.Languages.split(',') : [],
        market: item.Markets && typeof item.Markets === 'string' ? item.Markets.split(',')[0] : 'US',
        language: item.Languages && typeof item.Languages === 'string' ? item.Languages.split(',')[0] : 'en',
        createdBy: item.CreatedBy,
        createdAt: item.CreatedDate,
        updatedAt: item.CreatedDate,
        viewCount: item.ViewCount || 0,
        shareCount: item.ShareCount || 0,
        isActive: item.PublishStatus === 'Published',
        campaign: item.CampaignID ? {
          id: item.CampaignID,
          name: item.CampaignName
        } : null
      };

      // Increment view count
      await query(`
        UPDATE ContentItem
        SET ViewCount = ViewCount + 1
        WHERE ContentItemID = @id
      `, { id });

      logger.info(`Retrieved content item: ${id}`);

      return processedItem;

    } catch (error) {
      logger.error(`Error getting content by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const categories = await query<any>(`
        SELECT
          ContentCategoryID,
          CategoryName,
          CategoryDescription,
          SortOrder,
          IsActive
        FROM ContentCategory
        WHERE IsActive = 1
        ORDER BY SortOrder, CategoryName
      `);

      // Map to frontend-friendly format with slug
      const mappedCategories = categories.map(cat => ({
        id: cat.ContentCategoryID,
        name: cat.CategoryName,
        slug: cat.CategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        description: cat.CategoryDescription,
        sortOrder: cat.SortOrder
      }));

      logger.info(`Retrieved ${mappedCategories.length} categories`);

      return mappedCategories;

    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get all categories (including inactive - for admin)
   */
  async getAllCategories(): Promise<ContentCategory[]> {
    try {
      const categories = await query<ContentCategory>(`
        SELECT
          ContentCategoryID,
          CategoryName,
          CategoryDescription AS Description,
          SortOrder,
          IsActive,
          CreatedDate,
          UpdatedDate
        FROM ContentCategory
        ORDER BY SortOrder, CategoryName
      `);

      logger.info(`Retrieved ${categories.length} categories (including inactive)`);

      return categories;

    } catch (error) {
      logger.error('Error getting all categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(data: {
    categoryName: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ContentCategory> {
    try {
      logger.info('Creating category:', data.categoryName);

      const result = await query<any>(`
        INSERT INTO ContentCategory (CategoryName, CategoryDescription, SortOrder, IsActive)
        OUTPUT
          INSERTED.ContentCategoryID,
          INSERTED.CategoryName,
          INSERTED.CategoryDescription AS Description,
          INSERTED.SortOrder,
          INSERTED.IsActive,
          INSERTED.CreatedDate,
          INSERTED.UpdatedDate
        VALUES (@categoryName, @description, @sortOrder, @isActive)
      `, {
        categoryName: data.categoryName,
        description: data.description || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== false
      });

      logger.info(`Category created: ${result[0].ContentCategoryID}`);

      return result[0];

    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update a category
   */
  async updateCategory(id: number, data: {
    categoryName?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ContentCategory> {
    try {
      logger.info(`Updating category: ${id}`);

      // Build dynamic UPDATE query
      const updates: string[] = [];
      const params: any = { id };

      if (data.categoryName !== undefined) {
        updates.push('CategoryName = @categoryName');
        params.categoryName = data.categoryName;
      }
      if (data.description !== undefined) {
        updates.push('CategoryDescription = @description');
        params.description = data.description;
      }
      if (data.sortOrder !== undefined) {
        updates.push('SortOrder = @sortOrder');
        params.sortOrder = data.sortOrder;
      }
      if (data.isActive !== undefined) {
        updates.push('IsActive = @isActive');
        params.isActive = data.isActive;
      }

      if (updates.length === 0) {
        // No fields to update, just return the existing category
        const existing = await query<any>(`
          SELECT
            ContentCategoryID,
            CategoryName,
            CategoryDescription AS Description,
            SortOrder,
            IsActive,
            CreatedDate,
            UpdatedDate
          FROM ContentCategory
          WHERE ContentCategoryID = @id
        `, { id });
        if (existing.length === 0) {
          throw new Error('Category not found');
        }
        return existing[0];
      }

      const result = await query<any>(`
        UPDATE ContentCategory
        SET ${updates.join(', ')}
        OUTPUT
          INSERTED.ContentCategoryID,
          INSERTED.CategoryName,
          INSERTED.CategoryDescription AS Description,
          INSERTED.SortOrder,
          INSERTED.IsActive,
          INSERTED.CreatedDate,
          INSERTED.UpdatedDate
        WHERE ContentCategoryID = @id
      `, params);

      if (result.length === 0) {
        throw new Error('Category not found');
      }

      logger.info(`Category updated: ${id}`);

      return result[0];

    } catch (error) {
      logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      logger.info(`Deleting category: ${id}`);

      // Check if category is in use
      const contentCount = await query<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM ContentItemCategory
        WHERE ContentCategoryID = @id
      `, { id });

      if (contentCount[0].count > 0) {
        throw new Error('Cannot delete category that is in use by content items');
      }

      await query(`
        DELETE FROM ContentCategory
        WHERE ContentCategoryID = @id
      `, { id });

      logger.info(`Category deleted: ${id}`);

    } catch (error) {
      logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(limit: number = 10): Promise<ContentItemWithRelations[]> {
    try {
      const { items } = await this.getContentList({
        isFeatured: true,
        publishStatus: 'Published',
        limit
      });

      logger.info(`Retrieved ${items.length} featured items`);

      return items;

    } catch (error) {
      logger.error('Error getting featured content:', error);
      throw error;
    }
  }

  /**
   * Get recent content
   */
  async getRecentContent(limit: number = 10): Promise<ContentItemWithRelations[]> {
    try {
      const { items } = await this.getContentList({
        publishStatus: 'Published',
        limit
      });

      logger.info(`Retrieved ${items.length} recent items`);

      return items;

    } catch (error) {
      logger.error('Error getting recent content:', error);
      throw error;
    }
  }

  /**
   * Search content
   */
  async searchContent(query: string, limit: number = 20): Promise<ContentItemWithRelations[]> {
    try {
      const { items } = await this.getContentList({
        search: query,
        publishStatus: 'Published',
        limit
      });

      logger.info(`Search for "${query}" returned ${items.length} items`);

      return items;

    } catch (error) {
      logger.error(`Error searching content for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Create new content (admin only)
   */
  async createContent(data: CreateContentRequest, userId: number): Promise<ContentItemWithRelations> {
    try {
      logger.info(`Creating content: ${data.title}`);

      // Insert content item
      const result = await query<{ ContentItemID: number }>(`
        INSERT INTO ContentItem (
          Title, Subtitle, Description,
          ThumbnailURL, MediaURL, DestinationURL,
          ContentType, MIMEType, FileSizeBytes, DurationSeconds,
          ExternalContentID,
          PublishStatus, PublishDate, ExpirationDate,
          AllowSMS, AllowEmail, AllowSocial, AllowPersonalNote,
          CTAType, CTALabel,
          RequiresDisclaimer, DisclaimerText, IsRegulatedContent,
          IsFeatured, FeaturedPriority,
          CreatedBy, UpdatedBy
        )
        OUTPUT INSERTED.ContentItemID
        VALUES (
          @title, @subtitle, @description,
          @thumbnailURL, @mediaURL, @destinationURL,
          @contentType, @mimeType, @fileSizeBytes, @durationSeconds,
          @externalContentID,
          @publishStatus, @publishDate, @expirationDate,
          @allowSMS, @allowEmail, @allowSocial, @allowPersonalNote,
          @ctaType, @ctaLabel,
          @requiresDisclaimer, @disclaimerText, @isRegulatedContent,
          @isFeatured, @featuredPriority,
          @userId, @userId
        )
      `, {
        title: data.title,
        subtitle: data.subtitle || null,
        description: data.description || null,
        thumbnailURL: data.thumbnailURL || null,
        mediaURL: data.mediaURL || null,
        destinationURL: data.destinationURL || null,
        contentType: data.contentType,
        mimeType: data.mimeType || null,
        fileSizeBytes: data.fileSizeBytes || null,
        durationSeconds: data.durationSeconds || null,
        externalContentID: data.externalContentID || null,
        publishStatus: data.publishStatus || 'Draft',
        publishDate: data.publishDate || null,
        expirationDate: data.expirationDate || null,
        allowSMS: data.allowSMS !== undefined ? data.allowSMS : true,
        allowEmail: data.allowEmail !== undefined ? data.allowEmail : true,
        allowSocial: data.allowSocial !== undefined ? data.allowSocial : true,
        allowPersonalNote: data.allowPersonalNote !== undefined ? data.allowPersonalNote : true,
        ctaType: data.ctaType || null,
        ctaLabel: data.ctaLabel || null,
        requiresDisclaimer: data.requiresDisclaimer || false,
        disclaimerText: data.disclaimerText || null,
        isRegulatedContent: data.isRegulatedContent || false,
        isFeatured: data.isFeatured || false,
        featuredPriority: data.featuredPriority || 0,
        userId
      });

      const contentItemId = result[0].ContentItemID;

      // Add categories
      if (data.categoryIds && data.categoryIds.length > 0) {
        for (let i = 0; i < data.categoryIds.length; i++) {
          await query(`
            INSERT INTO ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary)
            VALUES (@contentItemId, @categoryId, @isPrimary)
          `, {
            contentItemId,
            categoryId: data.categoryIds[i],
            isPrimary: i === 0 ? 1 : 0
          });
        }
      }

      // Add tags
      if (data.tagIds && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          await query(`
            INSERT INTO ContentItemTag (ContentItemID, ContentTagID)
            VALUES (@contentItemId, @tagId)
          `, { contentItemId, tagId });
        }
      }

      // Add markets
      if (data.marketIds && data.marketIds.length > 0) {
        for (const marketId of data.marketIds) {
          await query(`
            INSERT INTO ContentItemMarket (ContentItemID, MarketID)
            VALUES (@contentItemId, @marketId)
          `, { contentItemId, marketId });
        }
      }

      // Add languages
      if (data.languageIds && data.languageIds.length > 0) {
        for (const languageId of data.languageIds) {
          await query(`
            INSERT INTO ContentItemLanguage (ContentItemID, LanguageID)
            VALUES (@contentItemId, @languageId)
          `, { contentItemId, languageId });
        }
      }

      // Add to campaigns
      if (data.campaignIds && data.campaignIds.length > 0) {
        for (const campaignId of data.campaignIds) {
          await query(`
            INSERT INTO CampaignContent (CampaignID, ContentItemID)
            VALUES (@campaignId, @contentItemId)
          `, { campaignId, contentItemId });
        }
      }

      logger.info(`Content created successfully: ${contentItemId}`);

      // Fetch and return the created content
      const content = await this.getContentById(contentItemId);
      return content!;

    } catch (error) {
      logger.error('Error creating content:', error);
      throw error;
    }
  }

  /**
   * Update content (admin only)
   */
  async updateContent(data: UpdateContentRequest, userId: number): Promise<ContentItemWithRelations> {
    try {
      logger.info(`Updating content: ${data.contentItemId}`);

      const updateFields: string[] = [];
      const params: any = { contentItemId: data.contentItemId, userId };

      // Build dynamic update query
      if (data.title !== undefined) {
        updateFields.push('Title = @title');
        params.title = data.title;
      }
      if (data.subtitle !== undefined) {
        updateFields.push('Subtitle = @subtitle');
        params.subtitle = data.subtitle;
      }
      if (data.description !== undefined) {
        updateFields.push('Description = @description');
        params.description = data.description;
      }
      if (data.thumbnailURL !== undefined) {
        updateFields.push('ThumbnailURL = @thumbnailURL');
        params.thumbnailURL = data.thumbnailURL;
      }
      if (data.mediaURL !== undefined) {
        updateFields.push('MediaURL = @mediaURL');
        params.mediaURL = data.mediaURL;
      }
      if (data.destinationURL !== undefined) {
        updateFields.push('DestinationURL = @destinationURL');
        params.destinationURL = data.destinationURL;
      }
      if (data.contentType !== undefined) {
        updateFields.push('ContentType = @contentType');
        params.contentType = data.contentType;
      }
      if (data.publishStatus !== undefined) {
        updateFields.push('PublishStatus = @publishStatus');
        params.publishStatus = data.publishStatus;
      }
      if (data.publishDate !== undefined) {
        updateFields.push('PublishDate = @publishDate');
        params.publishDate = data.publishDate;
      }
      if (data.expirationDate !== undefined) {
        updateFields.push('ExpirationDate = @expirationDate');
        params.expirationDate = data.expirationDate;
      }
      if (data.isFeatured !== undefined) {
        updateFields.push('IsFeatured = @isFeatured');
        params.isFeatured = data.isFeatured;
      }
      if (data.featuredPriority !== undefined) {
        updateFields.push('FeaturedPriority = @featuredPriority');
        params.featuredPriority = data.featuredPriority;
      }
      if (data.ctaType !== undefined) {
        updateFields.push('CTAType = @ctaType');
        params.ctaType = data.ctaType;
      }
      if (data.ctaLabel !== undefined) {
        updateFields.push('CTALabel = @ctaLabel');
        params.ctaLabel = data.ctaLabel;
      }

      if (updateFields.length > 0) {
        updateFields.push('UpdatedDate = SYSDATETIME()');
        updateFields.push('UpdatedBy = @userId');

        await query(`
          UPDATE ContentItem
          SET ${updateFields.join(', ')}
          WHERE ContentItemID = @contentItemId
        `, params);
      }

      // Update categories if provided
      if (data.categoryIds !== undefined) {
        await query(`DELETE FROM ContentItemCategory WHERE ContentItemID = @contentItemId`, params);
        for (let i = 0; i < data.categoryIds.length; i++) {
          await query(`
            INSERT INTO ContentItemCategory (ContentItemID, ContentCategoryID, IsPrimary)
            VALUES (@contentItemId, @categoryId, @isPrimary)
          `, {
            contentItemId: data.contentItemId,
            categoryId: data.categoryIds[i],
            isPrimary: i === 0 ? 1 : 0
          });
        }
      }

      // Update tags if provided
      if (data.tagIds !== undefined) {
        await query(`DELETE FROM ContentItemTag WHERE ContentItemID = @contentItemId`, params);
        for (const tagId of data.tagIds) {
          await query(`
            INSERT INTO ContentItemTag (ContentItemID, ContentTagID)
            VALUES (@contentItemId, @tagId)
          `, { contentItemId: data.contentItemId, tagId });
        }
      }

      // Update markets if provided
      if (data.marketIds !== undefined) {
        await query(`DELETE FROM ContentItemMarket WHERE ContentItemID = @contentItemId`, params);
        for (const marketId of data.marketIds) {
          await query(`
            INSERT INTO ContentItemMarket (ContentItemID, MarketID)
            VALUES (@contentItemId, @marketId)
          `, { contentItemId: data.contentItemId, marketId });
        }
      }

      // Update languages if provided
      if (data.languageIds !== undefined) {
        await query(`DELETE FROM ContentItemLanguage WHERE ContentItemID = @contentItemId`, params);
        for (const languageId of data.languageIds) {
          await query(`
            INSERT INTO ContentItemLanguage (ContentItemID, LanguageID)
            VALUES (@contentItemId, @languageId)
          `, { contentItemId: data.contentItemId, languageId });
        }
      }

      logger.info(`Content updated successfully: ${data.contentItemId}`);

      // Fetch and return the updated content
      const content = await this.getContentById(data.contentItemId);
      return content!;

    } catch (error) {
      logger.error('Error updating content:', error);
      throw error;
    }
  }

  /**
   * Delete content (admin only)
   */
  async deleteContent(id: number): Promise<boolean> {
    try {
      logger.info(`Deleting content: ${id}`);

      // Soft delete by archiving
      await query(`
        UPDATE ContentItem
        SET PublishStatus = 'Archived',
            UpdatedDate = SYSDATETIME()
        WHERE ContentItemID = @id
      `, { id });

      logger.info(`Content archived successfully: ${id}`);

      return true;

    } catch (error) {
      logger.error(`Error deleting content ${id}:`, error);
      throw error;
    }
  }

  /**
   * Increment view count for content
   */
  async incrementViewCount(id: number): Promise<void> {
    try {
      await query(`
        UPDATE ContentItem
        SET ViewCount = ViewCount + 1
        WHERE ContentItemID = @id
      `, { id });

      logger.debug(`Incremented view count for content: ${id}`);
    } catch (error) {
      logger.error(`Error incrementing view count for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Increment share count for content
   */
  async incrementShareCount(id: number): Promise<void> {
    try {
      await query(`
        UPDATE ContentItem
        SET ShareCount = ShareCount + 1
        WHERE ContentItemID = @id
      `, { id });

      logger.debug(`Incremented share count for content: ${id}`);
    } catch (error) {
      logger.error(`Error incrementing share count for ${id}:`, error);
      throw error;
    }
  }
}

export default new ContentService();
