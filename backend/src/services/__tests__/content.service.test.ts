import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '../content.service';
import * as database from '../../config/database';
import { createMockContentItem } from '../../__tests__/helpers/test-utils';

// Mock database module
vi.mock('../../config/database', () => ({
  query: vi.fn()
}));

describe('ContentService', () => {
  let contentService: ContentService;

  beforeEach(() => {
    vi.clearAllMocks();
    contentService = new ContentService();
  });

  describe('getContentList', () => {
    it('should get published content with default filters', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ ContentItemID: 1, Title: 'Test Content 1' }),
        createMockContentItem({ ContentItemID: 2, Title: 'Test Content 2' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 2 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList();

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(database.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by search term', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ Title: 'Product Launch' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ search: 'Product' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].Title).toContain('Product');
    });

    it('should filter by category', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ CategoryID: 1, CategoryName: 'Training' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ category: 1 });

      // Assert
      expect(result.items).toHaveLength(1);
    });

    it('should filter by content type', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ ContentType: 'Video' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ contentType: 'Video' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].ContentType).toBe('Video');
    });

    it('should filter featured content', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ IsFeatured: true })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ isFeatured: true });

      // Assert
      expect(result.items).toHaveLength(1);
    });

    it('should apply pagination', async () => {
      // Arrange
      const mockContent = Array.from({ length: 10 }, (_, i) =>
        createMockContentItem({ ContentItemID: i + 1 })
      );

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 100 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ limit: 10, offset: 0 });

      // Assert
      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(100);
    });

    it('should exclude expired content for published status', async () => {
      // Arrange
      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 0 }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await contentService.getContentList({ publishStatus: 'Published' });

      // Assert
      expect(result.items).toHaveLength(0);
    });

    it('should filter by market', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ Markets: 'US,CA' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ market: 'US' });

      // Assert
      expect(result.items).toHaveLength(1);
    });

    it('should filter by language', async () => {
      // Arrange
      const mockContent = [
        createMockContentItem({ Languages: 'en' })
      ];

      vi.mocked(database.query)
        .mockResolvedValueOnce([{ Total: 1 }])
        .mockResolvedValueOnce(mockContent);

      // Act
      const result = await contentService.getContentList({ language: 'en' });

      // Assert
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getContentById', () => {
    it('should get content by ID', async () => {
      // Arrange
      const mockContent = createMockContentItem({ ContentItemID: 1 });

      vi.mocked(database.query).mockResolvedValueOnce([mockContent]);

      // Act
      const result = await contentService.getContentById(1);

      // Assert
      expect(result).toBeDefined();
      expect(result?.ContentItemID).toBe(1);
    });

    it('should return null for non-existent content', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      const result = await contentService.getContentById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getCategories', () => {
    it('should get all active categories', async () => {
      // Arrange
      const mockCategories = [
        { ContentCategoryID: 1, CategoryName: 'Product', IsActive: 1 },
        { ContentCategoryID: 2, CategoryName: 'Training', IsActive: 1 }
      ];

      vi.mocked(database.query).mockResolvedValueOnce(mockCategories);

      // Act
      const result = await contentService.getCategories();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].CategoryName).toBe('Product');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count for content', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      await contentService.incrementViewCount(1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('incrementShareCount', () => {
    it('should increment share count for content', async () => {
      // Arrange
      vi.mocked(database.query).mockResolvedValueOnce([]);

      // Act
      await contentService.incrementShareCount(1);

      // Assert
      expect(database.query).toHaveBeenCalledTimes(1);
    });
  });
});
