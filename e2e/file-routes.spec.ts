import { expect, test } from '@playwright/test';

test.describe('file-routes advanced navigation', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('advanced navigation works', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Home Page')).toBeVisible();

    await page.goto('/users/123');
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*123/);

    await page.goto('/post');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

    await page.goto('/post/abc');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*abc/);

    await page.goto('/unknown/path/to/content');
    await expect(page.getByTestId('catch-all-path')).toHaveText(
      /Unknown path:\s*unknown\/path\/to\/content/,
    );

    await page.goto('/nested/child');
    await expect(page.getByRole('heading', { level: 2, name: 'Nested Layout' })).toBeVisible();
    await expect(page.getByText('Nested Child Component')).toBeVisible();
  });
});
