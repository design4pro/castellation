# Castellation - Relationship Atlas v1

Status: accepted design reference. Acceptance: accepted v1 on 2026-10-31; see [owner acceptance](ACCEPTANCE.md).

## Source and scope

- Source: [product brief](../../specs/product-brief.md), revision `55ea88685c47142ed855b715153fbc7a4cb96db4`.
- Decision evidence: [owner record](../../specs/research/decisions/2026-10-31-web-design-direction.md), D01 and D03.
- Selected scope: homepage, character profile, and relationship graph, authorized by the owner's subsequent `om-ux-design` request. The owner subsequently accepted v1 and authorized the brief's authoritative `Prototype:` link; production implementation remains outside this task.
- Prototype identity: `castellation-relationship-atlas-v1`. Stable screen IDs: `atlas-home`, `atlas-character`, `atlas-map`.
- Runtime: repository-installed Astro, React and Cloudflare adapter, isolated under this directory. No new packages, production routes, accounts, deployment or tracker operations.

## Open the concept

From the repository root:

```sh
cd .ai/prototypes/relationship-atlas
../../../node_modules/.bin/astro dev --host 127.0.0.1 --port 4367 --ignore-lock
```

The process stays attached; stop it with Ctrl+C. Keep the host and port stable for review. The preview created during verification was stopped after review.

