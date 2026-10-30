import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitChapters, validateSourceUrl } from '../src/ingestion.js';

test('splits a source with numbered chapter headings and keeps chapter text', () => {
  const chapters = splitChapters('Introduction\nCHAPTER I. Down the Rabbit-Hole\nAlice sat by her sister.\nCHAPTER II. The Pool\nAlice fell.');
  assert.deepEqual(chapters.map(({number})=>number),[1,2]);
  assert.match(chapters[0].text,/Alice sat/);
  assert.doesNotMatch(chapters[0].text,/Alice fell/);
});

test('rejects unsupported sources and deceptive hostnames', () => {
  assert.equal(validateSourceUrl('https://www.gutenberg.org/files/11/11-0.txt'),true);
  assert.equal(validateSourceUrl('https://www.gutenberg.org.attacker.test/files/11/11-0.txt'),false);
  assert.equal(validateSourceUrl('http://www.gutenberg.org/files/11/11-0.txt'),false);
  assert.equal(validateSourceUrl('https://www.gutenberg.org/redirect'),false);
});

test('discovery only accepts trusted plain-text sources and never marks rights as verified', async () => {
  const { discoverBooks } = await import('../src/discovery.js');
  const result = await discoverBooks(async () => Response.json({ results: [
    { id: 11, title: 'Alice', authors: [{name:'Carroll, Lewis'}], copyright:false, formats:{'text/plain; charset=utf-8':'https://www.gutenberg.org/files/11/11-0.txt'} },
    { id: 12, title: 'Unsafe', authors: [], copyright:false, formats:{'text/plain':'https://evil.test/book.txt'} },
    { id: 13, title: 'Copyrighted', authors: [], copyright:true, formats:{'text/plain':'https://www.gutenberg.org/files/13/13.txt'} },
  ] }));
  assert.equal(result.length,1);
  assert.equal(result[0].rightsVerified,false);
  assert.equal(result[0].title,'Alice');
});

test('ignores a repeated table of contents and Gutenberg footer', () => {
  const text = '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\nCONTENTS\nCHAPTER I. First\nCHAPTER II. Second\n\nCHAPTER I. First\nAlice followed the rabbit.\n\nCHAPTER II. Second\nAlice found a door.\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***\nLicense';
  const result = splitChapters(text);
  assert.equal(result.length, 2);
  assert.match(result[0].text,/Alice followed/);
  assert.doesNotMatch(result[1].text,/License/);
});
