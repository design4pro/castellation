import { test, expect } from '@playwright/test';

test('a selected character opens beside the graph and returns focus on close', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#map-detail-prompt')).toBeVisible();
  const alice = page.getByRole('button', { name: 'Alice', exact: true });
  await alice.focus();
  await page.keyboard.press('Enter');
  await expect(alice).toHaveAttribute('aria-expanded', 'true');
  const detail = page.locator('#map-detail');
  await expect(detail).toBeInViewport();
  await expect(page.locator('#map-detail-name')).toBeFocused();
  await expect(detail.getByRole('link', { name: 'Open character profile' })).toHaveAttribute('href', /characters\/alice\?lang=en&volume=1&chapter=1/);
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(detail).toBeHidden();
  await expect(alice).toBeFocused();
  await expect(alice).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#progress')).toHaveValue('1:2');
  await expect(page.locator('#map-detail-prompt')).toBeVisible();
});

test('mobile selection brings the character details into view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=pl&volume=1&chapter=1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
  await page.getByRole('button', { name: 'Alice', exact: true }).click();
  await expect(page.locator('#map-detail-name')).toBeInViewport();
  await expect(page.locator('#map-detail-name')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Otwórz profil postaci' })).toHaveAttribute('href', /lang=pl&volume=1&chapter=1/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const query of ['character=alice', 'character=unrevealed&relation=unknown']) {
  test(`contextual entry resolves only returned records: ${query}`, async ({ page }) => {
    await page.goto(`/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1&${query}`);
    await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
    if (query === 'character=alice') {
      await expect(page.locator('#map-detail-name')).toHaveText('Alice');
      await expect(page.locator('#map-detail-name')).not.toBeFocused();
    } else {
      await expect(page.locator('#map-detail')).toBeHidden();
      await expect(page.locator('#map-detail-prompt')).toBeVisible();
    }
    await page.locator('#progress').selectOption('1:2');
    await expect(page.locator('#map-detail')).toBeHidden();
    expect(new URL(page.url()).searchParams.has('character')).toBe(false);
    expect(new URL(page.url()).searchParams.has('relation')).toBe(false);
  });
}

test('relation entry wins over character and textual controls restore focus', async ({ page, request }) => {
  const response = await request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/api/books/alices-adventures-in-wonderland?volume=1&chapter=1`);
  const { story } = await response.json();
  const relation = story.relations[0];
  await page.goto(`/books/alices-adventures-in-wonderland/map?lang=pl&volume=1&chapter=1&character=alice&relation=${relation.id}`);
  await expect(page.locator('#map-detail-description')).toHaveText(relation.label);
  await expect(page.locator('#map-detail-link')).toHaveAttribute('href', /\/relations\/.*lang=pl&volume=1&chapter=1/);
  await expect(page.locator('#map-detail-name')).not.toBeFocused();
  await page.getByRole('button', { name: 'Zamknij szczegóły' }).click();
  const character = page.locator('#character-list button').first();
  await character.click();
  await expect(page.locator('#map-detail-name')).toBeFocused();
  await page.getByRole('button', { name: 'Zamknij szczegóły' }).click();
  await expect(character).toBeFocused();
  const connection = page.locator('#map-connections-list button').first();
  await connection.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#map-detail-description')).toHaveText(relation.label);
  await page.getByRole('button', { name: 'Zamknij szczegóły' }).click();
  await expect(connection).toBeFocused();
});
