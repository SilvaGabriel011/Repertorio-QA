import { randomUUID } from 'node:crypto';
import { Cart } from '../domain/cart.js';
import type { Quote } from '../domain/pricing.js';

export interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}

export interface Order extends Quote {
  id: string;
  userId: string;
  items: { productId: string; name: string; unitPriceCents: number; quantity: number }[];
  couponCode: string | null;
  createdAt: string;
}

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Mechanical Keyboard', priceCents: 28_990 },
  { id: 'p2', name: 'QA Mug', priceCents: 3_990 },
  { id: 'p3', name: '4K Monitor', priceCents: 149_900 },
  { id: 'p4', name: 'Laptop Stand', priceCents: 12_000 },
  { id: 'p5', name: 'USB-C Hub', priceCents: 10_000 },
  { id: 'p6', name: 'HD Webcam', priceCents: 30_000 },
];

export const USERS: User[] = [
  { id: 'u1', email: 'alice.qa@example.com', password: 'S3curePass!', name: 'Alice' },
  { id: 'u2', email: 'bob.qa@example.com', password: 'S3curePass!', name: 'Bob' },
];

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MS = 60_000;

interface LoginAttempts {
  failures: number;
  lockedUntil: number;
}

export class Store {
  private sessions = new Map<string, string>();
  private carts = new Map<string, Cart>();
  private orders = new Map<string, Order>();
  private attempts = new Map<string, LoginAttempts>();

  findProduct(id: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
  }

  searchProducts(query: string): Product[] {
    const q = query.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q));
  }

  login(email: string, password: string): { token: string } | 'locked' | 'invalid' {
    const now = Date.now();
    const state = this.attempts.get(email) ?? { failures: 0, lockedUntil: 0 };
    if (state.lockedUntil > now) return 'locked';

    const user = USERS.find((u) => u.email === email && u.password === password);
    if (!user) {
      state.failures += 1;
      if (state.failures >= LOGIN_MAX_FAILURES) {
        state.lockedUntil = now + LOGIN_LOCK_MS;
        state.failures = 0;
      }
      this.attempts.set(email, state);
      return 'invalid';
    }

    this.attempts.delete(email);
    const token = randomUUID();
    this.sessions.set(token, user.id);
    return { token };
  }

  authenticate(token: string | undefined): string | undefined {
    return token ? this.sessions.get(token) : undefined;
  }

  cartFor(token: string): Cart {
    let cart = this.carts.get(token);
    if (!cart) {
      cart = new Cart();
      this.carts.set(token, cart);
    }
    return cart;
  }

  saveOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
    const saved: Order = { ...order, id: randomUUID(), createdAt: new Date().toISOString() };
    this.orders.set(saved.id, saved);
    return saved;
  }

  findOrder(id: string, userId: string): Order | undefined {
    const order = this.orders.get(id);
    return order && order.userId === userId ? order : undefined;
  }
}
