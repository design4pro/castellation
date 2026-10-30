import { test, expect } from '@playwright/test';

test('reader opens a book, explores its graph and visits a character', async ({ page }) => {
  await page.goto('/');
  await page.locator('.story-choice').filter({ hasText: "Alice's Adventures in Wonderland" }).click();
  await page.getByRole('link', { name: /Explore the map/ }).click();
  await expect(page.getByRole('heading', { name: "Alice's Adventures in Wonderland" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alice', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('#graph-svg > g')).toHaveAttribute('transform', /scale\(1.25\)/);
  await page.getByRole('combobox', { name: 'Read up to' }).selectOption('1:2');
  await expect(page.getByRole('combobox', { name: 'Read up to' })).toHaveValue('1:2');
  await page.locator('#character-list').getByRole('link', { name: 'Alice', exact: true }).click();
  await expect(page).toHaveTitle("Alice - Alice's Adventures in Wonderland - Castellation");
  await expect(page.getByRole('heading', { name:'Alice', exact:true })).toBeVisible();
});

test('graph and chapter selector fit on a narrow touch viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await page.locator('.site-nav-mobile summary').click();
  await expect(page.locator('.site-nav-mobile').getByRole('link', { name: /Account/ })).toBeVisible();
  await page.locator('.site-nav-mobile summary').click();
  await expect(page.getByRole('combobox', { name: 'Read up to' })).toBeVisible();
  await expect(page.getByRole('button', { name:'Alice', exact:true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test('later character page follows the selected chapter and is not indexed', async ({page}) => {
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await page.getByRole('combobox',{name:'Read up to'}).selectOption('1:2');
  await page.locator('#character-mouse').getByRole('link',{name:'The Mouse',exact:true}).click();
  await expect(page.getByRole('heading',{name:'The Mouse',exact:true})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
});

test('account synchronizes reading position across browser sessions', async ({ browser }) => {
  const first=await browser.newContext();const page=await first.newPage();
  const email=`reader-${Date.now()}@example.test`;
  await page.goto('/account?mode=signup');
  await page.getByLabel('Name').fill('Reader');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Password/).fill('a-secure-password-123');
  await page.getByRole('button',{name:'Create account'}).click();
  await expect(page.getByRole('status')).toContainText('verify your address');
  const outbox=await (await page.request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/__dev/outbox`)).json();
  const emailMessage=outbox.find((item)=>item.to===email);
  const verifyLink=emailMessage.text.match(/https?:\/\/\S+/)[0];
  await page.goto(verifyLink);
  await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('a-secure-password-123');await page.getByRole('button',{name:'Sign in'}).click();
  await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await page.getByRole('combobox',{name:'Read up to'}).selectOption('1:2');
  await expect(page.locator('#character-mouse').getByRole('link',{name:'The Mouse',exact:true})).toBeVisible();
  await expect.poll(async()=>{const response=await page.request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/api/progress/alices-adventures-in-wonderland`);return (await response.json()).progress?.chapter}).toBe(2);
  const second=await browser.newContext();const other=await second.newPage();
  await other.goto('/account');await other.getByLabel('E-mail').fill(email);await other.getByLabel(/Password/).fill('a-secure-password-123');await other.getByRole('button',{name:'Sign in'}).click();
  await expect(other.getByRole('button',{name:'Sign out'})).toBeVisible();
  await other.goto('/');
  await expect(other.locator('#resume-shelf')).toContainText('Progress saved to your account');
  await expect(other.locator('#resume-shelf')).toContainText('Chapter 2');
  await other.locator('#resume-shelf a').click();
  await expect(other.getByRole('combobox',{name:'Read up to'})).toHaveValue('1:2');
  await first.close();await second.close();
});

test('reader resets a password using a one-time email link', async ({page}) => {
  const email=`reset-${Date.now()}@example.test`;
  await page.goto('/account?mode=signup');await page.getByLabel('Name').fill('Reader');await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('a-secure-password-123');await page.getByRole('button',{name:'Create account'}).click();
  await expect(page.getByRole('status')).toContainText('verify your address');
  let messages=await (await page.request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/__dev/outbox`)).json();
  await page.goto(messages.find((item)=>item.to===email).text.match(/https?:\/\/\S+/)[0]);
  await page.getByLabel('E-mail').fill(email);await page.getByRole('button',{name:'Forgot password'}).click();
  await expect(page.getByRole('status')).toContainText('If the account exists');
  messages=await (await page.request.get(`${process.env.DEV_TEST_API_URL || 'http://localhost:8787'}/__dev/outbox`)).json();
  const reset=messages.find((item)=>item.to===email && item.subject.includes('Reset'));
  await page.goto(reset.text.match(/https?:\/\/\S+/)[0]);
  await page.getByLabel(/New password/).fill('another-secure-password-456');await page.getByRole('button',{name:'Save password'}).click();
  await expect(page.getByRole('status')).toContainText('Password changed');
  await expect(page).not.toHaveURL(/token=/);
  await page.getByRole('link',{name:'Back to sign in'}).click();
  await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('another-secure-password-456');await page.getByRole('button',{name:'Sign in'}).click();
  await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();
});

test('character profiles return anonymous readers to their selected chapter', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('#progress option')).toHaveCount(2);
  await page.selectOption('#progress', '1:2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await page.locator('#character-list a').first().click();
  await expect(page.locator('.reading-context')).toContainText('Chapter 2');
  await page.getByRole('link', { name: /Back to the map/ }).click();
  await expect(page.locator('#progress')).toHaveValue('1:2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('mobile navigation opens with keyboard and preserves reading context when switching language', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/books/alices-adventures-in-wonderland/characters/alice?lang=en&volume=1&chapter=2');
  const menu = page.locator('.site-nav-mobile summary');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.site-nav-mobile')).toHaveAttribute('open', '');
  await page.locator('.site-nav-mobile').getByRole('link', { name: /Polski/ }).click();
  await expect(page).toHaveURL(/lang=pl.*volume=1.*chapter=2/);
  await expect(page.locator('.reading-context')).toContainText('Rozdział 2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('map character details support keyboard exploration and clear on chapter changes', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/map');
  const alice = page.getByRole('button', { name: 'Alice', exact: true });
  await expect(alice).toBeVisible();
  await alice.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#map-detail')).toBeVisible();
  await expect(page.locator('#map-detail-name')).toHaveText('Alice');
  await expect(page.locator('#map-detail-link')).toHaveAttribute('href', /volume=1&chapter=1/);
  await page.getByRole('button', { name: 'Close character details' }).click();
  await expect(page.locator('#map-detail')).toBeHidden();
  await expect(alice).toBeFocused();
  await alice.press('Enter');
  await page.selectOption('#progress', '1:2');
  await expect(page.locator('#map-detail')).toBeHidden();
});

test('changing chapters hides stale story data until the requested chapter loads', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await expect(page.locator('#character-list')).toContainText('The Mouse');
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=1', async (route) => { await gate; await route.continue(); });
  await page.selectOption('#progress', '1:1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('#character-list')).toBeHidden();
  await expect(page.locator('#status')).toContainText('Updating the map');
  release();
  await expect(page.locator('#map-summary')).toContainText('chapter 1');
  await expect(page.locator('#character-list')).not.toContainText('The Mouse');
});

test('a failed chapter update keeps stale details hidden and offers a retry', async ({ page }) => {
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  let first = true;
  await page.route('**/api/books/alices-adventures-in-wonderland?volume=1&chapter=1', async (route) => {
    if (first) { first = false; await route.fulfill({ status: 503, body: 'Unavailable' }); }
    else await route.continue();
  });
  await page.selectOption('#progress', '1:1');
  await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#character-list')).toBeHidden();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#map-summary')).toContainText('chapter 1');
  await expect(page.locator('#character-list')).not.toContainText('The Mouse');
});

test('guest reading progress returns in the same browser and remains separate from account progress', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('#progress option')).toHaveCount(2);
  await page.selectOption('#progress', '1:2');
  await expect(page.locator('#progress-memory')).toContainText('Progress saved in this browser');
  await page.reload();
  await expect(page.locator('#progress')).toHaveValue('1:2');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await page.unroute('**/api/progress/alices-adventures-in-wonderland');
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: { volume: 1, chapter: 1 } }) }));
  await page.reload();
  await expect(page.locator('#progress')).toHaveValue('1:1');
  await expect(page.locator('#progress-memory')).toContainText('Account progress');
});

test('home offers a direct return to local or account progress without mixing them', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('#progress option')).toHaveCount(2);
  await page.selectOption('#progress', '1:2');
  await expect(page.locator('#progress-memory')).toContainText('Progress saved in this browser');
  await page.goto('/');
  await expect(page.locator('#resume-shelf')).toBeVisible();
  await expect(page.locator('#resume-shelf')).toContainText('Chapter 2');
  await page.locator('#resume-shelf a').click();
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await page.unroute('**/api/progress/alices-adventures-in-wonderland');
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: { volume: 1, chapter: 1 } }) }));
  const check = page.waitForResponse(response => response.url().includes('/api/progress/alices-adventures-in-wonderland') && response.status() === 200);
  await page.goto('/');
  await check;
  await expect(page.locator('#resume-shelf')).toBeVisible();
  await expect(page.locator('#resume-shelf')).toContainText('Progress saved to your account');
  await expect(page.locator('#resume-shelf')).toContainText('Chapter 1');
});

test('book page exposes first-chapter characters without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  await page.goto('/books/alices-adventures-in-wonderland');
  await expect(page.getByRole('heading', { name: 'First encounters' })).toBeVisible();
  await expect(page.locator('.book-cast-preview')).toContainText('Details through volume 1, chapter 1');
  await expect(page.locator('.book-cast-preview a').first()).toHaveAttribute('href', /characters\/alice/);
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('.map-no-script')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('sharing a character makes the chapter scope clear and supports manual copying', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/books/alices-adventures-in-wonderland/characters/alice?lang=en&volume=1&chapter=2');
  await page.locator('.share-panel summary').click();
  await expect(page.locator('.share-panel-body')).toContainText('selected chapter');
  await expect(page.locator('#share-url')).toHaveValue(/volume=1&chapter=2/);
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.locator('.share-feedback')).toHaveText('Copy the selected address manually.');
  await expect(page.locator('#share-url')).toBeFocused();
  await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /curious girl/);
});

test('chapter navigation advances only on request and keeps keyboard focus', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=1');
  const previous = page.getByRole('button', { name: '← Previous' });
  const next = page.getByRole('button', { name: 'Next →' });
  await expect(page.locator('#chapter-position-label')).toHaveText('Position 1 of 2');
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await expect(page.locator('#chapter-position-label')).toHaveText('Position 2 of 2');
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await previous.click();
  await expect(page.locator('#map-summary')).toContainText('chapter 1');
  await expect(page.locator('#character-list')).not.toContainText('The Mouse');
});

test('legacy story-map links open the dedicated map and retain reading position', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland?lang=en&volume=1&chapter=2#story-map');
  await expect(page).toHaveURL(/\/map\?lang=en&volume=1&chapter=2/);
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('account separates sign-in and registration and recovers from unavailable service', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/account');
  await expect(page.locator('#account-form')).toBeVisible();
  await expect(page.locator('#account-name')).toHaveCount(0);
  await expect(page.locator('#account-password')).toHaveAttribute('autocomplete', 'current-password');
  await page.getByRole('link', { name: /Create an account/ }).click();
  await expect(page.locator('#account-name')).toBeVisible();
  await expect(page.locator('#account-password')).toHaveAttribute('autocomplete', 'new-password');
  await page.route('**/api/auth/get-session', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.reload();
  await expect(page.locator('#auth-unavailable')).toBeVisible();
  await expect(page.locator('#account-form')).toBeHidden();
  await page.unroute('**/api/auth/get-session');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#account-form')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('a separate device copy remains available when account progress is unavailable', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 503, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('#progress option')).toHaveCount(2);
  await page.selectOption('#progress', '1:2');
  await expect(page.locator('#progress-memory')).toContainText('Progress saved in this browser. Account progress is separate.');
  await page.goto('/');
  await expect(page.locator('#resume-shelf')).toBeVisible();
  await expect(page.locator('#resume-shelf')).toContainText('separate from account progress');
  await page.locator('#resume-shelf a').click();
  await expect(page.locator('#map-summary')).toContainText('chapter 2');
  await page.unroute('**/api/progress/alices-adventures-in-wonderland');
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: { volume: 1, chapter: 1 } }) }));
  await page.goto('/books/alices-adventures-in-wonderland/map');
  await expect(page.locator('#progress')).toHaveValue('1:1');
});

test('chapter discoveries show only details introduced at the selected position', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map?volume=1&chapter=1');
  const discoveries = page.locator('.chapter-discoveries');
  await expect(discoveries).toContainText('Chapter 1');
  await expect(discoveries).not.toContainText('The Mouse');
  await page.selectOption('#progress', '1:2');
  await expect(discoveries).toContainText('Chapter 2');
  await expect(discoveries).toContainText('The Mouse');
  await expect(discoveries).not.toContainText('The White Rabbit');
  await page.selectOption('#progress', '1:1');
  await expect(discoveries).toContainText('Chapter 1');
  await expect(discoveries).not.toContainText('The Mouse');
});

test('map makes relationship labels and direction visible and keyboard operable', async ({ page }) => {
  await page.route('**/api/progress/alices-adventures-in-wonderland', route => route.fulfill({ status: 401, body: '' }));
  await page.goto('/books/alices-adventures-in-wonderland/map?volume=1&chapter=1');
  const relation = page.locator('#graph-svg .edge-group').first();
  await expect(relation).toHaveAttribute('aria-label', /Alice - Follows - The White Rabbit/);
  await expect(relation.locator('.edge-label')).toHaveText('Follows');
  await expect(relation.locator('.edge')).toHaveAttribute('marker-end', 'url(#relation-arrow)');
  await relation.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toContainText('Alice - Follows - The White Rabbit');
});
