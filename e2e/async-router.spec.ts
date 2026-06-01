import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3016' });

test.describe('async-router example', () => {
  test('loads async route components and navigates with hash history', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await page.getByRole('link', { name: 'Home' }).click();

    await expect(page).toHaveURL(/#\/about$/);
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/#\/$/);
  });
});
