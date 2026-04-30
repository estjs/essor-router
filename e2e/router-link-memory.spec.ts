import { expect, test } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3012' })

test.describe('router-link memory history example', () => {
  test('switches rendered component through RouterLink', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const homeLink = page.locator('.home .nav a.link', { hasText: 'Home' })
    const aboutLink = page.locator('.home .nav a.link', { hasText: 'About' })
    await expect(aboutLink).toBeVisible({ timeout: 15000 })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute('aria-current', 'page')
    await aboutLink.click()

    const aboutHomeLink = page.locator('.about a.link', { hasText: 'Home' })
    await expect(aboutHomeLink).toBeVisible()
    await aboutHomeLink.click()

    await expect(aboutLink).toBeVisible()
  })

  test('renders dynamic link after mount', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const dynamicLink = page.locator('.home .link.dynamic')
    await expect(dynamicLink).toHaveAttribute('href', '/')
    await expect(dynamicLink).toContainText('Dynamic Link')
  })
})
