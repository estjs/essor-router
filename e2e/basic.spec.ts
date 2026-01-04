import { expect, test } from '@playwright/test';

test('should work with basic router navigation', async ({ page }) => {
  await page.goto('http://localhost:3001');
  
  // Wait for any anchor tag to appear (router has rendered)
  await page.waitForSelector('a', { timeout: 10000 });
  
  // Wait a bit more for router to stabilize
  await page.waitForTimeout(500);
  
  const inner = await page.textContent('#app');
  expect(inner?.trim()).toBe('Home');
  
  // Click the link with text "Home"
  await page.click('text=Home');
  
  // Wait for navigation
  await page.waitForTimeout(500);
  
  const inner2 = await page.textContent('#app');
  expect(inner2?.trim()).toBe('About');
});
