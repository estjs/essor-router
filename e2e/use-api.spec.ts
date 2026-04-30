import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3013' });

test.describe('useRoute/useRouter API example', () => {
  test('reacts to query update triggered by useRouter.push', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('route.query:')).toBeVisible();
    await expect(page.getByText('route.query:hi')).toBeVisible();
  });
});
