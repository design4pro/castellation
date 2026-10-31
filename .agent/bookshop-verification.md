# Bookshop verification

## Delivery

- 50 distinct new visual iterations, each published separately to the development Worker. The preceding Reading Atlas run is not counted.
- Final correction version: `19ab2d16-7cc6-43fa-80f6-23e713281d92`.
- Live URL: https://castellation-web-dev.design4pro.workers.dev/
- Per-iteration versions and captures: [registry](bookshop-iterations.md).

## Checks

- `npm test`: 65 passed, 0 failed.
- Full Playwright suite: 54 passed, 0 failed.
- Development Astro build: passed with `CASTELLATION_WRANGLER_CONFIG=wrangler.dev.jsonc`.
- 16 English routes at 320, 390, 768, and 1440 pixels, plus the Polish entrance at 390 and 1440 pixels: 66 viewport checks, no horizontal overflow.
- Scoped computed-style contrast checks on visible text within changed targets: no remaining findings. This is not a claim of a complete WCAG conformance audit.
- Actual states captured: selected chapter radio, loaded graph with Alice selected, ready account form, and localized bookshelf links.
- Independent visual reviewers scored all reported material fixes resolved: discovery 01-19, reader 20-30, reference and account 31-50. Polish bookshelf wrapping was also confirmed.
- DESIGN.md and its schemaVersion 2 sidecar record implemented tokens and components while retaining the still-used atlas patterns.

## Scope and limits

The existing dirty working tree was preserved during the design work. The user then explicitly requested one commit containing all current changes. No production Worker or API deployment was performed in this series. Conversion uplift remains an unmeasured design hypothesis.

The design detector ran once before final corrections. Its shelf-border warnings were addressed with explicit square shelf frames. Its token advisories were evaluated against the authorized bookshop direction and the subsequently updated design documentation; no second detector pass was run.

## Durable capture rule

Capture the actual active state after asynchronous data is ready. When changing a surface, verify the effective background and foreground of its open states rather than assuming the parent surface color. A successful build and an overflow check do not prove contrast.
