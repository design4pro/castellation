/** Returns whether an item has been revealed at the reader's position. */
export function visibleAt(item, progress) {
  return item.volume < progress.volume || (item.volume === progress.volume && item.chapter <= progress.chapter);
}

/** Selects the most recently revealed portrait, or null when none is visible. */
export function selectPortrait(portraits, progress) {
  return portraits.filter((portrait) => visibleAt(portrait, progress)).reduce((latest, portrait) => {
    if (!latest || portrait.volume > latest.volume || (portrait.volume === latest.volume && portrait.chapter > latest.chapter)) return portrait;
    return latest;
  }, null);
}

/** Filters a story before it is returned to an untrusted client. */
export function filterStory(story, progress) {
  const characters = story.characters.filter((character) => visibleAt(character, progress)).map((character) => ({
    ...character,
    portraits: character.portraits.filter((portrait) => visibleAt(portrait, progress)),
  }));
  const visibleCharacters = new Set(characters.map((character) => character.id));
  return {
    characters,
    relations: story.relations.filter((relation) => visibleAt(relation, progress) && visibleCharacters.has(relation.from) && visibleCharacters.has(relation.to)),
    events: story.events.filter((event) => visibleAt(event, progress)),
  };
}
