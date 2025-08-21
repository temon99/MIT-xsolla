// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    viewport:null,
    // headless: false,
    launchOptions: {
      headless: false,
      args: ['--start-maximized']
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  testDir: './tests',
  timeout: 60000,
});
