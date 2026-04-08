import { nanoid } from 'nanoid';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  ShareEvent,
  CreateShareRequest,
  ClickTrackingRequest,
  ShareAnalyticsFilters,
  ShareAnalyticsResponse,
  ShareTemplate,
  CreateShareResponse,
  TrackingRedirectResponse,
  TrackingLink
} from '../types/sharing.types.js';

const logger = createLogger('SharingService');

export class SharingService {
  private readonly TRACKING_BASE_URL = process.env.TRACKING_BASE_URL || 'http://localhost:3000/s';
  private readonly TRACKING_CODE_LENGTH = 8;

  /**
   * Generate a unique tracking link
   */
  async generateTrackingLink(
    contentId: number,
    userId: number,
    _channel: 'SMS' | 'Email' | 'Social',
    _destinationUrl: string
  ): Promise<{ trackingCode: string; trackingUrl: string }> {
    try {
      // Generate unique short code
      let trackingCode = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        trackingCode = nanoid(this.TRACKING_CODE_LENGTH);

        // Check if code already exists
        const existing = await query<{ Count: number }>(`
          SELECT COUNT(*) as Count
          FROM ShareEvent
          WHERE TrackingCode = @trackingCode
        `, { trackingCode });

        if (existing[0].Count === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique tracking code');
      }

      const trackingUrl = `${this.TRACKING_BASE_URL}/${trackingCode}`;

      logger.info(`Generated tracking link for user ${userId}, content ${contentId}: ${trackingCode}`);

      return { trackingCode, trackingUrl };
    } catch (error) {
      logger.error('Error generating tracking link:', error);
      throw error;
    }
  }

