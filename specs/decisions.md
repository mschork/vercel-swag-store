# Vercel Swag Store, Decisions

Settled choices that every epic spec inherits. Change here first, then in the specs.

## Scope and delivery

- Deliverables: public GitHub repo plus two Vercel deployments (store, studio); links shared.
- Licence: none. The repo is public to be read; the README states the code is not licensed for reuse.
- No fixed deadline. Plan for about one week for E1 to E7 and E10 to E12; Sanity extras (testimonials, collections, guides, extra routes) are stretch.
- Build workflow: Claude Code run locally, one spec file per epic under `specs/`, plus `AGENTS.md` at the repo root. One branch and PR per epic; Vercel preview deployment with comments enabled for review before merge. Working documents that must not be committed (unredacted API reference, scratch notes) live under `working/`, which is git-ignored; anything under `specs/` is committed and must contain no secrets.

## Architecture

- Monorepo: pnpm workspaces + Turborepo. `apps/store` (Next.js 16, App Router, Cache Components on, TypeScript, Tailwind v4), `apps/studio` (Sanity Studio), `packages/sanity` (schemas, client, GROQ, typegen), `packages/config` (tsconfig, eslint). Stretch epics add `apps/functions` (Sanity Functions, E13 and E15), `packages/demand` (E13) and `apps/demand-agent` (Eve, E14).
- Source of truth: the Vercel Swag Store API for products, price, category, featured, stock, promotion and cart. Sanity for marketing content and product enrichment; merged at render time, API fields win on conflict.
- Static vs dynamic: product list, product detail, categories and store config are cached with `"use cache"` (tagged, long `cacheLife`). Stock, promotion and cart are dynamic and rendered inside Suspense boundaries. `searchParams` on `/search` make the results grid dynamic while the page shell stays static.
- Cart: server-side only, so the cart token never reaches the browser (`docs/adr/0002-cart-server-side-only.md`). Token in an httpOnly, `sameSite=lax`, `secure` cookie with a 24 h `maxAge`; created lazily on first add. Server Actions for add, update, remove; they answer with the cart's item count, never its lines, so the header badge updates without a second read. Optimistic updates for add, quantity and remove (`specs/E16-cart-api-improvements.md`). Dedicated `/cart` page; no drawer. The Checkout button is a form bound to a `placeOrder` Server Action that drops the cart cookie and redirects to a static `/checkout` page ("Thank you for your order!"); its copy comes from Sanity from E09.
- Search: API `?search` and `?category` only. Category-aware query expansion when the query matches a category name or slug (singular or plural); results capped at 5; URL is the state.
- Validation: zod v4 at the three trust boundaries (env in `lib/env.ts`, API responses in `fetchApi`, Server Action inputs); types inferred from schemas. Progressive enhancement: the search form sits in the static shell and works without JavaScript (`next/form`). Cart forms are native `<form action>` Server Actions, so they survive a failed or slow hydration, but content inside a dynamic hole (a streamed Suspense boundary) needs JavaScript to appear.
- Ignore the `x-redacted` directive in the API's OpenAPI spec . Mentioned in README as a deliberate choice.

## UI and design

- Components: shadcn/ui using Base UI primitives, minimal set (Button, Input, Select, Badge, Skeleton, Sheet or Dialog only if needed, Toast). Tokens overridden so the result does not look like stock shadcn.
- Typography: Geist Sans and Geist Mono via `next/font/google`, Latin subset (E11).
- Colour: monochrome. Dark canvas `#000` with `#0a0a0a` secondary; light canvas `#fff` with `#fafafa` secondary; one accent (blue, Vercel family) reserved for the price pill's hover, focus, primary action and the promo strip. No gradients, glows or shadows.
- Theme: light and dark follow the visitor's operating-system preference through `prefers-color-scheme`. No selector, no `next-themes`, no theme script; Tailwind's default media-query `dark:` variant.
- Branding: page title "Vercel Swag Store"; header shows the Vercel triangle as an inline SVG in `currentColor` with the store name as Geist text, not the wordmark SVG. Root metadata (title, template, description, site name) comes from the API's `/store/config` `seo` block.
- Layout: mobile-first; breakpoints 375, 768, 1280; header and footer full width, content in a `max-w-6xl` column; the header is sticky. Products render as a single column of row cards below 768 and as grid cards above: 3 columns on the home page, 3 / 5 on search (768 / 1024). See E10.

## Sanity

