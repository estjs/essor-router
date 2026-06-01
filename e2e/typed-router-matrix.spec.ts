import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3003' });

test.describe('typed-router feature matrix', () => {
  test('navigates by typed button action from home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Home Page (Typed)' })).toBeVisible();

    await page.getByTestId('navigate-btn').click();
    await expect(page).toHaveURL(/\/users\/789$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'User Profile (Typed)' }),
    ).toBeVisible();
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*789/);
  });

  test('supports nav links and direct deep links', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'User 456' }).click();
    await expect(page).toHaveURL(/\/users\/456$/);
    await expect(page.getByTestId('user-id')).toHaveText(/User ID:\s*456/);

    await page.goto('/post/typed');
    await expect(page.getByRole('heading', { level: 1, name: 'Post Page (Typed)' })).toBeVisible();
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*typed/);

    await page.goto('/post');
    await expect(page.getByTestId('post-id')).toHaveText(/Post ID:\s*No ID Provided/);
  });

  test('resolves catch-all route with query/hash in typed app', async ({ page }) => {
    await page.goto('/unmatched/path/in/typed?mode=qa#typed-hash');
    await expect(
      page.getByRole('heading', { level: 1, name: '404 Not Found (Typed)' }),
    ).toBeVisible();
    await expect(page.getByTestId('catch-all-path')).toHaveText(
      /Unknown path:\s*unmatched\/path\/in\/typed/,
    );
    await expect(page).toHaveURL(/mode=qa/);
    await expect(page).toHaveURL(/#typed-hash$/);
  });

  test('renders sidebar fallback and group route', async ({ page }) => {
    await page.goto('/users/456');
    await expect(page.getByText('No Sidebar Content')).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  });
});
