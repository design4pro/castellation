import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const state=process.env.CASTELLATION_TEST_STATE;
if (!state) throw new Error('Missing isolated test state directory');
const migrations=['0001_catalog.sql','0002_sources.sql','0003_evidence.sql','0004_withdrawn.sql','0005_accounts.sql','0006_revoke_unverified_sessions.sql','0007_reader_administration.sql','0008_delete_reader_tokens.sql'];
const sql=migrations.map((name)=>readFileSync(new URL(`../../apps/api/migrations/${name}`,import.meta.url),'utf8')).join('\n') + '\n' + Array.from({length:26},(_,i)=>`INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES ('seed-${i}','Seed ${i}','seed${i}@example.test',1,${i},${i});`).join('\n') + '\nCREATE TABLE test_outbox (recipient TEXT NOT NULL, body TEXT NOT NULL);';
const file=join(state,'schema.sql');
writeFileSync(file,sql);
const result=spawnSync('npx',['wrangler','d1','execute','CATALOG_DB','--local','--config','apps/web/wrangler.jsonc','--persist-to',state,'--file',file],{stdio:'inherit'});
if (result.status!==0) process.exit(result.status ?? 1);
