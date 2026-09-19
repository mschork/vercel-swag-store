# Vercel Swag Store

## What this is

_To be written in E12._

## Architecture

_To be written in E12._

## Static vs dynamic

_To be written in E12._

## Running locally

Requirements: Node 24 (see `.nvmrc`) and pnpm 12 (the `packageManager` field pins the exact version; Corepack or pnpm itself will pick it up).

```sh
pnpm install
cp apps/store/.env.example apps/store/.env.local   # fill in the values
cp apps/studio/.env.example apps/studio/.env       # fill in the values
pnpm dev                                           # store on :3000, studio on :3333
```

Other scripts, all delegating to Turborepo:

```sh
pnpm build        # builds apps/store (Next.js) and apps/studio (Sanity)
pnpm lint         # ESLint, warnings are errors
pnpm typecheck    # tsc --noEmit in every package
pnpm test         # Vitest (from E02)
pnpm verify       # lint, typecheck, build, test
```

Workspace layout:

```
apps/store       Next.js 16 storefront (Cache Components on)
apps/studio      Sanity Studio
packages/sanity  schemas, client factory, GROQ queries, generated types
packages/config  shared tsconfig and ESLint config
specs/           one spec per epic, plus decisions.md
```

## Environment

Only `.env.example` files are committed. Copy them and fill in the values.

`apps/store` (`.env.local`):

| Variable | Scope | Purpose |
|---|---|---|
| `API_BASE_URL` | server | Swag Store API base URL, including `/api` |
| `API_BYPASS_TOKEN` | server | Deployment Protection bypass token for the API. Never `NEXT_PUBLIC_`, never logged |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | public | Sanity project id |
| `NEXT_PUBLIC_SANITY_DATASET` | public | Sanity dataset, `production` |
| `SANITY_API_READ_TOKEN` | server | Read token for server-side Sanity fetches |
| `SANITY_REVALIDATE_SECRET` | server | Shared secret for the Sanity publish webhook hitting `/api/revalidate` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL for metadata and OG images |
| `CATALOG_REVALIDATE_SECRET` | server | Optional, at least 32 characters. Bearer secret for `POST /api/revalidate/catalog`; unset, the route refuses every call |

Store, search-gap loop only, both optional and server only:

| Variable | Purpose |
|---|---|
| `SANITY_API_WRITE_TOKEN` | Sanity token with the Editor role, used only to write search gaps and product ideas. Unset, nothing is recorded |
| `DEMAND_ANALYSE_SECRET` | At least 32 characters. Bearer secret for `POST /api/demand/analyse`; unset, the route refuses every call |

There is no AI Gateway key. On Vercel the AI SDK authenticates with the deployment's OIDC token; locally, `vercel env pull` provides one for twelve hours.

`apps/studio` (`.env`):

| Variable | Purpose |
|---|---|
| `SANITY_STUDIO_PROJECT_ID` | Sanity project id |
| `SANITY_STUDIO_DATASET` | Sanity dataset, `production` |
| `SANITY_STUDIO_API_BASE_URL` | Swag Store API base URL for the product picker |
| `SANITY_STUDIO_API_BYPASS_TOKEN` | API bypass token for the product picker; the Studio is behind Sanity auth |

The store fails at startup with a clear message if `API_BASE_URL` or `API_BYPASS_TOKEN` is missing (`apps/store/lib/env.ts`, called from `instrumentation.ts`). The Studio fails at build or dev time if its project id or dataset is missing.

## Refreshing the catalogue

Products, categories and the store config are cached (`"use cache"`, tags `products`, `categories`, `store`) and refresh on their own within an hour. The API sends no webhooks, so after a catalogue change this call expires all three tags at once:

```sh
curl -X POST https://vercel-swag-store-ms.vercel.app/api/revalidate/catalog \
  -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET"
# {"revalidated":["products","categories","store"],"at":"…"}
```

The next request for any page reads the catalogue from the API again. Stock, promotions and the cart are never cached and need no refresh.

## Search-gap loop

A search that finds nothing is a demand signal. The store counts it after the response has been sent, a model groups the misses into product ideas, and a person accepts or rejects each idea in the Studio. Nothing in the loop touches the catalogue, a page's render path or the static shell. `specs/E13-diagram.html` draws it step by step.

