import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, arch } from 'node:os';
import { mockAtlas } from './atlas-fixture.js';

const artifacts = '.ai/qa/artifacts_relationship-graph';
const mapUrl = '/books/alices-adventures-in-wonderland/map?lang=en&volume=1&chapter=2';

for (const width of [320, 390, 768, 1440]) {
  for (const lang of ['en', 'pl']) {
    test(`catalog and six-person fixture reflow at ${width}px in ${lang}`, async ({ page }) => {
      await mkdir(artifacts, { recursive: true });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(mapUrl.replace('lang=en', `lang=${lang}`));
      await expect(page.locator('#story-app')).toHaveAttribute('data-state', 'ready');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${artifacts}/catalog-${width}-${lang}.png`, fullPage: true, style: 'astro-dev-toolbar { display: none; }' });
      await mockAtlas(page);
      await page.goto(`${mapUrl.replace('lang=en', `lang=${lang}`)}&character=alice`);
      await expect(page.locator('.graph-node')).toHaveCount(6);
      await expect(page.locator('.map-page-intro')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator('.map-stage .graph')).toHaveCSS('background-color', 'rgb(252, 250, 245)');
      await expect(page.locator('#map-detail-name')).toHaveText('Alice');
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const graph = await page.locator('#graph').boundingBox(), inspector = await page.locator('#map-detail').boundingBox();
      if (width === 1440) expect(inspector.x).toBeGreaterThan(graph.x + graph.width - 1);
      else expect(inspector.y).toBeGreaterThan(graph.y);
      await page.screenshot({ path: `${artifacts}/fixture-${width}-${lang}.png`, fullPage: true, style: 'astro-dev-toolbar { display: none; }' });
    });
  }
}

test('dense map preserves portrait size, keyboard reveal, self and parallel edges', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAtlas(page, { count: 100, relationCount: 200 });
  await page.goto(mapUrl);
  await expect(page.locator('.graph-node')).toHaveCount(100);
  await expect(page.locator('.edge-group')).toHaveCount(200);
  const first = page.locator('.graph-node').first(), last = page.locator('.graph-node').last();
  expect((await first.locator('circle').first().boundingBox()).width).toBeGreaterThan(90);
  await last.focus();
  await expect(last).toBeInViewport();
  await page.keyboard.press('Space');
  await expect(page.locator('#map-detail-name')).toHaveText('Character 100');
  await expect(page.locator('#map-detail-name')).toBeFocused();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(last).toBeFocused();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await first.focus();
  await expect(first).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('empty cast, no relations, long names and blocked storage remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Blocked'); }; });
  await mockAtlas(page, { count: 0, relationCount: 0 });
  await page.goto(mapUrl);
  await expect(page.locator('#status')).toHaveText('No characters are visible at this point.');
  await expect(page.locator('#map-connections-list')).toHaveText('No connections are visible at this point.');
  await page.locator('#progress').selectOption('1:1');
  await expect(page.locator('#progress-memory-text')).toHaveText('Unable to save progress in this browser.');
  await mockAtlas(page, { count: 1, relationCount: 0, mutate: (story) => { story.characters[0].name = 'A very long character name that must remain readable in the inspector and textual list'; story.characters[0].descriptions = []; } });
  await page.goto(mapUrl);
  await page.locator('.graph-node').click();
  await expect(page.locator('#map-detail-name')).toContainText('textual list');
  await expect(page.locator('#map-detail-description')).toBeEmpty();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('five warm dense paints and inspector activations meet engineering budgets', async ({ page, browser }) => {
  await mkdir(artifacts, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockAtlas(page, { count: 100, relationCount: 200 });
  await page.addInitScript(() => {
    const fetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await fetch(...args);
      if (String(args[0]).includes('/api/books/')) {
        const json = response.json.bind(response);
        response.json = async () => { const data = await json(); window.atlasPayloadAccepted = performance.now(); return data; };
      }
      return response;
    };
    window.atlasPaints = [];
    new MutationObserver(() => {
      if (document.querySelector('#story-app')?.dataset.state === 'ready' && window.atlasPayloadAccepted) {
        const accepted = window.atlasPayloadAccepted; window.atlasPayloadAccepted = null;
        requestAnimationFrame(() => requestAnimationFrame(() => window.atlasPaints.push(performance.now() - accepted)));
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
  });
  await page.goto(mapUrl);
  await expect.poll(() => page.evaluate(() => window.atlasPaints.length)).toBe(1);
  const paints = [], activations = [];
  for (let index = 0; index < 5; index++) {
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.atlasPaints.length)).toBe(1);
    paints.push(await page.evaluate(() => window.atlasPaints[0]));
    activations.push(await page.locator('.graph-node').first().evaluate((node) => new Promise((resolve) => {
      const started = performance.now(); node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - started)));
    })));
    await expect(page.locator('#map-detail-name')).toHaveText('Alice');
  }
  const median = (values) => [...values].sort((a, b) => a - b)[2];
  const evidence = { browser: browser.version(), platform: platform(), arch: arch(), cpu: cpus()[0].model, viewport: '1440x1000', fixture: '100 characters / 200 relations, 20 missing portraits', payloadToPaintMs: paints, activationToPaintMs: activations, medianPaintMs: median(paints), medianActivationMs: median(activations), imageLoading: await page.evaluate(() => performance.getEntriesByType('resource').filter((item) => item.initiatorType === 'img' || item.name.includes('alice-rabbit-hole')).map((item) => ({ url: new URL(item.name).pathname, durationMs: item.duration, transferBytes: item.transferSize, decodedBytes: item.decodedBodySize }))) };
  await writeFile(`${artifacts}/performance.json`, JSON.stringify(evidence, null, 2));
  expect(evidence.medianPaintMs).toBeLessThanOrEqual(250);
  expect(evidence.medianActivationMs).toBeLessThanOrEqual(100);
});

test('map text contrast and reduced motion meet the focused accessibility checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${mapUrl}&character=alice`);
  await expect(page.locator('#map-detail-name')).toHaveText('Alice');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const colors = await page.locator('#character-list p, #event-list small, #event-list p, .graph-hint, #map-detail-description, .map-detail-link').evaluateAll((elements) => elements.map((element) => {
    let parent = element;
    while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement;
    return { text: element.textContent, color: getComputedStyle(element).color, background: getComputedStyle(parent).backgroundColor };
  }));
  const luminance = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => value / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  for (const { text, color, background } of colors) {
    const foreground = luminance(color), backdrop = luminance(background);
    expect((Math.max(foreground, backdrop) + .05) / (Math.min(foreground, backdrop) + .05), text).toBeGreaterThanOrEqual(4.5);
  }
});

test('pan, pinch, zoom and reset remain available on the portrait map', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockAtlas(page);
  await page.goto(mapUrl);
  await expect(page.locator('.graph-node')).toHaveCount(6);
  await page.locator('#graph-svg').scrollIntoViewIfNeeded();
  const bounds = await page.locator('#graph-svg').boundingBox();
  const x = bounds.x + 40, y = bounds.y + 150;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 50, y + 20); await page.mouse.up();
  await expect(page.locator('#graph-svg > g')).toHaveAttribute('transform', /translate\(50 20\)/);
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click();
  await expect(page.locator('#graph-svg > g')).toHaveAttribute('transform', 'translate(0 0) scale(1)');
  await page.locator('#graph-svg').scrollIntoViewIfNeeded();
  const touchBounds = await page.locator('#graph-svg').boundingBox();
  const cdp = await context.newCDPSession(page);
  const center = { x: touchBounds.x + 260, y: touchBounds.y + 180 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: center.x - 50, y: center.y, id: 1 }, { x: center.x + 50, y: center.y, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x - 70, y: center.y, id: 1 }, { x: center.x + 70, y: center.y, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x - 90, y: center.y, id: 1 }, { x: center.x + 90, y: center.y, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const transform = await page.locator('#graph-svg > g').getAttribute('transform');
  expect(Number(transform.match(/scale\(([^)]+)\)/)[1])).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Reset zoom', exact: true }).click();
  await expect(page.locator('#graph-svg > g')).toHaveAttribute('transform', 'translate(0 0) scale(1)');
});
