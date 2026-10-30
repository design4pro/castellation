import { visibleAt } from '../../../packages/domain/src/catalog.js';

const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' } });
const publicBook = ({ id, slug, title, author }) => ({ id, slug, title, author });

function progressFrom(url, chapters) {
  const volume = url.searchParams.get('volume');
  const chapter = url.searchParams.get('chapter');
  if (volume === null && chapter === null) return chapters[0] ?? null;
  if (!volume || !chapter || !/^[1-9]\d*$/.test(volume) || !/^[1-9]\d*$/.test(chapter)) return null;
  return chapters.find((entry) => entry.volume === Number(volume) && entry.chapter === Number(chapter)) ?? null;
}

function publicStory(story, progress, origin) {
  const characters = story.characters.filter((item) => visibleAt(item, progress)).map((item) => ({
    id: item.id, slug: item.slug, name: item.name, volume: item.volume, chapter: item.chapter,
    descriptions: item.descriptions.filter((description) => visibleAt(description, progress)).map(({ volume, chapter, text }) => ({ volume, chapter, text })),
    portraits: item.portraits.filter((portrait) => visibleAt(portrait, progress)).map(({ id, volume, chapter, url }) => ({ id, volume, chapter, url: new URL(url, origin).href })),
  }));
  const ids = new Set(characters.map((item) => item.id));
  return {
    characters,
    relations: story.relations.filter((item) => visibleAt(item, progress) && ids.has(item.from) && ids.has(item.to)).map(({ id, from, to, volume, chapter, label }) => ({ id, from, to, volume, chapter, label })),
    events: story.events.filter((item) => visibleAt(item, progress)).map(({ id, volume, chapter, title, description }) => ({ id, volume, chapter, title, description })),
  };
}

export async function handleRequest(request, repository) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (url.pathname === '/api/books') return json({ books: (await repository.listBooks()).map(publicBook) });
  const match = /^\/api\/books\/([a-z0-9-]+)$/.exec(url.pathname);
  if (!match) return json({ error: 'Not found' }, 404);
  const book = await repository.getBook(match[1]);
  if (!book) return json({ error: 'Not found' }, 404);
  const progress = progressFrom(url, book.chapters);
  if (!progress) return json({ error: 'Invalid reading position' }, 400);
  return json({ book: { ...publicBook(book), chapters: book.chapters.filter((chapter) => visibleAt(chapter, progress)), positions: book.chapters.map(({ volume, chapter }) => ({ volume, chapter })) }, progress: { volume: progress.volume, chapter: progress.chapter }, story: publicStory(await repository.getStory(book.id), progress, url.origin) });
}
