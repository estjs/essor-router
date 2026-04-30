import { expect, test } from '@playwright/test';

test.describe('file-routes named views and groups', () => {
  test('renders sidebar fallback and group folder route', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('No Sidebar Content')).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  });
});
