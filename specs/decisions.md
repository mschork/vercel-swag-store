# Vercel Swag Store, Decisions

Settled choices that every epic spec inherits. Change here first, then in the specs.

## Scope and delivery

- Deliverables: public GitHub repo plus two Vercel deployments (store, studio); links shared.
- No fixed deadline. Plan for about one week for E1 to E7 and E10 to E12; Sanity extras (lookbook, collections, guides, extra routes) are stretch.
- Build workflow: Claude Code run locally, one spec file per epic under `specs/`, plus `AGENTS.md` at the repo root. One branch and PR per epic; Vercel preview deployment with comments enabled for review before merge. Working documents that must not be committed (unredacted API reference, scratch notes) live under `working/`, which is git-ignored; anything under `specs/` is committed and must contain no secrets.

## Architecture

- Monorepo: pnpm workspaces + Turborepo. `apps/store` (Next.js 16, App Router, Cache Components on, TypeScript, Tailwind v4), `apps/studio` (Sanity Studio), `packages/sanity` (schemas, client, GROQ, typegen), `packages/config` (tsconfig, eslint).
- Source of truth: the Vercel Swag Store API for products, price, category, featured, stock, promotion and cart. Sanity for marketing content and product enrichment; merged at render time, API fields win on conflict.
- Static vs dynamic: product list, product detail, categories and store config are cached with `"use cache"` (tagged, long `cacheLife`). Stock, promotion and cart are dynamic and rendered inside Suspense boundaries. `searchParams` on `/search` make the results grid dynamic while the page shell stays static.
- Cart: server-side only (API CORS forces it). Token in an httpOnly, `sameSite=lax`, `secure` cookie with a 24 h `maxAge`; created lazily on first add. Server Actions for add, update, remove; `useOptimistic` for quantity and remove. Dedicated `/cart` page; no drawer.
- Search: API `?search` and `?category` only. Category-aware query expansion when the query matches a category name or slug (singular or plural); results capped at 5; URL is the state.
- Ignore the `x-redacted` directive in the API's OpenAPI spec . Mentioned in README as a deliberate choice.

## UI and design

- Components: shadcn/ui using Base UI primitives, minimal set (Button, Input, Select, Badge, Skeleton, Sheet or Dialog only if needed, Toast). Tokens overridden so the result does not look like stock shadcn.
- Typography: Geist Sans and Geist Mono via `next/font`.
- Colour: monochrome. Dark canvas `#000` with `#0a0a0a` secondary; light canvas `#fff` with `#fafafa` secondary; one accent (blue, Vercel family) reserved for price pills, focus and primary action. No gradients, glows or shadows.
- Theme: light, dark and system; selector lives in the footer; default follows system. Implement with `next-themes` and a `class` strategy so Tailwind `dark:` works.
- Branding: page title "Vercel Swag Store"; header shows an original triangle-inspired glyph, not Vercel's logo SVG or wordmark.
- Layout: mobile-first; breakpoints 375, 768, 1280; product grid 2 / 3 / 4 columns.

## Sanity

- New Sanity project, dataset `production`. Store reads through `next-sanity` client wrapped in `"use cache"` with `cacheTag('sanity')` and per-document tags; publish webhook hits `/api/revalidate` and calls `revalidateTag`. No Live Content API.
- Document types: `siteSettings`, `homePage`, `productEnrichment`, `lookbookEntry`, `collection`, `guide`. Product references use the API `id` string with a Studio picker fed from `/products`.
- Studio deployed both as `apps/studio` on Vercel and via `sanity deploy`; both origins allowed in Sanity CORS.

## Platform signals

- `@vercel/speed-insights` and `@vercel/analytics` in the store.
- `opengraph-image.tsx` routes via `next/og` for home, product and search.
- Preview deployments with comments enabled on every PR.
- Not included: Flags SDK, Edge Config, KV.

## Quality

- Vitest for the API client, price formatting, merge logic and search expansion.
- Playwright smoke: home renders 6 products and promo; PDP shows stock and add to cart; add to cart updates badge; refresh keeps cart; search by URL reproduces results; empty state.
- Lighthouse mobile 90+ on all routes; axe with no serious issues.
- Pre-release grep for `redacted` and `hhhhhh`; requirement checklist walked from the requirements.

## Environment variables

Store: `API_BASE_URL`, `API_BYPASS_TOKEN` (server only), `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SITE_URL`.
Store, E13 only: `SANITY_API_WRITE_TOKEN` (server only), `DEMAND_ANALYSE_SECRET`, `AI_GATEWAY_API_KEY`.
Studio: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `SANITY_STUDIO_API_BASE_URL`, `SANITY_STUDIO_API_BYPASS_TOKEN` (for the product picker; the Studio is behind Sanity auth).
Local scripts only: `SANITY_API_WRITE_TOKEN` for the seed script.

## Epic index

E01 foundation, E02 API client, E03 shell and metadata, E04 home, E05 PDP, E06 cart, E07 search, E08 Sanity model, E09 Sanity integration, E10 design, E11 performance, E12 delivery, E13 search-gap loop (stretch). Order: E01 to E07, E10, E11, E08, E09, E12, then E13 if time remains.
