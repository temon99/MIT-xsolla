// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  testDir: './tests',
  timeout: 60000,
});
