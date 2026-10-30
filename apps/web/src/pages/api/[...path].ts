import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

export const ALL: APIRoute = ({request}) => env.API.fetch(request);
