import { test, expect } from '@playwright/test';

test('reader opens a book, explores its graph and visits a character', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Alice's Adventures in Wonderland/ }).click();
  await expect(page.getByRole('heading', { name: "Alice's Adventures in Wonderland" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Alice', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('#graph-svg > g')).toHaveAttribute('transform', /scale\(1.25\)/);
  await page.getByRole('combobox', { name: 'Read up to' }).selectOption('1:2');
  await expect(page.getByRole('combobox', { name: 'Read up to' })).toHaveValue('1:2');
  await page.getByRole('link', { name: 'Alice', exact: true }).click();
  await expect(page).toHaveTitle('Alice - Castellation');
  await expect(page.getByRole('heading', { name:'Alice', exact:true })).toBeVisible();
});

test('graph and chapter selector fit on a narrow touch viewport', async ({ browser }) => {
  const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const page = await context.newPage();
  await page.goto('/books/alices-adventures-in-wonderland');
  await expect(page.getByRole('link', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Read up to' })).toBeVisible();
  await expect(page.getByRole('button', { name:'Alice', exact:true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test('later character page follows the selected chapter and is not indexed', async ({page}) => {
  await page.goto('/books/alices-adventures-in-wonderland');
  await page.getByRole('combobox',{name:'Read up to'}).selectOption('1:2');
  await page.getByRole('link',{name:'The Mouse',exact:true}).click();
  await expect(page.getByRole('heading',{name:'The Mouse',exact:true})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');
});

test('account synchronizes reading position across browser sessions', async ({ browser }) => {
  const first=await browser.newContext();const page=await first.newPage();
  const email=`reader-${Date.now()}@example.test`;
  await page.goto('/account');
  await page.getByLabel('Name').fill('Reader');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel(/Password/).fill('a-secure-password-123');
  await page.getByRole('button',{name:'Create account'}).click();
  await expect(page.getByRole('status')).toContainText('verify your address');
  const outbox=await (await page.request.get('http://localhost:8787/__dev/outbox')).json();
  const emailMessage=outbox.find((item)=>item.to===email);
  const verifyLink=emailMessage.text.match(/https?:\/\/\S+/)[0];
  await page.goto(verifyLink);
  await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('a-secure-password-123');await page.getByRole('button',{name:'Sign in'}).click();
  await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();
  await page.goto('/books/alices-adventures-in-wonderland');
  await page.getByRole('combobox',{name:'Read up to'}).selectOption('1:2');
  await expect(page.getByRole('link',{name:'The Mouse',exact:true})).toBeVisible();
  await expect.poll(async()=>{const response=await page.request.get('http://localhost:8787/api/progress/alices-adventures-in-wonderland');return (await response.json()).progress?.chapter}).toBe(2);
  const second=await browser.newContext();const other=await second.newPage();
  await other.goto('/account');await other.getByLabel('E-mail').fill(email);await other.getByLabel(/Password/).fill('a-secure-password-123');await other.getByRole('button',{name:'Sign in'}).click();
  await expect(other.getByRole('button',{name:'Sign out'})).toBeVisible();
  await other.goto('/books/alices-adventures-in-wonderland');
  await expect(other.getByRole('combobox',{name:'Read up to'})).toHaveValue('1:2');
  await first.close();await second.close();
});

test('reader resets a password using a one-time email link', async ({page}) => {
  const email=`reset-${Date.now()}@example.test`;
  await page.goto('/account');await page.getByLabel('Name').fill('Reader');await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('a-secure-password-123');await page.getByRole('button',{name:'Create account'}).click();
  await expect(page.getByRole('status')).toContainText('verify your address');
  let messages=await (await page.request.get('http://localhost:8787/__dev/outbox')).json();
  await page.goto(messages.find((item)=>item.to===email).text.match(/https?:\/\/\S+/)[0]);
  await page.getByLabel('E-mail').fill(email);await page.getByRole('button',{name:'Forgot password'}).click();
  await expect(page.getByRole('status')).toContainText('If the account exists');
  messages=await (await page.request.get('http://localhost:8787/__dev/outbox')).json();
  const reset=messages.find((item)=>item.to===email && item.subject.includes('Reset'));
  await page.goto(reset.text.match(/https?:\/\/\S+/)[0]);
  await page.getByLabel(/New password/).fill('another-secure-password-456');await page.getByRole('button',{name:'Save password'}).click();
  await expect(page.getByRole('status')).toContainText('Password changed');
  await expect(page).not.toHaveURL(/token=/);
  await page.getByRole('link',{name:'Back to sign in'}).click();
  await page.getByLabel('E-mail').fill(email);await page.getByLabel(/Password/).fill('another-secure-password-456');await page.getByRole('button',{name:'Sign in'}).click();
  await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();
});