  /**
   * Log a share event to the database
   */
  async logShareEvent(shareData: CreateShareRequest, userId: number, metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
  }): Promise<CreateShareResponse> {
    try {
      logger.info(`Logging share event for user ${userId}, content ${shareData.contentItemId}`);

      // Get content details for destination URL
      const content = await query<{ DestinationURL: string; Title: string }>(`
        SELECT DestinationURL, Title
        FROM ContentItem
        WHERE ContentItemID = @contentItemId
      `, { contentItemId: shareData.contentItemId });

      if (content.length === 0) {
        throw new Error('Content not found');
      }

      // Use content's destination URL, or default to content detail page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const destinationUrl = content[0].DestinationURL || `${frontendUrl}/content/${shareData.contentItemId}`;

      // Generate tracking link
      const { trackingCode, trackingUrl } = await generateTrackingLink(
        shareData.contentItemId,
        userId,
        shareData.channel,
        destinationUrl
      );

      // Insert share event
      const shareEventResult = await query<{ ShareEventID: number; ShareGUID: string }>(`
        INSERT INTO ShareEvent (
          UserID,
          ContentItemID,
          CampaignID,
          ShareChannel,
          SocialPlatform,
          PersonalMessage,
          ShareTemplate,
          TrackingCode,
          Status,
          RecipientCount,
          ShareDate,
          UserAgent,
          IPAddress,
          DeviceType
        )
        OUTPUT INSERTED.ShareEventID, INSERTED.ShareGUID
        VALUES (
          @userId,
          @contentItemId,
          @campaignId,
          @channel,
          @socialPlatform,
          @personalMessage,
          @templateName,
          @trackingCode,
          'Sent',
          @recipientCount,
          SYSDATETIME(),
          @userAgent,
          @ipAddress,
          @deviceType
        )
      `, {
        userId,
        contentItemId: shareData.contentItemId,
        campaignId: shareData.campaignId || null,
        channel: shareData.channel,
        socialPlatform: shareData.socialPlatform || null,
        personalMessage: shareData.personalMessage || null,
        templateName: shareData.templateName || null,
        trackingCode,
        recipientCount: shareData.recipients?.length || 1,
        userAgent: metadata?.userAgent || null,
        ipAddress: metadata?.ipAddress || null,
        deviceType: metadata?.deviceType || null
      });

      const shareEventId = shareEventResult[0].ShareEventID;

      // Insert tracking link
      await query(`
        INSERT INTO TrackingLink (
          ShareEventID,
          ShortCode,
          FullTrackingURL,
          DestinationURL,
          LinkType,
          IsActive
        )
        VALUES (
          @shareEventId,
          @trackingCode,
          @trackingUrl,
          @destinationUrl,
          'Content',
          1
        )
      `, {
        shareEventId,
        trackingCode,
        trackingUrl,
        destinationUrl
      });

      // Insert recipients if provided
      if (shareData.recipients && shareData.recipients.length > 0) {
        for (const recipient of shareData.recipients) {
          await query(`
            INSERT INTO ShareRecipient (
              ShareEventID,
              ContactID,
              RecipientEmail,
              RecipientMobile,
              RecipientName,
              DeliveryStatus
            )
            VALUES (
              @shareEventId,
              @contactId,
              @email,
              @mobile,
              @name,
              'Pending'
            )
          `, {
            shareEventId,
            contactId: recipient.contactId || null,
            email: recipient.email || null,
            mobile: recipient.mobile || null,
            name: recipient.name || null
          });
        }
      }

      // Get the created share event
      const shareEvent = await query<ShareEvent>(`
        SELECT *
        FROM ShareEvent
        WHERE ShareEventID = @shareEventId
      `, { shareEventId });

      logger.info(`Share event logged successfully: ${shareEventId}`);

      return {
        success: true,
        data: {
          shareEventId: shareEventId.toString(),
          trackingLink: trackingUrl,
          trackingCode,
          contentId: shareData.contentItemId.toString(),
          channel: shareData.channel,
          recipientInfo: shareData.recipients?.[0]?.email || shareData.recipients?.[0]?.mobile || shareData.recipients?.[0]?.name || 'Social Share',
          messageContent: shareData.personalMessage,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error logging share event:', error);
      throw error;
    }
  }

  /**
   * Track a click on a tracking link
   */
  async trackClick(trackingData: ClickTrackingRequest): Promise<TrackingRedirectResponse> {
    try {
      logger.info(`Tracking click for code: ${trackingData.trackingCode}`);

      // Get tracking link and share event
      const trackingLinks = await query<TrackingLink & { ShareEventID: number; ContentItemID: number }>(`
        SELECT tl.*, se.ShareEventID, se.ContentItemID
        FROM TrackingLink tl
        INNER JOIN ShareEvent se ON tl.ShareEventID = se.ShareEventID
        WHERE tl.ShortCode = @trackingCode
          AND tl.IsActive = 1
          AND (tl.ExpirationDate IS NULL OR tl.ExpirationDate > SYSDATETIME())
      `, { trackingCode: trackingData.trackingCode });

      if (trackingLinks.length === 0) {
        logger.warn(`Tracking link not found or expired: ${trackingData.trackingCode}`);
        return {
          success: false,
          redirectUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          recorded: false
        };
      }

      const trackingLink = trackingLinks[0];

      // Parse user agent for device info
      const deviceInfo = this.parseUserAgent(trackingData.userAgent || '');

      // Check if this is a unique visitor
      const existingClicks = await query<{ Count: number }>(`
        SELECT COUNT(*) as Count
        FROM EngagementEvent
        WHERE TrackingLinkID = @trackingLinkId
          AND IPAddress = @ipAddress
      `, {
        trackingLinkId: trackingLink.TrackingLinkID,
        ipAddress: trackingData.ipAddress || ''
      });

      const isUniqueVisitor = existingClicks[0].Count === 0;

      // Generate session ID
      const sessionId = nanoid(16);

      // Insert engagement event
      await query(`
        INSERT INTO EngagementEvent (
          ContentItemID,
          TrackingLinkID,
          ShareEventID,
          EventType,
          EventDate,
          IPAddress,
          UserAgent,
          DeviceType,
          OperatingSystem,
          Browser,
          SessionID,
          IsUniqueVisitor,
          ReferrerURL
        )
        VALUES (
          @contentItemId,
          @trackingLinkId,
          @shareEventId,
          'Click',
          SYSDATETIME(),
          @ipAddress,
          @userAgent,
          @deviceType,
          @os,
          @browser,
          @sessionId,
          @isUniqueVisitor,
          @referrer
        )
      `, {
        contentItemId: trackingLink.ContentItemID,
        trackingLinkId: trackingLink.TrackingLinkID,
        shareEventId: trackingLink.ShareEventID,
        ipAddress: trackingData.ipAddress || null,
        userAgent: trackingData.userAgent || null,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        sessionId,
        isUniqueVisitor: isUniqueVisitor ? 1 : 0,
        referrer: trackingData.referrer || null
      });

      // Update tracking link stats
      await query(`
        UPDATE TrackingLink
        SET ClickCount = ClickCount + 1,
            UniqueClickCount = UniqueClickCount + @increment,
            LastClickDate = SYSDATETIME(),
            FirstClickDate = CASE WHEN FirstClickDate IS NULL THEN SYSDATETIME() ELSE FirstClickDate END
        WHERE TrackingLinkID = @trackingLinkId
      `, {
        trackingLinkId: trackingLink.TrackingLinkID,
        increment: isUniqueVisitor ? 1 : 0
      });

      // Update share event stats
      await query(`
        UPDATE ShareEvent
        SET ClickCount = ClickCount + 1,
            UniqueClickCount = UniqueClickCount + @increment
        WHERE ShareEventID = @shareEventId
      `, {
        shareEventId: trackingLink.ShareEventID,
        increment: isUniqueVisitor ? 1 : 0
      });

      logger.info(`Click tracked successfully for ${trackingData.trackingCode}`);

      return {
        success: true,
        redirectUrl: trackingLink.DestinationURL,
        recorded: true
      };
    } catch (error) {
      logger.error('Error tracking click:', error);
      throw error;
    }
  }

  /**
   * Get user's share history
   */
  async getUserShares(userId: number, filters: {
    channel?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    shares: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      logger.info(`Fetching share history for user ${userId}`, filters);

      // Build WHERE clause
      const conditions: string[] = ['se.UserID = @userId'];
      const params: any = {
        userId,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      if (filters.channel) {
        conditions.push('se.ShareChannel = @channel');
        params.channel = filters.channel;
      }

      if (filters.startDate) {
        conditions.push('se.ShareDate >= @startDate');
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        conditions.push('se.ShareDate <= @endDate');
        params.endDate = filters.endDate;
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countResult = await query<{ Total: number }>(`
        SELECT COUNT(*) as Total
        FROM ShareEvent se
        WHERE ${whereClause}
      `, params);

      const total = countResult[0]?.Total || 0;

      // Get share history with content details
      const shares = await query<any>(`
        SELECT
          se.ShareEventID as id,
          se.ShareGUID as shareGuid,
          se.ShareDate as shareDate,
          se.ShareChannel as channel,
          se.SocialPlatform as socialPlatform,
          se.PersonalMessage as personalMessage,
          se.TrackingCode as trackingCode,
          se.Status as status,
          se.RecipientCount as recipientCount,
          se.ClickCount as clickCount,
          se.UniqueClickCount as uniqueClickCount,
          se.ViewCount as viewCount,
          ci.ContentItemID as contentId,
          ci.Title as contentTitle,
          ci.ContentType as contentType,
          ci.ThumbnailURL as contentThumbnail,
          tl.FullTrackingURL as trackingUrl,
          tl.DestinationURL as destinationUrl,
          CASE
            WHEN se.ClickCount > 0 THEN CAST(se.ClickCount AS FLOAT) / NULLIF(se.RecipientCount, 0) * 100
            ELSE 0
          END as clickRate
        FROM ShareEvent se
        INNER JOIN ContentItem ci ON se.ContentItemID = ci.ContentItemID
        LEFT JOIN TrackingLink tl ON se.ShareEventID = tl.ShareEventID
        WHERE ${whereClause}
        ORDER BY se.ShareDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, params);

      // Get recipients for each share
      for (const share of shares) {
        const recipients = await query<any>(`
          SELECT
            RecipientName as name,
            RecipientEmail as email,
            RecipientMobile as mobile,
            DeliveryStatus as deliveryStatus
          FROM ShareRecipient
          WHERE ShareEventID = @shareEventId
        `, { shareEventId: share.id });

        share.recipients = recipients;
      }

      return {
        shares,
        total,
        limit: params.limit,
        offset: params.offset
      };
    } catch (error) {
      logger.error('Error fetching user shares:', error);
      throw error;
    }
  }

  /**
   * Get share analytics
   */
  async getShareAnalytics(filters: ShareAnalyticsFilters): Promise<ShareAnalyticsResponse> {
    try {
      logger.info('Fetching share analytics', filters);

      // Build WHERE clause
      const conditions: string[] = ['1=1'];
      const params: any = {};

      if (filters.userId) {
        conditions.push('se.UserID = @userId');
        params.userId = filters.userId;
      }

      if (filters.contentId) {
        conditions.push('se.ContentItemID = @contentId');
        params.contentId = filters.contentId;
      }

      if (filters.channel) {
        conditions.push('se.ShareChannel = @channel');
        params.channel = filters.channel;
      }

      if (filters.campaignId) {
        conditions.push('se.CampaignID = @campaignId');
        params.campaignId = filters.campaignId;
      }

      if (filters.startDate) {
        conditions.push('se.ShareDate >= @startDate');
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        conditions.push('se.ShareDate <= @endDate');
        params.endDate = filters.endDate;
      }

      const whereClause = conditions.join(' AND ');

      // Get total stats
      const totalStats = await query<{
        TotalShares: number;
        TotalClicks: number;
        TotalUniqueClicks: number;
      }>(`
        SELECT
          COUNT(*) as TotalShares,
          SUM(ClickCount) as TotalClicks,
          SUM(UniqueClickCount) as TotalUniqueClicks
        FROM ShareEvent se
        WHERE ${whereClause}
      `, params);

      // Get stats by channel
      const channelStats = await query<{
        ShareChannel: string;
        ShareCount: number;
        TotalClicks: number;
      }>(`
        SELECT
          ShareChannel,
          COUNT(*) as ShareCount,
          SUM(ClickCount) as TotalClicks
        FROM ShareEvent se
        WHERE ${whereClause}
        GROUP BY ShareChannel
        ORDER BY ShareCount DESC
      `, params);

      // Get top content
      const topContent = await query<{
        ContentItemID: number;
        Title: string;
        ShareCount: number;
        TotalClicks: number;
      }>(`
        SELECT TOP 10
          ci.ContentItemID,
          ci.Title,
          COUNT(se.ShareEventID) as ShareCount,
          SUM(se.ClickCount) as TotalClicks
        FROM ContentItem ci
        INNER JOIN ShareEvent se ON ci.ContentItemID = se.ContentItemID
        WHERE ${whereClause}
        GROUP BY ci.ContentItemID, ci.Title
        ORDER BY ShareCount DESC, TotalClicks DESC
      `, params);

      // Get recent shares
      const recentShares = await query<ShareEvent>(`
        SELECT TOP 20 *
        FROM ShareEvent se
        WHERE ${whereClause}
        ORDER BY ShareDate DESC
      `, params);

      // Get timeline data (last 30 days)
      const timeline = await query<{
        Date: string;
        ShareCount: number;
        ClickCount: number;
      }>(`
        SELECT
          CAST(ShareDate AS DATE) as Date,
          COUNT(*) as ShareCount,
          SUM(ClickCount) as ClickCount
        FROM ShareEvent se
        WHERE ${whereClause}
          AND ShareDate >= DATEADD(day, -30, SYSDATETIME())
        GROUP BY CAST(ShareDate AS DATE)
        ORDER BY Date DESC
      `, params);

      const total = totalStats[0];
      const averageClickRate = total.TotalShares > 0
        ? (total.TotalClicks / total.TotalShares) * 100
        : 0;

      return {
        success: true,
        data: {
          totalShares: total.TotalShares || 0,
          totalClicks: total.TotalClicks || 0,
          totalUniqueClicks: total.TotalUniqueClicks || 0,
          averageClickRate: Math.round(averageClickRate * 100) / 100,
          sharesByChannel: channelStats.map(stat => ({
            channel: stat.ShareChannel,
            count: stat.ShareCount,
            clicks: stat.TotalClicks || 0,
            clickRate: stat.ShareCount > 0
              ? Math.round(((stat.TotalClicks || 0) / stat.ShareCount) * 10000) / 100
              : 0
          })),
          topContent: topContent.map(content => ({
            contentItemId: content.ContentItemID,
            title: content.Title,
            shares: content.ShareCount,
            clicks: content.TotalClicks || 0,
            clickRate: content.ShareCount > 0
              ? Math.round(((content.TotalClicks || 0) / content.ShareCount) * 10000) / 100
              : 0
          })),
          recentShares,
          timeline: timeline.map(item => ({
            date: item.Date,
            shares: item.ShareCount,
            clicks: item.ClickCount || 0
          }))
        }
      };
    } catch (error) {
      logger.error('Error fetching share analytics:', error);
      throw error;
    }
  }

  /**
   * Get template for a specific channel
   */
  getTemplateForChannel(channel: 'SMS' | 'Email' | 'Social', socialPlatform?: string): ShareTemplate {
    const templates: Record<string, ShareTemplate> = {
      SMS: {
        channel: 'SMS',
        templateName: 'default_sms',
        body: 'Hi! {firstName} here. I wanted to share this with you: {contentTitle}. Check it out: {trackingLink}',
        variables: ['firstName', 'contentTitle', 'trackingLink'],
        maxLength: 160
      },
      Email: {
        channel: 'Email',
        templateName: 'default_email',
        subject: '{firstName} shared: {contentTitle}',
        body: `Hi,

{firstName} thought you might be interested in this:

{contentTitle}
{contentDescription}

Click here to view: {trackingLink}

Best regards,
{firstName}
{senderEmail}`,
        variables: ['firstName', 'contentTitle', 'contentDescription', 'trackingLink', 'senderEmail']
      },
      Social_Facebook: {
        channel: 'Social',
        socialPlatform: 'Facebook',
        templateName: 'facebook_post',
        body: '{contentTitle}\n\n{contentDescription}\n\n{trackingLink}',
        variables: ['contentTitle', 'contentDescription', 'trackingLink'],
        maxLength: 5000
      },
      Social_Twitter: {
        channel: 'Social',
        socialPlatform: 'Twitter',
        templateName: 'twitter_post',
        body: '{contentTitle}\n{trackingLink}',
        variables: ['contentTitle', 'trackingLink'],
        maxLength: 280
      },
      Social_LinkedIn: {
        channel: 'Social',
        socialPlatform: 'LinkedIn',
        templateName: 'linkedin_post',
        body: '{contentTitle}\n\n{contentDescription}\n\n{trackingLink}',
        variables: ['contentTitle', 'contentDescription', 'trackingLink'],
        maxLength: 3000
      }
    };

    if (channel === 'Social' && socialPlatform) {
      const key = `Social_${socialPlatform}`;
      return templates[key] || templates.Social_Facebook;
    }

    return templates[channel];
  }

  /**
   * Parse user agent to extract device information
   */
  private parseUserAgent(userAgent: string): {
    deviceType: string;
    os: string;
    browser: string;
  } {
    const ua = userAgent.toLowerCase();

    // Detect device type
    let deviceType = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'Tablet';
    }

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'MacOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('opera')) browser = 'Opera';

    return { deviceType, os, browser };
  }
}

// Export singleton instance
export default new SharingService();

// Export helper function for backward compatibility
export const generateTrackingLink = async (
  contentId: number,
  userId: number,
  channel: 'SMS' | 'Email' | 'Social',
  destinationUrl: string
) => {
  const service = new SharingService();
  return service.generateTrackingLink(contentId, userId, channel, destinationUrl);
};
