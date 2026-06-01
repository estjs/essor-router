import { test } from '@playwright/test';
import { assertText, assertUrlContains, assertVisible } from './shared/helpers';
import { Sel } from './shared/selectors';

test.describe('Programmatic Navigation', () => {
  test.use({ baseURL: 'http://localhost:3011' });

  test('useRouter.push navigates to about', async ({ page }) => {
    await page.goto('/');
    await page.click('.to-home');
    await assertText(page, '.about', 'About');
    await assertUrlContains(page, '/about');
  });

  test('useRouter.push navigates from about back to home', async ({ page }) => {
    await page.goto('/');
    await page.click('.to-home');
    await assertUrlContains(page, '/about');

    await page.click('.about');
    await assertUrlContains(page, '/');
  });

  test('useRouter.push navigates to random route', async ({ page }) => {
    await page.goto('/');
    await page.click('.to-random');
    await assertUrlContains(page, '/random');
    await assertVisible(page, 'text=Random');
  });

  test('404 fallback for unknown routes', async ({ page }) => {
    await page.goto('/not-exists');
    await assertText(page, Sel.notFound, '404');
  });
});

test.describe('Navigation Flow', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('complete navigation flow across all route types', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await assertVisible(page, Sel.homeTitle);

    // Navigate to about
    await page.locator('a[href="/about"]').click();
    await assertVisible(page, Sel.aboutTitle);

    // Navigate to dynamic user
    await page.locator('a[href="/users/123"]').click();
    await assertText(page, Sel.userId, '123');

    // Navigate to optional post
    await page.locator('a[href="/post/abc"]').click();
    await assertText(page, Sel.postId, 'abc');

    // Navigate to nested layout
    await page.locator('a[href="/nested/child"]').click();
    await assertVisible(page, 'text=Nested Child Component');

    // Navigate to dashboard (route group)
    await page.locator('a[href="/dashboard"]').click();
    await assertVisible(page, Sel.adminDashboard);

    // Navigate to 404
    await page.locator('a[href="/unknown"]').click();
    await assertVisible(page, Sel.catchAllPath);

    // Back to home
    await page.locator('a[href="/"]').click();
    await assertVisible(page, Sel.homeTitle);
  });

  test('deep link directly loads nested route', async ({ page }) => {
    await page.goto('/nested/child');
    await assertVisible(page, 'text=Nested Layout');
    await assertVisible(page, 'text=Nested Child Component');
  });
});
