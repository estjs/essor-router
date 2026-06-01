import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3015' });

test.describe('data-loaders example', () => {
  test('supports typed navigation button and user route rendering', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Home Page (Typed)' })).toBeVisible();
    await page.getByTestId('navigate-btn').click();

    await expect(page).toHaveURL(/\/users\/789$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'User Profile (Typed)' }),
    ).toBeVisible();
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*789/);
  });
});
