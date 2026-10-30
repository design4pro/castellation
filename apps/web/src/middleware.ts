import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

export const onRequest = defineMiddleware((context, next) => {
  if (env.DEV_LOCK_CMS === '1' && (context.url.pathname === '/_emdash' || context.url.pathname.startsWith('/_emdash/'))) return new Response('Not found', {status:404});
  return next();
});
