const root = document.querySelector('#story-app');
if (root) {
const api = root.dataset.api;
const lang = root.dataset.lang;
const pl = lang === 'pl';
const svg = document.querySelector('#graph-svg');
const status = document.querySelector('#status');
const progress = document.querySelector('#progress');
const chapterControls = document.querySelector('#chapter-controls');
const previousChapter = document.querySelector('#chapter-previous');
const nextChapter = document.querySelector('#chapter-next');
const chapterLabel = document.querySelector('#chapter-position-label');
const chapterFill = document.querySelector('#chapter-track-fill');
function updateChapterControls(ready) {
  const index = progress.selectedIndex, count = progress.options.length;
  chapterControls.hidden = count === 0;
  previousChapter.setAttribute('aria-disabled', String(!ready || index <= 0));
  nextChapter.setAttribute('aria-disabled', String(!ready || index < 0 || index >= count - 1));
  if (index >= 0) {
    chapterLabel.textContent = pl ? `Pozycja ${index + 1} z ${count}` : `Position ${index + 1} of ${count}`;
    chapterFill.style.width = `${(index + 1) / count * 100}%`;
  }
}
function moveChapter(offset) {
  const target = offset < 0 ? previousChapter : nextChapter;
  if (target.getAttribute('aria-disabled') === 'true') return;
  progress.selectedIndex += offset;
  progress.dispatchEvent(new Event('change', { bubbles: true }));
}
previousChapter.addEventListener('click', () => moveChapter(-1));
nextChapter.addEventListener('click', () => moveChapter(1));
const detail = document.querySelector('#map-detail');
const detailPrompt = document.querySelector('#map-detail-prompt');
const retry = document.querySelector('#map-retry');
let requestedPosition;
let selectedNode = null;
const ns = 'http://www.w3.org/2000/svg';
let state = { x: 0, y: 0, scale: 1 };
let pointers = new Map();
let start = null;
let moved = false;
let layer;
let data;
let requestId = 0;
let saveQueue = Promise.resolve();
const storageKey = `castellation:guest-progress:${root.dataset.slug}`;
const availablePositions = JSON.parse(root.dataset.positions);
const memory = document.querySelector('#progress-memory');
const memoryText = document.querySelector('#progress-memory-text');
function setMemoryMessage(message) { memoryText.textContent = message; memory.hidden = false; }
function readGuestProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return availablePositions.some((item) => item.volume === saved?.volume && item.chapter === saved?.chapter) ? saved : null;
  } catch { return null; }
}
function saveGuestProgress(position) {
  try { localStorage.setItem(storageKey, JSON.stringify(position)); return true; } catch { return false; }
}

