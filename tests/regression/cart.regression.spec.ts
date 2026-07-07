import { seedCart } from '../support/api-client.js';
import { expect, test } from '../support/fixtures.js';

test.describe('cart behaviour', { tag: '@regression' }, () => {
  test('adding a product shows it in the cart with a running subtotal', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p2');
    await expect(catalog.badge).toHaveText('1');
    await expect(catalog.cartItem('p2')).toBeVisible();
    await expect(catalog.subtotal).toHaveText('$39.90');
  });

  test('adding the same product twice merges into one line', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p2');
    await catalog.addToCart('p2');
    await expect(catalog.quantityOf('p2')).toHaveText('2');
    await expect(catalog.badge).toHaveText('2');
    await expect(catalog.cartItem('p2')).toHaveCount(1);
  });

  test('quantity steppers update badge and subtotal', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p4');
    await catalog.increaseQuantity('p4');
    await catalog.increaseQuantity('p4');
    await expect(catalog.quantityOf('p4')).toHaveText('3');
    await expect(catalog.subtotal).toHaveText('$360.00');

    await catalog.decreaseQuantity('p4');
    await expect(catalog.quantityOf('p4')).toHaveText('2');
    await expect(catalog.subtotal).toHaveText('$240.00');
  });

  test('decreasing to zero removes the line and disables checkout', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p5');
    await catalog.decreaseQuantity('p5');
    await expect(catalog.cartItem('p5')).toHaveCount(0);
    await expect(catalog.badge).toHaveText('0');
    await expect(catalog.checkoutButton).toBeDisabled();
  });

  test('remove takes the line out of the cart', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.addToCart('p1');
    await catalog.addToCart('p2');
    await catalog.removeItem('p1');
    await expect(catalog.cartItem('p1')).toHaveCount(0);
    await expect(catalog.badge).toHaveText('1');
  });

  test('the 10-unit cap surfaces as a friendly message', async ({ request, signedIn, catalog, page }) => {
    await seedCart(request, signedIn.token, [{ productId: 'p2', quantity: 10 }]);
    await page.reload();
    await catalog.expectLoaded();

    await catalog.addToCart('p2');
    await expect(catalog.error).toHaveText('Maximum of 10 units per product.');
    await expect(catalog.quantityOf('p2')).toHaveText('10');
  });

  test('the cart survives a page reload', async ({ signedIn, catalog, page }) => {
    void signedIn;
    await catalog.addToCart('p6');
    await expect(catalog.badge).toHaveText('1');
    await page.reload();
    await catalog.expectLoaded();
    await expect(catalog.badge).toHaveText('1');
    await expect(catalog.cartItem('p6')).toBeVisible();
  });

  test('search narrows the catalog and clearing restores it', async ({ signedIn, catalog }) => {
    void signedIn;
    await catalog.search.fill('monitor');
    await expect(catalog.productCards).toHaveCount(1);
    await expect(catalog.productCard('p3')).toBeVisible();

    await catalog.search.clear();
    await expect(catalog.productCards).toHaveCount(6);
  });
});
