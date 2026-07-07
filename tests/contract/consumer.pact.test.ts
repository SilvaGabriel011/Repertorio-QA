import path from 'node:path';
import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { describe, expect, it } from 'vitest';

const { eachLike, like, regex } = MatchersV3;

const newPact = () =>
  new PactV3({
    consumer: 'storefront-web',
    provider: 'qa-store-api',
    dir: path.resolve('pacts'),
    logLevel: 'warn',
  });

const JSON_HEADERS = { 'Content-Type': 'application/json' };

describe('storefront-web ⇄ qa-store-api contracts', () => {
  it('lists products as an array of {id, name, priceCents}', async () => {
    const pact = newPact();
    pact
      .given('the catalog is seeded')
      .uponReceiving('a request for the product list')
      .withRequest({ method: 'GET', path: '/api/products' })
      .willRespondWith({
        status: 200,
        headers: JSON_HEADERS,
        body: eachLike({ id: like('p1'), name: like('Mechanical Keyboard'), priceCents: like(28990) }),
      });

    await pact.executeTest(async (mock) => {
      const response = await fetch(`${mock.url}/api/products`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body[0]).toEqual({ id: 'p1', name: 'Mechanical Keyboard', priceCents: 28990 });
    });
  });

  it('answers 404 with a stable error shape for a missing product', async () => {
    const pact = newPact();
    pact
      .given('product p999 does not exist')
      .uponReceiving('a request for a missing product')
      .withRequest({ method: 'GET', path: '/api/products/p999' })
      .willRespondWith({
        status: 404,
        headers: JSON_HEADERS,
        body: { error: 'not_found' },
      });

    await pact.executeTest(async (mock) => {
      const response = await fetch(`${mock.url}/api/products/p999`);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'not_found' });
    });
  });

  it('exchanges valid credentials for a UUID bearer token', async () => {
    const pact = newPact();
    pact
      .given('user alice.qa@example.com exists')
      .uponReceiving('a valid login request')
      .withRequest({
        method: 'POST',
        path: '/api/auth/login',
        headers: JSON_HEADERS,
        body: { email: 'alice.qa@example.com', password: 'S3curePass!' },
      })
      .willRespondWith({
        status: 200,
        headers: JSON_HEADERS,
        body: { token: regex('^[0-9a-f-]{36}$', 'ce118b6e-d8e1-41e7-9296-cec278b6b50a') },
      });

    await pact.executeTest(async (mock) => {
      const response = await fetch(`${mock.url}/api/auth/login`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: 'alice.qa@example.com', password: 'S3curePass!' }),
      });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.token).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  it('signals bad credentials with 401 and a stable error shape', async () => {
    const pact = newPact();
    pact
      .given('user alice.qa@example.com exists')
      .uponReceiving('a login request with a wrong password')
      .withRequest({
        method: 'POST',
        path: '/api/auth/login',
        headers: JSON_HEADERS,
        body: { email: 'alice.qa@example.com', password: 'NotHerPassword1' },
      })
      .willRespondWith({
        status: 401,
        headers: JSON_HEADERS,
        body: { error: 'invalid_credentials' },
      });

    await pact.executeTest(async (mock) => {
      const response = await fetch(`${mock.url}/api/auth/login`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: 'alice.qa@example.com', password: 'NotHerPassword1' }),
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'invalid_credentials' });
    });
  });
});
