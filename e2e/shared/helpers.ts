import { type Page, expect } from '@playwright/test';

export async function assertUrlContains(page: Page, expected: string, timeout = 5000) {
  await page.waitForURL((url) => url.toString().includes(expected), { timeout });
  expect(page.url()).toContain(expected);
}

export async function assertVisible(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await expect(page.locator(selector).first()).toBeVisible();
}

export async function assertText(
  page: Page,
  selector: string,
  text: string | RegExp,
  timeout = 5000,
) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await expect(page.locator(selector).first()).toContainText(text);
}

export async function assertTextExact(page: Page, selector: string, text: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await expect(page.locator(selector).first()).toHaveText(text);
}

export async function clickAndWait(
  page: Page,
  selector: string,
  waitForUrl?: string,
  timeout = 5000,
) {
  await page.click(selector);
  if (waitForUrl) {
    await page.waitForURL((url) => url.toString().includes(waitForUrl), { timeout });
  }
}

export async function navigateAndVerify(
  page: Page,
  path: string,
  expectedSelector: string,
  expectedText?: string,
  timeout = 5000,
) {
  await page.goto(path);
  await page.waitForSelector(expectedSelector, { state: 'visible', timeout });
  if (expectedText) {
    await expect(page.locator(expectedSelector).first()).toContainText(expectedText);
  }
}

export async function verifyRouteParams(
  page: Page,
  path: string,
  paramSelector: string,
  expectedParamValue: string,
  timeout = 5000,
) {
  await page.goto(path);
  await page.waitForSelector(paramSelector, { state: 'visible', timeout });
  await expect(page.locator(paramSelector).first()).toContainText(expectedParamValue);
}

export async function reloadAndVerify(
  page: Page,
  expectedSelector: string,
  expectedText?: string,
  timeout = 5000,
) {
  await page.reload();
  await page.waitForSelector(expectedSelector, { state: 'visible', timeout });
  if (expectedText) {
    await expect(page.locator(expectedSelector).first()).toContainText(expectedText);
  }
}

export async function verifyQueryAndHash(
  page: Page,
  path: string,
  expectedQuery: string,
  expectedHash: string,
) {
  await page.goto(path);
  const url = new URL(page.url());
  expect(url.search).toContain(expectedQuery);
  expect(url.hash).toBe(expectedHash);
}

export async function goBack(
  page: Page,
  expectedSelector: string,
  expectedText?: string,
  timeout = 10000,
) {
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector(expectedSelector, { state: 'visible', timeout });
  if (expectedText) {
    await expect(page.locator(expectedSelector).first()).toContainText(expectedText);
  }
}

export async function goForward(
  page: Page,
  expectedSelector: string,
  expectedText?: string,
  timeout = 10000,
) {
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector(expectedSelector, { state: 'visible', timeout });
  if (expectedText) {
    await expect(page.locator(expectedSelector).first()).toContainText(expectedText);
  }
}
