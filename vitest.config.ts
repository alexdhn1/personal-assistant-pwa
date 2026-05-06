import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/unit/**/*.test.ts', 'src/tests/integration/**/*.test.tsx'],
    exclude: ['src/tests/e2e/**'],
    setupFiles: ['./src/tests/setup.ts'],
    server: {
      deps: {
        inline: ['@octokit/rest', '@octokit/core', '@octokit/plugin-rest-endpoint-methods'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['src/lib/**', 'src/hooks/**', 'src/stores/**'],
      exclude: ['src/tests/**', 'src/pages/**', 'src/components/**'],
    },
  },
})
