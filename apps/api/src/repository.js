export function d1Repository(db) {
  const all = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;
  return {
    async listBooks() { return all('SELECT id, slug, title, author FROM books WHERE published = 1 ORDER BY title'); },
    async getBook(slug) {
      const book = await db.prepare('SELECT id, slug, title, author FROM books WHERE slug = ? AND published = 1').bind(slug).first();
      if (!book) return null;
      return { ...book, chapters: await all('SELECT volume, chapter, title FROM chapters WHERE book_id = ? ORDER BY volume, chapter', book.id) };
    },
    async getProgress(userId, bookId) { return (await db.prepare('SELECT volume, chapter FROM reading_progress WHERE user_id = ? AND book_id = ?').bind(userId, bookId).first()) ?? null; },
    async setProgress(userId, bookId, position) { await db.prepare('INSERT INTO reading_progress (user_id, book_id, volume, chapter) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, book_id) DO UPDATE SET volume = excluded.volume, chapter = excluded.chapter').bind(userId, bookId, position.volume, position.chapter).run(); },
    async getStory(id) {
      const [characters, descriptions, portraits, relations, events] = await Promise.all([
        all('SELECT id, slug, name, volume, chapter FROM characters WHERE book_id = ?', id),
        all('SELECT descriptions.character_id, descriptions.volume, descriptions.chapter, descriptions.text FROM descriptions JOIN characters ON characters.id = descriptions.character_id WHERE characters.book_id = ? ORDER BY descriptions.volume, descriptions.chapter', id),
        all('SELECT portraits.id, portraits.character_id, portraits.volume, portraits.chapter, portraits.url FROM portraits JOIN characters ON characters.id = portraits.character_id WHERE characters.book_id = ? ORDER BY portraits.volume, portraits.chapter', id),
        all('SELECT id, source_id AS "from", target_id AS "to", volume, chapter, label FROM relations WHERE book_id = ?', id),
        all('SELECT id, volume, chapter, title, description FROM events WHERE book_id = ?', id),
      ]);
      return { characters: characters.map((character) => ({ ...character, descriptions: descriptions.filter((entry) => entry.character_id === character.id), portraits: portraits.filter((entry) => entry.character_id === character.id) })), relations, events };
    },
  };
}
