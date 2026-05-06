import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3014' });

test.describe('param-parsers example', () => {
  test('parses id param as number and renders runtime type check', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 2, name: 'Param Parsers Example' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Go to Typed User 789' }).click();

    await expect(page.getByText('Raw Path Param:')).toBeVisible();
    await expect(page.getByText(/Raw Path Param:\s*789/)).toBeVisible();
    await expect(page.getByText(/Is number type at runtime\?/)).toBeVisible();
    await expect(page.getByText(/No ✗/)).toBeVisible();
  });
});
