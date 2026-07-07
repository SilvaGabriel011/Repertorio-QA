import { describe, expect, it } from 'vitest';
import { ALICE, BOB, bearer, login, newAgent } from './support.js';

// State isolation is an integration concern: two sessions sharing one Store
// instance must not see each other's data.
describe('session isolation within a shared store', () => {
  it('scopes carts to their own token', async () => {
    const agent = newAgent();
    const aliceToken = await login(agent, ALICE);
    const bobToken = await login(agent, BOB);

    await agent.post('/api/cart').set(bearer(aliceToken)).send({ productId: 'p1', quantity: 2 }).expect(201);

    const bobCart = await agent.get('/api/cart').set(bearer(bobToken)).expect(200);
    expect(bobCart.body.items).toEqual([]);

    const aliceCart = await agent.get('/api/cart').set(bearer(aliceToken)).expect(200);
    expect(aliceCart.body.items).toHaveLength(1);
  });

  it('scopes orders to their owner across the persistence layer', async () => {
    const agent = newAgent();
    const aliceToken = await login(agent, ALICE);
    const bobToken = await login(agent, BOB);

    await agent.post('/api/cart').set(bearer(aliceToken)).send({ productId: 'p1', quantity: 1 }).expect(201);
    const order = await agent.post('/api/checkout').set(bearer(aliceToken)).send({}).expect(201);

    await agent.get(`/api/orders/${order.body.id}`).set(bearer(bobToken)).expect(404);
    await agent.get(`/api/orders/${order.body.id}`).set(bearer(aliceToken)).expect(200);
  });

  it('starts each app instance from clean state', async () => {
    const first = newAgent();
    const token = await login(first);
    await first.post('/api/cart').set(bearer(token)).send({ productId: 'p1', quantity: 1 }).expect(201);

    // A brand-new instance shares nothing with the previous one.
    const second = newAgent();
    const freshToken = await login(second);
    const cart = await second.get('/api/cart').set(bearer(freshToken)).expect(200);
    expect(cart.body.items).toEqual([]);
  });
});
