import { expect, test } from '@playwright/test';

test('file-routes app boots', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Home Page/ })).toBeVisible();
});
