import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceAdmin } from './source-admin.js';

test('marks a source as verified only for an explicit valid action', async () => {
  const calls=[]; const db={ prepare(sql) {return { bind(...values) {return {async run(){calls.push({sql,values})}}}, async all(){return {results:[]}} }} };
  await sourceAdmin(db,{type:'page_load'});
  assert.equal(calls.length,0);
  await sourceAdmin(db,{type:'block_action',action_id:'verify',value:'gutenberg-11'});
  assert.deepEqual(calls[0].values,['gutenberg-11']);
  assert.match(calls[0].sql,/rights_verified = 1/);
});

test('ignores invalid source identifiers', async () => {
  const db={ prepare(sql) {return {bind(){throw Error('unexpected update')}, async all(){return {results:[]}}}} };
  await sourceAdmin(db,{type:'block_action',action_id:'verify',value:'../../source'});
});

test('allows retrying a failed verified source without re-verifying rights', async () => {
  const calls=[]; const db={prepare(sql){return {bind(...values){return {async run(){calls.push({sql,values})}}},async all(){return {results:[]}}}}};
  await sourceAdmin(db,{type:'block_action',action_id:'retry',value:'gutenberg-11'});
  assert.match(calls[0].sql,/status = 'failed'/);
  assert.match(calls[0].sql,/rights_verified = 1/);
});
