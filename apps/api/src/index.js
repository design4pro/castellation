import { WorkerEntrypoint } from 'cloudflare:workers';
import { sendReaderInvitation } from './invitations.js';
import { handleRequest } from './api.js';
import { d1Repository } from './repository.js';
import { discoverBooks } from './discovery.js';
import { servePortrait } from './media.js';
import { privateRequest } from './private-routes.js';
export { BookWorkflow } from './workflow.js';
export class ReaderInvitations extends WorkerEntrypoint {
  async send(id) { await sendReaderInvitation(this.env,id); }
}

export default {
  async fetch(request, env, ctx) { const url = new URL(request.url); if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/progress/')) return privateRequest(request,env,ctx); const match = /^\/api\/media\/([a-z0-9-]+)$/.exec(new URL(request.url).pathname); if (request.method === 'GET' && match) return servePortrait(match[1], env.DB, env.MEDIA); return handleRequest(request, d1Repository(env.DB)); },
  async scheduled(_event, env, ctx) {
    try {
      const candidates = await discoverBooks();
      for (const item of candidates) await env.DB.prepare('INSERT OR IGNORE INTO sources (id, title, author, url) VALUES (?, ?, ?, ?)').bind(item.id, item.title, item.author, item.url).run();
    } catch (error) { console.error('Source discovery failed', error); }
    const { results } = await env.DB.prepare("SELECT id FROM sources WHERE rights_verified = 1 AND status = 'pending' LIMIT 10").all();
    for (const source of results) {
      const updated = await env.DB.prepare("UPDATE sources SET status = 'queued' WHERE id = ? AND status = 'pending'").bind(source.id).run();
      if (updated.meta.changes) ctx.waitUntil(env.BOOK_WORKFLOW.create({ id: `book-${source.id}-${crypto.randomUUID()}`, params: { sourceId: source.id } }).catch(async (error) => { await env.DB.prepare("UPDATE sources SET status = 'failed', last_error = ? WHERE id = ?").bind(String(error).slice(0, 500), source.id).run(); }));
    }
  },
};
