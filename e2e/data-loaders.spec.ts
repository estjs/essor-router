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

  test('beforeLoad redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/');

    // /profile defines a `beforeLoad` that returns { redirect: { name: '/login' } }
    // because the fake auth check resolves false.
    await page.getByRole('button', { name: 'Go to Profile' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Login Page' })).toBeVisible();
    await expect(page.getByText('You were redirected here because')).toBeVisible();
  });
});
