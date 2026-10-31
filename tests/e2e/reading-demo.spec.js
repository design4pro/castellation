import { test, expect } from '@playwright/test';

test('the demo loads later chapter details only after the reader asks', async ({ page }) => {
  let laterRequests = 0;
  page.on('request', (request) => { if (request.url().includes('/api/books/alices-adventures-in-wonderland?volume=1&chapter=2')) laterRequests++; });
  await page.goto('/how-it-works?lang=en');
  const demo = page.getByRole('region', { name: 'Your reading sets the boundary.' });
  await expect(demo.getByText('Alice', { exact: true })).toBeVisible();
  await expect(demo.getByText('The Mouse', { exact: true })).toHaveCount(0);
  await demo.getByLabel('Read up to').selectOption('1:2');
  expect(laterRequests).toBe(0);
  await demo.getByRole('button', { name: 'Show' }).click();
  await expect(demo.getByText('The Mouse', { exact: true })).toBeVisible();
  expect(laterRequests).toBe(1);
  await expect(demo.getByRole('link', { name: 'Open the map at this chapter' })).toHaveAttribute('href', /map\?lang=en&volume=1&chapter=2/);
});

test('the demo is usable on mobile and retains the last successful state on failure', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=2', (route) => route.fulfill({ status: 503 }));
  await page.goto('/how-it-works?lang=pl');
  const demo = page.getByRole('region', { name: 'Twoja lektura wyznacza granicę.' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await demo.getByLabel('Przeczytano do').selectOption('1:2');
  await demo.getByRole('button', { name: 'Pokaż' }).click();
  await expect(demo.getByRole('status')).toContainText('Nie udało się');
  await expect(demo.getByText('The Mouse', { exact: true })).toHaveCount(0);
  await expect(demo.getByRole('link', { name: 'Otwórz mapę na tym etapie' })).toHaveAttribute('href', /map\?lang=pl&volume=1&chapter=1/);
});

test('the initial example and map link remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/how-it-works?lang=en');
  await expect(page.getByText('Available characters: 2')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the map at this chapter' })).toHaveAttribute('href', /chapter=1/);
  await context.close();
});
