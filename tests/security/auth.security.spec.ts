import { expect, test } from '@playwright/test';
import { ALICE, auth, BOB, checkout, login, seedCart } from '../support/api-client.js';

test.describe('authentication and authorization', { tag: '@security' }, () => {
  test('protected endpoints reject missing, malformed and forged tokens', async ({ request }) => {
    const attempts: Record<string, string>[] = [
      {},
      { Authorization: 'Bearer' },
      { Authorization: 'Bearer forged-token-123' },
      { Authorization: 'Basic YWxpY2U6cGFzcw==' },
    ];
    for (const headers of attempts) {
      const response = await request.get('/api/cart', { headers });
      expect(response.status()).toBe(401);
    }
  });

  test('login errors do not reveal whether an account exists', async ({ request }) => {
    const wrongPassword = await request.post('/api/auth/login', {
      data: { email: ALICE.email, password: 'WrongPass1!' },
    });
    const unknownUser = await request.post('/api/auth/login', {
      data: { email: `ghost.${Date.now()}@example.com`, password: 'WrongPass1!' },
    });
    expect(wrongPassword.status()).toBe(401);
    expect(unknownUser.status()).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
  });

  test('brute force gets throttled after 5 failures', async ({ request }) => {
    const data = { email: `brute.${Date.now()}@example.com`, password: 'WrongPass1!' };
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect((await request.post('/api/auth/login', { data })).status()).toBe(401);
    }
    const throttled = await request.post('/api/auth/login', { data });
    expect(throttled.status()).toBe(429);
    expect(throttled.headers()['retry-after']).toBe('60');
    expect(await throttled.json()).toEqual({ error: 'too_many_attempts' });
  });

  test('a user cannot read another user\'s order (IDOR)', async ({ request }) => {
    const aliceToken = await login(request, ALICE);
    await seedCart(request, aliceToken, [{ productId: 'p1', quantity: 1 }]);
    const order = await (await checkout(request, aliceToken)).json();

    const bobToken = await login(request, BOB);
    const asBob = await request.get(`/api/orders/${order.id}`, { headers: auth(bobToken) });
    expect(asBob.status()).toBe(404);

    const nonexistent = await request.get('/api/orders/no-such-order', { headers: auth(bobToken) });
    expect(await asBob.json()).toEqual(await nonexistent.json());
  });

  test('a foreign token cannot see or mutate another session\'s cart', async ({ request }) => {
    const aliceToken = await login(request, ALICE);
    await seedCart(request, aliceToken, [{ productId: 'p2', quantity: 2 }]);

    const bobToken = await login(request, BOB);
    const bobCart = await (await request.get('/api/cart', { headers: auth(bobToken) })).json();
    expect(bobCart.items).toEqual([]);
  });
});
