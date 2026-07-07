import { seedCart } from '../support/api-client.js';
import { expect, test } from '../support/fixtures.js';

test.describe('checkout pricing on the UI', { tag: '@regression' }, () => {
  test('plain order above 300.00 ships free with no discount', async ({ request, signedIn, catalog, checkoutPage, confirmation, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p1', quantity: 2 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit();
    await confirmation.expectLoaded();
    await expect(confirmation.subtotal).toHaveText('$579.80');
    await expect(confirmation.discount).toHaveText('−$0.00 (none)');
    await expect(confirmation.shipping).toHaveText('Free');
    await expect(confirmation.total).toHaveText('$579.80');
  });

  test('QA20 coupon discounts 20% at the confirmation screen', async ({ request, signedIn, catalog, checkoutPage, confirmation, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p1', quantity: 2 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit('QA20');
    await confirmation.expectLoaded();
    await expect(confirmation.discount).toHaveText('−$115.96 (coupon)');
    await expect(confirmation.total).toHaveText('$463.84');
  });

  test('volume discount appears automatically for orders of 1000.00+', async ({ request, signedIn, catalog, checkoutPage, confirmation, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p3', quantity: 1 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit();
    await confirmation.expectLoaded();
    await expect(confirmation.discount).toHaveText('−$149.90 (volume)');
    await expect(confirmation.shipping).toHaveText('Free');
    await expect(confirmation.total).toHaveText('$1349.10');
  });

  test('a coupon that drops the order below 300.00 brings the shipping fee back', async ({ request, signedIn, catalog, checkoutPage, confirmation, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p6', quantity: 1 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit('WELCOME10');
    await confirmation.expectLoaded();
    await expect(confirmation.subtotal).toHaveText('$300.00');
    await expect(confirmation.discount).toHaveText('−$30.00 (coupon)');
    await expect(confirmation.shipping).toHaveText('$25.00');
    await expect(confirmation.total).toHaveText('$295.00');
  });

  test('an invalid coupon blocks the order and keeps the user on checkout', async ({ request, signedIn, catalog, checkoutPage, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p2', quantity: 1 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit('BOGUS');
    await expect(checkoutPage.error).toHaveText('This coupon code is not valid.');
    await expect(checkoutPage.view).toBeVisible();
  });

  test('an expired coupon gets its own message', async ({ request, signedIn, catalog, checkoutPage, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p2', quantity: 1 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await checkoutPage.submit('LEGACY30');
    await expect(checkoutPage.error).toHaveText('This coupon has expired.');
  });

  test('back returns to the catalog with the cart intact', async ({ request, signedIn, catalog, checkoutPage, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p4', quantity: 2 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.openCheckout();
    await expect(checkoutPage.view).toBeVisible();
    await checkoutPage.back.click();
    await catalog.expectLoaded();
    await expect(catalog.badge).toHaveText('2');
  });
});
