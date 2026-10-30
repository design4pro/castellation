# Castellation

Castellation is an early prototype of a spoiler-aware reading companion. The web app uses Astro and EmDash, the mobile app uses Expo, and the API targets Cloudflare Workers with D1, R2, Workers AI, and Workflows.

## Local development

Requires Node.js 24 or newer and npm. Install dependencies with `npm install`.

1. Run `npm run dev:api` in one terminal. This starts a local in-memory SQLite API with a small English demo based on Alice's Adventures in Wonderland. Its data is discarded on restart.
2. Run `PUBLIC_API_URL=http://localhost:8787 npm run dev:web` in another terminal and open the printed URL.
3. For mobile, set `EXPO_PUBLIC_API_URL` to an API address reachable from the device and run `npm run dev:mobile`. A phone cannot reach the development machine using `localhost`: for an isolated, trusted local network, start the demo API with `DEV_LISTEN_HOST=0.0.0.0` and `DEV_AUTH_URL=http://<computer-lan-address>:8787`, then set `EXPO_PUBLIC_API_URL` to the same address. The demo API is not intended to be exposed to the internet.

Run `npm test` for unit and database tests. Run `npm run test:e2e` after installing Playwright Chromium with `npx playwright install chromium`. To use an existing Chrome installation, set `PLAYWRIGHT_CHROME_PATH` to its executable.

## Cloudflare setup

The Wrangler configurations contain placeholder D1 IDs; replace them with provisioned database IDs. Set `BETTER_AUTH_URL` to the HTTPS API origin, `WEB_ORIGIN` to the exact HTTPS web origin, configure `BETTER_AUTH_SECRET` as a Wrangler secret with at least 32 random characters, and set `EMAIL_FROM` to an address on a domain onboarded to Cloudflare Email Service. Configure `EXPO_PUBLIC_WEB_URL` with the web origin so the mobile app can request password resets. Web and API origins must be same-site for the default session cookie policy; `PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` must point to that API origin. Create the R2 buckets, apply all migrations in `apps/api/migrations`, and configure `PUBLIC_API_URL` at web build time. CMS and API use separate D1 databases and buckets. Deploy the API Worker before the web Worker; the web Worker uses the READER_INVITATIONS service binding to call the API Worker's ReaderInvitations entrypoint. The CATALOG_DB and API DB bindings must refer to the same D1 database. Protect the EmDash administrator setup and use production authentication before exposing it. No production deployment is included.

## Current limitations

- Better Auth provides email/password accounts, email verification, password resets, and synchronized reading progress. The local demo captures outgoing mail in memory; no email is sent. The `/__dev/outbox` endpoint exists only in the demo process and is enabled only by `DEV_TEST_OUTBOX=1`; do not enable it on a network-accessible development server. No accounts or progress are retained by the demo API after restart. Production email delivery and real-device flows still require verification.
- Catalog discovery records candidates as unverified. An administrator can verify rights for each intended territory and edition in the EmDash Book sources panel; this enables processing. The panel requires the API catalog D1 database to be bound as `CATALOG_DB`.
- The workflow validates structured chapter analysis and requires an exact source excerpt for each record before publishing, but a matching excerpt does not prove the model interpretation is correct. AI output and source rights must not be assumed correct. Entity matching uses normalized names and does not resolve aliases.
- The workflow generates portraits from chapter-specific appearance descriptions and limits each character to ten images. The model has not been tested with a live Workers AI account and does not enforce visual identity across images.
- The chapter splitter recognizes only a narrow class of English chapter headings. Detection, encoding, tables of contents, and alignment of translated editions need further work.
- The CMS plugin supports source status, rights verification, editing chapter-specific character descriptions, relationship labels, and event descriptions, withdrawing or restoring books, creating and deleting reader accounts, searching and paging through accounts, editing names and email addresses, blocking or unblocking accounts, and revoking their sessions. An administrator-created reader receives an email invitation linking to email verification followed by password setup. If delivery fails, the account remains available for invitation retry in the reader panel. Deleting a reader also deletes their credentials, sessions, reading progress, and pending password reset tokens. Changing an email address revokes sessions and requires verification when the reader next signs in. Reader accounts are separate from CMS administrators. The editor shows source excerpts where available. Editing event titles and portraits, pagination beyond the first 100 catalog rows, full bilingual content, localization of all UI, production SEO and event/relationship detail views remain incomplete.
- Touch behavior has not been tested on physical devices, and graph performance has not been measured with large catalogs. This is not production-ready.
