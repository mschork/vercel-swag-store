# Vercel Swag Store

A storefront for Vercel swag, built on Next.js 16 with Cache Components. Every page is a
prerendered shell served from the CDN, and the parts that differ per visitor — stock, the
promotion, the cart — stream into it through Suspense boundaries. The Vercel Swag Store
API owns every commerce fact; Sanity holds the marketing copy layered on top.

| | |
|---|---|
| Store | <https://vercel-swag-store-ms.vercel.app> |
| Studio | <https://swagstore-ms.sanity.studio> |

The products are invented and nothing is for sale, so every response carries
`X-Robots-Tag: noindex`. There is no licence: the code is published to be read, not
reused.

## Running locally

Node 24 (see `.nvmrc`) and pnpm 12, which the `packageManager` field pins.

```sh
pnpm install
cp apps/store/.env.example apps/store/.env.local   # every variable is documented there
cp apps/studio/.env.example apps/studio/.env
pnpm dev                                           # store on :3000, studio on :3333
```

```sh
pnpm verify     # lint, typecheck, build, test, then the two build checks
pnpm test       # Vitest alone
```

No Redis is needed: without `KV_REST_API_URL` the session store runs in memory, which is
enough for a clone, for CI and for the tests.

```
apps/store       Next.js 16 storefront, Cache Components on
apps/studio      Sanity Studio
apps/functions   Sanity Functions, one folder each
packages/sanity  schemas, client factory, GROQ queries, generated types
packages/demand  the search-gap loop's shared logic
packages/config  shared tsconfig and ESLint config
```

## Where things are explained

| | |
|---|---|
| Each requirement and the file that satisfies it | `docs/release-checklist.md` |
| What is prerendered and what streams, per route | `docs/static-vs-dynamic.md` |
| The build output that is asserted on every build | `docs/build-output.md` |
| Decisions that were hard to reverse | `docs/adr/` |
| Measurements behind the decisions | `specs/callout.md` |
| Deployment, revalidation, live editing, variables | `docs/operations.md` |
| The search-gap loop | `docs/search-gap-loop.md` |
| What each piece of work set out to do | `specs/`, and `docs/pull-requests.md` |
| The rules the code is written to | `AGENTS.md` |

`pnpm verify` ends with `scripts/check-build.mjs`, which fails if any page route stops
prerendering or if the API bypass token reaches a file under `.next/static`, and
`scripts/check-metadata.mjs`, which reads the prerendered HTML and fails on metadata the
store did not choose.
