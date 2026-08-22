import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    /**
     * Set before any module loads, so config/env.ts validates against these
     * rather than the developer's local .env. dotenv does not override
     * variables that are already present.
     */
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/badebhaiya_test?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-value-that-is-long-enough-32',
      JWT_REFRESH_SECRET: 'test-refresh-secret-value-that-is-different-32',
      CORS_ORIGINS: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
      BCRYPT_ROUNDS: '10',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/server.ts'],
    },
  },
});
