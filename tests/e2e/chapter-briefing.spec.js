import { test, expect } from '@playwright/test';

test('the opening presents events, characters and a map scoped to the chapter', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/books/alices-adventures-in-wonderland/opening?lang=en');
  await expect(page.getByRole('heading', { name: 'What happens' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meet the characters' })).toBeVisible();
  await expect(page.getByText('Alice follows the White Rabbit into a curious new world.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Alice', exact: true })).toHaveAttribute('href', /characters\/alice\?lang=en&volume=1&chapter=1/);
  await page.getByRole('link', { name: 'See the map for this chapter' }).click();
  await expect(page).toHaveURL(/map\?lang=en&volume=1&chapter=1/);
  await expect(page.locator('#progress')).toHaveValue('1:1');
});

test('the opening keeps its chapter and language on mobile for another book', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/books/a-christmas-carol/opening?lang=pl');
  await expect(page.getByRole('heading', { name: 'Co się wydarza' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Poznaj bohaterów' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: /Project Gutenberg/ })).toBeVisible();
  await page.getByRole('link', { name: 'Zobacz mapę tego rozdziału' }).click();
  await expect(page).toHaveURL(/map\?lang=pl&volume=1&chapter=1/);
  await expect(page.locator('#progress')).toHaveValue('1:1');
});
