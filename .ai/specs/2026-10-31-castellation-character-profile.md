# Castellation Relationship Atlas - Character Profile

## TLDR

Proposed: make the chapter-bounded character profile portrait-led, with a clear reading boundary and direct paths into relationships. Apply the accepted Relationship Atlas v1 design while preserving existing profile URLs, 404 behavior and server filtering. This screen can ship independently of the [graph](2026-10-31-castellation-relationship-graph.md) and [homepage](2026-10-31-castellation-homepage.md).

## Problem Statement and Decisions in Play

The current hero can put a small portrait inside a connection panel instead of giving the character visual priority. The owner accepted a large portrait and character-first hierarchy in v1. This is an owner-led design requirement, not evidence that the current profile fails reader tasks.

[Product brief](product-brief.md) D01/D03/D04 supply the accepted direction; R01 protects chapter filtering, links, language and accessibility; N01 excludes literal library scenery. No decision is superseded. On 2026-10-31 the owner selected all four recommended implementation choices: separate screen specifications, existing portraits with an initial fallback, story-scoped homepage discovery and technical acceptance without a reader-research gate. This resolves the relevant parts of brief Q01 for this specification. A01 remains unvalidated; this document does not authorize implementation by itself.

## Proposed Solution and Research

Keep server-rendered Astro and the existing catalog response. Present the available portrait regardless of whether the character has relationships; pair it with the latest revealed description, chapter selector and relationship cards. Do not create a new biography service or copy the prototype's fixture content.

