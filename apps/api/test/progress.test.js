import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleProgress } from '../src/progress.js';

function setup() {
  const data = new Map();
  const repository = {
    async getBook(slug) { return slug === 'book' ? { id:'b',chapters:[{volume:1,chapter:1},{volume:1,chapter:2}] } : null; },
    async getProgress(user, book) { return data.get(`${user}:${book}`) ?? null; },
    async setProgress(user, book, position) { data.set(`${user}:${book}`,position); },
  };
  return {repository, authFor:(id)=>({api:{async getSession(){return id ? {user:{id,emailVerified:true}} : null}}})};
}
const req=(method,body)=>new Request('https://api.example.com/api/progress/book',{method,headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});

test('rejects unauthenticated requests and invalid positions', async()=>{
  const {repository,authFor}=setup();
  assert.equal((await handleProgress(req('GET'),repository,authFor(null))).status,401);
  for(const body of [{volume:1,chapter:9},{volume:1,chapter:'1'},{volume:0,chapter:1},{volume:1,chapter:1,userId:'other'}]) assert.equal((await handleProgress(req('PUT',body),repository,authFor('a'))).status,400);
});

test('saves progress under the session user and isolates another user', async()=>{
  const {repository,authFor}=setup();
  assert.equal((await handleProgress(req('PUT',{volume:1,chapter:2}),repository,authFor('a'))).status,200);
  assert.deepEqual(await (await handleProgress(req('GET'),repository,authFor('a'))).json(),{progress:{volume:1,chapter:2}});
  assert.deepEqual(await (await handleProgress(req('GET'),repository,authFor('b'))).json(),{progress:null});
});

test('rejects oversized JSON bodies even when content-length is absent', async()=>{
  const {repository,authFor}=setup();
  const request=new Request('https://api.example.com/api/progress/book',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({volume:1,chapter:1,padding:'x'.repeat(2048)})});
  assert.equal((await handleProgress(request,repository,authFor('a'))).status,400);
});

test('rejects sessions for unverified email addresses',async()=>{
  const {repository}=setup();
  const auth={api:{async getSession(){return {user:{id:'a',emailVerified:false}}}}};
  assert.equal((await handleProgress(req('GET'),repository,auth)).status,403);
});
