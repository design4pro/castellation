# Castellation Relationship Atlas - Relationship Graph

## TLDR

Proposed: replace the map's initial-only nodes with prominent chapter-visible portraits and the accepted Relationship Atlas v1 composition. Readers retain chapter controls, character and relationship inspection, sharing and separate account/guest progress. This specification delivers the graph independently of the [character profile](2026-10-31-castellation-character-profile.md) and [homepage](2026-10-31-castellation-homepage.md).

## Problem Statement and Decisions in Play

The owner's rejection of the current presentation and acceptance of v1 establish a design requirement, not measured reader benefit. [Product brief](product-brief.md) D01, D03 and D04 govern the visual direction; R01 protects existing behavior; N01 excludes a literal library interior. A01 remains unvalidated. No existing decision is superseded.

On 2026-10-31, the owner answered the implementation skeleton's Q1-Q4: three linked specifications; existing catalog portraits with an initial fallback; homepage discovery scoped to the first available or explicitly selected story; technical acceptance without reader research as a release gate. These decisions resolve the relevant implementation questions behind brief Q01 for this scope. They authorize specification work, not automatic implementation or deployment.

## Proposed Solution and Research

Retain the existing SVG renderer and browser controller. Use deterministic positions, substantial circular portraits, named edges and a contextual inspector. A new graph engine or React application is unnecessary for this change.

