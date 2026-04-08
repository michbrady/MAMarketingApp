import request from 'supertest';
import app from '../setup/test-server.js';

/**
 * Login helper to get authentication token
 */
export async function loginUser(email: string, password: string = 'password123'): Promise<{
  token: string;
  refreshToken: string;
  user: any;
}> {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    token: response.body.data.token,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user
  };
}

/**
 * Create authenticated request helper
 */
export function authenticatedRequest(method: 'get' | 'post' | 'put' | 'delete', url: string, token: string) {
  return request(app)[method](url).set('Authorization', `Bearer ${token}`);
}

/**
 * Test SQL injection attempts
 */
export const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE User; --",
  "' UNION SELECT * FROM User --",
  "admin'--",
  "' OR 1=1--"
];

/**
 * Test XSS payloads
 */
export const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>'
];

/**
 * Test invalid email formats
 */
export const INVALID_EMAILS = [
  'notanemail',
  '@example.com',
  'user@',
  'user @example.com',
  'user@example',
  ''
];

/**
 * Test invalid phone formats
 */
export const INVALID_PHONES = [
  '123',
  'abcdefghij',
  '+1-555-ABC-DEFG',
  '555 5555',
  ''
];

/**
 * Helper to create test content
 */
export async function createTestContent(token: string, data: {
  title: string;
  description?: string;
  contentType: string;
  categoryId: number;
}): Promise<any> {
  const response = await request(app)
    .post('/api/v1/content')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .expect(201);

  return response.body.data;
}

/**
 * Helper to create test contact
 */
export async function createTestContact(token: string, data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): Promise<any> {
  const response = await request(app)
    .post('/api/v1/contacts')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .expect(201);

  return response.body.data;
}

/**
 * Helper to create test follow-up
 */
export async function createTestFollowUp(token: string, data: {
  contactId: number;
  title: string;
  dueDate: string;
  priority?: string;
}): Promise<any> {
  const response = await request(app)
    .post('/api/v1/followups')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .expect(201);

  return response.body.data;
}

/**
 * Wait helper for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random phone
 */
export function randomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${exchange}${number}`;
}