function element(name, attrs = {}) { const node = document.createElementNS(ns, name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); return node; }
function transform() { if (layer) layer.setAttribute('transform', `translate(${state.x} ${state.y}) scale(${state.scale})`); }
function setScale(scale) { state.scale = Math.max(.5, Math.min(3, scale)); transform(); }
function addText(parent, name, value) { const el = document.createElement(name); el.textContent = value || ''; parent.append(el); return el; }
function draw() {
  detail.hidden = true; selectedNode = null;
  svg.replaceChildren(); layer = element('g'); svg.append(layer);
  const chars = data.story.characters;
  detailPrompt.hidden = chars.length === 0;
  const nodes = new Map(chars.map((character, index) => {
    const angle = (2 * Math.PI * index / Math.max(chars.length, 1)) - Math.PI / 2;
    return [character.id, { ...character, x: 400 + 230 * Math.cos(angle), y: 260 + 170 * Math.sin(angle) }];
  }));
  const defs = element('defs');
  const marker = element('marker', { id:'relation-arrow', viewBox:'0 0 10 10', refX:'9', refY:'5', markerWidth:'7', markerHeight:'7', orient:'auto' });
  marker.append(element('path', { d:'M 0 0 L 10 5 L 0 10 z', fill:'#536d5b' })); defs.append(marker); layer.append(defs);
  data.story.relations.forEach((relation) => {
    const a = nodes.get(relation.from), b = nodes.get(relation.to); if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    const ux = distance ? dx / distance : 0, uy = distance ? dy / distance : 0;
    const group = element('g', { class:'edge-group', tabindex:'0', role:'button', 'aria-label': `${a.name} - ${relation.label} - ${b.name}`, 'aria-controls':'map-detail', 'aria-expanded':'false' });
    const line = distance ? element('line', { x1:a.x + ux * 40, y1:a.y + uy * 40, x2:b.x - ux * 43, y2:b.y - uy * 43, class:'edge', 'marker-end':'url(#relation-arrow)', 'aria-hidden':'true' }) : element('path', { d:`M ${a.x - 27} ${a.y - 30} C ${a.x - 85} ${a.y - 120}, ${a.x + 85} ${a.y - 120}, ${a.x + 27} ${a.y - 30}`, class:'edge', fill:'none', 'marker-end':'url(#relation-arrow)', 'aria-hidden':'true' });
    const label = element('text', { x:distance ? (a.x + b.x) / 2 - uy * 13 : a.x, y:distance ? (a.y + b.y) / 2 + ux * 13 : a.y - 98, 'text-anchor':'middle', class:'edge-label', 'aria-hidden':'true' });
    label.textContent = relation.label.length > 28 ? `${relation.label.slice(0, 27)}…` : relation.label;
    const open = () => {
      if (moved) return;
      if (selectedNode) { selectedNode.classList.remove('is-selected'); selectedNode.setAttribute('aria-expanded', 'false'); }
      selectedNode = group; group.classList.add('is-selected'); group.setAttribute('aria-expanded', 'true');
      detailPrompt.hidden = true;
      document.querySelector('.map-detail-mark').textContent = '↗';
      document.querySelector('.map-detail-content .eyebrow').textContent = pl ? 'WYBRANE POWIĄZANIE' : 'SELECTED CONNECTION';
      const heading = document.querySelector('#map-detail-name'); heading.textContent = `${a.name} → ${b.name}`;
      document.querySelector('#map-detail-description').textContent = relation.label;
      const link = document.querySelector('#map-detail-link');
      link.href = `/books/${encodeURIComponent(root.dataset.slug)}/relations/${encodeURIComponent(relation.id)}?lang=${lang}&volume=${data.progress.volume}&chapter=${data.progress.chapter}`;
      link.textContent = pl ? 'Otwórz szczegóły relacji ↗' : 'Open connection details ↗';
      detail.hidden = false; heading.focus();
    };
    group.addEventListener('click', open); group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); moved = false; open(); } });
    group.append(line, label); layer.append(group);
  });
  nodes.forEach((character) => {
    const group = element('g', { transform:`translate(${character.x} ${character.y})`, class:'graph-node', tabindex:'0', role:'button', 'aria-label':character.name, 'aria-controls':'map-detail', 'aria-expanded':'false' });
    group.append(element('circle', { r:38, class:'node-ring' }), element('circle', { r:31, class:'node-inner' }));
    const initial = element('text', { y:8, 'text-anchor':'middle', class:'node-initial' }); initial.textContent = character.name.slice(0, 1); group.append(initial);
    const label = element('text', { y:58, 'text-anchor':'middle', class:'node-label' }); label.textContent = character.name; group.append(label);
    const open = () => {
      if (moved) return;
      if (selectedNode) { selectedNode.classList.remove('is-selected'); selectedNode.setAttribute('aria-expanded', 'false'); }
      selectedNode = group; group.classList.add('is-selected'); group.setAttribute('aria-expanded', 'true');
      detailPrompt.hidden = true;
      document.querySelector('.map-detail-mark').textContent = character.name.slice(0, 1);
      document.querySelector('.map-detail-content .eyebrow').textContent = pl ? 'WYBRANA POSTAĆ' : 'SELECTED CHARACTER';
      document.querySelector('#map-detail-link').textContent = pl ? 'Otwórz profil postaci ↗' : 'Open character profile ↗';
      const heading = document.querySelector('#map-detail-name');
      heading.textContent = character.name;
      document.querySelector('#map-detail-description').textContent = character.descriptions.at(-1)?.text || '';
      document.querySelector('#map-detail-link').href = `/books/${encodeURIComponent(root.dataset.slug)}/characters/${encodeURIComponent(character.slug)}?lang=${lang}&volume=${data.progress.volume}&chapter=${data.progress.chapter}`;
      detail.hidden = false; heading.focus();
    };
    group.addEventListener('click', open); group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); moved = false; open(); } }); layer.append(group);
  }); transform();
  const discoveries = document.querySelector('#chapter-discoveries-list');
  const discoveryPosition = document.querySelector('#chapter-discoveries-position');
  const atCurrentChapter = (item) => item.volume === data.progress.volume && item.chapter === data.progress.chapter;
  discoveryPosition.textContent = pl ? `Tom ${data.progress.volume} · Rozdział ${data.progress.chapter}` : `Volume ${data.progress.volume} · Chapter ${data.progress.chapter}`;
  discoveries.replaceChildren();
  const groups = [
    { title: pl ? 'Postacie' : 'Characters', items: chars.filter(atCurrentChapter).map((character) => ({ text: character.name, href: `/books/${encodeURIComponent(root.dataset.slug)}/characters/${encodeURIComponent(character.slug)}?lang=${lang}&volume=${data.progress.volume}&chapter=${data.progress.chapter}` })) },
    { title: pl ? 'Relacje' : 'Connections', items: data.story.relations.filter(atCurrentChapter).flatMap((relation) => { const from = nodes.get(relation.from), to = nodes.get(relation.to); return from && to ? [{ text: `${from.name} · ${relation.label} → ${to.name}` }] : []; }) },
    { title: pl ? 'Wydarzenia' : 'Events', items: data.story.events.filter(atCurrentChapter).map((event) => ({ text: event.title })) },
  ];
  groups.filter((group) => group.items.length).forEach((group) => {
    const section = document.createElement('div'); section.className = 'chapter-discoveries-group'; addText(section, 'h3', group.title);
    const list = document.createElement('ul'); group.items.forEach((item) => { const li = document.createElement('li'); if (item.href) { const link = document.createElement('a'); link.href = item.href; link.textContent = item.text; li.append(link); } else li.textContent = item.text; list.append(li); }); section.append(list); discoveries.append(section);
  });
  if (!discoveries.childElementCount) { const empty = addText(discoveries, 'p', pl ? 'Brak nowych szczegółów w tym rozdziale.' : 'No new details are available for this chapter.'); empty.className = 'chapter-discoveries-empty'; }
  const list = document.querySelector('#character-list'); list.replaceChildren();
  chars.forEach((character) => { const article = document.createElement('article'); article.className = 'list-item'; article.id = `character-${character.slug}`; article.tabIndex = -1; const portrait = character.portraits.at(-1); if (portrait?.url) { const img = document.createElement('img'); img.src = portrait.url; img.alt = character.name; img.className = 'character-portrait'; img.loading = 'lazy'; article.append(img); } const heading = addText(article, 'h3', ''); const link = document.createElement('a'); const progressQuery = `&volume=${data.progress.volume}&chapter=${data.progress.chapter}`; link.href = `/books/${encodeURIComponent(root.dataset.slug)}/characters/${encodeURIComponent(character.slug)}?lang=${lang}${progressQuery}`; link.textContent = character.name; heading.append(link); const description = character.descriptions.at(-1); if (description) addText(article, 'p', description.text); data.story.relations.filter((r) => r.from === character.id || r.to === character.id).forEach((r) => { const from = nodes.get(r.from), to = nodes.get(r.to); if (from && to) addText(article, 'p', `${from.name} · ${r.label} → ${to.name}`); }); list.append(article); });
  const connections = document.querySelector('#map-connections-list'); connections.replaceChildren();
  const summary = document.querySelector('#map-summary');
  summary.textContent = pl ? `Tom ${data.progress.volume}, rozdział ${data.progress.chapter} · ${chars.length} postaci · ${data.story.relations.length} relacji` : `Volume ${data.progress.volume}, chapter ${data.progress.chapter} · ${chars.length} ${chars.length === 1 ? 'character' : 'characters'} · ${data.story.relations.length} ${data.story.relations.length === 1 ? 'connection' : 'connections'}`;
  const progressQuery = `&volume=${data.progress.volume}&chapter=${data.progress.chapter}`;
  const share = document.querySelector('#map-share');
  const shareUrl = new URL(`/books/${encodeURIComponent(root.dataset.slug)}/map`, location.origin);
  shareUrl.searchParams.set('lang', lang);
  shareUrl.searchParams.set('volume', String(data.progress.volume));
  shareUrl.searchParams.set('chapter', String(data.progress.chapter));
  document.querySelector('#map-share-url').value = shareUrl.href;
  document.querySelector('#map-share-boundary').textContent = pl ? `Tom ${data.progress.volume} · Rozdział ${data.progress.chapter}` : `Volume ${data.progress.volume} · Chapter ${data.progress.chapter}`;
  document.querySelector('#map-share-status').textContent = '';
  share.hidden = false;
  const sheetLink = document.querySelector('#reading-sheet-link');
  sheetLink.href = `/books/${encodeURIComponent(root.dataset.slug)}/reading-sheet?lang=${lang}${progressQuery}`;
  sheetLink.hidden = false;
  data.story.relations.forEach((relation) => {
    const from = nodes.get(relation.from), to = nodes.get(relation.to); if (!from || !to) return;
    const item = document.createElement('li');
    const linkFor = (character) => { const link = document.createElement('a'); link.href = `/books/${encodeURIComponent(root.dataset.slug)}/characters/${encodeURIComponent(character.slug)}?lang=${lang}${progressQuery}`; link.textContent = character.name; return link; };
    const label = document.createElement('span'); label.className = 'map-relation-label'; label.textContent = `${relation.label} →`;
    item.append(linkFor(from), label, linkFor(to)); connections.append(item);
  });
  if (!connections.childElementCount) { const item = document.createElement('li'); item.textContent = pl ? 'Brak widocznych powiązań na tym etapie.' : 'No connections are visible at this point.'; connections.append(item); }
  const events = document.querySelector('#event-list'); events.replaceChildren(); data.story.events.forEach((event) => { const article = document.createElement('article'); article.className = 'list-item'; addText(article, 'small', `${pl ? 'Rozdział' : 'Chapter'} ${event.chapter}`); addText(article, 'h3', event.title); addText(article, 'p', event.description); events.append(article); });
}
async function load(position) {
  if (!api) { status.textContent = pl ? 'Brak skonfigurowanego API.' : 'The API is not configured.'; return; }
  const currentRequest = ++requestId;
  requestedPosition = position; root.dataset.state = 'loading'; retry.hidden = true; detail.hidden = true; document.querySelector('#map-share').hidden = true; updateChapterControls(false);
  status.textContent = pl ? 'Aktualizujemy mapę dla wybranego rozdziału...' : 'Updating the map for your selected chapter...';
  try {
    const query = position ? `?volume=${position.volume}&chapter=${position.chapter}` : '';
    const response = await fetch(`${api}/api/books/${encodeURIComponent(root.dataset.slug)}${query}`); if (!response.ok) throw new Error(); const result = await response.json(); if (currentRequest !== requestId) return; data = result;
    document.querySelector('#book-title').textContent = data.book.title; document.querySelector('#book-author').textContent = data.book.author;
    progress.replaceChildren(); data.book.positions.forEach((p) => { const option = document.createElement('option'); option.value = `${p.volume}:${p.chapter}`; option.textContent = `${pl ? 'Tom' : 'Volume'} ${p.volume} · ${pl ? 'Rozdział' : 'Chapter'} ${p.chapter}`; option.selected = p.volume === data.progress.volume && p.chapter === data.progress.chapter; progress.append(option); });
    draw(); root.dataset.state = 'ready'; updateChapterControls(true); status.textContent = '';
  } catch { if (currentRequest === requestId) { root.dataset.state = 'error'; status.textContent = pl ? 'Nie udało się zaktualizować mapy.' : 'Unable to update the map.'; retry.hidden = false; } }
}
document.querySelector('#map-share-copy').addEventListener('click', async () => {
  const input = document.querySelector('#map-share-url');
  const feedback = document.querySelector('#map-share-status');
  try {
    await navigator.clipboard.writeText(input.value);
    feedback.textContent = pl ? 'Link skopiowany.' : 'Link copied.';
  } catch {
    input.focus(); input.select();
    feedback.textContent = pl ? 'Skopiuj zaznaczony link ręcznie.' : 'Copy the selected link manually.';
  }
});
retry.addEventListener('click', () => load(requestedPosition));
document.querySelector('#map-detail-close').addEventListener('click', () => { detail.hidden = true; detailPrompt.hidden = false; if (selectedNode) { selectedNode.classList.remove('is-selected'); selectedNode.setAttribute('aria-expanded', 'false'); selectedNode.focus(); selectedNode = null; } });
progress.addEventListener('change', () => {
  detail.hidden = true;
  const [volume, chapter] = progress.value.split(':').map(Number);
  const position={volume,chapter};
  load(position);
  saveQueue=saveQueue.then(async () => {
    let response;
    try { response=await fetch(`${api}/api/progress/${encodeURIComponent(root.dataset.slug)}`,{method:'PUT',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(position)}); } catch { /* Save a separate device copy when the account service cannot be reached. */ }
    if (!response || response.status === 401 || response.status >= 500) {
      const saved = saveGuestProgress(position);
      setMemoryMessage(saved ? (pl ? 'Postęp zapisany w tej przeglądarce. Postęp konta jest osobny.' : 'Progress saved in this browser. Account progress is separate.') : (pl ? 'Nie udało się zapisać postępu w tej przeglądarce.' : 'Unable to save progress in this browser.'));
    } else if (!response.ok) throw new Error('Save failed');
    else setMemoryMessage(pl ? 'Postęp zapisany na koncie.' : 'Progress saved to your account.');
  }).catch(() => {setMemoryMessage(pl?'Nie udało się zapisać postępu.':'Unable to save reading progress.');});
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
  const params = new URLSearchParams(location.search);
  const volume = params.get('volume'), chapter = params.get('chapter');
  const explicit = /^[1-9]\d*$/.test(volume || '') && /^[1-9]\d*$/.test(chapter || '') ? { volume: Number(volume), chapter: Number(chapter) } : null;
  try {
    const response = await fetch(`${api}/api/progress/${encodeURIComponent(root.dataset.slug)}`, { credentials: 'include' });
    if (response.ok) {
      const result = await response.json();
      setMemoryMessage(pl ? 'Postęp konta jest synchronizowany między urządzeniami.' : 'Account progress syncs across devices.');
      return load(explicit || result.progress);
    }
    if (response.status === 401) {
      const saved = readGuestProgress();
      setMemoryMessage(pl ? 'Zmiany zapisują się w tej przeglądarce. Postęp konta jest osobny.' : 'Changes are saved in this browser. Account progress is separate.');
      return load(explicit || saved);
    }
  } catch { /* Reading remains available if progress cannot be checked. */ }
  setMemoryMessage(pl ? 'Nie udało się sprawdzić postępu konta. Wybrany rozdział można zapisać osobno w tej przeglądarce.' : 'Account progress is unavailable. Your selected chapter can be saved separately in this browser.');
  return load(explicit);
}
loadInitial();

}
