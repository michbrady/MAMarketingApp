// CRITICAL: Load .env.test FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', override: true });

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock logger to prevent console noise during tests
vi.mock('../../utils/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

// Setup before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key_for_testing';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.TRACKING_BASE_URL = 'http://localhost:3000/s';
});

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
