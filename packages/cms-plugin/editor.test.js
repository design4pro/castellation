import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { validateBlockResponse } from '@emdash-cms/blocks/server';
import { catalogAdmin } from './catalog-admin.js';
import { d1Repository } from '../../apps/api/src/repository.js';
import { handleRequest } from '../../apps/api/src/api.js';

function setup() {
  const db=new DatabaseSync(':memory:');
  for(const name of ['0001_catalog.sql','0002_sources.sql','0003_evidence.sql','0004_withdrawn.sql']) db.exec(readFileSync(new URL(`../../apps/api/migrations/${name}`,import.meta.url),'utf8'));
  db.exec("INSERT INTO sources (id,title,author,url,rights_verified) VALUES ('gutenberg-11','Alice','Carroll','https://www.gutenberg.org/files/11/11-0.txt',1); INSERT INTO books (id,slug,title,author,published) VALUES ('gutenberg-11','alice','Alice','Carroll',1); INSERT INTO chapters VALUES ('gutenberg-11',1,1,'Start'); INSERT INTO characters VALUES ('c-alice','gutenberg-11','alice','Alice',1,1); INSERT INTO descriptions VALUES ('d-alice','c-alice',1,1,'A curious girl');");
  return {db,adapter:{prepare(sql){return {bind(...args){return {async all(){return {results:db.prepare(sql).all(...args)}},async first(){return db.prepare(sql).get(...args) ?? null},async run(){return db.prepare(sql).run(...args)}}},async all(){return {results:db.prepare(sql).all()}}}}}};
}

test('editor updates a chapter-specific description in the public API', async () => {
  const {adapter}=setup();
  const form=await catalogAdmin(adapter,{type:'block_action',action_id:'edit-description',value:'d-alice'});
  const block=form.blocks.find((item)=>item.type==='form');
  assert.equal(validateBlockResponse(form,{}).valid,true);
  const result=await catalogAdmin(adapter,{type:'form_submit',action_id:block.submit.action_id,values:{description:'A thoughtful girl'}});
  assert.equal(result.toast.type,'success');
  const response=await handleRequest(new Request('https://example.com/api/books/alice'),d1Repository(adapter));
  assert.equal((await response.json()).story.characters[0].descriptions[0].text,'A thoughtful girl');
});

test('stale edits do not overwrite a newer editor correction', async () => {
  const {db,adapter}=setup();
  const form=await catalogAdmin(adapter,{type:'block_action',action_id:'edit-description',value:'d-alice'});
  const action=form.blocks.find((item)=>item.type==='form').submit.action_id;
  db.exec("UPDATE descriptions SET text = 'Newer correction' WHERE id = 'd-alice'");
  const result=await catalogAdmin(adapter,{type:'form_submit',action_id:action,values:{description:'Stale edit'}});
  assert.equal(result.toast.type,'error');
  assert.equal(db.prepare("SELECT text FROM descriptions WHERE id = 'd-alice'").get().text,'Newer correction');
});

test('withdrawn book disappears from public API and can be restored when rights are verified', async () => {
  const {adapter}=setup();
  await catalogAdmin(adapter,{type:'block_action',action_id:'withdraw',value:'gutenberg-11'});
  const list=await handleRequest(new Request('https://example.com/api/books'),d1Repository(adapter));
  assert.deepEqual((await list.json()).books,[]);
  await catalogAdmin(adapter,{type:'block_action',action_id:'restore',value:'gutenberg-11'});
  const detail=await handleRequest(new Request('https://example.com/api/books/alice'),d1Repository(adapter));
  assert.equal(detail.status,200);
});

test('cannot restore a book after its source rights are revoked', async () => {
  const {db,adapter}=setup();
  await catalogAdmin(adapter,{type:'block_action',action_id:'withdraw',value:'gutenberg-11'});
  db.exec('UPDATE sources SET rights_verified = 0');
  await catalogAdmin(adapter,{type:'block_action',action_id:'restore',value:'gutenberg-11'});
  assert.equal(db.prepare('SELECT published FROM books').get().published,0);
});

test('catalog editor is registered as a private administrative plugin page', async () => {
  const {createPlugin}=await import('./index.js');
  const plugin=createPlugin();
  assert.equal(plugin.routes.admin.permission,'plugins:manage');
  assert.ok(plugin.admin.pages.some((page)=>page.path==='/catalog'));
});

test('editor sees the source excerpt that supports a generated description', async () => {
  const {db,adapter}=setup();
  db.exec("INSERT INTO content_evidence VALUES ('description','d-alice','gutenberg-11',1,1,'Alice appeared.')");
  const page=await catalogAdmin(adapter,{type:'page_load',page:'/catalog'});
  const table=page.blocks.find((block)=>block.type==='table' && block.columns.some((column)=>column.key==='evidence'));
  assert.equal(table.rows[0].evidence,'Alice appeared.');
});

