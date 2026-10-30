import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleAt, selectPortrait, filterStory } from '../src/catalog.js';

test('compares volume and chapter in reading order', () => {
  assert.equal(visibleAt({ volume: 1, chapter: 9 }, { volume: 2, chapter: 1 }), true);
  assert.equal(visibleAt({ volume: 2, chapter: 2 }, { volume: 2, chapter: 1 }), false);
});

test('selects the latest visible portrait independent of input order', () => {
  const portraits = [{ id: 'later', volume: 2, chapter: 1 }, { id: 'first', volume: 1, chapter: 1 }, { id: 'middle', volume: 1, chapter: 5 }];
  assert.equal(selectPortrait(portraits, { volume: 1, chapter: 6 }).id, 'middle');
  assert.equal(selectPortrait(portraits, { volume: 1, chapter: 0 }), null);
});

test('filters later characters, edges, events and portraits from the response', () => {
  const story = {
    characters: [{ id: 'a', volume: 1, chapter: 1, portraits: [{ id: 'p1', volume: 1, chapter: 1 }, { id: 'p2', volume: 1, chapter: 3 }] }, { id: 'b', volume: 1, chapter: 3, portraits: [] }],
    relations: [{ from: 'a', to: 'b', volume: 1, chapter: 1 }],
    events: [{ id: 'e', volume: 1, chapter: 3 }],
  };
  const result = filterStory(story, { volume: 1, chapter: 1 });
  assert.deepEqual(result.characters.map((c) => c.id), ['a']);
  assert.deepEqual(result.characters[0].portraits.map((p) => p.id), ['p1']);
  assert.deepEqual(result.relations, []);
  assert.deepEqual(result.events, []);
});
