import { test as base } from '@playwright/test';
import { ALICE, login } from './api-client.js';
import { CatalogPage, CheckoutPage, ConfirmationPage, LoginPage } from './pages.js';

interface Fixtures {
  loginPage: LoginPage;
  catalog: CatalogPage;
  checkoutPage: CheckoutPage;
  confirmation: ConfirmationPage;
  signedIn: { token: string };
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  catalog: async ({ page }, use) => use(new CatalogPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  confirmation: async ({ page }, use) => use(new ConfirmationPage(page)),
  signedIn: async ({ page, request, catalog }, use) => {
    const token = await login(request);
    await page.addInitScript(
      ([token, email]) => {
        localStorage.setItem('token', token);
        localStorage.setItem('email', email);
      },
      [token, ALICE.email],
    );
    await page.goto('/');
    await catalog.expectLoaded();
    await use({ token });
  },
});

export { expect } from '@playwright/test';
