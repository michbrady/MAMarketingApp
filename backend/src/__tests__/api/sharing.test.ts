import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser } from '../helpers/api-helpers.js';
import { testUsers } from '../fixtures/users.js';
import { testContent } from '../fixtures/content.js';
import { testContacts } from '../fixtures/contacts.js';

describe('Sharing API', () => {
  let testData: any;
  let ufoToken: string;
  let ufoUserId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();

    const ufo = await loginUser(testUsers.ufo.email);
    ufoToken = ufo.token;
    ufoUserId = ufo.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('POST /api/v1/share', () => {
    it('should create share via SMS', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone,
          contactId: testContacts.contact1.id
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.trackingCode).toBeDefined();
      expect(response.body.data.trackingUrl).toBeDefined();
      expect(response.body.data.channel).toBe('SMS');
    });

    it('should create share via Email', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'Email',
          recipientEmail: testContacts.contact1.email,
          contactId: testContacts.contact1.id
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('Email');
      expect(response.body.data.trackingCode).toBeDefined();
    });

    it('should create share via WhatsApp', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'WhatsApp',
          recipientPhone: testContacts.contact1.phone,
          contactId: testContacts.contact1.id
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('WhatsApp');
    });

    it('should create share via Facebook', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'Facebook'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('Facebook');
    });

    it('should create share via Twitter', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'Twitter'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('Twitter');
    });

    it('should generate unique tracking codes', async () => {
      const response1 = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        });

      const response2 = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact2.phone
        });

      expect(response1.body.data.trackingCode).not.toBe(response2.body.data.trackingCode);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with missing content ID', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with missing channel', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          recipientPhone: testContacts.contact1.phone
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with invalid channel', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'InvalidChannel'
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with non-existent content', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: 99999,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require recipient for SMS channel', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS'
          // Missing recipientPhone
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should require recipient for Email channel', async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'Email'
          // Missing recipientEmail
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should include message in share', async () => {
      const customMessage = 'Check out this amazing video!';
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone,
          message: customMessage
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/share/:trackingCode/track', () => {
    let trackingCode: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        });

      trackingCode = response.body.data.trackingCode;
    });

    it('should track click and redirect', async () => {
      const response = await request(app)
        .get(`/api/v1/share/${trackingCode}/track`)
        .expect(302); // Redirect

      expect(response.headers.location).toBeDefined();
      // Should redirect to content URL
    });

    it('should record click event', async () => {
      // First click
      await request(app)
        .get(`/api/v1/share/${trackingCode}/track`)
        .expect(302);

      // Verify click was recorded by checking analytics
      const analyticsResponse = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      // Should have at least one click
      expect(analyticsResponse.body.data.totalClicks).toBeGreaterThan(0);
    });

    it('should track multiple clicks', async () => {
      // Click twice
      await request(app).get(`/api/v1/share/${trackingCode}/track`);
      await request(app).get(`/api/v1/share/${trackingCode}/track`);

      // Both clicks should be tracked
      const analyticsResponse = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(analyticsResponse.body.data.totalClicks).toBeGreaterThan(1);
    });

    it('should return 404 for invalid tracking code', async () => {
      const response = await request(app)
        .get('/api/v1/share/invalid-tracking-code/track')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not require authentication for tracking', async () => {
      // Public endpoint - no auth needed
      const response = await request(app)
        .get(`/api/v1/share/${trackingCode}/track`)
        .expect(302);

      expect(response.headers.location).toBeDefined();
    });
  });

  describe('GET /api/v1/share/analytics', () => {
    beforeAll(async () => {
      // Create some shares for analytics
      await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.video.id,
          channel: 'SMS',
          recipientPhone: testContacts.contact1.phone
        });

      await request(app)
        .post('/api/v1/share')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contentId: testContent.document.id,
          channel: 'Email',
          recipientEmail: testContacts.contact2.email
        });
    });

    it('should get share analytics', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalShares).toBeDefined();
      expect(response.body.data.totalClicks).toBeDefined();
    });

    it('should filter analytics by date range', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter analytics by channel', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ channel: 'SMS' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter analytics by content', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ contentId: testContent.video.id })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should only show current users analytics', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      // All shares should belong to current user
      if (response.body.data.shares) {
        response.body.data.shares.forEach((share: any) => {
          expect(share.userId).toBe(ufoUserId);
        });
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/share/analytics')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/share/templates/:channel', () => {
    it('should get SMS template', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/SMS')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.channel).toBe('SMS');
    });

    it('should get Email template', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/Email')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.channel).toBe('Email');
    });

    it('should get WhatsApp template', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/WhatsApp')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('WhatsApp');
    });

    it('should get Facebook template', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/Facebook')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.channel).toBe('Facebook');
    });

    it('should return 404 for invalid channel', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/InvalidChannel')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should support template variables', async () => {
      const response = await request(app)
        .get('/api/v1/share/templates/SMS')
        .query({ contentId: testContent.video.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
      // Template should support variables like {{contentTitle}}, {{trackingUrl}}
    });

    it('should not require authentication', async () => {
      // Public endpoint
      const response = await request(app)
        .get('/api/v1/share/templates/SMS')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
