import { test, expect } from '@playwright/test';

test('the relation spread links to both people and preserves reading progress', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/books/alices-adventures-in-wonderland/relations/alice-rabbit?lang=en&volume=1&chapter=1');
  const spread = page.getByRole('region', { name: 'Characters and their connection' });
  await expect(spread.getByRole('link', { name: /Open profile: Alice/ })).toBeVisible();
  await expect(spread.getByRole('link', { name: /Open profile: The White Rabbit/ })).toHaveAttribute('href', /characters\/white-rabbit\?lang=en&volume=1&chapter=1/);
  await expect(page.getByRole('link', { name: 'Open the story map' })).toHaveAttribute('href', /map\?lang=en&volume=1&chapter=1/);
  await spread.getByRole('link', { name: /Open profile: Alice/ }).click();
  await expect(page).toHaveURL(/characters\/alice\?lang=en&volume=1&chapter=1/);
});

test('the spread works on mobile and preserves the selected chapter and language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland/relations/alice-rabbit?lang=pl&volume=1&chapter=2');
  const spread = page.getByRole('region', { name: 'Bohaterowie i ich powiązanie' });
  await expect(page.getByText('Informacje do tomu 1, rozdziału 2.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await spread.getByRole('link', { name: /Otwórz profil: The White Rabbit/ }).click();
  await expect(page).toHaveURL(/characters\/white-rabbit\?lang=pl&volume=1&chapter=2/);
});
