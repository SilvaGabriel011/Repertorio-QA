import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { CATALOG, money, type StoreWorld } from '../support/world.js';

Given('I am signed in as {string}', async function (this: StoreWorld, email: string) {
  const res = await this.agent.post('/api/auth/login').send({ email, password: 'S3curePass!' });
  assert.equal(res.status, 200, `expected login to succeed, got ${res.status}`);
  this.token = res.body.token;
});

Given('my cart contains {int} {string}', async function (this: StoreWorld, quantity: number, product: string) {
  const productId = CATALOG[product];
  assert.ok(productId, `unknown product: ${product}`);
  const res = await this.agent.post('/api/cart').set(this.auth()).send({ productId, quantity });
  assert.equal(res.status, 201, `expected item added, got ${res.status}`);
});

When('I check out', async function (this: StoreWorld) {
  this.response = await this.agent.post('/api/checkout').set(this.auth()).send({});
});

When('I check out with coupon {string}', async function (this: StoreWorld, coupon: string) {
  this.response = await this.agent.post('/api/checkout').set(this.auth()).send({ coupon });
});

Then('the subtotal is {string}', function (this: StoreWorld, expected: string) {
  assert.equal(money(this.body.subtotalCents), expected);
});

Then('no discount is applied', function (this: StoreWorld) {
  assert.equal(this.body.discountCents, 0);
  assert.equal(this.body.discountSource, 'none');
});

Then('the discount is {string} from {string}', function (this: StoreWorld, amount: string, source: string) {
  assert.equal(money(this.body.discountCents), amount);
  assert.equal(this.body.discountSource, source);
});

Then('shipping is free', function (this: StoreWorld) {
  assert.equal(this.body.shippingCents, 0);
});

Then('shipping costs {string}', function (this: StoreWorld, expected: string) {
  assert.equal(money(this.body.shippingCents), expected);
});

Then('the total is {string}', function (this: StoreWorld, expected: string) {
  assert.equal(money(this.body.totalCents), expected);
});

Then('checkout is rejected with {string}', function (this: StoreWorld, error: string) {
  assert.equal(this.response?.status, 422);
  assert.equal(this.body.error, error);
});

Then('my cart still has {int} item', async function (this: StoreWorld, count: number) {
  const res = await this.agent.get('/api/cart').set(this.auth());
  assert.equal(res.body.items.length, count);
});
