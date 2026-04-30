import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3003' });

test('typed-router navigation works', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: /Home Page \(Typed\)/ })).toBeVisible();

  // Verify dynamic params route renders as expected.
  await page.goto('/users/789');
  await expect(page.getByRole('heading', { level: 1, name: /User Profile \(Typed\)/ })).toBeVisible();
  await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*789/);

  // Test optional param missing
  await page.goto('/post');
  await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);

  // Test optional param present
  await page.goto('/post/abc');
  await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*abc/);

  // Test catch-all
  await page.goto('/missing/nested/path');
  await expect(page.getByTestId('catch-all-path')).toHaveText(
    /Unknown path:\s*missing\/nested\/path/,
  );
});
