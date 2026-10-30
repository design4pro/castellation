import { test } from 'node:test';
import assert from 'node:assert/strict';
import { servePortrait } from '../src/media.js';
const id='c-aaaaaaaaaaaaaaaaaaaaaaaa-1';

test('serves only portraits belonging to published books', async () => {
  let allowed = false;
  const db = { prepare() {return { bind() { return { async first() { return allowed ? {id} : null; } }; } }; } };
  const bucket = { async get(key) {return key===`portraits/${id}.jpg` ? { body:new TextEncoder().encode('image'), httpMetadata:{contentType:'image/jpeg'} } : null;} };
  assert.equal((await servePortrait(id,db,bucket)).status,404);
  allowed=true;
  const response=await servePortrait(id,db,bucket);
  assert.equal(response.status,200);
  assert.equal(await response.text(),'image');
  assert.equal(response.headers.get('content-type'),'image/jpeg');
});

test('rejects invalid portrait identifiers', async () => {
  assert.equal((await servePortrait('../secret',{},{})).status,404);
});

test('does not cache portraits so withdrawal takes effect on later requests', async () => {
  const db={prepare(){return {bind(){return {async first(){return {id}}}}}}};
  const media={async get(){return {body:new Uint8Array([1]),httpMetadata:{contentType:'image/jpeg'}}}};
  const response=await servePortrait(id,db,media);
  assert.equal(response.headers.get('cache-control'),'no-store');
});
