# Castellation Relationship Atlas - Homepage

## TLDR

Proposed: replace the bookcase-led homepage with a portrait-led relationship preview and character discovery for one selected story. Readers can choose a story, set a viewing boundary, find a revealed character and open the existing profile or map. This capability ships independently of the linked [graph](2026-10-31-castellation-relationship-graph.md) and [character profile](2026-10-31-castellation-character-profile.md).

## Problem Statement and Decisions in Play

The owner accepted the Relationship Atlas homepage to make characters and relationships the visual subject, with typography and color providing the old-library atmosphere. This corrects an owner-identified direction mismatch; it does not establish better reader comprehension or conversion.

[Product brief](product-brief.md) D01, D03 and D04 govern the design; R01 protects existing behavior and N01 excludes literal library navigation. A01 remains unvalidated. No decision is superseded. The owner answered Q1-Q4 of the implementation skeleton on 2026-10-31: three specifications; existing catalog portraits and initial fallback; first available catalog story with a story switcher and story-scoped search; visual/accessibility/functional/performance acceptance without reader research as a gate. These answers resolve the corresponding scope and acceptance questions in brief Q01. They do not authorize automatic coding or deployment.

## Proposed Solution and Research

Keep Astro SSR for the first useful page. Fetch the catalog and exactly one selected story for the discovery surface. Render a small real relationship preview and search the returned character names. Keep the existing return-to-saved-stories feature as a supporting section, separate from discovery.

