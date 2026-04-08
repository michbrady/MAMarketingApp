import dotenv from 'dotenv';

// Load test environment variables BEFORE any other modules
// This runs before all tests and ensures .env.test is loaded first
dotenv.config({ path: '.env.test', override: true });

console.log('[GLOBAL SETUP] Loaded .env.test');
console.log('[GLOBAL SETUP] DB_NAME =', process.env.DB_NAME);

export function setup() {
  // Vitest global setup hook
}
