import { test, expect } from '@playwright/test';

async function mockAnonymousSession(page) {
  await page.route('**/api/auth/get-session', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': new URL(page.url()).origin, 'access-control-allow-credentials': 'true' }, body: 'null' }));
}

test('account page explains separate progress and keeps guest access', async ({ page }) => {
  await mockAnonymousSession(page);
  await page.goto('/account?lang=en');
  await expect(page.getByRole('heading', { name: 'In this browser' })).toBeVisible();
  await expect(page.getByText('Your browser copy stays separate.')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore without an account/ })).toHaveAttribute('href', '/library?lang=en');
  await page.getByRole('link', { name: /Create an account/ }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(page.getByLabel(/Password/)).toHaveAttribute('autocomplete', 'new-password');
});

test('mobile puts sign-in before the explanation while retaining the guest path', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAnonymousSession(page);
  await page.goto('/account?lang=pl');
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'W tej przeglądarce' })).toBeVisible();
  const positions = await page.evaluate(() => ({ form: document.querySelector('.account-page').getBoundingClientRect().top, story: document.querySelector('.account-story').getBoundingClientRect().top, overflow: document.documentElement.scrollWidth > innerWidth }));
  expect(positions.form).toBeLessThan(positions.story);
  expect(positions.overflow).toBe(false);
  await page.getByRole('link', { name: /Odkryj bibliotekę bez konta/ }).click();
  await expect(page).toHaveURL(/\/library\?lang=pl/);
});

test('an unavailable account service still offers a retry and guest access', async ({ page }) => {
  await page.route('**/api/auth/get-session', (route) => route.abort());
  await page.goto('/account?lang=en');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore without an account/ })).toBeVisible();
});
