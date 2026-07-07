import { expect, test } from '@playwright/test';

const REQUIRED_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'",
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

test.describe('security headers', { tag: '@security' }, () => {
  for (const path of ['/', '/health', '/api/products']) {
    test(`every hardening header is present on ${path}`, async ({ request }) => {
      const headers = (await request.get(path)).headers();
      for (const [name, value] of Object.entries(REQUIRED_HEADERS)) {
        expect(headers[name], name).toBe(value);
      }
    });
  }

  test('the server does not advertise its framework', async ({ request }) => {
    const headers = (await request.get('/api/products')).headers();
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('API responses are never cached', async ({ request }) => {
    const headers = (await request.get('/api/products')).headers();
    expect(headers['cache-control']).toBe('no-store');
  });

  test('API errors are structured JSON, not HTML stack traces', async ({ request }) => {
    const response = await request.get('/api/unknown-route');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
