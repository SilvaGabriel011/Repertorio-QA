import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { StoreWorld } from '../support/world.js';

Given('sign-in has failed {int} times for {string}', async function (this: StoreWorld, times: number, email: string) {
  for (let i = 0; i < times; i += 1) {
    await this.agent.post('/api/auth/login').send({ email, password: 'WrongPass1!' });
  }
});

When('I sign in as {string} with password {string}', async function (this: StoreWorld, email: string, password: string) {
  this.response = await this.agent.post('/api/auth/login').send({ email, password });
});

Then('I receive a session token', function (this: StoreWorld) {
  assert.equal(this.response?.status, 200);
  assert.match(this.body.token, /^[0-9a-f-]{36}$/);
});

Then('sign-in is refused with {string}', function (this: StoreWorld, error: string) {
  assert.equal(this.response?.status, 401);
  assert.equal(this.body.error, error);
});

Then('sign-in is throttled', function (this: StoreWorld) {
  assert.equal(this.response?.status, 429);
  assert.equal(this.body.error, 'too_many_attempts');
});
