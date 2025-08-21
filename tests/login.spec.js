// tests/login.spec.js

import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { Homepage } from '../pages/XsollaHomePage.js';

dotenv.config();

test('Login to Xsolla Publisher using Gmail OTP', async ({ browser }) => {
  const timeout = parseInt(process.env.TIMEOUT) || 30000;

  // ✅ Create a context that ignores TLS/SSL errors
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  const homepage = new Homepage(page);

  // ✅ Step 1: Go to login page
  await homepage.gotoLoginPage();

  // ✅ Step 2: Login using credentials from .env
  await homepage.loginWithEnvCredentials();

  // ✅ Step 3: Wait for OTP input fields to appear
  await homepage.waitForOtpInput();

  // ✅ Step 4: Auto-fetch latest OTP and fill it (with retry support)
  await homepage.fillOtpCode();

  // ✅ Go To Webshop Preview page
  const { Webshop } = await import('../pages/Webshop.js');
  const webshop = new Webshop(page);
  await webshop.goto();   
});

