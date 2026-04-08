import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { addDays } from 'date-fns';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser, createTestContact } from '../helpers/api-helpers.js';
import { testUsers } from '../fixtures/users.js';
import { testContacts } from '../fixtures/contacts.js';
import { newFollowUpData, followUpUpdates, snoozeOptions, followUpFilters } from '../fixtures/followups.js';

describe('Follow-up API', () => {
  let testData: any;
  let ufoToken: string;
  let ufo2Token: string;
  let ufoUserId: number;
  let testContactId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();

    const ufo = await loginUser(testUsers.ufo.email);
    const ufo2 = await loginUser(testUsers.ufo2.email);

    ufoToken = ufo.token;
    ufo2Token = ufo2.token;
    ufoUserId = ufo.user.id;
    testContactId = testContacts.contact1.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('POST /api/v1/followups', () => {
    it('should create follow-up with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.valid)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(newFollowUpData.valid.title);
      expect(response.body.data.contactId).toBe(newFollowUpData.valid.contactId);
      expect(response.body.data.priority).toBe(newFollowUpData.valid.priority);
      expect(response.body.data.followUpId).toBeDefined();
    });

    it('should create follow-up with minimal data', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.minimal)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newFollowUpData.minimal.title);
      expect(response.body.data.status).toBe('Pending'); // Default status
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .send(newFollowUpData.valid)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.missingTitle)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with missing due date', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.missingDueDate)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with missing contact', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.missingContact)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with invalid contact id', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.invalidContactId)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contact');
    });

    it('should not allow creating follow-up for other users contacts', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufo2Token}`)
        .send({
          ...newFollowUpData.valid,
          contactId: testContactId // This belongs to ufo, not ufo2
        })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow past due dates (for overdue follow-ups)', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.pastDueDate)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should default priority to Medium', async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Default Priority',
          dueDate: addDays(new Date(), 1).toISOString()
        })
        .expect(201);

      expect(response.body.data.priority).toBe('Medium');
    });
  });

  describe('GET /api/v1/followups', () => {
    it('should list all follow-ups for current user', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should not show other users follow-ups', async () => {
      // Create a follow-up for ufo2
      const contact = await createTestContact(ufo2Token, {
        firstName: 'Test',
        lastName: 'Contact',
        email: 'test.ufo2@example.com'
      });

      await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufo2Token}`)
        .send({
          contactId: contact.contactId,
          title: 'UFO2 Follow-up',
          dueDate: addDays(new Date(), 1).toISOString()
        });

      // UFO should not see UFO2's follow-ups
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      const ufo2FollowUp = response.body.data.find((f: any) => f.title === 'UFO2 Follow-up');
      expect(ufo2FollowUp).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ status: 'Pending' })
        .expect(200);

      response.body.data.forEach((followUp: any) => {
        expect(followUp.status).toBe('Pending');
      });
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ priority: 'High' })
        .expect(200);

      response.body.data.forEach((followUp: any) => {
        expect(followUp.priority).toBe('High');
      });
    });

    it('should filter by contact', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ contactId: testContactId })
        .expect(200);

      response.body.data.forEach((followUp: any) => {
        expect(followUp.contactId).toBe(testContactId);
      });
    });

    it('should sort by due date', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ sortBy: 'dueDate', sortOrder: 'asc' })
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          const prevDate = new Date(response.body.data[i - 1].dueDate);
          const currDate = new Date(response.body.data[i].dueDate);
          expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
        }
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/followups')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/followups/:id', () => {
    let followUpId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newFollowUpData.valid);

      followUpId = response.body.data.followUpId;
    });

    it('should get follow-up by id', async () => {
      const response = await request(app)
        .get(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followUpId).toBe(followUpId);
    });

    it('should return 404 for non-existent follow-up', async () => {
      const response = await request(app)
        .get('/api/v1/followups/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow accessing other users follow-ups', async () => {
      const response = await request(app)
        .get(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/followups/${followUpId}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/v1/followups/:id', () => {
    let followUpId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Follow-up to Update',
          dueDate: addDays(new Date(), 1).toISOString()
        });

      followUpId = response.body.data.followUpId;
    });

    it('should update follow-up title', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(followUpUpdates.updateTitle)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(followUpUpdates.updateTitle.title);
    });

    it('should update follow-up due date', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(followUpUpdates.updateDueDate)
        .expect(200);

      expect(response.body.data.dueDate).toBe(followUpUpdates.updateDueDate.dueDate);
    });

    it('should update follow-up priority', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(followUpUpdates.updatePriority)
        .expect(200);

      expect(response.body.data.priority).toBe(followUpUpdates.updatePriority.priority);
    });

    it('should update follow-up status', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(followUpUpdates.updateStatus)
        .expect(200);

      expect(response.body.data.status).toBe(followUpUpdates.updateStatus.status);
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(followUpUpdates.updateAll)
        .expect(200);

      expect(response.body.data.title).toBe(followUpUpdates.updateAll.title);
      expect(response.body.data.priority).toBe(followUpUpdates.updateAll.priority);
      expect(response.body.data.status).toBe(followUpUpdates.updateAll.status);
    });

    it('should not allow updating other users follow-ups', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .send({ title: 'Hacked' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent follow-up', async () => {
      const response = await request(app)
        .put('/api/v1/followups/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ title: 'Fail' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/followups/${followUpId}`)
        .send({ title: 'Fail' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/v1/followups/:id', () => {
    let followUpId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Follow-up to Delete',
          dueDate: addDays(new Date(), 1).toISOString()
        });

      followUpId = response.body.data.followUpId;
    });

    it('should delete follow-up', async () => {
      const response = await request(app)
        .delete(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      await request(app)
        .get(`/api/v1/followups/${followUpId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);
    });

    it('should not allow deleting other users follow-ups', async () => {
      const createResponse = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Protected Follow-up',
          dueDate: addDays(new Date(), 1).toISOString()
        });

      const response = await request(app)
        .delete(`/api/v1/followups/${createResponse.body.data.followUpId}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent follow-up', async () => {
      const response = await request(app)
        .delete('/api/v1/followups/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/followups/1')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/followups/:id/complete', () => {
    let followUpId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Follow-up to Complete',
          dueDate: addDays(new Date(), 1).toISOString()
        });

      followUpId = response.body.data.followUpId;
    });

    it('should mark follow-up as completed', async () => {
      const response = await request(app)
        .post(`/api/v1/followups/${followUpId}/complete`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ notes: 'Successfully contacted' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Completed');
      expect(response.body.data.completedDate).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/followups/${followUpId}/complete`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/followups/:id/snooze', () => {
    let followUpId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/followups')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          contactId: testContactId,
          title: 'Follow-up to Snooze',
          dueDate: new Date().toISOString()
        });

      followUpId = response.body.data.followUpId;
    });

    it('should snooze follow-up for specified duration', async () => {
      const response = await request(app)
        .post(`/api/v1/followups/${followUpId}/snooze`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ duration: snoozeOptions.oneDay.duration })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dueDate).toBeDefined();

      // Due date should be pushed forward
      const newDueDate = new Date(response.body.data.dueDate);
      const now = new Date();
      expect(newDueDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should fail with invalid duration', async () => {
      const response = await request(app)
        .post(`/api/v1/followups/${followUpId}/snooze`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ duration: -1 })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/followups/${followUpId}/snooze`)
        .send({ duration: 3600 })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/followups/upcoming', () => {
    it('should get upcoming follow-ups', async () => {
      const response = await request(app)
        .get('/api/v1/followups/upcoming')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All should have future due dates
      response.body.data.forEach((followUp: any) => {
        const dueDate = new Date(followUp.dueDate);
        expect(dueDate.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should support limiting results', async () => {
      const response = await request(app)
        .get('/api/v1/followups/upcoming')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/followups/upcoming')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/followups/overdue', () => {
    it('should get overdue follow-ups', async () => {
      const response = await request(app)
        .get('/api/v1/followups/overdue')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All should have past due dates and not be completed
      response.body.data.forEach((followUp: any) => {
        const dueDate = new Date(followUp.dueDate);
        expect(dueDate.getTime()).toBeLessThan(Date.now());
        expect(followUp.status).not.toBe('Completed');
      });
    });

    it('should only show current users overdue follow-ups', async () => {
      const response = await request(app)
        .get('/api/v1/followups/overdue')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      response.body.data.forEach((followUp: any) => {
        expect(followUp.userId).toBe(ufoUserId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/followups/overdue')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/followups/templates', () => {
    it('should get follow-up templates', async () => {
      const response = await request(app)
        .get('/api/v1/followups/templates')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return template details', async () => {
      const response = await request(app)
        .get('/api/v1/followups/templates')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach((template: any) => {
          expect(template.title).toBeDefined();
          expect(template.description).toBeDefined();
        });
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/followups/templates')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
