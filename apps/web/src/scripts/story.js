const root = document.querySelector('#story-app');
const api = root.dataset.api;
const lang = root.dataset.lang;
const pl = lang === 'pl';
const svg = document.querySelector('#graph-svg');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const ns = 'http://www.w3.org/2000/svg';
let state = { x: 0, y: 0, scale: 1 };
let pointers = new Map();
let start = null;
let moved = false;
let layer;
let data;
let requestId = 0;
let saveQueue = Promise.resolve();

function element(name, attrs = {}) { const node = document.createElementNS(ns, name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; }
function transform() { if (layer) layer.setAttribute('transform', `translate(${state.x} ${state.y}) scale(${state.scale})`); }
function setScale(scale) { state.scale = Math.max(.5, Math.min(3, scale)); transform(); }
function addText(parent, name, value) { const el = document.createElement(name); el.textContent = value || ''; parent.append(el); return el; }
function draw() {
  svg.replaceChildren(); layer = element('g'); svg.append(layer);
  const chars = data.story.characters;
  const nodes = new Map(chars.map((character, index) => {
    const angle = (2 * Math.PI * index / Math.max(chars.length, 1)) - Math.PI / 2;
    return [character.id, { ...character, x: 400 + 230 * Math.cos(angle), y: 260 + 170 * Math.sin(angle) }];
  }));
  data.story.relations.forEach((relation) => { const a = nodes.get(relation.from); const b = nodes.get(relation.to); if (!a || !b) return; const line = element('line', { x1:a.x, y1:a.y, x2:b.x, y2:b.y, class:'edge', tabindex:'0', role:'button', 'aria-label': `${a.name} - ${relation.label} - ${b.name}` }); const open = () => { if (!moved) { status.textContent = `${a.name} - ${relation.label} - ${b.name}`; } }; line.addEventListener('click', open); line.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); moved = false; open(); } }); layer.append(line); });
  nodes.forEach((character) => {
    const group = element('g', { transform:`translate(${character.x} ${character.y})`, class:'graph-node', tabindex:'0', role:'button', 'aria-label':character.name });
    group.append(element('circle', { r:38, class:'node-ring' }), element('circle', { r:31, class:'node-inner' }));
    const initial = element('text', { y:8, 'text-anchor':'middle', class:'node-initial' }); initial.textContent = character.name.slice(0, 1); group.append(initial);
    const label = element('text', { y:58, 'text-anchor':'middle', class:'node-label' }); label.textContent = character.name; group.append(label);
    const open = () => { if (!moved) document.getElementById(`character-${character.slug}`)?.focus(); };
    group.addEventListener('click', open); group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); moved = false; open(); } }); layer.append(group);
  }); transform();
  const list = document.querySelector('#character-list'); list.replaceChildren();
  chars.forEach((character) => { const article = document.createElement('article'); article.className = 'list-item'; article.id = `character-${character.slug}`; article.tabIndex = -1; const portrait = character.portraits.at(-1); if (portrait?.url) { const img = document.createElement('img'); img.src = portrait.url; img.alt = character.name; img.className = 'character-portrait'; img.loading = 'lazy'; article.append(img); } const heading = addText(article, 'h3', ''); const link = document.createElement('a'); const first = data.book.positions[0]; const progressQuery = data.progress.volume === first.volume && data.progress.chapter === first.chapter ? '' : `&volume=${data.progress.volume}&chapter=${data.progress.chapter}`; link.href = `/books/${encodeURIComponent(root.dataset.slug)}/characters/${encodeURIComponent(character.slug)}?lang=${lang}${progressQuery}`; link.textContent = character.name; heading.append(link); const description = character.descriptions.at(-1); if (description) addText(article, 'p', description.text); data.story.relations.filter((r) => r.from === character.id || r.to === character.id).forEach((r) => { const other = nodes.get(r.from === character.id ? r.to : r.from); addText(article, 'p', `${r.label} · ${other?.name ?? ''}`); }); list.append(article); });
  const events = document.querySelector('#event-list'); events.replaceChildren(); data.story.events.forEach((event) => { const article = document.createElement('article'); article.className = 'list-item'; addText(article, 'small', `${pl ? 'Rozdział' : 'Chapter'} ${event.chapter}`); addText(article, 'h3', event.title); addText(article, 'p', event.description); events.append(article); });
}
async function load(position) {
  if (!api) { status.textContent = pl ? 'Brak skonfigurowanego API.' : 'The API is not configured.'; return; }
  const currentRequest = ++requestId;
  status.textContent = pl ? 'Ładowanie...' : 'Loading...';
  try {
    const query = position ? `?volume=${position.volume}&chapter=${position.chapter}` : '';
    const response = await fetch(`${api}/api/books/${encodeURIComponent(root.dataset.slug)}${query}`); if (!response.ok) throw new Error(); const result = await response.json(); if (currentRequest !== requestId) return; data = result;
    document.querySelector('#book-title').textContent = data.book.title; document.querySelector('#book-author').textContent = data.book.author;
    progress.replaceChildren(); data.book.positions.forEach((p) => { const option = document.createElement('option'); option.value = `${p.volume}:${p.chapter}`; option.textContent = `${pl ? 'Tom' : 'Volume'} ${p.volume} · ${pl ? 'Rozdział' : 'Chapter'} ${p.chapter}`; option.selected = p.volume === data.progress.volume && p.chapter === data.progress.chapter; progress.append(option); });
    status.textContent = ''; draw();
  } catch { if (currentRequest === requestId) status.textContent = pl ? 'Nie udało się pobrać książki.' : 'Unable to load this book.'; }
}
progress.addEventListener('change', () => {
  const [volume, chapter] = progress.value.split(':').map(Number);
  const position={volume,chapter};
  load(position);
  saveQueue=saveQueue.then(async () => {
    const response=await fetch(`${api}/api/progress/${encodeURIComponent(root.dataset.slug)}`,{method:'PUT',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(position)});
    if(response.status!==401&&!response.ok)throw new Error('Save failed');
  }).catch(() => {status.textContent=pl?'Nie udało się zapisać postępu.':'Unable to save reading progress.';});
});
svg.addEventListener('pointerdown', (event) => { event.target.setPointerCapture(event.pointerId); pointers.set(event.pointerId, {x:event.clientX,y:event.clientY}); moved = false; start = null; });
svg.addEventListener('pointermove', (event) => {
  if (!pointers.has(event.pointerId)) return;
  const previous = pointers.get(event.pointerId); pointers.set(event.pointerId, {x:event.clientX,y:event.clientY});
  const points = [...pointers.values()];
  if (points.length === 1) { const dx = event.clientX - previous.x, dy = event.clientY - previous.y; if (Math.abs(dx)+Math.abs(dy)>1) moved = true; const bounds = svg.getBoundingClientRect(); state.x += dx * 800 / bounds.width; state.y += dy * 520 / bounds.height; transform(); }
  if (points.length === 2) { const distance = Math.hypot(points[0].x-points[1].x, points[0].y-points[1].y); if (start) setScale(state.scale * distance / start); start = distance; moved = true; }
});
for (const type of ['pointerup','pointercancel']) svg.addEventListener(type, (event) => { pointers.delete(event.pointerId); start = null; });
document.querySelector('#zoom-in').addEventListener('click', () => setScale(state.scale * 1.25));
document.querySelector('#zoom-out').addEventListener('click', () => setScale(state.scale / 1.25));
document.querySelector('#zoom-reset').addEventListener('click', () => { state = {x:0,y:0,scale:1}; transform(); });
async function loadInitial() {
  if (!api) return load();
  try {
    const response=await fetch(`${api}/api/progress/${encodeURIComponent(root.dataset.slug)}`,{credentials:'include'});
    if(response.ok) { const result=await response.json(); return load(result.progress); }
  } catch { /* Public reading works even when synchronization is unavailable. */ }
  return load();
}
loadInitial();
