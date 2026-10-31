import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutCharacters, layoutRelations, PORTRAIT_RADIUS } from '../src/scripts/relationship-layout.js';

const cast = (count) => Array.from({ length: count }, (_, index) => ({ id: `character-${String(index).padStart(3, '0')}`, volume: 1, chapter: index + 1 }));

test('empty and single casts have finite usable canvases', () => {
  assert.equal(layoutCharacters([]).nodes.size, 0);
  const { nodes, width, height } = layoutCharacters(cast(1));
  assert.equal(nodes.values().next().value.x, width / 2);
  assert.equal(nodes.values().next().value.y, height / 2);
});

for (const count of [6, 7, 25, 100]) {
  test(`${count} portraits have stable ordering and non-overlapping frames`, () => {
    const input = cast(count), layout = layoutCharacters(input);
    assert.deepEqual(layout, layoutCharacters([...input].reverse()));
    const nodes = [...layout.nodes.values()];
    for (const [index, a] of nodes.entries()) {
      assert.ok(a.x >= PORTRAIT_RADIUS && a.x + PORTRAIT_RADIUS <= layout.width);
      assert.ok(a.y >= PORTRAIT_RADIUS && a.y + PORTRAIT_RADIUS <= layout.height);
      for (const b of nodes.slice(index + 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 2 * (PORTRAIT_RADIUS + 6));
    }
  });
}

test('introduction volume, chapter and stable ID determine ordering', () => {
  const { nodes } = layoutCharacters([{ id: 'c', volume: 2, chapter: 1 }, { id: 'b', volume: 1, chapter: 3 }, { id: 'a', volume: 1, chapter: 3 }]);
  assert.deepEqual([...nodes.keys()], ['a', 'b', 'c']);
});

test('self, parallel and reverse connections remain distinct and clipped', () => {
  const { nodes } = layoutCharacters(cast(2));
  const [from, to] = [...nodes.keys()];
  const relations = [{ id: 'a', from, to }, { id: 'b', from, to }, { id: 'c', from: to, to: from }, { id: 'd', from, to: from }, { id: 'e', from, to: from }];
  const edges = layoutRelations(relations, nodes);
  assert.equal(new Set(edges.map((edge) => edge.path)).size, 5);
  assert.deepEqual(edges, layoutRelations([...relations].reverse(), nodes));
  for (const edge of edges) {
    assert.ok(!/NaN|Infinity/.test(edge.path));
    const [, x, y] = edge.path.split(' ').map(Number);
    const a = nodes.get(edge.relation.from);
    assert.ok(Math.hypot(x - a.x, y - a.y) > PORTRAIT_RADIUS);
  }
  assert.deepEqual(layoutRelations([{ id: 'hidden', from, to: 'unrevealed' }], nodes), []);
});


test('self loops at the top and side of the constellation fit inside the canvas', () => {
  const characters = cast(6);
  const relations = Array.from({ length: 4 }, (_, index) => ({ id: `loop-${index}`, from: characters[1].id, to: characters[1].id }));
  const { nodes, width, height } = layoutCharacters(characters, relations);
  for (const edge of layoutRelations(relations, nodes)) {
    const numbers = edge.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let index = 0; index < numbers.length; index += 2) {
      assert.ok(numbers[index] >= 0 && numbers[index] <= width);
      assert.ok(numbers[index + 1] >= 0 && numbers[index + 1] <= height);
    }
  }
});
