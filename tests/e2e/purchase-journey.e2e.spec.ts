import { ALICE, auth, BOB } from '../support/api-client.js';
import { expect, test } from '../support/fixtures.js';

test.describe('end-to-end journeys', { tag: '@e2e' }, () => {
  test('a shopper searches, builds a cart, applies a coupon and receives a consistent order', async ({
    page,
    request,
    loginPage,
    catalog,
    checkoutPage,
    confirmation,
  }) => {
    await loginPage.goto();
    await loginPage.signIn(ALICE.email, ALICE.password);
    await catalog.expectLoaded();

    await catalog.search.fill('keyboard');
    await expect(catalog.productCards).toHaveCount(1);
    await catalog.addToCart('p1');

    await catalog.search.clear();
    await expect(catalog.productCards).toHaveCount(6);
    await catalog.addToCart('p2');
    await catalog.addToCart('p2');
    await expect(catalog.badge).toHaveText('3');
    await expect(catalog.subtotal).toHaveText('$369.70');

    await catalog.openCheckout();
    await expect(checkoutPage.lines).toHaveCount(2);
    await checkoutPage.submit('WELCOME10');

    await confirmation.expectLoaded();
    await expect(confirmation.subtotal).toHaveText('$369.70');
    await expect(confirmation.discount).toHaveText('−$36.97 (coupon)');
    await expect(confirmation.shipping).toHaveText('Free');
    await expect(confirmation.total).toHaveText('$332.73');

    const orderId = (await confirmation.orderId.textContent()) ?? '';
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const apiOrder = await (
      await request.get(`/api/orders/${orderId}`, { headers: auth(token ?? '') })
    ).json();
    expect(apiOrder).toMatchObject({
      subtotalCents: 36_970,
      discountCents: 3_697,
      shippingCents: 0,
      totalCents: 33_273,
      couponCode: 'WELCOME10',
    });

    await confirmation.continueShopping.click();
    await catalog.expectLoaded();
    await expect(catalog.badge).toHaveText('0');
  });

  test('a volume shopper crosses the 1000.00 threshold and earns the automatic discount', async ({
    loginPage,
    catalog,
    checkoutPage,
    confirmation,
  }) => {
    await loginPage.goto();
    await loginPage.signIn(BOB.email, BOB.password);
    await catalog.expectLoaded();

    await catalog.addToCart('p3');
    await catalog.addToCart('p5');
    await expect(catalog.subtotal).toHaveText('$1599.00');

    await catalog.openCheckout();
    await checkoutPage.submit();

    await confirmation.expectLoaded();
    await expect(confirmation.discount).toHaveText('−$159.90 (volume)');
    await expect(confirmation.shipping).toHaveText('Free');
    await expect(confirmation.total).toHaveText('$1439.10');
  });
});
