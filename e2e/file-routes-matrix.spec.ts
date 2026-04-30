import { expect, test } from '@playwright/test';

test.describe('file-routes feature matrix', () => {
  test('supports deep-link, reload, and route-param transitions', async ({ page }) => {
    await page.goto('/users/42');
    await expect(page.getByRole('heading', { level: 1, name: 'User Profile' })).toBeVisible();
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*42/);

    await page.reload();
    await expect(page).toHaveURL(/\/users\/42$/);
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*42/);

    await page.goto('/users/77');
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*77/);
  });

  test('supports optional params with and without id', async ({ page }) => {
    await page.goto('/post');
    await expect(page.getByRole('heading', { level: 1, name: 'Post Page' })).toBeVisible();
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

    await page.goto('/post/with-id');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*with-id/);
  });

  test('keeps query/hash and resolves catch-all payload', async ({ page }) => {
    await page.goto('/missing/segment/path?from=e2e#anchor');
    await expect(page.getByRole('heading', { level: 1, name: '404 Not Found' })).toBeVisible();
    await expect(page.getByTestId('catch-all-path')).toHaveText(/Unknown path:\s*missing\/segment\/path/);
    await expect(page).toHaveURL(/from=e2e/);
    await expect(page).toHaveURL(/#anchor$/);
  });

  test('renders nested layout and child together', async ({ page }) => {
    await page.goto('/nested/child');
    await expect(page.getByRole('heading', { level: 2, name: 'Nested Layout' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Nested Child Component' })).toBeVisible();
    await expect(page.getByText('Rendered inside the nested layout.')).toBeVisible();
  });
});
