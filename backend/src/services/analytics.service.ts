import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  ShareAnalyticsFilters,
  SharePerformanceMetrics,
  ShareTrendDataPoint,
  ChannelPerformance,
  TopContentItem,
  TopSharer,
  ShareEventDetail,
  EngagementEventCreate
} from '../types/analytics.types.js';

const logger = createLogger('AnalyticsService');

export class AnalyticsService {
  /**
   * Get share performance overview with aggregated metrics
   */
  async getSharePerformance(filters: ShareAnalyticsFilters = {}): Promise<SharePerformanceMetrics> {
    try {
      const {
        userId,
        contentId,
        campaignId,
        channel,
        marketCode,
        startDate,
        endDate
      } = filters;

      let whereClause = '1=1';
      const params: any = {};

      if (userId) {
        whereClause += ' AND se.UserID = @userId';
        params.userId = userId;
      }
      if (contentId) {
        whereClause += ' AND se.ContentItemID = @contentId';
        params.contentId = contentId;
      }
      if (campaignId) {
        whereClause += ' AND se.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }
      if (channel) {
        whereClause += ' AND se.ShareChannel = @channel';
        params.channel = channel;
      }
      if (marketCode) {
        whereClause += ' AND m.MarketCode = @marketCode';
        params.marketCode = marketCode;
      }
      if (startDate) {
        whereClause += ' AND se.ShareDate >= @startDate';
        params.startDate = startDate;
      }
      if (endDate) {
        whereClause += ' AND se.ShareDate <= @endDate';
        params.endDate = endDate;
      }

      const sql = `
        WITH ChannelStats AS (
          SELECT TOP 1
            se.ShareChannel,
            COUNT(*) as ShareCount
          FROM dbo.ShareEvent se
          INNER JOIN dbo.[User] u ON se.UserID = u.UserID
          INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
          WHERE ${whereClause}
          GROUP BY se.ShareChannel
          ORDER BY COUNT(*) DESC
        )
        SELECT
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          ISNULL(SUM(se.UniqueClickCount), 0) as UniqueClicks,
          ISNULL(SUM(se.RecipientCount), 0) as TotalRecipients,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as ClickThroughRate,
          CASE
            WHEN COUNT(DISTINCT se.ShareEventID) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
            ELSE 0
          END as AverageClicksPerShare,
          ISNULL((SELECT TOP 1 ShareChannel FROM ChannelStats), 'N/A') as TopChannel,
          ISNULL((SELECT TOP 1 ShareCount FROM ChannelStats), 0) as TopChannelShares
        FROM dbo.ShareEvent se
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
      `;

      const result = await query<any>(sql, params);
      const row = result[0];

      return {
        totalShares: row.TotalShares || 0,
        totalClicks: row.TotalClicks || 0,
        uniqueClicks: row.UniqueClicks || 0,
        totalRecipients: row.TotalRecipients || 0,
        clickThroughRate: parseFloat((row.ClickThroughRate || 0).toFixed(2)),
        averageClicksPerShare: parseFloat((row.AverageClicksPerShare || 0).toFixed(2)),
        topChannel: row.TopChannel || 'N/A',
        topChannelShares: row.TopChannelShares || 0
      };
    } catch (error) {
      logger.error('Error getting share performance:', error);
      throw error;
    }
  }

  /**
   * Get share trends over time
   */
  async getShareTrends(
    dateRange: { startDate: Date; endDate: Date },
    groupBy: 'day' | 'week' | 'month' = 'day',
    filters: ShareAnalyticsFilters = {}
  ): Promise<ShareTrendDataPoint[]> {
    try {
      const { userId, contentId, campaignId, channel, marketCode } = filters;
      let whereClause = '1=1';
      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      if (userId) {
        whereClause += ' AND se.UserID = @userId';
        params.userId = userId;
      }
      if (contentId) {
        whereClause += ' AND se.ContentItemID = @contentId';
        params.contentId = contentId;
      }
      if (campaignId) {
        whereClause += ' AND se.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }
      if (channel) {
        whereClause += ' AND se.ShareChannel = @channel';
        params.channel = channel;
      }
      if (marketCode) {
        whereClause += ' AND m.MarketCode = @marketCode';
        params.marketCode = marketCode;
      }

      const dateFormat = groupBy === 'day' ? 'CAST(se.ShareDate AS DATE)' :
                        groupBy === 'week' ? 'DATEADD(week, DATEDIFF(week, 0, se.ShareDate), 0)' :
                        'DATEADD(month, DATEDIFF(month, 0, se.ShareDate), 0)';

      const sql = `
        SELECT
          CONVERT(VARCHAR(10), ${dateFormat}, 23) as ShareDate,
          COUNT(DISTINCT se.ShareEventID) as Shares,
          ISNULL(SUM(se.ClickCount), 0) as Clicks,
          ISNULL(SUM(se.UniqueClickCount), 0) as UniqueClicks,
          ISNULL(SUM(se.RecipientCount), 0) as Recipients
        FROM dbo.ShareEvent se
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
          AND se.ShareDate >= @startDate
          AND se.ShareDate <= @endDate
        GROUP BY ${dateFormat}
        ORDER BY ${dateFormat}
      `;

      const result = await query<any>(sql, params);

      return result.map((row: any) => ({
        date: row.ShareDate,
        shares: row.Shares || 0,
        clicks: row.Clicks || 0,
        uniqueClicks: row.UniqueClicks || 0,
        recipients: row.Recipients || 0
      }));
    } catch (error) {
      logger.error('Error getting share trends:', error);
      throw error;
    }
  }

  /**
   * Get performance breakdown by channel
   */
  async getChannelPerformance(filters: ShareAnalyticsFilters = {}): Promise<ChannelPerformance[]> {
    try {
      const { userId, contentId, campaignId, marketCode, startDate, endDate } = filters;
      let whereClause = '1=1';
      const params: any = {};

      if (userId) {
        whereClause += ' AND se.UserID = @userId';
        params.userId = userId;
      }
      if (contentId) {
        whereClause += ' AND se.ContentItemID = @contentId';
        params.contentId = contentId;
      }
      if (campaignId) {
        whereClause += ' AND se.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }
      if (marketCode) {
        whereClause += ' AND m.MarketCode = @marketCode';
        params.marketCode = marketCode;
      }
      if (startDate) {
        whereClause += ' AND se.ShareDate >= @startDate';
        params.startDate = startDate;
      }
      if (endDate) {
        whereClause += ' AND se.ShareDate <= @endDate';
        params.endDate = endDate;
      }

      const sql = `
        SELECT
          se.ShareChannel as Channel,
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          ISNULL(SUM(se.UniqueClickCount), 0) as UniqueClicks,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as ClickThroughRate,
          CASE
            WHEN COUNT(DISTINCT se.ShareEventID) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
            ELSE 0
          END as AverageClicksPerShare
        FROM dbo.ShareEvent se
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
        GROUP BY se.ShareChannel
        ORDER BY TotalShares DESC
      `;

      const result = await query<any>(sql, params);

      return result.map((row: any) => ({
        channel: row.Channel,
        totalShares: row.TotalShares || 0,
        totalClicks: row.TotalClicks || 0,
        uniqueClicks: row.UniqueClicks || 0,
        clickThroughRate: parseFloat((row.ClickThroughRate || 0).toFixed(2)),
        averageClicksPerShare: parseFloat((row.AverageClicksPerShare || 0).toFixed(2))
      }));
    } catch (error) {
      logger.error('Error getting channel performance:', error);
      throw error;
    }
  }

  /**
   * Get top performing content
   */
  async getTopSharedContent(
    limit: number = 10,
    dateRange?: { startDate: Date; endDate: Date },
    filters: ShareAnalyticsFilters = {}
  ): Promise<TopContentItem[]> {
    try {
      const { userId, campaignId, channel, marketCode } = filters;
      let whereClause = '1=1';
      const params: any = { limit };

      if (userId) {
        whereClause += ' AND se.UserID = @userId';
        params.userId = userId;
      }
      if (campaignId) {
        whereClause += ' AND se.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }
      if (channel) {
        whereClause += ' AND se.ShareChannel = @channel';
        params.channel = channel;
      }
      if (marketCode) {
        whereClause += ' AND m.MarketCode = @marketCode';
        params.marketCode = marketCode;
      }
      if (dateRange?.startDate) {
        whereClause += ' AND se.ShareDate >= @startDate';
        params.startDate = dateRange.startDate;
      }
      if (dateRange?.endDate) {
        whereClause += ' AND se.ShareDate <= @endDate';
        params.endDate = dateRange.endDate;
      }

      const sql = `
        SELECT TOP (@limit)
          ci.ContentItemID,
          ci.Title,
          ci.ContentType,
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          COUNT(DISTINCT se.UserID) as UniqueSharers,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as ClickThroughRate,
          MAX(se.ShareDate) as LastSharedDate
        FROM dbo.ContentItem ci
        INNER JOIN dbo.ShareEvent se ON ci.ContentItemID = se.ContentItemID
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
        GROUP BY ci.ContentItemID, ci.Title, ci.ContentType
        ORDER BY TotalShares DESC, TotalClicks DESC
      `;

      const result = await query<any>(sql, params);

      return result.map((row: any) => ({
        contentItemId: row.ContentItemID,
        title: row.Title,
        contentType: row.ContentType,
        totalShares: row.TotalShares || 0,
        uniqueSharers: row.UniqueSharers || 0,
        totalClicks: row.TotalClicks || 0,
        clickThroughRate: parseFloat((row.ClickThroughRate || 0).toFixed(2)),
        lastSharedDate: row.LastSharedDate
      }));
    } catch (error) {
      logger.error('Error getting top shared content:', error);
      throw error;
    }
  }

  /**
   * Get top sharers (leaderboard)
   */
  async getTopSharers(
    limit: number = 10,
    dateRange?: { startDate: Date; endDate: Date },
    filters: ShareAnalyticsFilters = {}
  ): Promise<TopSharer[]> {
    try {
      const { contentId, campaignId, channel, marketCode } = filters;
      let whereClause = '1=1';
      const params: any = { limit };

      if (contentId) {
        whereClause += ' AND se.ContentItemID = @contentId';
        params.contentId = contentId;
      }
      if (campaignId) {
        whereClause += ' AND se.CampaignID = @campaignId';
        params.campaignId = campaignId;
      }
      if (channel) {
        whereClause += ' AND se.ShareChannel = @channel';
        params.channel = channel;
      }
      if (marketCode) {
        whereClause += ' AND m.MarketCode = @marketCode';
        params.marketCode = marketCode;
      }
      if (dateRange?.startDate) {
        whereClause += ' AND se.ShareDate >= @startDate';
        params.startDate = dateRange.startDate;
      }
      if (dateRange?.endDate) {
        whereClause += ' AND se.ShareDate <= @endDate';
        params.endDate = dateRange.endDate;
      }

      const sql = `
        SELECT TOP (@limit)
          u.UserID,
          u.MemberID,
          u.FirstName + ' ' + u.LastName as Name,
          u.Email,
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          COUNT(DISTINCT se.ContentItemID) as UniqueContent,
          CASE
            WHEN COUNT(DISTINCT se.ShareEventID) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(DISTINCT se.ShareEventID)
            ELSE 0
          END as AverageClicksPerShare,
          MAX(se.ShareDate) as LastShareDate
        FROM dbo.[User] u
        INNER JOIN dbo.ShareEvent se ON u.UserID = se.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        WHERE ${whereClause}
        GROUP BY u.UserID, u.MemberID, u.FirstName, u.LastName, u.Email
        ORDER BY TotalShares DESC, TotalClicks DESC
      `;

      const result = await query<any>(sql, params);

      return result.map((row: any) => ({
        userId: row.UserID,
        memberID: row.MemberID,
        name: row.Name,
        email: row.Email,
        totalShares: row.TotalShares || 0,
        totalClicks: row.TotalClicks || 0,
        uniqueContent: row.UniqueContent || 0,
        averageClicksPerShare: parseFloat((row.AverageClicksPerShare || 0).toFixed(2)),
        lastShareDate: row.LastShareDate
      }));
    } catch (error) {
      logger.error('Error getting top sharers:', error);
      throw error;
    }
  }

  /**
   * Get recent share activity
   */
  async getRecentShares(userId?: number, limit: number = 10): Promise<ShareEventDetail[]> {
    try {
      const params: any = { limit };
      let whereClause = '1=1';

      if (userId) {
        whereClause += ' AND se.UserID = @userId';
        params.userId = userId;
      }

      const sql = `
        SELECT TOP (@limit)
          se.ShareEventID,
          se.ShareGUID,
          se.ShareDate,
          se.ShareChannel,
          se.SocialPlatform,
          u.UserID,
          u.MemberID,
          u.FirstName + ' ' + u.LastName as SharerName,
          u.Email as SharerEmail,
          m.MarketCode,
          ci.ContentItemID,
          ci.Title as ContentTitle,
          ci.ContentType,
          se.TrackingCode,
          se.RecipientCount,
          se.ClickCount,
          se.UniqueClickCount,
          se.Status
        FROM dbo.ShareEvent se
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.Market m ON u.MarketID = m.MarketID
        INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
        WHERE ${whereClause}
        ORDER BY se.ShareDate DESC
      `;

      const result = await query<any>(sql, params);

      return result.map((row: any) => ({
        shareEventId: row.ShareEventID,
        shareGuid: row.ShareGUID,
        shareDate: row.ShareDate,
        shareChannel: row.ShareChannel,
        socialPlatform: row.SocialPlatform,
        userId: row.UserID,
        memberID: row.MemberID,
        sharerName: row.SharerName,
        sharerEmail: row.SharerEmail,
        marketCode: row.MarketCode,
        contentItemId: row.ContentItemID,
        contentTitle: row.ContentTitle,
        contentType: row.ContentType,
        trackingCode: row.TrackingCode,
        recipientCount: row.RecipientCount,
        clickCount: row.ClickCount,
        uniqueClickCount: row.UniqueClickCount,
        status: row.Status
      }));
    } catch (error) {
      logger.error('Error getting recent shares:', error);
      throw error;
    }
  }

  /**
   * Record engagement event (click tracking)
   */
  async recordEngagementEvent(data: EngagementEventCreate): Promise<number> {
    try {
      const sql = `
        INSERT INTO dbo.EngagementEvent (
          TrackingLinkID,
          ContentItemID,
          ShareEventID,
          ContactID,
          EventType,
          EventValue,
          IPAddress,
          UserAgent,
          DeviceType,
          OperatingSystem,
          Browser,
          ReferrerURL,
          SessionID,
          IsUniqueVisitor
        )
        VALUES (
          @trackingLinkId,
          @contentItemId,
          @shareEventId,
          @contactId,
          @eventType,
          @eventValue,
          @ipAddress,
          @userAgent,
          @deviceType,
          @operatingSystem,
          @browser,
          @referrerURL,
          @sessionId,
          @isUniqueVisitor
        );
        SELECT SCOPE_IDENTITY() as EngagementEventID;
      `;

      const result = await query<any>(sql, {
        trackingLinkId: data.trackingLinkId,
        contentItemId: data.contentItemId,
        shareEventId: data.shareEventId || null,
        contactId: data.contactId || null,
        eventType: data.eventType,
        eventValue: data.eventValue || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        deviceType: data.deviceType || null,
        operatingSystem: data.operatingSystem || null,
        browser: data.browser || null,
        referrerURL: data.referrerURL || null,
        sessionId: data.sessionId || null,
        isUniqueVisitor: data.isUniqueVisitor || false
      });

      const eventId = result[0].EngagementEventID;

      // Update tracking link click counts
      await this.updateTrackingLinkCounts(data.trackingLinkId, data.isUniqueVisitor || false);

      logger.info(`Engagement event recorded: ${eventId}`);
      return eventId;
    } catch (error) {
      logger.error('Error recording engagement event:', error);
      throw error;
    }
  }

  /**
   * Update tracking link click counts
   */
  private async updateTrackingLinkCounts(trackingLinkId: number, isUnique: boolean): Promise<void> {
    try {
      const sql = `
        UPDATE dbo.TrackingLink
        SET
          ClickCount = ClickCount + 1,
          UniqueClickCount = UniqueClickCount + ${isUnique ? 1 : 0},
          FirstClickDate = CASE WHEN FirstClickDate IS NULL THEN SYSDATETIME() ELSE FirstClickDate END,
          LastClickDate = SYSDATETIME()
        WHERE TrackingLinkID = @trackingLinkId;

        -- Also update ShareEvent counts
        UPDATE se
        SET
          se.ClickCount = se.ClickCount + 1,
          se.UniqueClickCount = se.UniqueClickCount + ${isUnique ? 1 : 0}
        FROM dbo.ShareEvent se
        INNER JOIN dbo.TrackingLink tl ON se.ShareEventID = tl.ShareEventID
        WHERE tl.TrackingLinkID = @trackingLinkId;
      `;

      await query(sql, { trackingLinkId });
    } catch (error) {
      logger.error('Error updating tracking link counts:', error);
      throw error;
    }
  }

  /**
   * Get tracking link by short code
   */
  async getTrackingLinkByCode(shortCode: string): Promise<any> {
    try {
      const sql = `
        SELECT
          tl.TrackingLinkID,
          tl.ShareEventID,
          tl.DestinationURL,
          tl.IsActive,
          tl.ExpirationDate,
          se.ContentItemID,
          se.UserID
        FROM dbo.TrackingLink tl
        INNER JOIN dbo.ShareEvent se ON tl.ShareEventID = se.ShareEventID
        WHERE tl.ShortCode = @shortCode
          AND tl.IsActive = 1
          AND (tl.ExpirationDate IS NULL OR tl.ExpirationDate > SYSDATETIME())
      `;

      const result = await query<any>(sql, { shortCode });

      if (result.length === 0) {
        return null;
      }

      return result[0];
    } catch (error) {
      logger.error('Error getting tracking link:', error);
      throw error;
    }
  }
}
