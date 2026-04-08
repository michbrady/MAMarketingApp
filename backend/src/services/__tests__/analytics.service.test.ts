import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../analytics.service';
import * as database from '../../config/database';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService = new AnalyticsService();
  });

  describe('getSharePerformance', () => {
    it('should get share performance metrics', async () => {
      // Arrange
      const mockMetrics = {
        TotalShares: 100,
        TotalClicks: 250,
        UniqueClicks: 150,
        TotalRecipients: 500,
        ClickThroughRate: 50.0,
        AverageClicksPerShare: 2.5,
        TopChannel: 'Email',
        TopChannelShares: 60
      };

      vi.mocked(database.query).mockResolvedValueOnce([mockMetrics]);

      // Act
      const result = await analyticsService.getSharePerformance({ userId: 1 });

      // Assert
      expect(result.totalShares).toBe(100);
      expect(result.totalClicks).toBe(250);
      expect(result.uniqueClicks).toBe(150);
      expect(result.clickThroughRate).toBe(50.0);
    });

    it('should filter by date range', async () => {
      // Arrange
      const mockMetrics = {
        TotalShares: 50,
        TotalClicks: 100,
        UniqueClicks: 75,
        TotalRecipients: 200,
        ClickThroughRate: 50.0,
        AverageClicksPerShare: 2.0,
        TopChannel: 'SMS',
        TopChannelShares: 30
      };

      vi.mocked(database.query).mockResolvedValueOnce([mockMetrics]);

      // Act
      const result = await analyticsService.getSharePerformance({
        userId: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      // Assert
      expect(result.totalShares).toBe(50);
    });

    it('should filter by channel', async () => {
      // Arrange
      const mockMetrics = {
        TotalShares: 30,
        TotalClicks: 60,
        UniqueClicks: 45,
        TotalRecipients: 100,
        ClickThroughRate: 60.0,
        AverageClicksPerShare: 2.0,
        TopChannel: 'Email',
        TopChannelShares: 30
      };

      vi.mocked(database.query).mockResolvedValueOnce([mockMetrics]);

      // Act
      const result = await analyticsService.getSharePerformance({
        userId: 1,
        channel: 'Email'
      });

      // Assert
      expect(result.topChannel).toBe('Email');
    });

    it('should handle zero shares', async () => {
      // Arrange
      const mockMetrics = {
        TotalShares: 0,
        TotalClicks: 0,
        UniqueClicks: 0,
        TotalRecipients: 0,
        ClickThroughRate: 0,
        AverageClicksPerShare: 0,
        TopChannel: 'N/A',
        TopChannelShares: 0
      };

      vi.mocked(database.query).mockResolvedValueOnce([mockMetrics]);

      // Act
      const result = await analyticsService.getSharePerformance({ userId: 1 });

      // Assert
      expect(result.totalShares).toBe(0);
      expect(result.clickThroughRate).toBe(0);
    });
  });

  describe('getShareTrends', () => {
    it('should get share trends over time', async () => {
      // Arrange
      const mockTrends = [
        { ShareDate: '2024-01-01', Shares: 10, Clicks: 25, UniqueClicks: 15, Recipients: 50 },
        { ShareDate: '2024-01-02', Shares: 15, Clicks: 30, UniqueClicks: 20, Recipients: 60 }
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockTrends);

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07')
      };

      // Act
      const result = await analyticsService.getShareTrends(dateRange, 'day', { userId: 1 });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].shares).toBe(10);
    });

    it('should group by week', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([
        { ShareDate: '2024-01-01', Shares: 25, Clicks: 50, UniqueClicks: 30, Recipients: 100 }
      ]);

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Act
      const result = await analyticsService.getShareTrends(dateRange, 'week', { userId: 1 });

      // Assert
      expect(database.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getChannelPerformance', () => {
    it('should get performance by channel', async () => {
      // Arrange
      const mockChannels = [
        {
          Channel: 'Email',
          TotalShares: 50,
          TotalClicks: 100,
          UniqueClicks: 75,
          ClickThroughRate: 50.0,
          AverageClicksPerShare: 2.0
        },
        {
          ShareChannel: 'SMS',
          ShareCount: 30,
          ClickCount: 60,
          UniqueClickCount: 45,
          RecipientCount: 100
        }
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockChannels);

      // Act
      const result = await analyticsService.getChannelPerformance({ userId: 1 });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].channel).toBe('Email');
      expect(result[0].totalShares).toBe(50);
    });
  });

  describe('getTopSharedContent', () => {
    it('should get top performing content', async () => {
      // Arrange
      const mockContent = [
        {
          ContentItemID: 1,
          Title: 'Product Launch',
          ContentType: 'Video',
          ThumbnailURL: 'https://example.com/thumb.jpg',
          TotalShares: 100,
          TotalClicks: 250,
          UniqueClicks: 150,
          ClickThroughRate: 62.5
        },
        {
          ContentItemID: 2,
          Title: 'Training Video',
          ContentType: 'Video',
          ThumbnailURL: null,
          TotalShares: 75,
          TotalClicks: 150,
          UniqueClicks: 100,
          ClickThroughRate: 50.0
        }
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockContent);

      // Act
      const result = await analyticsService.getTopSharedContent({ userId: 1 }, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].contentItemId).toBe(1);
      expect(result[0].totalShares).toBe(100);
    });

    it('should apply limit', async () => {
      // Arrange
      const mockContent = Array.from({ length: 5 }, (_, i) => ({
        ContentItemID: i + 1,
        Title: `Content ${i + 1}`,
        ContentType: 'Video',
        ThumbnailURL: null,
        TotalShares: 10,
        TotalClicks: 20,
        UniqueClicks: 15,
        ClickThroughRate: 50.0
      }));

      vi.mocked(database.query).mockResolvedValueOnce(mockContent);

      // Act
      const result = await analyticsService.getTopSharedContent({ userId: 1 }, 5);

      // Assert
      expect(result).toHaveLength(5);
    });
  });

  describe('recordEngagementEvent', () => {
    it('should record engagement event', async () => {
      // Arrange
      const eventData = {
        contentItemId: 1,
        trackingLinkId: 1,
        shareEventId: 1,
        eventType: 'Click' as const,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        isUniqueVisitor: true
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ EngagementEventID: 1 }]) // INSERT
        .mockResolvedValueOnce([]); // UPDATE tracking link counts

      // Act
      const result = await analyticsService.recordEngagementEvent(eventData);

      // Assert
      expect(result).toBe(1);
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should handle optional fields', async () => {
      // Arrange
      const eventData = {
        contentItemId: 1,
        trackingLinkId: 1,
        eventType: 'View' as const
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ EngagementEventID: 1 }]) // INSERT
        .mockResolvedValueOnce([]); // UPDATE

      // Act
      const result = await analyticsService.recordEngagementEvent(eventData);

      // Assert
      expect(result).toBe(1);
    });
  });
});
