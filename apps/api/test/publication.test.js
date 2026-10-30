import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { publishBook } from '../src/publication.js';
import { d1Repository } from '../src/repository.js';
import { handleRequest } from '../src/api.js';

function database() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['0001_catalog.sql','0002_sources.sql','0003_evidence.sql','0004_withdrawn.sql']) db.exec(readFileSync(new URL(`../migrations/${f}`,import.meta.url),'utf8'));
  db.exec("INSERT INTO sources (id,title,author,url,rights_verified) VALUES ('gutenberg-11','Alice','Carroll','https://www.gutenberg.org/files/11/11-0.txt',1)");
  return { db, adapter: { prepare(sql) { return { bind(...params) { return { sql,params, async run(){return db.prepare(sql).run(...params)}, async all(){return {results:db.prepare(sql).all(...params)}}, async first(){return db.prepare(sql).get(...params) ?? null} }; } }; }, async batch(statements) { db.exec('BEGIN'); try { for (const stmt of statements) db.prepare(stmt.sql).run(...stmt.params); db.exec('COMMIT'); } catch (error) { db.exec('ROLLBACK'); throw error; } } } };
}
const chapters=[{number:1,title:'First',analysis:{characters:[{name:'Alice',description:'A curious girl',appearance:'dark hair',evidence:'Alice appeared.'}],relations:[],events:[{title:'Arrival',description:'Alice appeared.',evidence:'Alice appeared.'}]}},{number:2,title:'Second',analysis:{characters:[{name:'Alice',description:'A brave girl',appearance:'dark hair',evidence:'Alice returned.'}],relations:[],events:[]}}];

test('publishes validated chapters once, retaining evidence and spoiler boundaries', async () => {
  const {db,adapter}=database();
  const source={id:'gutenberg-11',title:'Alice',author:'Carroll'};
  await publishBook(adapter,source,chapters,[]);
  await publishBook(adapter,source,chapters,[]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM characters').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM descriptions').get().n,2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM content_evidence').get().n,3);
  const response=await handleRequest(new Request('https://example.com/api/books/gutenberg-11'),d1Repository(adapter));
  const result=await response.json();
  assert.equal(result.story.characters[0].descriptions.length,1);
  assert.equal(JSON.stringify(result).includes('brave'),false);
});

test('does not modify an already published book during a subsequent import', async () => {
  const {db,adapter}=database();
  const source={id:'gutenberg-11',title:'Alice',author:'Carroll'};
  await publishBook(adapter,source,chapters,[]);
  db.exec("UPDATE descriptions SET text = 'Editor correction' WHERE chapter = 1");
  await publishBook(adapter,source,chapters,[]);
  assert.equal(db.prepare('SELECT text FROM descriptions WHERE chapter = 1').get().text,'Editor correction');
});

test('portrait limit rolls the whole publication back', async () => {
  const {db,adapter}=database();
  const {characterId}=await import('../src/publication.js');
  const id=await characterId('gutenberg-11','Alice');
  const portraits=Array.from({length:11},(_,i)=>({id:`${id}-${i+1}`,characterId:id,chapter:1,evidence:'Alice appeared.'}));
  await assert.rejects(()=>publishBook(adapter,{id:'gutenberg-11',title:'Alice',author:'Carroll'},chapters,portraits),/portrait limit/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM books').get().n,0);
});

test('will not publish an unverified source', async () => {
  const {db,adapter}=database(); db.exec('UPDATE sources SET rights_verified = 0');
  await assert.rejects(()=>publishBook(adapter,{id:'gutenberg-11',title:'Alice',author:'Carroll'},chapters,[]),/rights/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM books').get().n,0);
});

test('import never republishes a book withdrawn by an editor', async () => {
  const {db,adapter}=database();
  const source={id:'gutenberg-11',title:'Alice',author:'Carroll'};
  await publishBook(adapter,source,chapters,[]);
  db.exec('UPDATE books SET published = 0, withdrawn = 1');
  const result = await publishBook(adapter,source,chapters,[]);
  assert.equal(result.reason,'withdrawn');
  assert.equal(db.prepare('SELECT published FROM books').get().published,0);
});
