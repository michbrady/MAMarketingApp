import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser } from '../helpers/api-helpers.js';
import { testUsers } from '../fixtures/users.js';
import { testContent } from '../fixtures/content.js';
import { testContacts } from '../fixtures/contacts.js';

describe('Analytics API', () => {
  let testData: any;
  let ufoToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();

    const ufo = await loginUser(testUsers.ufo.email);
    const admin = await loginUser(testUsers.admin.email);

    ufoToken = ufo.token;
    adminToken = admin.token;

    // Create some test shares for analytics
    await request(app)
      .post('/api/v1/share')
      .set('Authorization', `Bearer ${ufoToken}`)
      .send({
        contentId: testContent.video.id,
        channel: 'SMS',
        recipientPhone: testContacts.contact1.phone,
        contactId: testContacts.contact1.id
      });

    await request(app)
      .post('/api/v1/share')
      .set('Authorization', `Bearer ${ufoToken}`)
      .send({
        contentId: testContent.document.id,
        channel: 'Email',
        recipientEmail: testContacts.contact2.email,
        contactId: testContacts.contact2.id
      });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should get analytics overview', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalShares).toBeDefined();
      expect(response.body.data.totalClicks).toBeDefined();
      expect(response.body.data.totalViews).toBeDefined();
      expect(typeof response.body.data.totalShares).toBe('number');
    });

    it('should filter overview by date range', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include engagement metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .expect(200);

      expect(response.body.data.engagementRate).toBeDefined();
      expect(response.body.data.clickThroughRate).toBeDefined();
    });

    it('should work without authentication for public metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/trends', () => {
    it('should get share trends', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support time period grouping', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .query({ period: 'daily' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support weekly grouping', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .query({ period: 'weekly' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support monthly grouping', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .query({ period: 'monthly' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter trends by date range', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          period: 'daily'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include trend data points', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .query({ period: 'daily' })
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((point: any) => {
          expect(point.date).toBeDefined();
          expect(point.shares).toBeDefined();
          expect(point.clicks).toBeDefined();
        });
      }
    });
  });

  describe('GET /api/v1/analytics/channels', () => {
    it('should get channel performance', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/channels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include metrics for each channel', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/channels')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((channel: any) => {
          expect(channel.channel).toBeDefined();
          expect(channel.shares).toBeDefined();
          expect(channel.clicks).toBeDefined();
          expect(typeof channel.shares).toBe('number');
        });
      }
    });

    it('should sort channels by performance', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/channels')
        .query({ sortBy: 'shares' })
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          expect(response.body.data[i - 1].shares).toBeGreaterThanOrEqual(response.body.data[i].shares);
        }
      }
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/channels')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include click-through rates', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/channels')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((channel: any) => {
          expect(channel.clickThroughRate).toBeDefined();
        });
      }
    });
  });

  describe('GET /api/v1/analytics/top-content', () => {
    it('should get top performing content', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should include content metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((content: any) => {
          expect(content.contentId).toBeDefined();
          expect(content.title).toBeDefined();
          expect(content.shares).toBeDefined();
          expect(content.views).toBeDefined();
        });
      }
    });

    it('should sort by shares descending', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          expect(response.body.data[i - 1].shares).toBeGreaterThanOrEqual(response.body.data[i].shares);
        }
      }
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by content type', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/top-content')
        .query({ contentType: 'Video' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((content: any) => {
          expect(content.contentType).toBe('Video');
        });
      }
    });
  });

  describe('GET /api/v1/analytics/leaderboard', () => {
    it('should get user leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include user metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((user: any) => {
          expect(user.userId).toBeDefined();
          expect(user.firstName).toBeDefined();
          expect(user.lastName).toBeDefined();
          expect(user.totalShares).toBeDefined();
          expect(user.totalClicks).toBeDefined();
        });
      }
    });

    it('should sort by total shares descending', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          expect(response.body.data[i - 1].totalShares).toBeGreaterThanOrEqual(response.body.data[i].totalShares);
        }
      }
    });

    it('should support limiting results', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by market', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .query({ marketId: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/leaderboard')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((user: any) => {
          expect(user.email).toBeUndefined();
          expect(user.password).toBeUndefined();
          expect(user.passwordHash).toBeUndefined();
        });
      }
    });
  });

  describe('GET /api/v1/analytics/recent-shares', () => {
    it('should get recent shares', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should include share details', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((share: any) => {
          expect(share.shareId).toBeDefined();
          expect(share.contentTitle).toBeDefined();
          expect(share.channel).toBeDefined();
          expect(share.sharedDate).toBeDefined();
        });
      }
    });

    it('should be sorted by date descending', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          const prevDate = new Date(response.body.data[i - 1].sharedDate);
          const currDate = new Date(response.body.data[i].sharedDate);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    it('should filter by user', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .query({ userId: testUsers.ufo.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((share: any) => {
          expect(share.userId).toBe(testUsers.ufo.id);
        });
      }
    });

    it('should filter by channel', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .query({ channel: 'SMS' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((share: any) => {
          expect(share.channel).toBe('SMS');
        });
      }
    });

    it('should filter by content', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/recent-shares')
        .query({ contentId: testContent.video.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((share: any) => {
          expect(share.contentId).toBe(testContent.video.id);
        });
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large date ranges efficiently', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/analytics/trends')
        .query({
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          period: 'monthly'
        })
        .expect(200);

      const duration = Date.now() - startTime;

      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        request(app).get('/api/v1/analytics/overview'),
        request(app).get('/api/v1/analytics/trends'),
        request(app).get('/api/v1/analytics/channels'),
        request(app).get('/api/v1/analytics/top-content'),
        request(app).get('/api/v1/analytics/leaderboard')
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
