import { mkdir, readFile, writeFile, stat, rm, open } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '../..');
process.chdir(root);
const qa = '.ai/qa';
const descriptorPath = `${qa}/test-env.json`;
const cachePath = `${qa}/test-env-build-cache.json`;
const lockPath = `${qa}/test-env.lock`;
const artifacts = `${qa}/artifacts_relationship-graph`;
const ttl = Number(process.env.TEST_ENV_CACHE_TTL_SECONDS || 600);
const alive = (pid) => { if (!Number.isSafeInteger(pid) || pid <= 1) return false; try { process.kill(pid, 0); return true; } catch { return false; } };
const readJson = async (path) => { try { return JSON.parse(await readFile(path, 'utf8')); } catch { return null; } };
const writeJson = (path, value) => writeFile(path, JSON.stringify(value, null, 2));
async function healthy(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}
async function stop(descriptor) {
  if (!descriptor?.startedByThisRepo || descriptor.projectRoot !== root) return;
  for (const pid of [descriptor.app.pid, ...descriptor.services.map((service) => service.pid)]) {
    if (alive(pid) && execFileSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' }).includes(root)) { try { process.kill(-pid, 'SIGTERM'); } catch { /* The process may already have exited. */ } }
  }
  await writeJson(descriptorPath, { ...descriptor, status: 'stopped' });
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function fingerprint() {
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean).sort();
  const hash = createHash('sha256');
  for (const path of paths) {
    const info = await stat(path); hash.update(`${path}:${info.size}:${info.mtimeMs}\n`);
  }
  return hash.digest('hex');
}
async function launch(args, cwd, env, name) {
  const log = await open(`${artifacts}/${name}.log`, 'a');
  const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', log.fd, log.fd] });
  await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
  child.unref(); await log.close(); return child.pid;
}
function report(descriptor, reused) {
  console.log(`TEST_ENV_STATUS=running\nTEST_ENV_BASE_URL=${descriptor.baseUrl}\nTEST_ENV_DESCRIPTOR=${descriptorPath}\nTEST_ENV_REUSED=${reused}\nBROWSER_PROVIDER=playwright\nBROWSER_INSTALLED=1`);
}
await mkdir(qa, { recursive: true });
await mkdir(artifacts, { recursive: true });
let ownsLock = false;
for (let attempt = 0; attempt < 120; attempt++) {
  try {
    await mkdir(lockPath); ownsLock = true;
    await writeJson(`${lockPath}/owner.json`, { pid: process.pid, source: root, acquiredAt: new Date().toISOString() });
    break;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = await readJson(`${lockPath}/owner.json`);
    if (owner && !alive(owner.pid)) await rm(lockPath, { recursive: true });
    else await delay(500);
  }
}
if (!ownsLock) throw new Error('Timed out waiting for environment bootstrap lock');
let descriptor;
try {
  descriptor = await readJson(descriptorPath);
  if (process.argv[2] === 'down') { await stop(descriptor); console.log('TEST_ENV_STATUS=stopped'); }
  else {
    const sourceFingerprint = await fingerprint();
    const canReuse = !process.argv.includes('--force') && !process.argv.includes('--force-rebuild') && descriptor?.status === 'running' && descriptor.projectRoot === root && descriptor.sourceFingerprint === sourceFingerprint && Date.now() - Date.parse(descriptor.startedAt) < ttl * 1000 && alive(descriptor.app.pid) && descriptor.services.every((service) => alive(service.pid)) && await healthy(descriptor.baseUrl) && await healthy(`${descriptor.services[0].url}/api/books`);
    if (canReuse) report(descriptor, 1);
    else {
      await stop(descriptor);
      const lockHash = createHash('sha256').update(await readFile('package-lock.json')).digest('hex');
      const cached = await readJson(cachePath);
      let installed = false;
      try { installed = (await stat('node_modules/.package-lock.json')).isFile(); } catch { /* A cold checkout needs installation. */ }
      if (!installed || process.argv.includes('--force-rebuild') || (cached && cached.lockHash !== lockHash)) execFileSync('npm', ['ci'], { stdio: 'inherit' });
      const { chromium } = await import('@playwright/test');
      const browser = await chromium.launch();
      const page = await browser.newPage(); await page.goto('data:text/html,QA');
      const browserVersion = browser.version(); await browser.close();
      await writeJson(cachePath, { projectRoot: root, lockHash, sourceFingerprint, builtAt: new Date().toISOString(), artifactPaths: ['node_modules/.package-lock.json'], notes: 'Astro dev compiles source on demand; no production build is served.' });
      const apiPort = await freePort(), webPort = await freePort();
      const baseUrl = `http://127.0.0.1:${webPort}`, apiUrl = `http://localhost:${apiPort}`;
      descriptor = { version: 1, projectRoot: root, sourceFingerprint, runId: `graph-${Date.now()}`, status: 'starting', mode: 'dev', baseUrl, startedByThisRepo: true, startScript: '.ai/scripts/test-env-up.sh', stopScript: '.ai/scripts/test-env-down.sh', services: [], credentials: [], browser: { provider: 'playwright', installed: true, command: 'npx playwright', version: browserVersion, descriptor: '.ai/browsers/playwright.md' }, playwright: { runner: 'playwright', installed: true, config: 'playwright.config.js', browsers: ['chromium'] }, testRunner: { name: 'playwright', config: 'playwright.config.js' }, platform: process.platform, startedAt: new Date().toISOString(), notes: 'Disposable in-memory demo API. Guest public-map QA only; no authenticated credentials.' };
      const apiPid = await launch([resolve('apps/api/dev/server.js')], root, { DEV_PORT: String(apiPort), DEV_WEB_ORIGIN: baseUrl }, 'api');
      descriptor.services.push({ type: 'sqlite-memory-api', pid: apiPid, port: apiPort, url: apiUrl });
      descriptor.app = { pid: 0, port: webPort, healthPath: '/', startCommand: 'Astro dev with isolated API' };
      await writeJson(descriptorPath, descriptor);
      descriptor.app.pid = await launch([resolve('node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(webPort), '--ignore-lock'], resolve('apps/web'), { PUBLIC_API_URL: apiUrl, CASTELLATION_QA: '1' }, 'web');
      await writeJson(descriptorPath, descriptor);
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        if (await healthy(baseUrl) && await healthy(`${apiUrl}/api/books`)) { ready = true; break; }
        await delay(500);
      }
      if (!ready) throw new Error(`Environment did not become ready; inspect ${artifacts}/web.log`);
      descriptor.status = 'running'; await writeJson(descriptorPath, descriptor); report(descriptor, 0);
    }
  }
} catch (error) {
  if (descriptor?.status === 'starting') await stop(descriptor);
  throw error;
} finally { await rm(lockPath, { recursive: true }); }
