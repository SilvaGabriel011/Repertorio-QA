import { expect, test } from '@playwright/test';
import { auth, checkout, login, seedCart } from '../support/api-client.js';

test.describe('POST /api/checkout', { tag: '@api' }, () => {
  test('prices a plain order: no discount, free shipping above threshold', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p1', quantity: 2 }]);

    const response = await checkout(request, token);
    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({
      subtotalCents: 57_980,
      discountCents: 0,
      discountSource: 'none',
      shippingCents: 0,
      totalCents: 57_980,
    });
  });

  test('applies the best discount: QA20 coupon beats volume 10%', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p3', quantity: 1 }]);

    const order = await (await checkout(request, token, 'QA20')).json();
    expect(order).toMatchObject({
      subtotalCents: 149_900,
      discountCents: 29_980,
      discountSource: 'coupon',
      shippingCents: 0,
      totalCents: 119_920,
    });
  });

  test('grants the volume discount without a coupon at 1000.00+', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p5', quantity: 10 }]);

    const order = await (await checkout(request, token)).json();
    expect(order).toMatchObject({
      subtotalCents: 100_000,
      discountCents: 10_000,
      discountSource: 'volume',
      totalCents: 90_000,
    });
  });

  test('re-charges shipping when the coupon drops the order below 300.00', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p6', quantity: 1 }]);

    const order = await (await checkout(request, token, 'WELCOME10')).json();
    expect(order).toMatchObject({
      subtotalCents: 30_000,
      discountCents: 3_000,
      shippingCents: 2_500,
      totalCents: 29_500,
    });
  });

  test('rejects an empty cart with 422', async ({ request }) => {
    const token = await login(request);
    const response = await checkout(request, token);
    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({ error: 'empty_cart' });
  });

  const badCoupons = [
    { coupon: 'BOGUS', error: 'coupon_invalid' },
    { coupon: 'LEGACY30', error: 'coupon_expired' },
  ];
  for (const { coupon, error } of badCoupons) {
    test(`rejects coupon ${coupon} with 422 and preserves the cart`, async ({ request }) => {
      const token = await login(request);
      await seedCart(request, token, [{ productId: 'p2', quantity: 1 }]);

      const response = await checkout(request, token, coupon);
      expect(response.status()).toBe(422);
      expect(await response.json()).toEqual({ error });

      const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
      expect(cart.items).toHaveLength(1);
    });
  }

  test('clears the cart after a successful order', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p2', quantity: 1 }]);
    await checkout(request, token);

    const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
    expect(cart.items).toEqual([]);
  });

  test('persists the order and returns it on GET /api/orders/:id', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p4', quantity: 3 }]);
    const order = await (await checkout(request, token)).json();

    const fetched = await request.get(`/api/orders/${order.id}`, { headers: auth(token) });
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toEqual(order);
  });
});