Primary-source review, 2026-10-31: [Cytoscape.js preset layouts](https://js.cytoscape.org/#layouts/preset) separate explicit node positions from rendering; [Sigma.js rendering](https://www.sigmajs.org/concepts/rendering/) uses WebGL for large graph visualization. Engineering inference: borrow stable layout separation, but preserve accessible SVG/HTML and measure this workload before considering an engine migration. Neither source establishes Castellation's required graph size or reader benefit.

## Architecture and Ownership

- Change `apps/web/src/pages/books/[slug]/map.astro` and `apps/web/src/scripts/story.js`. Keep the controller responsible for API loading, request ordering, progress, sharing and focus; extract pure layout calculations into `apps/web/src/scripts/relationship-layout.js` only where they make geometry testable.
- Introduce an explicit opt-in Relationship Atlas variant in `Layout.astro`, `SiteHeader.astro` and `SiteFooter.astro`, backed by scoped `apps/web/src/styles/relationship-atlas.css`. Existing pages retain their default styles. Preserve Library, Guides, How it works, Account, language switching and mobile navigation. This is the minimum shell needed by the map, not a separate design-system project.
- Reuse `selectPortrait` from `packages/domain/src/catalog.js`; do not copy spoiler logic or change its exports. Build SVG images from returned URLs, with unique clip IDs and safe DOM text insertion. Keep HTML portrait treatment consistent; extract `CharacterPortrait.astro` only when an actual HTML consumer needs it.
- The profile and homepage consume these primitives when available. Recommended delivery is graph, profile, homepage. Graph links already work against the existing profile. No coordinated release, API dependency upgrade, new package or feature flag is required.

## Data Model and API Contracts

No entities, fields, migrations or persisted layout coordinates change; a data-model diagram is therefore not required. The existing public API remains authoritative:

| Contract | Required behavior |
|---|---|
| `GET /api/books/:slug?volume=1&chapter=3` | Return `{ book, progress, story }`; `book.positions` contains valid numeric boundaries, `story` contains only revealed characters, descriptions, portraits, relations and events. A relation requires both visible endpoints. |
| Position validation | The API accepts both positive integer parameters identifying an existing position, or neither for the first position; invalid input is 400, unpublished/missing book is 404. Do not replace filtering with bundled/client-side full-story data. |
| `GET/PUT /api/progress/:slug` | Preserve credentials, payload `{ volume, chapter }`, account semantics and guest key `castellation:guest-progress:${slug}`. No guest-to-account merge. |
| `GET /api/media/:id` | Consume only URLs returned for the selected boundary. The current media handler checks publication, not chapter authorization; this design does not claim to add a media ACL. |

Preserve the existing map initialization precedence: a valid explicit position wins; otherwise use account progress, guest progress on 401, or the API's first-position default when no usable position exists. Keep the current service-failure behavior and invalid-position recovery rather than silently advancing a reader. A chapter change retains the existing queued save behavior: success is labeled account storage; 401/network/5xx may save a separately labeled guest copy; other failures report failure. Loading and saving are separate outcomes; do not report a saved selection as a successfully loaded graph.

Add optional UI-only map parameters `character=<slug>` and `relation=<id>` for contextual entry. Resolve them exclusively against the returned story; a valid relation takes precedence, then a valid character, otherwise show the unselected inspector prompt. Unknown or unrevealed values must not trigger additional detail fetches or reveal names. Apply entry selection once after initial loading; do not automatically focus the inspector on page entry. User chapter changes clear selection and these optional parameters; selecting a node need not mutate the URL. Existing links without them work unchanged.

The copied share link remains exactly `lang`, `volume`, `chapter`, with no selection, search, account data or notes. All outgoing profile/relation links include the effective API position and language. Retain existing canonical/noindex behavior and legacy map routes.

## UI/UX

Prototype: .ai/prototypes/relationship-atlas/README.md

Authoritative version: `castellation-relationship-atlas-v1`, accepted 2026-10-31, screen `atlas-map`; [acceptance](../prototypes/relationship-atlas/ACCEPTANCE.md) and [source manifest](../prototypes/relationship-atlas/source-manifest.json), committed in `68f522f`. Compare [desktop](../prototypes/relationship-atlas/evidence/map-1440.png) and [mobile](../prototypes/relationship-atlas/evidence/map-390.png). Preserve these files; do not replace v1 with implementation screenshots.

- Match Playfair Display/DM Sans, warm ivory, forest-green actions, burgundy selection, circular portrait frames and the graph/inspector hierarchy. Use existing font fallbacks. Catalog imagery and real text replace fictional assets; no portrait regeneration or prototype sprite sheet enters production.
- Select the latest eligible portrait through `selectPortrait`. A missing or failed image becomes the character's initial in the same reserved frame, without repeated retries or selecting a later portrait. Names remain visible; portraits do not replace accessible names.
- For up to six nodes, reproduce the open constellation composition with production-independent ordering: introduction volume, chapter, then stable ID. Selection never rearranges nodes. For larger casts, expand a deterministic ring layout and canvas to prevent portrait overlap rather than shrinking portraits into dots. Recompute on chapter change; preserve focus access to every node. Do not hard-code Alice, graph edges or a six-character limit.
- Clip connections outside portrait frames. Preserve direction, self-loops and distinct parallel/reverse relations. Keep the selected edge and endpoints emphasized; long labels may truncate visually, but the inspector and textual list retain complete text. Do not fabricate relationship categories or descriptive prose missing from the API.
- On wide screens place the inspector beside the map; at tablet widths place it below. On phones retain substantial portraits in an internally scrollable/pannable canvas and expose an immediate link to textual relationships. No document-level horizontal overflow. Keep chapter controls and the graph visible early in the page, preserving the existing map-stage entry check.
- Preserve previous/next chapter, zoom/pan/pinch/reset, discoveries, cast, timeline, share/manual-copy fallback and reading-sheet entry points. These can sit below the primary map; prototype omissions do not remove them.
- Keyboard Enter/Space opens node/edge detail, announces selection and focuses its heading. Close returns focus to the activating control; if it no longer exists, focus the chapter control. Focus reveals off-screen nodes. Provide equivalent HTML character and relationship controls with the same actions; no action requires dragging or interpreting color alone. Preserve visible focus, reduced motion and EN/PL labels.
- Aim for 44 px standalone controls. Test WCAG 2.2 AA including contrast, reflow, focus not obscured, accessible names and keyboard operation. Thin edges require a sufficiently sized equivalent HTML control; [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) specifies 24 CSS px with defined exceptions, not a universal 44 px requirement.

## Edge Cases and Failure Scenarios

| Trigger | Result and recovery |
|---|---|
| Earlier chapter selected or rapid changes | Immediately clear old graph, portraits, inspector, cast, discoveries, connections and events while loading; hide share. Only the latest response renders. No later content remains in the DOM under an earlier boundary. |
| Request fails | Accessible error and Retry for the requested position; never restore a later graph as if it represented the failed earlier request. Keep navigation and explicit chapter recovery usable. |
| Empty cast / no relations | Distinct honest states; chapter controls remain available. A single character is still selectable. |
| Withdrawn book / invalid position | Preserve existing route/API status semantics; offer Library or valid-position recovery, never a different story silently. |
| Asset/font failure | Stable initial/fallback font; graph and controls remain usable. No speculative future-image prefetch or persistent story/media cache. |
| Missing descriptions / long names | Keep name, context and links; omit absent prose. Wrap full names in inspector/list; do not invent biographies. |
| Storage or clipboard unavailable | Keep reading functional; announce unsaved progress or expose manual link copying as appropriate. |

## Acceptance and Validation

1. Compare the six-character review composition to v1 at 1440 and 390 px using test-only fixtures; separately exercise real catalog data, missing portraits and EN/PL at 320, 390, 768 and 1440 px. Verify 200% zoom, keyboard flow and a screen-reader pass. Automated checks alone are not a conformance claim.
2. Extend `map-stage.spec.js`, `map-character-inspector.spec.js` and `map-share.spec.js`; retain `reader.spec.js`, `reading-entry.spec.js`, chapter briefing and notes regression coverage. Assert all rendered text, URLs and image requests respect returned chapter visibility, including backward changes, failed loads and stale responses.
3. Add `node:test` geometry tests for zero/one/six/dense casts, stable ordering, non-overlapping frames and self/parallel edges; wire any new test location into the actual test command. No coverage percentage is invented.
4. Performance fixture: 100 characters and 200 relations, including missing images. On the same recorded Chromium/browser/hardware configuration, measure five warm runs from payload acceptance to the next painted graph; median must be at most 250 ms, and node activation to painted inspector at most 100 ms. These are engineering acceptance budgets, not measured current performance or audience scale. Measure image loading separately; fail and optimize the SVG path before proposing another renderer. No graph simulation, catalog-wide fetch or prototype sprite download.
5. Run `npm test`, `npm run build:web`, then `npm run test:e2e`. Record visual comparisons and performance results in the implementation QA evidence. Prototype checks and this document review do not count as implementation validation. A01 research remains outside this release gate.

## Risks and Impact Review

Larger portraits increase bandwidth and graph density. Use individual existing media URLs and reserve dimensions; do not promise resized media endpoints that do not exist. Avoid fetching off-screen portraits until needed, retaining initials and immediate image loading on keyboard reveal. Measure real media payloads in QA; an unacceptable result needs a separately scoped delivery change, not undisclosed asset regeneration.

Roll back the map/controller styling commit without database operations. Preserve shared primitives if a later screen already consumes them; revert that route's opt-in variant instead. Optional selection parameters degrade to the old unselected map after rollback. Existing account/guest writes remain real user progress and are not reverted by a UI rollback. Mobile, CMS, API contracts and other page designs are outside scope.

## Specification Review

Independent fresh-context scope-cohesion review on 2026-10-31 found no blocking scope findings. The author checked canonical domain reuse, protected contracts, failure modes, rollback and testable steps against repository sources. This is a document review, not runtime, accessibility or performance verification.

## Phasing

Phase 1 supplies the map's scoped shell and portrait rendering. Phase 2 completes contextual navigation and safe state transitions. Phase 3 verifies dense, accessible and responsive behavior. Each phase leaves this map usable with the unchanged profile and homepage.

Each increment is independently deployable only after its affected functional, responsive, accessibility and failure-state checks pass. Existing protections remain mandatory in every phase. Full v1 acceptance requires all phases and the complete acceptance criteria; intermediate deployment is not completion of this specification.

## Implementation Plan

### Phase 1 - Portrait-led map

1. Add the opt-in shell/styles and apply them only to the map. Preserve navigation and existing controller hooks. Verify map build, mobile menu and an unchanged Library/account page before shipping.
2. Implement deterministic portrait geometry, canonical portrait selection, initial fallback and inspector treatment together. Add geometry/portrait regression cases and verify the existing node/edge, zoom and focus flows before shipping.

### Phase 2 - Chapter-safe navigation

3. Add contextual entry parameters and equivalent textual selection controls, preserving standard profile/relation routes and the three-field share URL. Verify direct entry, ignored hidden IDs, focus return and old links.
4. Clear stale chapter content across loading/error transitions; retain latest-request ordering, progress separation and retry behavior. Verify backward navigation, race responses, save failures and withdrawn books before shipping.

### Phase 3 - Acceptance evidence

5. Complete responsive/dense graph adjustments and translation/accessibility checks against v1. Record screenshots, keyboard/screen-reader results and the performance fixture; run the full validation commands. Ship only when these criteria pass, without claiming A01 is validated.
