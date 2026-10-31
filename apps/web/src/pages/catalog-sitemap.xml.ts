import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

type Book = { slug: string; author: string };
export const GET: APIRoute = async ({ url }) => {
  try {
    const api = import.meta.env.PUBLIC_API_URL;
    const request = (path: string) => api ? fetch(`${api}${path}`) : env.API.fetch(new Request(`${url.origin}${path}`));
    const catalog = await request('/api/books');
    if (!catalog.ok) throw new Error('Catalog unavailable');
    const { books } = await catalog.json() as { books: Book[] };
    const paths = new Set(['/', '/library', '/how-it-works', '/help', '/our-method', '/guides', '/reading-paths', '/guides/track-characters', '/guides/lewis-carroll-and-alice', '/guides/alice-down-the-rabbit-hole', '/guides/book-club-questions', '/guides/two-unexpected-beginnings', '/guides/alice-and-the-white-rabbit', '/guides/reading-character-connections', '/guides/choose-your-next-classic']);
    const details = await Promise.all(books.map(async (book) => {
      const path = `/books/${encodeURIComponent(book.slug)}`;
      const response = await request(`/api/books/${encodeURIComponent(book.slug)}`);
      if (!response.ok) throw new Error('Book unavailable');
      return { book, path, data: await response.json() };
    }));
    if (details.some(({ data }) => data.story.characters.length > 0)) paths.add('/characters');
    for (const { book, path, data } of details) {
      paths.add(path);
      paths.add(`${path}/characters`);
      paths.add(`${path}/map`);
      if (data.story.relations.length) paths.add(`${path}/connections`);
      if (book.author) paths.add(`/authors/${encodeURIComponent(book.author)}`);
      if (data.book.chapters.some((chapter: { volume: number; chapter: number }) => chapter.volume === data.progress.volume && chapter.chapter === data.progress.chapter)) paths.add(`${path}/opening`);
      const laterChapters = await Promise.all(data.book.positions.slice(1).map(async (position: { volume: number; chapter: number }) => {
        const response = await request(`/api/books/${encodeURIComponent(book.slug)}?volume=${position.volume}&chapter=${position.chapter}`);
        if (!response.ok) throw new Error('Chapter unavailable');
        const chapterData = await response.json();
        return chapterData.story.events.some((event: { volume: number; chapter: number }) => event.volume === position.volume && event.chapter === position.chapter) ? `${path}/chapters/${position.volume}-${position.chapter}` : null;
      }));
      for (const chapterPath of laterChapters) if (chapterPath) paths.add(chapterPath);
      for (const relation of data.story.relations) paths.add(`${path}/relations/${encodeURIComponent(relation.id)}`);
      if (data.story.characters.length) paths.add(`${path}/reading-sheet`);
      for (const character of data.story.characters) paths.add(`${path}/characters/${encodeURIComponent(character.slug)}`);
    }
    const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const entries = [...paths].map((path) => `<url><loc>${escapeXml(new URL(path, url.origin).href)}</loc></url>`).join('');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
