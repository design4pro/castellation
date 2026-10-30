import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { runBookWorkflow } from '../src/run-workflow.js';

function environment() {
  const db=new DatabaseSync(':memory:');
  for (const name of ['0001_catalog.sql','0002_sources.sql','0003_evidence.sql','0004_withdrawn.sql']) db.exec(readFileSync(new URL(`../migrations/${name}`,import.meta.url),'utf8'));
  db.exec("INSERT INTO sources (id,title,author,url,rights_verified) VALUES ('gutenberg-11','Alice','Carroll','https://www.gutenberg.org/files/11/11-0.txt',1)");
  const d1={prepare(sql){return {bind(...params){return {sql,params,async run(){return db.prepare(sql).run(...params)},async first(){return db.prepare(sql).get(...params) ?? null}}}}},async batch(stmts){db.exec('BEGIN');try{for(const s of stmts)db.prepare(s.sql).run(...s.params);db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');throw error}}};
  const objects=new Map();
  const media={async put(key,value){objects.set(key,value)},async head(key){return objects.has(key)?{}:null},async get(key){if(!objects.has(key))return null;const value=objects.get(key);return {async text(){return value},async json(){return JSON.parse(value)}}}};
  const ai={async run(model){if(model.includes('flux'))return {image:btoa('image')};return {response:JSON.stringify({characters:[{name:'Alice',description:'Alice arrives',appearance:'dark hair',evidence:'Alice appeared.'}],relations:[],events:[]})}}};
  return {db,env:{DB:d1,MEDIA:media,AI:ai},objects};
}
const step={async do(_name,fn){return fn()}};

test('verified source is analyzed, illustrated and published atomically', async () => {
  const {db,env,objects}=environment();
  const result=await runBookWorkflow(env,'gutenberg-11',step,async()=>new Response('CHAPTER I. Start\nAlice appeared.'));
  assert.equal(result.chapters,1);
  assert.equal(result.portraits,1);
  assert.equal(db.prepare('SELECT published FROM books').get().published,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM portraits').get().n,1);
  assert.equal(db.prepare('SELECT status FROM sources').get().status,'processed');
  assert.ok([...objects.keys()].some((key)=>key.startsWith('portraits/')));
});

test('unsupported model evidence fails without publishing a book', async () => {
  const {db,env}=environment();
  await assert.rejects(()=>runBookWorkflow(env,'gutenberg-11',step,async()=>new Response('CHAPTER I. Start\nNo matching quote.')),/evidence/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM books').get().n,0);
  assert.equal(db.prepare('SELECT status FROM sources').get().status,'failed');
});

test('a failed portrait generation does not publish partial content', async () => {
  const {db,env}=environment();
  const original=env.AI.run;
  env.AI.run=async (model,...args)=>{if(model.includes('flux'))throw new Error('Image generation failed');return original(model,...args)};
  await assert.rejects(()=>runBookWorkflow(env,'gutenberg-11',step,async()=>new Response('CHAPTER I. Start\nAlice appeared.')),/Image generation failed/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM books').get().n,0);
  assert.equal(db.prepare('SELECT status FROM sources').get().status,'failed');
});
