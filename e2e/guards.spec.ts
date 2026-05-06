import { test, expect } from '@playwright/test';
import { assertVisible, assertText, assertUrlContains } from './shared/helpers';
import { Sel } from './shared/selectors';

test.describe('Navigation Guards', () => {
  test.use({ baseURL: 'http://localhost:3020' });

  test('renders home page with guard indicators', async ({ page }) => {
    await page.goto('/');
    await assertVisible(page, Sel.homeTitle);

    const beforeEachText = await page.locator(Sel.guardBeforeEach).textContent();
    expect(beforeEachText).toContain('beforeEach');
    expect(beforeEachText).toContain('/');

    const afterEachText = await page.locator(Sel.guardAfterEach).textContent();
    expect(afterEachText).toContain('afterEach');
  });

  test('triggers beforeEach and afterEach on navigation to about', async ({ page }) => {
    await page.goto('/');
    await assertVisible(page, Sel.homeTitle);

    await page.click('[data-testid="link-about"]');

    const beforeEachText = await page.locator(Sel.guardBeforeEach).textContent();
    expect(beforeEachText).toContain('/about');

    const afterEachText = await page.locator(Sel.guardAfterEach).textContent();
    expect(afterEachText).toContain('/about');
  });

  test('triggers beforeEnter guard on protected route', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="link-protected"]');

    await assertVisible(page, Sel.guardBeforeEnter);
    await assertText(page, Sel.guardBeforeEnter, 'beforeEnter: reached');

    await assertText(page, '[data-testid="protected-title"]', 'Protected Page');
  });

  test('triggers beforeRouteLeave when navigating away from protected page', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="link-protected"]');

    await page.click('[data-testid="link-about"]');

    const leaveText = await page.locator(Sel.guardBeforeRouteLeave).textContent();
    expect(leaveText).toContain('beforeRouteLeave');
    expect(leaveText).toContain('/protected');
    expect(leaveText).toContain('/about');
  });

  test('triggers beforeRouteUpdate when detail id changes', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="link-detail-1"]');

    await expect(page.locator('[data-testid="detail-id"]')).toContainText('1');

    await page.click('[data-testid="link-detail-2"]');

    const updateText = await page.locator(Sel.guardBeforeRouteUpdate).textContent();
    expect(updateText).toContain('beforeRouteUpdate');
    expect(updateText).toContain('/detail/1');
    expect(updateText).toContain('/detail/2');

    await expect(page.locator('[data-testid="detail-id"]')).toContainText('2');
  });

  test('guards fire in correct order: beforeEach → beforeEnter → afterEach', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="link-protected"]');

    const beforeEachText = await page.locator(Sel.guardBeforeEach).textContent();
    expect(beforeEachText).toContain('/protected');

    const beforeEnterText = await page.locator(Sel.guardBeforeEnter).textContent();
    expect(beforeEnterText).toContain('beforeEnter');

    const afterEachText = await page.locator(Sel.guardAfterEach).textContent();
    expect(afterEachText).toContain('/protected');
  });

  test('triggers guards for 404 route', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="link-missing"]');

    await assertVisible(page, Sel.notFound);

    const beforeEachText = await page.locator(Sel.guardBeforeEach).textContent();
    expect(beforeEachText).toContain('/missing');

    const afterEachText = await page.locator(Sel.guardAfterEach).textContent();
    expect(afterEachText).toContain('/missing');
  });

  test('guards handle consecutive navigations', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="link-about"]');
    await page.click('[data-testid="link-home"]');

    await assertVisible(page, Sel.homeTitle);

    const afterEachText = await page.locator(Sel.guardAfterEach).textContent();
    expect(afterEachText).toContain('/');
  });
});
