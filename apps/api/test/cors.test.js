import { test } from 'node:test';
import assert from 'node:assert/strict';
import { privateCors } from '../src/private-cors.js';

test('accepts configured origin with credentials and rejects other origins',()=>{
  const allowed=privateCors(new Request('https://api.example.com/api/progress/book',{headers:{origin:'https://app.example.com'}}),'https://app.example.com');
  assert.equal(allowed.headers.get('access-control-allow-origin'),'https://app.example.com');
  assert.equal(allowed.headers.get('access-control-allow-credentials'),'true');
  assert.equal(privateCors(new Request('https://api.example.com/api/progress/book',{headers:{origin:'https://evil.example'}}),'https://app.example.com').allowed,false);
});

test('allows native requests without a browser origin without granting wildcard CORS',()=>{
  const result=privateCors(new Request('https://api.example.com/api/progress/book'),'https://app.example.com');
  assert.equal(result.allowed,true);
  assert.equal(result.headers.has('access-control-allow-origin'),false);
});
