export async function generatePortrait(ai, media, { key, description }) {
  if (!description?.trim()) throw new Error('A source description is required');
  const model = '@cf/black-forest-labs/flux-1-schnell';
  const result = await ai.run(model, { prompt: `Literary character portrait, elegant illustrated collectible card, muted sage and warm parchment palette, consistent editorial illustration style, no text. Character appearance: ${description.trim()}` });
  if (typeof result?.image !== 'string') throw new Error('Image generation returned no image');
  const bytes = Uint8Array.from(atob(result.image), (character) => character.charCodeAt(0));
  await media.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
  return { key, model };
}

export async function portraitCandidates(sourceId, chapters) {
  const { characterId } = await import('./publication.js');
  const history = new Map();
  const candidates = [];
  for (const chapter of chapters) {
    for (const item of chapter.analysis.characters) {
      const appearance = item.appearance.trim();
      if (!appearance) continue;
      const id = await characterId(sourceId, item.name);
      const previous = history.get(id) ?? [];
      if (previous.length >= 10 || previous.at(-1) === appearance.toLocaleLowerCase('en-US')) continue;
      previous.push(appearance.toLocaleLowerCase('en-US'));
      history.set(id, previous);
      candidates.push({ id:`${id}-${chapter.number}`, characterId:id, chapter:chapter.number, description:appearance, evidence:item.evidence });
    }
  }
  return candidates;
}
