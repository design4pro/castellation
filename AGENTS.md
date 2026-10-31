# Repository Guidelines

## Project Structure & Module Organization

Castellation is a spoiler-aware reading companion.

- `apps/web/`: Astro and EmDash website; routes in `src/pages/`, reusable UI in `src/components/`, styles in `src/styles/`, static assets in `public/`.
- `apps/mobile/`: Expo React Native client.
- `apps/api/`: Cloudflare Worker handlers in `src/`, local demo server in `dev/`, numbered SQL migrations in `migrations/`.
- `packages/domain/`: shared spoiler-filtering logic.
- `packages/cms-plugin/`: EmDash catalog and reader administration.
- `tests/e2e/`: Playwright browser scenarios and CMS setup helpers.

## Build, Test, and Development Commands

Use Node.js 24+ and install dependencies with `npm install`.

- `npm run dev:api`: start the in-memory SQLite demo API on port 8787; restarting discards data.
- `PUBLIC_API_URL=http://localhost:8787 npm run dev:web`: start the web app against the demo API.
- `EXPO_PUBLIC_API_URL=http://<lan-address>:8787 npm run dev:mobile`: start Expo; use a device-reachable API address.
- `npm run build:web`: build the web application.
- `npm test`: run domain, API, database, and CMS plugin tests.
- `npx playwright install chromium`: install the browser required for E2E tests.
- `npm run test:e2e`: run browser tests; Playwright starts the required servers.

## Coding Style & Naming Conventions

Use ES modules, two-space indentation, single quotes, and semicolons; preserve surrounding formatting. Use camelCase functions, PascalCase UI components, and descriptive kebab-case module names. No dedicated formatter or lint script is configured.

Keep changes surgical and follow DRY, KISS, and SOLID. Preserve server-side spoiler filtering. UI changes should support responsive layouts, keyboard navigation, and WCAG 2.2 accessibility.

## Testing Guidelines

Unit and integration tests use `node:test` with `node:assert/strict`: place `*.test.js` beside CMS modules or in the existing domain/API test directories. Browser tests use `tests/e2e/*.spec.js`. No coverage threshold is configured. Add regression tests for behavior changes, run affected suites, and build the web app for web changes.

## Commit & Pull Request Guidelines

Recent commits use `feat: <imperative description>`; follow that style with an appropriate type. PRs should explain the change, link applicable issues, report validation, and include screenshots for UI changes. Push with an explicit destination: `git push origin HEAD:refs/heads/<branch>`.

## Configuration & Agent Instructions

Follow `README.md` for Cloudflare bindings and secrets; keep credentials outside tracked files. Communicate with the developer in Polish; write repository content, commits, and PRs in English.