test('editor can correct an event and a relationship without changing their reveal chapter', async () => {
  const {db,adapter}=setup();
  db.exec("INSERT INTO characters VALUES ('c-rabbit','gutenberg-11','rabbit','Rabbit',1,1); INSERT INTO relations VALUES ('r-one','gutenberg-11','c-alice','c-rabbit',1,1,'Knows'); INSERT INTO events VALUES ('e-one','gutenberg-11',1,1,'Arrival','Original');");
  for (const [action,id,value] of [['edit-relation','r-one','Follows'],['edit-event-description','e-one','Corrected event']]) {
    const form=await catalogAdmin(adapter,{type:'block_action',action_id:action,value:id});
    assert.equal(validateBlockResponse(form,{}).valid,true);
    const submit=form.blocks.find((block)=>block.type==='form').submit.action_id;
    const result=await catalogAdmin(adapter,{type:'form_submit',action_id:submit,values:{text:value}});
    assert.equal(result.toast.type,'success');
  }
  assert.deepEqual({...db.prepare('SELECT label, chapter FROM relations').get()},{label:'Follows',chapter:1});
  assert.deepEqual({...db.prepare('SELECT description, chapter FROM events').get()},{description:'Corrected event',chapter:1});
});

test('reader administration lists users without credentials and revokes only the selected user sessions', async()=>{
  const {db,adapter}=setup();
  db.exec(readFileSync(new URL('../../apps/api/migrations/0005_accounts.sql',import.meta.url),'utf8'));
  db.exec(readFileSync(new URL('../../apps/api/migrations/0007_reader_administration.sql',import.meta.url),'utf8'));
  db.exec("INSERT INTO user (id,name,email,emailVerified,image,createdAt,updatedAt) VALUES ('u1','Reader','reader@example.test',1,NULL,1,1),('u2','Other','other@example.test',1,NULL,1,1); INSERT INTO session (id,expiresAt,token,createdAt,updatedAt,ipAddress,userAgent,userId) VALUES ('s1',999999,'secret1',1,1,NULL,NULL,'u1'),('s2',999999,'secret2',1,1,NULL,NULL,'u2');");
  const {usersAdmin}=await import('./users-admin.js');
  const page=await usersAdmin(adapter,{type:'page_load'});
  assert.equal(validateBlockResponse(page,{}).valid,true);
  assert.equal(JSON.stringify(page).includes('secret'),false);
  await usersAdmin(adapter,{type:'block_action',action_id:'revoke-reader-sessions',value:'u1'});
  assert.deepEqual(db.prepare('SELECT userId FROM session').all().map((row)=>row.userId),['u2']);
});

test('reader search and pagination return bounded, validated pages',async()=>{
  const {db,adapter}=setup();
  for(const name of ['0005_accounts.sql','0007_reader_administration.sql']) db.exec(readFileSync(new URL(`../../apps/api/migrations/${name}`,import.meta.url),'utf8'));
  const insert=db.prepare('INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,?,?)');
  for(let i=0;i<30;i++) insert.run(`u${i}`,`Reader ${i}`,`reader${i}@example.test`,i,i);
  const {usersAdmin}=await import('./users-admin.js');
  const page=await usersAdmin(adapter,{type:'page_load'});
  assert.equal(validateBlockResponse(page,{}).valid,true);
  assert.equal(page.blocks.find((block)=>block.type==='table').rows.length,25);
  const next=page.blocks.flatMap((block)=>block.type==='actions'?block.elements:[]).find((element)=>element.action_id==='reader-page');
  const second=await usersAdmin(adapter,{type:'block_action',action_id:next.action_id,value:next.value});
  assert.equal(validateBlockResponse(second,{}).valid,true);
  assert.equal(second.blocks.find((block)=>block.type==='table').rows.length,5);
  const search=await usersAdmin(adapter,{type:'form_submit',action_id:'reader-search',values:{search:'reader12@'}});
  assert.equal(search.blocks.find((block)=>block.type==='table').rows.length,1);
  const wildcard=await usersAdmin(adapter,{type:'form_submit',action_id:'reader-search',values:{search:'%'}});
  assert.equal(wildcard.blocks.find((block)=>block.type==='table').rows.length,0);
});

test('reader edits reject invalid and duplicate emails',async()=>{
  const {db,adapter}=setup();
  for(const name of ['0005_accounts.sql','0007_reader_administration.sql']) db.exec(readFileSync(new URL(`../../apps/api/migrations/${name}`,import.meta.url),'utf8'));
  db.exec("INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES ('u1','One','one@example.test',1,1,1),('u2','Two','two@example.test',1,1,1)");
  const {usersAdmin}=await import('./users-admin.js');
  const form=await usersAdmin(adapter,{type:'block_action',action_id:'reader-edit',value:'u1'});
  assert.equal(validateBlockResponse(form,{}).valid,true);
  for(const email of ['bad','two@example.test']) {
    const result=await usersAdmin(adapter,{type:'form_submit',action_id:'reader-save_u1',values:{name:'One',email}});
    assert.equal(result.toast.type,'error');
  }
  assert.equal(db.prepare("SELECT email FROM user WHERE id = 'u1'").get().email,'one@example.test');
});
