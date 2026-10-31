import { test, expect } from '@playwright/test';

test('share link follows the chosen chapter and excludes personal notes', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.copiedMapLink = text; } }, configurable: true }); });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  const share = page.getByRole('region', { name: 'Share the story at your chapter.' });
  await expect(share.getByText('Volume 1 · Chapter 1')).toBeVisible();
  await page.locator('#progress').selectOption('1:2');
  await expect(share.getByText('Volume 1 · Chapter 2')).toBeVisible();
  await share.getByRole('button', { name: 'Copy link' }).click();
  await expect(share.getByRole('status')).toHaveText('Link copied.');
  const copied = await page.evaluate(() => window.copiedMapLink);
  expect(copied).toContain('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=2');
  expect(new URL(copied).searchParams.size).toBe(3);
  await page.goto(copied);
  await expect(page.locator('#progress')).toHaveValue('1:2');
});

test('clipboard failure offers manual copy on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } }, configurable: true }); });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=pl&volume=1&chapter=1');
  const share = page.getByRole('region', { name: 'Podziel się historią na tym etapie.' });
  await expect(share).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await share.getByRole('button', { name: 'Kopiuj link' }).click();
  await expect(share.getByRole('status')).toContainText('ręcznie');
  await expect(share.getByLabel('Link do mapy')).toBeFocused();
  expect(await share.getByLabel('Link do mapy').evaluate((input) => input.selectionEnd - input.selectionStart)).toBeGreaterThan(0);
});

test('a failed chapter update does not expose a stale share link', async ({ page }) => {
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=2', (route) => route.fulfill({ status: 503 }));
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#map-share')).toBeVisible();
  await page.locator('#progress').selectOption('1:2');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#map-share')).toBeHidden();
});
