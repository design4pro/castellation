import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import emdash from 'emdash/astro';
import { castellationPlugin } from '@castellation/cms-plugin';
import { d1, r2 } from '@emdash-cms/cloudflare';

export default defineConfig({
  output: 'server',
  devToolbar: { enabled: !process.env.CASTELLATION_TEST_STATE && process.env.CASTELLATION_QA !== '1' },
  vite: { plugins: [tailwindcss()] },
  adapter: cloudflare({...process.env.CASTELLATION_TEST_STATE ? {persistState:{path:process.env.CASTELLATION_TEST_STATE},auxiliaryWorkers:[{configPath:'../../tests/e2e/invitation-worker.wrangler.jsonc',devOnly:true}]} : {},...process.env.CASTELLATION_WRANGLER_CONFIG ? {configPath:process.env.CASTELLATION_WRANGLER_CONFIG} : {}}),
  integrations: [react(), emdash({ database: d1({ binding: 'CMS_DB' }), storage: r2({ binding: 'CMS_MEDIA' }), plugins: [castellationPlugin()] })],
});
