import { expect, test } from '../support/fixtures.js';
import { ALICE } from '../support/api-client.js';

test.describe('smoke — critical path gate', { tag: '@smoke' }, () => {
  test('service reports healthy', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('catalog API answers without authentication', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    expect(await response.json()).toHaveLength(6);
  });

  test('user signs in through the UI and sees the catalog', async ({ loginPage, catalog }) => {
    await loginPage.goto();
    await loginPage.signIn(ALICE.email, ALICE.password);
    await catalog.expectLoaded();
    await expect(catalog.userEmail).toHaveText(ALICE.email);
  });

  test('signed-in user can put a product in the cart', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p2');
    await expect(catalog.badge).toHaveText('1');
    await expect(catalog.checkoutButton).toBeEnabled();
  });
});
