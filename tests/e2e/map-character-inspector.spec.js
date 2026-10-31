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
