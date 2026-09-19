# E15 Catalogue sync (stretch)

Branch: `epic/E15-catalog-sync`. Depends on: E08, E09. Blocks: nothing. Attempt only after E12 is submitted-ready; it must never delay the submission.

## Goal

Replace the seed script's one-off write of `catalogProduct` documents with a scheduled Sanity Function that pulls the Swag Store API once a day and keeps the mirror current, so the Studio's product picker never goes stale and the Studio still holds no API secret.

## Scope

### Function

- One more resource in the root `sanity.blueprint.ts` that E13 created (if E15 goes first, it creates the file and the `apps/functions` workspace as E13 slice 4 describes): `defineScheduledFunction({ name: 'sync-catalog', event: { expression: '0 4 * * *' } })`, daily at 04:00 UTC, which is the Free plan's cadence. Scheduled Functions need an organisation-scoped stack and an explicit robot token, because their context carries no project or dataset; E13's stack and `demand-robot` token already are both.
- Handler: pages through `/products` with `hasNextPage`, maps each product to a `catalogProduct` document (`_id: 'catalogProduct.<apiId>'`, fields as in E08), and writes with `createOrReplace` in one transaction of at most 100 mutations per batch. Sets `syncedAt`. Products missing from the API are not deleted; they are marked `syncedAt` stale and the picker filters on freshness.
- Secrets `API_BASE_URL` and `API_BYPASS_TOKEN` set with `sanity functions env add sync-catalog …` after the first deploy, never in the blueprint's `env` block (that would put them in git) and never in the Studio bundle.
- The API client code is shared: the function imports `fetchApi` and the product schema from a package-level export of `apps/store/lib/api` moved into `@repo/api-client` if the import boundary requires it.

### Seed script

- The seed script keeps writing `catalogProduct` documents for local datasets; the function owns production.

### Docs

- README section "Catalogue sync": why the mirror exists, how often it runs, how to trigger it manually with `sanity functions test`.

## Acceptance criteria

- [ ] `sanity blueprints deploy` succeeds; the function appears in the project's Functions list with the daily schedule.
- [ ] A manual run writes or updates every `catalogProduct` document and sets `syncedAt`.
- [ ] The Studio picker shows the synced products; no API variable exists in the Studio environment.
- [ ] Vitest covers the product-to-document mapping.

## Out of scope

Writing enrichment data, deleting documents, any change to store pages.
