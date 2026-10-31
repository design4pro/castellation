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

test('atlas shell is opt-in and preserves mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('body')).toHaveClass('relationship-atlas');
  await page.locator('.site-nav-mobile summary').click();
  await expect(page.locator('.site-nav-mobile').getByRole('link', { name: 'Account', exact: true })).toBeVisible();
  for (const path of ['/library?lang=en', '/account?lang=en']) {
    await page.goto(path);
    await expect(page.locator('body')).not.toHaveClass('relationship-atlas');
  }
});

test('graph uses the latest eligible portrait and falls back after an image failure', async ({ page }) => {
  const requests = [];
  await page.route('**/atlas-test-portrait-*', (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 404 });
  });
  await page.route('**/api/books/alices-adventures-in-wonderland?*', async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.story.characters[0].portraits = [
      { volume: 1, chapter: 8, url: '/atlas-test-portrait-future' },
      { volume: 1, chapter: 1, url: '/atlas-test-portrait-current' },
    ];
    await route.fulfill({ json: data });
  });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await expect.poll(() => requests.some((url) => url.endsWith('atlas-test-portrait-current'))).toBe(true);
  expect(requests.some((url) => url.includes('future'))).toBe(false);
  const node = page.locator('.graph-node').first();
  await expect(node.locator('image')).toHaveCount(0);
  await expect(node.locator('.node-initial')).not.toBeEmpty();
  await node.click();
  await expect(page.locator('.map-detail-mark img')).toHaveCount(0);
});
