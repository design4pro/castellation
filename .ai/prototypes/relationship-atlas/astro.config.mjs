import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [react()],
  adapter: cloudflare({ configPath: './wrangler.jsonc' }),
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4367 },
});
