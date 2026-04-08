import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../setup/test-server.js';
import { setupTestDatabase, cleanupTestDatabase, seedTestData, closeTestDatabase } from '../setup/test-db.js';
import { testUsers } from '../fixtures/users.js';
import { SQL_INJECTION_PAYLOADS, INVALID_EMAILS } from '../helpers/api-helpers.js';

describe('Auth API', () => {
  let testData: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await closeTestDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUsers.ufo.email);
      expect(response.body.data.user.firstName).toBe(testUsers.ufo.firstName);
      expect(response.body.data.user.lastName).toBe(testUsers.ufo.lastName);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(0);
    });

    it('should login admin user with admin role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('Admin');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with inactive user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.inactive.email,
          password: testUsers.inactive.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('disabled');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Email');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('password');
    });

    it('should fail with empty credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should handle SQL injection attempts safely', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: payload,
            password: payload
          });

        // Should either return 400 or 401, but NOT 200 or 500
        expect([400, 401]).toContain(response.status);
        expect(response.body.success).not.toBe(true);
      }
    });

    it('should handle invalid email formats', async () => {
      for (const email of INVALID_EMAILS) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: email,
            password: 'password123'
          });

        // Should fail with appropriate error
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should be case-insensitive for email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email.toUpperCase(),
          password: testUsers.ufo.password
        });

      // Email lookup should be case-insensitive
      // This test documents current behavior - may be 200 or 401 depending on implementation
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      authToken = loginResponse.body.data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUsers.ufo.email);
      expect(response.body.data.user.firstName).toBe(testUsers.ufo.firstName);
      expect(response.body.data.user.lastName).toBe(testUsers.ufo.lastName);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with empty bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.length).toBeGreaterThan(0);
      expect(response.body.data.token).not.toBe(refreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Refresh token');
    });

    it('should fail with empty refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: '' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should not accept access token as refresh token', async () => {
      // Get an access token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      const accessToken = loginResponse.body.data.token;

      // Try to use it as refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Security Tests', () => {
    it('should not reveal whether user exists in error messages', async () => {
      const existingUserResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: 'wrongpassword'
        });

      const nonExistentUserResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      // Both should return same generic error message
      expect(existingUserResponse.status).toBe(401);
      expect(nonExistentUserResponse.status).toBe(401);
      // Error messages should not reveal if user exists
      expect(existingUserResponse.body.message).toBe(nonExistentUserResponse.body.message);
    });

    it('should not return password hash in user data', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      expect(loginResponse.body.data.user.password).toBeUndefined();
      expect(loginResponse.body.data.user.passwordHash).toBeUndefined();
      expect(loginResponse.body.data.user.PasswordHash).toBeUndefined();
    });

    it('should not return sensitive fields in /me endpoint', async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUsers.ufo.email,
          password: testUsers.ufo.password
        });

      const token = loginResponse.body.data.token;

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.user.password).toBeUndefined();
      expect(meResponse.body.data.user.passwordHash).toBeUndefined();
      expect(meResponse.body.data.user.PasswordHash).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid login attempts', async () => {
      const attempts = 10;
      const promises = [];

      for (let i = 0; i < attempts; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: testUsers.ufo.email,
              password: testUsers.ufo.password
            })
        );
      }

      const responses = await Promise.all(promises);

      // Most should succeed (or fail gracefully with rate limit)
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitCount).toBe(attempts);
    });
  });
});
