import { expect, test } from '@playwright/test';
import { auth, login } from '../support/api-client.js';

test.describe('input hardening', { tag: '@security' }, () => {
  const hostilePayloads = [
    "' OR 1=1--",
    '"; DROP TABLE products;--',
    '<script>alert(1)</script>',
    '../../etc/passwd',
    '%00%0d%0a',
  ];
  for (const payload of hostilePayloads) {
    test(`search stays intact against ${JSON.stringify(payload)}`, async ({ request }) => {
      const response = await request.get(`/api/products?q=${encodeURIComponent(payload)}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(Array.isArray(await response.json())).toBe(true);
    });
  }

  test('oversized request bodies are cut off with 413', async ({ request }) => {
    const token = await login(request);
    const response = await request.post('/api/cart', {
      headers: auth(token),
      data: { productId: 'x'.repeat(20_000), quantity: 1 },
    });
    expect(response.status()).toBe(413);
    expect(await response.json()).toEqual({ error: 'payload_too_large' });
  });

  test('malformed JSON is answered with 400, not a crash', async ({ request }) => {
    const token = await login(request);
    const response = await request.post('/api/cart', {
      headers: { ...auth(token), 'Content-Type': 'application/json' },
      data: '{"productId": "p1", "quantity": ',
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'bad_request' });
  });

  test('prototype pollution attempts do not break later requests', async ({ request }) => {
    const token = await login(request);
    const polluted = await request.post('/api/cart', {
      headers: auth(token),
      data: { __proto__: { admin: true }, constructor: { prototype: { hacked: true } } },
    });
    expect([400, 404, 422]).toContain(polluted.status());

    const healthy = await request.get('/api/products');
    expect(healthy.status()).toBe(200);
    expect(await healthy.json()).toHaveLength(6);
  });
});
