const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true, viewport: { width: 1440, height: 1040 }, screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/serve.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: true }
});
