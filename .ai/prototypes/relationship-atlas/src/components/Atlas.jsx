import React, { useEffect, useRef, useState } from 'react';
import { pageLink, storyAt } from '../data.js';

function Mark() {
  return <svg viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="M18 4 4 30h28L18 4ZM4 30l14-10 14 10M18 4v16" stroke="currentColor" strokeWidth="1.3"/><circle cx="18" cy="4" r="3" fill="currentColor"/><circle cx="4" cy="30" r="3" fill="currentColor"/><circle cx="32" cy="30" r="3" fill="currentColor"/><circle cx="18" cy="20" r="3" fill="currentColor"/></svg>;
}

export function Portrait({ person, missing = false, className = '' }) {
  return <span className={`portrait ${className} ${missing ? 'portrait-missing' : ''}`} role="img" aria-label={missing ? `Portrait unavailable for ${person.name}` : `Illustrated portrait of ${person.name}`} style={missing ? {} : { backgroundPosition: `${(person.tile % 3) * 50}% ${Math.floor(person.tile / 3) * 100}%` }}>{missing && person.name.charAt(0)}</span>;
}

function Boundary({ chapter, setChapter }) {
  return <div className="boundary"><div className="boundary-copy"><span className="lock" aria-hidden="true">◇</span><div><strong>Your place in the story</strong><span>Only characters and connections revealed by this chapter.</span></div></div><label>Reading through <select value={chapter} onChange={(event) => setChapter(Number(event.target.value))} aria-label="Reading through chapter">{[1, 2, 3].map((number) => <option key={number} value={number}>Chapter {number}</option>)}</select></label></div>;
}

