# Relationship graph implementation

Source doc: .ai/specs/2026-10-31-castellation-relationship-graph.md

## Goal and scope

Deliver the accepted Relationship Atlas v1 map using chapter-visible catalog portraits, deterministic SVG geometry and the existing server-filtered API. Keep progress, sharing, navigation and existing routes intact. Only the map opts into the new shell. Homepage, profile, mobile client, CMS, API and database changes are out of scope.

Engine: om-auto-create-pr (steps: 5, --loop: no)

## Implementation Plan

### Phase 1: Portrait-led map

1.1 Add the opt-in atlas shell and scoped map styles. Verify navigation and unchanged default pages.
1.2 Add pure deterministic layout and portrait rendering with geometry tests. Preserve edge direction, parallel edges, zoom and selection.

### Phase 2: Chapter-safe navigation

2.1 Add contextual entry and equivalent textual controls. Verify entry precedence, focus return and three-field share URLs.
2.2 Clear previous chapter content immediately and preserve request ordering, retry and separate progress outcomes. Add regression scenarios.

### Phase 3: Acceptance evidence

3.1 Verify responsive, keyboard, dense graph and performance behavior; compare accepted v1 screenshots; run npm test, npm run build:web and npm run test:e2e; complete authoritative review and UI evidence.

## Risks

- Existing media endpoints do not enforce chapter authorization; consume only URLs returned by the filtered API.
- Large portraits affect density and bandwidth. Defer off-screen images and measure separately from layout.
- Screen-reader verification requires actual assistive technology; automated accessible names alone do not establish conformance.
- The destination GitHub repository was empty. The existing local main history was published as its initial base, without implementation changes.

## Progress

PR: #1

> Convention: `- [ ]` pending, `- [x]` done. Append a commit SHA when a step lands. Do not rename step titles.

### Phase 1: Portrait-led map

- [x] 1.1 Add the opt-in atlas shell and scoped map styles - 0ba8873
- [x] 1.2 Add pure deterministic layout and portrait rendering - 0ba8873

### Phase 2: Chapter-safe navigation

- [x] 2.1 Add contextual entry and equivalent textual controls - 567a4e5
- [x] 2.2 Clear previous chapter content and preserve safe transitions - 567a4e5

### Phase 3: Acceptance evidence

- [ ] 3.1 Complete acceptance verification, review and UI evidence

Phase 1 validation: 7 geometry tests and 6 focused browser tests passed; web build passed.

Test fixture rule: read the catalog positions before selecting chapter boundaries. The demo Alice catalog has chapters 1 and 2; chapter 3 belongs only to the accepted prototype fixture.

Phase 2 validation: 16 focused browser scenarios passed, including backward error/retry, out-of-order responses, invalid position, withdrawn book, contextual precedence, focus return and share privacy. Tests use DEV_TEST_API_URL=http://localhost:8797 because another project owns port 8787.

Style verification rule: compare rendered screenshots as well as flow tests. The older shell uses ID-prefixed selectors; the atlas explicitly excludes its stylesheets and uses the opted-in body ID for component-style precedence.

Phase 3 implementation: 7628533. Full authoritative review gate passed: 73 unit/integration tests, web build, 78 E2E. See .ai/qa/2026-10-31-relationship-graph.md and the PR screenshot evidence. Step 3.1 stays pending until actual 200% browser zoom and a screen-reader pass are verified. GitHub rejected formal self-approval; another reviewer must provide any formal approval. No QA approval was granted.

Review sequencing rule: await completion of tracker claim operations before starting the validation/review commands; do not overlap dependent tool sessions.
