import { defineConfig } from 'vitest/config'

// eslint-disable-next-line import-x/no-default-export
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    retry: process.env.CI === 'true' ? 2 : 0,
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        '*': { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
})
