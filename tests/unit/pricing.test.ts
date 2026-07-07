import { describe, expect, it } from 'vitest';
import {
  calculateQuote,
  FREE_SHIPPING_THRESHOLD_CENTS,
  PricingError,
  resolveCoupon,
  SHIPPING_FEE_CENTS,
  VOLUME_THRESHOLD_CENTS,
} from '../../src/domain/pricing.js';

const item = (unitPriceCents: number, quantity = 1) => ({ productId: 'x', unitPriceCents, quantity });

describe('calculateQuote — subtotal', () => {
  it('multiplies unit price by quantity across lines', () => {
    const quote = calculateQuote([item(28_990, 2), item(3_990, 3)]);
    expect(quote.subtotalCents).toBe(69_950);
  });

  it('rejects an empty cart', () => {
    expect(() => calculateQuote([])).toThrow(PricingError);
    expect(() => calculateQuote([])).toThrow('EMPTY_CART');
  });
});

describe('calculateQuote — shipping boundary (free at 30000 cents post-discount)', () => {
  it.each([
    { subtotal: FREE_SHIPPING_THRESHOLD_CENTS - 1, shipping: SHIPPING_FEE_CENTS },
    { subtotal: FREE_SHIPPING_THRESHOLD_CENTS, shipping: 0 },
    { subtotal: FREE_SHIPPING_THRESHOLD_CENTS + 1, shipping: 0 },
  ])('subtotal $subtotal → shipping $shipping', ({ subtotal, shipping }) => {
    expect(calculateQuote([item(subtotal)]).shippingCents).toBe(shipping);
  });

  it('charges shipping again when a coupon drops the order below the threshold', () => {
    const quote = calculateQuote([item(30_000)], 'WELCOME10');
    expect(quote).toMatchObject({
      subtotalCents: 30_000,
      discountCents: 3_000,
      shippingCents: SHIPPING_FEE_CENTS,
      totalCents: 29_500,
    });
  });
});

describe('calculateQuote — volume discount boundary (10% at 100000 cents)', () => {
  it.each([
    { subtotal: VOLUME_THRESHOLD_CENTS - 1, source: 'none', discount: 0 },
    { subtotal: VOLUME_THRESHOLD_CENTS, source: 'volume', discount: 10_000 },
  ])('subtotal $subtotal → $source discount', ({ subtotal, source, discount }) => {
    const quote = calculateQuote([item(subtotal)]);
    expect(quote.discountSource).toBe(source);
    expect(quote.discountCents).toBe(discount);
  });
});

describe('calculateQuote — discounts never stack, best one wins', () => {
  it('coupon beats volume when its percentage is higher', () => {
    const quote = calculateQuote([item(VOLUME_THRESHOLD_CENTS)], 'QA20');
    expect(quote.discountSource).toBe('coupon');
    expect(quote.discountCents).toBe(20_000);
  });

  it('coupon wins the tie at equal percentages', () => {
    const quote = calculateQuote([item(VOLUME_THRESHOLD_CENTS)], 'WELCOME10');
    expect(quote.discountSource).toBe('coupon');
    expect(quote.discountCents).toBe(10_000);
  });

  it('volume applies when no coupon is given', () => {
    const quote = calculateQuote([item(150_000)]);
    expect(quote).toMatchObject({ discountSource: 'volume', discountCents: 15_000, totalCents: 135_000 });
  });
});

describe('calculateQuote — rounding', () => {
  it('rounds half-up to whole cents', () => {
    expect(calculateQuote([item(25, 5)], 'WELCOME10').discountCents).toBe(13);
  });
});

describe('resolveCoupon', () => {
  it('is case-insensitive and trims input', () => {
    expect(resolveCoupon('  welcome10 ').percentOff).toBe(10);
  });

  it.each([
    { code: 'BOGUS', error: 'COUPON_INVALID' },
    { code: 'LEGACY30', error: 'COUPON_EXPIRED' },
  ])('rejects $code with $error', ({ code, error }) => {
    expect(() => resolveCoupon(code)).toThrow(error);
  });
});
