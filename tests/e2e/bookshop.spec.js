import { test, expect } from '@playwright/test';

for (const width of [360, 1440]) {
  test(`the bookshelf opens real catalog books at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?lang=en');
    const shelf = page.getByRole('navigation', { name: 'Choose a book from the shelf' });
    const books = shelf.getByRole('link');
    await expect(books).toHaveCount(2);
    await expect(books.first()).toContainText('Charles Dickens');
    await expect(books.last()).toContainText('Lewis Carroll');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await books.last().click();
    await expect(page).toHaveURL(/books\/alices-adventures-in-wonderland\?lang=en/);
    await expect(page.locator('#story-map')).toBeVisible();
  });
}

test('the bookshelf is usable with the keyboard and preserves the language', async ({ page }) => {
  await page.goto('/?lang=pl');
  const book = page.locator('.bound-book').first();
  await book.focus();
  await expect(book).toBeFocused();
  expect(await book.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/books\/a-christmas-carol\?lang=pl/);
});

test('the bookshelf remains usable without client JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/?lang=en');
  await page.locator('.bound-book').last().click();
  await expect(page).toHaveURL(/books\/alices-adventures-in-wonderland\?lang=en/);
  await context.close();
});
