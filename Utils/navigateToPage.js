// utils/navigateToPage.js
import dotenv from 'dotenv';
dotenv.config();
import { disableAnimations } from './disableAnimations.js'
import { scrollPage } from './scrollUtils.js';

/**
 * Navigates to a specific path on the base URL and waits for network to settle.
 * @param {import('playwright').Page} page - The Playwright page object.
 * @param {string} slug - The path after BASE_URL (e.g., "/home" or "/capabilities/authentication")
 * @param {Object} [options]
 * @param {string} [options.selector] - Optional selector to wait for
 * @param {number} [options.timeout] - Timeout to wait for selector
 */
export async function goToPage(page, slug, options = {}) {
  const {
    // selector,
    timeout = 20000,
    disableAnimation = true,
    scroll= false
  } = options;

  const url = `${process.env.WEB_SHOP_Main}`;
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (disableAnimation) {
    await disableAnimations(page);
  }
  if(scroll){
    await scrollPage(page);
  }

  // if (selector) {
  //   await page.waitForSelector(selector, { timeout });
  // }
}