Primary-source review, 2026-10-31: [Open Library's Search API](https://openlibrary.org/dev/docs/api/search) supports field selection and pagination and warns that requesting every field is expensive. Engineering inference: bound homepage discovery to one story response and avoid catalog-wide detail fan-out. Full-catalog indexing, relevance ranking and external search integration are unnecessary for the owner's chosen scope. The [graph research](2026-10-31-castellation-relationship-graph.md#proposed-solution-and-research) supports deterministic preview geometry without adopting a graph engine.

## Architecture and Ownership

- Change `apps/web/src/pages/index.astro`; remove its bookcase-led hero use, not `Bookcase.astro` or the separate Library experience. Replace the two-book character teaser with selected-story discovery, as explicitly chosen by the owner.
- Consume the opt-in Atlas layout/header/footer and scoped stylesheet defined in the graph specification. If this ships first, implement only the shell required here; later screens reuse it. Preserve Library, Guides, How it works, Account, language switching and mobile navigation.
- Reuse `CharacterPortrait.astro` if already introduced, otherwise create it for these HTML portraits using `selectPortrait`. A small static SVG/HTML preview can reuse pure geometry when useful; it must not initialize the map's progress-saving controller or ship the prototype React application.
- Keep the existing resume behavior from `index.astro`, with accessible text links styled for the new page. Isolate its asynchronous failures from discovery. It remains a reader capability, not a decorative bookshelf. Do not redesign account/progress services in this specification.
- No changes to mobile, CMS, public API, dependencies, editorial featured-story configuration or other page designs. Existing map/profile routes make this screen useful before either sibling redesign ships.

## Data Model and API Contracts

No new entities, storage or migration; no data-model diagram is needed. Use existing `GET /api/books` (`books` with `id`, `slug`, `title`, `author`) and `GET /api/books/:slug` (`book`, `progress`, filtered `story`). API publication filtering remains authoritative. Do not import prototype fixtures or a complete story into the production client.

### Discovery URL and selection

| Input | Behavior |
|---|---|
| No `book` parameter | Select the first entry returned by the published catalog. Current repository ordering is by title; the homepage does not create an editorial ranking. |
| `book=<slug>` | Match a returned catalog slug before fetching detail. Unknown/withdrawn selection shows an unavailable state and explicit choice of an available story, not silent substitution. |
| No reading position | Fetch the chosen book without position parameters and use its returned first valid position. Never hard-code chapter 3 or assume every book begins at volume 1/chapter 1. |
| `volume` and `chapter` | Pass both through API validation, as on existing reader pages; the chosen boundary must exist. Invalid/incomplete positions produce a recoverable error, not an automatic later boundary. |
| `q` | Search revealed character names only within the selected story and boundary. Trim outer whitespace, use Unicode-normalized case-insensitive substring matching; preserve accents. Empty query shows all returned characters. No cross-book or future-character lookup. |
| `lang` | Preserve the current `pl`/default `en` convention and carry it through forms and links. Catalog content retains its source language. |

Use GET forms so story selection, boundary selection and submitted search work without JavaScript. Story changes preserve language and reset the query and position to the newly selected story's first boundary; an explicit later choice is then available. Boundary changes preserve `book`, `lang` and `q`. Search/Clear preserve `book`, language and effective boundary. Use native valid-position links as the no-JavaScript fallback if a combined boundary selector needs enhancement to submit both numeric parameters. Never serialize a combined value to the protected API as `chapter`.

A small progressive enhancement may filter the already returned names while typing, without API calls per keystroke; the submitted GET URL is authoritative on reload. Escape query text and construct links with URL APIs. Keep query out of links to profiles, maps and external resources. Explicit `book`, search or reading-boundary homepage variants are noindex; the default page retains the existing localized canonical/alternate policy. Do not change global metadata rules for other routes.

All character/profile/map links contain the chosen slug, response `volume`, `chapter` and language. Optionally add `character` to map links as defined in the graph specification; the old map ignores it safely. Opening a map from discovery must not unexpectedly restore a later saved chapter. Viewing/searching/changing the homepage boundary does not write account or guest progress.

### Preserve return to saved stories

The existing client-only section uses credentialed progress reads and separate browser storage. Retain its semantics: successful account lookup uses account positions; 401/network/5xx can use clearly labeled separate device copies; other denied responses do not expose a fallback as account data. Validate candidates against published book-detail responses before rendering their links. Hide unavailable/invalid candidates and retain links for valid ones. No progress PUT, account/guest merging or private state in SSR/shared URLs.

These existing resume lookups may touch several stories; the two-request discovery budget does not falsely include them. Do not use their data to alter the public discovery hero, its selected boundary or search index. Preserve `reader.spec.js` account/device resume behavior, including an account position taking precedence over a later guest position.

## UI/UX

Prototype: .ai/prototypes/relationship-atlas/README.md

Use accepted `castellation-relationship-atlas-v1`, screen `atlas-home`, accepted 2026-10-31 and committed in `68f522f`; [acceptance](../prototypes/relationship-atlas/ACCEPTANCE.md), [manifest](../prototypes/relationship-atlas/source-manifest.json), [desktop](../prototypes/relationship-atlas/evidence/home-1440.png), [mobile](../prototypes/relationship-atlas/evidence/home-390.png). Preserve that version unchanged.

- Match the editorial headline, generous paper surfaces, Playfair Display/DM Sans, forest actions and burgundy highlights. The primary hero visual is a small portrait graph; books supply its context. Existing account and return-to-story controls are necessary production additions to the simplified concept.
- Display the selected story, an explicit viewing boundary and story switcher next to discovery controls. Search says which story it searches. Explain that changing this view does not save reading progress.
- Preview at most four revealed characters, ordered by introduction volume/chapter then stable ID. Render only actual returned relations whose endpoints are in that subset. Do not fabricate a star graph for composition. One character or disconnected characters remain honest previews; no relationships produces a visible explanation and map link when a story exists. The preview is not presented as the entire cast or a complete graph.
- Portrait links open the corresponding profile; a clear Explore the atlas action opens the selected story map. Provide an equivalent textual list of preview characters and connections. Do not implement a second map inspector, zoom tool or progress persistence on the homepage.
- Search results expose every matching revealed character with a portrait/initial, name and same-boundary profile link. No-results copy says no match at this boundary, without suggesting that a hidden character exists later. Clear search restores the selected story's visible cast.
- Reuse existing individual portrait URLs, latest eligible `selectPortrait` result and stable frames. Missing/broken images become initials; no generated sprite or new portrait generation. Lazy-load results below the fold, prioritize the small hero images and avoid image prefetch for other stories.
- Use the distinct mobile preview composition from v1, not a squeezed desktop graph. Preserve content order and readable labels at 320/390/768/1440 px, with no page-level horizontal overflow. Long story/character names wrap.
- EN/PL interface copy, visible focus, labeled forms, live result-count announcements only on user changes, reduced motion and logical headings are required. Provide keyboard and screen-reader access without dependence on graph interpretation. Test WCAG 2.2 AA; aim for 44 px standalone controls and assess the actual [target-size criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), contrast, reflow and focus visibility.

The old promotional bookcase/ticker/fictional encounter composition is replaced, while existing guide, Library and account destinations remain reachable through the retained shell. Do not remove those routes or their page content.

## Edge Cases and Failure Scenarios

| Trigger | Visible result / recovery |
|---|---|
| Empty published catalog | Honest empty state and site navigation; no fake characters, first-book exception or enabled dead map link. |
| Catalog failure | Distinguish failure from an empty catalog; Retry keeps requested query/language. Retain a usable public page shell rather than changing existing homepage availability semantics. |
| Selected detail request fails | Retry same story and parameters; switcher remains usable. Do not silently fetch each catalog book until one succeeds. |
| Story withdrawn between list and detail | Unavailable state with explicit story selection; do not retain its graph/results. |
| Invalid boundary / no revealed characters | Separate invalid-input recovery from a valid empty cast. Offer an explicit reset to the selected story's first boundary. |
| Request ordering with enhancement | Clear previous discovery content during story/boundary loading; only the latest response may render. The simpler SSR navigation path needs no parallel client request machinery. |
| Resume service/storage failure | Hide invalid resume entries or retain a correctly labeled valid device fallback under existing rules; public discovery stays available. Never claim a save occurred. |
| Search, image or font edge cases | Query is escaped, no-match is recoverable, initial/font fallbacks preserve geometry. No hidden character/portrait names enter DOM or search data. |

## Acceptance and Validation

1. Compare to v1 at 1440/390 px with test-only representative fixtures, then verify real catalog/EN/PL and missing assets at 320/390/768/1440 px. Include keyboard, screen-reader and 200% zoom checks. Compare composition and hierarchy, not equality of production portraits with the fictional sheet.
2. Update `home-cast.spec.js` deliberately: its former two-book teaser expectation becomes one selected story, switcher and scoped search. Replace homepage bookshelf assertions in `bookshop.spec.js` with equivalent real-catalog navigation, keyboard, language and JavaScript-disabled checks; retain separate Library bookshelf coverage wherever applicable. Do not simply delete the protected behaviors with the old markup.
3. Retain account/device resume tests in `reader.spec.js`; add first-story ordering, unknown story, non-1 initial position, same-name characters in different stories, backward boundary, API failure, query escaping and search recovery cases. Verify later saved progress does not change discovery or explicit outgoing links.
4. Assert initial discovery makes one catalog and one selected detail fetch, zero detail fetch for an invalid selection/empty catalog and no search-per-keystroke network requests. Measure resume traffic separately. No hidden portraits/names in HTML/search resources, prototype sprite download, graph controller or React runtime added for discovery.
5. For a deterministic 100-character selected-story fixture, measure five warm runs in the same recorded Chromium/hardware setup: median client search input-to-painted-result update at most 100 ms when enhancement exists. Without enhancement, require one GET submission and the same two discovery API calls. Reserve image frames and verify no portrait-induced layout shift; record actual image transfer sizes rather than claiming a new thumbnail service.
6. Run `npm test`, `npm run build:web`, then `npm run test:e2e`. Save implementation visual, accessibility and performance evidence. Prototype QA is not implementation evidence, and A01 reader benefit remains unproven rather than a release gate.

## Risks and Impact Review

First-catalog ordering is deterministic under the current repository query, not editorial judgment; catalog publication/title changes can change the default story. A sparse opening chapter can produce a modest graph: correctness takes precedence over invented connections. Individual portrait assets may be larger or visually less consistent than the concept; measure that cost without broadening this scope to asset production.

Rollback reverts only this page's presentation/discovery code and Atlas opt-in. New homepage query parameters are additive and the previous homepage can ignore them; book/profile/map links remain compatible. Retain shared primitives used by other shipped screens. No data migration or progress rollback is needed because the new discovery controls perform no writes. No global search, CMS feature flags, editorial workflow, analytics or reader-research project is included.

## Specification Review

Independent fresh-context scope-cohesion review on 2026-10-31 found no blocking scope findings. The author checked selected-story isolation, preserved resume behavior, protected contracts, rollback and testable steps against repository sources. This is a document review, not runtime, accessibility or performance verification.

## Phasing

Phase 1 supplies real selected-story discovery in the accepted visual shell. Phase 2 completes search and navigation while preserving resume behavior. Phase 3 validates the delivered homepage. Other screens may keep their existing designs throughout.

Each increment is independently deployable only after its affected functional, responsive, accessibility and failure-state checks pass. Existing protections remain mandatory in every phase. Full v1 acceptance requires all phases and the complete acceptance criteria; intermediate deployment is not completion of this specification.

## Implementation Plan

### Phase 1 - Selected-story discovery

1. Add/reuse the scoped Atlas shell and replace the hero with real first-story data and a four-character preview. Keep resume, navigation and working profile/map links. Test empty/failing catalog, first-position semantics, no future imagery and unchanged unrelated pages.
2. Add explicit story and boundary GET controls with unavailable/invalid recovery and stable portrait fallbacks. Verify language, multi-volume context, no-JavaScript operation and switching without progress writes before shipping.

### Phase 2 - Character discovery and continuity

3. Add story-scoped GET search, clear action and optional local filtering; share one matching rule between SSR and enhancement. Test no-results, escaped input, duplicate names across stories, same-boundary outgoing links and network limits.
4. Complete the supporting resume presentation without changing its data-selection semantics. Verify real account and guest flows, denied/failing service cases, publication validation and independence of the hero from saved progress.

### Phase 3 - Acceptance evidence

5. Complete v1 comparisons, responsive/translation/WCAG checks and performance measurements. Update replaced homepage-specific tests while retaining their functional guarantees; run all validation commands and record evidence without asserting A01 is validated.
