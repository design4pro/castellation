import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const records = readFileSync(resolve(root, '.agent/bookshop-iterations.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
if (records.length !== 50 || new Set(records.map(record => record.version)).size !== 50) {
  throw new Error('The 50 distinct deployments must be complete before final verification.');
}
const stylesheet = resolve(root, 'apps/web/src/styles/bookshop.css');
const fixes = readFileSync(resolve(root, '.agent/bookshop-pending-fixes.css'), 'utf8');
if (!readFileSync(stylesheet, 'utf8').includes('Material corrections from the first batched visual inspection')) {
  appendFileSync(stylesheet, '\n' + fixes);
}
function run(command, args, log, extraEnv = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, ...extraEnv }, maxBuffer: 16 * 1024 * 1024 });
  const output = (result.stdout || '') + (result.stderr || '');
  writeFileSync(log, output);
  if (result.status !== 0) throw new Error(`Failed ${command}; see ${log}`);
  return output;
}
console.log('Running the full Playwright suite with the final correction batch.');
run(resolve(root, 'node_modules/.bin/playwright'), ['test', '--workers=2'], '/private/tmp/bookshop-e2e-final.log');
console.log('Building the final development edition.');
run('npm', ['run', 'build:web'], '/private/tmp/bookshop-build-final.log', { CASTELLATION_WRANGLER_CONFIG: 'wrangler.dev.jsonc' });
console.log('Publishing the verified corrections to castellation-web-dev.');
const output = run(resolve(root, 'node_modules/.bin/wrangler'), ['deploy', '--config', 'apps/web/dist/server/wrangler.json', '--message', 'Bookshop: final accessibility and layout corrections after 50 distinct iterations'], '/private/tmp/bookshop-deploy-final.log');
const version = output.match(/Current Version ID:\s*([a-f0-9-]{36})/)?.[1];
if (!version) throw new Error('Final deployment did not return a version.');
writeFileSync(resolve(root, '.agent/bookshop-final-deployment.json'), JSON.stringify({ worker: 'castellation-web-dev', url: 'https://castellation-web-dev.design4pro.workers.dev/', distinctIterations: 50, version, checkedAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`Final correction deployment: ${version}`);
