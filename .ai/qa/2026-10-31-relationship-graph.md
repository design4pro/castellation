# Relationship graph implementation QA - 2026-10-31

Implementation PR: https://github.com/design4pro/castellation/pull/1
Source doc: .ai/specs/2026-10-31-castellation-relationship-graph.md
Implementation head: 7628533
Status: in-progress - native zoom and screen-reader acceptance remain open.

## Validation

- `npm test`: PASS, 73 unit/integration tests (8 geometry tests, unchanged domain/API/auth/CMS suites retained).
- `npm run build:web`: PASS.
- `DEV_TEST_API_URL=http://localhost:8797 npm run test:e2e`: PASS, 78 browser scenarios. Another project owns the default API port; it was not stopped or modified.
- Focused acceptance suite: PASS, 13 scenarios, including 320/390/768/1440 px EN/PL, dense cast, missing images, empty/no-relation states, long names, rejected storage, contrast, reduced motion, keyboard reveal, pan/pinch/zoom/reset.
- Real-catalog UI QA: PASS at desktop EN and phone PL for keyboard inspection/focus return, backward chapter change, sharing boundaries and document reflow; font-delivery failure remains usable.
- Generated environment: cold start and healthy warm reuse verified; teardown is scoped to this checkout's recorded process groups.

[Authoritative code assessment](https://github.com/design4pro/castellation/pull/1#issuecomment-6547591404): no blocker, major or minor code findings. GitHub rejected formal self-approval; a separate reviewer must submit any formal approval. GitGuardian passed at the implementation head; no repository workflow runs or branch protection are configured.

## Visual comparison and media

[UI evidence with screenshots](https://github.com/design4pro/castellation/pull/1#issuecomment-6547622288) includes real-catalog desktop/phone and the test-only six-person composition. Compared with accepted `castellation-relationship-atlas-v1` at 1440 and 390 px: warm ivory, forest actions, burgundy selection, circular portrait frames, open constellation and responsive inspector hierarchy are retained. Existing chapter controls, progress, discoveries, cast, events, sharing and reading-sheet entry remain. Accepted prototype files and its source manifest were not changed.

The demo catalog has no portrait records at these positions, so real-catalog screenshots correctly show initials. The six-character fixture uses an existing repository story illustration only to exercise media frames and a missing Mouse portrait; it does not represent approved character depictions. No sprite sheet or regenerated portrait enters production. The fixture illustration is 238,472 bytes; resource timing is recorded separately from graph paint. Real portrait bandwidth cannot be extrapolated from a catalog with no portraits.

Map-specific CSS is 11,740 source bytes; the map excludes the older 57,507-byte reading-atlas and 51,842-byte bookshop stylesheets. Default pages still load those existing stylesheets. No new runtime package was added.

## Performance fixture

Configuration: Chromium 156.0.8078.4, darwin arm64, Apple M4 Max, viewport 1440x1000. Fixture: 100 characters / 200 relations, 20 missing portraits. One cold warm-up is excluded; five subsequent reloads use the same browser configuration. Payload acceptance is measured immediately after JSON parsing; a double animation frame samples the next painted graph. Inspector measurement starts at node activation. Images are measured separately.

- Payload-to-painted graph (ms): 43.2, 29.2, 46.4, 47.9, 45.0. Median: **45.0 ms**, budget 250 ms.
- Activation-to-painted inspector (ms): 18.5, 28.5, 23.8, 27.0, 17.3. Median: **23.8 ms**, budget 100 ms.

These are engineering measurements, not audience-scale evidence or validation of A01.

## Remaining acceptance gates

- Actual browser zoom at 200% has not been verified. Native browser automation did not confirm a zoom change; responsive viewport tests do not substitute for it.
- An actual screen-reader pass has not been verified. Native macOS accessibility-tree inspection found the expected named character/relation controls, chapter selector, inspector and links, but does not establish screen-reader operation or WCAG conformance.
- The PR stays draft with `needs-qa`; no `qa-approved` or `qa-self-verified` label is granted. Do not merge or claim full v1 acceptance until the outstanding checks pass.

Rollback: revert the map/controller/style opt-in changes without database operations. Account and guest progress writes remain real progress. Homepage, profile, CMS, API contracts and mobile design remain out of scope.
