import { expect, test } from '@playwright/test';
import { assertText, assertVisible, reloadAndVerify, verifyRouteParams } from './shared/helpers';
import { Sel } from './shared/selectors';

test.describe('Route Params and Query', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('dynamic route param is rendered correctly', async ({ page }) => {
    await verifyRouteParams(page, '/users/42', Sel.userId, '42');
  });

  test('dynamic route param changes on navigation', async ({ page }) => {
    await page.goto('/users/42');
    await assertText(page, Sel.userId, '42');

    await page.locator('a[href="/users/123"]').click();
    await assertText(page, Sel.userId, '123');
  });

  test('optional param with value', async ({ page }) => {
    await verifyRouteParams(page, '/post/abc', Sel.postId, 'abc');
  });

  test('optional param without value renders fallback', async ({ page }) => {
    await verifyRouteParams(page, '/post', Sel.postId, 'No ID Provided');
  });

  test('catch-all route captures single segment', async ({ page }) => {
    await verifyRouteParams(page, '/unknown', Sel.catchAllPath, 'unknown');
  });

  test('catch-all route captures nested segments', async ({ page }) => {
    await verifyRouteParams(page, '/a/b/c', Sel.catchAllPath, 'a/b/c');
  });

  test('catch-all route preserves query params', async ({ page }) => {
    await page.goto('/missing/segment?from=e2e&tab=settings');
    await assertText(page, Sel.catchAllPath, 'missing/segment');

    const url = new URL(page.url());
    expect(url.searchParams.get('from')).toBe('e2e');
    expect(url.searchParams.get('tab')).toBe('settings');
  });

  test('catch-all route preserves hash', async ({ page }) => {
    await page.goto('/a/b/c#section-2');
    await assertText(page, Sel.catchAllPath, 'a/b/c');
    expect(new URL(page.url()).hash).toBe('#section-2');
  });

  test('route param survives page reload', async ({ page }) => {
    await verifyRouteParams(page, '/users/99', Sel.userId, '99');
    await reloadAndVerify(page, Sel.userId, '99');
  });

  test('nested layout renders with child', async ({ page }) => {
    await page.goto('/nested/child');
    await assertVisible(page, 'text=Nested Layout');
    await assertVisible(page, 'text=Nested Child Component');
  });

  test('nested layout child changes', async ({ page }) => {
    await page.goto('/nested/child');
    await assertVisible(page, 'text=Nested Child Component');
    await assertVisible(page, 'text=Nested Layout');
  });

  test('admin group folder renders at correct path', async ({ page }) => {
    await page.goto('/dashboard');
    await assertVisible(page, Sel.adminDashboard);
    await assertText(page, Sel.adminDashboard, 'Admin Dashboard');
  });

  test('named view sidebar renders on home page', async ({ page }) => {
    await page.goto('/');
    await assertVisible(page, Sel.sidebarHome);
    await assertText(page, Sel.sidebarHome, 'Home Sidebar');
  });

  test('named view sidebar renders empty fallback on route without sidebar', async ({ page }) => {
    await page.goto('/users/123');
    await assertVisible(page, Sel.sidebarEmpty);
    await assertText(page, Sel.sidebarEmpty, 'No Sidebar Content');
  });
});
