import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.email = page.getByTestId('email-input');
    this.password = page.getByTestId('password-input');
    this.submit = page.getByTestId('login-button');
    this.error = page.getByTestId('app-error');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page.getByTestId('login-view')).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}

export class CatalogPage {
  readonly view: Locator;
  readonly search: Locator;
  readonly badge: Locator;
  readonly subtotal: Locator;
  readonly checkoutButton: Locator;
  readonly logoutButton: Locator;
  readonly userEmail: Locator;
  readonly error: Locator;
  readonly productCards: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('catalog-view');
    this.search = page.getByTestId('search-input');
    this.badge = page.getByTestId('cart-badge');
    this.subtotal = page.getByTestId('cart-subtotal');
    this.checkoutButton = page.getByTestId('checkout-button');
    this.logoutButton = page.getByTestId('logout-button');
    this.userEmail = page.getByTestId('user-email');
    this.error = page.getByTestId('app-error');
    this.productCards = page.getByTestId('product-card');
  }

  async expectLoaded() {
    await expect(this.view).toBeVisible();
    await expect(this.productCards.first()).toBeVisible();
  }

  productCard(productId: string): Locator {
    return this.page.locator(`[data-testid="product-card"][data-product-id="${productId}"]`);
  }

  cartItem(productId: string): Locator {
    return this.page.locator(`[data-testid="cart-item"][data-product-id="${productId}"]`);
  }

  async addToCart(productId: string) {
    await this.productCard(productId).getByTestId('add-to-cart').click();
  }

  quantityOf(productId: string): Locator {
    return this.cartItem(productId).getByTestId('qty-value');
  }

  async increaseQuantity(productId: string) {
    await this.cartItem(productId).getByTestId('qty-increase').click();
  }

  async decreaseQuantity(productId: string) {
    await this.cartItem(productId).getByTestId('qty-decrease').click();
  }

  async removeItem(productId: string) {
    await this.cartItem(productId).getByTestId('remove-item').click();
  }

  async openCheckout() {
    await this.checkoutButton.click();
  }
}

export class CheckoutPage {
  readonly view: Locator;
  readonly coupon: Locator;
  readonly placeOrder: Locator;
  readonly back: Locator;
  readonly error: Locator;
  readonly lines: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('checkout-view');
    this.coupon = page.getByTestId('coupon-input');
    this.placeOrder = page.getByTestId('place-order-button');
    this.back = page.getByTestId('back-to-catalog');
    this.error = page.getByTestId('app-error');
    this.lines = page.getByTestId('checkout-line');
  }

  async submit(coupon?: string) {
    await expect(this.view).toBeVisible();
    if (coupon) await this.coupon.fill(coupon);
    await this.placeOrder.click();
  }
}

export class ConfirmationPage {
  readonly view: Locator;
  readonly orderId: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly continueShopping: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('confirmation-view');
    this.orderId = page.getByTestId('order-id');
    this.subtotal = page.getByTestId('order-subtotal');
    this.discount = page.getByTestId('order-discount');
    this.shipping = page.getByTestId('order-shipping');
    this.total = page.getByTestId('order-total');
    this.continueShopping = page.getByTestId('new-order-button');
  }

  async expectLoaded() {
    await expect(this.view).toBeVisible();
  }
}
