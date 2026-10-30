import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { d1Repository } from '../src/repository.js';
import { handleRequest } from '../src/api.js';

function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_catalog.sql', import.meta.url), 'utf8'));
  db.exec("INSERT INTO books VALUES ('b','book','Book','Author',1); INSERT INTO chapters VALUES ('b',1,1,'Start'),('b',1,2,'After'); INSERT INTO characters VALUES ('c','b','c','Character',1,1); INSERT INTO descriptions VALUES ('d','c',1,1,'Safe'),('secret','c',1,2,'Spoiler');");
  const adapter = { prepare(sql) { return { bind(...args) { return { async all() { return { results: db.prepare(sql).all(...args) } }, async first() { return db.prepare(sql).get(...args) ?? null } } } } } };
  return {db, repo:d1Repository(adapter)};
}

test('D1 repository serves a spoiler-filtered published story', async () => {
  const {repo} = setup();
  const response = await handleRequest(new Request('https://example.com/api/books/book'), repo);
  const result = await response.json();
  assert.equal(result.story.characters[0].descriptions[0].text,'Safe');
  assert.equal(JSON.stringify(result).includes('Spoiler'),false);
});

test('D1 enforces a maximum of ten portraits per character', () => {
  const {db} = setup();
  const insert=db.prepare('INSERT INTO portraits VALUES (?, ?, 1, 1, ?)');
  for(let i=0;i<10;i++) insert.run(`p${i}`,'c',`/p${i}`);
  assert.throws(()=>insert.run('p10','c','/p10'),/portrait limit exceeded/);
});
