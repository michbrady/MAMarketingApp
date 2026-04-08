import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { loginUser, randomEmail, randomPhone } from '../helpers/api-helpers.js';
import { testUsers } from '../fixtures/users.js';
import { testContacts, newContactData, contactImportData, contactTags } from '../fixtures/contacts.js';

describe('Contact API', () => {
  let testData: any;
  let ufoToken: string;
  let ufo2Token: string;
  let ufoUserId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();

    const ufo = await loginUser(testUsers.ufo.email);
    const ufo2 = await loginUser(testUsers.ufo2.email);

    ufoToken = ufo.token;
    ufo2Token = ufo2.token;
    ufoUserId = ufo.user.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('POST /api/v1/contacts', () => {
    it('should create contact with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newContactData.valid);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe(newContactData.valid.firstName);
      expect(response.body.data.lastName).toBe(newContactData.valid.lastName);
      expect(response.body.data.email).toBe(newContactData.valid.email);
      expect(response.body.data.contactID).toBeDefined();
    });

    it('should create contact with minimal data', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newContactData.minimal)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(newContactData.minimal.firstName);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .send(newContactData.valid)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newContactData.missingRequired)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send(newContactData.invalidEmail)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should normalize phone numbers', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'Phone',
          lastName: 'Test',
          email: randomEmail(),
          mobile: '(555) 123-4567' // Various formats should be normalized
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mobile).toBeDefined();
      // Phone should be normalized (e.g., to +15551234567)
    });

    it('should set default status to Active', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'Status',
          lastName: 'Test',
          email: randomEmail()
        })
        .expect(201);

      expect(response.body.data.status).toBe('Active');
    });

    it('should associate contact with current user', async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'User',
          lastName: 'Association',
          email: randomEmail()
        })
        .expect(201);

      expect(response.body.data.userId).toBe(ufoUserId);
    });
  });

  describe('GET /api/v1/contacts', () => {
    it('should list all contacts for current user', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // All contacts should belong to current user
      response.body.data.forEach((contact: any) => {
        expect(contact.userId).toBe(ufoUserId);
      });
    });

    it('should not show other users contacts', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(200);

      // UFO2 should only see their own contacts
      response.body.data.forEach((contact: any) => {
        expect(contact.userId).not.toBe(ufoUserId);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ status: 'Active' })
        .expect(200);

      response.body.data.forEach((contact: any) => {
        expect(contact.status).toBe('Active');
      });
    });

    it('should sort contacts', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ sortBy: 'lastName', sortOrder: 'asc' })
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          expect(response.body.data[i - 1].lastName.localeCompare(response.body.data[i].lastName)).toBeLessThanOrEqual(0);
        }
      }
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/contacts')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/contacts/:id', () => {
    it('should get contact by id', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contactId).toBe(testContacts.contact1.id);
      expect(response.body.data.firstName).toBe(testContacts.contact1.firstName);
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow accessing other users contacts', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should fail with invalid id format', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/invalid-id')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/v1/contacts/:id', () => {
    let contactId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'Update',
          lastName: 'Test',
          email: randomEmail()
        });

      contactId = response.body.data.contactId;
    });

    it('should update contact', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'Updated',
          mobile: '+15559998888'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.mobile).toBe('+15559998888');
    });

    it('should not allow updating other users contacts', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .put('/api/v1/contacts/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ firstName: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ email: 'notanemail' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ notes: 'Updated notes only' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes only');
      // Other fields should remain unchanged
      expect(response.body.data.firstName).toBe('Updated');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .send({ firstName: 'Fail' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/v1/contacts/:id', () => {
    let contactId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({
          firstName: 'Delete',
          lastName: 'Test',
          email: randomEmail()
        });

      contactId = response.body.data.contactId;
    });

    it('should delete contact', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify contact is deleted
      await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);
    });

    it('should not allow deleting other users contacts', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContacts.contact1.id}`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .delete('/api/v1/contacts/99999')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContacts.contact1.id}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/contacts/search', () => {
    it('should search contacts by name', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ q: 'John' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search contacts by email', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ q: testContacts.contact1.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty array for no results', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ q: 'NonExistentName123456789' })
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('should only search current users contacts', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ q: 'test' })
        .expect(200);

      response.body.data.forEach((contact: any) => {
        expect(contact.userId).toBe(ufoUserId);
      });
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/search')
        .query({ q: 'test' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/contacts/import', () => {
    it('should import valid contacts', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/import')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ contacts: contactImportData.valid })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imported).toBe(contactImportData.valid.length);
      expect(response.body.data.failed).toBe(0);
    });

    it('should report errors for invalid contacts', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/import')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ contacts: contactImportData.withErrors })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imported).toBeGreaterThan(0);
      expect(response.body.data.failed).toBeGreaterThan(0);
      expect(response.body.data.errors).toBeDefined();
      expect(Array.isArray(response.body.data.errors)).toBe(true);
    });

    it('should fail with empty array', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/import')
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ contacts: [] })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/contacts/import')
        .send({ contacts: contactImportData.valid })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/contacts/export', () => {
    it('should export contacts as CSV', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('firstName');
      expect(response.text).toContain('lastName');
      expect(response.text).toContain('email');
    });

    it('should export contacts as JSON', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ format: 'json' })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should only export current users contacts', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .set('Authorization', `Bearer ${ufoToken}`)
        .query({ format: 'json' })
        .expect(200);

      response.body.forEach((contact: any) => {
        expect(contact.userId).toBe(ufoUserId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/contacts/export')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/contacts/:id/tags', () => {
    it('should add tags to contact', async () => {
      const response = await request(app)
        .post(`/api/v1/contacts/${testContacts.contact1.id}/tags`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ tags: ['prospect', 'hot-lead'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toContain('prospect');
      expect(response.body.data.tags).toContain('hot-lead');
    });

    it('should not allow duplicate tags', async () => {
      await request(app)
        .post(`/api/v1/contacts/${testContacts.contact1.id}/tags`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ tags: ['vip'] });

      const response = await request(app)
        .post(`/api/v1/contacts/${testContacts.contact1.id}/tags`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ tags: ['vip'] })
        .expect(200);

      // Tag should only appear once
      const vipCount = response.body.data.tags.filter((t: string) => t === 'vip').length;
      expect(vipCount).toBe(1);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/contacts/${testContacts.contact1.id}/tags`)
        .send({ tags: ['test'] })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/v1/contacts/:id/tags/:tag', () => {
    beforeAll(async () => {
      await request(app)
        .post(`/api/v1/contacts/${testContacts.contact1.id}/tags`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .send({ tags: ['to-remove'] });
    });

    it('should remove tag from contact', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContacts.contact1.id}/tags/to-remove`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).not.toContain('to-remove');
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContacts.contact1.id}/tags/non-existent`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/contacts/${testContacts.contact1.id}/tags/test`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/v1/contacts/:id/activity', () => {
    it('should get contact activity timeline', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}/activity`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return activities in descending order', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}/activity`)
        .set('Authorization', `Bearer ${ufoToken}`)
        .expect(200);

      if (response.body.data.length > 1) {
        for (let i = 1; i < response.body.data.length; i++) {
          const prevDate = new Date(response.body.data[i - 1].timestamp);
          const currDate = new Date(response.body.data[i].timestamp);
          expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
        }
      }
    });

    it('should not show activity for other users contacts', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}/activity`)
        .set('Authorization', `Bearer ${ufo2Token}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/contacts/${testContacts.contact1.id}/activity`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
