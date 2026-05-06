import { expect, test } from '@playwright/test';
import { assertText, assertUrlContains, assertVisible, goBack, goForward } from './shared/helpers';
import { Sel } from './shared/selectors';

test.describe('History Modes - HTML5', () => {
  test.use({ baseURL: 'http://localhost:3010' });

  test('uses clean URLs without hash', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).not.toContain('#');
  });

  test('supports browser back and forward', async ({ page }) => {
    await page.goto('/');
    await page.click('.home');
    await assertUrlContains(page, '/about');
    await assertVisible(page, '.about');

    await goBack(page, '.home');
    await assertUrlContains(page, '/');
    expect(page.url()).not.toContain('/about');

    await goForward(page, '.about');
    await assertUrlContains(page, '/about');
  });

  test('navigates to about and back to home with RouterLink', async ({ page }) => {
    await page.goto('/');
    await page.click('.home');
    await assertUrlContains(page, '/about');

    await page.click('.about');
    await assertUrlContains(page, '/');
  });

  test('renders 404 for unknown paths', async ({ page }) => {
    await page.goto('/missing-path');
    await assertText(page, Sel.notFound, '404');
  });
});

test.describe('History Modes - Hash', () => {
  test.use({ baseURL: 'http://localhost:3016' });

  test('uses hash-based URLs', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toContain('/#/');
  });

  test('navigates via hash URLs', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.getByText('Home');
    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await expect(page).toHaveURL(/#\/about/);

    const aboutLink = page.getByText('About');
    await aboutLink.click();
    await expect(page).toHaveURL(/#\/$/);
  });

  test('supports back and forward in hash mode', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.getByText('Home');
    await homeLink.click();
    await expect(page).toHaveURL(/#\/about/);

    await goBack(page, 'text=Home');
    await expect(page).toHaveURL(/#\/$/);

    await goForward(page, 'text=About');
    await expect(page).toHaveURL(/#\/about/);
  });

  test('deep links work with hash URLs', async ({ page }) => {
    await page.goto('/#/about');
    await expect(page.getByText('About')).toBeVisible();
    expect(page.url()).toContain('/#/about');
  });
});

test.describe('History Modes - Memory', () => {
  test.use({ baseURL: 'http://localhost:3012' });

  test('URL does not change during navigation', async ({ page }) => {
    await page.goto('/');
    const initialUrl = page.url();

    const homeLink = page.locator('a').filter({ hasText: 'Home' });
    await homeLink.click();

    expect(page.url()).toBe(initialUrl);
  });

  test('switches component on link click', async ({ page }) => {
    await page.goto('/');

    const homeLinks = page.locator('a');
    await expect(homeLinks.first()).toHaveAttribute('aria-current', 'page');

    await homeLinks.first().click();
    await page.waitForTimeout(200);

    const aboutLinks = page.locator('a').filter({ hasText: 'Home' });
    await aboutLinks.first().click();
    await page.waitForTimeout(200);

    const homeLinksAgain = page.locator('a');
    await expect(homeLinksAgain.first()).toHaveAttribute('aria-current', 'page');
  });

  test('aria-current reflects active route', async ({ page }) => {
    await page.goto('/');
    const activeLink = page.locator('[aria-current="page"]');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveText('Home');
  });
});
