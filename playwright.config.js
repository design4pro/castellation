import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.CASTELLATION_TEST_STATE = mkdtempSync(join(tmpdir(),'castellation-e2e-'));
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4325', browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : {} },
  webServer: [
    { command: 'DEV_TEST_OUTBOX=1 DEV_WEB_ORIGIN=http://localhost:4325 npm run dev:api', url: 'http://localhost:8787/api/books', reuseExistingServer: true, timeout: 30000 },
    { command: 'node tests/e2e/prepare-cms.js && PUBLIC_API_URL=http://localhost:8787 npm run dev -w @castellation/web -- --port 4325 --ignore-lock', url: 'http://localhost:4325/', reuseExistingServer: false, timeout: 60000 },
  ],
});
