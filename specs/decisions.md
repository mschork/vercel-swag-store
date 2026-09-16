# Vercel Swag Store, Decisions

Settled choices that every epic spec inherits. Change here first, then in the specs.

## Scope and delivery

- Deliverables: public GitHub repo plus two Vercel deployments (store, studio); links emailed to the reviewer.
- Licence: none. The repo is public only for the handover and review; the README states the code is not licensed for reuse.
- No fixed deadline. Plan for about one week for E1 to E7 and E10 to E12; Sanity extras (lookbook, collections, guides, extra routes) are stretch.
- Build workflow: Claude Code run locally, one spec file per epic under `specs/`, plus `AGENTS.md` at the repo root. One branch and PR per epic; Vercel preview deployment with comments enabled for review before merge. Working documents that must not be committed (unredacted API reference, scratch notes) live under `working/`, which is git-ignored; anything under `specs/` is committed and must contain no secrets.

## Architecture

- Monorepo: pnpm workspaces + Turborepo. `apps/store` (Next.js 16, App Router, Cache Components on, TypeScript, Tailwind v4), `apps/studio` (Sanity Studio), `packages/sanity` (schemas, client, GROQ, typegen), `packages/config` (tsconfig, eslint).
- Source of truth: the Vercel Swag Store API for products, price, category, featured, stock, promotion and cart. Sanity for marketing content and product enrichment; merged at render time, API fields win on conflict.
- Static vs dynamic: product list, product detail, categories and store config are cached with `"use cache"` (tagged, long `cacheLife`). Stock, promotion and cart are dynamic and rendered inside Suspense boundaries. `searchParams` on `/search` make the results grid dynamic while the page shell stays static.
- Cart: server-side only, so the cart token never reaches the browser (`docs/adr/0002-cart-server-side-only.md`). Token in an httpOnly, `sameSite=lax`, `secure` cookie with a 24 h `maxAge`; created lazily on first add. Server Actions for add, update, remove; `useOptimistic` for quantity and remove. Dedicated `/cart` page; no drawer. The Checkout button is a form bound to a `placeOrder` Server Action that drops the cart cookie and redirects to a static `/checkout` page ("Thank you for your order!"); its copy comes from Sanity from E09.
- Search: API `?search` and `?category` only. Category-aware query expansion when the query matches a category name or slug (singular or plural); results capped at 5; URL is the state.
- Validation: zod v4 at the three trust boundaries (env in `lib/env.ts`, API responses in `fetchApi`, Server Action inputs); types inferred from schemas. Progressive enhancement: the search form sits in the static shell and works without JavaScript (`next/form`). Cart forms are native `<form action>` Server Actions, so they survive a failed or slow hydration, but content inside a dynamic hole (a streamed Suspense boundary) needs JavaScript to appear.
- Ignore the `x-redacted` directive in the API's OpenAPI spec . Mentioned in README as a deliberate choice.

## UI and design

- Components: shadcn/ui using Base UI primitives, minimal set (Button, Input, Select, Badge, Skeleton, Sheet or Dialog only if needed, Toast). Tokens overridden so the result does not look like stock shadcn.
- Typography: Geist Sans and Geist Mono via `next/font`.
- Colour: monochrome. Dark canvas `#000` with `#0a0a0a` secondary; light canvas `#fff` with `#fafafa` secondary; one accent (blue, Vercel family) reserved for the price pill's hover, focus, primary action and the promo strip. No gradients, glows or shadows.
- Theme: light and dark follow the visitor's operating-system preference through `prefers-color-scheme`. No selector, no `next-themes`, no theme script; Tailwind's default media-query `dark:` variant.
- Branding: page title "Vercel Swag Store"; header shows the Vercel triangle as an inline SVG in `currentColor` with the store name as Geist text, not the wordmark SVG. Root metadata (title, template, description, site name) comes from the API's `/store/config` `seo` block.
- Layout: mobile-first; breakpoints 375, 768, 1280; header and footer full width, content in a `max-w-6xl` column; the header is sticky. Products render as a single column of row cards below 768 and as grid cards above: 3 columns on the home page, 3 / 5 on search (768 / 1024). See E10.

## Sanity

- New Sanity project, dataset `production`. Store reads through `next-sanity` client wrapped in `"use cache"` with `cacheTag('sanity')` and per-document tags; publish webhook hits `/api/revalidate` and calls `revalidateTag`. No Live Content API.
- Document types: `siteSettings`, `homePage`, `checkoutPage`, `productEnrichment`, `catalogProduct`, `lookbookEntry`, `collection`, `guide`. Product references use the API `id` string with a Studio picker fed from `catalogProduct` documents (seeded by script; E15 syncs them daily with a scheduled Sanity Function). The Studio holds no API secret.
- Studio deployed both as `apps/studio` on Vercel and via `sanity deploy`; both origins allowed in Sanity CORS.

## Platform signals

- `@vercel/speed-insights` and `@vercel/analytics` in the store.
- `opengraph-image.tsx` routes via `next/og` for home and product; every other route inherits the root image.
- Preview deployments with comments enabled on every PR.
- Indexing: the deployed store answers `X-Robots-Tag: noindex` on every route, because it sells invented products under the Vercel name. Root metadata, page metadata, Open Graph images, `sitemap.xml` and `robots.txt` are all built as the brief asks; `robots.txt` allows crawling so the header is read.
- Not included: Flags SDK, Edge Config, KV.
- Security headers: CSP with `'unsafe-inline'` for scripts and a strict host list, plus `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. No nonces: they need a per-request proxy and make every page dynamic. Inline-script injection is prevented at the source instead (`react/no-danger` as an error, zod at trust boundaries). See `docs/adr/0001-csp-unsafe-inline-scripts.md`.

## Quality

- Vitest for the API client, price formatting, merge logic and search expansion.
- Playwright smoke: home renders 6 products and promo; PDP shows stock and add to cart; add to cart updates badge; refresh keeps cart; search by URL reproduces results; empty state.
- Lighthouse mobile 90+ on all routes; axe with no serious issues.
- Pre-submission grep for `redacted` and `hhhhhh`; requirement checklist walked from `assignment.md`.

## Environment variables

Store: `API_BASE_URL`, `API_BYPASS_TOKEN` (server only), `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`.
Store, E11: `CATALOG_REVALIDATE_SECRET`.
Store, E13 only: `SANITY_API_WRITE_TOKEN` (server only), `DEMAND_ANALYSE_SECRET`, `AI_GATEWAY_API_KEY`.
Studio: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`. No API variables: the product picker reads `catalogProduct` documents.
Local scripts only: `SANITY_API_WRITE_TOKEN` for the seed script.

## Epic index

E01 foundation, E02 API client, E03 shell and metadata, E04 home, E05 PDP, E06 cart, E07 search, E08 Sanity model, E09 Sanity integration, E10 design, E11 performance, E12 delivery, E13 search-gap loop (stretch), E14 Eve agent (stretch, after E13), E15 catalogue sync (stretch, after E09), E16 cart API improvements (stretch, after E12). Order: E01 to E07, E10, E11, E08, E09, E12, then E13, E14, E15 and E16 if time remains.
