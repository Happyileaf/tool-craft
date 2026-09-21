import { defineConfig, devices } from '@playwright/test';

/**
 * 仓库级 Playwright 配置：e2e 用例位于 ./e2e，本地复用已启动的服务，CI 中自动拉起 web 与 api
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @tool-craft/web start',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @tool-craft/api start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
