import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

export const onRequest = defineMiddleware(async (context, next) => {
  if (env.DEV_LOCK_CMS === '1' && (context.url.pathname === '/_emdash' || context.url.pathname.startsWith('/_emdash/'))) return new Response('Not found', {status:404});
  const response = await next();
  if (context.url.pathname === '/robots.txt' && response.ok) {
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(`${await response.text()}\nSitemap: ${context.url.origin}/catalog-sitemap.xml\n`, { status: response.status, headers });
  }
  return response;
});
