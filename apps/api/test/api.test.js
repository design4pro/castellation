import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/api.js';

const book = { id: 'alice', slug: 'alice', title: 'Alice', author: 'Lewis Carroll', chapters: [{volume:1, chapter:1, title:'Down the Rabbit-Hole'}, {volume:1, chapter:2, title:'Later'}] };
const story = { characters: [{ id:'alice', name:'Alice', slug:'alice', volume:1, chapter:1, descriptions: [{volume:1,chapter:1,text:'A curious girl'}, {volume:1,chapter:2,text:'Secret'}], portraits: [] }, {id:'rabbit',name:'Rabbit',slug:'rabbit',volume:1,chapter:2,descriptions:[],portraits:[]}], relations: [{id:'r',from:'alice',to:'rabbit',volume:1,chapter:2,label:'Meets'}], events: [{id:'e',volume:1,chapter:2,title:'Secret event'}] };
const repository = { async listBooks() {return [book]}, async getBook(slug) {return slug === 'alice' ? book : null}, async getStory() {return story} };

test('public API defaults to first chapter and does not leak later content', async () => {
  const response = await handleRequest(new Request('https://example.com/api/books/alice'), repository);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(JSON.stringify(data).includes('Secret'), false);
  assert.equal(JSON.stringify(data).includes('rabbit'), false);
  assert.equal(data.book.chapters.length, 1);
});

test('requested chapter reveals eligible records', async () => {
  const response = await handleRequest(new Request('https://example.com/api/books/alice?volume=1&chapter=2'), repository);
  const data = await response.json();
  assert.equal(data.story.characters.length, 2);
  assert.equal(data.story.relations.length, 1);
});

test('rejects malformed or nonexistent progress', async () => {
  for (const query of ['volume=1&chapter=-1', 'volume=1&chapter=999', 'volume=1&chapter=2x', 'chapter=2']) {
    const response = await handleRequest(new Request(`https://example.com/api/books/alice?${query}`), repository);
    assert.equal(response.status, 400, query);
  }
});

test('unknown books return 404', async () => {
  const response = await handleRequest(new Request('https://example.com/api/books/missing'), repository);
  assert.equal(response.status, 404);
});

test('API does not serialize unapproved internal fields', async () => {
  const unsafe = { ...story, characters: [{ ...story.characters[0], internal_notes:'Secret', descriptions: [{volume:1,chapter:1,text:'Safe', internal_notes:'Secret'}] }] };
  const response = await handleRequest(new Request('https://example.com/api/books/alice'), { ...repository, async getStory() { return unsafe; } });
  assert.equal(JSON.stringify(await response.json()).includes('Secret'), false);
});

test('API returns only portraits revealed at the selected chapter', async () => {
  const withPortraits = {...story,characters:[{...story.characters[0],portraits:[{id:'old',volume:1,chapter:1,url:'/api/media/old'},{id:'new',volume:1,chapter:2,url:'/api/media/new'}]}]};
  const repo = {...repository,async getStory(){return withPortraits}};
  const early=await (await handleRequest(new Request('https://api.example.com/api/books/alice'),repo)).json();
  assert.deepEqual(early.story.characters[0].portraits.map((p)=>p.id),['old']);
  assert.equal(early.story.characters[0].portraits[0].url,'https://api.example.com/api/media/old');
  const later=await (await handleRequest(new Request('https://api.example.com/api/books/alice?volume=1&chapter=2'),repo)).json();
  assert.equal(later.story.characters[0].portraits.at(-1).id,'new');
});