function Graph({ story, selected, onSelect, onRelation, compact = false, missing = false }) {
  const [zoom, setZoom] = useState(1);
  const [narrow, setNarrow] = useState(false);
  const viewport = useRef(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const update = () => setNarrow(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // The four-person preview has a distinct mobile composition to keep labels clear.
  const mobileNodes = { alice: [68, 53], rabbit: [22, 16], mouse: [78, 16], dodo: [22, 83] };
  const mobileEdges = { follows: [45, 34], meets: [73, 34], race: [45, 68] };
  const positioned = story.characters.map((person) => compact && narrow ? { ...person, x: mobileNodes[person.id][0], y: mobileNodes[person.id][1] } : person);
  const edges = story.relations.map((relation) => compact && narrow ? { ...relation, x: mobileEdges[relation.id][0], y: mobileEdges[relation.id][1] } : relation);
  const people = new Map(positioned.map((person) => [person.id, person]));
  useEffect(() => { if (viewport.current) viewport.current.scrollLeft = (viewport.current.scrollWidth - viewport.current.clientWidth) / 2; }, []);
  return <div className={`graph-frame ${compact ? 'graph-compact' : ''}`}>
    <div className="graph-corner"><span className="status-dot" /> A living atlas <span className="graph-count">{story.characters.length} characters</span></div>
    {!compact && <p className="map-mobile-hint">Swipe to explore the map, or <a href="#connections">read the connections below ↓</a></p>}
    <div className="graph-scroll" ref={viewport} tabIndex={0} aria-label="Relationship map. Scroll horizontally on small screens.">
      <div className="graph-world" style={{ width: `${zoom * 100}%`, minWidth: `${zoom * (compact ? 540 : 660)}px`, height: `${zoom * (compact ? 470 : 550)}px` }}>
        <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{edges.map((relation) => {
          const a = people.get(relation.from), b = people.get(relation.to);
          return <line key={relation.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={selected === relation.from || selected === relation.to ? 'line-active' : ''} />;
        })}</svg>
        {edges.map((relation) => <button type="button" className="edge-label" key={relation.id} style={{ left: `${relation.x}%`, top: `${relation.y}%` }} onClick={() => onRelation(relation)} aria-label={`${people.get(relation.from).name} ${relation.label.toLowerCase()} ${people.get(relation.to).name}`}>{relation.label}</button>)}
        {positioned.map((person) => <button type="button" className={`graph-person ${selected === person.id ? 'selected' : ''}`} key={person.id} style={{ left: `${person.x}%`, top: `${person.y}%` }} aria-label={`Select ${person.name}`} aria-pressed={selected === person.id} onClick={() => onSelect(person.id)}><Portrait person={person} missing={missing && person.id === 'mouse'} /><span className="node-name">{person.name}</span>{selected === person.id && <span className="selected-label">Selected</span>}</button>)}
      </div>
    </div>
    <div className="graph-bottom"><span><i /> Revealed connection</span>{!compact && <div className="zoom-controls"><button type="button" aria-label="Zoom out" disabled={zoom === 1} onClick={() => setZoom(Math.max(1, zoom - .25))}>−</button><button type="button" aria-label="Reset map zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button type="button" aria-label="Zoom in" disabled={zoom === 1.5} onClick={() => setZoom(Math.min(1.5, zoom + .25))}>+</button></div>}</div>
  </div>;
}

function StateMessage({ state, retry }) {
  return <div className="state-message" role={state === 'error' ? 'alert' : 'status'}><span className="eyebrow">The relationship atlas</span><h2>{state === 'loading' ? 'Gathering the connections…' : state === 'empty' ? 'A quiet page, for now.' : 'The atlas could not be loaded.'}</h2><p>{state === 'loading' ? 'Your selected chapter stays in place.' : state === 'empty' ? 'There are no connections available at this reading position.' : 'Your reading position is unchanged. Try loading the atlas again.'}</p>{state !== 'loading' && <button className="button" onClick={retry}>{state === 'empty' ? 'Return to available atlas' : 'Try again'}</button>}</div>;
}

export default function Atlas({ screen }) {
  const [chapter, updateChapter] = useState(3);
  const [selected, setSelected] = useState('alice');
  const [relation, setRelation] = useState(null);
  const [state, setState] = useState('normal');
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const value = Number(params.get('chapter'));
    const initialChapter = [1, 2, 3].includes(value) ? value : 3;
    updateChapter(initialChapter);
    const id = params.get('character');
    setSelected(storyAt(initialChapter).characters.some((person) => person.id === id) ? id : 'alice');
    setRelation(storyAt(initialChapter).relations.find((item) => item.id === params.get('relation')) || null);
    if (id && !storyAt(initialChapter).characters.some((person) => person.id === id)) setNotice('This character is not available at your selected chapter. Showing Alice instead.');
    setReady(true);
  }, []);
  const story = storyAt(chapter);
  const person = story.characters.find((item) => item.id === selected) || story.characters[0];
  const link = (page, id = person.id) => pageLink(page, chapter, id);
  function syncPosition(nextChapter, id) {
    history.replaceState(null, '', pageLink(screen, nextChapter, id));
  }
  function setChapter(value) {
    const id = storyAt(value).characters.some((item) => item.id === selected) ? selected : 'alice';
    setNotice(id !== selected ? 'Your selected character is not available at this chapter. Showing Alice instead.' : `Showing the story through chapter ${value}.`);
    updateChapter(value); setSelected(id); setRelation(null); syncPosition(value, id);
  }
  function choose(id) { setSelected(id); setRelation(null); syncPosition(chapter, id); }
  const blocked = ['loading', 'empty', 'error'].includes(state);
  const missing = state === 'missing';
  const matchedCharacters = story.characters.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const characterRelations = story.relations.filter((item) => item.from === person.id || item.to === person.id);
  const previewStory = { characters: story.characters.slice(0, 4), relations: story.relations.filter((item) => story.characters.slice(0, 4).some((entry) => entry.id === item.to)) };
  return <div data-prototype-id="castellation-relationship-atlas-v1" data-screen-id={`atlas-${screen}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><a href={link('home')} className="brand"><Mark /><span>Castellation<span className="brand-caption">A literary atlas</span></span></a><nav aria-label="Main navigation"><a href={link('home')} aria-current={screen === 'home' ? 'page' : undefined}>Discover</a><a href={link('home') + '#characters'}>Characters</a><a href={link('map')} aria-current={screen === 'map' ? 'page' : undefined}>The atlas <span aria-hidden="true">↗</span></a></nav></header>
    <main id="main">
      {!ready && <div className="page-shell"><StateMessage state="loading" /></div>}
      <p className="sr-only" role="status">{notice}</p>
      {ready && screen === 'map' && <div className="page-shell map-page">
        <a className="back-link" href={link('home')}>← Back to discovery</a>
        <div className="page-title"><div><p className="eyebrow">Lewis Carroll / Alice’s Adventures in Wonderland</p><h1>Every connection<br className="mobile-break" /> tells a story.</h1></div><p className="title-aside">Follow a familiar face.<br />Discover where the story leads.</p></div>
        <Boundary chapter={chapter} setChapter={setChapter} />
        {blocked ? <StateMessage state={state} retry={() => setState('normal')} /> : <>
          <div className="workspace"><Graph story={story} selected={person.id} onSelect={choose} onRelation={setRelation} missing={missing} /><aside className="inspector" aria-label="Selection details" aria-live="polite">
            {relation ? <><p className="eyebrow">A connection / Chapter {relation.chapter}</p><div className="paired-portraits">{[relation.from, relation.to].map((id) => <Portrait key={id} person={story.characters.find((item) => item.id === id)} />)}</div><h2>{relation.label}</h2><p className="relation-names">{story.characters.find((item) => item.id === relation.from).name} <span aria-hidden="true">→</span> {story.characters.find((item) => item.id === relation.to).name}</p><p>{relation.detail}</p><button className="text-button" onClick={() => setRelation(null)}>Return to {person.name} <span aria-hidden="true">↗</span></button></> : <><p className="eyebrow">In the atlas / No. {String(story.characters.indexOf(person) + 1).padStart(2, '0')}</p><Portrait person={person} missing={missing && person.id === 'mouse'} className="inspector-portrait" /><h2>{person.name}</h2><p className="person-role">{person.role}</p><p>{state === 'long' ? `${person.description} Every new encounter invites a different interpretation of this unfamiliar place, and the words exchanged can be as revealing as the meeting itself.` : person.description}</p><div className="inspector-meta"><span>First encountered</span><strong>Chapter {person.chapter}</strong></div><a className="button" href={link('character')}>Meet {person.name} <span aria-hidden="true">↗</span></a></>}
          </aside></div>
          <section className="connections-section" id="connections"><div className="section-heading"><div><p className="eyebrow">Another way to read the atlas</p><h2>Connections, in words.</h2></div><span className="small-muted">Through chapter {chapter}</span></div><div className="connection-list">{story.relations.map((item) => <button key={item.id} onClick={() => { setRelation(item); document.querySelector('.inspector')?.scrollIntoView({ behavior: 'instant', block: 'nearest' }); }}><span>{story.characters.find((entry) => entry.id === item.from).name}</span><em>{item.label.toLowerCase()}</em><span>{story.characters.find((entry) => entry.id === item.to).name}</span><span aria-hidden="true">↗</span></button>)}</div></section>
        </>}
      </div>}
      {ready && screen === 'home' && <div className="page-shell home-page">
        <section className="home-hero"><div className="hero-copy"><p className="eyebrow">The stories you know. The connections you find.</p><h1>A world<br />between<br /><em>characters.</em></h1><p className="hero-intro">Meet the people behind the pages.<br />Trace their connections, at your own pace.</p><a className="button hero-action" href={link('map')}>Explore the atlas <span aria-hidden="true">↗</span></a><a className="hero-secondary" href="#characters">Or begin with a character <span aria-hidden="true">↓</span></a><div className="hero-footnote"><span className="rule-number">01</span><span>Alice’s Adventures in Wonderland<br /><small>Lewis Carroll · Through chapter {chapter}</small></span></div></div>
          <div className="hero-atlas">{blocked ? <StateMessage state={state} retry={() => setState('normal')} /> : <><Graph story={previewStory} selected={previewStory.characters.some((item) => item.id === person.id) ? person.id : 'alice'} onSelect={choose} onRelation={(item) => { location.href = link('map', item.from) + `&relation=${item.id}`; }} compact missing={missing} /><div className="hero-atlas-caption"><span>A glimpse of Wonderland’s connections</span><a href={link('character')}>Meet {person.name} <span aria-hidden="true">↗</span></a></div></>}</div>
        </section>
        <Boundary chapter={chapter} setChapter={setChapter} />
        <section className="character-directory" id="characters"><div className="section-heading"><div><p className="eyebrow">Faces from the story</p><h2>Begin with someone.</h2></div><label className="search-field"><span className="sr-only">Find a character</span><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a character" /></label></div><p className="directory-context">Alice’s Adventures in Wonderland <span>· Chapter {chapter}</span></p>
          <div className="portrait-directory">{matchedCharacters.map((item, index) => <a className="directory-entry" href={link('character', item.id)} key={item.id}><Portrait person={item} missing={missing && item.id === 'mouse'} /><div><span className="eyebrow">{String(index + 1).padStart(2, '0')} / Character</span><h3>{item.name}</h3><p>{item.role}</p></div><span aria-hidden="true">↗</span></a>)}</div>
          <p className="search-status" role="status">{query ? `${matchedCharacters.length} ${matchedCharacters.length === 1 ? 'character' : 'characters'} found` : `${story.characters.length} characters revealed through chapter ${chapter}`}</p>{!matchedCharacters.length && <div className="no-results"><h3>No character matches “{query}”.</h3><p>Try a different name among the characters revealed so far.</p><button className="text-button" onClick={() => setQuery('')}>Clear search</button></div>}
        </section>
        <section className="reading-note"><div><p className="eyebrow">Your reading, your pace</p><h2>Stay curious.<br /><em>Keep the surprises.</em></h2></div><div><p>The atlas follows your place in the story. Choose your chapter to see the characters and relationships you have reached, with later discoveries kept out of view.</p><a className="text-button" href={link('map')}>Find your place in the atlas <span aria-hidden="true">↗</span></a></div></section>
      </div>}
      {ready && screen === 'character' && <div className="page-shell character-page">
        <a className="back-link" href={link('map')}>← Back to the atlas</a>
        <Boundary chapter={chapter} setChapter={setChapter} />
        {blocked ? <StateMessage state={state} retry={() => setState('normal')} /> : <><section className="character-hero"><div className="portrait-plate"><p className="eyebrow">A character study / {String(story.characters.indexOf(person) + 1).padStart(2, '0')}</p><Portrait person={person} missing={missing && person.id === 'mouse'} className="profile-portrait" /><span className="plate-caption">Alice’s Adventures in Wonderland</span></div><div className="character-copy"><p className="eyebrow">Lewis Carroll / Through chapter {chapter}</p><h1 className={state === 'long' ? 'long-name' : undefined}>{state === 'long' ? `${person.name}, a curious traveller in an unfamiliar world` : person.name}</h1><p className="character-subtitle">{person.role}</p><p className="character-description">{person.description}</p><dl className="character-facts"><div><dt>First encountered</dt><dd>Chapter {person.chapter}</dd></div><div><dt>Known connections</dt><dd>{characterRelations.length} {characterRelations.length === 1 ? 'relationship' : 'relationships'}</dd></div></dl><a className="button" href={link('map')}>Find {person.name} in the atlas <span aria-hidden="true">↗</span></a></div></section>
          <section className="character-connections"><div className="section-heading"><div><p className="eyebrow">The people around {person.name}</p><h2>A story told through others.</h2></div><a className="text-button" href={link('map')}>View the full atlas ↗</a></div><div className="relationship-cards">{characterRelations.map((item) => {
            const other = story.characters.find((entry) => entry.id === (item.from === person.id ? item.to : item.from));
            return <article key={item.id}><a className="relation-person" href={link('character', other.id)}><Portrait person={other} missing={missing && other.id === 'mouse'} /><div><p className="eyebrow">Chapter {item.chapter}</p><h3>{other.name}</h3></div><span aria-hidden="true">↗</span></a><p className="relation-caption">{story.characters.find((entry) => entry.id === item.from).name} <em>{item.label.toLowerCase()}</em> {story.characters.find((entry) => entry.id === item.to).name}</p><p>{item.detail}</p><a className="text-button" href={link('map') + `&relation=${item.id}`}>See this connection ↗</a></article>;
          })}</div></section><aside className="boundary-note"><span aria-hidden="true">◇</span><p>This portrait and description reflect your selected chapter. Later discoveries stay out of view.</p><span>Chapter {chapter}</span></aside></>}
      </div>}
    </main>
    <footer className="site-footer"><span>Castellation</span><p>Characters. Connections. One chapter at a time.</p><span className="footer-mark" aria-hidden="true">C.</span></footer>
    <details className="review-tools"><summary>Design review · v1 <span>Local concept</span></summary><div><p>Fictional review fixtures and generated portrait studies. No account, API or saved reading progress. Screen: <strong>atlas-{screen}</strong>.</p><label>Simulated state <select value={state} onChange={(event) => setState(event.target.value)}><option value="normal">Normal</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Request failed</option><option value="missing">Missing Mouse portrait</option><option value="long">Long content</option></select></label><button onClick={() => { setState('normal'); setQuery(''); }} className="text-button">Reset simulation</button></div></details>
  </div>;
}
