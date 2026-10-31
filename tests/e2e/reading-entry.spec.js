import { test, expect } from '@playwright/test';

test('a reader can open the map at an explicitly chosen chapter', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland?lang=en');
  const entry = page.locator('#reading-entry-form');
  await entry.getByRole('radio', { name: 'VOLUME 1 Chapter 2' }).check();
  await entry.getByRole('button', { name: 'Open the map at this chapter' }).click();
  await expect(page).toHaveURL(/\/map\?lang=en&volume=1&chapter=2/);
  await expect(page.locator('#progress')).toHaveValue('1:2');
});

test('the chapter entry fits on mobile and retains the selected language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland?lang=pl');
  const entry = page.locator('#reading-entry-form');
  await entry.getByRole('radio', { name: 'TOM 1 Rozdział 2' }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await entry.getByRole('button', { name: 'Otwórz mapę na tym etapie' }).click();
  await expect(page).toHaveURL(/\/map\?lang=pl&volume=1&chapter=2/);
  await expect(page.locator('#progress')).toHaveValue('1:2');
});

test('the original map link still restores a saved reading position', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', (route) => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland?lang=en');
  await page.evaluate(() => localStorage.setItem('castellation:guest-progress:alices-adventures-in-wonderland', JSON.stringify({ volume: 1, chapter: 2 })));
  await page.locator('#story-map').click();
  await expect(page.locator('#progress')).toHaveValue('1:2');
});
