import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SharingService } from '../sharing.service';
import * as database from '../../config/database';
import {
  createMockShareEvent,
  createMockTrackingLink,
  createMockContentItem
} from '../../__tests__/helpers/test-utils';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test1234')
}));

describe('SharingService', () => {
  let sharingService: SharingService;

  beforeEach(() => {
    vi.clearAllMocks();
    sharingService = new SharingService();
  });

  describe('generateTrackingLink', () => {
    it('should generate unique tracking link', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([{ Count: 0 }]); // No collision

      // Act
      const result = await sharingService.generateTrackingLink(
        1,
        1,
        'Email',
        'https://example.com'
      );

      // Assert
      expect(result.trackingCode).toBe('test1234');
      expect(result.trackingUrl).toContain('test1234');
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should retry on collision', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Count: 1 }]) // Collision
        .mockResolvedValueOnce([{ Count: 0 }]); // Success

      // Act
      const result = await sharingService.generateTrackingLink(
        1,
        1,
        'Email',
        'https://example.com'
      );

      // Assert
      expect(result.trackingCode).toBeDefined();
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should include base URL in tracking URL', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([{ Count: 0 }]);

      // Act
      const result = await sharingService.generateTrackingLink(
        1,
        1,
        'SMS',
        'https://example.com'
      );

      // Assert
      expect(result.trackingUrl).toContain('http://localhost:3000/s/');
    });
  });

  describe('logShareEvent', () => {
    it('should log share event successfully', async () => {
      // Arrange
      const shareData = {
        contentItemId: 1,
        channel: 'Email' as const,
        recipients: [
          { email: 'test@example.com', name: 'Test User' }
        ]
      };

      const mockContent = createMockContentItem();
      const mockShareEvent = createMockShareEvent();

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContent]) // Get content
        .mockResolvedValueOnce([{ Count: 0 }]) // Generate tracking link
        .mockResolvedValueOnce([{ ShareEventID: 1, ShareGUID: 'guid-123' }]) // Insert share event
        .mockResolvedValueOnce([]) // Insert tracking link
        .mockResolvedValueOnce([]) // Insert recipient
        .mockResolvedValueOnce([mockShareEvent]); // Get share event

      // Act
      const result = await sharingService.logShareEvent(shareData, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.shareEventId).toBe(1);
      expect(result.data?.trackingCode).toBeDefined();
      expect(result.data?.trackingUrl).toBeDefined();
    });

    it('should handle SMS channel', async () => {
      // Arrange
      const shareData = {
        contentItemId: 1,
        channel: 'SMS' as const,
        recipients: [
          { mobile: '+15551234567', name: 'Test User' }
        ]
      };

      const mockContent = createMockContentItem();
      const mockShareEvent = createMockShareEvent({ ShareChannel: 'SMS' });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContent])
        .mockResolvedValueOnce([{ Count: 0 }])
        .mockResolvedValueOnce([{ ShareEventID: 1, ShareGUID: 'guid-123' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockShareEvent]);

      // Act
      const result = await sharingService.logShareEvent(shareData, 1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.shareEvent.ShareChannel).toBe('SMS');
    });

    it('should handle social channel with platform', async () => {
      // Arrange
      const shareData = {
        contentItemId: 1,
        channel: 'Social' as const,
        socialPlatform: 'Facebook' as const
      };

      const mockContent = createMockContentItem();
      const mockShareEvent = createMockShareEvent({
        ShareChannel: 'Social',
        SocialPlatform: 'Facebook'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContent])
        .mockResolvedValueOnce([{ Count: 0 }])
        .mockResolvedValueOnce([{ ShareEventID: 1, ShareGUID: 'guid-123' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockShareEvent]);

      // Act
      const result = await sharingService.logShareEvent(shareData, 1);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should include personal message', async () => {
      // Arrange
      const shareData = {
        contentItemId: 1,
        channel: 'Email' as const,
        personalMessage: 'Check this out!',
        recipients: []
      };

      const mockContent = createMockContentItem();
      const mockShareEvent = createMockShareEvent({
        PersonalMessage: 'Check this out!'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContent])
        .mockResolvedValueOnce([{ Count: 0 }])
        .mockResolvedValueOnce([{ ShareEventID: 1, ShareGUID: 'guid-123' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockShareEvent]);

      // Act
      const result = await sharingService.logShareEvent(shareData, 1);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should fail for non-existent content', async () => {
      // Arrange
      const shareData = {
        contentItemId: 999,
        channel: 'Email' as const
      };

      vi.mocked(database.query).mockResolvedValueOnce([]); // Content not found

      // Act & Assert
      await expect(
        sharingService.logShareEvent(shareData, 1)
      ).rejects.toThrow('Content not found');
    });

    it('should capture metadata', async () => {
      // Arrange
      const shareData = {
        contentItemId: 1,
        channel: 'Email' as const
      };

      const metadata = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        deviceType: 'Desktop'
      };

      const mockContent = createMockContentItem();
      const mockShareEvent = createMockShareEvent();

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockContent])
        .mockResolvedValueOnce([{ Count: 0 }])
        .mockResolvedValueOnce([{ ShareEventID: 1, ShareGUID: 'guid-123' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockShareEvent]);

      // Act
      const result = await sharingService.logShareEvent(shareData, 1, metadata);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('trackClick', () => {
    it('should track click and return redirect URL', async () => {
      // Arrange
      const trackingData = {
        trackingCode: 'test1234',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'
      };

      const mockTrackingLink = createMockTrackingLink({
        DestinationURL: 'https://example.com/destination'
      });

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockTrackingLink]) // Get tracking link
        .mockResolvedValueOnce([{ Count: 0 }]) // Check unique visitor
        .mockResolvedValueOnce([]) // Insert engagement event
        .mockResolvedValueOnce([]) // Update tracking link stats
        .mockResolvedValueOnce([]); // Update share event stats

      // Act
      const result = await sharingService.trackClick(trackingData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe('https://example.com/destination');
      expect(result.recorded).toBe(true);
    });

    it('should handle non-existent tracking code', async () => {
      // Arrange
      const trackingData = {
        trackingCode: 'invalid',
        ipAddress: '192.168.1.1'
      };

      vi.mocked(database.query).mockResolvedValueOnce([]); // No tracking link

      // Act
      const result = await sharingService.trackClick(trackingData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.recorded).toBe(false);
      expect(result.redirectUrl).toContain('localhost');
    });

    it('should detect unique visitor', async () => {
      // Arrange
      const trackingData = {
        trackingCode: 'test1234',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const mockTrackingLink = createMockTrackingLink();

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockTrackingLink])
        .mockResolvedValueOnce([{ Count: 0 }]) // Unique visitor
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.trackClick(trackingData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should detect repeat visitor', async () => {
      // Arrange
      const trackingData = {
        trackingCode: 'test1234',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const mockTrackingLink = createMockTrackingLink();

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockTrackingLink])
        .mockResolvedValueOnce([{ Count: 1 }]) // Repeat visitor
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.trackClick(trackingData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should parse user agent correctly', async () => {
      // Arrange
      const trackingData = {
        trackingCode: 'test1234',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      };

      const mockTrackingLink = createMockTrackingLink();

      vi.mocked(database.query)
        .mockResolvedValueOnce([mockTrackingLink])
        .mockResolvedValueOnce([{ Count: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.trackClick(trackingData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('getShareAnalytics', () => {
    it('should get analytics with filters', async () => {
      // Arrange
      const filters = {
        userId: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalShares: 10,
          TotalClicks: 50,
          TotalUniqueClicks: 30
        }])
        .mockResolvedValueOnce([
          { ShareChannel: 'Email', ShareCount: 5, TotalClicks: 25 },
          { ShareChannel: 'SMS', ShareCount: 5, TotalClicks: 25 }
        ])
        .mockResolvedValueOnce([
          { ContentItemID: 1, Title: 'Test Content', ShareCount: 10, TotalClicks: 50 }
        ])
        .mockResolvedValueOnce([createMockShareEvent()])
        .mockResolvedValueOnce([
          { Date: '2024-01-01', ShareCount: 5, ClickCount: 25 }
        ]);

      // Act
      const result = await sharingService.getShareAnalytics(filters);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.totalShares).toBe(10);
      expect(result.data?.totalClicks).toBe(50);
      expect(result.data?.totalUniqueClicks).toBe(30);
      expect(result.data?.sharesByChannel).toHaveLength(2);
    });

    it('should calculate click rate correctly', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalShares: 10,
          TotalClicks: 50,
          TotalUniqueClicks: 30
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.getShareAnalytics({ userId: 1 });

      // Assert
      expect(result.data?.averageClickRate).toBe(500); // 50 clicks / 10 shares = 500%
    });

    it('should handle zero shares', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{
          TotalShares: 0,
          TotalClicks: 0,
          TotalUniqueClicks: 0
        }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.getShareAnalytics({ userId: 1 });

      // Assert
      expect(result.data?.averageClickRate).toBe(0);
      expect(result.data?.totalShares).toBe(0);
    });

    it('should filter by channel', async () => {
      // Arrange
      const filters = {
        userId: 1,
        channel: 'Email' as const
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ TotalShares: 5, TotalClicks: 25, TotalUniqueClicks: 15 }])
        .mockResolvedValueOnce([{ ShareChannel: 'Email', ShareCount: 5, TotalClicks: 25 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.getShareAnalytics(filters);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should filter by content', async () => {
      // Arrange
      const filters = {
        userId: 1,
        contentId: 1
      };

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ TotalShares: 5, TotalClicks: 25, TotalUniqueClicks: 15 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await sharingService.getShareAnalytics(filters);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('getTemplateForChannel', () => {
    it('should return SMS template', () => {
      // Act
      const result = sharingService.getTemplateForChannel('SMS');

      // Assert
      expect(result.channel).toBe('SMS');
      expect(result.templateName).toBe('default_sms');
      expect(result.maxLength).toBe(160);
      expect(result.body).toContain('{trackingLink}');
    });

    it('should return Email template', () => {
      // Act
      const result = sharingService.getTemplateForChannel('Email');

      // Assert
      expect(result.channel).toBe('Email');
      expect(result.templateName).toBe('default_email');
      expect(result.subject).toBeDefined();
      expect(result.body).toBeDefined();
    });

    it('should return Facebook template', () => {
      // Act
      const result = sharingService.getTemplateForChannel('Social', 'Facebook');

      // Assert
      expect(result.channel).toBe('Social');
      expect(result.socialPlatform).toBe('Facebook');
      expect(result.maxLength).toBe(5000);
    });

    it('should return Twitter template', () => {
      // Act
      const result = sharingService.getTemplateForChannel('Social', 'Twitter');

      // Assert
      expect(result.channel).toBe('Social');
      expect(result.socialPlatform).toBe('Twitter');
      expect(result.maxLength).toBe(280);
    });

    it('should return LinkedIn template', () => {
      // Act
      const result = sharingService.getTemplateForChannel('Social', 'LinkedIn');

      // Assert
      expect(result.channel).toBe('Social');
      expect(result.socialPlatform).toBe('LinkedIn');
      expect(result.maxLength).toBe(3000);
    });

    it('should default to Facebook for unknown social platform', () => {
      // Act
      const result = sharingService.getTemplateForChannel('Social', 'Unknown' as any);

      // Assert
      expect(result.socialPlatform).toBe('Facebook');
    });
  });
});
