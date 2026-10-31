import { test, expect } from '@playwright/test';

test('the homepage introduces beginning-of-story characters with scoped profile links', async ({ page }) => {
  await page.goto('/?lang=en');
  const cast = page.getByRole('region', { name: 'Who will you meet first?' });
  await expect(cast.getByText('A Christmas Carol')).toBeVisible();
  await expect(cast.getByText("Alice's Adventures in Wonderland")).toBeVisible();
  await expect(cast.getByText('The Mouse', { exact: true })).toHaveCount(0);
  const alice = cast.getByRole('link', { name: /Alice A curious girl/ });
  await expect(alice).toHaveAttribute('href', /characters\/alice\?lang=en&volume=1&chapter=1/);
  await alice.click();
  await expect(page).toHaveURL(/characters\/alice\?lang=en&volume=1&chapter=1/);
});

test('character discovery fits mobile and preserves the selected language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=pl');
  const cast = page.getByRole('region', { name: 'Kogo spotkasz na początku?' });
  await expect(cast.getByRole('link', { name: /Zobacz wszystkich bohaterów/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await cast.getByRole('link', { name: /Ebenezer Scrooge/ }).click();
  await expect(page).toHaveURL(/characters\/ebenezer-scrooge\?lang=pl&volume=1&chapter=1/);
});