```
/search?q=umbrella  --0 results-->  after(): recordGap  -->  searchGap.<hash>  (count, lastSeen)
                                                                  | count reaches 2
                                            Sanity Function gap-threshold
                                                                  | POST /api/demand/analyse (bearer secret)
                                            Vercel Workflow analyseDemand
                     lock > settle 10 min > claim gaps > read catalogue > one model call > validate > write
                                                                  |
                          productIdea.<hash> (proposed)      gaps: reviewed | matched | ignored
                                                                  |
                                            an editor sets accepted or rejected in the Studio
```

| Piece | Job | Where |
|---|---|---|
| `after()` from `next/server` | record the miss once the response has streamed | `apps/store/lib/search/record-gap.ts` |
| Sanity Function | notice a gap reaching the threshold and wake the analysis | `apps/functions/gap-threshold` |
| Vercel Workflow | the analysis as durable steps, with a lock so bursts collapse into one run | `apps/store/workflows/analyse-demand.ts` |
| Vercel AI SDK through AI Gateway | one structured-output call, no chat, no tools | `apps/store/lib/demand/steps.ts` |
| Sanity Blueprint | the Function, declared in code | `sanity.blueprint.ts` |
| `@repo/demand` | filters, ids, prompt, schema, validation and every Sanity query of the loop | `packages/demand` |

Privacy, in five lines:

- Only the tidied-up query is stored: no raw input, no IP, no user agent, no cart token.
- Queries with an `@`, a URL or domain, six or more digits, under 3 characters or over 6 words are dropped before anything is written. Bots are not counted.
- Gaps and ideas have ids with a dot, which Sanity keeps private: an anonymous reader of this public dataset gets nothing back for either type.
- A gap that never reached two searches is deleted 30 days after it was last seen.
- Queries reach the model as data, never as instructions; it has no tools, and everything it returns is checked against the claimed gaps and the live catalogue before it is written.

Running it locally:

```sh
pnpm --filter @repo/sanity seed-demand          # six gaps: three that cluster, a typo, a fragment, gibberish
(cd apps/store && vercel env pull .env.vercel)  # git-ignored; copy its VERCEL_OIDC_TOKEN line into .env.local
# with SANITY_API_WRITE_TOKEN, DEMAND_ANALYSE_SECRET and VERCEL_OIDC_TOKEN in apps/store/.env.local:
pnpm --filter store build && pnpm --filter store start
curl -X POST http://localhost:3000/api/demand/analyse \
  -H "Authorization: Bearer $DEMAND_ANALYSE_SECRET" \
  -H "Content-Type: application/json" -d '{"settle":false}'
```

`{"settle":false}` skips the ten-minute wait. Local run data is under `apps/store/.next/workflow-data`.

Where to look: Vercel's Observability, Workflows view for the runs; `pnpm exec sanity functions logs gap-threshold` for the trigger; the Studio's "Demand signals" for the gaps and the ideas.

## Sanity Functions and the Blueprint

`sanity.blueprint.ts` at the repo root declares what Sanity runs for this repo; the Functions live in `apps/functions`. The stack is called `production` and is scoped to the organisation. Run these from the repo root, logged in with `sanity login`:

```sh
pnpm exec sanity blueprints plan      # preview; deploy shows no preview of its own
pnpm exec sanity blueprints deploy
pnpm exec sanity functions logs gap-threshold
pnpm exec sanity functions test gap-threshold --event update \
  --data-before '{"_id":"searchGap.test","_type":"searchGap","status":"new","count":1}' \
  --data-after '{"_id":"searchGap.test","_type":"searchGap","status":"new","count":2}'
```

`gap-threshold` wakes the demand analysis when a search gap reaches two searches. Its two variables are set once after the first deploy, never in the blueprint, which is in git:

```sh
pnpm exec sanity functions env add gap-threshold STORE_URL https://<production-host>
pnpm exec sanity functions env add gap-threshold DEMAND_ANALYSE_SECRET <the same value as on Vercel>
```

A manual run of the analysis is the same call the Function makes:

```sh
curl -X POST https://<host>/api/demand/analyse -H "Authorization: Bearer $DEMAND_ANALYSE_SECRET"
```

## Deployment

_To be written in E12._

## How this was built

_To be written in E12._
