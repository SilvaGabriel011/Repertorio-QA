import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'smoke', testDir: 'tests/smoke', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testDir: 'tests/api' },
    { name: 'security', testDir: 'tests/security' },
    { name: 'a11y', testDir: 'tests/a11y', use: { ...devices['Desktop Chrome'] } },
    { name: 'regression', testDir: 'tests/regression', use: { ...devices['Desktop Chrome'] } },
    { name: 'e2e', testDir: 'tests/e2e', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx tsx src/api/server.ts',
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: !process.env.CI,
  },
});
