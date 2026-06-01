import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3011' });

test.describe('option-router example', () => {
  test('navigates via useRouter.push handlers', async ({ page }) => {
    await page.goto('/');

    await page.locator('.to-home').click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('.about')).toContainText('About');

    await page.locator('.about').click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test('supports random route and fallback route', async ({ page }) => {
    await page.goto('/');

    await page.locator('.to-random').click();
    await expect(page).toHaveURL(/\/random$/);
    await expect(page.getByText('Random', { exact: true })).toBeVisible();

    await page.goto('/not-exists');
    await expect(page.locator('.notfound')).toHaveText('404');
  });
});
