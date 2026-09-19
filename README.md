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

Store, E13 only: `SANITY_API_WRITE_TOKEN`, `DEMAND_ANALYSE_SECRET`, `AI_GATEWAY_API_KEY` (all server only).

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
