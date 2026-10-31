# Code Review Guidelines

## Priorities

Review correctness, security, backward compatibility, accessibility, and performance, in that order. Follow `AGENTS.md`, `BACKWARD_COMPATIBILITY.md`, and `SDLC.md`. Keep changes focused; prefer existing modules over new abstractions.

## Repository-specific checks

- **Spoiler boundaries:** inspect `apps/api/src/api.js` and `packages/domain/src/catalog.js`. Filter characters, descriptions, portraits, relationships, and events on the server by volume and chapter. Responses must exclude internal fields and unrevealed relationship endpoints.
- **Accounts:** check Better Auth sessions, verified-email requirements, CORS origins, and per-user progress isolation. Exercise denied requests and cross-user reads. Preserve session revocation after blocking, password resets, email changes, and reader deletion.
- **Database and workflows:** use bound SQL parameters. Inspect numbered migrations and test retained data. Keep rights verification, exact source evidence, publication, and withdrawal checks intact.
- **CMS:** preserve the separation between CMS administrators and reader accounts. Check editor validation and stale-edit protection.
- **Web:** follow `apps/web/DESIGN.md` and `apps/web/PRODUCT.md`. Verify narrow and wide layouts, keyboard focus, accessible names, loading/error states, language selection, and reading-position links. Target WCAG 2.2.
- **Mobile:** check Expo secure storage, API reachability, deep links, and shared API consumers. Browser tests do not establish real-device correctness.
- **Performance:** review query bounds and avoid unnecessary requests or heavy client dependencies. Preserve useful server-rendered navigation.
- **Configuration:** keep secrets outside tracked files. Keep CMS and catalog storage separate and maintain the reader-invitation service binding.

## Validation and evidence

Run the configured gate in order: `npm test`, `npm run build:web`, `npm run test:e2e`. Add regression coverage for changed behavior. Include screenshots for UI changes and record any checks not run. No coverage percentage, lint command, or typecheck command is currently configured.

## Severity and sign-off

- **Blocker:** spoiler or credential disclosure, account isolation failure, data loss, failed validation, or an incompatible protected contract without an approved migration.
- **Major:** incorrect behavior, missing regression coverage, or an inaccessible primary flow. Request changes.
- **Minor:** localized maintainability or presentation improvements without material user impact.

Use the configured labels and QA rules in `SDLC.md`. Auth, scoping, schema, and shared-contract changes require high-risk evidence; a high-risk PR cannot receive autonomous self-QA sign-off. Report findings with affected paths, impact, and a concrete correction.
