import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { Verifier } from '@pact-foundation/pact';
import { beforeAll, describe, it } from 'vitest';
import { createApp } from '../../src/api/app.js';

// The verifier only talks to localhost; corporate proxies must not intercept it.
beforeAll(() => {
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) {
    delete process.env[name];
  }
  process.env.NO_PROXY = 'localhost,127.0.0.1';
});

describe('qa-store-api provider verification', () => {
  it('honours every interaction recorded by its consumers', async () => {
    const server = createApp().listen(0);
    const { port } = server.address() as AddressInfo;

    try {
      await new Verifier({
        provider: 'qa-store-api',
        providerBaseUrl: `http://127.0.0.1:${port}`,
        pactUrls: [path.resolve('pacts/storefront-web-qa-store-api.json')],
        logLevel: 'warn',
        stateHandlers: {
          'the catalog is seeded': async () => {},
          'product p999 does not exist': async () => {},
          'user alice.qa@example.com exists': async () => {},
        },
      }).verifyProvider();
    } finally {
      server.close();
    }
  }, 60_000);
});
