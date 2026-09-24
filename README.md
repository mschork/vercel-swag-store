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
| `SANITY_REVALIDATE_SECRET` | server | Shared secret for the Sanity publish webhook hitting `/api/revalidate` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL for metadata and OG images |
| `CATALOG_REVALIDATE_SECRET` | server | Optional, at least 32 characters. Bearer secret for `POST /api/revalidate/catalog`; unset, the route refuses every call |

Store, session store, both optional and server only. Set both or neither; Vercel sets both when the Upstash Redis store is connected to the project:

| Variable | Purpose |
|---|---|
| `KV_REST_API_URL` | Upstash Redis REST URL, where the store keeps each browser's visit, cart token and cart mirror under its session id (`docs/adr/0007-the-session-store.md`). Unset, an in-memory store serves one process, which is enough for a clone, CI and the tests |
| `KV_REST_API_TOKEN` | Bearer token for that URL. Never `NEXT_PUBLIC_`, never logged |

Store, Playwright only:

| Variable | Purpose |
|---|---|
| `E2E_SEED` | `1` only for the Playwright web server, which `playwright.config.ts` sets. It enables `POST /api/test/session`, which seeds a visit and a cart mirror; unset, the route answers 404. Never set on Vercel |

Store, search-gap loop only, both optional and server only:

| Variable | Purpose |
|---|---|
| `SANITY_API_WRITE_TOKEN` | Sanity token with the Editor role, used only to write search gaps and product ideas. Unset, nothing is recorded |
| `DEMAND_ANALYSE_SECRET` | At least 32 characters. Bearer secret for `POST /api/demand/analyse`; unset, the route refuses every call |

Store, live editing only, both optional and server only:

| Variable | Purpose |
|---|---|
| `SANITY_API_READ_TOKEN` | Sanity token with the Viewer role, read only in draft mode. Never `NEXT_PUBLIC_`, never logged. Unset, `/api/draft-mode/enable` answers 404 and the store never reads a draft |
| `PRESENTATION_STUDIO_ORIGINS` | The Studios that may frame the store: comma-separated exact origins, no wildcards. Read at build time. Unset, the header stays `frame-ancestors 'none'` |

There is no AI Gateway key. On Vercel the AI SDK authenticates with the deployment's OIDC token; locally, `vercel env pull` provides one for twelve hours.

`apps/studio` (`.env`):

| Variable | Purpose |
|---|---|
| `SANITY_STUDIO_PROJECT_ID` | Sanity project id |
| `SANITY_STUDIO_DATASET` | Sanity dataset, `production` |
| `SANITY_STUDIO_API_BASE_URL` | Swag Store API base URL for the product picker |
| `SANITY_STUDIO_API_BYPASS_TOKEN` | API bypass token for the product picker; the Studio is behind Sanity auth |
| `SANITY_STUDIO_PREVIEW_ORIGIN` | Optional. The store the Presentation tool frames; defaults to the production store |

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
                                            an editor clicks Accept or Reject in the Studio
                                                                  | status changes
                                            Sanity Function idea-decided
                          idea: decidedAt stamped        gaps: promoted (accepted) | reviewed (rejected)
```

| Piece | Job | Where |
|---|---|---|
| `after()` from `next/server` | record the miss once the response has streamed | `apps/store/lib/search/record-gap.ts` |
| Sanity Function | notice a gap reaching the threshold and wake the analysis | `apps/functions/gap-threshold` |
| Vercel Workflow | the analysis as durable steps, with a lock so bursts collapse into one run | `apps/store/workflows/analyse-demand.ts` |
| Vercel AI SDK through AI Gateway | one structured-output call, no chat, no tools | `apps/store/lib/demand/steps.ts` |
| Studio document actions | Accept and Reject on a product idea, Reject with a reason | `apps/studio/actions/idea-decision.tsx` |
| Sanity Function | finish the decision: stamp the date, promote the gaps | `apps/functions/idea-decided` |
| Sanity Blueprint | both Functions, declared in code | `sanity.blueprint.ts` |
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

The lock that collapses a burst of calls into one run has its own test against the real workflow runtime. It is hermetic (no Sanity, no model) and is not part of `pnpm verify`:

```sh
pnpm --filter store test:integration
```

`{"settle":false}` skips the ten-minute wait. Local run data is under `apps/store/.next/workflow-data`.

Where to look: Vercel's Observability, Workflows view for the runs; `pnpm exec sanity functions logs gap-threshold` for the trigger; the Studio's "Demand signals" for the gaps and the ideas.

## Live editing

An editor opens **Presentation** in the Studio, next to the desk. The store loads inside the Studio, in draft mode. Clicking a piece of text or a photo opens the field that holds it, and an edit shows in the page as it is typed, before anything is published. Publishing still goes through the webhook and the cache tags, so a visitor sees the change on their next request.

What is editable is what Sanity owns: the home hero (headline, description, photo), the featured and favourites headings, a product's extended description, care text and questions, testimonials, the four product-page headings, the checkout page and the footer text. Names, prices, stock, categories and the cart belong to the API and are not editable here.

Visitors get none of it. Outside draft mode the pages, the cache and the JavaScript are the same as before: no overlay script, no invisible edit markers, no token. Draft mode can only be switched on by the Studio, through `/api/draft-mode/enable`, which checks a short-lived secret with Sanity. "Draft preview · Exit" at the foot of the page leaves it when the store is open on its own.

The Studio frames the production store. A Vercel preview deployment answers with a login redirect and cannot be framed. Both store variables must be set on Vercel, and `PRESENTATION_STUDIO_ORIGINS` is read when the store is built, so changing it needs a redeploy:

```
PRESENTATION_STUDIO_ORIGINS=https://vercel-swag-studio.vercel.app,https://swagstore-ms.sanity.studio,https://www.sanity.io
```

`https://www.sanity.io` is there because Sanity's dashboard frames the Studio, and a browser checks every ancestor of a frame.

To run it locally against `localhost:3000`:

```sh
# apps/store/.env.local: SANITY_API_READ_TOKEN=<viewer token>, PRESENTATION_STUDIO_ORIGINS=http://localhost:3333
pnpm --filter store build && pnpm --filter store start
# apps/studio/.env: SANITY_STUDIO_PREVIEW_ORIGIN=http://localhost:3000, then restart the Studio
pnpm --filter studio dev
```

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

`gap-threshold` wakes the demand analysis when a search gap reaches two searches. `idea-decided` finishes an editor's decision on a product idea; it needs no variables. `gap-threshold`'s two variables are set once after the first deploy, never in the blueprint, which is in git:

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
