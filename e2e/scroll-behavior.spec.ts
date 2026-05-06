import { expect, test } from '@playwright/test';
import { assertVisible } from './shared/helpers';
import { Sel } from './shared/selectors';

test.describe('Scroll Behavior', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('scroll position is at top after navigation', async ({ page }) => {
    await page.goto('/users/123');
    await assertVisible(page, Sel.userId);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('page reload returns to top', async ({ page }) => {
    await page.goto('/users/123');
    await assertVisible(page, Sel.userId);

    await page.reload();
    await assertVisible(page, Sel.userId);

    const scrollAfterReload = await page.evaluate(() => window.scrollY);
    expect(scrollAfterReload).toBe(0);
  });
});
