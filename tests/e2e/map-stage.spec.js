import { test, expect } from '@playwright/test';

test('the map is visible early and supports character and chapter exploration', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  expect(await page.locator('#graph').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(900);
  await page.getByRole('button', { name: 'Alice', exact: true }).click();
  await expect(page.locator('#map-detail-name')).toHaveText('Alice');
  await expect(page.locator('#map-detail-link')).toHaveAttribute('href', /chapter=1/);
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#progress')).toHaveValue('1:2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
});

test('the map and chapter controls remain usable on mobile', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', (route) => route.fulfill({ status: 401, body: '' }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=pl&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Następny' }).click();
  await expect(page.locator('#progress')).toHaveValue('1:2');
  await expect(page.locator('#map-summary')).toContainText('rozdział 2');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('castellation:guest-progress:alices-adventures-in-wonderland') || 'null')?.chapter)).toBe(2);
});
