export const PORTRAIT_RADIUS = 48;

/** Stable introduction ordering makes selection independent of layout. */
export function layoutCharacters(characters, relations = [], canvasWidth = 800) {
  const ordered = [...characters].sort((a, b) => a.volume - b.volume || a.chapter - b.chapter || String(a.id).localeCompare(String(b.id), 'en'));
  const small = [[.47, .44], [.19, .18], [.77, .17], [.18, .72], [.66, .8], [.87, .48]];
  const radius = Math.max(230, ordered.length * 150 / (2 * Math.PI));
  let width = ordered.length <= 6 ? canvasWidth : Math.ceil(radius * 2 + 200);
  let height = ordered.length <= 6 ? 550 : width;
  const nodes = new Map(ordered.map((character, index) => {
    const angle = index * 2 * Math.PI / ordered.length - Math.PI / 2;
    const [x, y] = ordered.length === 1 ? [width / 2, height / 2] : ordered.length <= 6 ? [small[index][0] * width, small[index][1] * height] : [width / 2 + radius * Math.cos(angle), height / 2 + radius * Math.sin(angle)];
    return [character.id, { ...character, x, y }];
  }));
  const loops = new Map();
  for (const relation of relations) if (relation.from === relation.to && nodes.has(relation.from)) loops.set(relation.from, (loops.get(relation.from) || 0) + 1);
  let left = 0, top = 0, right = 0;
  for (const [id, count] of loops) {
    const node = nodes.get(id), reach = 110 + (count - 1) * 45;
    left = Math.max(left, reach + 20 - node.x);
    top = Math.max(top, reach + 75 - node.y);
    right = Math.max(right, node.x + reach + 20 - width);
  }
  for (const node of nodes.values()) { node.x += left; node.y += top; }
  width += left + right; height += top;
  return { nodes, width, height };
}

/** Fan parallel/reverse edges along a canonical normal; clip at both frames. */
export function layoutRelations(relations, nodes) {
  const families = new Map();
  for (const relation of relations) {
    if (!nodes.has(relation.from) || !nodes.has(relation.to)) continue;
    const key = JSON.stringify([relation.from, relation.to].sort());
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(relation);
  }
  const edges = [];
  for (const family of families.values()) {
    family.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en'));
    family.forEach((relation, index) => {
      const a = nodes.get(relation.from), b = nodes.get(relation.to);
      if (a === b) {
        const reach = 110 + index * 45;
        edges.push({ relation, path: `M ${a.x - 34} ${a.y - 42} C ${a.x - reach} ${a.y - reach - 55}, ${a.x + reach} ${a.y - reach - 55}, ${a.x + 34} ${a.y - 42}`, x: a.x, y: a.y - reach });
        return;
      }
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
      const direction = String(relation.from) < String(relation.to) ? 1 : -1;
      const offset = (index - (family.length - 1) / 2) * 65;
      const cx = (a.x + b.x) / 2 - dy / distance * offset * direction;
      const cy = (a.y + b.y) / 2 + dx / distance * offset * direction;
      const startLength = Math.hypot(cx - a.x, cy - a.y), endLength = Math.hypot(cx - b.x, cy - b.y);
      const start = { x: a.x + (cx - a.x) / startLength * 54, y: a.y + (cy - a.y) / startLength * 54 };
      const end = { x: b.x + (cx - b.x) / endLength * 59, y: b.y + (cy - b.y) / endLength * 59 };
      edges.push({ relation, path: `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`, x: (start.x + 2 * cx + end.x) / 4, y: (start.y + 2 * cy + end.y) / 4 - 10 });
    });
  }
  return edges.sort((a, b) => String(a.relation.id).localeCompare(String(b.relation.id), 'en'));
}
