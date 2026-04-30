import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3017' });

test.describe('config-router example', () => {
  test('loads routes generated from routes.config.ts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Home Page (Typed)' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About Page (Typed)' })).toBeVisible();
  });

  test('supports dynamic, optional, catch-all and nested config routes', async ({ page }) => {
    await page.goto('/users/456');
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*456/);

    await page.goto('/post');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

    await page.goto('/post/typed');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*typed/);

    await page.goto('/nested/child');
    await expect(page.getByRole('heading', { level: 2, name: 'Typed Nested Layout' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Typed Nested Child' })).toBeVisible();

    await page.goto('/config/not-found/path?from=config#hash');
    await expect(page.getByRole('heading', { level: 1, name: '404 Not Found (Typed)' })).toBeVisible();
    await expect(page.getByTestId('catch-all-path')).toHaveText(
      /Unknown path:\s*config\/not-found\/path/,
    );
    await expect(page).toHaveURL(/from=config/);
    await expect(page).toHaveURL(/#hash$/);
  });
});
