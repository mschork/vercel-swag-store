# E15 Catalogue sync (stretch)

Branch: `epic/E15-catalogue-sync`. Depends on: E08, E09, E13 (the organisation-scoped stack), E18 (category documents). Blocks: nothing. It must never delay anything else.

## Goal

Keep the mirror current without anyone running a script. The product documents and category documents hold the API's fields beside what editors write (`docs/adr/0003-sanity-mirrors-api-products-and-categories.md`). Today `pnpm --filter @repo/sanity sync` updates them by hand. E15 runs the same catalogue sync once a day as a scheduled Sanity Function, so a product the API adds can be picked in the Studio the next morning. The store is unaffected: it renders from the API, never from the mirror.

## Scope

### What the sync writes

- The existing mirror: one `product` document per API product (`_id` `product-<apiId>`) and one `category` document per API category (`_id` `category-<slug>`). Ids carry no dot, because a dotted id is invisible to the store's tokenless reads.
- A new document is created with the mirrored fields. An existing one is patched with only the mirrored fields that differ from the API's answer, so enrichment and category intros are never touched. Never `createOrReplace`.
- Writes only what changed. The sync reads the current mirrored fields first and compares; a document whose fields match is not written. A quiet day writes nothing, so no revision is created, the revalidation webhook is not called and the Studio history stays clean.
- `syncedAt` is set on a document when the sync writes it, so it means "last changed by the sync".
- A document whose product or category is absent from the API's answer gets `missing: true`, and one that comes back gets `missing: false`. Nothing is deleted.
- Pages through `/products` with `hasNextPage`; no count is assumed.

### When the API answers badly

- If any API request fails, the sync writes nothing and the run fails.
- If the API returns no products or no categories, the sync flags nothing as missing.

### Shared logic

- The sync moves from `packages/sanity/scripts/sync.ts` into an export of `@repo/sanity`: fetch the catalogue, read the mirror, compute the writes, commit them in one transaction. The script and the Function both call it, each with its own Sanity client.
- The script stays for local datasets and manual runs and behaves the same way as the Function.
- The sync keeps its own small API fetch; the store's API client is not moved into a package.

### Function

- `apps/functions/catalogue-sync`, declared in the root `sanity.blueprint.ts` as `defineScheduledFunction({ name: 'catalogue-sync', event: { expression: '0 4 * * *' } })`: daily at 04:00 UTC, which the Free plan allows.
- A scheduled Function is organisation-scoped and has no project or dataset in its context, so it names its project and dataset and authenticates with a robot token. The token is declared in the same blueprint with `defineRobotToken`, Editor role on the project, and passed to the Function; removing it from the blueprint revokes it.
- `API_BASE_URL` and `API_BYPASS_TOKEN` are set with `sanity functions env add catalogue-sync …` after the first deploy, never in the blueprint's `env` block and never in the Studio.
- The Function's logs and the documents' `syncedAt` are how a run is checked; there is no alert.

### Docs

- README section "Catalogue sync": what the mirror is for, when the sync runs, how to run it by hand (the script, or `sanity functions test catalogue-sync`), and where its logs are.

## Acceptance criteria

- [ ] `sanity blueprints deploy` succeeds; `catalogue-sync` appears in the Functions list with the daily schedule, and its robot token exists.
- [ ] A manual run against an unchanged API writes no document.
- [ ] A manual run after a mirrored field is changed by hand restores that field, sets `syncedAt` on that document only, and leaves its editorial fields as they were.
- [ ] A product the API no longer returns is flagged `missing`, not deleted; a failed API request or an empty answer writes nothing.
- [ ] No API variable exists in the Studio environment or the blueprint file.
- [ ] Vitest covers the comparison (unchanged, changed, new, missing, returned) and the empty-answer guard.
- [ ] `pnpm verify` passes.

## Out of scope

Writing enrichment or intros, deleting documents, any change to the store's pages or caches, alerts on failure.
