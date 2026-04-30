import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3010' });

test.describe('basic router example', () => {
  test('navigates between home and about with RouterLink', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await page.getByRole('link', { name: 'Home' }).click();

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  });

  test('renders not-found route for unknown path', async ({ page }) => {
    await page.goto('/missing-path');
    await expect(page.locator('.notfound')).toHaveText('404');
  });
});
