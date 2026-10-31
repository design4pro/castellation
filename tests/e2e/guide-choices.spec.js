import { test, expect } from '@playwright/test';

test('guide choices take readers directly to the selected subject', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/guides?lang=en');
  const choices = page.getByRole('region', { name: 'How would you like to read?' });
  await expect(choices.getByRole('link', { name: /Follow the characters/ })).toHaveAttribute('href', '/guides/track-characters?lang=en');
  await expect(choices.getByRole('link', { name: /Look closer at a story/ })).toHaveAttribute('href', '/guides/alice-down-the-rabbit-hole?lang=en');
  await expect(choices.getByRole('link', { name: /Read together/ })).toHaveAttribute('href', '/guides/book-club-questions?lang=en');
  await choices.getByRole('link', { name: /Read together/ }).click();
  await expect(page).toHaveURL(/\/guides\/book-club-questions\?lang=en/);
  await expect(page.locator('h1')).toBeVisible();
});

test('guide choices remain accessible and preserve language on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guides?lang=pl');
  const choices = page.getByRole('region', { name: 'Jak chcesz dziś czytać?' });
  await expect(choices.getByRole('link', { name: /Śledź bohaterów/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await choices.getByRole('link', { name: /Przyjrzyj się historii/ }).click();
  await expect(page).toHaveURL(/\/guides\/alice-down-the-rabbit-hole\?lang=pl/);
  await expect(page.locator('h1')).toBeVisible();
});
