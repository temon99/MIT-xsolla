// pages/LoginPage.js
import dotenv from 'dotenv';
dotenv.config();

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('div').filter({ hasText: /^Email$/ }).locator('div').nth(1).locator('input[type="email"]');
    this.passwordInput = page.locator('div').filter({ hasText: /^Password$/ }).locator('div').nth(1).locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
  }

  async login() {
    await this.gotoLoginPage();
    await this.loginWithEnvCredentials();
    await this.waitForOtpInput();
    await this.fillOtpCode();
  }

  async gotoLoginPage() {
    await this.page.goto(process.env.XSOLLA_BASE_URL);
  }

  async loginWithEnvCredentials() {
    const email = process.env.EMAIL;
    const password = process.env.GOOGLE_PASSWORD;

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async waitForOtpInput() {
    await this.page.waitForSelector('[data-testid="input-code-1"]', {
      timeout: parseInt(process.env.TIMEOUT) || 30000,
    });
  }

  async fillOtpCode(otp, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      if (!otp) {
        const { fetchLatestOtp } = await import(`../utils/imapClient.js?update=${Date.now()}`);
        otp = await fetchLatestOtp({
          email: process.env.EMAIL,
          appPassword: process.env.APP_PASSWORD,
        });
        console.log(`Fetched OTP (Attempt ${attempt}):`, otp);
      }

      for (let i = 0; i < 6; i++) {
        await this.page.getByTestId(`input-code-${i + 1}`).fill(otp[i]);
      }

      await this.page.getByRole('button', { name: 'Verify' }).click();

      try {
        await this.page.getByRole('link', { name: 'All projects' }).waitFor({ timeout: 8000 });
        await this.page.getByRole('link', { name: 'All projects' }).click();
        return;
      } catch {
        if (attempt < retries) {
          otp = null;
        } else {
          throw new Error('OTP verification failed after retries');
        }
      }
    }
  }
}
