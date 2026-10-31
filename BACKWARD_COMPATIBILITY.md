# Backward Compatibility

## Scope and change policy

Castellation is a prototype with no production deployment included. These surfaces already connect the web app, mobile app, API, and CMS. Protect them against silent incompatibility; no fixed external deprecation window is established.

For a breaking change, identify affected consumers in the PR, provide migration and rollback instructions, update callers and tests together, and obtain maintainer approval before merge. Support the old contract during a staged rollout when clients cannot update atomically, especially mobile clients. A package version bump alone does not establish compatibility.

## Protected surfaces

| Surface | Breaking changes | Required evidence |
|---|---|---|
| Public catalog: `GET /api/books`, `GET /api/books/:slug`, `GET /api/media/:id` | Removed fields, changed identifiers/status codes, altered volume/chapter query semantics or reveal boundaries | API regression tests and exercised web/mobile consumers; preserve spoiler filtering and public-field allowlists |
| Accounts and progress: `/api/auth/*`, `GET/PUT /api/progress/:slug` | Changed session/cookie behavior, verification requirements, progress payloads, or account lifecycle | Auth integration tests, denied-path and cross-user isolation tests, updated web/mobile flows |
| Shared modules | Changed exports or behavior in `packages/domain/src/catalog.js`, CMS plugin exports, or the `ReaderInvitations` Worker entrypoint | Update every repository consumer and its tests; retain compatible exports during staggered deployments |
| Catalog and account storage | Renamed/dropped columns, changed identifiers, constraints, or meaning of persisted progress | Add a new numbered migration under `apps/api/migrations/`; preserve applied migrations; test existing data and document recovery |
| Configuration and Worker bindings | Renamed environment variables, D1/R2 bindings, workflow classes, or service bindings | Update Wrangler configurations, examples, and `README.md`; document deployment order and secret provisioning without committing credentials |
| Reader links | Changed book/character/chapter/relation routes, reading-position or language parameters, legacy map links, or `castellation` mobile scheme | Preserve links or provide redirects; test navigation and shared links with Playwright; verify mobile links separately |

## Review boundaries

Keep withdrawn books unavailable through public APIs. Maintain separate CMS administrator and reader identities, verified-source publication, and server-side spoiler protection even during migrations. Expanding public responses to include internal data is a contract and security change.

The web and API Workers deploy separately; the API must provide the reader-invitation entrypoint before a web deployment depends on it. Keep catalog D1 bindings aligned while CMS storage remains separate.