| Screen | Exact local link | Screenshot |
|---|---|---|
| Homepage | [Discover](http://127.0.0.1:4367/?chapter=3&character=alice) | [Desktop](evidence/home-1440.png), [mobile](evidence/home-390.png) |
| Character profile | [Alice](http://127.0.0.1:4367/character/?chapter=3&character=alice) | [Desktop](evidence/character-1440.png), [mobile](evidence/character-390.png) |
| Relationship graph | [The atlas](http://127.0.0.1:4367/map/?chapter=3&character=alice) | [Desktop](evidence/map-1440.png), [mobile](evidence/map-390.png) |

Build with `../../../node_modules/.bin/astro build` from this directory. Static output goes to ignored `dist/`; maintained source lives in `src/`. The plain Node development runtime failed on an `astro:` import in the installed Astro version; using the same Cloudflare adapter as the consuming application resolved it. The local Wrangler config has no application database or media bindings.

## Visual contract and component provenance

Approved: a contemporary old-library atmosphere, characters and relationships before books, the graph as the main motif, and prominent portraits inside the graph.

Accepted in v1: warm ivory surfaces, forest-green actions, burgundy selection, circular illustrated portraits, an editorial homepage, a portrait-led character profile and a map with a contextual inspector. The demonstrated typography, palette, frames and responsive compositions are the accepted visual reference for these screens.

- `apps/web/DESIGN.md`, `apps/web/src/layouts/Layout.astro` and the rendered existing homepage supplied context. Playfair Display and DM Sans reuse the existing font families. Bookshelf materials and the old shell are deliberately not carried into this D03 proposal.
- No `.uxproof/` contract, configured token export, reusable graph component or established prototype surface was found. This is not a design-system fidelity claim. The production header, layout and global styles are coupled to the previous direction; they were inspected, not silently restyled or duplicated as production components.
- `src/components/Atlas.jsx` owns prototype-only `Portrait`, `Graph`, `Boundary`, states and connected screens. `src/styles.css` and `src/screens.css` own the accepted prototype styling. These are not additions to the production component library.
- `packages/domain/src/catalog.js` supplies the actual shared `filterStory` function, reused by `src/data.js`. Existing graph behavior was inspected in `apps/web/src/scripts/story.js` and the map/profile routes.
- `public/portraits.png` is one generated six-portrait study sheet, created for this review. CSS crops its tiles without changing the source image. It is not a catalog asset or validated depiction of the characters. Google Fonts follows the application's existing delivery; local serif/sans-serif fallbacks remain available.

## Requirement and state coverage

The role is a reader exploring a public story. Chapter and character context travel in URLs, including between all three screens.

| Requirement | Entry / screen | Action and result | Recovery |
|---|---|---|---|
| D01, D03, N01 | `atlas-home` / Discover | Explore a four-character preview or find a character; open the six-character atlas or a profile | Search with no matches offers Clear search |
| D03 | `atlas-character` / portrait or graph inspector | Read the chapter-bounded profile; follow a related character or inspect a connection in the atlas | An unavailable character falls back to Alice with an accessible status message |
| D03 | `atlas-map` / Explore the atlas | Select a portrait or named connection, inspect details, open the profile, zoom/reset | Textual relationship buttons provide equivalent access to detail |
| R01 | All three screens / Reading through chapter | Choose chapter 1, 2 or 3; remove later characters, portraits and edges from the rendered view | If the selected character becomes unavailable, select Alice and announce the change |
| R01, A01 | Graph on narrow screens | Keep substantial portraits in a horizontally scrollable canvas; keyboard focus reveals off-screen nodes | Visible link to the textual connection list; homepage preview uses a separate mobile composition |
| A01, Q01 | Review controls below the product footer | Simulate loading, empty, request failure, missing Mouse portrait and long profile/inspector content | Retry/reset preserves chapter and character; search text survives a simulated request failure |

## Simulation limits and open decisions

- All content is local, adapted fictional review data. The sample relationship statements are not citations or editorially verified catalog entries. Chapter 3 is a demonstration starting point, not a proposed default for new readers.
- Filtering here runs in the client over bundled fixtures. It demonstrates visible states and navigation, **not a secure spoiler boundary**. Production must retain server-side filtering; the entire portrait sheet and fixture data are available to the local browser.
- No API requests, authentication, account/guest progress persistence, payment or provider integrations are simulated as real operations. Refresh preserves URL context; simulation mode and search text are temporary.
- Missing portraits use an initial in the same space. The sheet is 2.8 MB and suitable for concept review; production requires chapter-safe individual thumbnails and delivery sizing. A six-person fixture does not establish performance or readability for large, dense graphs.
- The concept uses the product's default English and light presentation. Polish translation, locale switching and the rest of the existing website are outside these three concept screens; existing production routes and language behavior are unchanged.
- The demonstrated visual treatment is accepted. Review dense-map readability with readers and set implementation acceptance criteria before treating this as implementation-ready. The generated portrait treatment is an accepted concept reference, not reader validation or approval of production catalog assets.

## Verification

Verified locally on 2026-10-31 using the repository's Playwright Chromium installation and provider workflow:

- 8 browser scenarios passed: connected navigation/context; search and no-results recovery; unavailable character, missing portrait and request states; keyboard selection and zoom; complete screens at 320, 390, 768 and 1440 px. Tablet recheck passed after moving the inspector below the graph at intermediate widths.
- Inspected complete desktop/mobile screens, tablet graph, long-title rendering, empty/error/loading and missing-portrait states. Fixed overlapping mobile-preview labels and a decorative arrow in a link's accessible name. No page-level horizontal overflow at the four checked widths; the full graph intentionally scrolls internally on phones.
- Reduced-motion mode, visible keyboard focus, labels/status announcements, chapter fallback and URL reload were exercised. Primary text contrast is 12.70:1, muted text 5.22:1, burgundy 7.17:1, button text 9.24:1; graph edges exceed 3:1 against the canvas. This is a focused accessibility pass, not a full WCAG conformance audit or screen-reader study.
- Prototype build passed. Repository unit/integration tests: 65/65 passed. Production E2E was not rerun: no production source changed; the connected prototype was checked separately.
- Throwaway tests, accessibility snapshots, logs and additional viewport/state captures are under `.ai/qa/artifacts_relationship-atlas/` (ignored local evidence). Selected screenshots are retained in `evidence/` beside this handoff.

## Review and acceptance

The Product owner explicitly accepted v1 on 2026-10-31 and authorized recording it in the brief; see [ACCEPTANCE.md](ACCEPTANCE.md). D04 and the brief's `Prototype:` field now identify this version. `source-manifest.json` binds acceptance to the exact source and assets through SHA-256 hashes. Screen source was unchanged when recording acceptance; browser verification remains separate from human acceptance.

There is no existing annotation engine or stored feedback to migrate. Record feedback in this screen-linked table or in the conversation using the screen ID, viewport and state. No browser comments, localStorage backup or live collaboration are claimed.

| Screen ID | Viewport / state | Feedback | Resolution |
|---|---|---|---|

Before revising an accepted version, preserve its source manifest, screenshots and feedback and assign the revision a distinct review version while retaining screen IDs.
