const canonical = (value) => value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
async function key(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest).slice(0,12), (byte) => byte.toString(16).padStart(2,'0')).join('');
}
export async function characterId(sourceId, name) { return `c-${await key(`${sourceId}:${canonical(name)}`)}`; }

export async function publishBook(db, source, chapters, portraits) {
  const verified = await db.prepare('SELECT rights_verified FROM sources WHERE id = ?').bind(source.id).first();
  if (!verified?.rights_verified) throw new Error('Source rights are not verified');
  const existing = await db.prepare('SELECT published, withdrawn FROM books WHERE id = ?').bind(source.id).first();
  if (existing?.withdrawn) return { published: false, reason: 'withdrawn' };
  if (existing?.published) return { published: false, reason: 'already-published' };
  if (!chapters.length) throw new Error('A book must contain chapters');
  const statements = [];
  const put = (sql, ...params) => statements.push(db.prepare(sql).bind(...params));
  const evidence = (type,id,chapter,excerpt) => put('INSERT OR IGNORE INTO content_evidence (entity_type, entity_id, source_id, volume, chapter, excerpt) VALUES (?, ?, ?, 1, ?, ?)',type,id,source.id,chapter,excerpt);
  put('INSERT OR IGNORE INTO books (id, slug, title, author, published) VALUES (?, ?, ?, ?, 0)',source.id,source.id,source.title,source.author);
  for (const chapter of chapters) {
    put('INSERT OR IGNORE INTO chapters (book_id, volume, chapter, title) VALUES (?, 1, ?, ?)',source.id,chapter.number,chapter.title);
    for (const item of chapter.analysis.characters) {
      const id = await characterId(source.id,item.name);
      const descriptionId = `d-${await key(`${id}:${chapter.number}`)}`;
      put('INSERT OR IGNORE INTO characters (id, book_id, slug, name, volume, chapter) VALUES (?, ?, ?, ?, 1, ?)',id,source.id,id,item.name,chapter.number);
      put('INSERT OR IGNORE INTO descriptions (id, character_id, volume, chapter, text) VALUES (?, ?, 1, ?, ?)',descriptionId,id,chapter.number,item.description);
      evidence('description',descriptionId,chapter.number,item.evidence);
    }
    for (const [index,item] of chapter.analysis.relations.entries()) {
      const from = await characterId(source.id,item.from), to = await characterId(source.id,item.to);
      const id = `r-${await key(`${source.id}:${chapter.number}:${index}:${from}:${to}`)}`;
      put('INSERT OR IGNORE INTO relations (id, book_id, source_id, target_id, volume, chapter, label) VALUES (?, ?, ?, ?, 1, ?, ?)',id,source.id,from,to,chapter.number,item.label);
      evidence('relation',id,chapter.number,item.evidence);
    }
    for (const [index,item] of chapter.analysis.events.entries()) {
      const id = `e-${await key(`${source.id}:${chapter.number}:${index}`)}`;
      put('INSERT OR IGNORE INTO events (id, book_id, volume, chapter, title, description) VALUES (?, ?, 1, ?, ?, ?)',id,source.id,chapter.number,item.title,item.description);
      evidence('event',id,chapter.number,item.evidence);
    }
  }
  for (const portrait of portraits) {
    put('INSERT OR IGNORE INTO portraits (id, character_id, volume, chapter, url) VALUES (?, ?, 1, ?, ?)',portrait.id,portrait.characterId,portrait.chapter,`/api/media/${portrait.id}`);
    evidence('portrait',portrait.id,portrait.chapter,portrait.evidence);
  }
  put('UPDATE books SET published = 1 WHERE id = ? AND published = 0 AND withdrawn = 0',source.id);
  await db.batch(statements);
  return { published: true };
}
