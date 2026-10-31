import { test, expect } from '@playwright/test';

test('notes persist for the selected chapter and appear in print', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/reading-sheet?lang=en&volume=1&chapter=1');
  const note = page.getByLabel('Notes for this chapter');
  await note.fill('Why does Alice follow the rabbit?\nWhat does the watch mean?');
  await expect(page.getByRole('status')).toHaveText('Saved in this browser.');
  await page.reload();
  await expect(note).toHaveValue('Why does Alice follow the rabbit?\nWhat does the watch mean?');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#sheet-print-note')).toHaveText('Why does Alice follow the rabbit?\nWhat does the watch mean?');
  await expect(page.locator('#sheet-print-note')).toBeVisible();
  await expect(note).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.goto('/books/alices-adventures-in-wonderland/reading-sheet?lang=en&volume=1&chapter=2');
  await expect(page.getByLabel('Notes for this chapter')).toHaveValue('');
});

test('mobile notes report storage failure without discarding text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.goto('/books/alices-adventures-in-wonderland/reading-sheet?lang=pl&volume=1&chapter=1');
  const note = page.getByLabel('Notatki do rozdziału');
  await note.fill('Moja notatka');
  await expect(page.getByRole('status')).toContainText('Nie udało się zapisać');
  await expect(note).toHaveValue('Moja notatka');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('without JavaScript the sheet offers blank printable lines', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/books/alices-adventures-in-wonderland/reading-sheet?lang=en&volume=1&chapter=1');
  await expect(page.getByText('Enable JavaScript to write here, or print the blank lines.')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#sheet-print-note')).toBeVisible();
  await context.close();
});
