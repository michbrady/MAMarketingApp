/**
 * Admin Dashboard Service
 * Provides system metrics, activity monitoring, and growth analytics for administrators
 */

import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import {
  SystemMetrics,
  ActivityEvent,
  GrowthData,
  EngagementMetrics,
  TopContent,
  TopUser
} from '../types/admin.types.js';
import { SystemHealthService } from './system-health.service.js';

const logger = createLogger('AdminDashboardService');

export class AdminDashboardService {
  private healthService: SystemHealthService;

  constructor() {
    this.healthService = new SystemHealthService();
  }

  /**
   * Get overall system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get user metrics
      const userMetrics = await query<any>(`
        SELECT
          COUNT(*) as TotalUsers,
          SUM(CASE WHEN us.LastActivityDate >= DATEADD(DAY, -1, SYSDATETIME()) THEN 1 ELSE 0 END) as ActiveToday,
          SUM(CASE WHEN u.CreatedDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as NewThisWeek
        FROM dbo.[User] u
        LEFT JOIN dbo.UserSession us ON u.UserID = us.UserID
        WHERE u.Status = 'Active'
      `);

      const usersByRole = await query<any>(`
        SELECT
          r.RoleName,
          COUNT(*) as UserCount
        FROM dbo.[User] u
        INNER JOIN dbo.Role r ON u.RoleID = r.RoleID
        WHERE u.Status = 'Active'
        GROUP BY r.RoleName
      `);

      // Get content metrics
      const contentMetrics = await query<any>(`
        SELECT
          COUNT(*) as TotalContent,
          SUM(CASE WHEN CreatedDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as AddedThisWeek
        FROM dbo.ContentItem
      `);

      const contentByCategory = await query<any>(`
        SELECT
          cc.CategoryName,
          COUNT(DISTINCT cic.ContentItemID) as ContentCount
        FROM dbo.ContentCategory cc
        LEFT JOIN dbo.ContentItemCategory cic ON cc.ContentCategoryID = cic.ContentCategoryID
        GROUP BY cc.CategoryName
        ORDER BY ContentCount DESC
      `);

      const contentByStatus = await query<any>(`
        SELECT
          PublishStatus,
          COUNT(*) as ContentCount
        FROM dbo.ContentItem
        GROUP BY PublishStatus
      `);

      // Get share metrics
      const shareMetrics = await query<any>(`
        SELECT
          COUNT(*) as TotalShares,
          SUM(CASE WHEN ShareDate >= CAST(SYSDATETIME() AS DATE) THEN 1 ELSE 0 END) as TodayCount,
          SUM(CASE WHEN ShareDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as WeeklyCount
        FROM dbo.ShareEvent
      `);

      const sharesByChannel = await query<any>(`
        SELECT
          ShareChannel,
          COUNT(*) as ShareCount
        FROM dbo.ShareEvent
        GROUP BY ShareChannel
        ORDER BY ShareCount DESC
      `);

      // Get contact metrics
      const contactMetrics = await query<any>(`
        SELECT
          COUNT(*) as TotalContacts,
          SUM(CASE WHEN CreatedDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as AddedThisWeek
        FROM dbo.Contact
      `);

      const contactsByStatus = await query<any>(`
        SELECT
          Status,
          COUNT(*) as ContactCount
        FROM dbo.Contact
        GROUP BY Status
      `);

      // Get follow-up metrics (check if table exists first)
      let followUpMetrics: any[] = [];
      try {
        followUpMetrics = await query<any>(`
          SELECT
            SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as Pending,
            SUM(CASE WHEN Status = 'Pending' AND DueDate < SYSDATETIME() THEN 1 ELSE 0 END) as Overdue,
            SUM(CASE WHEN Status = 'Completed' AND CompletedDate >= CAST(SYSDATETIME() AS DATE) THEN 1 ELSE 0 END) as CompletedToday,
            SUM(CASE WHEN Status = 'Completed' AND CompletedDate >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as CompletedThisWeek
          FROM dbo.FollowUp
        `);
      } catch (error) {
        // Table doesn't exist yet, use default values
        logger.warn('FollowUp table not found, using default values');
        followUpMetrics = [{
          Pending: 0,
          Overdue: 0,
          CompletedToday: 0,
          CompletedThisWeek: 0
        }];
      }

      // Get engagement metrics
      const engagementMetrics = await query<any>(`
        SELECT
          CASE
            WHEN (SELECT COUNT(*) FROM dbo.[User] WHERE Status = 'Active') > 0
            THEN CAST(COUNT(DISTINCT se.UserID) AS FLOAT) / (SELECT COUNT(*) FROM dbo.[User] WHERE Status = 'Active')
            ELSE 0
          END as AvgSharesPerUser,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as AvgEngagementRate,
          SUM(se.ClickCount) as TotalClicks,
          CASE
            WHEN COUNT(*) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / COUNT(*) * 100
            ELSE 0
          END as ClickThroughRate
        FROM dbo.ShareEvent se
      `);

      // Build response
      const byRole: { [key: string]: number } = {};
      usersByRole.forEach((row: any) => {
        byRole[row.RoleName] = row.UserCount || 0;
      });

      const byCategory: { [key: string]: number } = {};
      contentByCategory.forEach((row: any) => {
        byCategory[row.CategoryName] = row.ContentCount || 0;
      });

      const byStatus: { [key: string]: number } = {};
      contentByStatus.forEach((row: any) => {
        byStatus[row.PublishStatus] = row.ContentCount || 0;
      });

      const byChannel: { [key: string]: number } = {};
      sharesByChannel.forEach((row: any) => {
        byChannel[row.ShareChannel] = row.ShareCount || 0;
      });

      const contactStatus: { [key: string]: number } = {};
      contactsByStatus.forEach((row: any) => {
        contactStatus[row.Status] = row.ContactCount || 0;
      });

      return {
        users: {
          total: userMetrics[0]?.TotalUsers || 0,
          byRole,
          activeToday: userMetrics[0]?.ActiveToday || 0,
          newThisWeek: userMetrics[0]?.NewThisWeek || 0
        },
        content: {
          total: contentMetrics[0]?.TotalContent || 0,
          byCategory,
          byStatus,
          addedThisWeek: contentMetrics[0]?.AddedThisWeek || 0
        },
        shares: {
          total: shareMetrics[0]?.TotalShares || 0,
          byChannel,
          todayCount: shareMetrics[0]?.TodayCount || 0,
          weeklyCount: shareMetrics[0]?.WeeklyCount || 0
        },
        contacts: {
          total: contactMetrics[0]?.TotalContacts || 0,
          byStatus: contactStatus,
          addedThisWeek: contactMetrics[0]?.AddedThisWeek || 0
        },
        followUps: {
          pending: followUpMetrics[0]?.Pending || 0,
          overdue: followUpMetrics[0]?.Overdue || 0,
          completedToday: followUpMetrics[0]?.CompletedToday || 0,
          completedThisWeek: followUpMetrics[0]?.CompletedThisWeek || 0
        },
        engagement: {
          averageSharesPerUser: parseFloat((engagementMetrics[0]?.AvgSharesPerUser || 0).toFixed(2)),
          averageEngagementRate: parseFloat((engagementMetrics[0]?.AvgEngagementRate || 0).toFixed(2)),
          totalClicks: engagementMetrics[0]?.TotalClicks || 0,
          clickThroughRate: parseFloat((engagementMetrics[0]?.ClickThroughRate || 0).toFixed(2))
        }
      };
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get recent activity across all users
   */
  async getRecentActivity(limit: number = 50, offset: number = 0): Promise<ActivityEvent[]> {
    try {
      const activities: ActivityEvent[] = [];

      // Get recent shares
      const recentShares = await query<any>(`
        SELECT
          'share' as EventType,
          se.ShareEventID as EventId,
          se.UserID,
          u.FirstName + ' ' + u.LastName as UserName,
          se.ShareDate as Timestamp,
          ci.Title as ContentTitle,
          se.ShareChannel,
          se.RecipientCount
        FROM dbo.ShareEvent se
        INNER JOIN dbo.[User] u ON se.UserID = u.UserID
        INNER JOIN dbo.ContentItem ci ON se.ContentItemID = ci.ContentItemID
        ORDER BY se.ShareDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, { limit: Math.ceil(limit / 4), offset: Math.floor(offset / 4) });

      recentShares.forEach((row: any) => {
        activities.push({
          eventId: `share-${row.EventId}`,
          eventType: 'share',
          userId: row.UserID,
          userName: row.UserName,
          timestamp: row.Timestamp,
          description: `Shared "${row.ContentTitle}" via ${row.ShareChannel} to ${row.RecipientCount} recipient(s)`,
          metadata: {
            contentTitle: row.ContentTitle,
            channel: row.ShareChannel,
            recipientCount: row.RecipientCount
          }
        });
      });

      // Get recent content additions
      const recentContent = await query<any>(`
        SELECT
          'content_added' as EventType,
          ci.ContentItemID as EventId,
          ci.CreatedBy as UserID,
          u.FirstName + ' ' + u.LastName as UserName,
          ci.CreatedDate as Timestamp,
          ci.Title,
          ci.ContentType
        FROM dbo.ContentItem ci
        INNER JOIN dbo.[User] u ON ci.CreatedBy = u.UserID
        ORDER BY ci.CreatedDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, { limit: Math.ceil(limit / 4), offset: Math.floor(offset / 4) });

      recentContent.forEach((row: any) => {
        activities.push({
          eventId: `content-${row.EventId}`,
          eventType: 'content_added',
          userId: row.UserID,
          userName: row.UserName,
          timestamp: row.Timestamp,
          description: `Added new ${row.ContentType}: "${row.Title}"`,
          metadata: {
            contentId: row.EventId,
            contentType: row.ContentType,
            title: row.Title
          }
        });
      });

      // Get recent user registrations
      const recentUsers = await query<any>(`
        SELECT
          'user_registered' as EventType,
          u.UserID as EventId,
          u.UserID,
          u.FirstName + ' ' + u.LastName as UserName,
          u.CreatedDate as Timestamp,
          u.Email,
          r.RoleName
        FROM dbo.[User] u
        INNER JOIN dbo.Role r ON u.RoleID = r.RoleID
        ORDER BY u.CreatedDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `, { limit: Math.ceil(limit / 4), offset: Math.floor(offset / 4) });

      recentUsers.forEach((row: any) => {
        activities.push({
          eventId: `user-${row.EventId}`,
          eventType: 'user_registered',
          userId: row.UserID,
          userName: row.UserName,
          timestamp: row.Timestamp,
          description: `New user registered: ${row.UserName} (${row.RoleName})`,
          metadata: {
            email: row.Email,
            role: row.RoleName
          }
        });
      });

      // Get recent follow-up completions (if table exists)
      let recentFollowUps: any[] = [];
      try {
        recentFollowUps = await query<any>(`
          SELECT
            'followup_completed' as EventType,
            fu.FollowUpID as EventId,
            fu.UserID,
            u.FirstName + ' ' + u.LastName as UserName,
            fu.CompletedDate as Timestamp,
            fu.Subject,
            c.FirstName + ' ' + c.LastName as ContactName
          FROM dbo.FollowUp fu
          INNER JOIN dbo.[User] u ON fu.UserID = u.UserID
          INNER JOIN dbo.Contact c ON fu.ContactID = c.ContactID
          WHERE fu.Status = 'Completed'
            AND fu.CompletedDate IS NOT NULL
          ORDER BY fu.CompletedDate DESC
          OFFSET @offset ROWS
          FETCH NEXT @limit ROWS ONLY
        `, { limit: Math.ceil(limit / 4), offset: Math.floor(offset / 4) });
      } catch (error) {
        // Table doesn't exist yet, continue without follow-up data
        logger.warn('FollowUp table not found, skipping follow-up activities');
      }

      recentFollowUps.forEach((row: any) => {
        activities.push({
          eventId: `followup-${row.EventId}`,
          eventType: 'followup_completed',
          userId: row.UserID,
          userName: row.UserName,
          timestamp: row.Timestamp,
          description: `Completed follow-up "${row.Subject}" with ${row.ContactName}`,
          metadata: {
            subject: row.Subject,
            contactName: row.ContactName
          }
        });
      });

      // Sort all activities by timestamp (descending) and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    return this.healthService.getSystemHealth();
  }

  /**
   * Get user growth trends over N days
   */
  async getUserGrowth(days: number = 30): Promise<GrowthData> {
    try {
      const result = await query<any>(`
        WITH DateRange AS (
          SELECT CAST(DATEADD(DAY, -@days, SYSDATETIME()) AS DATE) as StartDate,
                 CAST(SYSDATETIME() AS DATE) as EndDate
        ),
        DailyCounts AS (
          SELECT
            CAST(CreatedDate AS DATE) as Date,
            COUNT(*) as NewUsers
          FROM dbo.[User]
          WHERE CreatedDate >= (SELECT StartDate FROM DateRange)
          GROUP BY CAST(CreatedDate AS DATE)
        ),
        PreviousPeriod AS (
          SELECT COUNT(*) as PreviousTotal
          FROM dbo.[User]
          WHERE CreatedDate >= DATEADD(DAY, -@days * 2, SYSDATETIME())
            AND CreatedDate < DATEADD(DAY, -@days, SYSDATETIME())
        )
        SELECT
          CONVERT(VARCHAR(10), Date, 23) as Label,
          NewUsers as Value
        FROM DailyCounts
        ORDER BY Date
      `, { days });

      const currentTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.[User]
        WHERE CreatedDate >= DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const previousTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.[User]
        WHERE CreatedDate >= DATEADD(DAY, -@days * 2, SYSDATETIME())
          AND CreatedDate < DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const current = currentTotal[0]?.Total || 0;
      const previous = previousTotal[0]?.Total || 1;
      const change = ((current - previous) / previous) * 100;

      return {
        labels: result.map((row: any) => row.Label),
        values: result.map((row: any) => row.Value || 0),
        total: current,
        change: parseFloat(change.toFixed(2))
      };
    } catch (error) {
      logger.error('Error getting user growth:', error);
      throw error;
    }
  }

  /**
   * Get content growth trends over N days
   */
  async getContentGrowth(days: number = 30): Promise<GrowthData> {
    try {
      const result = await query<any>(`
        WITH DateRange AS (
          SELECT CAST(DATEADD(DAY, -@days, SYSDATETIME()) AS DATE) as StartDate,
                 CAST(SYSDATETIME() AS DATE) as EndDate
        ),
        DailyCounts AS (
          SELECT
            CAST(CreatedDate AS DATE) as Date,
            COUNT(*) as NewContent
          FROM dbo.ContentItem
          WHERE CreatedDate >= (SELECT StartDate FROM DateRange)
          GROUP BY CAST(CreatedDate AS DATE)
        )
        SELECT
          CONVERT(VARCHAR(10), Date, 23) as Label,
          NewContent as Value
        FROM DailyCounts
        ORDER BY Date
      `, { days });

      const currentTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.ContentItem
        WHERE CreatedDate >= DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const previousTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.ContentItem
        WHERE CreatedDate >= DATEADD(DAY, -@days * 2, SYSDATETIME())
          AND CreatedDate < DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const current = currentTotal[0]?.Total || 0;
      const previous = previousTotal[0]?.Total || 1;
      const change = ((current - previous) / previous) * 100;

      return {
        labels: result.map((row: any) => row.Label),
        values: result.map((row: any) => row.Value || 0),
        total: current,
        change: parseFloat(change.toFixed(2))
      };
    } catch (error) {
      logger.error('Error getting content growth:', error);
      throw error;
    }
  }

  /**
   * Get share activity trends over N days
   */
  async getShareTrends(days: number = 30): Promise<GrowthData> {
    try {
      const result = await query<any>(`
        WITH DateRange AS (
          SELECT CAST(DATEADD(DAY, -@days, SYSDATETIME()) AS DATE) as StartDate,
                 CAST(SYSDATETIME() AS DATE) as EndDate
        ),
        DailyCounts AS (
          SELECT
            CAST(ShareDate AS DATE) as Date,
            COUNT(*) as Shares
          FROM dbo.ShareEvent
          WHERE ShareDate >= (SELECT StartDate FROM DateRange)
          GROUP BY CAST(ShareDate AS DATE)
        )
        SELECT
          CONVERT(VARCHAR(10), Date, 23) as Label,
          Shares as Value
        FROM DailyCounts
        ORDER BY Date
      `, { days });

      const currentTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.ShareEvent
        WHERE ShareDate >= DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const previousTotal = await query<any>(`
        SELECT COUNT(*) as Total
        FROM dbo.ShareEvent
        WHERE ShareDate >= DATEADD(DAY, -@days * 2, SYSDATETIME())
          AND ShareDate < DATEADD(DAY, -@days, SYSDATETIME())
      `, { days });

      const current = currentTotal[0]?.Total || 0;
      const previous = previousTotal[0]?.Total || 1;
      const change = ((current - previous) / previous) * 100;

      return {
        labels: result.map((row: any) => row.Label),
        values: result.map((row: any) => row.Value || 0),
        total: current,
        change: parseFloat(change.toFixed(2))
      };
    } catch (error) {
      logger.error('Error getting share trends:', error);
      throw error;
    }
  }

  /**
   * Get overall engagement metrics
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    try {
      // Calculate average shares per user
      const avgSharesResult = await query<any>(`
        SELECT
          CASE
            WHEN (SELECT COUNT(*) FROM dbo.[User] WHERE Status = 'Active') > 0
            THEN CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM dbo.[User] WHERE Status = 'Active')
            ELSE 0
          END as AvgSharesPerUser
        FROM dbo.ShareEvent
      `);

      // Calculate average engagement rate
      const avgEngagementResult = await query<any>(`
        SELECT
          CASE
            WHEN SUM(RecipientCount) > 0
            THEN CAST(SUM(ClickCount) AS FLOAT) / SUM(RecipientCount) * 100
            ELSE 0
          END as AvgEngagementRate
        FROM dbo.ShareEvent
      `);

      // Get top performing content
      const topContent = await query<any>(`
        SELECT TOP 10
          ci.ContentItemID,
          ci.Title,
          ci.ContentType,
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as EngagementRate
        FROM dbo.ContentItem ci
        INNER JOIN dbo.ShareEvent se ON ci.ContentItemID = se.ContentItemID
        GROUP BY ci.ContentItemID, ci.Title, ci.ContentType
        ORDER BY TotalShares DESC, TotalClicks DESC
      `);

      // Get top performing users
      const topUsers = await query<any>(`
        SELECT TOP 10
          u.UserID,
          u.FirstName + ' ' + u.LastName as Name,
          u.Email,
          COUNT(DISTINCT se.ShareEventID) as TotalShares,
          ISNULL(SUM(se.ClickCount), 0) as TotalClicks,
          CASE
            WHEN SUM(se.RecipientCount) > 0
            THEN CAST(SUM(se.ClickCount) AS FLOAT) / SUM(se.RecipientCount) * 100
            ELSE 0
          END as EngagementRate
        FROM dbo.[User] u
        INNER JOIN dbo.ShareEvent se ON u.UserID = se.UserID
        WHERE u.Status = 'Active'
        GROUP BY u.UserID, u.FirstName, u.LastName, u.Email
        ORDER BY TotalShares DESC, TotalClicks DESC
      `);

      const topPerformingContent: TopContent[] = topContent.map((row: any) => ({
        contentItemId: row.ContentItemID,
        title: row.Title,
        contentType: row.ContentType,
        totalShares: row.TotalShares || 0,
        totalClicks: row.TotalClicks || 0,
        engagementRate: parseFloat((row.EngagementRate || 0).toFixed(2))
      }));

      const topPerformingUsers: TopUser[] = topUsers.map((row: any) => ({
        userId: row.UserID,
        name: row.Name,
        email: row.Email,
        totalShares: row.TotalShares || 0,
        totalClicks: row.TotalClicks || 0,
        engagementRate: parseFloat((row.EngagementRate || 0).toFixed(2))
      }));

      return {
        averageSharesPerUser: parseFloat((avgSharesResult[0]?.AvgSharesPerUser || 0).toFixed(2)),
        averageEngagementRate: parseFloat((avgEngagementResult[0]?.AvgEngagementRate || 0).toFixed(2)),
        topPerformingContent,
        topPerformingUsers
      };
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      throw error;
    }
  }
}
