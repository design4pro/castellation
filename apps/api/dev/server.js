import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { handleRequest } from '../src/api.js';
import { privateRequest } from '../src/private-routes.js';
import { d1Repository } from '../src/repository.js';

const db = new DatabaseSync(':memory:');
for (const path of ['../migrations/0001_catalog.sql', '../migrations/0002_sources.sql', '../migrations/0003_evidence.sql', '../migrations/0004_withdrawn.sql', '../migrations/0005_accounts.sql', '../migrations/0006_revoke_unverified_sessions.sql', '../migrations/0007_reader_administration.sql', '../migrations/0008_delete_reader_tokens.sql', './seed.sql']) db.exec(readFileSync(new URL(path, import.meta.url), 'utf8'));
const d1 = {
  async exec(sql) { db.exec(sql); return {}; },
  async batch(statements) { return Promise.all(statements.map((statement) => statement.all())); },
  prepare(sql) { return { bind(...args) { return {
    async all() { const statement=db.prepare(sql); if(statement.columns().length) return {results:statement.all(...args),meta:{changes:0}}; const result=statement.run(...args); return {results:[],meta:{changes:result.changes,last_row_id:result.lastInsertRowid}}; },
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async run() { return {meta:{changes:db.prepare(sql).run(...args).changes}}; },
  }; } }; },
};
const repository = d1Repository(d1);
const messages=[];
const port = Number(process.env.DEV_PORT || 8787);
const env={DB:d1,EMAIL:{async send(message){messages.push(message)}},EMAIL_FROM:'dev@example.test',BETTER_AUTH_SECRET:'local-development-only-secret-1234567890',BETTER_AUTH_URL:process.env.DEV_AUTH_URL || `http://localhost:${port}`,WEB_ORIGIN:process.env.DEV_WEB_ORIGIN || 'http://localhost:4321'};
createServer(async (request, response) => {
  try {
    if (request.url === '/__dev/outbox' && process.env.DEV_TEST_OUTBOX === '1') { response.writeHead(200,{'content-type':'application/json','cache-control':'no-store'}); response.end(JSON.stringify(messages)); return; }
    const chunks=[]; for await (const chunk of request) chunks.push(chunk);
    const init={method:request.method,headers:request.headers};
    if(chunks.length)init.body=Buffer.concat(chunks);
    const url=`${env.BETTER_AUTH_URL}${request.url}`;
    const webRequest=new Request(url,init);
    const result=request.url.startsWith('/api/auth/')||request.url.startsWith('/api/progress/')?await privateRequest(webRequest,env):await handleRequest(webRequest,repository);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch(error) { console.error('Request failed',error.message); response.writeHead(500); response.end('Internal error'); }
}).listen(port, process.env.DEV_LISTEN_HOST || 'localhost', () => console.log(`Demo API listening on port ${port}`));
