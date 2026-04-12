import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/types/**', 'src/config/db.ts'],
      reporter: ['text', 'html'],
    },
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    env: {
      JWT_SECRET: 'test_secret',
      ABACATE_PAY_API_KEY: 'test_api_key',
      ABACATE_PAY_WEBHOOK_SECRET: 'test_webhook_secret',
    },
  },
});
