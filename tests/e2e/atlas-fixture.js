import { filterStory } from '../../packages/domain/src/catalog.js';

export function atlasFixture(count = 6, relationCount = 5) {
  const names = ['Alice', 'White Rabbit', 'Mouse', 'Dodo', 'Duck', 'Lory'];
  const characters = Array.from({ length: count }, (_, index) => ({
    id: `cast-${String(index).padStart(3, '0')}`,
    slug: index < 6 ? names[index].toLowerCase().replaceAll(' ', '-') : `cast-${index}`,
    name: names[index] || `Character ${index + 1}`,
    volume: 1, chapter: index < 2 ? 1 : 2,
    descriptions: [{ volume: 1, chapter: index < 2 ? 1 : 2, text: `Test-only chapter-visible description for ${names[index] || `Character ${index + 1}`}.` }],
    // Existing repository imagery exercises the media frame; it is not a character depiction.
    portraits: index % 5 === 2 ? [] : [{ volume: 1, chapter: index < 2 ? 1 : 2, url: '/images/alice-rabbit-hole.webp' }],
  }));
  const relations = count < 2 ? [] : Array.from({ length: relationCount }, (_, index) => ({
    id: `relation-${index}`, from: characters[index < 5 ? 0 : index % count].id,
    to: characters[index < 5 ? index % (count - 1) + 1 : (index * 7 + 1) % count].id,
    label: ['Follows', 'Meets', 'Joins the race', 'In company', 'Talks with'][index % 5], volume: 1, chapter: 2,
  }));
  return { characters, relations, events: [{ volume: 1, chapter: 2, title: 'Fixture chapter event', description: 'Test-only event.' }] };
}

export async function mockAtlas(page, { count = 6, relationCount = 5, mutate = () => {} } = {}) {
  const story = atlasFixture(count, relationCount);
  mutate(story);
  await page.route('**/api/progress/alices-adventures-in-wonderland', (route) => route.fulfill({ status: 401 }));
  await page.route('**/api/books/alices-adventures-in-wonderland?*', async (route) => {
    const chapter = Number(new URL(route.request().url()).searchParams.get('chapter'));
    await route.fulfill({ json: { book: { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', positions: [{ volume: 1, chapter: 1 }, { volume: 1, chapter: 2 }] }, progress: { volume: 1, chapter }, story: filterStory(story, { volume: 1, chapter }) } });
  });
}
