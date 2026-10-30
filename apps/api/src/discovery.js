import { validateSourceUrl } from './ingestion.js';

export async function discoverBooks(fetcher = fetch) {
  const response = await fetcher('https://gutendex.com/books/?copyright=false&languages=en');
  if (!response.ok) throw new Error(`Discovery failed: ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.results)) throw new Error('Invalid discovery response');
  return payload.results.flatMap((book) => {
    if (book.copyright !== false || !Number.isSafeInteger(book.id) || typeof book.title !== 'string') return [];
    const url = Object.entries(book.formats ?? {}).find(([type, value]) => type.startsWith('text/plain') && typeof value === 'string' && validateSourceUrl(value))?.[1];
    if (!url) return [];
    return [{ id: `gutenberg-${book.id}`, title: book.title, author: book.authors?.map((author) => author.name).filter(Boolean).join(', ') || 'Unknown', url, rightsVerified: false }];
  });
}
