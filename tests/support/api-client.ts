import type { APIRequestContext } from '@playwright/test';
import { PRODUCTS, USERS } from '../../src/api/store.js';

export const ALICE = USERS[0];
export const BOB = USERS[1];
export const PRODUCT = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function login(request: APIRequestContext, user = ALICE): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) throw new Error(`login failed with ${response.status()}`);
  return (await response.json()).token;
}

export async function seedCart(
  request: APIRequestContext,
  token: string,
  lines: { productId: string; quantity: number }[],
): Promise<void> {
  for (const line of lines) {
    const response = await request.post('/api/cart', { headers: auth(token), data: line });
    if (!response.ok()) throw new Error(`seedCart failed with ${response.status()}`);
  }
}

export async function checkout(request: APIRequestContext, token: string, coupon?: string) {
  const response = await request.post('/api/checkout', {
    headers: auth(token),
    data: coupon ? { coupon } : {},
  });
  return response;
}