Primary-source review, 2026-10-31: [Open Library's Covers API](https://openlibrary.org/dev/docs/api/covers) treats missing imagery as an explicit condition and supports image-size variants. Engineering inference: image failure must be a normal profile state with reserved space. Castellation will reuse its current media contract, not add Open Library, new derivatives or a portrait-generation dependency. The [graph specification](2026-10-31-castellation-relationship-graph.md#proposed-solution-and-research) records the related graph-engine tradeoff.

## Architecture and Ownership

- Main change: `apps/web/src/pages/books/[slug]/characters/[character].astro`. Preserve its SSR API binding/environment resolution and HTTP statuses.
- Consume the opt-in `Layout.astro`, `SiteHeader.astro`, `SiteFooter.astro` variant and scoped `relationship-atlas.css` described in the graph specification. If delivered first, introduce only the minimal variant needed here; the later graph reuses it. Do not create a second theme or alter unrelated pages.
- Add a small `CharacterPortrait.astro` for actual HTML portrait consumers, using the domain's `selectPortrait` and a fixed frame with broken-image fallback. The graph's SVG representation may differ, but portrait eligibility must use the same canonical selector. No React hydration is needed for the page layout.
- Reuse `Breadcrumbs.astro`, `SharePanel.astro`, `LanguageSwitcher.astro` and existing profile/relation/map URLs. Keep Account and mobile navigation available. Do not redesign the separate character directory, book, relation or account pages.

## Data Model and API Contracts

No entity or schema changes, migrations or data-model graph. No new public API or private field is introduced.

The existing `GET /api/books/:slug` returns `{ book, progress, story }`. Resolve the profile by `character.slug` within `story.characters` only. Use its revealed `name`, `descriptions`, `portraits` and matching `story.relations`; each relation's endpoints must exist in the same response. `selectPortrait(character.portraits, progress)` chooses the latest eligible image independently of array order. Absent descriptions stay absent; do not invent roles, quotations or biography facts.

Both `volume` and `chapter`, when provided, must identify an existing positive-integer boundary; the API validates it. With neither parameter, retain the first chapter default. Do not automatically restore account or guest progress on profile entry. Use `book.positions` for chapter choices, displaying volume/chapter numbers rather than unrevealed chapter titles. Preserve the API public-field allowlist and the current `PUBLIC_API_URL` / Worker binding mechanism.

The profile's new chapter selector submits the same profile route with `lang`, `volume`, `chapter`; it is a view boundary and performs no progress PUT or localStorage write. The enhanced selector submits paired numeric values in a GET form with an explicit submit button. Provide native links for every valid position as the no-JavaScript alternative; each link includes both numeric parameters. Do not send a combined position value as `chapter` or require JavaScript to change the boundary. Changing position never navigates to another character automatically. All profile, relation and map links carry the effective response position and language.

Map entry may add `character=<slug>` to select the current character, or `relation=<id>` from a dedicated map action. These additive parameters are defined by the graph specification; the legacy map safely ignores them, so this profile does not depend on the redesigned renderer. Keep existing relation detail links as well. SharePanel retains its existing profile URL semantics and excludes private state.

Preserve titles and metadata: explicit reading-position profiles and unavailable characters remain noindex; default profiles retain the existing canonical/structured breadcrumb policy. Metadata must not contain later descriptions or portraits.

## UI/UX

Prototype: .ai/prototypes/relationship-atlas/README.md

Reference `castellation-relationship-atlas-v1`, accepted 2026-10-31, screen `atlas-character`, committed in `68f522f`; [acceptance](../prototypes/relationship-atlas/ACCEPTANCE.md), [manifest](../prototypes/relationship-atlas/source-manifest.json), [desktop](../prototypes/relationship-atlas/evidence/character-1440.png), [mobile](../prototypes/relationship-atlas/evidence/character-390.png). Preserve the accepted source and evidence unchanged.

- Use the accepted warm paper, forest green, burgundy accents and Playfair Display/DM Sans. Keep the large circular portrait, name, book context, boundary and map action in the first screen composition. Book information supports the character rather than taking over the hero.
- Keep the portrait large even when relationships exist. Existing catalog imagery may differ stylistically from the generated reference; matching composition and framing is required, regenerating assets is not. Failed/missing portraits show an initial with the same dimensions and accessible character name.
- Show each visible relationship's endpoints, direction and full label, with links to its detail and the other character. A self-relation has one character identity and must not create a misleading second-person link. Preserve access to all connections and other revealed characters; show an honest empty state when none exist.
- Desktop places portrait and identity together with supporting relationship content. Mobile stacks them using the accepted composition; chapter controls and map navigation remain readily reachable. Long names, translated labels and long descriptions wrap without clipping or page overflow.
- Keep a logical heading hierarchy, visible focus, labeled controls and text alternatives. Avoid duplicate spoken portrait names beside the same link label. Initials are not a substitute for the visible full name. No interaction is available only on hover or through color.
- Test WCAG 2.2 AA, including keyboard, focus visibility, contrast, reflow and target sizing. Prefer 44 px standalone controls; the actual [WCAG minimum and exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) remain the compliance reference. Respect reduced motion and font failure. Translate interface text into EN/PL; catalog names/descriptions retain their source language.

## Edge Cases and Failure Scenarios

| Trigger | Visible result / recovery |
|---|---|
| Character absent at the selected boundary | HTTP 404, localized unavailable message and links to the same story's map/cast at that boundary. Do not substitute Alice or reveal when the character appears. |
| Missing or withdrawn book | Preserve 404 and provide a Library link; no cached profile or media URL is emitted. |
| Invalid/incomplete position | Preserve 400 and offer an explicit link to the same profile's default position. Never silently advance or save progress. |
| API/network failure | Preserve 503, retain the requested URL and provide Retry plus site navigation. Do not display stale profile data as current. |
| Missing or failed portrait | Initial in the reserved frame; no request for later portraits, sprite-sheet fallback or retry loop. |
| No description / no relationships | Render identity and navigation without fabricated text; relationships have a distinct empty state. |
| Chapter changed backward | A full GET renders only the new server-filtered response, or the 404 state. Browser navigation preserves each URL's boundary; do not install a persistent profile cache. |

Known media URLs are publication-checked by the current API, not chapter-authorized. This change prevents undisclosed future URLs from entering the page; it does not retrofit access control on already known images.

## Acceptance and Validation

1. At 1440/390 px compare the representative profile to v1 with test-only fixture content; at 320/390/768/1440 px exercise real data and both languages. The portrait stays prominent with zero and many relationships. Verify 200% zoom, keyboard and screen-reader order, missing images/fonts and long content.
2. Extend `tests/e2e/character-trail.spec.js` and profile cases in `reader.spec.js`. Test same-boundary related-character/relation/map navigation, default-first-chapter entry despite saved later progress, valid-position navigation without JavaScript, 400/404/503, self-relations and language preservation.
3. Verify hidden names, descriptions and portrait URLs are absent from HTML, metadata and requested resources. Check latest eligible portrait selection, including unordered portraits, through the existing domain tests; add only uncovered regression cases.
4. Ensure one book-detail fetch per profile render; no per-relation/profile fan-out or graph-controller bundle. Reserve image dimensions, load the main portrait promptly and lazy-load secondary images. Using five warm runs on the same recorded browser/hardware, the median server-rendered HTML response time with a stubbed fixed-latency API must not exceed the pre-change baseline by more than 20%; inspect media transfer separately. This proposed regression budget is not a claim of measured current performance.
5. Run `npm test`, `npm run build:web`, then `npm run test:e2e`. Save implementation screenshots and accessibility/performance results in QA evidence. Previous prototype checks do not validate this implementation; reader research for A01 is not a release prerequisite.

## Risks and Impact Review

Catalog portrait quality and media size remain existing constraints. The initial fallback protects usability, not visual consistency of editorial assets. Chapter controls intentionally change the viewed profile, not saved reading progress; copy must make the distinction clear.

Rollback is a route/style revert without storage migration. Retain shared components if another shipped screen consumes them. Old profile/map/relation URLs remain valid, and rollback does not change user progress. No new dependency, CMS workflow, API change, asset generation, analytics or user-data collection is included.

## Specification Review

Independent fresh-context scope-cohesion review on 2026-10-31 raised one Medium finding: partial phase delivery was ambiguous with full acceptance. The Phasing section now requires existing protections and affected checks in every increment, and reserves complete v1 acceptance for all phases. The author also made no-JavaScript boundary navigation explicit. The independent reviewer rechecked the revision and confirmed that the finding was resolved, with no remaining scope blockers. This document review does not establish runtime, accessibility or performance results.

## Phasing

Phase 1 delivers the portrait-led profile against the current map. Phase 2 adds boundary/context navigation with existing contracts. Phase 3 completes acceptance evidence. Each increment is independently deployable only after its affected functional, responsive, accessibility and failure-state checks pass; existing 400/404/503 behavior must work from Phase 1, not wait for Phase 2. An intermediate increment is not acceptance of the complete v1 profile: that requires all three phases and the full acceptance criteria. Shared styling reuse does not require releasing all three screens together.

## Implementation Plan

### Phase 1 - Portrait-led profile

1. Apply or introduce the minimal scoped Atlas shell and portrait component; keep SSR routing, statuses, metadata and existing links. Verify build, default/explicit profile routes, navigation and an unchanged unrelated page.
2. Replace the hero and relationship presentation with the accepted hierarchy using real returned data. Verify prominent portrait with/without connections, missing-image fallback, long content and existing character-trail tests before shipping.

### Phase 2 - Boundary and contextual navigation

3. Add the chapter form, native position links and explicit map-context links while retaining relation-detail access. Test both languages, JavaScript-disabled submission, self-relations, saved-progress independence and the old map's compatibility.
4. Complete invalid/unavailable/error recovery and spoiler-safe metadata coverage. Verify earlier-chapter 404, 400/503 retry, no future media request and unchanged sharing behavior.

### Phase 3 - Acceptance evidence

5. Complete v1 visual comparisons, responsive and WCAG checks, and the performance regression measurement; run all validation commands. Document any untested accessibility conditions honestly and leave A01 unvalidated.
