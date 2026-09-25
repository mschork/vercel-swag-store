# Operations

How the store is deployed and run. What it is and how it is built are in the
README; what is cached and what streams is in `static-vs-dynamic.md`.

## Deployment

Two Vercel projects are connected to this repository, one rooted at `apps/store` and one at
`apps/studio`. Both run `turbo-ignore`, so a push only rebuilds the app whose files
changed. Preview deployments are protected; production is public.

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`:

| Job | What it runs | Required |
|---|---|---|
| `verify` | `pnpm verify`: ESLint with warnings as errors, `tsc --noEmit`, both builds, Vitest, then the two build checks below | yes |
| `e2e` | Playwright, smoke and visual | no |
| `deploy studio` | `sanity deploy` to `swagstore-ms.sanity.studio`, on `main` only | — |

`e2e` is not required because its visual comparisons depend on the renderer, and a
screenshot taken on another machine should not block a merge. Its failure stays visible.
The visual comparisons are skipped off macOS, where their baselines were made; the smoke
tests run everywhere.

The Sanity-hosted Studio deploys from CI with a `SANITY_AUTH_TOKEN` carrying the Deploy
Studio role; without the secret the step says so and passes, so a fork still builds. That
Studio has auto-updates on, so it loads the Studio framework from Sanity and a fix in a
Studio release reaches editors without a deploy, while the schema and the plugins stay on
the version the lockfile pins.

Sanity Functions are not deployed by CI. They are declared in `sanity.blueprint.ts` and
deployed by hand with `pnpm exec sanity blueprints deploy`; "Sanity Functions and the
Blueprint" below has the commands.

Dependabot opens one grouped pull request a week for minor and patch npm updates and one a
month for actions. Majors are ignored: Next, React, Sanity and Tailwind each need their own
piece of work, and a security fix arrives through Dependabot's security updates whatever
that schedule says.

## Refreshing the catalogue

Products, categories and the store config are cached and refresh on their own within
the hour. The Swag Store API sends no webhooks, so one call expires all three
catalogue tags at once:

```sh
curl -X POST https://vercel-swag-store-ms.vercel.app/api/revalidate/catalog \
  -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET"
# {"revalidated":["products","categories","store"],"at":"…"}
```

The next request for any page reads the catalogue from the API again. Stock, promotions
and the cart are never cached and need no refresh.

The next request for any page reads the catalogue from the API again. Stock,
promotions and the cart are never cached and need no refresh.

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

## Environment

Only `.env.example` files are committed. Copy them and fill in the values.

`apps/store` (`.env.local`):

| Variable | Scope | Purpose |
|---|---|---|
| `API_BASE_URL` | server | Swag Store API base URL, including `/api` |
| `API_BYPASS_TOKEN` | server | Deployment Protection bypass token for the API. Never `NEXT_PUBLIC_`, never logged |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | public | Sanity project id |
| `NEXT_PUBLIC_SANITY_DATASET` | public | Sanity dataset, `production` |
| `SANITY_REVALIDATE_SECRET` | server | Shared secret Sanity signs its publish webhook with, checked by `/api/revalidate/sanity` |
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
| `SANITY_STUDIO_PREVIEW_ORIGIN` | Optional. The store the Presentation tool frames; defaults to the production store |

The Studio holds no API credential. Its product picker reads the `catalogProduct`
documents mirrored into Sanity, so nothing in the Studio ever calls the Swag Store API.

The store fails at startup with a clear message if `API_BASE_URL` or `API_BYPASS_TOKEN` is missing (`apps/store/lib/env.ts`, called from `instrumentation.ts`). The Studio fails at build or dev time if its project id or dataset is missing.
