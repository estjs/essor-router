import { expect, test } from '@playwright/test';

test('should work with basic router navigation', async ({ page }) => {
  await page.goto('http://localhost:3001');
  const inner = await page.textContent('#app');
  await expect(inner?.trim()).toBe('Home');
  await page.getByText('Home').click();
  const inner2 = await page.textContent('#app');
  await expect(inner2?.trim()).toBe('About');
});
