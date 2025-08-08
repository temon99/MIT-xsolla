// tests/webshop.spec.js
import { test, expect } from '@playwright/test';
import { loginBeforeEachTest } from '../Utils/loginSetup.js'
import { Webshop } from '../pages/Webshop.js';

test.beforeEach(async ({ page }) => {
  await loginBeforeEachTest(page);
});

test('Validate webshop page loads', async ({ page }) => {
  const webshop = new Webshop(page);
  await webshop.goto();

  await expect(page.getByText('Web Shop')).toBeVisible();
});
