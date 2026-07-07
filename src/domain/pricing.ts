export interface QuoteItem {
  productId: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Quote {
  subtotalCents: number;
  discountCents: number;
  discountSource: 'none' | 'coupon' | 'volume';
  shippingCents: number;
  totalCents: number;
}

export interface Coupon {
  code: string;
  percentOff: number;
  expired: boolean;
}

export const VOLUME_THRESHOLD_CENTS = 100_000;
export const VOLUME_PERCENT_OFF = 10;
export const FREE_SHIPPING_THRESHOLD_CENTS = 30_000;
export const SHIPPING_FEE_CENTS = 2_500;

const COUPONS: Record<string, Coupon> = {
  WELCOME10: { code: 'WELCOME10', percentOff: 10, expired: false },
  QA20: { code: 'QA20', percentOff: 20, expired: false },
  LEGACY30: { code: 'LEGACY30', percentOff: 30, expired: true },
};

export class PricingError extends Error {
  constructor(public readonly code: 'EMPTY_CART' | 'COUPON_INVALID' | 'COUPON_EXPIRED') {
    super(code);
  }
}

export function resolveCoupon(code: string): Coupon {
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) throw new PricingError('COUPON_INVALID');
  if (coupon.expired) throw new PricingError('COUPON_EXPIRED');
  return coupon;
}

export function calculateQuote(items: QuoteItem[], couponCode?: string): Quote {
  if (items.length === 0) throw new PricingError('EMPTY_CART');

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  const couponPercent = couponCode ? resolveCoupon(couponCode).percentOff : 0;
  const volumePercent = subtotalCents >= VOLUME_THRESHOLD_CENTS ? VOLUME_PERCENT_OFF : 0;

  // Best single discount wins; discounts never stack.
  let discountSource: Quote['discountSource'] = 'none';
  let percentOff = 0;
  if (couponPercent >= volumePercent && couponPercent > 0) {
    discountSource = 'coupon';
    percentOff = couponPercent;
  } else if (volumePercent > 0) {
    discountSource = 'volume';
    percentOff = volumePercent;
  }

  const discountCents = Math.round((subtotalCents * percentOff) / 100);
  const discountedCents = subtotalCents - discountCents;
  const shippingCents = discountedCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FEE_CENTS;

  return {
    subtotalCents,
    discountCents,
    discountSource,
    shippingCents,
    totalCents: discountedCents + shippingCents,
  };
}
