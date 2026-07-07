import { expect, test } from '@playwright/test';
import { ALICE, auth, login } from '../support/api-client.js';

test.describe('POST /api/auth/login', { tag: '@api' }, () => {
  test('issues a bearer token for valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: ALICE.email, password: ALICE.password },
    });
    expect(response.status()).toBe(200);
    const { token } = await response.json();
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('rejects a wrong password with 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: ALICE.email, password: 'WrongPass1' },
    });
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'invalid_credentials' });
  });

  const malformed = [
    { label: 'missing password', data: { email: ALICE.email } },
    { label: 'missing email', data: { password: 'S3curePass!' } },
    { label: 'invalid email format', data: { email: 'not-an-email', password: 'S3curePass!' } },
    { label: 'non-string password', data: { email: ALICE.email, password: 123 } },
    { label: 'empty body', data: {} },
  ];
  for (const { label, data } of malformed) {
    test(`rejects ${label} with 400`, async ({ request }) => {
      const response = await request.post('/api/auth/login', { data });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'malformed_credentials' });
    });
  }

  test('issued token grants access to protected resources', async ({ request }) => {
    const token = await login(request);
    const response = await request.get('/api/cart', { headers: auth(token) });
    expect(response.status()).toBe(200);
  });
});