- New Sanity project, dataset `production` and public, so the store needs no read token. Store reads through a `next-sanity` client wrapped in `"use cache"` with `cacheTag('sanity')` and per-document tags, on a `content` profile (stale 5 min, revalidate 1 d, expire 7 d); the publish webhook hits `/api/revalidate/sanity`, verifies Sanity's signature and expires the type and id tags. No Live Content API.
- Document types: `siteSettings`, `homePage`, `checkoutPage`, `product`, `category`, `testimonial`, `faq`. Products and categories are mirrors of the API, written by a script and read only in the Studio, so every link from editorial content to the catalogue is an ordinary Sanity reference (`docs/adr/0003-sanity-mirrors-api-products-and-categories.md`); E15 replaces the script's trigger with a scheduled Sanity Function. The Studio holds no API secret. E08 and E09 ship in one pull request.
- Demand signals (E13): `searchGap` and `productIdea` are written by machines and carry dotted ids (`searchGap.<hash>`), which makes them unreadable without a token in the public dataset. Capture runs in `after()` in the store; a Sanity Function wakes a Vercel Workflow that asks a model through AI SDK 7 and AI Gateway; editors decide in the Studio through Sanity Workflows. Functions, the robot token and schedules are declared in one root `sanity.blueprint.ts`. Shared logic lives in `packages/demand`.
- Studio deployed both as `apps/studio` on Vercel and via `sanity deploy`; both origins allowed in Sanity CORS.
- Preview Studios on Vercel are admitted by one wildcard CORS origin with credentials, `https://vercel-swag-studio-*-markusschorks-projects.vercel.app`, so a pull request's Studio works without registering each URL. The pattern is limited to the Studio project, which keeps the store's previews and every other project in the team untrusted. Its limit is known: a Vercel project's address is its name, so a stranger's project could be named to match, and a script there could act as a logged-in editor who opens it. That is accepted for a single-editor demo dataset that the seed and sync scripts restore; the entry is deleted after review, or the day a second editor or real content arrives.

## Platform signals

- `@vercel/speed-insights` and `@vercel/analytics` in the store.
- `opengraph-image.tsx` routes via `next/og` for home and product; every other route inherits the root image.
- Preview deployments with comments enabled on every PR.
- Indexing: the deployed store answers `X-Robots-Tag: noindex` on every route, because it sells invented products under the Vercel name. Root metadata, page metadata, Open Graph images, `sitemap.xml` and `robots.txt` are all built as the requirements ask; `robots.txt` allows crawling so the header is read.
- Not included: Flags SDK, Edge Config, KV.
- Security headers: CSP with `'unsafe-inline'` for scripts and a strict host list, plus `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. No nonces: they need a per-request proxy and make every page dynamic. Inline-script injection is prevented at the source instead (`react/no-danger` as an error, zod at trust boundaries). See `docs/adr/0001-csp-unsafe-inline-scripts.md`.

## Quality

- Vitest for the API client, price formatting, merge logic and search expansion.
- Playwright smoke: home renders 6 products and promo; PDP shows stock and add to cart; add to cart updates badge; refresh keeps cart; search by URL reproduces results; empty state.
- Lighthouse mobile 90+ on all routes; axe with no serious issues.
- Pre-release grep for `redacted` and `hhhhhh`; requirement checklist walked from the requirements.

## Environment variables

Store: `API_BASE_URL`, `API_BYPASS_TOKEN` (server only), `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`. No Sanity read token: the dataset is public.
Store, E11: `CATALOG_REVALIDATE_SECRET`.
Store, E13 only: `SANITY_API_WRITE_TOKEN` (server only), `DEMAND_ANALYSE_SECRET`. No AI Gateway key: on Vercel the AI SDK authenticates with the deployment's OIDC token; locally `vercel env pull` provides one.
Sanity Functions, E13 only: `STORE_URL` and `DEMAND_ANALYSE_SECRET` on `gap-threshold`, set with `sanity functions env add`, never in `sanity.blueprint.ts`.
Studio: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`. No API variables: the product picker reads `catalogProduct` documents.
Local scripts only: `SANITY_API_WRITE_TOKEN` for the seed script.

## Epic index

E01 foundation, E02 API client, E03 shell and metadata, E04 home, E05 PDP, E06 cart, E07 search, E08 Sanity model, E09 Sanity integration, E10 design, E11 performance, E12 delivery, E13 search-gap loop (stretch), E14 Eve agent (stretch, after E13), E15 catalogue sync (stretch, after E09), E16 cart API improvements. Order: E01 to E07, E10, E16, E11, E08 and E09 together, E12, then E13, E14 and E15 if time remains.

| Epic | State |
|---|---|
| E01 foundation | done |
| E02 API client | done |
| E03 shell and metadata | done |
| E04 home | done |
| E05 PDP | done |
| E06 cart | done |
| E07 search | done |
| E10 design | done but for Lighthouse on every production route |
| E16 cart API improvements | done |
| E11 performance | done |
| E08 Sanity model | next, with E09 |
| E09 Sanity integration | next, with E08 |
| E12 delivery | last before release |
| E13, E14, E15 | stretch, only if time remains |

Each epic's own spec holds the acceptance criteria; this table says which epic is finished.
