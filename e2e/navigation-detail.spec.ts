import { expect, test } from '@playwright/test';

test.describe('file-routes detailed navigation', () => {
  test('navigates via header links and renders expected pages', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Home Page' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About Page' })).toBeVisible();

    await page.getByRole('link', { name: 'User 123' }).click();
    await expect(page).toHaveURL(/\/users\/123$/);
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*123/);

    await page.getByRole('link', { name: 'Post ABC' }).click();
    await expect(page).toHaveURL(/\/post\/abc$/);
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*abc/);
  });

  test('supports deep-link load and subsequent in-app navigation', async ({ page }) => {
    await page.goto('/nested/child');
    await expect(page).toHaveURL(/\/nested\/child$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Nested Layout' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Nested Child Component' })).toBeVisible();

    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Home Page' })).toBeVisible();

    await page.getByRole('link', { name: 'Nested Child' }).click();
    await expect(page).toHaveURL(/\/nested\/child$/);
    await expect(page.getByRole('heading', { level: 3, name: 'Nested Child Component' })).toBeVisible();
  });

  test('handles direct optional and catch-all routes', async ({ page }) => {
    await page.goto('/post');
    await expect(page.getByRole('heading', { level: 1, name: 'Post Page' })).toBeVisible();
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

    await page.goto('/unknown/deep/path?tab=1#section');
    await expect(page.getByRole('heading', { level: 1, name: '404 Not Found' })).toBeVisible();
    await expect(page.getByTestId('catch-all-path')).toHaveText(/Unknown path:\s*unknown\/deep\/path/);
    await expect(page).toHaveURL(/tab=1/);
    await expect(page).toHaveURL(/#section$/);
  });
});
