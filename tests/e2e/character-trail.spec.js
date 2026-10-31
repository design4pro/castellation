import { test, expect } from '@playwright/test';

test('character connections lead to the other character at the same reading position', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/characters/alice?lang=en&volume=1&chapter=1');
  const trail = page.getByRole('complementary', { name: 'Follow the connections' });
  await expect(trail).toContainText('Alice');
  await expect(trail).toContainText('The White Rabbit');
  await expect(trail.getByRole('link', { name: 'Follows' })).toHaveAttribute('href', /relations\/alice-rabbit\?lang=en&volume=1&chapter=1/);
  await trail.getByRole('link', { name: 'Meet The White Rabbit' }).click();
  await expect(page).toHaveURL(/characters\/white-rabbit\?lang=en&volume=1&chapter=1/);
  await expect(page.getByRole('heading', { name: 'The White Rabbit', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meet Alice' })).toBeVisible();
});

test('the connection card fits mobile and keeps the chosen language and chapter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/alices-adventures-in-wonderland/characters/alice?lang=pl&volume=1&chapter=2');
  const trail = page.getByRole('complementary', { name: 'Ślady powiązań' });
  await expect(trail).toContainText('rozdziału 2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await trail.getByRole('link', { name: 'Poznaj The White Rabbit' }).click();
  await expect(page).toHaveURL(/characters\/white-rabbit\?lang=pl&volume=1&chapter=2/);
});
