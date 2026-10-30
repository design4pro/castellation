import { definePlugin } from 'emdash';
import { sourceAdmin } from './source-admin.js';
import { catalogAdmin } from './catalog-admin.js';
import { usersAdmin } from './users-admin.js';

export function castellationPlugin() {
  return { id:'castellation-sources', version:'0.1.0', format:'native', entrypoint:'@castellation/cms-plugin' };
}

export function createPlugin() {
  return definePlugin({
    id:'castellation-sources', version:'0.1.0',
    admin:{ pages:[{path:'/sources',label:'Book sources',icon:'book'},{path:'/catalog',label:'Book catalog',icon:'book'},{path:'/readers',label:'Reader accounts',icon:'users'}] },
    routes:{ admin:{ permission:'plugins:manage', handler:async (ctx) => {
      const { env } = await import('cloudflare:workers');
      const input = ctx.input;
      const catalogAction = ['withdraw','restore','edit-description','edit-relation','edit-event-description'].includes(input?.action_id) || (typeof input?.action_id === 'string' && ['save-description_','save-relation_','save-event-description_'].some((prefix) => input.action_id.startsWith(prefix)));
      if (input?.page === '/readers' || input?.action_id === 'revoke-reader-sessions' || (typeof input?.action_id === 'string' && input.action_id.startsWith('reader-'))) return usersAdmin(env.CATALOG_DB, input, env.READER_INVITATIONS);
      return input?.page === '/catalog' || catalogAction ? catalogAdmin(env.CATALOG_DB, input) : sourceAdmin(env.CATALOG_DB, input);
    } } },
  });
}
