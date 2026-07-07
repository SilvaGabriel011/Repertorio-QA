import { isValidQuantity, QUANTITY_MAX } from './validators.js';

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export class CartError extends Error {
  constructor(public readonly code: 'INVALID_QUANTITY' | 'QUANTITY_LIMIT' | 'NOT_IN_CART') {
    super(code);
  }
}

export class Cart {
  private lines = new Map<string, CartLine>();

  add(product: { id: string; name: string; priceCents: number }, quantity: number): void {
    if (!isValidQuantity(quantity)) throw new CartError('INVALID_QUANTITY');
    const existing = this.lines.get(product.id);
    const merged = (existing?.quantity ?? 0) + quantity;
    if (merged > QUANTITY_MAX) throw new CartError('QUANTITY_LIMIT');
    this.lines.set(product.id, {
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: merged,
    });
  }

  setQuantity(productId: string, quantity: number): void {
    const line = this.lines.get(productId);
    if (!line) throw new CartError('NOT_IN_CART');
    if (!isValidQuantity(quantity)) throw new CartError('INVALID_QUANTITY');
    line.quantity = quantity;
  }

  remove(productId: string): void {
    this.lines.delete(productId);
  }

  get items(): CartLine[] {
    return [...this.lines.values()];
  }

  get isEmpty(): boolean {
    return this.lines.size === 0;
  }

  clear(): void {
    this.lines.clear();
  }
}
