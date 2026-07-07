import { beforeEach, describe, expect, it } from 'vitest';
import { type Agent, bearer, login, newAgent } from './support.js';

// Integration scope: several components collaborating inside one app instance
// (routes → Store → domain), and state that must survive across requests.
describe('purchase flow — components collaborating across requests', () => {
  let agent: Agent;
  let token: string;

  beforeEach(async () => {
    agent = newAgent();
    token = await login(agent);
  });

  it('carries cart state across independent requests under the same token', async () => {
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p1', quantity: 1 }).expect(201);
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p2', quantity: 2 }).expect(201);

    const cart = await agent.get('/api/cart').set(bearer(token)).expect(200);
    expect(cart.body.items).toHaveLength(2);
    expect(cart.body.items.map((i: { productId: string }) => i.productId)).toEqual(['p1', 'p2']);
  });

  it('wires route → domain pricing → persistence → retrieval end to end', async () => {
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p3', quantity: 1 }).expect(201);

    const checkout = await agent.post('/api/checkout').set(bearer(token)).send({ coupon: 'QA20' }).expect(201);
    expect(checkout.body).toMatchObject({
      subtotalCents: 149_900,
      discountCents: 29_980,
      discountSource: 'coupon',
      totalCents: 119_920,
    });

    // The order the domain priced is the same one persistence returns.
    const fetched = await agent.get(`/api/orders/${checkout.body.id}`).set(bearer(token)).expect(200);
    expect(fetched.body).toEqual(checkout.body);
  });

  it('empties the cart once an order is placed, within the same session', async () => {
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p2', quantity: 1 }).expect(201);
    await agent.post('/api/checkout').set(bearer(token)).send({}).expect(201);

    const cart = await agent.get('/api/cart').set(bearer(token)).expect(200);
    expect(cart.body.items).toEqual([]);
  });

  it('keeps the cart intact when the domain rejects the coupon', async () => {
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p2', quantity: 1 }).expect(201);
    await agent.post('/api/checkout').set(bearer(token)).send({ coupon: 'LEGACY30' }).expect(422);

    const cart = await agent.get('/api/cart').set(bearer(token)).expect(200);
    expect(cart.body.items).toHaveLength(1);
  });

  it('threads the quantity-limit invariant from domain up to the HTTP layer', async () => {
    await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p2', quantity: 9 }).expect(201);
    const rejected = await agent.post('/api/cart').set(bearer(token)).send({ productId: 'p2', quantity: 5 });
    expect(rejected.status).toBe(422);
    expect(rejected.body).toEqual({ error: 'quantity_limit' });

    const cart = await agent.get('/api/cart').set(bearer(token)).expect(200);
    expect(cart.body.items[0].quantity).toBe(9);
  });
});
