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

test('backward loading removes every previous chapter surface before a failed response', async ({ page, request }) => {
  const response = await request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/api/books/alices-adventures-in-wonderland?volume=1&chapter=2`);
  const later = await response.json();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=1', async (route) => { await gate; await route.fulfill({ status: 503 }); });
  await page.route('**/api/progress/alices-adventures-in-wonderland', (route) => route.fulfill({ status: 401 }));
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=2');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await page.locator('.graph-node').first().click();
  await page.locator('#progress').selectOption('1:1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'loading');
  for (const selector of ['#graph-svg', '#character-list', '#event-list', '#map-connections-list', '#chapter-discoveries-list', '.map-detail-mark']) await expect(page.locator(selector)).toBeEmpty();
  await expect(page.locator('#map-detail-name')).toBeEmpty();
  await expect(page.locator('#map-detail-link')).not.toHaveAttribute('href');
  await expect(page.locator('#reading-sheet-link')).not.toHaveAttribute('href');
  await expect(page.locator('#map-share-url')).toHaveValue('');
  for (const character of later.story.characters.filter((item) => item.chapter > 1)) expect(await page.locator('#story-app').textContent()).not.toContain(character.name);
  release();
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#map-retry')).toBeVisible();
  await expect(page.locator('#progress-memory-text')).toContainText('saved in this browser');
  await expect(page.locator('#status')).toContainText('Unable to update');
  await page.unroute('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=1');
  await page.locator('#map-retry').click();
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map-summary')).toContainText('chapter 1');
});

test('only the latest requested chapter can render after out-of-order responses', async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let received;
  const routed = new Promise((resolve) => { received = resolve; });
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=2', async (route) => { received(); await gate; await route.continue(); });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await page.locator('#progress').selectOption('1:2');
  await routed;
  await page.locator('#progress').selectOption('1:1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  const lateResponse = page.waitForResponse((response) => response.url().endsWith('volume=1&chapter=2'));
  release();
  await lateResponse;
  await expect(page.locator('#map-summary')).toContainText('chapter 1');
  await expect(page.locator('#progress')).toHaveValue('1:1');
});

test('invalid position and withdrawn-book errors leave explicit recovery controls', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=999');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#graph-svg')).toBeEmpty();
  await page.locator('#progress').selectOption('1:2');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=1', (route) => route.fulfill({ status: 404 }));
  await page.locator('#progress').selectOption('1:1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#graph-svg')).toBeEmpty();
  await expect(page.getByRole('link', { name: 'Library', exact: true }).first()).toBeVisible();
});
