import { expect, test } from '@playwright/test';
import { z } from 'zod';

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
});

test.describe('GET /api/products', { tag: '@api' }, () => {
  test('returns the full seeded catalog matching the product schema', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(z.array(productSchema).safeParse(body).success).toBe(true);
    expect(body).toHaveLength(6);
  });

  test('filters by name, case-insensitively', async ({ request }) => {
    for (const q of ['mug', 'MUG', 'Mug']) {
      const body = await (await request.get(`/api/products?q=${q}`)).json();
      expect(body).toEqual([{ id: 'p2', name: 'QA Mug', priceCents: 3990 }]);
    }
  });

  test('returns an empty list when nothing matches', async ({ request }) => {
    const body = await (await request.get('/api/products?q=zzz-no-match')).json();
    expect(body).toEqual([]);
  });

  test('rejects a query above 100 characters with 400', async ({ request }) => {
    const response = await request.get(`/api/products?q=${'a'.repeat(101)}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_query' });
  });
});

test.describe('GET /api/products/:id', { tag: '@api' }, () => {
  test('returns a single product by id', async ({ request }) => {
    const response = await request.get('/api/products/p3');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ id: 'p3', name: '4K Monitor', priceCents: 149900 });
  });

  test('returns 404 for an unknown id', async ({ request }) => {
    const response = await request.get('/api/products/p999');
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
