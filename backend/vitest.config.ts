import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/__tests__/',
        'src/types/',
        'src/config/',
        'src/utils/logger.ts',
        'src/index.ts',
        'src/middleware/',
        'src/routes/',
        'src/__tests__/setup/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      },
      include: ['src/services/**/*.ts']
    },
    testTimeout: 30000, // Increased for database operations
    hookTimeout: 30000, // Increased for test setup/teardown
    teardownTimeout: 30000,
    pool: 'forks', // Use forks for better database test isolation
    poolOptions: {
      forks: {
        singleFork: true // Run tests sequentially to avoid database conflicts
      }
    }
  }
});
