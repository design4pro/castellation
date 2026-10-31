import { filterStory } from '../../../../packages/domain/src/catalog.js';

// Local review fixtures, adapted from early Wonderland scenes; not catalog evidence.
export const characters = [
  { id: 'alice', name: 'Alice', role: 'The curious traveller', chapter: 1, tile: 0, x: 47, y: 44, description: 'Curiosity brings Alice into an unfamiliar world. She tries to make sense of its inhabitants, one encounter at a time.' },
  { id: 'rabbit', name: 'White Rabbit', role: 'Always in a hurry', chapter: 1, tile: 1, x: 19, y: 18, description: 'A hurried rabbit catches Alice’s attention. His waistcoat and anxious manner make him an unusual guide into the unknown.' },
  { id: 'mouse', name: 'Mouse', role: 'A wary acquaintance', chapter: 2, tile: 2, x: 77, y: 17, description: 'Alice meets the Mouse in the pool of tears. Their conversation gets off to an uncertain start.' },
  { id: 'dodo', name: 'Dodo', role: 'An unexpected organiser', chapter: 3, tile: 3, x: 18, y: 72, description: 'Among the creatures gathered on the bank, the Dodo proposes an unusual way for everyone to get dry.' },
  { id: 'duck', name: 'Duck', role: 'A fellow traveller', chapter: 3, tile: 4, x: 66, y: 80, description: 'The Duck joins the company on the bank, listening and taking part in the conversation.' },
  { id: 'lory', name: 'Lory', role: 'A spirited companion', chapter: 3, tile: 5, x: 87, y: 48, description: 'The Lory is one of the creatures Alice encounters on the bank, with opinions of its own.' },
].map((person) => ({ ...person, volume: 1, portraits: [{ volume: 1, chapter: person.chapter, tile: person.tile }] }));

export const relations = [
  { id: 'follows', from: 'alice', to: 'rabbit', label: 'Follows', chapter: 1, x: 31, y: 30, detail: 'Alice follows the White Rabbit, drawn by his surprising appearance and hurried departure.' },
  { id: 'meets', from: 'alice', to: 'mouse', label: 'Meets', chapter: 2, x: 63, y: 29, detail: 'Alice and the Mouse meet in the pool of tears and begin a conversation.' },
  { id: 'race', from: 'alice', to: 'dodo', label: 'Joins the race', chapter: 3, x: 31, y: 58, detail: 'Alice takes part in the race proposed by the Dodo.' },
  { id: 'company', from: 'alice', to: 'duck', label: 'In company', chapter: 3, x: 56, y: 63, detail: 'Alice and the Duck are part of the gathering on the bank.' },
  { id: 'talks', from: 'alice', to: 'lory', label: 'Talks with', chapter: 3, x: 69, y: 45, detail: 'Alice and the Lory exchange words among the assembled creatures.' },
].map((relation) => ({ ...relation, volume: 1 }));

export function storyAt(chapter) {
  return filterStory({ characters, relations, events: [] }, { volume: 1, chapter });
}

export function pageLink(screen, chapter, character = 'alice') {
  return `${screen === 'home' ? '/' : `/${screen}/`}?chapter=${chapter}&character=${character}`;
}
