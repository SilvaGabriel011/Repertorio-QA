import { expect, test } from '@playwright/test';
import { auth, login, seedCart } from '../support/api-client.js';

test.describe('cart endpoints', { tag: '@api' }, () => {
  test('require authentication', async ({ request }) => {
    for (const call of [
      request.get('/api/cart'),
      request.post('/api/cart', { data: { productId: 'p1', quantity: 1 } }),
      request.delete('/api/cart/p1'),
    ]) {
      const response = await call;
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'unauthorized' });
    }
  });

  test('adds a product and reads it back', async ({ request }) => {
    const token = await login(request);
    const created = await request.post('/api/cart', {
      headers: auth(token),
      data: { productId: 'p4', quantity: 2 },
    });
    expect(created.status()).toBe(201);

    const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
    expect(cart.items).toEqual([
      { productId: 'p4', name: 'Laptop Stand', unitPriceCents: 12000, quantity: 2 },
    ]);
  });

  test('merges repeated adds of the same product into one line', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [
      { productId: 'p2', quantity: 2 },
      { productId: 'p2', quantity: 3 },
    ]);
    const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(5);
  });

  test('rejects a merge beyond 10 units and leaves the cart untouched', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p2', quantity: 9 }]);
    const response = await request.post('/api/cart', {
      headers: auth(token),
      data: { productId: 'p2', quantity: 2 },
    });
    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({ error: 'quantity_limit' });

    const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
    expect(cart.items[0].quantity).toBe(9);
  });

  const invalidQuantities = [0, 11, 1.5, '3', null, undefined];
  for (const quantity of invalidQuantities) {
    test(`rejects add with quantity ${JSON.stringify(quantity)} as 422`, async ({ request }) => {
      const token = await login(request);
      const response = await request.post('/api/cart', {
        headers: auth(token),
        data: { productId: 'p1', quantity },
      });
      expect(response.status()).toBe(422);
      expect(await response.json()).toEqual({ error: 'invalid_quantity' });
    });
  }

  test('returns 404 when adding an unknown product', async ({ request }) => {
    const token = await login(request);
    const response = await request.post('/api/cart', {
      headers: auth(token),
      data: { productId: 'p999', quantity: 1 },
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'product_not_found' });
  });

  test('updates line quantity via PATCH', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p5', quantity: 1 }]);
    const response = await request.patch('/api/cart/p5', {
      headers: auth(token),
      data: { quantity: 7 },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).items[0].quantity).toBe(7);
  });

  test('PATCH on a product not in the cart returns 404', async ({ request }) => {
    const token = await login(request);
    const response = await request.patch('/api/cart/p5', {
      headers: auth(token),
      data: { quantity: 2 },
    });
    expect(response.status()).toBe(404);
  });

  test('DELETE removes the line and is idempotent', async ({ request }) => {
    const token = await login(request);
    await seedCart(request, token, [{ productId: 'p6', quantity: 1 }]);

    for (let i = 0; i < 2; i += 1) {
      const response = await request.delete('/api/cart/p6', { headers: auth(token) });
      expect(response.status()).toBe(204);
    }
    const cart = await (await request.get('/api/cart', { headers: auth(token) })).json();
    expect(cart.items).toEqual([]);
  });
});
