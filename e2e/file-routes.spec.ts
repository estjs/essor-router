import { expect, test } from '@playwright/test';

test('file-routes advanced navigation works', async ({ page }) => {
  await page.goto('/');

  // Should show index page
  await expect(page.getByText('Home Page')).toBeVisible();

  // Dynamic route Test
  await page.goto('/users/123');
  await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*123/);

  // Optional dynamic route missing
  await page.goto('/post');
  await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

  // Optional dynamic route present
  await page.goto('/post/abc');
  await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*abc/);

  // Catch-all
  await page.goto('/unknown/path/to/content');
  await expect(page.getByTestId('catch-all-path')).toHaveText(
    /Unknown path:\s*unknown\/path\/to\/content/,
  );

  // Nested Layout
  await page.goto('/nested/child');
  await expect(page.getByRole('heading', { level: 2, name: 'Nested Layout' })).toBeVisible();
  await expect(page.getByText('Nested Child Component')).toBeVisible();
});
