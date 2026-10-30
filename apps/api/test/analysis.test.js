import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis } from '../src/analysis.js';

const text = 'Alice saw the White Rabbit. He was wearing a waistcoat.';
const valid = { characters:[{name:'Alice',description:'A curious girl',appearance:'',evidence:'Alice saw the White Rabbit.'},{name:'White Rabbit',description:'A rabbit',appearance:'a waistcoat',evidence:'He was wearing a waistcoat.'}], relations:[{from:'Alice',to:'White Rabbit',label:'sees',evidence:'Alice saw the White Rabbit.'}], events:[{title:'Alice sees the rabbit',description:'Alice sees the White Rabbit.',evidence:'Alice saw the White Rabbit.'}] };

test('accepts structured results grounded in the exact chapter', () => {
  assert.deepEqual(validateAnalysis(JSON.stringify(valid),text),valid);
});
test('rejects unsupported evidence and malformed results', () => {
  assert.throws(()=>validateAnalysis(JSON.stringify({...valid,events:[{...valid.events[0],evidence:'future event'}]}),text),/evidence/i);
  assert.throws(()=>validateAnalysis('{"characters": []}',text),/invalid/i);
  assert.throws(()=>validateAnalysis('not json',text),/JSON/i);
});
test('rejects relations referring to names absent from the current chapter', () => {
  assert.throws(()=>validateAnalysis(JSON.stringify({...valid,relations:[{...valid.relations[0],to:'Unknown'}]}),text),/character/i);
});

test('selects changed appearances with a maximum of ten per character', async () => {
  const { portraitCandidates } = await import('../src/portrait.js');
  const chapters = Array.from({length:12},(_,i)=>({number:i+1,analysis:{characters:[{name:'Alice',appearance:`Appearance ${i}`,evidence:`Quote ${i}`}]}}));
  chapters.splice(1,0,{number:1,analysis:{characters:[{name:'Alice',appearance:'Appearance 0',evidence:'Quote 0'}]}});
  const portraits=await portraitCandidates('gutenberg-11',chapters);
  assert.equal(portraits.length,10);
  assert.equal(new Set(portraits.map((item)=>item.id)).size,10);
});
