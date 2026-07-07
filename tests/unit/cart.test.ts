import { beforeEach, describe, expect, it } from 'vitest';
import { Cart, CartError } from '../../src/domain/cart.js';

const keyboard = { id: 'p1', name: 'Mechanical Keyboard', priceCents: 28_990 };
const mug = { id: 'p2', name: 'QA Mug', priceCents: 3_990 };

describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = new Cart();
  });

  it('starts empty', () => {
    expect(cart.isEmpty).toBe(true);
    expect(cart.items).toEqual([]);
  });

  it('adds distinct products as separate lines', () => {
    cart.add(keyboard, 1);
    cart.add(mug, 2);
    expect(cart.items).toHaveLength(2);
  });

  it('merges repeated adds of the same product', () => {
    cart.add(mug, 2);
    cart.add(mug, 3);
    expect(cart.items).toEqual([
      { productId: 'p2', name: 'QA Mug', unitPriceCents: 3_990, quantity: 5 },
    ]);
  });

  it('rejects a merge that exceeds the 10-unit limit and keeps state intact', () => {
    cart.add(mug, 9);
    expect(() => cart.add(mug, 2)).toThrow('QUANTITY_LIMIT');
    expect(cart.items[0].quantity).toBe(9);
  });

  it.each([0, 11, 1.5, -3])('rejects invalid add quantity %d', (quantity) => {
    expect(() => cart.add(mug, quantity)).toThrow(CartError);
    expect(cart.isEmpty).toBe(true);
  });

  it('updates the quantity of an existing line', () => {
    cart.add(keyboard, 1);
    cart.setQuantity('p1', 7);
    expect(cart.items[0].quantity).toBe(7);
  });

  it('refuses to update a product that is not in the cart', () => {
    expect(() => cart.setQuantity('p9', 2)).toThrow('NOT_IN_CART');
  });

  it.each([0, 11])('refuses to update to out-of-range quantity %d', (quantity) => {
    cart.add(keyboard, 5);
    expect(() => cart.setQuantity('p1', quantity)).toThrow('INVALID_QUANTITY');
    expect(cart.items[0].quantity).toBe(5);
  });

  it('removes a line and tolerates removing an absent one', () => {
    cart.add(keyboard, 1);
    cart.remove('p1');
    cart.remove('p1');
    expect(cart.isEmpty).toBe(true);
  });

  it('clears all lines', () => {
    cart.add(keyboard, 1);
    cart.add(mug, 1);
    cart.clear();
    expect(cart.isEmpty).toBe(true);
  });
});
