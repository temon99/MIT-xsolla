// utils/loginSetup.js
import { LoginPage } from '../pages/LoginPage.js'; // ✅ match file & class

export async function loginBeforeEachTest(page) {
  const loginPage = new LoginPage(page);
  await loginPage.login(); // ✅ this will now work
}
