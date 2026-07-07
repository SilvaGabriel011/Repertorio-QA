import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../support/fixtures.js';

const scan = (page: Page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

test.describe('WCAG 2.1 A/AA', { tag: '@a11y' }, () => {
  test('login view has no violations', async ({ page, loginPage }) => {
    await loginPage.goto();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('catalog view has no violations', async ({ page, signedIn }) => {
    void signedIn;
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('checkout view has no violations', async ({ page, signedIn, catalog, checkoutPage }) => {
    void signedIn;
    await catalog.addToCart('p2');
    await expect(catalog.badge).toHaveText('1');
    await catalog.openCheckout();
    await expect(checkoutPage.view).toBeVisible();
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });
});
