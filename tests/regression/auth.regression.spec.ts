import { ALICE } from '../support/api-client.js';
import { expect, test } from '../support/fixtures.js';

test.describe('authentication flows', { tag: '@regression' }, () => {
  test('valid credentials land on the catalog with the session visible', async ({ loginPage, catalog }) => {
    await loginPage.goto();
    await loginPage.signIn(ALICE.email, ALICE.password);
    await catalog.expectLoaded();
    await expect(catalog.userEmail).toHaveText(ALICE.email);
  });

  test('a wrong password keeps the user on the login screen with a generic message', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.signIn(ALICE.email, 'WrongPass1!');
    await expect(loginPage.error).toHaveText('Invalid email or password.');
    await expect(loginPage.email).toBeVisible();
  });

  test('the error clears after a successful retry', async ({ loginPage, catalog }) => {
    await loginPage.goto();
    await loginPage.signIn(ALICE.email, 'WrongPass1!');
    await expect(loginPage.error).toBeVisible();
    await loginPage.signIn(ALICE.email, ALICE.password);
    await catalog.expectLoaded();
    await expect(catalog.error).toBeHidden();
  });

  test('the session survives a page reload', async ({ page, signedIn, catalog }) => {
    void signedIn;
    await page.reload();
    await catalog.expectLoaded();
  });

  test('logout ends the session and clears stored credentials', async ({ page, signedIn, catalog, loginPage }) => {
    void signedIn;
    await catalog.logoutButton.click();
    await expect(loginPage.email).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
