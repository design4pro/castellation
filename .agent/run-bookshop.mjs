import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const plan = JSON.parse(readFileSync(resolve(root, '.agent/bookshop-plan.json'), 'utf8'));
const recordPath = resolve(root, '.agent/bookshop-iterations.jsonl');
const review = resolve(root, 'apps/web/.impeccable/review/bookshop');
mkdirSync(review, { recursive: true });
const cssPath = resolve(root, 'apps/web/src/styles/bookshop.css');
const last = Number(process.argv[2] || 50);
const records = existsSync(recordPath) ? readFileSync(recordPath, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];

function run(command, args, log, env = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 16 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  writeFileSync(log, output);
  if (result.status !== 0) throw new Error(`${command} failed; inspect ${log}`);
  return output;
}

for (const step of plan.filter((step) => step.iteration > records.length && step.iteration <= last)) {
  const number = String(step.iteration).padStart(2, '0');
  const content = '/* The Bookshop. Each numbered composition is a separately deployed iteration. */\n' +
    plan.slice(0, step.iteration).map((item) => `\n/* ${item.iteration}. ${item.title} */\n@media screen {\n${item.css}\n}\n`).join('');
  writeFileSync(cssPath, content);
  console.log(`Building ${number}: ${step.title}`);
  let deployed;
  if (step.iteration === 1 && existsSync('/private/tmp/bookshop-deploy-01.log')) {
    deployed = readFileSync('/private/tmp/bookshop-deploy-01.log', 'utf8');
  } else {
    run('npm', ['run', 'build:web'], `/private/tmp/bookshop-build-${number}.log`, { CASTELLATION_WRANGLER_CONFIG: 'wrangler.dev.jsonc' });
    deployed = run(resolve(root, 'node_modules/.bin/wrangler'), ['deploy', '--config', 'apps/web/dist/server/wrangler.json', '--message', `Bookshop ${number}: ${step.title}`], `/private/tmp/bookshop-deploy-${number}.log`);
  }
  const version = deployed.match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1];
  if (!version) throw new Error(`Missing successful deployment version for ${number}`);
  const browserScript = `
    const task = await taskSpace(7);
    const page = task.page("p1");
    const checks = [];
    for (const width of [1440, 390]) {
      await page.cdp("Emulation.setDeviceMetricsOverride", { width, height:900, deviceScaleFactor:1, mobile:width<760 });
      await page.goto(${JSON.stringify('https://castellation-web-dev.design4pro.workers.dev' + step.route + '?lang=en&bookshop=' + step.iteration)});
      await page.waitForSelector(${JSON.stringify(step.selector)}, {state:"visible"});
      await page.evaluate(async () => { await document.fonts.ready; });
      const check = await page.evaluate((selector) => {
        document.documentElement.style.scrollBehavior="auto";
        const target=document.querySelector(selector);
        target.scrollIntoView({block:"center",behavior:"instant"});
        const rect=target.getBoundingClientRect();
        return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,targetWidth:rect.width,targetHeight:rect.height,display:getComputedStyle(target).display,heading:document.querySelector("h1")?.textContent,brokenImages:[...target.querySelectorAll("img")].filter(img=>img.complete && !img.naturalWidth).length};
      }, ${JSON.stringify(step.selector)});
      if (check.documentWidth > check.width + 1 || check.targetWidth < 20 || check.targetHeight < 20 || check.brokenImages) throw new Error("Viewport check failed: "+JSON.stringify(check));
      const screenshot=${JSON.stringify(review + '/' + number + '-')}+width+".png";
      await page.screenshot({path:screenshot});
      checks.push({...check,screenshot});
    }
    console.log(JSON.stringify({checks}));
  `;
  const browserOutput = run('ego-browser', ['nodejs', '-e', browserScript], `/private/tmp/bookshop-browser-${number}.log`);
  const line = browserOutput.split('\n').find((line) => line.startsWith('{"checks":'));
  if (!line) throw new Error(`Missing browser evidence for ${number}`);
  const record = { ...step, css: undefined, version, checkedAt: new Date().toISOString(), ...JSON.parse(line) };
  appendFileSync(recordPath, JSON.stringify(record) + '\n');
  console.log(`DEPLOYED ${number} ${version}; desktop and mobile passed`);
}

console.log(`Completed through ${last}`);
