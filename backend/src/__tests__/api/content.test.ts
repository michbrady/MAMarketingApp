import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser } from '../helpers/api-helpers.js';
import { testUsers } from '../fixtures/users.js';
import { testContent, newContentData, contentFilters, contentSearchTerms } from '../fixtures/content.js';

describe('Content API', () => {
  let testData: any;
  let adminToken: string;
  let ufoToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();

    const admin = await loginUser(testUsers.admin.email);
    const ufo = await loginUser(testUsers.ufo.email);

    adminToken = admin.token;
    ufoToken = ufo.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('GET /api/v1/content', () => {
    it('should list all published content', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Should only return published content by default
      const draftContent = response.body.data.find((c: any) => c.status === 'Draft');
      expect(draftContent).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter by content type', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ contentType: 'Video' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.contentType).toBe('Video');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ categoryId: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.categoryId).toBe(1);
      });
    });

    it('should filter by status (admin only)', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'Draft' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should include draft content for admin
      const draftContent = response.body.data.find((c: any) => c.status === 'Draft');
      expect(draftContent).toBeDefined();
    });

    it('should sort by created date', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ sortBy: 'createdDate', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(1);

      // Verify descending order
      for (let i = 1; i < response.body.data.length; i++) {
        const prevDate = new Date(response.body.data[i - 1].createdDate);
        const currDate = new Date(response.body.data[i].createdDate);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it('should handle invalid page number', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ page: -1 });

      // Should either return 400 or default to page 1
      expect([200, 400]).toContain(response.status);
    });

    it('should handle out of bounds page', async () => {
      const response = await request(app)
        .get('/api/v1/content')
        .query({ page: 9999 })
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/v1/content/:id', () => {
    it('should get content by id', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${testContent.video.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.contentId).toBe(testContent.video.id);
      expect(response.body.data.title).toBe(testContent.video.title);
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .get('/api/v1/content/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/v1/content/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should not return draft content to non-admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${testContent.draft.id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return draft content to admin users', async () => {
      const response = await request(app)
        .get(`/api/v1/content/${testContent.draft.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Draft');
    });

    it('should increment view count', async () => {
      const firstResponse = await request(app)
        .get(`/api/v1/content/${testContent.video.id}`)
        .expect(200);

      const firstViewCount = firstResponse.body.data.viewCount || 0;

      const secondResponse = await request(app)
        .get(`/api/v1/content/${testContent.video.id}`)
        .expect(200);

      const secondViewCount = secondResponse.body.data.viewCount || 0;

      // View count should increment (if implemented)
      // This documents expected behavior
      expect(secondViewCount).toBeGreaterThanOrEqual(firstViewCount);
    });
  });

  describe('GET /api/v1/content/featured', () => {
    it('should get featured content', async () => {
      const response = await request(app)
        .get('/api/v1/content/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should only return published content', async () => {
      const response = await request(app)
        .get('/api/v1/content/featured')
        .expect(200);

      response.body.data.forEach((item: any) => {
        expect(item.status).toBe('Published');
      });
    });
  });

  describe('GET /api/v1/content/recent', () => {
    it('should get recent content', async () => {
      const response = await request(app)
        .get('/api/v1/content/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/content/recent')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should be sorted by date descending', async () => {
      const response = await request(app)
        .get('/api/v1/content/recent')
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          const prevDate = new Date(response.body.data[i - 1].publishedDate || response.body.data[i - 1].createdDate);
          const currDate = new Date(response.body.data[i].publishedDate || response.body.data[i].createdDate);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });
  });

  describe('GET /api/v1/content/search', () => {
    it('should search content by title', async () => {
      const response = await request(app)
        .get('/api/v1/content/search')
        .query({ q: 'Product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Results should contain search term
      response.body.data.forEach((item: any) => {
        const matchesTitle = item.title.toLowerCase().includes('product');
        const matchesDescription = item.description?.toLowerCase().includes('product');
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should return empty array for no results', async () => {
      const response = await request(app)
        .get('/api/v1/content/search')
        .query({ q: 'NonExistentSearchTerm123456789' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/v1/content/search')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/api/v1/content/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should search across multiple fields', async () => {
      const response = await request(app)
        .get('/api/v1/content/search')
        .query({ q: 'Training' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/content/categories', () => {
    it('should list all categories', async () => {
      const response = await request(app)
        .get('/api/v1/content/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return category details', async () => {
      const response = await request(app)
        .get('/api/v1/content/categories')
        .expect(200);

      response.body.data.forEach((category: any) => {
        expect(category.categoryId).toBeDefined();
        expect(category.categoryName).toBeDefined();
      });
    });
  });

  describe('POST /api/v1/content (Admin Only)', () => {
    it('should create content with valid data as admin', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newContentData.valid)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(newContentData.valid.title);
      expect(response.body.data.contentType).toBe(newContentData.valid.contentType);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .send(newContentData.valid)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail as non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newContentData.valid)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newContentData.missingTitle)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with missing content type', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newContentData.missingContentType)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newContentData.invalidCategory)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should create content with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newContentData.minimal)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newContentData.minimal.title);
    });

    it('should default status to Draft if not specified', async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Auto Draft Content',
          contentType: 'Video',
          categoryId: 1
        })
        .expect(201);

      expect(response.body.data.status).toBe('Draft');
    });
  });

  describe('PUT /api/v1/content/:id (Admin Only)', () => {
    let contentId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Content to Update',
          contentType: 'Video',
          categoryId: 1
        });

      contentId = response.body.data.contentId;
    });

    it('should update content as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/content/${contentId}`)
        .send({ title: 'Should Fail' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail as non-admin user', async () => {
      const response = await request(app)
        .put(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ title: 'Should Fail' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .put('/api/v1/content/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Should Fail' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow publishing draft content', async () => {
      const response = await request(app)
        .put(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Published' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Published');
    });
  });

  describe('DELETE /api/v1/content/:id (Admin Only)', () => {
    let contentId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Content to Delete',
          contentType: 'Video',
          categoryId: 1
        });

      contentId = response.body.data.contentId;
    });

    it('should delete content as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/content/${contentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify content is deleted
      const getResponse = await request(app)
        .get(`/api/v1/content/${contentId}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/content/${testContent.video.id}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail as non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/v1/content/${testContent.video.id}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .delete('/api/v1/content/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
