# Pull requests

The build history of this repository: one pull request per piece of work, oldest
first. Each body records what a human decided, what was generated, and which
assumptions it relied on.

The pull requests themselves live in the repository this was developed in, which
is private. This file is the record.

<details>
<summary>All 56, by number</summary>

- [#1 — E01: monorepo foundation](#1--e01-monorepo-foundation)
- [#2 — E02: API client and data layer](#2--e02-api-client-and-data-layer)
- [#3 — E03: shell, layout and metadata](#3--e03-shell-layout-and-metadata)
- [#4 — E04: home page with hero, promo banner and featured grid](#4--e04-home-page-with-hero-promo-banner-and-featured-grid)
- [#5 — E05: product page with prerendered details, streamed stock and Add to Cart](#5--e05-product-page-with-prerendered-details-streamed-stock-and-add-to-cart)
- [#6 — E06: cart with a server-side token, optimistic rows and a demo order](#6--e06-cart-with-a-server-side-token-optimistic-rows-and-a-demo-order)
- [#7 — E07: search with a static shell, category-aware expansion and one pending state](#7--e07-search-with-a-static-shell-category-aware-expansion-and-one-pending-state)
- [#8 — E07: match a category across hyphens and spaces, and default to five products](#8--e07-match-a-category-across-hyphens-and-spaces-and-default-to-five-products)
- [#9 — E07: rank an expanded search by the category it named](#9--e07-rank-an-expanded-search-by-the-category-it-named)
- [#10 — E10: design system and polish](#10--e10-design-system-and-polish)
- [#11 — E10: promo ticket chip and marquee](#11--e10-promo-ticket-chip-and-marquee)
- [#12 — E16: cart API improvements](#12--e16-cart-api-improvements)
- [#13 — E11: performance fixes and caching evidence (part 1)](#13--e11-performance-fixes-and-caching-evidence-part-1)
- [#14 — E11: caching docs, visual regression and font subsetting (part 2)](#14--e11-caching-docs-visual-regression-and-font-subsetting-part-2)
- [#15 — E08 + E09: Sanity content model, Studio and rendering](#15--e08--e09-sanity-content-model-studio-and-rendering)
- [#16 — E09 follow-ups: drop badges, readable enrichment column, smoother FAQ](#16--e09-follow-ups-drop-badges-readable-enrichment-column-smoother-faq)
- [#17 — E09: align the enrichment with the columns above it](#17--e09-align-the-enrichment-with-the-columns-above-it)
- [#18 — E09: give the single lookbook photo the full column](#18--e09-give-the-single-lookbook-photo-the-full-column)
- [#19 — E09: lookbook heading above the photo, quote bottom right](#19--e09-lookbook-heading-above-the-photo-quote-bottom-right)
- [#20 — E09: FAQ chevron before the question](#20--e09-faq-chevron-before-the-question)
- [#21 — E13: search-gap loop](#21--e13-search-gap-loop)
- [#22 — E08: Studio desk with sections and icons](#22--e08-studio-desk-with-sections-and-icons)
- [#23 — E09: lookbook entries become testimonials](#23--e09-lookbook-entries-become-testimonials)
- [#24 — E13: accept or reject a product idea in the Studio](#24--e13-accept-or-reject-a-product-idea-in-the-studio)
- [#25 — E08: product ideas first under Demand signals, and a Tailwind shorthand on the hero](#25--e08-product-ideas-first-under-demand-signals-and-a-tailwind-shorthand-on-the-hero)
- [#26 — E13: integration test for the analysis lock](#26--e13-integration-test-for-the-analysis-lock)
- [#27 — E17: live editing with the Presentation tool](#27--e17-live-editing-with-the-presentation-tool)
- [#28 — E17: pass PRESENTATION_STUDIO_ORIGINS through Turborepo](#28--e17-pass-presentationstudioorigins-through-turborepo)
- [#29 — Rich text: avoid a one-word last line](#29--rich-text-avoid-a-one-word-last-line)
- [#30 — E18: product listing with category pages and a price sort (slice 1)](#30--e18-product-listing-with-category-pages-and-a-price-sort-slice-1)
- [#31 — E18: category intro from Sanity on the product listing (slice 2)](#31--e18-category-intro-from-sanity-on-the-product-listing-slice-2)
- [#32 — E18: align the Search label, chip row chevrons, two-column listing on phones](#32--e18-align-the-search-label-chip-row-chevrons-two-column-listing-on-phones)
- [#33 — Comments: audit and cleanup across the repo](#33--comments-audit-and-cleanup-across-the-repo)
- [#34 — Conventions: state the comment standard in AGENTS.md](#34--conventions-state-the-comment-standard-in-agentsmd)
- [#35 — E19: a stock count and a promotion that hold still](#35--e19-a-stock-count-and-a-promotion-that-hold-still)
- [#36 — Fix: checkout 500, a summary rule that never drew, and a lazy largest paint](#36--fix-checkout-500-a-summary-rule-that-never-drew-and-a-lazy-largest-paint)
- [#37 — Fix: cart lines no longer wait for the favourites row](#37--fix-cart-lines-no-longer-wait-for-the-favourites-row)
- [#38 — Fix: the build task sees ALLOW_INDEXING](#38--fix-the-build-task-sees-allowindexing)
- [#39 — Fix: declare CATALOG_REVALIDATE_SECRET for turbo](#39--fix-declare-catalogrevalidatesecret-for-turbo)
- [#40 — Fix: cart hydration error on a first visit, and a search description in the head](#40--fix-cart-hydration-error-on-a-first-visit-and-a-search-description-in-the-head)
- [#41 — Fix: search has an Open Graph description in the head](#41--fix-search-has-an-open-graph-description-in-the-head)
- [#42 — Fix: the Studio no longer offers actions that break the store](#42--fix-the-studio-no-longer-offers-actions-that-break-the-store)
- [#43 — Fix: Studio forms, lists and previews are easier to work in](#43--fix-studio-forms-lists-and-previews-are-easier-to-work-in)
- [#44 — Feat: the sharing card is the hero, and an uploaded sharing image wins](#44--feat-the-sharing-card-is-the-hero-and-an-uploaded-sharing-image-wins)
- [#45 — Fix: Studio forms, lists and previews are easier to work in](#45--fix-studio-forms-lists-and-previews-are-easier-to-work-in)
- [#46 — Fix: the sharing card is prerendered on every build](#46--fix-the-sharing-card-is-prerendered-on-every-build)
- [#47 — E20: content for AI crawlers](#47--e20-content-for-ai-crawlers)
- [#48 — Fix: the draft-mode exit redirected off the store](#48--fix-the-draft-mode-exit-redirected-off-the-store)
- [#49 — E21: the first visit renders stock and the promotion on the server](#49--e21-the-first-visit-renders-stock-and-the-promotion-on-the-server)
- [#50 — E21: grid badges fade in, and a browser without JavaScript gets a notice](#50--e21-grid-badges-fade-in-and-a-browser-without-javascript-gets-a-notice)
- [#51 — E22: the cart opens on intent, and Add to Cart does not wait for the save](#51--e22-the-cart-opens-on-intent-and-add-to-cart-does-not-wait-for-the-save)
- [#52 — E23: a quantity change and a removal cost one cart call](#52--e23-a-quantity-change-and-a-removal-cost-one-cart-call)
- [#53 — E22: the button spins for a second after a click](#53--e22-the-button-spins-for-a-second-after-a-click)
- [#54 — E24: the session store](#54--e24-the-session-store)
- [#55 — Fix: Bump the actions group with 4 updates](#55--fix-bump-the-actions-group-with-4-updates)
- [#56 — Fix(deps): Bump the minor-and-patch group with 11 updates](#56--fixdeps-bump-the-minor-and-patch-group-with-11-updates)

</details>

## #1 — E01: monorepo foundation

`epic/E01-foundation` · merged 2026-09-14

## Summary

E01 monorepo foundation: pnpm + Turborepo workspace with a Next.js 16 store app (Cache Components on) and a Sanity Studio app, both building locally and wired to two Vercel projects.

## Decided by the spec (human decisions)

- Layout: `apps/store`, `apps/studio`, `packages/config`, `packages/sanity`; pnpm workspaces + Turborepo.
- Store: Next.js 16 App Router, TypeScript, Tailwind v4, ESLint, `cacheComponents: true`, image remote patterns for the blob store and `cdn.sanity.io`, Geist Sans/Mono via `next/font`.
- Studio: Sanity Studio reading `schemaTypes` from `@repo/sanity`, `vercel.json` with `outputDirectory: dist` and an SPA rewrite.
- Root scripts `dev`, `build`, `lint`, `typecheck`, `test`, `verify` delegating to Turbo; per-task `env` declarations in `turbo.json`.
- Vercel: two projects (`vercel-swag-store`, `vercel-swag-studio`) with root directories, Next.js / Other presets, `npx turbo-ignore` as the ignored build step, env vars for Production and Preview.
- Decided in review, not in the spec: pnpm bumped to the latest stable (12.4.1) rather than a 10.x pin; the brief added to `specs/`; a git-ignored `working/` folder for unredacted documents.

## Generated

- Root: `pnpm-workspace.yaml` (with pnpm 12 `allowBuilds` policy), `package.json`, `turbo.json`, `.nvmrc` (24), `.gitignore`, `.editorconfig`, `.prettierrc`, README with Running locally and Environment filled in.
- `apps/store`: scaffolded with `create-next-app@16.3.5`, restructured to `app/` at the app root; `next.config.ts`, `lib/env.ts` + `instrumentation.ts` startup guard, `.env.example`, placeholder layout and page, empty `@theme` block.
- `apps/studio`: hand-scaffolded to match the `create sanity` clean template (the scaffolder needs a real project id, which did not exist at the time); config reads `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` from env and fails with a clear message if missing.
- `packages/config`: `tsconfig/base.json`, `nextjs.json`, `react-library.json`, `eslint/next.mjs` (Next core-web-vitals + TypeScript rules).
- `packages/sanity`: `schemaTypes` (empty), `createSanityClient` factory, `requireSanityEnv` helper; consumed as source via `exports`.
- Agent skills configuration (`/setup-matt-pocock-skills`): `## Agent skills` section in AGENTS.md, `docs/agents/{issue-tracker,triage-labels,domain}.md` (local markdown tracker under git-ignored `.scratch/`, default triage labels, single-context domain docs with `specs/decisions.md` as the canonical decision log). Skills themselves are installed under git-ignored `.claude/skills/`.

## Assumptions from the spec relied on

- Prettier: `singleQuote: true`, `semi: false`.
- No `src/` directory; `app/`, `components/`, `lib/` at the app root.
- `typedRoutes: true`.
- `lib/env.ts` without zod.
- `@repo/sanity` consumed as source, no build step.
- Vercel personal account (`markusschorks-projects`).
- Repo private until E12.

## Installed versions (all spec-named APIs verified present)

| Package | Version |
|---|---|
| next | 16.3.5 |
| react | 19.2.8 |
| turbo | 2.10.12 |
| sanity | 6.13.2 |
| @sanity/client | 8.6.1 |
| pnpm | 12.4.1 |

`cacheComponents`, `typedRoutes`, `cacheTag`, `cacheLife`, `revalidateTag`, `updateTag` all exist in Next 16.3.5. Nothing substituted.

## Verified

- `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build` pass; `pnpm dev` serves store on 3000 and studio on 3333.
- `lib/env.ts` throws "Missing required environment variable(s): API_BASE_URL, API_BYPASS_TOKEN" at `next start` when unset, and the server boots when set.
- No secret in git history: the API bypass token was removed from `specs/openapi.json` (placeholder `<API_BYPASS_TOKEN>`) before the first push; unredacted copy lives in git-ignored `working/`.

## Notes and flags

- Store `typecheck` runs `next typegen` before `tsc` because `LayoutProps` is a Next-generated global type.
- `apps/store/AGENTS.md` and `CLAUDE.md` are the create-next-app defaults; `next dev` re-creates AGENTS.md, so they are committed.
- Local verification ran on Node 22.15; `.nvmrc` and Vercel use 24.

## Deferred

- Acceptance criterion "Both Vercel projects deploy from main": only half verified. Both projects built this branch successfully and the PR shows green Vercel checks plus "Vercel Preview Comments", but no deployment from `main` exists yet because the repo was connected after the first push. Merging this PR creates the first production deployment. Deployments are behind Vercel Authentication (HTTP 302 to login when logged out).
- Env vars not yet set on Vercel because they do not exist yet: `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET` (E09) and the E13 variables. `NEXT_PUBLIC_SITE_URL` is set for Production only.
- No CI workflow; "warnings treated as errors" is enforced by `eslint --max-warnings 0` in each app's lint script.
- Prettier is configured but not installed as a dependency (no script runs it in E01).
- `sanity deploy` hosting and Sanity CORS origins (E08/E09).

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #2 — E02: API client and data layer

`epic/E02-api-client` · merged 2026-09-14

## Summary

E02 API client and data layer: one server-only, typed access layer under `apps/store/lib/api` where every function carries an explicit cache policy, validated with zod at the trust boundary, plus the env schema, `formatPrice`, and Vitest wiring. No UI. Nothing here is rendered yet; E03 to E07 consume it.

## Decided by the spec (human decisions)

- Settled in the grill before this branch (commit `7ea8ad2` on `main`): cart calls stay server-side because the cart token is a bearer credential, not because of CORS (`docs/adr/0002-cart-server-side-only.md`); the `Cart` type carries no token and only `createCart` returns one; env schema in E02 covers `API_BASE_URL`, `API_BYPASS_TOKEN`, `NEXT_PUBLIC_SITE_URL` and Sanity vars join in E09; non-JSON error bodies map to `HTTP_ERROR`; timeouts are never retried; one custom `cacheLife` profile `catalog`; `getPromotion` returns `null` when absent or inactive; `/health` gets `getHealth()`; `getProducts` takes `featured: boolean` and `category: string`; Vitest stubs `next/cache` and aliases `server-only`.
- The bypass header is always sent and the token stays required, even though the API was not enforcing Deployment Protection on 14 Sep 2026.
- Hooks (`main`, commit `704bfb6`): Husky runs lint-staged ESLint on commit and `turbo typecheck` on push.

## Generated

- `lib/api/client.ts`: `fetchApi(path, { schema, metaSchema?, method?, body?, headers? })` returns `{ data, meta, headers }`. `ApiError { status, code, message, path, details }`. 5 s timeout via `AbortSignal.timeout`; one retry after 250 ms on network error or 5xx for GET only; `TIMEOUT`, `NETWORK_ERROR`, `HTTP_ERROR`, `INVALID_RESPONSE` codes; API codes pass through. Schema failures log the path and zod issue paths, never the body.
- `lib/api/schemas.ts`, `types.ts`, `cache.ts`: zod schemas, inferred types, `TAGS` and `CATALOG_PROFILE`.
- `lib/api/products.ts`, `categories.ts`, `store.ts`, `stock.ts`, `promotions.ts`, `cart.ts`: one function per endpoint, twelve in total.
- `lib/env.ts` (zod, parsed at module load, imported by `instrumentation.ts`), `lib/env.public.ts` (client-safe `NEXT_PUBLIC_*`).
- `lib/format.ts`: `formatPrice(cents, currency = 'USD', locale = 'en-US')`.
- `vitest.config.mts`, `test/setup.ts`, `test/empty.ts`, `test/helpers.ts`; `next.config.ts` gains the `catalog` profile; `coverage/` ignored by ESLint and git.
- Tests next to each module: `env`, `client`, `schemas`, `products`, `cart`, `categories`, `store` (config and health), `stock`, `promotions`, `format`, and the opt-in `integration.test.ts`. 52 unit tests, 2 integration tests.

## Deviations from the spec

- **`z.object` instead of `z.looseObject`.** The spec says loose objects "so new API fields do not break parsing". zod v4's plain `z.object` strips unknown keys without failing, which meets that goal, and `z.looseObject` gives every inferred type a string index signature that collapses `Omit<Cart, 'token'>` to `Record<string, unknown>`, so the `Cart` type lost its fields. `schemas.test.ts` pins both behaviours. Proposed spec sentence: "Use `z.object()` (zod v4 strips unknown keys by default) so new API fields never break parsing."
- **`vitest.config.mts`, not `.ts`**: Vite's native config loader wants ESM to be `.mts` in a CommonJS package.
- **`vite` added as a dev dependency** for `loadEnv` in `vitest.config.mts`, so `API_INTEGRATION=1 pnpm test` reads `.env.local`. It was already installed as Vitest's own dependency.
- **`ApiError.path`** added (the request path, never a token) so logs say which endpoint failed.
- **`getAllProductSlugs` has its own `"use cache"`** so `generateStaticParams` and the sitemap share one entry.
- **Acceptance criterion wording.** "`grep -n token apps/store/lib/api/types.ts` shows only `createCart`'s return" cannot hold literally: `createCart` lives in `cart.ts`. The grep now returns nothing. Proposed wording on `main`: "`grep -n token apps/store/lib/api/types.ts` returns nothing; only `createCart` in `cart.ts` returns a token."

## Assumptions from the spec relied on

- `{itemId}` in the cart routes is the product id (confirmed live and in `api-reference.md`).
- `/products/{id}` accepts id or slug.
- Errors thrown inside a `"use cache"` function are not cached, so an unknown slug is re-checked on the next request.

## Installed versions (all spec-named APIs verified present)

| Package | Version |
|---|---|
| zod | 4.6.4 |
| vitest | 5.0.0 |
| @vitest/coverage-v8 | 5.0.0 |
| vite | 8.3.0 |
| server-only | 0.0.1 |

`z.looseObject`, `z.int`, `z.url`, `cacheTag`, `cacheLife` with a custom profile, top-level `cacheLife` in `next.config.ts`: all present in the installed versions.

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 52 tests. Coverage on `lib/api` 96% lines, 88% branches; threshold 80% enforced in `vitest.config.mts`.
- `API_INTEGRATION=1` run against the live API: `/health` ok, `/products?limit=1` returns one product with pagination.
- A temporary `"use client"` page importing `lib/api/stock` fails `next build` with "You're importing a module that depends on server-only".
- A temporary server page calling `getStoreConfig()` and `getProducts({ featured: true })` prerendered as `○ (Static)` with `1h` revalidate and `1d` expire, proving the `catalog` profile is applied.
- `import 'server-only'` in every `lib/api` module including `types.ts`; `grep -r NEXT_PUBLIC_API` empty; no injected metadata in `apps/`; the bypass token appears nowhere in git history.

## Code review (`/code-review main`)

Two-axis review, both sub-agents run on the branch before the last commit.

- **Standards:** no hard violations of AGENTS.md, the ADR or the glossary. Eight judgement-call smells, all applied in `efb7ebb`: test helpers deduplicated, `env.ts` extends the public schema, `z.prettifyError` replaces two hand-rolled issue formatters, the non-JSON branches of `fetchApi` collapsed into `readJson()`, `lastFailure` and `SLUG_PAGE_SIZE` renamed, `catalog.test.ts` split per module, unused `CacheTag` type removed.
- **Spec:** nothing missing. Three implementation nits, all applied: `fetchApi` now ignores `meta` when no meta schema is given instead of throwing `INVALID_RESPONSE`; `HTTP_ERROR` message is the `statusText` as the spec says; the `INVALID_RESPONSE` log carries a comment on why zod's default messages cannot leak a value.

## Notes and flags

- The "wrong bypass token fails the build" behaviour cannot be demonstrated today: the API accepts requests without a token. The code path is covered by the non-JSON 401 unit test.
- `specs/api-reference.md` says cart CORS is restricted to the API's origin; live it reflects any origin. Recorded in the ADR; the server-side rule stands for the token reason.
- `types.ts` carries `server-only`. Client components use `import type`, which is erased at compile time, so the guard only blocks value imports.

## Deferred

- Sanity env vars in `lib/env.ts` (E09).
- `getCartFromCookie()`, cookie helpers and Server Actions (E06).
- `scripts/check-build.mjs` and `check-canary.mjs` (E12).
- Prettier is still not installed; the hooks run ESLint only.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #3 — E03: shell, layout and metadata

`epic/E03-shell` · merged 2026-09-14

## Summary

E03 shell, layout and metadata: the frame every page renders inside. Header with the Vercel triangle, nav and a static cart icon; footer with a cached year and the API's social links; root metadata from `/store/config`; a static OG image; security headers; error and not-found pages; stub `/search` and `/cart` routes. Every route in the build output is `○ (Static)`; the shell has no dynamic hole until E06 adds the cart badge.

## Decided by the spec (human decisions)

Settled in the grill before this branch (commit `a1c3996` on `main`):

- Root metadata (title, template, description, site name) comes from the API's `seo` block through the cached `getStoreConfig()`, so the layout stays prerendered and E09's chain becomes Sanity → API with no constants file.
- No theme selector: light and dark follow `prefers-color-scheme`. No `next-themes`, no inline theme script, no `suppressHydrationWarning` (`specs/callout.md`).
- The real Vercel triangle, inline SVG in `currentColor`, with the store name as text; not the wordmark.
- Header is not sticky and has no border; shell regions separate by spacing (`specs/design.md`).
- Footer catches its own `getStoreConfig()` failure and renders without the social row, because `app/error.tsx` does not cover the root layout (`specs/callout.md`).
- `geist` package for both the page fonts (`next/font/local`) and the OG image's TTF.
- E10's colour tokens land now; `NEXT_PUBLIC_SITE_URL` is one value for Production and Preview (set on the Vercel project during this epic).
- Glossary gained **Shell**, **Dynamic hole** and **Theme** (`CONTEXT.md`).

## Generated

- `app/layout.tsx`: `generateMetadata` from the store config, `viewport.themeColor` per colour scheme, skip link, `Header`, `main#main`, `Footer`, Speed Insights and Analytics.
- `app/opengraph-image.tsx`: 1200×630, black, triangle, "Vercel Swag Store" in Geist Regular read once at module scope. Prerendered.
- `components/logo.tsx`, `header.tsx`, `nav-link.tsx` (the only client component, `usePathname` for `aria-current`), `cart/cart-icon.tsx`, `cart/cart-badge.tsx` (static placeholder inside the Suspense wrapper E06 fills), `footer.tsx` (`CopyrightYear` with `"use cache"` + `cacheLife('days')`, `SocialLinks` with try/catch).
- `lib/security-headers.ts`: pure builder for the CSP and the three companion headers; `next.config.ts` calls it for `/:path*`.
- `lib/social-links.ts`: label map (`twitter` → "X", `github` → "GitHub", `discord` → "Discord"), unknown keys capitalised, empty URLs dropped.
- `app/globals.css`: colour and font tokens with the dark values under `prefers-color-scheme: dark`, focus ring in the accent.
- `app/error.tsx` (`retry`, Next 16.3), `app/not-found.tsx`, stubs `app/search/page.tsx` and `app/cart/page.tsx` with their final metadata.
- `packages/config/eslint/next.mjs`: `react/no-danger` as an error.
- Tests: `lib/security-headers.test.ts` (7), `lib/social-links.test.ts` (4).

## Deviations from the spec

- **`'unsafe-eval'` in development, not a gated `upgrade-insecure-requests`.** The spec expected `upgrade-insecure-requests` to be the directive that might break `localhost`. It does not: Chrome leaves localhost requests on `http`, verified in the network log. What did break was React's development build, which warns "eval() is not supported in this environment" under the CSP. So `script-src` carries `'unsafe-eval'` only when `NODE_ENV === 'development'`; production React never calls `eval()`. Proposed spec sentence: "`'unsafe-eval'` is added to `script-src` in development only, because React's dev build reconstructs stack traces with `eval()`; `upgrade-insecure-requests` is sent everywhere, Chrome does not upgrade localhost."
- **No `--color-success`, `--color-warning`, `--color-danger` yet.** E10 lists them without values; inventing values here would contradict "no hard-coded colour values". E10 adds them.
- **Cart icon `aria-label` on a `role="img"` span**, not on the link, so the E06 count reads as "Cart, 3 items" without changing the link.

## Assumptions from the spec relied on

- `generateMetadata` that only awaits a `"use cache"` function keeps the route prerendered (confirmed: build output `○` and `x-nextjs-cache: HIT` on `next start`).
- `usePathname` in a client component renders `aria-current` during prerender for static routes (confirmed in the served HTML).
- `process.cwd()` at build is `apps/store`, so the OG route can read the font from `node_modules/geist` (confirmed locally; Vercel's root directory is `apps/store`).

## Installed versions

| Package | Version |
|---|---|
| geist | 1.7.2 |
| @vercel/analytics | 2.0.1 |
| @vercel/speed-insights | 2.0.0 |
| next | 16.3.5 |

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 63 tests (coverage 98% lines on `lib/`).
- Build output: `/`, `/_not-found`, `/cart`, `/search`, `/opengraph-image` all `○ (Static)`.
- `next start`: all four security headers present; `<title>`, description, `og:*` and `twitter:*` tags from the API; OG image 200 `image/png`; `/nope` returns 404 inside the shell; `/search` title "Search | Vercel Swag Store".
- Dev server in Chrome: no console errors, no CSP violations, all localhost requests stay `http`; skip link appears on Tab with the accent ring; dark theme follows the OS.
- Lighthouse mobile on `next start`: accessibility 100, performance 96, best practices 96, SEO 100, CLS 0. The two console errors it counts are `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, which only exist on Vercel.
- the theme-colour grep empty (a test that asserted the string's absence was removed for that reason).

## Code review (`/code-review main`)

Two-axis review, both sub-agents run on the branch before the last commit.

- **Standards:** no hard violations of AGENTS.md, the ADRs or the glossary. Five judgement calls, four applied: `next/image` `remotePatterns` now derives from the CSP's `IMAGE_HOSTS` so a new host is one edit; the triangle path is one exported constant used by the logo and the OG image; comments say "shell" where the glossary forbids "layout"; `socialLabel` is private and tested through `socialLinks`. Left: the class joiner in `nav-link.tsx` moves to shadcn's `cn()` when E10 installs it.
- **Spec:** nothing missing. Applied: the triangle is 24px at every width (was 20px below 640px); the CSP test now asserts `default-src`, `style-src` and `font-src`; the OG image lost an invented "Official Vercel merchandise" subtitle; root `openGraph.title` and `description` removed because Next falls back to `title` and `description`; the label map is exactly the spec's three entries. Two findings become proposed spec wording on `main`: "Every key the API returns is rendered" should read "Every key with a non-empty URL is rendered", and the test list should drop the theme-colour entry because a test asserting that value's absence puts the string in `apps/`. The `:focus-visible` accent ring is pulled forward from E10 so the keyboard criterion holds now.

## Notes and flags

- `pnpm verify` failed once on `store#typecheck` and passed on rerun with no change: turbo runs `next typegen` and `next build` in parallel and both write `.next/types`. E12 should make `typecheck` depend on `build` or run typegen once.
- The Vercel triangle is a trademark used here because the brief names the store "Vercel Swag Store" and the reviewers are Vercel; `specs/decisions.md` records the choice.
- The mobile screenshot at 375px could not be taken (the browser window refused to resize); Lighthouse's mobile emulation covered the layout and found no horizontal overflow. E10 attaches the 375 and 1280 screenshots.

## Deferred

- Social card debugger check after the preview deploys.
- `CartBadge` reading the cookie (E06); `/search` and `/cart` bodies (E06, E07); radii, type scale and shadcn components (E10).

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #4 — E04: home page with hero, promo banner and featured grid

`epic/E04-home` · merged 2026-09-15

## Summary

E04 home page: a static hero with the backpack as hero product, the promotional banner streaming into the page's only dynamic hole, and a cached featured grid of six product cards linking to their product pages. Build output shows `/` as a partial prerender (`◐`): static shell with the promo as its server-streamed content.

## Decided by the spec (human decisions)

Settled in the grill before this branch (commit `a0c8ccf` on `main`):

- The hero product is the backpack, chosen by slug and resolved through the cached `getProduct`, so the photo URL stays an API fact and a vanished slug fails the build. No secondary text link: the hero photo links to the product.
- Hero copy in `HERO_FALLBACK` is placeholder marketing text (`specs/improvements.md`); field names match E08's `homePage.hero`.
- The promo banner renders every field as the API returns it, including the "0% off with code AUTO" promo (`specs/improvements.md`). Banner and skeleton share a box sized for the longest of the four current promos; streaming makes the skeleton a slow-path safety net (`specs/callout.md`).
- `getFeaturedProducts({ limit, min })` lives in the products lib and is reused by E07; `min: 6` is the brief's minimum, not an API count.
- shadcn now rather than in E10: `init -b base` with `button` and `skeleton` only, shadcn's semantic colour names aliased to the store's tokens, no class-based dark variant.
- Page metadata is `generateMetadata` reading the API's `seo.defaultTitle` as `title.absolute`; description and Open Graph inherit from the root.
- Glossary gained **Hero product**, **Promotion** and **Top-up** (`CONTEXT.md`).

## Generated

- `components/home/hero.tsx`, `promo-banner.tsx` (banner and skeleton sharing one reserved box), `featured-products.tsx` (component-level `"use cache"` with `cacheTag('products')` and `cacheLife('catalog')`), `components/product-card.tsx` (shared with E07).
- `lib/api/products.ts`: `getFeaturedProducts`; `lib/content/fallbacks.ts`: `HERO_FALLBACK` and its type.
- `app/page.tsx`: `generateMetadata` from the store config; hero, Suspense-wrapped promo, grid.
- `app/products/[slug]/page.tsx`: stub for `typedRoutes`, with `generateStaticParams` from `getAllProductSlugs()`.
- `components/ui/button.tsx`, `skeleton.tsx` (shadcn, Base UI), `components.json`, `lib/utils.ts`; `globals.css` alias block.
- `playwright.config.ts` and `e2e/home.spec.ts` (E12 wires CI).
- Tests: `getFeaturedProducts` (4 cases).

## Deviations from the spec

- **Header nav in a Suspense boundary.** The build failed on the fallback shell of `/products/[slug]` (the route for slugs not listed at build): `usePathname()` in `NavLink` has no value there and Next refuses to prerender a client hook outside Suspense. The nav now renders inside `<Suspense>` with plain links as the fallback. On static routes the boundary resolves in the prerender, so the shell is unchanged; on the fallback shell the current-page marker streams in. Proposed spec sentence for E03's header: "The nav sits in a Suspense boundary with plain links as fallback, so routes whose pathname is unknown at prerender can still build."
- **`generateStaticParams` in the PDP stub.** Pulled forward from E05 for the same reason: the listed slugs prerender with a known pathname. The stub still never reads `params`.
- **`unstable_rethrow` in `fetchApi`, the promo banner and the footer.** When a prerender completes while an uncached fetch is pending, Next rejects that fetch with an internal error that React expects to receive. `fetchApi`'s retry loop caught it, retried, and wrapped it as `NETWORK_ERROR`, and the banner's catch then logged a spurious outage on every build. Each catch now calls `unstable_rethrow(error)` first. Proposed E02 spec sentence: "Catch blocks around API calls call `unstable_rethrow` before handling, so Next's own control-flow errors pass through."
- **Component-level cache carries tag and lifetime.** The spec's `"use cache"` on `FeaturedProducts` alone put `/` on the default profile (15 min revalidate in the route table) and would have outlived a `revalidateTag('products')`. The component now declares `cacheTag('products')` and `cacheLife('catalog')`, and `/` shows 1h / 1d like the other routes.
- **shadcn init trimmed.** The CLI also added itself, `lucide-react` and `tw-animate-css` as runtime dependencies and switched the layout to Google-hosted Geist; all reverted. Kept: `@base-ui/react`, `class-variance-authority`, `cn`.
- **Card names wrap to two lines** instead of truncating; at 375 the pill truncated three names to one word.
- **Hero image height.** `aspect-square` alone gave a 336px image at 768, not the spec's 480 to 560; at md and up the frame now has a fixed height (480px, 560px at lg) and the photo's white margins absorb the crop.
- **Empty promo states render the reserved box, not nothing.** The spec says "renders nothing" for `active: false` and for a failed call; an empty box of the same height is what keeps the grid from moving. Proposed spec sentence: "renders an empty placeholder of the same height".
- **The Playwright outage test is not written.** "The page renders without the banner when the API is unreachable" is a server-side condition Playwright cannot create against `next start`; it is verified by hand (see Verified). Proposed spec sentence: "verified by starting the server with an unreachable `API_BASE_URL`".

- **OG image font read lazily, and traced.** The first preview deployment rendered the error boundary on `/`: the root `opengraph-image.tsx` read the Geist TTF at module scope with a `process.cwd()` path, and a route that resumes at request time (the promo hole) loads that module through the metadata graph on the server, where the file was not in the function bundle. E03 never hit this because no route ran at request time. The read now happens inside the handler, and `outputFileTracingIncludes` lists the font. Proposed E03 spec sentence: "The font is read inside the image handler, never at module scope, and listed in `outputFileTracingIncludes`."

## Assumptions from the spec relied on

- An uncached `fetch` inside `<Suspense>` becomes the route's dynamic hole under Cache Components with no `connection()` call (confirmed: `/` is `◐`, `x-nextjs-postponed: 1`, the promo streams).
- A cached function calling other cached functions (`getFeaturedProducts` over `getProducts`) is one cache entry per argument set (confirmed in the unit tests via the `next/cache` stub and in the route table).
- The `geist` package's `--font-geist-sans` variable is what shadcn's `font-sans` should resolve to (no font change).

## Installed versions

| Package | Version |
|---|---|
| @base-ui/react | 1.8.0 |
| class-variance-authority | 0.7.1 |
| cn | 0.3.0 |
| @playwright/test (dev) | 1.63.0 |
| shadcn CLI (via `pnpm dlx`, not installed) | 4.21.0 |

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 69 tests. It failed once on `store#typecheck` with the typegen race E03 recorded and passed on rerun.
- Build output: `/` `◐` with 1h / 1d; `/products/<slug>` `○` for every listed slug, the fallback `/products/[slug]` `◐`; `/cart`, `/search`, `/_not-found` `○`.
- `next start`: `<title>` "Vercel Swag Store"; the hero image is preloaded (`priority`); six unique product links; the promo boundary streams with `$RC` and rotates between requests.
- Promo outage: `next start` with `API_BASE_URL` pointing at an unreachable host renders the page with the hero, six cards and the empty reserved box; the failure is logged server-side once.
- Playwright smoke passes against `next start` (Chromium).
- Screenshots at 375, 768 and 1280 in light and dark: layout holds, no horizontal scroll, images framed on `bg-secondary`.
- Lighthouse mobile on `next start`: performance 92, accessibility 100, best practices 96, SEO 100, CLS 0, LCP element is the hero image. The best-practices deduction is the two Vercel-only insights scripts, as in E03.

## Code review (`/code-review main`)

Two-axis review, both sub-agents run on the branch before the last commit.

- **Standards:** no hard violations of AGENTS.md, the ADRs or the glossary. Judgement calls applied: the reserved-box constant is named `RESERVED_BOX`; one `NavList` renders both the nav and its Suspense fallback; a `ProductImage` leaf replaces the image block the hero and the card both had; `loadOptional()` in `lib/` holds the rethrow-log-null shape the footer and the banner both used (tested); shadcn's `button` and `skeleton` import `cn` from `lib/utils` as the spec says. Left: `ProductCard`'s `priority` prop has no caller yet, but the spec lists it for E07; the `.prettierrc` has no print width and the repo's existing files are wider than 80, so no reflow. Raised: the glossary lists "banner" under Promotion's avoid terms while the spec names the component "promo banner"; the two mean different things (the offer versus the strip that shows it), so the glossary entry could say so.
- **Spec:** two real defects, both fixed: the reserved box was 8px shorter than the rendered text at 375 and 768 (24px lines plus 8px padding make 80/56/32, and the box now measures exactly that at all three widths, verified in a browser), and the skeleton showed one line at md instead of two. Also fixed: the hero height at md (above) and the smoke test now asserts the product name. Reported as scope beyond the spec and kept, each with its reason under Deviations: `generateStaticParams` in the stub, the nav Suspense, `unstable_rethrow`, the `cn` dependency, and `cacheTag`/`cacheLife` on the cached component. Two findings become proposed spec wording (above): the empty promo states and the Playwright outage test.

## Notes and flags

- **Cart badge boundary on `/`.** In the prerendered home shell the cart badge's Suspense boundary is emitted as postponed and completed by the stream with byte-identical static markup. On `/cart`, `/search`, the product pages and the products fallback shell it is inlined. Only `/` shows this, so it seems tied to the route having a real dynamic hole. No user-visible effect; E06 turns it into a real hole anyway; E11 should look at the RSC payload when it audits.
- The image optimiser produces the hero image on first request (about 330 ms locally); on Vercel the first visitor after a deploy pays it, then it is cached.
- `pnpm dlx prettier` is not part of `verify`; the repo's `.prettierrc` is applied by editors. New files are formatted with it.

## Deferred

- The `/products/[slug]` body, `notFound()` for unknown slugs and `dynamicParams` handling (E05).
- Remaining shadcn components, card hover and the promo strip inversion polish (E10).
- Lighthouse on the production deployment and the Web Analytics script 404 (E11; the project has Web Analytics enabled but needs a fresh deployment).
- Web Analytics enablement check on the production deployment after merge; the preview deployment sits behind deployment protection, so `curl` could not check it there.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #5 — E05: product page with prerendered details, streamed stock and Add to Cart

`epic/E05-pdp` · merged 2026-09-15

## Summary

E05 product detail page. Every product slug is prerendered from cached catalogue data; live stock streams into the page's only dynamic hole together with the Add to Cart form and the Product JSON-LD; an unknown slug returns a real 404 inside the shell. Also the product Open Graph image, `sitemap.xml` and `robots.txt`. Build output shows every `/products/<slug>` as a partial prerender (`◐`) with the catalogue lifetime (1h / 1d).

## Decided by the spec (human decisions)

- Route, cache policy and Suspense placement as `specs/E05-product-detail.md` states: product, categories and store config cached; `getStock` never cached and rendered inside `<Suspense>`.
- The breadcrumb's category links to `/search?category=<slug>` (`specs/improvements.md`, E05 Q10).
- Add to Cart confirms inline with a link to the cart; no toast (`specs/improvements.md`, E05 Q6).
- `addToCart` ships as a stub that returns `{ ok: true }` so this epic stands alone; E06 replaces the body and keeps the signature `addToCart(prevState, formData)`.
- Stock copy "In stock", "Only N left", "Out of stock"; the text carries the meaning, colour repeats it, no icon.
- JSON-LD `Product` with `Offer` (price in major units, currency, availability from the stock result inside the stock boundary), `BreadcrumbList`, brand "Vercel Swag Store".
- Sitemap: home, search and every product with `createdAt`; robots disallows `/cart` and `/api/`.

## Generated

- `app/products/[slug]/page.tsx` (static params, metadata, page), `not-found.tsx`, `opengraph-image.tsx` (photo on black with name and price).
- `components/product/`: `breadcrumb.tsx`, `gallery.tsx` (server) with `gallery-thumbnails.tsx` (client, rendered only for more than one image) and `gallery-image.tsx`, `stock-and-cart.tsx` with `StockSkeleton`, `stock-indicator.tsx`, `add-to-cart-form.tsx`; `components/quantity-stepper.tsx`; `components/json-ld.tsx`.
- `app/cart/actions.ts`: the stub action, input validated with zod.
- `app/sitemap.ts`, `app/robots.ts`.
- `lib/api/products.ts`: `findProduct` and `getAllProducts`; `getProduct` and `getAllProductSlugs` now build on them. `lib/api/categories.ts`: `findCategory`.
- `lib/stock-status.ts` (label, tone, schema.org availability and the Add to Cart rules from one stock result), `lib/quantity.ts`, `lib/structured-data.ts`, `lib/text.ts` (`truncate`), `lib/format.ts` (`decimalAmount`), `lib/metadata.ts` (`openGraphDefaults`, also used by the root layout now), `lib/og-font.ts` (`loadOgFonts`, the lazy Geist read shared by both OG images).
- `app/globals.css`: `--color-success`, `--color-warning`, `--color-danger` for both themes; shadcn's `destructive` aliased to `danger`.
- Tests: Vitest for every new helper, the action, sitemap, robots, `findProduct` / `getAllProducts` / `findCategory`, and the stepper (server-rendered; Vitest now includes `*.test.tsx`). Playwright `e2e/product.spec.ts` with four tests.

## Deviations from the spec

- **No `dynamicParams` export.** The spec says "`dynamicParams` stays true". With Cache Components the export fails the build ("not compatible with `nextConfig.cacheComponents`"); params missing from `generateStaticParams` render on request by default, which is the behaviour the spec wants. Proposed sentence: "Slugs not returned by `generateStaticParams` render on request; there is no `dynamicParams` export under Cache Components."
- **The 404 is mapped inside the cache.** The spec says "`getProduct` throws `ApiError` 404, page calls `notFound()`". In a production build an error leaving a `"use cache"` function reaches the caller as a generic error carrying only a digest, so the page could not recognise the 404 and the first `next start` returned 500 for an unknown slug. `findProduct` now catches the 404 inside the cached function and returns `null`; `getProduct` wraps it and still throws, so the hero keeps failing the build for a missing slug. A found product keeps the `catalog` lifetime; a `null` is cached with the `minutes` profile (`cacheLife` called in that branch only), so a product the API gains later appears within about a minute and a mistyped slug does not hold a long-lived entry. Proposed E02 sentence: "`findProduct(idOrSlug)` returns `null` for an unknown product, mapped inside the cached function; `getProduct` throws `ApiError` 404 for callers that require the product."
- **Params are awaited above Suspense, for a real 404.** The Next 16 docs recommend awaiting params inside Suspense so unlisted slugs get an instant App Shell; a `notFound()` there streams with status 200 and a noindex tag. The criterion asks for a 404, so the page resolves the product before any boundary: an unknown slug returns 404, and the App Shell for unlisted slugs is empty. `prerender-manifest.json` records `/products/[slug]` with `fallback: null` and `compute: "blocking"`, so there is no shell to stream first; that manifest is also what Vercel's routing uses. Every real product is prerendered, so only mistyped or removed URLs pay the blocking render. Proposed sentence: "The page resolves the product before any Suspense boundary so an unknown slug gets HTTP 404; unlisted slugs have no App Shell."
- **`StockAndCart` receives `product`**, not `productId` and `slug`: the Product JSON-LD in the same boundary needs name, images, description and price. `StockIndicator` receives the computed `status` rather than `stock`, because the status is worked out once for the line, the form and the JSON-LD.
- **Two JSON-LD scripts.** `BreadcrumbList` sits in the shell next to the visible breadcrumb; `Product` with its `Offer` sits in the stock hole. The breadcrumb does not depend on stock.
- **`openGraph.images` is not set by hand.** The colocated `opengraph-image.tsx` adds `og:image` with type, size and alt, and file-based metadata wins over config. The page's `openGraph` spreads `openGraphDefaults(storeName)` because a page's `openGraph` replaces the root's wholesale (site name and locale would otherwise disappear).
- **Gallery: `preload` instead of `priority`, and a capped `sizes`.** `priority` is deprecated in Next 16. `sizes` is `(min-width: 1152px) 528px, (min-width: 768px) 50vw, 100vw`: from 1152px the column is 1152 less 2 × 24 padding less the 48 gap, halved, so wide screens do not fetch a 960px image for it. (The hero's `576px` has the same arithmetic slip; E04 code, left for E11.)
- **JSON-LD as a text child.** Next's JSON-LD guide uses `dangerouslySetInnerHTML`, which `react/no-danger` forbids (ADR 0001). React writes a script's string child unescaped apart from `<script` sequences, and `serializeJsonLd` escapes every `<` as `<`; the result parses as JSON in the built HTML. React's development warning about client-rendered script tags skips data blocks.
- **Stock failure state.** Not in the spec: a failed stock call renders "Stock unavailable" with the form disabled and no `availability` in the `Offer` (through `loadOptional`, which rethrows Next's own errors first).
- **Status colours arrive in E05.** E03 leaves `--color-success`, `--color-warning` and `--color-danger` to E10, which names them without values; the stock line needs them now. Light `#297a3a` / `#aa4d00` / `#cb2a2f`, dark `#62c073` / `#ff990a` / `#ff6166`; each has 5.1:1 contrast or more on both backgrounds of its theme. Proposed E10 sentence lists these values.
- **The stub action validates with zod.** E06 says actions use "plain checks"; `specs/decisions.md` and AGENTS.md name Server Action input as a zod trust boundary. The two disagree, so this is raised rather than settled: proposed E06 sentence "Actions validate input with zod."
- **Shared OG font loader.** `lib/og-font.ts` replaces the root image's inline loader so both images read the font inside the handler; `outputFileTracingIncludes` lists both image routes.

## Assumptions from the spec relied on

- `generateStaticParams` with cached data prerenders each listed slug, and the uncached stock call becomes the only dynamic hole (confirmed: `◐`, `x-nextjs-postponed: 1`, the stock streams).
- API products carry one image today, so the thumbnail client component does not ship to any current page (confirmed in the catalogue; E09 can add more).
- `useActionState` with a Server Action gives the inline confirmation, including without a client-side cart (confirmed in the browser and in Playwright).

## Verified

- `pnpm verify` green after the review fixes: lint, typecheck, `next build`, 123 tests (2 integration tests skipped as usual). One run failed on `store#typecheck` with typed-route errors in E04 files, the typegen and build race recorded in E03 and E04, and passed on rerun.
- Build output: `/products/[slug]` and every listed slug `◐` with 1h / 1d; `/sitemap.xml` `○` with 1h / 1d; `/robots.txt` `○`; `/`, `/cart`, `/search`, `/_not-found` unchanged.
- Prerendered HTML: title "Name | Vercel Swag Store", description, `og:*` including the product image URL, image preload link, `BreadcrumbList` JSON-LD, stock skeleton in the shell.
- `next start`: three requests to one product show "Only 5 left", "In stock", "In stock"; the quantity `max` follows the stock; the streamed `Offer` carries live availability; an unknown slug returns 404 with `noindex`, header and footer; an unknown product's OG image returns 404; the product OG image renders (1200 × 630, photo, name, price); sitemap and robots as specified.
- API outage (`API_BASE_URL` unreachable, same build): the product page returns 200 from prerendered data with "Stock unavailable", the button and quantity input disabled, and no `availability` in the `Offer`.
- Browser: the stock skeleton and the streamed box both measure 144px at 375, 768 and 1280; CLS 0; Add to Cart shows "Added. View cart".
- Screenshots in light and dark at 375, 768 and 1280: layout holds, no horizontal scroll.
- Playwright against `next start`: five tests pass (home plus four product tests), before and after the review fixes.
- Not checked live on Vercel: the unknown-slug status. Previews sit behind deployment protection and the project has no Protection Bypass for Automation; `vercel curl` would have had to create one, which is a project setting I did not change. The manifest evidence above stands in until the production check after merge.
- Lighthouse mobile on a product page (`next start`): performance 98, accessibility 100, best practices 96, SEO 100, CLS 0; LCP 2.4 s on the product photo. The best-practices deduction is the two Vercel-only insights scripts returning 404 locally, as in E03 and E04.

## Code review (`/code-review main`)

Two-axis review of the first four commits; fixes in `bca301e`, criteria ticked in `f94fb06`.

**Standards** (no hard violations).

- Applied: `decimalAmount()` in `lib/format.ts`, so cents become a decimal in one place; robots tested in `app/robots.test.ts`; stock status computed once and now carrying `canAddToCart` and `maxQuantity`, so the Add to Cart rules sit next to the labels; `findCategory` next to `getCategories`; `loadOgFonts()` returns the `fonts` option for both images; `BreadcrumbLink` extends the JSON-LD `Crumb`; `getAllProductSlugs` is a plain map with no cache entry of its own; `CATALOGUE_PAGE_SIZE`; the unused stepper `label` prop removed (`defaultValue` stays for E06's cart rows); the product OG comment names `findProduct`.
- Left: literal colours in the OG images, because the image renderer cannot read CSS variables and the root image already does the same (proposed E10 sentence: "`next/og` images use literal colours matching the dark theme, the one exception to tokens"). A shared product-path helper: the template also lives in E04's hero and card links, so it is a small follow-up across those files, not this epic. `*.test.tsx`: AGENTS.md says tests are `*.test.ts`; proposed wording "`*.test.ts`, or `*.test.tsx` when the test renders JSX".

**Spec.**

- Applied: gallery `sizes` fixed to the 528px column; an unknown product cached with the `minutes` profile instead of the catalogue lifetime (the reviewer noted every mistyped slug held a catalogue entry and a newly added product could keep returning 404).
- Answered: the reviewer quotes the docs line "with Cache Components, every dynamic route streams a static shell first" against the 404 claim. This page resolves the product before any boundary and the manifest shows no fallback shell (`fallback: null`, `compute: "blocking"`); `next start` returns 404 and Playwright asserts it. The live Vercel check waits for production.
- Raised, not settled in this PR (see Deviations): zod in the stub action, the "Stock unavailable" state, the status colour values.
- Stepper test depth: the component test server-renders state; clamping while typing and the disabled plus after reaching the maximum are covered by `lib/quantity.test.ts` and the Playwright test "quantity cannot exceed stock". A DOM-level Vitest test would need jsdom or happy-dom plus Testing Library as new dev dependencies.
- The social debugger criterion stays open until production.

## Notes and flags

- **Add to Cart needs JavaScript on the product page.** `specs/decisions.md` says "cart uses Server Action forms, both work without JavaScript". The form lives in the streamed stock hole, and a streamed boundary is swapped in by React's inline script: with JavaScript disabled the page shows name, price, description and photo, but the skeleton stays and the form stays hidden (checked in Chromium). The home promo behaves the same. Either decisions.md is reworded for streamed holes, or the page renders a no-JavaScript form outside the hole; this needs a decision before E06.
- **Both OG images are `ƒ` (rendered on demand).** E03 says the root image is static. Building `main`'s root image file on this branch also gives `ƒ`, so it dates from E04's lazy font read, not this PR. The local response carries `cache-control: public, max-age=0, must-revalidate`, so each crawler request renders the image. For E11 to look at.
- **Unknown slugs hold short cache entries.** Each distinct unknown slug is one small `null` entry for the `minutes` profile in the `"use cache"` handler, which is a bounded LRU by default.
- **Preview checks from the CLI.** The store project has no Protection Bypass for Automation, so runtime checks against a preview are not possible from the command line. Enabling it in the project's Deployment Protection settings would let future epics verify previews before merge.
- **Formatting.** New files are formatted with Prettier; modified files whose `main` version was not Prettier-clean (`app/layout.tsx`, `app/opengraph-image.tsx`, `next.config.ts`) were left alone to avoid unrelated churn.

## Deferred

- Social debugger check of the product OG image: needs the production URL after merge (previews sit behind deployment protection).
- The real `addToCart`, cookie and badge (E06); enrichment sections and real thumbnails (E09); stepper and card polish (E10); OG image caching and Lighthouse on production (E11).

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #6 — E06: cart with a server-side token, optimistic rows and a demo order

`epic/E06-cart` · merged 2026-09-15

## Summary

E06 cart. A cart token in an httpOnly cookie, four Server Actions (add, update quantity, remove, place order), a `/cart` page whose shell stays static while its contents stream, a header badge that is the shell's only dynamic hole, and a static `/checkout` thank-you page. Cart data is never cached, so the actions call `refresh()` from `next/cache` rather than revalidating a tag; the cart tag is gone from `lib/api/cache.ts`.

The decisions come from a grilling session and landed on `main` first (`966def4`), so this branch implements a settled spec.

## Decided by the spec (human decisions)

- `refresh()` instead of `updateTag` / `revalidateTag`: nothing about the cart is cached, so a tag would be a no-op.
- Actions return `{ ok: true } | { ok: false, error }` with user-facing copy and never carry the cart; `refresh()` supplies the data.
- A 404 on a write triggers one `getCart`: no cart means expiry (clear the cookie), a cart means the line or product is gone. A 404 alone never clears the cookie.
- The cookie is created lazily on the first add and set again after every successful write, so its 24 h expiry slides with the API's idle expiry.
- The Checkout button is a form bound to `placeOrder`, which drops the cookie and redirects to `/checkout` ("Thank you for your order!"). It does not delete lines: the API has no clear-cart endpoint.
- A failed cart call is not an empty cart: the badge shows the icon without a count and `/cart` says it could not be loaded (`specs/callout.md`).
- Quantity ceiling 99 in the stepper and in the action input; stock is enforced only at add time on the product page (`specs/improvements.md`).
- zod in every action, because Server Action input is a trust boundary. This settles the question E05 raised.

## Generated

- `lib/cart/`: `cookie.ts` (`cart_token`, httpOnly, lax, secure in production, one day), `get-cart.ts` (`getCartFromCookie`, plus `loadCart` for components that render without it), `lines.ts` (the row view type, the optimistic reducer and the totals).
- `app/cart/actions.ts`: `addToCart` (E05 signature kept), `updateQuantity`, `removeItem`, `placeOrder`, with one shared `write` helper holding the 404 rule.
- `components/cart/`: `cart-contents.tsx` (server, with `CartSkeleton`), `cart-view.tsx`, `cart-line.tsx`, `cart-summary.tsx`, `empty-cart.tsx`, and `cart-badge.tsx` rewritten as an async server component.
- `app/cart/page.tsx` (static shell plus one Suspense boundary), `app/checkout/page.tsx`, `CHECKOUT_FALLBACK` in `lib/content/fallbacks.ts`.
- `components/quantity-stepper.tsx`: optional `onCommit` (a step commits at once, a typed value on blur or Enter, never the same value twice) and `pending`.
- `lib/quantity.ts`: `CART_MAX_QUANTITY`. `lib/api/cache.ts`: `TAGS.cart` removed. `test/setup.ts`: `refresh` added to the `next/cache` stub.
- Tests: Vitest for the cookie, the cart read, the line helpers and all four actions (43 new); Playwright `e2e/cart.spec.ts` with both flows.

## Deviations from the spec

- **"Disabled while pending" is `aria-disabled`, not the `disabled` attribute.** A focused button that becomes disabled loses focus to the body, so a keyboard user pressing plus twice would be dropped after the first press. The pending stepper marks its buttons `aria-disabled`, makes the input `readOnly` and ignores input, which Playwright and assistive technology both read as disabled while focus stays put. The remove button still uses the real attribute: it is never the focused control during a quantity change. Proposed spec sentence: "While a row is saving, its stepper is `aria-disabled` and read-only rather than disabled, so focus stays on the control that was pressed."
- **Rows get a view type, not API cart items.** `toLines` keeps product id, slug, name, first image, unit price and quantity, so descriptions and tags never enter the client payload. It also makes the optimistic reducer and the totals pure and unit-testable.
- **Row messages live in `CartView`, keyed by product.** An optimistically removed row unmounts, so a message held in the row would vanish exactly when a failed removal needs to explain itself.
- **`loadCart` is a named wrapper** around `loadOptional(... getCartFromCookie())`. Both the badge and the page need to tell "no cart" from "cart unavailable", which a bare `null` merges.
- **Update and remove without a cookie** answer with the expired copy and refresh, rather than a separate "no cart" case. The spec does not say; there is no cart to act on either way.
- **Checkout copy sits in `lib/content/fallbacks.ts`** as `CHECKOUT_FALLBACK`, following the E04 hero pattern, so E09 swaps the source and not the page. The page also sets a metadata title ("Thank you for your order!"), which the spec did not ask for; every other route has one.
- **E05's `AddToCartState` is now `CartActionResult | null`**, the same shape spelled once, because three actions share it.
- **Playwright timeouts raised.** See the latency note below.

## Assumptions from the spec relied on

- `refresh()` re-renders the current route's dynamic holes from a Server Action, which is what updates the badge without a full reload (confirmed in the browser: the badge went 0 → 1 → 2 → 0 with no navigation).
- The API's `lineTotal` is unit price × quantity, so `CartView` can compute totals for optimistic lines (confirmed against the live API: 3500 × 3 = 10500, subtotal 10500).
- Setting a cookie inside a Server Action re-renders the current page, so the expired branch reaches the empty state (confirmed).

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 191 tests (2 integration tests skipped as usual). No typed-route flake this time; `.next/dev/types` was stale from 14 Sep and deleted first.
- Build output: `/cart` and `/checkout` are `◐` with 1h / 1d, the shells prerendered and the holes streamed. `/checkout` is partial only because of the header badge, which is the intended single hole in the shell.
- Playwright, 7 tests against `next start`: both new cart flows plus the five existing ones. Flow 1 also asserts that every request the browser made went to this origin, and that `cart_token` is httpOnly, `SameSite=Lax`, `path=/`.
- Cookie attributes in the browser: `httpOnly: true, secure: true, sameSite: Lax` on `next start` (production mode over localhost).
- Prerendered HTML: `/cart` ships the heading and the skeleton with `x-nextjs-postponed: 1`; `/checkout` ships the full copy; neither response sets a cookie.
- Expired cart: a request carrying a well-formed but unknown token renders the empty state, sets no cookie, and the badge shows no count.
- API outage (`API_BASE_URL` unreachable, same build): `/cart` with a cart cookie returns 200 with "Your cart could not be loaded." and a Try again link, the badge renders without a count, and the home page is unaffected.
- Without JavaScript: `/cart` shows the heading and keeps its skeletons, `/checkout` renders in full. This is the behaviour the new callout describes.
- Screenshots at 375, 768 and 1280 in light and dark for `/cart` (with a line) and `/checkout`: layout holds, no horizontal scroll at any width.
- Live API re-probed for the facts the design rests on: `lineTotal` arithmetic, and that a missing line and an unknown cart both answer `NOT_FOUND` with only the message differing.

## Notes and flags

- **The API's cart endpoints are slow.** Measured three times each: create 2.4–3.0 s, add 2.5–3.0 s, read 1.6–1.7 s, patch 2.2–3.0 s, while `/products` answers in 0.16 s and stock in 0.24 s. One add is a read, a write and the badge's own read, so the product page's confirmation takes 6–8 s. That is why the Playwright cart assertions now allow 30 s, and why the E05 add-to-cart test, unchanged in behaviour, needed a longer timeout once the action became real. On `/cart` the optimistic UI hides it; on the product page the button simply waits. Worth a look in E11: dropping the pre-check read in `addToCart` (create only after a 404) would cut about two seconds from every add, at the cost of a retry path. Measured again across every endpoint after this branch was opened: only the cart namespace is slow (1.4 to 2.8 s) while everything else answers in 0.14 to 0.20 s. That comparison is now a callout and four follow-ups in `specs/callout.md` and `specs/improvements.md` on `main` (`6aac9d1`).
- **A line merged past 99 shows 99 in the stepper.** The API merges repeated adds without a stock check, so a line can exceed the ceiling the cart page enforces. The stepper clamps the displayed value; the line total stays truthful. Stock-aware quantities are in `specs/improvements.md`.
- **The expiry message on `/cart` is replaced by the empty state.** When a write finds the cart expired, the refresh re-renders `/cart` to the empty state and `CartView` unmounts with its message. The empty state is the honest answer, so this is left as is.
- **`/opengraph-image` is `○` in this build**, where E05 recorded `ƒ`. Nothing in this branch touches it; noting it so E11 measures rather than assumes.

## Deferred

- `cart_token` httpOnly and secure on the deployed site: the only unticked criterion. Previews sit behind deployment protection with no automation bypass, so this is a production check after merge, as in E05.
- **E08 `checkoutPage.backToCartLabel` no longer makes sense.** Ordering empties the cart, so the thank-you page has no reason to link back to it, and E06 does not render such a link. E08 is untouched here; the field should go when E08 is next edited.
- Stock-aware cart quantities and really emptying the API cart on order, both recorded in `specs/improvements.md`.
- Sanity copy for `/checkout` (E09), design polish for the stepper and rows (E10), Lighthouse and the cart-latency question (E11).

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #7 — E07: search with a static shell, category-aware expansion and one pending state

`epic/E07-search` · merged 2026-09-16

## Summary

E07 search. `/search` with a prerendered shell (heading and form) and a results grid that streams per query, the URL as the only state, category-aware query expansion, three empty states, a results-scoped error boundary and a form that works without JavaScript.

The decisions come from a grilling session and landed on `main` first (`94b0bcb`), so this branch implements a settled spec.

**The home page's grid changed with it.** `components/product-grid.tsx` is now the one grid both pages use, and a variant owns the column classes *and* the `sizes` string that follows from them. The home grid stops at 3 columns instead of 4: in a `max-w-6xl` container a fourth column makes the cards narrow enough that the name pill wraps and truncates. `ProductCard` takes `sizes` as a prop instead of hard-coding it.

## Decided by the spec (human decisions)

- **One pending mechanism, `useTransition`, not `useFormStatus`.** With `next/form` and a string `action`, submitting is a client navigation that no form action ever sees, and the debounced path never submits the form at all. A transition owned by the page covers Enter, the button, the 300 ms debounce and the select change alike. `specs/callout.md` is corrected accordingly.
- **`router.replace` everywhere, never `push`.** A search refines the current view; it should not fill the Back button with keystrokes.
- **The client leaf sits inside `<Suspense>`, and the fallback is the same form rendered by the server**, empty and uncontrolled. Identical layout, and, because nothing replaces it when JavaScript never runs, it is also the plain GET form.
- **The select's value comes from `useSearchParams` with no local state; the text input keeps local state** and adopts the URL's `q` when it differs from the last value the form itself navigated to. No `key` remount: that drops focus and caret while typing.
- Default state is `getFeaturedProducts({ limit: 10, min: 10 })` under a "Featured" heading with no count; category only is one call; a query plus an explicit category is one narrowed call; a query alone is the expansion.
- **The "Includes everything in {Category}" hint only appears when the category added something *and* nothing was cut by the cap**, so it never promises products the grid does not show.
- Three empty states in one component, each ending in category chips.
- A results-scoped error boundary rather than `app/error.tsx`, so a failed call does not take the form with it.
- Native `<select>` for the category and a `type="search"` input for the query; no shadcn `Select`.
- Grid columns 2 / 3 on home, 2 / 3 / 5 on search. `opengraph-image.tsx` for home and product only; search inherits the root image.

## Generated

- `components/product-grid.tsx`: `ProductGrid` and `ProductGridSkeleton`, with the `home` and `search` variants and their `sizes`.
- `lib/search.ts`: `normaliseQuery`, `expandQuery`, `mergeResults`, and `RESULT_CAP`. 27 Vitest cases in `lib/search.test.ts`.
- `components/search/`: `search-form.tsx` (server, fetches categories, owns the boundary), `search-form-fields.tsx` (the markup, no directive, rendered by both graphs), `search-form-client.tsx` (the live leaf), `search-transition.tsx` (the shared transition and the results region), `search-results.tsx` (the four API routes, the heading rules and `ResultsSkeleton`), `empty-state.tsx`, `results-error.tsx`.
- `components/error-boundary.tsx`: a small generic class boundary taking `fallback(reset)`.
- `app/search/page.tsx`: `generateMetadata` awaiting `searchParams`, the shell, and the unawaited hand-off.
- `components/ui/input.tsx` and `components/ui/native-select.tsx` from `npx shadcn add`.
- `e2e/search.spec.ts`: ten Playwright tests.

## Deviations from the spec

- **The generated native select lost its `lucide-react` chevron.** The package is not a dependency and rule 7 says keep the list short, so the glyph is inline like the cart and logo icons. The same file gained a `lg` size: shadcn's `className` lands on the wrapper and cannot reach the select's own height, and 32 px controls next to a 40 px input read as a mistake.
- **"1 or 2 characters never navigate" is read as governing the debounce only.** Enter, the button and the select change navigate with whatever the form currently holds, which is what the original spec sentence said ("unless the user submits") and what the acceptance criteria assume.
- **`aria-busy` reaches the results region through a small context**, not a prop. The form and the results are siblings; passing the results in as the leaf's children would put them inside the form's Suspense boundary and delay them behind it.
- **`SearchForm` has no component-level `"use cache"`** (unlike `FeaturedProducts`). `getCategories()` is already cached, so the form prerenders into the shell without it, and wrapping a boundary whose child is dynamic in a cache scope is a question this epic did not need to answer. Build output confirms the shell.
- **The empty state has a fourth, unreachable branch**: no query, no category and no products renders "No products yet." rather than a category-shaped sentence about nothing.

## Assumptions from the spec relied on

- `/search` stays a partial prerender with `generateMetadata` awaiting `searchParams` (confirmed: `◐` in the build output, `x-nextjs-postponed: 1` on the response). The static fallback the spec allows for was not needed.
- The API's `search` is a case-insensitive substring match over `name` and `description` and does not look at category names, so the plural case rests entirely on the expansion (re-probed: `search=hats` returns 0, `category=hats` returns 3).
- `search=` and an unknown `category` are both 422, so neither is ever sent (re-probed).
- Clearing the input returns to `/search` and drops the category with it, as "the default state" in the spec says.

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 197 Vitest tests (2 integration tests skipped as usual).
- Build output: `/search` is `◐`. The prerendered `search.html` carries the h1, the form with `action="/search"`, all thirteen category options and the results skeleton, and the response has `x-nextjs-postponed: 1`.
- Playwright, 17 tests against `next start`: the ten new ones plus the seven existing. The new ones were also run with `--repeat-each=2` to check for hydration flake.
- Content, against the live API: "hat" → 3 results with "Includes everything in Hats", bucket hat first; "hats" → the same three; "black" → "Showing 5 of 28 results" with "Pick a category to narrow it down"; "tee" → 2 results and no hint; "shirt" → 1 result and no hint, because the expansion added nothing new; `/search` → "Featured" with 10 cards; `?q=` and `?category=nope` → the default state.
- All three empty states in the browser: `?q=umbrella`, `?q=umbrella&category=hats`, and the category-only variant reached by proxying the API and emptying one category's response.
- Results outage, same build, `API_BASE_URL` unreachable: `/search?q=hat` returns 200, the form renders with "hat" in the box, and the region says "Search is unavailable right now." with Try again. With the API brought back behind a switchable proxy, Try again restored the three hats without a reload and without touching the form.
- Loading state: with a 1.5 s proxy delay, the skeleton is the heading placeholder plus five cards in the same 5-column grid, and the swap into results shifts nothing.
- Pending state: with the same delay, the previous results stay on screen, the Search button is disabled and the region carries `aria-busy="true"`.
- Screenshots at 375, 768, 1024 and 1280 in light and dark for `/search` (default, results, capped, empty) and `/`: no horizontal scroll at any width.
- **The name pills at 1024 px**: five columns do clip them. At 1024 the cards are about 180 px wide and a name like "Matte Black Stainless Steel Water Bottle" renders as "Matte Black…" on two lines, which is not enough to tell two products apart. At 1280 the same grid reads fine ("Matte Black Stainless Ste…"). Raising it rather than changing the breakpoint, as asked. Two ways out, both E10's call: move the fifth column to `xl` (1280), or take the name out of the pill and put it under the card.

## Deferred

- The 1024 px pill clipping above; it is a design decision for E10, not a silent breakpoint change here.
- **The category select reverts for about 120 ms after a change.** Its value is derived from `useSearchParams`, which only updates when the transition commits, so React resets the DOM value in between. Measured at 120 ms against the live API and 1.5 s behind a delayed proxy, so it scales with the round trip. `useOptimistic` on the selected slug would fix it without introducing the local state the spec ruled out; worth doing in E10 or E11.
- The search-gap capture (E13). The `q`-only empty branch carries a one-line comment marking the hook point and no code.
- Sanity copy and enrichment (E09), design polish (E10), Lighthouse and axe (E11).


https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #8 — E07: match a category across hyphens and spaces, and default to five products

`epic/E07-search-separators` · merged 2026-09-16

## Summary

Two follow-ups to E07, both settled on `main` first (`6d1c15d`, `12a417a`).

**"tshirt" returned nothing; it now returns the shirt.** Two misses stacked up. The API's `search` matches punctuation literally, so `t-shirt` finds the product and `tshirt` and `t shirt` do not. The expansion then compared against the raw slug `t-shirts` and the name "T Shirts", neither of which "tshirt" equals, so there was no category to fall back on. The equality test in `expandQuery` now drops every non-alphanumeric character from both sides. The whole-word test still runs on the raw text, because there the hyphen is the boundary that finds "shirt" inside "t-shirts".

**The default state shows five products instead of ten.** Ten was awkward twice over. The results grid never shows more than five, so arriving at `/search` and then searching read as the search taking products away. And the API flags only six products as featured, so asking for ten meant the top-up filled four slots with ordinary catalogue products under a heading that says "Featured".

## Decided by the spec (human decisions)

- Fix the hyphen case in the expansion rather than by retrying the API with a guessed hyphen position, which works for a leading single letter and turns combinatorial for anything else.
- Squash separators for the equality test only, and keep them for the whole-word test.
- Five for the default state, not six. Six is the featured count read off the API, which rule 6 bars; `min` is what keeps the grid full if someone unflags a product.
- Editorial synonyms per category in Sanity remain the general answer, for E09 or E13. They are the only thing that reaches typos and words like "tee" that name no category.

## Generated

- `lib/search.ts`: a `squash` helper and the changed equality test in `expandQuery`.
- `components/search/search-results.tsx`: `DEFAULT_COUNT` is now `RESULT_CAP` rather than its own number, because the reason for the value is the cap.
- `lib/search.test.ts`: "tshirt", "t shirt" and "tshirts" all reaching `t-shirts`, plus two cases proving a fragment still does not get through.
- `e2e/search.spec.ts`: one test for `/search?q=tshirt`; the default-state test now expects five.

## Deviations from the spec

None.

## Assumptions from the spec relied on

- The API's `search` is literal, with no punctuation normalisation. Re-probed: `t-shirt` returns 1, `tshirt` and `t shirt` return 0.
- The API flags exactly six products as featured today, so `{ limit: 5, min: 5 }` is answered without a top-up. The code does not depend on that number; if the flagged set ever falls below five, `min` tops it up as before.

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 201 Vitest tests (2 integration tests skipped as usual).
- Playwright, 18 tests against `next start`, including the new one.
- The query change, against the live API on `next start`:

| Query | Before | After |
|---|---|---|
| `tshirt` | empty state | 1 result, "Includes everything in T Shirts" |
| `t shirt` | empty state | 1 result, same hint |
| `tshirts` | empty state | 1 result, same hint |
| `t-shirt` | 1 result | 1 result, unchanged |
| `tee` | 2 results | 2 results, unchanged |
| `hat` / `hats` | 3 results | 3 results, unchanged |
| `black` | Showing 5 of 28 | unchanged |
| `umbrella` | empty state | unchanged |

- `t-shirt` keeps no hint, correctly: the search hit is the category's only product, so nothing was added.
- The default state now renders the Water Bottle, Desk Mat, Tote Bag, Backpack and Crewneck T-Shirt, and the API confirms all five carry `featured: true`. Before this change the grid also held the Tumbler, Cold Cup, Ceramic Mug, Travel Mug, Coaster Set and three notebooks, none of them featured.
- Screenshots of `/search` at 375, 768, 1024 and 1280: one clean row of five at 1024 and above, no horizontal scroll at any width.

## Notes and flags

- **The API searches `tags` too**, not just `name` and `description` as the E07 comments and pull request said. `cold-cup` returns the Cold Cup, whose name and description never contain that string, and `t shirt` returning nothing rules out the other explanation, that punctuation is normalised. Two comments and the spec are corrected. This is also why "tee" finds the shirt: `tee` is one of its tags.
- **"The five most popular" is not available.** The product record carries no sales, views or rating, and `/products` accepts no sort parameter. `featured` is the only editorial signal the API offers, and it is what the default state already used.

## Deferred

- Editorial synonyms in Sanity, for queries that name no category.
- Everything still open from the E07 pull request: the 1024 px pill clipping and the category select's 120 ms revert.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #9 — E07: rank an expanded search by the category it named

`epic/E07-search-ranking` · merged 2026-09-16

## Summary

Follow-up to E07. Searching "bag" led with an enamel pin and a keychain; it now leads with the bags.

The pin and the keychain are not spurious. The API matches substrings anywhere in the prose, and both descriptions mention a bag:

```
Black Enamel Pin (Triangle Inlay)
  "A small, sharp accent for bags and jackets."

Black Metal Keychain (Fob)
  "Durable, minimal, and easy to spot in a bag."
```

Neither is a wrong result. Leading with them was. `mergeResults` now takes the matched category slug and builds three groups: the search hits in that category, the category's other products, then the remaining hits.

The rule landed on `main` first (`10cfa66`), so this branch implements a settled spec.

## Decided by the spec (human decisions)

- Once a query has been taken to name a category, that category ranks above a substring in a sentence.
- Sort before the cap, not after. That means a full five search hits can lose one to a category product, which is accepted and stated rather than worked around.
- Keep the pin and the keychain in the results. They answer the question, just not first.

## Generated

- `lib/search.ts`: `mergeResults` gains a `categorySlug` parameter and the three-group order.
- `components/search/search-results.tsx`: passes `matched.slug`.
- `lib/search.test.ts`: the merge suite rewritten around an in-category and an out-of-category helper, including the live shape of a "bag" search and one case proving a category product really does displace a text match at the cap.
- `e2e/search.spec.ts`: one test asserting the first three cards for `/search?q=bag`.

## Deviations from the spec

None.

## Assumptions from the spec relied on

- The API returns at most `limit` search hits, so reordering inside the hits group can never change which products exist, only where the cap falls.

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 203 Vitest tests (2 integration tests skipped as usual).
- Playwright, 19 tests against `next start`, including the new one.
- Against the live API on `next start`:

| Query | Before | After |
|---|---|---|
| `bag` | pin, keychain, tote, drawstring, backpack | tote, drawstring, backpack, pin, keychain |
| `bags` | pin first | tote, drawstring, backpack, pin |
| `hat` | bucket hat, cap, beanie | unchanged |
| `hats` | cap, beanie, bucket hat | unchanged |
| `tshirt` | 1 result with the hint | unchanged |
| `shirt` | 1 result, no hint | unchanged |
| `cup` | 2 results with the hint | unchanged |
| `mug` | 2 results, no hint | unchanged |
| `black` | Showing 5 of 28 | unchanged |
| default | five featured | unchanged |

- The counts and the hint are unaffected: "bag" still reads "5 results" and "Includes everything in Bags", which is now true of the order as well as the set.

## Deferred

- Everything still open from the earlier pull requests: the 1024 px pill clipping, the category select's 120 ms revert, and editorial synonyms in Sanity.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #10 — E10: design system and polish

`epic/E10-design` · merged 2026-09-16

## Summary

E10 design system. The chrome is full width with a sticky header whose hairline appears on scroll, the promo strip sits under the header on every route, the hero is a full-bleed lifestyle photo with no link, and the product card has two shapes: rows on phones and grid cards with a price pill on the photo from md. The product page, cart and search pick up the type scale, mono prices, 44px controls and a shared empty state. The search category select no longer snaps back while a search is in flight.

The decisions come from a prototype and a grilling session and landed on `main` first (`0605316`, `77d0849`), so this branch implements a settled spec.

## Decided by the spec (human decisions)

- Card: study 05 with study 07's hover from the prototype. Price pill top-right on the photo, name and category under it; hover and the pending navigation invert the pill to the accent. Rows below md with the price first, no pill, no hover. Names never sit over the photo.
- Grids: rows / 3 on home, rows / 3 / 5 on search. Five columns stay: with the name under the frame nothing clips at 1024.
- Promo banner: accent strip, below the navigation, in the root layout on every route. One uncached `/promotions` call per page view, accepted for simplicity.
- Hero: full bleed, text over the sky, no button, no product link. The photo is the supplied `man-wearing-hoodie.png`, converted to `public/hero.jpg` (259 KB from 1.9 MB); the PNG is not in the repo.
- Header sticky at every width; nav pending cue is the link fading to secondary; footer full width with a hairline.
- Product page and cart re-laid out as agreed: card frame on the photo, mono price under the title, buy row stacked on phones; cart line with a 96px frame, sticky summary from lg with a separator, phones drop the "Quantity" label; empty and failed states through the shared `EmptyState` with a button.
- `useOptimistic` on the search category select, inside the existing search transition.
- Dark theme keeps the white-backed product photos as they are.

## Generated

- `app/globals.css`: `--color-on-photo`, `--radius-sm` / `--radius-lg`, the 32px heading step (`--text-3xl`). No other token changed.
- `components/container.tsx`: the content column; `main` is now full width and every page wraps its content in it.
- `components/price.tsx`: every price on a page goes through it (mono, tabular).
- `components/pending-scope.tsx`: a span that takes `pendingClassName` from `useLinkStatus()`; the only client code a card or nav link needs.
- `components/sticky-header.tsx`: the sticky `header` element plus an `IntersectionObserver` on a one-pixel sentinel that sets `data-scrolled`.
- `components/promo-banner.tsx` (moved from `components/home/`), rendered from `app/layout.tsx` under the header inside its own Suspense boundary; box reserves 76 / 56 / 36 px.
- `components/home/hero.tsx` rewritten; `HeroContent` is `{ headline, description }` plus a `HERO_IMAGE` constant; `getProduct` leaves the component.
- `components/product-card.tsx` and `components/product-grid.tsx` rewritten. The grid is now async and resolves category names from the cached `getCategories()`, so cards read "Bags" rather than `bags`. `ProductImage` takes `preload` (Next 16's name for `priority`) and a `className`.
- `components/empty-state.tsx`: heading, one line, children. Used by the cart's empty and unavailable states, the search empty state and the results error.
- `components/ui/separator.tsx` added via `shadcn add`; `cn` import pointed at `@/lib/utils` like the others.
- `components/quantity-stepper.tsx`: 44px controls, `labelClassName`, root `items-start` so it no longer stretches when stacked.
- `app/error.tsx`, `app/not-found.tsx`, `app/checkout/page.tsx`: in the column, 32px heading, `Button` for Try again.
- Tests: `e2e/home.spec.ts` asserts the hero image is not a link instead of the removed button; `e2e/cart.spec.ts` looks for the empty-state heading.

## Deviations from the spec

- **The hero copy sits over the photo from lg, not md.** At 768 to 1023 the band is 1.25:1 or squarer, the figure fills the left half and any copy on the right lands on his shoulder; I tried three crops and none read well. At md the band is the photo's own 2:1 and the copy sits under it, as on phones. Proposed spec sentence: "At lg and up the copy sits over the sky on the right; below lg it sits under the band, which is 2:1 at md and a 4:3 crop around the figure on phones."
- **`badge` is not installed.** The price pill is three utility classes on `PendingScope`; shadcn's Badge would have been a wrapper around the same classes with a `render` prop. Proposed spec change: drop `badge` from the installed list.
- **Hard-coded colours remain in the two `opengraph-image.tsx` routes.** Satori renders from inline styles and cannot read CSS variables; the values are the light and dark tokens spelled out. The acceptance criterion is ticked with that reading.
- **The category name comes from the grid, not the card.** The card receives `categoryName`; the grid resolves it once from the cached list rather than each card fetching.

## Assumptions from the spec relied on

- Tailwind v4's `hover:` variant is already wrapped in `@media (hover: hover)`, so no extra gate was needed for the card hover (confirmed in the generated CSS).
- `useLinkStatus()` must be called from a descendant of the `Link`, which is why the pill and the nav label are wrapped rather than the link itself.
- The `useOptimistic` setter runs inside the search page's shared `startTransition`, so the select's value reverts on its own if the navigation fails.

## Verified

- `pnpm verify` green: lint, typecheck, `next build`, 203 tests (2 skipped as usual).
- Build output: every route still `◐` with 1h / 1d; `/` is a partial prerender with the strip as its dynamic hole, the hero and grid in the shell.
- Playwright, 19 tests against `next start`, all passing after the two test edits above.
- axe (4.13, WCAG 2.1 AA and best-practice rules) on `/`, `/search?q=bag`, a PDP and `/cart` in light and dark: zero violations on all eight runs.
- Lighthouse 12 on the same four routes: accessibility 100 on all four; best practices 96 on all four, the only failing audit being console errors from `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, which do not exist outside a Vercel deployment. The criterion stays unticked until E11 measures the preview; nothing in this branch can change it.
- Screenshots at 390 and 1440 in light and dark for `/`, `/search?q=bag`, a PDP and `/cart` with a line, plus the hero at 768 and 1024 and a card at rest and on hover: layout holds, no horizontal scroll, the pill inverts and the frame darkens on hover. I can send them if useful.
- No hard-coded colour outside `globals.css` other than the two OG routes above.

## Notes and flags

- **The promo strip on every route reserves its height even with no promotion.** Today there is always one, so the empty 36px band is never seen; it is the price of no layout shift and was accepted in the spec.
- **The hero copy is `--color-on-photo` in both themes** because the photo does not change with the theme; it is the one colour token that does not flip.
- **The supplied PNG was deleted from `public/` after conversion.** If you want the original kept anywhere, it needs to come from your copy; only `hero.jpg` is in the repo.
- Deferred: "More in this category" on the product page and the art-directed hero (`specs/improvements.md`).

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #11 — E10: promo ticket chip and marquee

`epic/E10-promo-strip` · merged 2026-09-16

## Summary

Follow-up to #10 on the promo strip and the hero. The promotion code is a ticket chip; a strip line that does not fit scrolls as a marquee instead of wrapping, so the strip is always one line; the hero headline is 40% larger from md.

Decisions landed on `main` first (`ebff17d`).

## Decided by the spec (human decisions)

- Ticket chip: 1px top and bottom border, 4px left and right, small radius, mono, on the accent strip.
- Marquee only when the line overflows; still and centred otherwise. About 40 px/s, seamless loop, pauses on hover and focus. Under `prefers-reduced-motion` nothing moves and the text wraps as before. Accepted as the one animation that is not a confirmation.
- Hero headline 67px at md and up (48 × 1.4); phones stay at 32.

## Generated

- `components/promo-marquee.tsx`: a client leaf with a `ResizeObserver` comparing the text's `scrollWidth` to the strip; when it overflows it renders a second `aria-hidden` copy and sets `--marquee-duration` from the width. The strip becomes focusable only while scrolling, so keyboard users can pause it.
- `app/globals.css`: `--animate-marquee` and its keyframes in the theme.
- `components/promo-banner.tsx`: the chip, the marquee, and a reserved box of one line (36px) that keeps the wrapped heights only under `motion-reduce`; skeleton lines follow the same rule.
- `components/home/hero.tsx`: `md:text-[4.2rem] md:leading-none`.

## Deviations from the spec

None.

## Assumptions from the spec relied on

- `scrollWidth` of a `white-space: nowrap` span is the line's full width even inside an `overflow: hidden` parent (confirmed: the tablet screenshot shows the second copy entering from the right).
- Reduced motion removes `nowrap`, so the text wraps, never overflows, and the observer keeps the still layout (confirmed with `reducedMotion: 'reduce'` in Playwright).

## Verified

- `pnpm verify` green: lint, typecheck, `next build` (every route still `◐`), 203 tests.
- Playwright, 19 tests against `next start`.
- Screenshots at 390, 768 and 1440: the strip scrolls at 390 and 768 (two shots three seconds apart show it moving), is still and centred at 1440 with the chip; at 390 with reduced motion it wraps to three lines with the chip on the last. The hero headline reads at 67px on desktop.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #12 — E16: cart API improvements

`epic/E16-cart-api-improvements` · merged 2026-09-17

## Summary

E16 cart API improvements, built before E11 so the performance pass measures the store as it ships. The Swag Store API's cart calls still take 1.6 to 3.1 s each on 17 Sep 2026, so the epic went ahead. A repeat Add to Cart now makes one cart call instead of three and is acknowledged in about 0.03 s instead of about 7 s. Rapid quantity clicks send one request instead of four, and `/cart` reads the cart once.

The decisions came from a grilling session and landed on `main` first (`413edee`), so this branch implements a settled spec. One commit per step.

## Decided by the spec (human decisions)

- All six steps in one PR, E16 scheduled before E11 (`specs/decisions.md`).
- Step 1: a small inline SVG spinner beside "Adding…"; the glyph stays still under reduced motion.
- Step 2: write first, re-check only after a 404, open a new cart and retry once. Cart calls get a 10 s timeout; everything else keeps 5 s.
- Step 3: 400 ms pause, last value wins; leaving the page flushes; Remove cancels a waiting value and sends at once. A tab closed inside the pause loses the change (noted in `specs/callout.md`).
- Step 4: React `cache()` around the cart read.
- Step 5: actions answer `{ ok: true, totalItems } | { ok: false, error, totalItems? }`; the badge count is client-held in a layout provider. Noted in `specs/callout.md` as requested.
- Step 6: optimistic confirmation and badge; "View cart" inert until the write lands; a failed add falls back to the confirmed count.
- Vitest on pure logic only, no component test library. Timings before and after against `next start`, recorded in `specs/callout.md`.
- `CONTEXT.md` gains "Confirmed count".

## Generated

- `components/spinner.tsx`, used by `components/product/add-to-cart-form.tsx`.
- `lib/api/client.ts`: `timeoutMs` option; `lib/api/cart.ts`: `CART_TIMEOUT_MS`.
- `app/cart/actions.ts`: write-first add with `onExpired`, count in every result that read the cart.
- `lib/cart/coalesce.ts`, draft helpers in `lib/cart/lines.ts`, wired into `components/cart/cart-line.tsx` and `cart-view.tsx`.
- `lib/cart/get-cart.ts`: `getCartFromCookie` wrapped in `cache()`.
- `lib/cart/count.ts` (pure rules) and `components/cart/cart-count.tsx` (provider, hook, client badge number); `app/layout.tsx` wraps the page in the provider.
- Tests: timeout, retry-once, coalescer, drafts and count rules in Vitest. In Playwright: the optimistic add, a failed add (an unknown product id), and a rapid plus sequence that ends in one request. The existing flow now waits for the action's response before reloading.

## Deviations from the spec

- **The badge skips its cart read while Next renders an action's response.** The spec expected the returned count alone to remove the read. It does not: setting the cart cookie in an action makes Next re-render the whole page in the same response, and the transition waits for the badge's streamed read. `CartBadge` now checks for the `next-action` request header and renders without reading. Proposed spec sentence for step 5: "On the render inside an action's response the badge does not read the cart; the count the action returns is the fresher value."
- **Successful adds still call `refresh()`.** I tried dropping it for adds; the cookie write re-renders anyway, so the flag bought nothing and came out again.
- **Stock locators in the e2e specs are scoped to the main landmark.** React streams a hidden copy of each hole to the end of the body before revealing it, and the unscoped locators occasionally matched both.

## Assumptions from the spec relied on

- Next 16.3.5 marks a cookie write in an action as a full revalidation and re-renders the page. I checked the source (`request-cookies.js`, `action-handler.js`).
- The form keeps working without JavaScript: it is still `useActionState(addToCart)` on a native form. The optimistic count comes from `useFormStatus` data, not from a client wrapper around the action.

## Verified

- `pnpm verify` green: lint, typecheck, build, 227 Vitest tests (2 skipped as usual). Every route still `◐` with 1h / 1d.
- Playwright, 20 tests against `next start`, run with `--repeat-each 3` several times. The remaining failures are the pre-existing flake below.
- Timings (three runs each, cart calls counted by a fetch hook in the server):

| Flow | Before | After |
|---|---|---|
| Second Add to Cart, acknowledged | 6.3 to 7.3 s | 0.02 to 0.03 s |
| Second Add to Cart, saved | 6.3 to 7.3 s, 3 calls | 2.8 to 3.3 s, 1 call |
| First Add to Cart, saved | 6.9 to 7.4 s, 3 calls | 5.4 to 6.1 s, 2 calls |
| Four plus clicks on `/cart`, saved | 19.0 to 21.0 s, 12 calls | 4.7 to 5.3 s, 2 calls |
| Loading `/cart` | 2 cart reads | 1 cart read |

- The spinner turns with no motion preference and has `animation-name: none` under `reduce`.
- The browser still makes no request to the API; the existing e2e origin check passes.

## Deferred

- **Pre-existing product page flake, also on `main`.** About 1 in 12 to 1 in 36 loads under parallel Playwright load show Add to Cart disabled beside "In stock", or a quantity input with a client-generated id, which means React rendered a boundary on the client. I reproduced it on a `main` build (3 of 36 loads) with no console errors and no stock failures in the server log. It belongs with E11's check that no dynamic hole shifts or misrenders.
- The spinner ring is quiet on the black button; a contrast pass fits E11's axe run.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #13 — E11: performance fixes and caching evidence (part 1)

`epic/E11-performance` · merged 2026-09-17

## Summary

E11 performance and caching verification, first part. This PR carries the code changes the measurements called for and the evidence gathered so far against a production build. It goes to production so Lighthouse can run on the real deployment. The three documents, the screenshot tests and the Lighthouse record follow in a second PR, so the acceptance criteria stay unticked here.

## Decided by a human in this session

- Set `fetchpriority="high"` on the hero image.
- Inline the stylesheet.
- Keep the promo placeholder accent blue while it loads.
- Remove noindex only for the Lighthouse measurement, then restore it. This PR adds the switch; production stays noindex until `ALLOW_INDEXING=true` is set and a build runs.
- `CATALOG_REVALIDATE_SECRET` is set in Vercel production by the user; a copy lives in the git-ignored `working/`.

## Generated

- `app/api/revalidate/catalog/route.ts`: `POST` with `Authorization: Bearer <secret>`, compared in constant time. It expires the `products`, `categories` and `store` tags with `{ expire: 0 }`. Without a configured secret it refuses every call. The secret is optional in `lib/env.ts` and must be at least 32 characters. The curl command is in the README.
- `instrumentation.ts` registers `@vercel/otel` as `vercel-swag-store`. `fetchApi` opens one span per call, named after the route pattern, with the method, path, status, error code and cache policy. Every call site now states its policy (`cache: 'cached' | 'live'`). New dependencies: `@vercel/otel`, `@opentelemetry/api` and the six OpenTelemetry peers `@vercel/otel` requires.
- `next.config.ts`: `images.formats` AVIF then WebP, and `experimental.inlineCss`.
- `components/product-grid.tsx`: image `sizes` become fixed widths from 1152px, where the column stops growing. The home grid got 640px files for 355px cards before.
- Layout shift: cart rows reserve two name lines below lg, and the cart skeleton matches them. The search results region is at least a screen tall, so the footer never moves in view.
- `lib/security-headers.ts`: `allowIndexing`, read from `ALLOW_INDEXING=true` at build time.
- Tests: the route (8), tracing and route naming (12), the default and cart timeouts are unchanged, and the indexing switch (1).

## Deviations from the spec

- **Revalidation expires at once rather than serving stale.** `revalidateTag(tag, { expire: 0 })`: an operator who calls the route expects the next page to show the change.
- **"Formats default (AVIF, WebP)" needed configuration.** Next's default is WebP only.
- **The root Open Graph image now builds as static (`○`),** where earlier builds reported it dynamic. The per-product image stays dynamic. Neither is a page route.

## Evidence so far (production build, `next start`)

- **Build output.** Every page route is a partial prerender (`◐`, 1h / 1d): `/`, `/cart`, `/checkout`, `/search`, `/_not-found` and all 28 product slugs. The pending holes in the prerendered HTML are the badge, the promo strip, stock with Add to Cart, the cart contents, the search form and results, and Vercel Analytics, which reads search params. Only the two image routes and `/api/revalidate/catalog` are dynamic.
- **Catalogue cache.** A fetch hook logged every API call in the server. Three product page loads made 3 stock and 3 promotion calls and nothing else. Five home loads made 5 promotion calls, with a different promotion on most loads.
- **Stock is live.** The stepper's maximum on five loads of one product was 24, 24, 5, 21 and 1, while the name and price stayed the same.
- **Revalidation.** A wrong secret gets 401. The right one gets 200, and the next product page load fetched the product, categories and store config again. The load after that was back to stock and promotions only.
- **Secrets.** The bypass token is in no file under `.next/static` and in no prerendered HTML or RSC payload. The literal from the spec is absent too.
- **Layout shift.** Zero on `/`, a product page, `/search`, `/search?q=hat`, `/cart` with two lines, an empty cart and `/checkout`, at 375, 768 and 1280, three runs each. The search routes were rerun ten times after the fix.
- **Image sizing.** Served widths are 1.1 to 1.5 times the rendered widths at 375 (3x), 768 and 1280 after the grid change.
- **Lighthouse mobile on `/`, locally.** 93 to 95 before inlining and 94 after, three runs each. The render-blocking audit disappears. Local runs cannot show the network saving, which Lighthouse put at 140 ms on production.
- **Unused JavaScript.** The 71.6 KiB chunk Lighthouse flags is React DOM with Next's router bootstrap. The polyfill chunk is `noModule` and modern browsers skip it. Nothing app-level removes either.
- `pnpm verify` green: 248 Vitest tests (2 skipped as usual).

## Client components

All 17 are interactive leaves, each with its reason in its doc comment. `cart-count`, `cart-line`, `cart-view`, `cart-summary` and `add-to-cart-form` hold cart state or pending status. `quantity-stepper`, `gallery-thumbnails`, `promo-marquee` and `sticky-header` need the DOM or local state. `nav-link` and `pending-scope` read router state. The four search components and `results-error` manage the search transition and retry. `error-boundary` is a class component, and `app/error.tsx` must be a client component. `ui/separator` is the shadcn wrapper around Base UI. The spec's list named five; the others arrived with E06, E07, E10 and E16.

## Deferred to the second E11 PR

- `docs/build-output.md`, `docs/static-vs-dynamic.md` and `docs/lighthouse.md`, from the evidence above.
- Playwright `toHaveScreenshot` for `/`, a product page, `/search?q=hat` and `/cart`, light and dark, at 375 and 1280. Running them in CI belongs to E12, which creates the workflow.
- Lighthouse mobile and desktop on production for the four routes, with `ALLOW_INDEXING=true` for that run only.
- Speed Insights and Analytics status, and a screenshot of the traces in the Observability tab.
- The Sanity revalidation check waits for E08 and E09.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #14 — E11: caching docs, visual regression and font subsetting (part 2)

`epic/E11-performance-docs` · merged 2026-09-17

## Summary

E11 part two: the documents, the visual regression suite and one performance change that measurement justified. With this, every E11 acceptance criterion is ticked.

## Decided by a human in this session

- Load the fonts as a Latin subset. Kept after measurement; see below.
- Serve the hero at a lower image quality: measured, no gain, reverted.
- Remove the noindex header only for the SEO measurement, then restore it. Done: production is `noindex` again and `ALLOW_INDEXING` is deleted from the Vercel project.

## Generated

- `docs/build-output.md`: the route table, what each route prerenders against what streams, the pending-boundary count per built HTML file, and the three routes that are not partial prerenders.
- `docs/static-vs-dynamic.md`: one table per route and one per data source, with cache tags and what refreshes them, the demonstrated revalidation run, all seventeen client components with a reason each, and the rules that keep the shell static.
- `docs/lighthouse.md`: production and local scores with dates and URLs, the font comparison, and what was measured and rejected.
- `apps/store/e2e/visual.spec.ts` with 16 committed snapshots: home, a product page, `/search?q=hat` and `/cart` with a line, in light and dark at 375 and 1280.
- `app/layout.tsx`: fonts through `next/font/google` with `subsets: ['latin']` instead of the `geist` package's full variable files.

## Measurements

Local, `next start` on a production build, Lighthouse 13 mobile, median of five runs:

| Variant | Performance | Largest paint | Fonts | Page total |
|---|---|---|---|---|
| Full variable fonts | 95 | 2945 ms | 139 KB | 445 KB |
| Latin subset (shipped) | 96 | 2718 ms | 53 KB | 361 KB |

Production on 17 Sep 2026: performance 96 to 98 across three runs, accessibility 100, best practices 100, SEO 66. SEO is capped by the deliberate noindex header; with indexing allowed the category scores 100, measured locally.

Rejected after measuring: hero image quality 50 (halves the file, indistinguishable, but moved neither score nor largest paint, because the phone-sized hero is 11 KB); font preloading (the inlined stylesheet means Next emits no font preloads at all); the flagged unused and legacy JavaScript (both inside React DOM and Next's polyfill bundle).

## Deviations from the spec

- **The visual suite pins one product and seeds the cart through the API.** The spec said to mask the promo banner and the stock line, which I do. That was not enough: live stock changes which product is "first in stock", so shots differed between runs. The product page uses a fixed slug, and the cart page gets its line from a direct API call plus the cookie, so no screenshot depends on stock.
- **Snapshots are macOS files** (`-darwin` suffix, 2.3 MB total). Playwright keys snapshots by platform, so the CI job E12 creates needs its own Linux set, generated once with `--update-snapshots`. Proposed spec sentence: "Snapshots are committed per platform; CI generates and commits its own on first run."
- **`docs/lighthouse.md` records production from the Chrome DevTools run,** not from a scripted run. Preview deployments sit behind protection and production is the only public URL.

## Verified

- `pnpm verify` green: lint, typecheck, build, 248 Vitest tests (2 skipped as usual).
- Playwright: 36 tests, 35 passing and 1 skipped as usual. The visual suite ran four times over three builds with no diff.
- Layout shift zero on seven page states at three widths, three runs each.
- The bypass token appears in no file under `.next/static` and in no prerendered HTML.

## Investigated and closed

- **The "rare product page flake" I reported in the first E11 PR does not exist.** Add to Cart appearing disabled beside a stock line was my detector counting every disabled button as a failure, including the correct out-of-stock case. Re-measured on this build: 120 loads of one product gave 92 in stock enabled, 23 low stock enabled, and 5 out of stock disabled. Never disabled beside an in-stock line. Sampling the API directly, that product answers with 0 stock about 2 % of the time, which matches the rate I had seen. I also slowed the stock call to 3 s to test the hydration-race theory: 48 loads, no failures, and 96 loads at twelve parallel browsers with no delay, also none. One test carried the same false assumption and asserted the button was enabled after an add; it now only checks the label returns.

## Deferred

- **Speed Insights and Web Analytics figures.** Both are wired into the layout, but the dashboards need real traffic before there is anything honest to record. E12 can add the first week's numbers or state "insufficient data".
- **The Observability screenshot.** Tracing ships (`@vercel/otel`, one span per API call with its cache policy), but capturing the traces view is a dashboard action.
- The Sanity revalidation check in the spec waits for E08 and E09.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #15 — E08 + E09: Sanity content model, Studio and rendering

`epic/E08-sanity` · merged 2026-09-18

## Summary

E08 and E09 in one pull request, as their specs call for. Sanity now holds the marketing copy and the product enrichment, the store reads it through the same `"use cache"` discipline as the API, and a signed webhook expires the affected tags when an editor publishes. The API stays the source of truth for everything it owns.

## Decided by a human in this session

- Seven document types, no collections and no guides. Collections had no reader and guides were a second content surface with no page to put it on.
- The product enrichment lives on the `product` document itself, not on a separate "product enrichment" type.
- Products and categories are mirrored into Sanity by a script and read only in the Studio, so every editorial link is an ordinary reference with referential integrity. Recorded in `docs/adr/0003-sanity-mirrors-api-products-and-categories.md`.
- FAQs are reusable documents. A product shows the FAQs whose categories include its own, plus the ones it attaches by hand. An FAQ with no categories shows only where a product attaches it, so an empty array never means "everywhere".
- Portable Text is paragraphs, bold, italic and links. Nothing else.
- The dataset is public, so the store reads Sanity without a token and a missing secret can never break a build.
- The write token stays local, in `working/`, never in Vercel.

## Generated

- `packages/sanity/src/schemas/`: `siteSettings`, `homePage`, `checkoutPage`, mirrored `product` and `category`, `lookbookEntry` and `faq`, with a shared Portable Text definition and a shared image field that requires alt text.
- `apps/studio`: desk structure with the three singletons opening their own document, a create menu limited to FAQ and Lookbook entry, previews per type, and `structureTool`, `visionTool` and `sanity-plugin-media`.
- `packages/sanity/scripts/sync.ts` and `seed.ts`: the mirror writer and the demonstration content, both idempotent, plus committed typegen output.
- `apps/store/lib/sanity/`: client, cached fetch, GROQ queries, image helpers, the merge, the FAQ union and the page loaders.
- `apps/store/components/product/enrichment.tsx` and the Portable Text serializer: badges, "About this item", "How to use and care", "Seen on", "Common questions".
- `apps/store/app/api/revalidate/sanity/route.ts`: signature checked with `parseBody`, expires `sanity:<type>` and `sanity:<id>`.

## Deviations from the spec

- **Document ids use hyphens, not dots.** The spec says `product.<apiId>` and `category.<apiSlug>`. A dot in a Sanity id makes everything before it a document path, and a path segment such as `product` is not readable by an anonymous client, so every mirrored document was invisible to the store. The ids are now `product-<apiId>` and `category-<apiSlug>`; the 48 documents written under the old scheme were deleted and reseeded. Proposed spec sentence, to land on `main`: "`_id` is `product-<apiId>`; ids contain no dots, because a dot makes the prefix a document path and changes who may read it."
- **The sync script reads the API with its own fetch,** not "through the store's own client" as the spec says. Reusing that client would make a package depend on an app. The request still sends the bypass header and parses the same shapes.
- **The product enrichment block renders only when there is content.** An always-present wrapper added 24 px of padding to unenriched pages, which the E11 snapshots caught.

## Verified

- `pnpm verify` green: lint, typecheck, build, 264 Vitest tests with the usual 2 skipped.
- Playwright green: 32 tests, including the 16 E11 visual snapshots, which still match. That is the proof that a product without a document renders exactly as it did before.
- Against the live dataset: the hoodie shows its badge, "About this item", "How to use and care" and three category FAQs; the backpack shows its category FAQ plus the one it attaches; the tumbler, which has no document, is unchanged; checkout reads its singleton.
- Build output unchanged in static and dynamic terms. Sanity adds no dynamic hole; every Sanity read is cached and tagged.
- Unit tests cover merge precedence, the FAQ union and ordering, the serializer's allowed marks, and the webhook's 200, 400 and 401.
- Every fallback stays in place, so an empty dataset renders what shipped before.

## Open, needing account access

- **The Studio is not deployed yet.** `apps/studio` on Vercel plus `sanity deploy`, then CORS origins for `http://localhost:3333`, the Studio URL and the store URLs. The two E08 criteria about the deployed Studio and about publishing a lookbook entry without consent stay unticked until then.
- **The webhook is created in Sanity with the matching secret, but not yet proven end to end.** Once this is deployed, publishing a change in the Studio should update the site without a redeploy. That E09 criterion stays unticked.
- **"Seen on" has no data.** The lookbook needs two entries with a photo and consent ticked, which means uploading images in the Studio.

## Deferred

- E15 replaces the manual sync trigger with a scheduled Sanity Function.
- Visual editing, Presentation, draft previews and the Live Content API stay out, as the spec says.

## #16 — E09 follow-ups: drop badges, readable enrichment column, smoother FAQ

`epic/E09-followups` · merged 2026-09-18

## Summary

Two things you spotted on the deployed product page, plus the two details agreed in the grilling session. Badges are gone, the text below the buy row reads as one column, the FAQ opens smoothly under a chevron, and a lone lookbook entry no longer looks lost.

## Decided by a human in this session

- **Drop badges entirely**, from the schema as well as the page. They only ever showed on the product detail page, which is where a scanning aid helps least.
- **Keep the Extra photos field** on the product document. It is the only way a product ever gets a second photo, since every API product has exactly one image.
- **Keep the lookbook as it is**: a named person, a role and a quote. The Instagram-style user content idea was considered and dropped.
- Photo on the right in the single-entry layout, so it does not sit directly under the product photo.
- Chevron instead of the plus, with a smooth open and close.

## Why badges had no path back

- Every one of the 28 products carries the same `createdAt`, `2026-02-10T16:00:00Z`, so a derived "New" would mark all of them or none.
- Stock is random per request. Five calls for one product returned 8, 25, 4, 16 and 6, so a derived "Limited" would change between two page loads and could not be cached.
- Tags are descriptive, never promotional: `black`, `triangle`, `insulated`.

Recorded in `specs/improvements.md` with what bringing them back would take.

## Generated

- Badges removed from the schema, the seed, the GROQ query, the merge, the merge tests, the product page and the glossary, with typegen regenerated. The two leftover values were unset in the dataset, so it matches the schema.
- The enrichment stack shares one 68 character column. The measure left the Portable Text renderer, which now takes the width it is given, and the checkout page sets its own.
- One lookbook entry renders as a feature row, photo on the right at two fifths and the quote set larger beside it, stacking to photo then quote on a phone. Two or more keep the grid.
- The FAQ disclosure gets a rotating chevron and animates through `::details-content`, guarded by `@supports` and by `prefers-reduced-motion`, so a browser without it keeps the instant toggle it always had.

## Verified

- `pnpm verify` green: lint, typecheck, build, 264 Vitest tests with the usual 2 skipped.
- Playwright green: 35 passed, 1 skipped. The 16 visual snapshots still match and needed no regeneration, because the snapshotted product has no enrichment.
- Checked in the browser at 1280 and 375, light and dark, against your two new lookbook entries as well as a temporary one I created for the backpack and deleted afterwards.

## Notes

- Spec changes landed separately on `main`: badges removed from the E08 and E09 specs, the layout decisions written in, and the document id rule corrected to hyphens with the reason.
- The dataset write and the delete were made with the local write token. Nothing about them is in the repository.

## #17 — E09: align the enrichment with the columns above it

`epic/E09-enrichment-layout` · merged 2026-09-18

## Summary

The layout change you asked for after #16 was merged. Everything below the buy row now takes the width of the page above it.

## Decided by a human in this session

- The enrichment blocks should share the width of the top of the page, rules included.
- Of the three layouts I offered, heading on the left and text on the right, matching the gallery and buy columns.
- Quotes in italic guillemets.

## Generated

- Each section is a two-column grid on medium and up: the rule spans the container, the heading sits in the left column under the gallery, the words in the right column where the price sits. Below that breakpoint it stacks, heading first, exactly as before. The 68 character wrapper from #16 is gone.
- A `Quote` component renders italic text in guillemets with a no-break space inside each mark, used by both lookbook layouts.
- The single-entry lookbook keeps its photo on the right, now inside the text column at two fifths of it.

## Verified

- `pnpm verify` green: lint, typecheck, build, 264 Vitest tests with the usual 2 skipped.
- Playwright green: 36 passed. The 16 visual snapshots still match, because the snapshotted product has no enrichment.
- Checked at 1280 and 375, light and dark, against the tote bag and backpack pages.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #18 — E09: give the single lookbook photo the full column

`epic/E09-lookbook-photo` · merged 2026-09-18

## Summary

One commit, correcting the size of the lookbook photo on a product page with a single entry.

## What was wrong

We agreed the photo would take 40 percent. When the sections moved into two columns in #17, that 40 percent became 40 percent of the right column, so about a fifth of the page. At 1280 pixels the photo rendered 235 wide.

## Generated

The single-entry layout no longer sits inside a column. It spans the page's two columns itself: the heading, the quote and the attribution on the left, the photo filling the right column, which puts it at the width of the buy panel above it, about 530 pixels at 1280. On a phone it stacks as heading, quote, attribution, photo.

## Verified

- `pnpm verify` green: lint, typecheck, build, 264 Vitest tests with the usual 2 skipped.
- Playwright green: 36 passed. The 16 visual snapshots still match.
- Checked on the travel mug page at 1280 and 375.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #19 — E09: lookbook heading above the photo, quote bottom right

`epic/E09-lookbook-quote` · merged 2026-09-19

## Summary

Three adjustments to the single-entry lookbook block on a product page.

## Decided by a human in this session

- The section heading belongs above the whole block, not beside the picture.
- The quote is ranged right when the photo is on the right.
- One size larger, and set at the foot of the photo rather than centred.

## Generated

`Seen on` now spans the top of the section. Under it, a two-column row holds the quote on the left and the photo on the right. The quote sits at the bottom of that row, ranged right, so the text and the picture meet in the middle of the page. It is one Tailwind step larger, and the attribution follows it.

On a phone the section stacks as heading, quote, attribution, photo, all ranged left.

## Verified

- `pnpm verify` green: lint, typecheck, build, 264 Vitest tests with the usual 2 skipped.
- Playwright green: 36 passed, twice. One visual test failed on the first run and passed on both re-runs; the page it shoots has no enrichment and is untouched by this change.
- Checked on the travel mug and tote bag pages at 1280 and 375, light and dark.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #20 — E09: FAQ chevron before the question

`epic/E09-faq-chevron-left` · merged 2026-09-19

## Summary

The chevron on each common question moves from the right edge to the left, before the question.

## Decided by a human in this session

- The chevron sits on the left instead of the right.

## Generated

The chevron now leads the question with a small gap. The answer is indented by the same amount, so it lines up under the question text rather than under the chevron. Open and closed states and the rotation are unchanged.

## Verified

- Store lint and typecheck green.
- Checked on the backpack page at 1280 and 375 with a question open: no horizontal overflow at either width.
- The full `pnpm verify` and Playwright suites were not run for this one-line markup change.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #21 — E13: search-gap loop

`epic/E13-search-gaps` · merged 2026-09-19

## Summary

E13 without its optional review slice: failed searches are counted after the response, a Sanity Function wakes a Vercel Workflow, one model call turns the gaps into product ideas, and an editor sets each idea to accepted or rejected in the Studio. Slices 1 to 4 and 6. Slice 5, the early-access Sanity Workflows review, follows in its own pull request so it can be reverted alone; until then the review is the status field on the idea.

## Slice 0 answers

1. **`withWorkflow` with `cacheComponents: true`: works.** On `workflow` 4.8.9 and Next 16.3.5 the build passes. The route table differs from `main` by three added dynamic routes under `/.well-known/workflow/v1/` and nothing else; every existing route keeps its mode.
2. **A `"use cache"` function inside a step: works.** A step calling `getProducts` returned products under `next start` and `next dev`. A second call in the same step took 1 to 2 ms, so the cache is hit from inside steps. No uncached sibling is needed.
3. **Dotted ids: work.** An anonymous GROQ query for both types returns an empty result while a token reads them. The deployed `gap-threshold` Function fired on a dotted-id gap with the default `includeDrafts: false`, so no Function needs `includeAllVersions`. A search gap opens and edits normally in the Studio, confirmed by a human on the Studio preview.

## Decided by a human in this session

- The analysis uses a model AI Gateway's free tier serves. `MODEL` is `openai/gpt-5-nano`, the model the real run below was made with.

- Slice 5 ships separately, after this pull request and a small Studio desk change.
- Preview Studios are admitted by one wildcard CORS origin limited to the Studio project; `specs/decisions.md` records the decision and its limit.

## Decided by the spec

- Package shape, constants, id scheme, filters, schema fields, desk layout and the capture rules are as written in `specs/E13-search-gap-loop.md`.

## Generated

- `packages/demand`: normalisation with the privacy filters, dotted ids, typing-fragment detection, the model's zod schema and prompt, validation of its answer, and every Sanity read and write of the loop over a client the caller passes in.
- `searchGap` and `productIdea` schemas, regenerated types, a "Demand signals" group in the desk, and a `seed-demand` script.
- Store: an optional write client, `recordGapAfterResponse` registered through `after()`, one guarded call in `SearchResults`, and one line in the empty state.
- Analysis: `POST /api/demand/analyse` behind a bearer secret starts the `analyseDemand` workflow. It takes a lock, waits ten minutes, claims gaps, reads the catalogue, asks the model once for a schema-checked object, validates it and writes one transaction. Any failure after the claim releases the gaps. The bearer check moved to `lib/bearer.ts` and the catalogue revalidation route uses it too.
- Trigger: `sanity.blueprint.ts` at the root declares an organisation-scoped stack with one document Function, `gap-threshold`, in the new `apps/functions` workspace. It POSTs to the analysis route with the bearer secret and throws on anything but a 2xx. The README gains the Blueprint commands.
- Docs: a "Search-gap loop" section and the environment table in the README, the repo layout and a cache-policy row in `AGENTS.md`, and `docs/adr/0004-demand-loop-runtimes.md`.
- `.gitignore` gains Next's SWC plugin cache and the folder Vercel Workflow generates.

## Assumptions and deviations

- `typingFragments` returns each fragment id with the query it belongs to, not ids alone, because the note an editor reads names that query.
- `productIdea.suggestedCategory` is a weak reference. The API can hold a category the mirror has not synced yet, and a strong reference to a missing document would fail the whole run's transaction.
- A digit run counts digits across spaces and hyphens, so a spaced phone number is dropped too.
- `applyDecision` is idempotent on the idea's status rather than on a stored effect key: a decision already on the idea writes nothing.
- The desk shows ideas as two lists, proposed and decided, because a Studio document list cannot order by an expression.
- pnpm 12 asks for a decision on two install scripts that `workflow` brings in. Both packages ship prebuilt binaries, so both are set to `false`, and the build and the runs below work without them.
- The model's schema uses nullable fields where the spec says optional. OpenAI's structured output rejects a schema with optional properties; nullable is accepted by every provider tried, so the loop is not tied to one vendor.
- The workflow body imports `@repo/demand/constants` and `@repo/demand/validate`, not the package root, because the root pulls in `node:crypto` and the workflow sandbox has no Node built-ins.
- The catalogue step uses the existing `getAllProducts`, which already pages with `hasNextPage`.
- A deployed Function always plans as an update, because its source is uploaded again on every deploy; redeploying identical code and planning again shows it. The spec's "plan is clean" criterion was restated on `main` to say so.
- A skipped run also returns the id of the run holding the lock.
- The `demand-robot` token is not declared yet. `gap-threshold` reads and writes nothing in Sanity, so the token arrives with slice 5, which is the first thing to need it.
- An organisation-scoped Function must name its `project`, which the spec does not mention.
- `.sanity/blueprint.config.json` is committed: it holds the stack and organisation ids and no secret, and a deploy needs it.

## Verified

- `pnpm verify` green: 12 tasks. 45 tests in `packages/demand`, 3 in `apps/functions`, 294 in the store with the usual 2 skipped.
- Playwright: 36 passed. Four product-page snapshots were refreshed in their own commit: every product gained published care content in Sanity, so the page the test shoots grew a section. Content, not code.
- `/search?q=umbrella` on a local production build, ten runs each: median 143 ms without the write token, 138 ms with it. Unchanged within noise.
- A second analysis over the settled seed gaps claimed nothing and wrote nothing.
- No secret in the branch diff: scanned for long hex strings, bearer values and token shapes.
- The build's route table differs from `main` by Workflow's three `/.well-known/workflow/v1/` routes and `/api/demand/analyse`, and by nothing else.
- Real local run on a production build, `settle: false`: 401 without the secret, 202 with it. A second call while the first ran recorded a `hook_conflict` and completed as `skipped: running`.
- Failure path, for real: AI Gateway refused `anthropic/claude-haiku-4.5` because the account is on the free tier. The run failed, and every claimed gap was back at `new` afterwards.
- Success path, with the constant temporarily pointed at the free `openai/gpt-5-nano` and not committed: one "Umbrella" idea with estimated demand 10 from the three umbrella gaps and category accessories, "hodie" matched to the hoodie, "asdfgh" ignored as gibberish, "umb" ignored as a typing fragment. That data is still in the dataset, labelled with the model that wrote it.
- `/search` is still a partial prerender in the build output.
- Playwright `search.spec.ts`: 12 passed, including the new line in the "umbrella" test.
- Local production build against the real dataset: a browser search for "Picnic Blanket!" created one gap stored as "picnic blanket" with count 1; a Googlebot search and an email-address query created nothing; no error was logged. The test gap was deleted afterwards.
- Slice 4, deployed for real: `blueprints plan` showed one create, `deploy` completed, and both variables were set with `functions env add`. Incrementing a test gap from 1 to 2 invoked the Function within seconds. It reached production and logged "The store answered 404", which is correct until this PR is merged, because production does not have the route yet. The test gap was deleted. `functions test` runs locally as the README describes.
- The six seed gaps are in the production dataset and invisible to an anonymous query.

## Set up by hand before this records anything on Vercel

- Already done: `SANITY_API_WRITE_TOKEN` (a dedicated Editor token) and `DEMAND_ANALYSE_SECRET` are set for Production and Preview, and the project already exposes system environment variables.

## Deferred

- Slice 5: the Sanity Workflows review, the `demand-robot` token and three more Functions. Its acceptance criterion is the one left unticked.
- The `@workflow/vitest` integration test for the lock. The lock was verified by hand against the local runtime instead, as described above.
- After merging: `gap-threshold` already points at production, so its current 404 turns into a 202 without further setup.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #22 — E08: Studio desk with sections and icons

`epic/E08-studio-desk` · merged 2026-09-19

## Summary

The Studio's desk is reordered into four sections with headings, and every item has its own icon instead of the default folder.

## Decided by a human in this session

- The order: Products, FAQs, Lookbook under the list's own "Content" title; then "Website" with Home page, Checkout page, Site settings; then "Taxonomies" with Categories; then "Demand signals" with Search gaps, All gaps and a Product ideas folder.
- Section headings are separators that carry a title.
- Product ideas holds three lists: Open, Accepted, Rejected.
- "Lookbook" keeps its name here. Renaming it to "Testimonials" across the whole setup is a separate pull request.

## Generated

- `apps/studio/structure.ts` rewritten around two small helpers, one for a page that exists once and one for an idea list per status. Demand signals is a section now, so its lists sit at the top level.
- `@sanity/icons` declared in the Studio's dependencies. It was already installed through `sanity`, so nothing new is downloaded. Version 5 exports each icon from its own path, which is how they are imported.

## Assumptions

- Accepted and Rejected ideas are ordered by decision date. Until E13's review slice stamps that date, those two lists have no meaningful order.

## Verified

- Studio lint, typecheck and build green.
- Not checked in a browser by me: the Studio needs a login. The Studio preview below is the place to look.

## Deferred

- The testimonials rename.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #23 — E09: lookbook entries become testimonials

`epic/E09-testimonials` · merged 2026-09-19

## Summary

The quote, name and photo shown under "What people say about it" are testimonials, so they are now called that everywhere: the Sanity document type, the queries and cache tags, the components, the headings key, the Studio, the glossary and the specs. Nothing changes for a visitor.

## Decided by a human in this session

- The name: "Testimonials", applied across the whole setup rather than as a label over old names.
- Its own pull request, after the desk change.

## Generated

- Schema: `lookbookEntry` is `testimonial`, in `schemas/testimonial.ts`; `siteSettings.productPage.lookbookHeading` is `testimonialsHeading`. Types regenerated.
- Store: `testimonialsForProductQuery`, `getTestimonialsForProduct`, the `Testimonials` component, `headings.testimonials`, and the cache tag `sanity:testimonial`. The publish webhook derives its tags from the document type, so it follows without a change.
- Studio: the desk item reads "Testimonials" with a speech-bubble icon.
- `CONTEXT.md` defines the term and lists "lookbook entry" under the words to avoid. It used to list "testimonial" there; this pull request reverses that on purpose.
- `packages/sanity/scripts/migrate-testimonials.ts`: a document's type cannot change in place, so each entry is copied under `testimonial-<old id>`. Two phases, both dry runs unless `--write` is passed, both safe to re-run.

## Rollout

1. Done: `copy --write` created 12 testimonials next to the 12 old entries, each with consent and photo. The live site still reads the old ones and is unaffected.
2. Merge and let production deploy. It then reads the new documents.
3. Afterwards: `pnpm --filter @repo/sanity migrate-testimonials cleanup --write` deletes the old entries. It refuses to run if any entry has no copy.

## Assumptions

- No document references an entry, no entry has a draft, and no custom heading was set. The script checks the first, handles the other two, and the dry run confirmed all three.
- If the Sanity webhook's own filter lists document types by name, it needs `testimonial` added in Sanity's settings. The route in this repo needs nothing.

## Verified

- `pnpm verify` green: 12 tasks.
- Playwright: 36 passed with no snapshot change, including the home and cart shots whose favourites row is ranked by these documents.
- On a local production build, the tote bag page shows "What people say about it" with three quotes, read from the new documents.
- No mention of the old word is left in code, docs or specs.

## Deferred

- The cleanup phase, after the merge.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #24 — E13: accept or reject a product idea in the Studio

`epic/E13-idea-review` · merged 2026-09-19

## Summary

The last slice of E13. An editor decides a product idea with two buttons in the Studio, Accept and Reject, and a Sanity Function finishes the decision: it stamps the date and moves the search gaps behind the idea. This replaces the status radio field as the way to decide.

## Decided by a human in this session

- Build the review on stable Studio document actions and a plain Sanity Function, not on Sanity Workflows.
- The Product ideas folder holds Open, Accepted and Rejected lists.

## Why not Sanity Workflows

The spec planned this slice on Sanity Workflows (early access). Reading the packages before building showed that a workflow with effects needs a runtime of three more Functions, and the README of the release evaluated (0.33.0) calls that runtime "experimental, and not ready for production use". It also needs exact-pinned packages and a dependency override in the Studio. Document actions and Functions are stable and give an editor the same two buttons. ADR 0004 and `specs/callout.md` record this.

## Generated

- `apps/studio/actions/idea-decision.tsx`: `Accept` and `Reject`, registered for `productIdea` only. Reject opens a dialog with a required reason. Ideas are written as published documents, so the actions patch the document directly with the editor's session. Both are disabled once an idea is decided. Delete stays available.
- `productIdea.status` and `rejectionReason` are read only in the form, so the buttons are the only way to decide.
- `apps/functions/idea-decided` and its Blueprint entry: fires when an idea's status changes to accepted or rejected, then calls `applyDecision` from `@repo/demand`. Its own write leaves the status alone, so it cannot trigger itself.
- `applyDecision` is now idempotent on the decision date rather than on the status, because the status is already set when the Function runs.
- `@sanity/ui` declared in the Studio's dependencies for the dialog; it was already installed through `sanity`.
- README and ADR 0004 updated. The spec, `decisions.md`, `callout.md` and the diagram were updated on `main` and arrive through a merge of `main`.

## Assumptions

- The Function uses the client Sanity gives it by default. The real run below shows that is enough to write, so the `demand-robot` token from the spec is not needed and is not created.

## Verified

- `pnpm verify` green: 12 tasks. 7 tests in `apps/functions`, 45 in `packages/demand`.
- Deployed for real. Setting the seeded "Umbrella" idea to accepted, exactly as the action does, invoked `idea-decided` within about two seconds: the log reads "accepted: applied", `decidedAt` was stamped and all three umbrella gaps became `promoted`. The idea and its gaps were then reset to proposed and reviewed, so the buttons can be tried on the Studio preview.
- Not checked by me: the buttons and the reject dialog in a browser, because the Studio needs a login. The Studio preview is the place to try them.

## Deferred

- The `@workflow/vitest` integration test for the analysis lock, as before.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #25 — E08: product ideas first under Demand signals, and a Tailwind shorthand on the hero

`epic/E08-desk-ideas-first` · merged 2026-09-19

## Summary

Two small changes. Under "Demand signals" in the Studio's desk, the Product ideas folder now comes first, above Search gaps and All gaps. On the home page, the hero uses Tailwind's bare aspect-ratio classes.

## Decided by a human in this session

- Product ideas is the first item of the section.
- The hero's `aspect-[4/3]` and `md:aspect-[2/1]` become `aspect-4/3` and `md:aspect-2/1`. This edit was made by a human; it is committed here unchanged.

## Generated

One block moved in `apps/studio/structure.ts`, and the comment above the desk says why: ideas are where an editor has something to decide, the gap lists are for reading.

## Verified

- Studio lint, typecheck and build green. Store lint and build green.
- The built stylesheet holds both classes with the same ratios as before, and the four home-page visual tests pass without a snapshot change, so the hero renders identically.
- Not checked in a browser by me: the desk, because the Studio needs a login. The Studio preview shows it.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #26 — E13: integration test for the analysis lock

`epic/E13-lock-integration-test` · merged 2026-09-19

## Summary

The one test from E13's plan that was still deferred: the analysis workflow's lock, exercised against the real workflow compiler and an in-process runtime through `@workflow/vitest`.

## Decided by a human in this session

- Do this test before starting the Presentation work.

## Generated

- `workflows/analyse-demand.integration.test.ts`: run A starts and is caught in its settle sleep, which means it holds the lock. Run B must return `{ skipped: 'running', heldBy: <A> }`. A is cancelled, and run C must reach its own sleep, which proves the lock was released.
- `vitest.integration.config.mts` and a `test:integration` script. The unit config excludes `*.integration.test.ts`, so `pnpm verify` is unchanged, as the spec asks.
- `@workflow/vitest` as a dev dependency of the store. The two folders it writes are ignored by git and ESLint. README gains the command.

## Assumptions

- Hermetic by construction: every run is cancelled while asleep, so no step executes and nothing reaches Sanity or a model. The config also blanks the write token and the secret.

## Verified

- The test passes in about 2 seconds.
- It can fail: with the conflict check in the workflow temporarily disabled, the test went red (the second run slept instead of returning skipped). Restored, it passes again.
- `pnpm verify` green: 12 tasks. The first run failed in the store build and the rerun passed; the build also passes alone. That is the known race between the build and the typecheck's route generation, both writing to `.next`, not something this change introduced.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #27 — E17: live editing with the Presentation tool

`epic/E17-presentation` · merged 2026-09-19

## Summary

E17: live editing with Sanity's Presentation tool, in four commits, one per slice. An editor opens the store inside the Studio, clicks text or a photo and lands on its field, and sees an edit in the page as it is typed. A visitor gets the same pages, cache and JavaScript as before.

Slice 1 must be live in production before Presentation works outside a developer's machine, because the Studio frames the production store.

## Slice 0: the three answers

1. **`draftMode().isEnabled` inside the cached `sanityFetch`.** Builds; the route table equals `main` plus the draft-mode routes; a request with the draft cookie gets drafts with stega; a request without it stays prerendered with no stega, also after draft requests. Later, in slice 3, the same check turned out to fail for `router.refresh()`; see "Deviation from the spec".
2. **Framing.** The production-built store loads inside Presentation from `http://localhost:3333` with only `frame-ancestors` changed. The draft cookie survives same-site (`localhost:3000`) and cross-site (`127.0.0.1:3000`, the `Partitioned` path). No `connect-src` change and no Sanity CORS origin for the store: the overlay talks to the Studio by `postMessage`. `https://www.sanity.io` is needed: the dashboard page iframes `https://vercel-swag-studio.vercel.app/`, and a browser checks every ancestor.
3. **What stega breaks.** Nothing in the Playwright specs or axe (home, a product page with testimonials and questions, checkout). Stega reaches machine readers in the root metadata (description, Open Graph and Twitter descriptions, `og:site_name`, default title) and in the `alt` of Sanity images. JSON-LD, the Open Graph images and the sitemap use no Sanity text. `apiId`, `_id`, URLs, dates and `lqip` are not encoded.

## Decided by a human in this session

- Image `alt` keeps its stega in draft mode instead of being cleaned and replaced by `data-sanity`: the overlay uses it to make a photo clickable, axe passes, and a visitor never receives stega.
- The footer renders `siteSettings.footerText`, which was queried but never shown. The shipped words are the fallback, so a visitor's text is identical.
- A hero photo was uploaded to `homePage`, so the hero photo is clickable.

## Deviation from the spec

The draft branch sits **outside** the cached function. With the check inside `"use cache"`, a full page load in draft mode returned the draft, but `router.refresh()` in draft mode was answered with cached, published content (Next 16.3.5), so an edit never showed until a reload. `sanityFetch` now checks `isEnabled` first and calls the token client uncached, otherwise the same cached function as before. The route table is unchanged. ADR 0005 records it. Proposed for the spec on `main`: reword the "What changes" paragraph and slice 1's `fetch.ts` bullet accordingly.

Also beyond the spec: `next-sanity` 13's overlay ignores a `mutation` by default, so `components/draft-visual-editing.tsx` passes a `refresh` that calls `router.refresh()`.

## Generated

- Store: `lib/sanity/draft-client.ts`, the branch in `lib/sanity/fetch.ts`, `getSiteSettingsForMetadata` (`stega: false`), `/api/draft-mode/enable` and `/disable`, `lib/safe-redirect.ts`, `components/draft-mode.tsx`, `draft-mode-bar.tsx`, `draft-visual-editing.tsx`, `parseStudioOrigins` and `frame-ancestors` in `lib/security-headers.ts`, the two env vars in `lib/env.ts`, the footer text.
- Studio: `presentationTool` with `SANITY_STUDIO_PREVIEW_ORIGIN`, and `presentation/resolve.ts` with `locations` and `mainDocuments`. `locations` is one resolver function, because a question's products are found by who references it, which `select` cannot follow; this adds `rxjs` to the Studio, a package `sanity` already depends on. The mirrored product slug is a plain string, so the filters use `slug == $slug`.
- Tests: Vitest for `sanityFetch` (four cases), the enable route (404 without the token), the disable route and `sameOriginPath` (absolute, protocol-relative and backslash targets), `parseStudioOrigins` (wildcard, path, injection) and the env; Playwright `e2e/draft-mode.spec.ts`.
- Docs: README "Live editing", ADR 0005, AGENTS.md rule 3 and the Sanity cache row.

## Assumptions

- Scope is everything Sanity owns and the store renders, as the spec lists it.
- `studioUrl` for stega is the first origin in `PRESENTATION_STUDIO_ORIGINS`; it only matters outside Presentation.

## Verified

- `pnpm verify` passes with the token unset; the enable route then answers 404.
- Route table equals `main` plus `/api/draft-mode/enable` and `/api/draft-mode/disable`.
- Visitor HTML and RSC payload: no zero-width characters, no overlay, no token; metadata is clean in draft mode too.
- Locally in Presentation against a production build: `/` opens `homePage`, `/products/minimal-black-backpack` opens its product with "Used on one page"; clicking the hero headline opens `hero.headline`; typing " Live." showed in the page without publishing; the draft was discarded afterwards. The testimonial and question location queries were run against the dataset.
- Not done: the testimonial edit on a product page, and Lighthouse on production. Both need this merged and live.

## Notes

- `PRESENTATION_STUDIO_ORIGINS` is read at build time, so setting it on Vercel needs a redeploy. It is not set yet.
- `/opengraph-image` showed as static in some local builds and dynamic in others, on this branch and independent of these changes (three bisects did not find a cause; `main` showed dynamic twice). The final verify build matches `main`.
- After a discard, the framed page kept the draft text for at least five seconds; a manual refresh in Presentation corrects it.

## Deferred

- `specs/decisions.md` and `specs/callout.md` land on `main`. Proposed: decisions gains "the store has a Viewer token, read only in draft mode" and "the Studio frames production only"; callout gains the `router.refresh()` finding and the dashboard-origin finding. The spec's "Set up by hand" CORS line can go.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #28 — E17: pass PRESENTATION_STUDIO_ORIGINS through Turborepo

`epic/E17-turbo-env` · merged 2026-09-19

## Summary

After PR #27 production still sent `frame-ancestors 'none'`, so Presentation could not frame the store ("Framing ... violates ... frame-ancestors 'none'" in the Studio's console).

The variable is set on Vercel, but Turborepo runs tasks in strict env mode and `PRESENTATION_STUDIO_ORIGINS` was not in the `build` allow-list in `turbo.json`, so `next.config.ts` never saw it. `SANITY_API_READ_TOKEN` was unaffected because `SANITY_*` is already listed. This adds the variable to `build` and `dev`.

## Verified

`PRESENTATION_STUDIO_ORIGINS=... pnpm turbo run build --filter=store` now writes `frame-ancestors 'self'` plus the three origins into `.next/routes-manifest.json`. The E17 spikes missed this because they ran `next build` directly.

## Notes

Adding the variable to the allow-list also puts it in the build's cache key, so changing it on Vercel rebuilds instead of restoring a cached build.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #29 — Rich text: avoid a one-word last line

`fix/rich-text-pretty` · merged 2026-09-20

## Summary

A care sentence ended with a lone "it." on its own line. Rich text paragraphs now use `text-pretty` (`text-wrap: pretty`), which the store already uses on card names and testimonial quotes. Browsers without support wrap as before.

## Verified

Computed `text-wrap-style` is `pretty` on the care paragraph of `/products/black-crewneck-t-shirt`; at 375px the last line reads "print, never over it.". The home and product visual snapshots pass unchanged.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #30 — E18: product listing with category pages and a price sort (slice 1)

`epic/E18-product-listing` · merged 2026-09-20

## Summary

Slice 1 of `specs/E18-product-listing.md`: a place to browse the whole catalogue.

- `/products` shows every product the API returns; `/products/category/<slug>` shows one category, one prerendered page per category from `generateStaticParams`. No listing page reads `searchParams`, `cookies()` or `headers()`.
- The category filter is a row of link chips ("All" plus one per category). It works without JavaScript and scrolls sideways on a phone, where a small client leaf brings the current chip into view.
- A price sort ("Default", "Price: low to high", "Price: high to low") re-orders the server-rendered cards in the DOM. It is component state, not URL state, and the control only exists after hydration.
- Header: "Products" between Home and Search, current on the listing and its category pages; a magnifying glass before "Search". The home page's "View all" and the product page's breadcrumb category now point at the listing.
- Sitemap lists `/products` and every category page.

Slice 2 (the category intro from Sanity) follows on a new branch after this merges.

## Decided by a human

Route `/products`; categories as path segments, not a search param; search left untouched; render everything, no pagination; a price sort and no price-range filter; the sort applied in the browser; chips as links; `/products/category/<slug>`; filtering the one cached catalogue in memory; 404 for unknown and the empty state for empty categories; the header entry and the magnifying glass; a `listing` grid variant; the term "Product listing" in `CONTEXT.md`.

## Generated

All code, tests and the spec text. Judgement calls made while building, each now stated in the spec:

- The count sits on the sort's row, so the row has its height before hydration and the select arriving shifts nothing.
- With three links the header was 2px too wide at 320px, so below `sm` "Search" shows the glyph alone; the label stays its accessible name.
- `chip-row.tsx`: one effect that scrolls the chip row to the current chip. Without it `/products/category/hats` opened on a phone with "Hats" out of sight.
- `categoryPath(slug)` holds the one `as Route` cast: with two dynamic routes under `/products`, typed routes cannot place a template string whose slug is a plain `string`.
- The breadcrumb repoint was not discussed in the design session. It follows from the old `improvements.md` entry "Category browsing route", which this epic replaces; say if it should go back to search.

## Assumptions relied on

- `product.category` always equals a slug from `/categories` (it does for the whole current catalogue).
- The API's order is an acceptable default order.

## Verified

- `pnpm verify` passes. Build output lists `/products` and all category slugs as prerendered paths; like every page they show as partial prerenders because of the header's cart badge.
- New `e2e/listing.spec.ts` (6 tests) passes against the production build: whole catalogue and count, chip navigation and current markers, 404 for an unknown category, both sort directions and "Default" restoring the order, entry points from the header and home, and with JavaScript disabled the chips navigate and no sort control exists.
- Full Playwright suite passes. The home and cart visual snapshots were regenerated: the header changed, and the People's favourites row had drifted from its baseline because the testimonials in the dataset changed since it was taken.
- Screenshots checked at 320, 390 and 1280 in both themes; no horizontal overflow of the page or the header.

Not verified: the empty-category state. Every category the API lists holds products, so that branch has not rendered against real data; its criterion stays unticked.

## Deferred

- Slice 2: category intro (schema, read, render, Presentation, seed).
- A visual-regression snapshot of the listing.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #31 — E18: category intro from Sanity on the product listing (slice 2)

`epic/E18-category-intro` · merged 2026-09-20

## Summary

Slice 2 of `specs/E18-product-listing.md`. Stacked on #30: the base is that PR's branch, and GitHub retargets this one to `main` once #30 merges.

- The `category` document gains one editorial field, `intro` (text, at most 200 characters), in a new default group "Listing page". The mirrored fields stay read only.
- A category's listing shows the intro under its heading and uses it as the meta description. Without one, the page is exactly slice 1 and the description is the generated sentence. `/products` has no intro.
- The read goes through `sanityFetch` with the tags `sanity:category` and `sanity:category-<slug>`; the second is the document's `_id`, which is what the publish webhook already expires. Metadata is read without stega.
- Presentation: `/products/category/:slug` names the category document as the page's main document, and a category document shows its listing page as its location.
- **Sync fix.** `scripts/sync.ts` wrote categories with `createOrReplace`, which would have wiped an editor's intro on every run. It now creates or patches, as it already did for products.
- Seed: one placeholder intro per category, written with `setIfMissing`.

The API has no category description to mirror or fall back to: a category is `slug`, `name` and `productCount`, in the OpenAPI spec and in the live response.

## Decided by a human

One optional plain-text intro of about 200 characters that doubles as the meta description; no intro on `/products`; the term "Category intro" and the rewritten "Category document" entry in `CONTEXT.md`; render without the paragraph when Sanity has nothing; Presentation location and click-to-edit; generated placeholder copy in the seed.

## Generated

All code and tests, and the thirteen intros in `packages/sanity/scripts/category-intros.ts`. **The intros are generated placeholder copy for you to edit.**

## Changed outside the code

The thirteen intros were written to the production dataset with `setIfMissing`, by a one-off script that used `queueCategoryIntros`; the full seed was not run. Production ignores the field until this merges. Until it does, do not run `pnpm --filter @repo/sanity sync` from `main`: the old sync replaces the category documents and drops the intros. Re-running the seed from this branch restores them.

## Verified

- `pnpm verify` passes, including five new tests in `packages/sanity` (which gains a `test` script and `vitest`): the sync never replaces a document and never writes an editorial field; the seed uses `setIfMissing`, skips a category without copy, and every intro fits the 200-character limit.
- Against a production build: `/products/category/hats` renders the intro under the heading and as `<meta name="description">`; a visitor's HTML carries no stega characters; the listing e2e still passes.
- The no-intro path was seen for real: a build cached before the intros existed rendered the slice 1 page with the generated description.

Not verified:

- Click-to-edit and the Presentation location. No Sanity read token is set locally, which switches draft mode's client off, and the Studio change needs a deployed Studio. The intro uses the same draft-aware fetch as product enrichment.
- A publish reaching the page through the webhook. The tags match the webhook's (`sanity:category`, `sanity:<_id>`), but no publish was made.

## Notes

Next's build cache keeps `"use cache"` entries across local builds. A `null` cached before the intros were written survived a rebuild until `apps/store/.next/cache` was removed. Vercel is not affected the same way once the webhook fires, but a preview built before the dataset write may show no intros until its cache entry expires or a category is republished.

## Deferred

- A unit test for the location resolvers; the Studio has no test runner.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #32 — E18: align the Search label, chip row chevrons, two-column listing on phones

`fix/E18-nav-and-chip-cues` · merged 2026-09-20

## Summary

Three follow-ups to the product listing, all reported from the live site.

- **Header alignment.** The word "Search" sat a few pixels above "Home" and "Products". The glyph and label were wrapped in an `inline-flex` span, which takes its baseline from the SVG. The glyph is now an inline element nudged onto the text, so all three words share one baseline.
- **Chip row cues.** While the category chips scroll sideways, a chevron shows on each side that hides chips, and pressing it scrolls that way. It is a pointer affordance only: out of tab order and hidden from assistive technology, because the chips are links a keyboard already reaches. It is a solid patch in the canvas colour, not a fade, because the design uses no gradients. The row's native scrollbar is hidden. Without JavaScript there are no chevrons and the row still scrolls.
- **Two columns below md.** The listing showed one column of row cards on narrow screens, which left half of each row empty and made the whole catalogue a long scroll. It now shows two columns of grid cards. `ProductCard` gains a `shape` prop (`responsive`, the default, or `card`), set by the grid variant; home, search and favourites are unchanged.

## Verified

- Measured in Chromium at 1280px: the text boxes of the three nav words have the same top and bottom to within 0.1px.
- Screenshots at 390px: on `/products` only the right chevron shows; on `/products/category/hats` both show, around the centred current chip.
- Screenshots of the two-column grid at 320px and 420px: no horizontal overflow, names wrap within their column, the price pill fits on the photo.
- `pnpm verify` passes. Listing, home, search and visual e2e pass with unchanged snapshots.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #33 — Comments: audit and cleanup across the repo

`chore/comment-cleanup` · merged 2026-09-20

## Summary

Executes `.scratch/comment-cleanup/spec.md`: a comment-only pass over every tracked code and config file, plus one deleted migration script and one new convention in `AGENTS.md`.

The target the audit set: a doc block says what the symbol is in one sentence, then only the constraint a reader cannot see from the code. Present tense, positive statements, no story.

Seven commits, one per area, so the diff can be read area by area.

- **Stale statements.** Shipped epics written in the future tense, pointers to a CI workflow that is not committed, "see the E04 PR", a hard-coded count of 28 products, and two observations of live API data. The cart API's latency was stated as three different numbers in three files; it is now stated once, beside `CART_TIMEOUT_MS`, and named from the other two.
- **History and narrative.** The incident reports are gone and their constraints stayed: the font read that threw ENOENT, the 2.5 GB deploy upload, the `router.refresh()` cache finding, the generated select that imported a dependency the repo does not carry.
- **Negatives.** Descriptions by exclusion became statements of what the code does. Contract negatives stayed: "never cached", "never logged", "never `NEXT_PUBLIC_`", "Never `createOrReplace`", "no wildcards".
- **Epic tags and pointers.** No bare tag remains. Thirteen spec paths survive, one per file, each in a block that leans on that spec. Every `specs/callout.md` and `specs/improvements.md` pointer is out of the code. `docs/adr/` pointers and `(CONTEXT.md)` markers are untouched.
- **Duplicated facts.** Each now lives at its definition and is named from the other sites: the quantity rule, the cart cache policy, `lqip`, the dotted-id rule. The `preload` note and the icon-drawing note were each in two files and are now in neither.
- **Long blocks.** The walkthroughs are cut to their opening sentence plus the real constraints. The failure-mode list in `lib/api/client.ts` is kept in full, as the audit asked.

## What was decided by a human

Markus wrote the audit and the plan in `.scratch/comment-cleanup/spec.md`, including the standard, the per-file targets and the execution order. The spec says to take its recommended option for every item under "Decisions for Markus" until told otherwise, so this PR does: bare tags deleted, `specs/callout.md` pointers removed from code, rejected-alternative notes deleted rather than kept, `migrate-testimonials.ts` deleted, and the line-budget rule added to `AGENTS.md`.

## What I generated

Every rewritten comment. Five agents worked disjoint directories in parallel against the spec; I applied the stale-statement pass myself and reviewed each area's diff before committing it.

## Numbers

Counted over the same scope as the audit: tracked code and config files, excluding `packages/sanity/src/generated/`, `specs/`, `docs/` and markdown.

| Measure | Before | After |
|---|---|---|
| Comment lines | 2,111 | 1,886 |
| Bare epic tags | 121 | 0 |
| `specs/callout.md` and `specs/improvements.md` pointers | 19 | 0 |
| "deliberately" / "on purpose" | 15 | 1 |
| "simply" / "actually" / "really" | 7 | 0 |
| Comment lines over 80 columns | 115 | 83 |
| Lint or TypeScript suppressions | 0 | 0 |

The audit expected about 1,100 lines. I did not get there, and I do not think it is reachable under the same spec's rule that no information a maintainer needs may be removed. Thirty doc blocks still run over six lines. I read each one: they are the four-way `CountSources` contract, the two `curl` examples in the revalidation routes, the draft client's token and stega constraints, the seeded-cart setup in the visual suite, and the `lib/api/client.ts` failure-mode list the audit explicitly protects. Each has the reason the new `AGENTS.md` rule asks for. Cutting further would mean deleting constraints.

The "over 80 columns" row is also softer than it looks. Most of the 83 are single-line `/** ... */` doc comments in the 81 to 100 range, which is the repo's prevailing idiom; prettier is not installed in the workspace and code lines exceed 80 in the same files. I wrapped everything over 110 and the five formatting defects the audit named, and left the idiom alone.

## Code changes, and the ones I skipped

Three, each named as an allowed exception in the spec:

- `packages/sanity/scripts/migrate-testimonials.ts` deleted with its `package.json` script. The migration has run: `lookbookEntry` survives only as a retired term in `CONTEXT.md`, and nothing imports the script.
- Three test titles absorbed what their comment said, so the epic tag could go: the Studio-origins wildcard test, the `frame-ancestors` describe block, and the search test that checks the miss is recorded. No test logic changed.
- Two JSX `{/* */}` comments lost their epic tags.

**Skipped:** the shared e2e helper for the duplicated "hidden copy" note. The audit lists three call sites. Only two are the same fact; the third, in `search.spec.ts`, is about the no-JS case and a different mechanism, and a fourth site in `visual.spec.ts` does the same scoping with no note at all. A helper would have meant a new file, two imports, a moved constant and a changed return shape. The note now lives once in `product.spec.ts` and `cart.spec.ts` names it.

**Skipped:** naming the promo box heights as constants. They already are constants: they are the Tailwind `min-h-*` classes in `RESERVED_BOX`. Only the prose needed fixing.

## Deferred

Three rejected-alternative notes were deleted from the code and no ADR was written, as the spec instructs. Their original wording, for whoever writes them:

1. `lib/api/schemas.ts` — "`z.looseObject` was rejected: its index signature makes every inferred type accept any key and breaks `Omit`, see the PR."
2. `apps/studio/actions/idea-decision.tsx` — "Sanity Workflows was evaluated for this and left out: its runtime is marked experimental by its own documentation (specs/callout.md)."
3. `components/search/search-transition.tsx` — "`useFormStatus` cannot do this job: with `next/form` and a string `action`, submitting is a client navigation that no form action ever sees, and the debounced path does not submit the form at all." One sentence of this stayed in the code, because the alternative is the obvious one and someone will try it. The dropped half is the debounced-path clause.

## Where the audit was off

- Section 7 lists `packages/sanity`'s queries file as the second home of the `lqip` note. Both copies were in `apps/store/lib/sanity/`.
- Section 2 places `category-intros.ts` under `packages/demand/src/`. It is in `packages/sanity/scripts/`.
- Section 7 lists the cart cache policy and the quantity rule as appearing in `app/cart/actions.ts`. The quantity rule was there; the cache statement was not.
- Section 1 catches the CI claims in `playwright.config.ts`, `visual.spec.ts` and `lint-staged.config.mjs` but misses two more: `draft-mode.spec.ts` and a second line in `visual.spec.ts`. Both fixed.
- `product-grid.tsx` opened "The two shapes a product grid takes" and then described four. That belonged in section 1, not section 6. `search-results.tsx` carried a hard-coded "the Hats category holds three products", the same defect as the 28 in `lib/listing.ts`. Both fixed.
- One deletion I reversed. The spec's "Keep" column for `draft-care.ts` excluded the paragraph saying the care copy is cautious because the API describes how a product looks, not what it is made of. It is the only thing stopping someone adding a material or temperature claim the API never made. I kept one sentence of it.

## Verified

- `pnpm verify` passes: 13 tasks, lint, typecheck, build and unit tests.
- Build output still shows the shells as partial prerenders; no route moved to dynamic.
- Every changed line in the diff was checked against `^[+-]\s*(//|/\*|\*|#)`. The only non-comment lines are the ones listed under "Code changes" above.

## #34 — Conventions: state the comment standard in AGENTS.md

`chore/comment-convention` · merged 2026-09-20

## Summary

Follow-up to #33. That PR added the comment rule as a single Conventions bullet. This gives it its own section, so the standard the cleanup applied is the one the next doc block gets written to.

The nine rules are the ones from `.scratch/comment-cleanup/spec.md`, unchanged in substance. Two things the bullet could not carry are now explicit: where a rejected alternative goes, and which files in this repo to copy.

`CLAUDE.md` is a single `@AGENTS.md` include, so this reaches Claude Code, Cursor and Copilot alike.

## What was decided by a human

Markus asked for the rule to be written down after merging #33. The content is his audit's standard.

## Verified

Documentation only. No code changed.

## #35 — E19: a stock count and a promotion that hold still

`epic/E19-stable-visit` · merged 2026-09-20

## Summary

E19 slice 1: every visitor gets a stock count and a promotion that hold still. The API redraws both on every request, so the store asks once per visitor and keeps the answers in an httpOnly `visit` cookie for 24 hours. Every number still comes from the API; what the store adds is the memory.

Visible result: a product's stock is the same on every reload, the quantity selector's limit is one the add respects, the banner keeps its discount code for the whole visit, and the footer can throw both away and draw again.

The cart does not yet enforce the draw and grids do not yet badge; those are slices 2 and 3.

## Decided by a human before this session

- A per-visitor "artificial store" rather than leaving stock alone: the point to make in the assessment is that a store without stock management is not really a store.
- The promotion is folded into the same mechanism, because the promotions endpoint has the same defect.
- A reset control for demonstrating a restock.

## Decided while building

- **`stockStatus` takes a count, not the API's `StockInfo`.** The spec put `remaining` and `availability` in `lib/visit/remaining.ts`; they went into the existing `lib/stock-status.ts` instead, which was already the home of `StockStatus`. One module, not two.
- **The low-stock threshold is a named constant of 5**, measured in the spike: the API's own `lowStock` is true for 1 to 5 and false at 0 and 6 up, over 400 samples with no overlap.
- **Availability follows the draw alone, never the cart.** A cart holding every last one is still a product in stock, so the Offer says `InStock` while the page says "All 4 are in your cart".
- **The seed says whether the visit covers the catalogue**, and the client tops it up when it does not. The spec asked for this; without it a visit that predates a new product would read "Stock unavailable" until it expired. The catalogue read is cached, so it costs no API call.
- **Counts are clamped to `CART_MAX_QUANTITY` when written.** A count the cookie's schema would reject makes the whole cookie unreadable on the next request, which would lose the visit rather than one number.

## Generated

- `lib/visit/visit.ts` (schema, parse, serialise with truncation), `lib/visit/cookie.ts` (request-memoized `getVisit`, `setVisit`, `clearVisit`), `lib/visit/open.ts` (the browser's two calls).
- `app/api/visit/route.ts`: `POST` draws the missing ids eight at a time and pins a promotion, `DELETE` drops the visit.
- `components/visit/visit-provider.tsx`, `visit-seed.tsx`, `reset-visit.tsx`.
- `components/product/stock-and-cart.tsx` now reads the cookie; `stock-and-cart-client.tsx` subtracts the cart; `stock-skeleton.tsx` split out so the client leaf does not import a module that reads cookies.
- `components/promo-strip.tsx` split out of `promo-banner.tsx` for the same reason.
- Cart actions answer with the touched line, so the client moves a product's remaining stock without a cart read.
- Tests: Vitest for the cookie (malformed, expired, wrong version, out-of-range, truncation), `stockStatus` across the threshold and at 0, and the route handler (partial failure, top-up, kept `drawnAt`, failed promotion, clamping, delete). Playwright: `e2e/visit.ts` seeds the cookie, and the specs gained an out-of-stock case, a stability-across-reloads case, an all-in-cart case and a reset case.
- Docs: `docs/adr/0006-the-stable-visit.md`, the AGENTS.md cache rows and rule 1, five terms in CONTEXT.md.

## Measured

| | |
|---|---|
| Cookie for the 28-product catalogue | 1 125 bytes |
| Full draw at concurrency 8 | about 1.05 s, no failures, no rate limiting |
| `POST /api/visit` per session | one, plus one per reset |
| Cross-origin requests from the browser | none |

## Verified

- `pnpm verify` passes.
- The build marks every page ◐, exactly as on `main`. The route table gains `/api/visit` and nothing else.
- The static HTML of a product page contains no stock line and no promo code, so the shells are still shells.
- 30 functional Playwright tests pass with **no skips**; the three "no featured product is in stock on this request" skips are gone.
- The 16 visual snapshots were regenerated: the footer gained the reset control, and the promo strip and stock line are now shot rather than masked, because a seeded visit makes them the same every run.
- Two browser contexts get their own draws; a reset re-draws both stock and promotion.

## Known, and deliberate

- A first-time visitor's Product JSON-LD omits the Offer's availability, because the visit does not exist when the page renders. A returning visitor's carries it. The store is `noindex`. Recorded in the ADR.
- The cart still accepts more than the draw. Slice 2.

## Deferred

- `specs/callout.md`, `specs/decisions.md`, `specs/E05-product-detail.md` and `specs/improvements.md` land on `main` with this slice, per the spec's Documents section and the rule that spec files do not change on an epic branch.

## #36 — Fix: checkout 500, a summary rule that never drew, and a lazy largest paint

`fix/cart-a11y-and-legacy-js` · merged 2026-09-20

## Summary

Three cart fixes, one of them a production outage that E19 introduced.

## 1. Checkout answered 500 on every click

**The visit cookie carried JSON, and a promotion's text carries a per-cent sign.** The API's `BUNDLE10` promotion reads "save 10% automatically". A bare `%` in a cookie value makes the percent decoding in the request path throw `URIError: URI malformed`, which fails the whole Server Action. Every Checkout click answered 500 and `/cart` fell back to the error boundary.

It only bit when the action wrote the cookie back, which `placeOrder` always does, so reads looked fine and the page rendered normally right up to the click.

The cookie now carries base64url. Its alphabet is `A-Z a-z 0-9 - _`, which no encoding or decoding step alters, so no promotion text can ever break it again.

Found by reproducing against production and reading `vercel logs`; fixed and re-checked locally against the same promotion text. A unit test now pins it: a visit whose promotion says "Save 10% automatically." round-trips, and the written value matches `/^[A-Za-z0-9_-]+$/`.

## 2. A serious accessibility failure, and a rule that never drew

axe rejects the Summary's description list: it may contain only `dt`, `dd`, `div`, `script` and `template`, and `Separator` puts a `separator` role inside one. This was the only failure in Lighthouse's new agentic browsing category and cost 3 points of accessibility.

While fixing it I found the separator **drew nothing at all**. Its `data-horizontal:h-px` classes compile to `[data-horizontal]`, and Base UI writes `data-orientation="horizontal"`, so the variant never matched and the element was zero pixels tall while still consuming a flex gap. A plain `div` replaces it and renders the rule the design intended. That one pixel is the whole content of the four regenerated cart snapshots.

`components/ui/separator.tsx` is now unused. Its variants are wrong for Base UI wherever it is next used; worth fixing at the source or deleting.

## 3. The cart's largest paint was lazy-loaded

The first line's photo is the page's largest element and carried `loading="lazy"`, so 2,579 ms of the 2,786 ms mobile paint was delay before the request even started. It now loads eagerly with a preload, and the rest of the page stays lazy.

## Not fixed: legacy JavaScript

Lighthouse flags 14 KiB of polyfills for `Array.prototype.at`, `flat`, `flatMap`, `Object.fromEntries`, `Object.hasOwn` and the string trim methods. **This is not ours and browserslist does not control it.** Next's own default browserslist is already `["chrome 111", "edge 111", "firefox 111", "safari 16.4"]`, so setting it changes nothing; I measured identical bundles before and after and reverted the change. The code is `@next/polyfill-module`, which Next injects on every build, and no documented option removes it.

`https://vercel.com/home` ships the identical module, byte for byte:

```
"trimStart"in String.prototype||(String.prototype.trimStart=String.prototype.trimLeft),"trimEnd"in String.prototype||…
```

Worth a sentence in the callout: the audit fires on every Next.js site, and removing it means aliasing a framework internal away.

## Verified

- `pnpm verify` passes: 374 store tests, up from 371.
- 54 Playwright tests pass.
- axe reports no violations on `/cart` with a line, in light and dark. The earlier clean run missed this because it ran on an empty cart, where the Summary does not render.
- The first cart photo is `eager` with an image preload; the four favourites stay `lazy`.

## #37 — Fix: cart lines no longer wait for the favourites row

`fix/cart-favourites-boundary` · merged 2026-09-20

## Summary

The cart page showed its skeleton until the favourites row was ready too, because the row rendered inside the same Suspense boundary as the lines. It now has its own boundary, and its ranking read has one cache entry instead of one per exclusion count.

## What was measured first

Production, one item in a throwaway cart:

| Request | Time |
|---|---|
| Static shell | 0.04 to 0.17 s |
| `/cart` without a cart cookie (favourites only) | 0.48 to 0.66 s |
| API `GET /cart` alone | 1.3 to 2.1 s |
| `/cart` with the cart cookie | 1.7 to 2.6 s |

The cart API is the floor and this PR does not change it. The favourites row added 0.3 to 0.5 s on top in the warm case, and a Sanity query plus the paged catalogue read on a cold cache.

## Changes

1. **Own boundary.** `Favourites` sits in its own `<Suspense>` inside `CartContents`, with a skeleton that mirrors the row (section spacing, heading, four cards with their button), so the footer does not jump. The row still arrives after the lines, because it needs the cart's items to know what to leave out.
2. **One cache entry for the ranking.** `getFavouriteProducts` took `4 + exclude.length` as its limit, and since E19 `exclude` also holds the visitor's sold-out products, so the cached Sanity read had a different key for almost every visitor. The query is now unsliced (it only returns products that a testimonial names) and `FavouriteProducts` slices after filtering. The home page and every cart share the entry.

## Generated

All of it. The generated `sanity.types.ts` changes only in the query comment; the result type is the same. I edited that line by hand rather than running typegen.

## Verified

- `pnpm verify` passes; `/cart` is still `◐` with the shell prerendered.
- `next start` locally against the real API, streaming `/cart` with a cart cookie: on a cold cache the lines arrived at 1.67 s and the favourites at 2.04 s, where before both would have arrived at 2.04 s; warm, both at 1.57 s.
- Not checked in a browser: the skeleton's match to the real row at each width.

## Deferred

Nothing.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #38 — Fix: the build task sees ALLOW_INDEXING

`fix/allow-indexing-turbo-env` · merged 2026-09-20

## Summary

`ALLOW_INDEXING=true` is the documented switch that leaves `X-Robots-Tag: noindex` out for a Lighthouse SEO run (`docs/lighthouse.md`). Through turbo it did nothing: the variable was not declared for the `build` task, so turbo kept it out of the task's environment and out of the cache key.

## Change

`turbo.json`: `ALLOW_INDEXING` joins the `build` task's `env`.

## Verified

Before: `ALLOW_INDEXING=true pnpm turbo run build --filter=store` was a cache hit and `routes-manifest.json` still carried the header.
After: the same command is a cache miss and the header is gone; without the variable it is a miss again and the header is back.

## Generated

All of it.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #39 — Fix: declare CATALOG_REVALIDATE_SECRET for turbo

`fix/turbo-env-catalog-secret` · merged 2026-09-20

## Summary

Vercel's build warns that `CATALOG_REVALIDATE_SECRET` is set on the project and missing from `turbo.json`. It is the only variable the store reads that neither an entry nor a wildcard there covered.

## Change

`turbo.json`: the variable joins `env` for `build` and `dev`.

The secret is only read at request time, in `app/api/revalidate/catalog/route.ts`, and Vercel gives functions their environment directly, so production was not broken. Under `turbo dev` the route could not see it.

## Verified

`turbo run build --dry` parses the file. Not verified: that the warning is gone, which only the next Vercel build shows.

## Generated

All of it.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #40 — Fix: cart hydration error on a first visit, and a search description in the head

`fix/cart-hydration-and-search-description` · merged 2026-09-20

## Summary

Two findings from a Lighthouse run on production: a console error on `/cart` (best practices 96) and "no meta description" on `/search?q=pen` (SEO).

## 1. React error 418 on the cart page

**A first-time visitor could get a hydration error.** With no `visit` cookie the server renders the cart without any stock draws. The client opens the visit at once, and that answer (about 1 s) beats the cart boundary, which waits 1.3 to 2.8 s for the cart API. When the boundary then hydrates, the provider already holds draws the server never saw. If one of them changes markup, a sold-out badge on a favourites card for instance, the first client render does not match the server's HTML and React throws.

It is intermittent, because it needs a draw that changes markup. Reproduced on production by loading `/cart` without a visit cookie and answering `POST /api/visit` with every draw at 0.

**Fix.** `lib/use-hydrated.ts` is false on the server and while hydrating. `useProductStock`, `CartView` and `PromoStrip` ignore what the provider holds until it is true, so the first client render repeats the server's HTML, and the held values apply in the render right after. A component that mounts on the client, after a client-side navigation, gets the held values at once as before.

A new e2e test does what the reproduction did. It fails on a build without the fix with the same error 418, and passes with it.

## 2. Search: the description was in the body

`generateMetadata` on `/search` awaits `searchParams`, so Next streams the page's metadata, and streamed tags land in the body. Lighthouse reads `head meta` only. The description does not depend on the query, so the page now renders it in the static shell, where React moves it into the head, and `generateMetadata` leaves it out so there is one tag. The per-query title and the `noindex` on results are unchanged. The copy is search-specific ("Search the store by name and narrow the results by category.") where the page inherited the store's default before.

Lighthouse's `meta-description` audit: 0 on production, 1 on this build.

## Not changed: `noindex` on the cart

Lighthouse's SEO score on `/cart` is 66 because `is-crawlable` fails, and it fails because the page says `noindex`, which is right for a cart. The audit exists to catch a page that is blocked by accident. Same for `/checkout`. Worth a sentence in `docs/lighthouse.md`.

## Generated

All of it.

## Verified

- `pnpm verify` passes; `/cart` and `/search` are still `◐`.
- The new e2e test, red without the fix and green with it.
- Served HTML of `/search?q=pen`: one description, in the head.
- Not run: the rest of the e2e suite.

## Deferred

Nothing.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #41 — Fix: search has an Open Graph description in the head

`fix/search-og-description` · merged 2026-09-21

## Summary

A check of the social sharing tags against the brief (the brief: "Include Open Graph metadata (`openGraph`) for social sharing") found one gap. Every page carried `og:description` except `/search`.

## The gap

`generateMetadata` on `/search` awaits `searchParams`, so Next streams its metadata into the body. The page therefore sets `description: null` and renders `<meta name="description">` in the static shell, where React moves it into the head. Setting the description to `null` also dropped `og:description`, and the root's Open Graph block has none to inherit.

**Fix.** The shell renders `<meta property="og:description">` next to the description tag, with the same copy. One line, plus the doc block that explains the pair. Twitter reads `og:description` when it has no `twitter:description`, so no third tag.

## Checked and unchanged

Fetched from production as `facebookexternalhit/1.1`, for `/`, `/products`, `/search`, a product page and `/cart`:

- Every page has `og:title`, `og:type`, `og:site_name`, `og:locale`, `og:image` with width, height, type and alt, and `twitter:card = summary_large_image`.
- The product page adds `og:url`, its own description and its own card. The card answers 200 `image/png`, 1200 by 630, with the photo, the name and the price.
- The card shows the price and never stock: stock is a per-visitor draw (`docs/adr/0006-the-stable-visit.md`) and the card is one cached image.

## Generated

All of it.

## Verified

- `pnpm verify` passes; `/search` is still `◐`.
- Prerendered `search.html`: `description` and `og:description` are both in the head, once each.
- Not run: the e2e suite, and no third-party card debugger.

## Deferred

A per-product alt text on the product card. It needs `generateImageMetadata`, which changes the image URL.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #42 — Fix: the Studio no longer offers actions that break the store

`fix/studio-guard-rails` · merged 2026-09-21

## Summary

Three findings from running the `sanity-best-practices` skill over the schemas and the Studio. Each one stops an editor from breaking something the store relies on. No data migration, no new dependency.

## 1. Pages that exist once

`homePage`, `checkoutPage` and `siteSettings` offered Duplicate, Delete and Unpublish. The store reads each by a fixed id, so a duplicate is an orphan and a deleted or unpublished `siteSettings` drops the store to its fallbacks. `guardActions` in `apps/studio/actions/guard-rails.ts` removes the three; Publish, Discard changes and the rest stay. It is a deny-list, so actions Sanity adds later still appear.

## 2. Product and category mirrors

A duplicated mirror carries the same `apiId` under a random id. The sync never touches it, and a testimonial or an FAQ can point at it. Duplicate is removed. Delete is offered only when the sync has set `missing: true`, which is the one case where an editor should be able to tidy up. The wrapper calls the stock action on every render and then hides the result, because the stock action uses hooks.

## 3. Testimonials

`quote` and `products` were optional; `min(1)` passes on a field that is not set. An entry with consent ticked and nothing else could publish. Both are now required. `photo` stays optional: the store renders an entry without one.

Typegen runs with `--enforce-required-fields`, so `quote` is `string` and `products` is non-optional in `sanity.types.ts`. The store's `entry.quote ?` checks stay, since a draft can still be invalid.

## Decided by a human

Which three of the ten findings to do.

## Generated

All of it.

## Verified

- `pnpm verify` passes, including the Studio build.
- The production dataset: 12 testimonials, none fails the new validation.
- Not verified: the action menus in a running Studio. It needs a login. To check: open Site settings and a product, and look at the menu beside Publish.

## Deferred

The other seven findings, listed in the scratch issue.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #43 — Fix: Studio forms, lists and previews are easier to work in

`fix/studio-editor-polish` · merged 2026-09-21

## Summary

The other seven findings from the `sanity-best-practices` review. Stacked on #42; GitHub retargets it to `main` when that merges. No data migration, no new plugin.

## What changed

1. **Icons on the types.** Every document type sets `icon`, so global search, reference pickers and the create menu show it. `structure.ts` drops its copies: plain type lists inherit the icon, and the singleton and demand list items read it from the schema through `typeIcon`. `@sanity/icons` becomes a dependency of `packages/sanity`; the Studio already had it.
2. **Product thumbnails.** The product preview selected the API photo's URL and never used it. It now returns it as `media`. The Studio draws a thumbnail by itself only for a Sanity asset, and this is a URL, so the schema returns an `<img>` and `product.ts` becomes `product.tsx`. `react` joins the package as a peer and dev dependency.
3. **Consent in the favourites count.** `favouriteProductsQuery` counted every testimonial; `testimonialsForProductQuery` takes only `consent == true`. Validation is Studio-only, so an API-written entry without consent could lift a product into the favourites row while staying off its page. Both now apply the filter. All 12 entries in production have consent, so the row does not change today.
4. **Site settings tabs.** Field groups: SEO and sharing, Header and footer, Product page. Layout only; the data is unchanged. `imageField` takes an optional `group`.
5. **Length warnings.** The default title warns past 60 characters and the default description past 160, as named constants. Warnings, so publishing still works.
6. **Orderings and a list to work from.** Products sort by name, price and last synced; categories by name. The desk gains "Products to enrich": mirrors still in the API with no extended description. A GROQ filter, no stored flag.
7. **Typegen config.** The settings move from the deprecated `sanity-typegen.json` into `sanity.cli.ts`. Types still regenerate only through `pnpm typegen`.

## Decided by a human

Each of the seven, one by one: icons on the types with the desk's copies dropped; thumbnails; the plain consent filter, no shared fragment; three tabs on Site settings only; warnings at 60 and 160, the category intro untouched; the full set of sorts plus the "to enrich" list; the typegen move with no auto-generation.

## Generated

All of it.

## Verified

- `pnpm verify` passes.
- `sanity.types.ts` is byte-identical before and after the typegen move, and the deprecation warning is gone.
- In a local Studio: product thumbnails, inherited icons, the "Products to enrich" list, the three tabs on Site settings. Site settings offers no Duplicate, Delete or Unpublish, and a product offers only Publish, which also covers the unverified item in #42. No console errors.
- Not checked: the length warnings with an over-long value, and Delete appearing on a mirror marked `missing`. Both need a write to the dataset.

## Deferred

Nothing from the review.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #44 — Feat: the sharing card is the hero, and an uploaded sharing image wins

`feat/hero-sharing-card` · merged 2026-09-21

## Summary

The store's sharing card was the triangle and the store name on black. It is now the home page's hero: the photo full-bleed, the headline over it, the logo and store name at the top. It is also the card of every page without its own, which is every page except a product.

## The sharing image now works

Site settings has a "Sharing image" field, and the root layout passed it to `openGraph.images`. Next gives a file-based `opengraph-image` priority over metadata set in code, so with `app/opengraph-image.tsx` present that entry never reached the page. The field is empty in production, so nobody saw it fail.

The image route now draws it: an uploaded sharing image fills the whole card, cropped to 1200 by 630 around the editor's hotspot, with nothing laid over it. The metadata entry is removed, so there is one place that decides.

## How it picks

`sharingCard` in `lib/sharing-card.ts`, with tests:

1. A sharing image in Site settings: that image, alone.
2. Otherwise the hero's photo and headline from the `homePage` document.
3. Without a hero photo, `public/hero.jpg`, read from disk as a data URI and added to `outputFileTracingIncludes`. Without a headline, `HERO_FALLBACK`.

## Rules kept

- Reads go through `lib/sanity/content.ts` and `lib/api/store.ts`, all cached. `/opengraph-image` is still `○`, and publishing the home page or Site settings refreshes it through the existing tags.
- `getHomePageForMetadata` reads without stega, like the other metadata reads, so draft mode puts no invisible characters into the image.
- Sanity is asked for a JPEG: the renderer sends no `Accept` header and reads no WebP.

## Decided by a human

Use the hero for the card, and let the uploaded sharing image win.

## Generated

All of it, including the layout of the card.

## Verified

- `pnpm verify` passes; four new unit tests.
- Rendered and looked at all three paths in a dev server: the Sanity hero, the bundled photo, and an upload. For the upload the hero asset stood in for a sharing image, through a temporary edit that is not in the commit.
- Not verified: a real upload in Site settings on a deployment, and the refresh after publishing.

## Deferred

The card's alt text stays the static "Vercel Swag Store". The editor's alt text needs `generateImageMetadata`, which changes the image URL.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #45 — Fix: Studio forms, lists and previews are easier to work in

`fix/studio-editor-polish-main` · merged 2026-09-21

## Summary

Re-lands #43 on `main`. #43 was stacked on #42 and merged 41 seconds after it, while its base was still `fix/studio-guard-rails`, so its squash commit went into that branch and never reached `main`. This is that commit, cherry-picked onto `main` with no conflicts and no other change. The description, the decisions and the verification are in #43.

## Verified

- `pnpm verify` passes on this branch.
- `pnpm typegen` leaves `sanity.types.ts` unchanged, so the generated types match the schemas on `main`.

## Deferred

Nothing.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #46 — Fix: the sharing card is prerendered on every build

`fix/sharing-card-static` · merged 2026-09-21

## Summary

After #44 the store's sharing card was rendered on every request in production: `/opengraph-image` answered in 0.9 to 2.4 s with a cache miss each time. Locally the build listed the route as `○` or `ƒ` from one run to the next.

## Cause

During a prerender, Cache Components lets cached reads resolve and treats work that is still pending outside a cache as dynamic. The card did three things outside a cache: it read the font file, the image renderer downloaded the Sanity photo by URL, and it encoded the PNG. Whether those were still pending depended on load. A plain `next build` came out static three times; the full pipeline, with lint, typecheck and tests running beside the build, came out dynamic two times out of three.

The download was also a fetch outside `lib/` with no cache policy, which the repo's rules do not allow.

## Fix

- `renderCard` in `app/opengraph-image.tsx` is one `"use cache"` function that returns the PNG as base64: photo, font and encoding all happen inside it. It takes plain values, so the photo URL and the words key the entry. `cacheTag('sanity')`, `cacheLife('content')`, so a publish refreshes it as before.
- `sanityImageDataUri` in `lib/sanity/image-data.ts` is the cached download.
- The route awaits cached reads only, then returns the bytes.

The Sanity reads stay outside `renderCard`, because `sanityFetch` checks draft mode and a request API cannot run inside a cache.

## Generated

All of it.

## Verified

- The full store pipeline five times in a row: `○ /opengraph-image` every time.
- The prerendered PNG is byte-identical to the card approved in #44.
- `pnpm verify` passes.
- To check after deploy: the second request to `/opengraph-image` on production should be a cache hit and fast.

## Deferred

`/products/[slug]/opengraph-image` is `ƒ` and always was: it has no `generateStaticParams`, and its renderer downloads the API photo the same way. It is rendered once per product per deployment and then served from Vercel's cache, so it is left alone here.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #47 — E20: content for AI crawlers

`epic/E20-ai-crawlers` · merged 2026-09-21

## Summary

Structured data on every catalogue page, a Markdown version of each at its address plus `.md`, and an `llms.txt` that lists them. The store stays noindex, so this demonstrates the technique and asks for nothing: `robots.txt` now also asks AI crawlers by name to stay out, because they ignore the noindex header. Spec: `specs/E20-ai-crawlers.md`.

## What a reviewer can try

```bash
curl -s https://<host>/llms.txt
curl -s https://<host>/products/black-canvas-tote-bag.md
curl -sI https://<host>/products/black-canvas-tote-bag.md   # text/markdown, canonical, noindex
curl -s https://<host>/robots.txt
```

## Decided by a human

In a grilling session on 21 Sep: the store stays noindex and this is a demonstration; one epic, one PR; no theme switcher and no visible Markdown control; a `.md` suffix, no content negotiation; home, all products, categories and products get a version; the structured data table with `FAQPage` in and `Review` out; `brand: Vercel` and no organisation, seller or publisher; testimonials as quotes without photos; `llms.txt` only; text passes through verbatim; canonical header, not in the sitemap; prerendered; published content only; AI crawlers disallowed in `robots.txt`.

## Generated

All code and tests, the wording of `llms.txt`, and the list in `lib/crawlers.ts`.

## What changed that already existed

- **The `Product` markup moved and lost `availability`.** It was rendered inside the per-visitor stock hole, with `availability` from the visitor's stock draw. A crawler has no visit, so it never saw that field anyway. It is now in the prerendered part of the page, the same for everyone, and `stockStatus` no longer returns an availability. The brand changed from "Vercel Swag Store" to "Vercel".
- **The product page reads `getProductView`** (`lib/product-view.ts`), which is what its Markdown and its JSON-LD read too. The page's output is unchanged.
- **The home page's product selection moved to `lib/home.ts`**, shared with `/index.md`.

## Assumptions from the spec

The spec lists the enrichment as "About, care, extra photos, FAQs, testimonials" and also says "in page order". The page puts testimonials first. The Markdown follows the listed order, facts before voices. The two words "page order" should go from that sentence on `main`.

## Verified

Against a production build served locally:

- Five runs of the full pipeline in a row: `/llms.txt`, `/md/home`, `/md/products` are `○`, every category and product file is `●`, and every page is listed as before.
- With AI crawler user agents and no JavaScript: 200 and `text/markdown` for each Markdown URL, `text/plain` for `llms.txt`, 404 for an unknown product and an unknown category. Every response carries `X-Robots-Tag: noindex`; each Markdown response carries its canonical `Link`.
- All 28 products, not three: every line of a product's Markdown appears in the text of its rendered page.
- No stock or promotion wording in any Markdown file or `llms.txt`; no `availability`, `Organization`, `seller` or `Review` in any JSON-LD block.
- 86 distinct internal links from `llms.txt` and the Markdown files resolve.
- The alternate link is in the head of home, listing, category and product pages, and absent from search and cart.
- schema.org validator on a product page with FAQs: 0 errors, 0 warnings for `Product`, `FAQPage`, `BreadcrumbList`.
- Google Rich Results test, code input: 3 valid items (product snippets, merchant listings, breadcrumbs), no errors. Its three optional notes are `availability`, `shippingDetails` and `hasMerchantReturnPolicy`, all left out on purpose. Google shows no FAQ rich result for ordinary sites; the markup is for other readers.
- Expiring the catalogue tags turns a Markdown file and `llms.txt` from a cache hit to a miss and back to a hit.
- `pnpm verify` passes.

Not run: the Playwright suite.

## After merge

- The Rich Results test against a production product URL.
- `X-Robots-Tag: noindex` on production. Production currently sends no such header, because `ALLOW_INDEXING` was set in the Production environment for a Lighthouse run. It has to be removed, and this merge's deployment picks that up.

## Deferred

Nothing from the spec.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #48 — Fix: the draft-mode exit redirected off the store

`fix/draft-mode-open-redirect` · merged 2026-09-21

## Summary

An open redirect in `/api/draft-mode/disable`, found in the pre-submission audit and reproduced on production:

```
GET /api/draft-mode/disable?redirect=/.//example.com
-> 307  location: https://example.com/
```

The route is the "Exit" link on the draft preview bar. It clears the draft-mode cookie and returns the editor to the page they were on, taken from `?redirect=`. It is a public GET, so anyone can hand-craft the parameter; `sameOriginPath` is what constrains it.

## The bug

`sameOriginPath` checked the raw string for a leading `//`, then returned the parsed `url.pathname`. Parsing drops dot segments, so `/.//host`, `/..//host/x` and `/a/..//host` all passed the check and came back as `//host`. The route's `new URL(path, origin)` reads that as protocol-relative and leaves the store.

## The fix

The check runs on the parsed path, and a `//` anywhere in it goes to the home page. It has to be the parsed path: browsers strip tabs and newlines while parsing, so `/./<tab>/host` has no `//` in the raw string and still parses to `//host`. Only the pathname is checked; a query may hold a full URL and is kept.

## Decided by a human

- Reject `//` anywhere in the path, not only at the front. No store route has one, and the rule is easier to state and to trust.

## Generated

- The change to `lib/safe-redirect.ts` and its doc block.
- Tests, written first: six failed before the fix.
  - `lib/safe-redirect.test.ts`: the three dot-segment spellings, tab and newline variants, the tab that only becomes `//` after parsing, a deeper `//`, a check that the result never leaves the origin, and that `//` in a query survives.
  - `app/api/draft-mode/disable/route.test.ts`: the three spellings redirect home.

## Verified

- Store unit suite passes (415 at the first fix; the helper and route tests re-run after the stricter rule, 29 passing), lint and typecheck clean.
- Not re-probed against a running server; the route test calls the real handler with the same requests.

## After merge

Expect the store's own origin in `location`:

```
curl -sI "https://vercel-swag-store-ms.vercel.app/api/draft-mode/disable?redirect=/.//example.com" | grep -i location
```

## Deferred

The rest of the audit's findings; none are in this PR.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #49 — E21: the first visit renders stock and the promotion on the server

`epic/E21-first-visit` · merged 2026-09-21

## Summary

A visitor without a `visit` cookie now gets the product page's stock line, quantity input and Add to Cart, and the promotion under the header, in the HTML stream. Before, they arrived after JavaScript had hydrated and `POST /api/visit` had drawn the catalogue. The number a visitor reads never changes on the page, and it is the number the visit keeps. Spec: `specs/E21-first-visit.md`. Decision record: `docs/adr/0006-the-stable-visit.md`, amended.

First of two PRs. The second holds the badge fade and the `noscript` notice.

| Buy panel visible, slow 4G and 4x CPU, local production build | Before | After |
|---|---|---|
| First visit, median of 5 | 3.04 s | 1.02 s |
| Return visit, median of 5 | 0.99 s | 0.99 s |

The promotion strip moved from about 3.0 s to about 0.8 s on every page.

## What a reviewer can try

In a private window, open a product page. The stock line and the button arrive with the page. Reload: the number is the same. Open the footer's "Reset the demo" to do it again.

```bash
curl -s https://<host>/products/<slug> | grep -o 'Add to Cart\|In stock\|Only [0-9]* left\|Out of stock' | head -3
```

## Decided by a human

In a grilling session on 21 Sep: the server path for the product page's stock and for the promotion, no inline head script, grid badges stay on the client visit; a number that was shown never changes on the page; a hand-back that fails may lead to a different number on the next load; the route keeps a handed-back value only where the visit holds nothing, checks every value, and reads a body from a JSON request only; live API calls for crawlers and link previews are accepted; the marker attribute over a path check; the server's 2 s deadline below the browser's 5 s wait; a late opening draw is discarded; "opening draw" as the glossary term; amend ADR 0006 in place; two PRs; the speed target and the filmstrip.

## Generated

All code and tests, the spec's wording, the ADR amendment and the glossary entry.

## What changed that already existed

- **`POST /api/visit` takes input.** An optional JSON body with at most one product's draw and one promotion (`lib/visit/hand-back.ts`). Its doc comment still holds: a cross-site form cannot send JSON.
- **The provider holds the open call** while the static HTML carries `data-opening-draw`, until the stock hole reports. A reset and a top-up do not wait.
- **`drawFor` opens a visit for an add with no visit**, holding the number the form showed. A quantity change on the cart page still opens none.
- **Add to Cart waits for an open call in flight.** Not in the grill: without it, an add clicked in the first second would open a one-product visit whose cookie races the full one, and the rest of the grid would be drawn again.
- **Firefox joins the Playwright config** for `first-visit.spec.ts` only.

## Assumptions from the spec

None beyond it. Two sentences of the spec were corrected on `main` after the build showed they were wrong: a browser without JavaScript never reveals a streamed hole, so the buy panel is in its HTML and stays hidden; and WebKit cannot run against a local build, because it obeys `upgrade-insecure-requests` on localhost and refuses the `Secure` cookie.

## Verified

Against a production build served locally:

- The cookie-less response of a product page holds the stock line, the quantity input and the button; every route's response holds the promotion.
- The number in the first HTML, after the visit opens and after a reload is one number, 5 of 5 runs each in Chromium and Firefox. The check records every state of the buy panel from the first byte, so a skeleton flicker would fail it too. The promotion likewise.
- A product opened by client-side navigation while the open call is held for 2 s shows one number.
- Route: the visit wins over a hand-back; an out-of-range, fractional, negative, unknown-product or malformed draw is dropped and drawn fresh; an unparseable, inactive or oversized promotion is dropped; a non-JSON request is not read; broken JSON still opens a visit.
- Build output marks every page `◐` as before.
- `pnpm verify` passes. Playwright: 55 pass; the 8 visual snapshots of home and cart fail on `main` too, from testimonial content drift.

Not verified: Safari, and streaming on Vercel. Both are the check below.

## After merge

Nothing. Before merge, by hand on the preview in a private window, in Chrome and in Safari: open a product page, note the stock line, reload once. The number must be the same. If it differs, this does not merge.

## Deferred

The badge fade and the `noscript` notice are the second PR. The callout entry with the finished `StockAndCart` as its snippet lands on `main` after this merges.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #50 — E21: grid badges fade in, and a browser without JavaScript gets a notice

`epic/E21-fade-and-noscript` · merged 2026-09-21

## Summary

Two small pieces of `specs/E21-first-visit.md` that do not depend on the server path in #49. A grid badge fades in when it appears, and a browser without JavaScript gets one notice, no skeleton left on screen and no empty promotion bar. Branched from `main`, not stacked on #49.

## What a reviewer can try

Open the home page in a private window and watch the "Only N left" and "Out of stock" badges arrive. Then turn JavaScript off in the browser's developer tools and reload any page.

## Decided by a human

In a grilling session on 21 Sep: badges may arrive later and fade in gently, about 200 ms, nothing with reduced motion; a store without JavaScript is allowed to be less than fully functional but has to fall back nicely, with this wording: "Thank you for your visit. Unfortunately not all functionality can be served to your browser if Javascript is not enabled."

## Generated

The code, the tests, and the `--animate-fade-in` token.

## What changed that already existed

- **`CardStock` carries the fade.** A label that changes keeps its element, so an add does not replay it.
- **The root layout renders `NoScriptNotice`** under the promotion strip. Its one style rule hides every `data-slot="skeleton"` and every box marked `data-needs-script`.
- **The promotion strip's reserved box is marked `data-needs-script`.** Its hole is never revealed without a script, and an empty accent bar says nothing. Asked for by Markus after the first review.

## Assumptions from the spec

The spec first said a badge on a return visit does not animate. Every badge arrives after hydration, on a return visit too, because the grids are part of the shell. The sentence was corrected on `main`: the fade plays whenever a badge appears.

## Verified

Against a production build served locally:

- With JavaScript disabled, home, all products, search, cart and a product page show the notice and no visible skeleton; home, all products, search and cart also show no promotion bar. A screenshot of a product page confirms the notice sits directly under the header. With JavaScript there is no notice.
- The badge's computed animation is `fade-in 0.2s`, and `none` with reduced motion.
- Build output marks every page `◐` as before. `pnpm verify` passes.

Not run: the full Playwright suite on this branch. Its 8 home and cart snapshots fail on `main` from testimonial content drift.

## After merge

Nothing.

## Deferred

Nothing from the spec.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #51 — E22: the cart opens on intent, and Add to Cart does not wait for the save

`epic/E22-add-to-cart-wait` · merged 2026-09-21

## Summary

Add to Cart felt slow: the button spun for about 6 s on a first add and about 3 s on every later one. Almost all of that is the cart API, which takes 2.5 to 3 s per call, and a first add makes two: create the cart, then write the line. This PR creates the cart when the visitor shows intent, and takes the wait off the button. Spec: `specs/E22-add-to-cart-wait.md`.

| Local production build, live API, 3 runs each | Before | After |
|---|---|---|
| Button usable again after a click | 5.9 to 6.4 s first add, 2.8 to 3.8 s later adds | 0.02 to 0.04 s |
| First add saved, pointer rested on the form for 3.5 s first | 5.9 to 6.4 s | 2.8 to 2.9 s |
| First add saved, clicked the moment the pointer arrived | 5.9 to 6.4 s | 5.4 to 6.4 s |
| Later add saved | 2.8 to 3.8 s | 2.8 s |

"Before" was measured on production on 21 Sep and matches the E16 table in `callout.md`.

## What a reviewer can try

On a product page, move the pointer over the buy panel, wait a moment, then click Add to Cart three times quickly. The header badge and the stock line follow every click at once, the button never locks, and "View cart" becomes a link when the last save has landed.

## Decided by a human

On 21 Sep, after seeing the measurements: do both, open the cart ahead of the first add and stop the button waiting for the save.

## Generated

The spec, the code, the tests, and the choice of pointer and focus as the intent signal.

## What changed that already existed

- **`prepareCart()`** is a new Server Action. An action and not a route handler, because Next runs a client's actions one at a time: an add clicked while the cart is being created queues behind it and finds the cookie.
- **The form calls the action itself on submit** and no longer renders `AddingCount`. The quantities in flight live in a small module store (`lib/cart/adds-in-flight.ts`), because a save outlives the form that started it. The native form action stays for a post before hydration.
- **The button is never disabled by a save.** It reads "Added" for 1.2 s. It is disabled only when nothing remains, counting the adds in flight. Focus therefore stays on the button, which the audit had flagged.
- **A failed add's message stays** when a later add in the queue succeeds.
- The cart page's quick-add form is unchanged and still uses `AddingCount`.

## Assumptions from the spec

None.

## Verified

Against a production build served locally:

- `prepareCart` creates one cart, does nothing when one exists, and the following add writes once into it; a failure is left to the add (unit tests).
- Three quick adds of 1: stock line and badge show all three within 2 s, "View cart" is inert until the last save, and both still read 3 afterwards (new browser test).
- A page view without pointer or focus sets no cart cookie (new browser test).
- The existing tests for a full draw, a failed add and the inert "View cart" pass with the new button behaviour. Product and cart specs: all pass.
- Build output marks every page `◐` as before. `pnpm verify` passes.

Not verified: a touch device. A tap straight on the button gains nothing from the early cart, as the spec says; a tap on the quantity control first does.

## After merge

The before and after timings go into `callout.md` on `main`, which is the one unticked criterion.

## Deferred

Nothing from the spec. A visitor who hovers and never adds now holds an empty cart, so the header badge reads the cart on their later full page loads. That read streams and blocks nothing; the audit's cart count cookie would remove it.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #52 — E23: a quantity change and a removal cost one cart call

`epic/E23-cart-page-one-call` · merged 2026-09-21

## Summary

A quantity change or a removal on the cart page made two calls to the slow cart API: the write, and a read of the same cart. The read came from the action setting the cart cookie again and calling `refresh()`, either of which re-renders the cart page inside the action's response, and the page reads the cart to render its lines. The write had already answered with that cart. The two actions now return its lines and leave the cookie and the route alone. Spec: `specs/E23-cart-page-one-call.md`.

| Three runs each | Before, production | After, local production build |
|---|---|---|
| One plus click, saved (includes the 0.4 s pause) | 4.7 to 5.8 s | 3.1 to 3.6 s |
| Remove, saved | 4.5 to 4.9 s | 2.2 to 3.0 s |
| Cart calls per change, counted on the server | 2 | 1 |
| Size of the action's response | about 73 KB | 0.2 to 0.4 KB |

## What a reviewer can try

Add a product, open the cart, press plus, then Remove. The row dims for about three seconds where it dimmed for about five. Reload: the cart is as you left it.

## Decided by a human

On 21 Sep: do the cart page next, from the audit's list.

## Generated

The spec, the code, the tests, and two judgment calls listed below.

## What changed that already existed

- **`updateQuantity` and `removeItem` answer with `lines`** and neither set the cookie nor refresh. Every other path still refreshes: a 404 and its re-check, an expired cart, a line above the visit's draw. `lines` holds what a row shows and never the token; a test asserts that.
- **`CartView` holds the saved lines as state**, seeded by the server's and replaced by a row's answer. A render that brings new lines still wins, which is what a quick add relies on.
- **A row confirms its line to the visit provider**, so what remains of a product follows a change made on the cart page. It did not before.
- **Two sentences in the E06 and E16 specs** were updated on `main`: actions may now carry lines.

Two judgment calls:

- **The cart cookie no longer slides with a quantity change or a removal**, only with an add. Its one day counts from the last add. A visitor who changes quantities for a day without adding loses the cookie while the API still holds the cart. The cookie cannot say how old it is, so an action cannot slide it only when due, and sliding it every time is what forced the re-render.
- **`addToCart` is unchanged.** The quick-add row under the cart needs its re-render to drop the product just added.

## Assumptions from the spec

None.

## Verified

Against a production build served locally, live API:

- One cart call per change, from a fetch hook preloaded into the server: `PATCH` for the plus click, `DELETE` for the removal, no `GET`.
- The existing cart tests pass unchanged: add, change, remove and reload; rapid clicks saving once; the draw's cap; the hydration case; the cross-sell row; the quick add.
- New browser test: two rows changed together keep their own saved quantities, on screen and after a reload, three runs of three.
- Removing the last line shows the empty cart at once and after a reload; the badge reads 0.
- Unit tests: the new result shape, no cookie set, no refresh, no cart read.
- Build output marks every page `◐` as before. `pnpm verify` passes. Playwright: 64 pass; the 8 home and cart snapshots fail on `main` too, from testimonial content drift.

Playwright reports these action requests as cancelled once the client has read the answer. The answer is applied every time; it only matters to a script that waits for the stream to end.

## After merge

The timings, measured again on production, go into `callout.md` on `main`. That is the one unticked criterion.

## Deferred

- A product removed from the cart returns to the favourites row on the next load, not at once, because that row is rendered with the lines of the last full render.
- The quick add still costs a write and a read.
- The badge and the seed still check the `next-action` header, which `addToCart` needs.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #53 — E22: the button spins for a second after a click

`epic/E22-button-spinner` · merged 2026-09-21

## Summary

A follow-up to #51. The Add to Cart button read "Added" for a moment after a click. It now shows its spinner and "Adding…" for about a second, as the old button did, without lasting as long as the save. Branched from `main`, independent of #52.

## What a reviewer can try

Click Add to Cart on a product page. The button spins for a second and is back. It still accepts clicks while it spins, so quick adds queue as before.

## Decided by a human

On 21 Sep, after trying #51 on production: "I actually liked the little spinner on the add to cart button, but it should just take like a second or so."

## Generated

The code and the one-sentence spec change, which is on `main`.

## What changed that already existed

- **The button's acknowledgement** is the spinner and "Adding…" for `ADDING_LABEL_MS`, 1 s. A second click restarts the second, so an earlier timer cannot cut it short.
- The two product tests that named the "Added" label name "Adding…".

## Assumptions from the spec

The button stays enabled while it spins. The spec says a save never disables it, and the request was about the spinner, not about locking the button.

## Verified

Against a production build served locally: the spinner shows 0.3 s after a click (screenshot checked) and is gone 1.2 s after it, which includes the click. The product browser tests pass, including three quick adds. `pnpm verify` passes.

## After merge

Nothing.

## Deferred

Nothing.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #54 — E24: the session store

`epic/E24-session-store` · merged 2026-09-24

## Summary

Epic E24 (`specs/E24-session-store.md`, `docs/adr/0007-the-session-store.md`). The store sets one cookie, a random session id, and keeps the visit, the cart token and a mirror of the cart in Upstash Redis under it. The cart page and the header badge read the mirror instead of the cart API, and an add still saving shows on the cart page as a "Saving…" row instead of an empty cart. Writes still go to the API first; its answer replaces the mirror.

Measured on the preview against production (old code), three fresh visitors per flow:

| Flow | Production today | This branch |
|---|---|---|
| Cart page, full load, to the first row | 1.34 to 1.74 s | 0.34 s |
| Cart page, away and back | 1.43 to 1.90 s | 0.14 to 0.71 s |
| Header badge on a full load | 1.84 to 2.31 s | 0.34 to 0.44 s |
| Open the cart 0.7 s after Add to Cart | "Your cart is empty" until 7.9 to 9.1 s, badge falls back to 0 | Saving row at 0.9 s, settled at 5.3 to 5.8 s, never empty |
| Size of an add's response | 68 KB | 0.4 KB |

The saves themselves are as slow as the API makes them (one write, about 3 s). Deleted: the `visit` and `cart_token` cookies and their modules, the opening draw hand-back, the held open call and its deadlines, `POST /api/visit`, the `next-action` checks.

## What a reviewer can try

On the preview (Deployment Protection is off for previews during this PR):

1. Open a product, click Add to Cart, then the header cart icon at once. The product shows as a "Saving…" row and settles without a reload.
2. Add two different products quickly, then open the cart: two saving rows.
3. Go to the home page and back to the cart, or reload it: the lines are there at once.
4. Check out: the badge drops to 0.
5. DevTools, Application, Cookies: one cookie, `sid`, httpOnly.
6. Footer, "Reset the demo": new stock, the cart stays.

## Decided by a human

Settled in a grill on 22 Sep 2026 (`.scratch/session-store/decisions.md`, git-ignored): the cart token lives only in Redis; the mirror is trusted and re-read in `after()` on each cart view; pending lines live only in the browser; an in-memory store without the Upstash variables, and degrade (cart "unavailable", never "empty") when Redis fails; today's cookies are ignored, not adopted; one PR; the server draws a first visit; `addToCart` drops `refresh()`; lifetimes of 30 days for the id, one day for the visit, one sliding day for the cart; a test seed route behind `E2E_SEED=1`. The Upstash store `upstash-vercel-swag-store-ms` was created and connected by hand, and Deployment Protection turned off for previews.

## Generated

All code, tests and documents. Judgement calls made during the run, each with its reason in ADR 0007 or the code:

- The proxy's matcher has a `missing` condition on a valid `sid` cookie. With the proxy on every request, time to first byte for `/` was 133 to 143 ms against 39 to 46 ms on production; with the condition, only a browser's first request pays it (131 to 167 ms), and later ones measure 31 to 55 ms.
- The proxy mints no session for a request Next's `userAgent()` reports as a bot, so crawlers and link previews do not draw the whole catalogue into Redis on every request.
- Next drops a Server Action in flight when a navigation starts, and the next one then runs beside it. The browser queues its cart writes (`lib/cart/in-order.ts`), and opening a cart claims the mirror with `SET NX` (`claimCart`), so two racing opens write into one cart.
- `instrumentation-client.ts` records navigations so the cart view applies an answer that arrived after the page was requested.
- `placeOrder` is the one action that calls `refresh()`, so the layout's badge drops the cart just ordered; the re-render reads Redis, not the API. It orders the mirror without reading the API.
- The background re-read in `after()` corrects the mirror only if no action saved since the page was rendered.
- A failed promotion read is not pinned for the day; `DELETE /api/visit` answers 503 when it cannot clear the old draws.

## What changed that already existed

- ADR 0006 and ADR 0002 are marked as partly superseded by ADR 0007. `AGENTS.md` cache policy rows, `CONTEXT.md` (Cart, Pending line), `docs/static-vs-dynamic.md`, `README.md` (environment) and `specs/decisions.md` describe the session store. `specs/callout.md` gains "The session store"; its E19 to E21 bullets now say E24 replaced the hand-back. These are spec files changed on the epic branch, because the run was asked to record the measurements; the E24 spec itself only has boxes ticked.
- "View cart" after an add is a live link at once (E22 kept it inert until the save landed), because the cart page now shows the saving row.
- The favourites row on the cart page hides a card the visitor adds, instead of re-rendering to slide the next favourite in.
- Every cart action answers with the saved lines, failures included when they know the cart.
- The eight home and cart visual snapshots were regenerated; the differences are in the favourites row, which the testimonials in Sanity decide.

## Assumptions from the spec

The spec's store contract, adjusted where the code needed more: `claimCart` added; `loadCart()` answers the mirror without its token; keys are `swag:sess:<sid>:visit` and `swag:sess:<sid>:cart`; the proxy runs only for requests without a valid id; `placeOrder` refreshes. Proposed spec changes for `main` after the merge: restate the proxy line (spec line 19), the key names, the `refresh()` exception and `claimCart`.

## Verified

- `pnpm verify`: 13 of 13 tasks; 493 store unit tests with coverage above the threshold. The build still marks `/`, `/cart`, `/products/[slug]` and `/search` as partial prerenders, with `ƒ Proxy (Middleware)` added.
- Playwright on the memory adapter: 75 passed (71 chromium, 4 firefox), including new tests for the saving row, two quick adds, a reload, the favourites quick add and the badge after checkout.
- The CDN path on a preview: the `sid` cookie reaches the browser on `/` and product pages even when the shell is a CDN hit, and the Suspense hole reads the same id in the same response. A request with the cookie gets no `Set-Cookie`; a malformed id is replaced; a Googlebot request gets none.
- Cart API calls counted on a local build with a fetch hook: one per add, quantity change and removal; none for the badge or the cart page render, plus the one background re-read after a cart view. Action responses 81 to 772 bytes.
- Redis unreachable (`KV_REST_API_URL=http://127.0.0.1:9`): pages render with the API's stock, the cart says it could not be loaded, and Add to Cart asks the visitor to try again.
- `GET`, `POST` and `DELETE /api/test/session` answer 404 on the preview.

## After merge

- Turn Deployment Protection for previews back on.
- Measure production with the same script (`scratchpad/measure/measure.mjs`), add the production figures to the callout, and tick the last two boxes of the spec.
- Update the E24 spec on `main` with the proposed changes above.
- Check Upstash usage in the Vercel dashboard after a day of traffic.

## Deferred

- After four quick adds from the favourites row, its heading stays above an empty grid.
- A client without cookies that is not a known bot (`curl`, an uptime check) still opens a session on every request.
- A route handler does not see the id the proxy mints in the same request (a TODO in Next's `request-store.js`); pages do. Only a caller without a cookie is affected.
- The old `visit` and `cart_token` cookies are left to expire in browsers that hold them.

https://claude.ai/code/session_01CSXtY9ATgQCfhdAzo8ShH3

## #55 — Fix: Bump the actions group with 4 updates

`dependabot/github_actions/actions-21c9d3a71e` · closed

Bumps the actions group with 4 updates: [actions/checkout](https://github.com/actions/checkout), [pnpm/action-setup](https://github.com/pnpm/action-setup), [actions/setup-node](https://github.com/actions/setup-node) and [actions/upload-artifact](https://github.com/actions/upload-artifact).

Updates `actions/checkout` from 4 to 7
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/actions/checkout/releases">actions/checkout's releases</a>.</em></p>
<blockquote>
<h2>v7.0.0</h2>
<h2>What's Changed</h2>
<ul>
<li>block checking out fork pr for pull_request_target and workflow_run by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2454">actions/checkout#2454</a></li>
<li>Bump actions/publish-immutable-action from 0.0.3 to 0.0.4 in the minor-actions-dependencies group across 1 directory by <a href="https://github.com/dependabot"><code>@​dependabot</code></a>[bot] in <a href="https://redirect.github.com/actions/checkout/pull/2458">actions/checkout#2458</a></li>
<li>Bump flatted from 3.3.1 to 3.4.2 by <a href="https://github.com/dependabot"><code>@​dependabot</code></a>[bot] in <a href="https://redirect.github.com/actions/checkout/pull/2460">actions/checkout#2460</a></li>
<li>Bump js-yaml from 4.1.0 to 4.2.0 by <a href="https://github.com/dependabot"><code>@​dependabot</code></a>[bot] in <a href="https://redirect.github.com/actions/checkout/pull/2461">actions/checkout#2461</a></li>
<li>Bump <code>@​actions/core</code> and <code>@​actions/tool-cache</code> and Remove uuid by <a href="https://github.com/dependabot"><code>@​dependabot</code></a>[bot] in <a href="https://redirect.github.com/actions/checkout/pull/2459">actions/checkout#2459</a></li>
<li>upgrade module to esm and update dependencies by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2463">actions/checkout#2463</a></li>
<li>Bump the minor-npm-dependencies group across 1 directory with 3 updates by <a href="https://github.com/dependabot"><code>@​dependabot</code></a>[bot] in <a href="https://redirect.github.com/actions/checkout/pull/2462">actions/checkout#2462</a></li>
<li>getting ready for checkout v7 release by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2464">actions/checkout#2464</a></li>
<li>update error wording by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2467">actions/checkout#2467</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> made their first contribution in <a href="https://redirect.github.com/actions/checkout/pull/2454">actions/checkout#2454</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/checkout/compare/v6.0.3...v7.0.0">https://github.com/actions/checkout/compare/v6.0.3...v7.0.0</a></p>
<h2>v6.1.0</h2>
<h2>What's Changed</h2>
<ul>
<li><strong>[BREAKING]</strong> backport <code>allow-unsafe-pr-checkout</code> to v6 by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2500">actions/checkout#2500</a></li>
<li>backport fixes to releases-v6 by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2527">actions/checkout#2527</a></li>
</ul>
<p><a href="https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/">https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/</a> for more details about this breaking change</p>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/checkout/compare/v6.0.3...v6.1.0">https://github.com/actions/checkout/compare/v6.0.3...v6.1.0</a></p>
<h2>v6.0.3</h2>
<h2>What's Changed</h2>
<ul>
<li>Update changelog by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2357">actions/checkout#2357</a></li>
<li>fix: expand merge commit SHA regex and add SHA-256 test cases by <a href="https://github.com/yaananth"><code>@​yaananth</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2414">actions/checkout#2414</a></li>
<li>Fix checkout init for SHA-256 repositories by <a href="https://github.com/yaananth"><code>@​yaananth</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2439">actions/checkout#2439</a></li>
<li>Update changelog for v6.0.3 by <a href="https://github.com/yaananth"><code>@​yaananth</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2446">actions/checkout#2446</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/yaananth"><code>@​yaananth</code></a> made their first contribution in <a href="https://redirect.github.com/actions/checkout/pull/2414">actions/checkout#2414</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/checkout/compare/v6...v6.0.3">https://github.com/actions/checkout/compare/v6...v6.0.3</a></p>
<h2>v6.0.2</h2>
<h2>What's Changed</h2>
<ul>
<li>Add orchestration_id to git user-agent when ACTIONS_ORCHESTRATION_ID is set by <a href="https://github.com/TingluoHuang"><code>@​TingluoHuang</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2355">actions/checkout#2355</a></li>
<li>Fix tag handling: preserve annotations and explicit fetch-tags by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2356">actions/checkout#2356</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/checkout/compare/v6.0.1...v6.0.2">https://github.com/actions/checkout/compare/v6.0.1...v6.0.2</a></p>
<h2>v6.0.1</h2>
<h2>What's Changed</h2>
<ul>
<li>Update all references from v5 and v4 to v6 by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2314">actions/checkout#2314</a></li>
<li>Add worktree support for persist-credentials includeIf by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2327">actions/checkout#2327</a></li>
<li>Clarify v6 README by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2328">actions/checkout#2328</a></li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Changelog</summary>
<p><em>Sourced from <a href="https://github.com/actions/checkout/blob/main/CHANGELOG.md">actions/checkout's changelog</a>.</em></p>
<blockquote>
<h1>Changelog</h1>
<h2>v7.0.1</h2>
<ul>
<li>Skip running unsafe pr check if input is default by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2518">actions/checkout#2518</a></li>
<li>Trim only ascii whitespace for branch by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2521">actions/checkout#2521</a></li>
<li>Escape values passed to --unset by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2530">actions/checkout#2530</a></li>
<li>Various dependency updates</li>
</ul>
<h2>v7.0.0</h2>
<ul>
<li>Block checking out fork PR for pull_request_target and workflow_run by <a href="https://github.com/aiqiaoy"><code>@​aiqiaoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2454">actions/checkout#2454</a></li>
<li>Various dependency updates</li>
</ul>
<h2>v6.0.3</h2>
<ul>
<li>Fix checkout init for SHA-256 repositories by <a href="https://github.com/yaananth"><code>@​yaananth</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2439">actions/checkout#2439</a></li>
<li>fix: expand merge commit SHA regex and add SHA-256 test cases by <a href="https://github.com/yaananth"><code>@​yaananth</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2414">actions/checkout#2414</a></li>
</ul>
<h2>v6.0.2</h2>
<ul>
<li>Fix tag handling: preserve annotations and explicit fetch-tags by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2356">actions/checkout#2356</a></li>
</ul>
<h2>v6.0.1</h2>
<ul>
<li>Add worktree support for persist-credentials includeIf by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2327">actions/checkout#2327</a></li>
</ul>
<h2>v6.0.0</h2>
<ul>
<li>Persist creds to a separate file by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2286">actions/checkout#2286</a></li>
<li>Update README to include Node.js 24 support details and requirements by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2248">actions/checkout#2248</a></li>
</ul>
<h2>v5.0.1</h2>
<ul>
<li>Port v6 cleanup to v5 by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2301">actions/checkout#2301</a></li>
</ul>
<h2>v5.0.0</h2>
<ul>
<li>Update actions checkout to use node 24 by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2226">actions/checkout#2226</a></li>
</ul>
<h2>v4.3.1</h2>
<ul>
<li>Port v6 cleanup to v4 by <a href="https://github.com/ericsciple"><code>@​ericsciple</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2305">actions/checkout#2305</a></li>
</ul>
<h2>v4.3.0</h2>
<ul>
<li>docs: update README.md by <a href="https://github.com/motss"><code>@​motss</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/1971">actions/checkout#1971</a></li>
<li>Add internal repos for checking out multiple repositories by <a href="https://github.com/mouismail"><code>@​mouismail</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/1977">actions/checkout#1977</a></li>
<li>Documentation update - add recommended permissions to Readme by <a href="https://github.com/benwells"><code>@​benwells</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2043">actions/checkout#2043</a></li>
<li>Adjust positioning of user email note and permissions heading by <a href="https://github.com/joshmgross"><code>@​joshmgross</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2044">actions/checkout#2044</a></li>
<li>Update README.md by <a href="https://github.com/nebuk89"><code>@​nebuk89</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2194">actions/checkout#2194</a></li>
<li>Update CODEOWNERS for actions by <a href="https://github.com/TingluoHuang"><code>@​TingluoHuang</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2224">actions/checkout#2224</a></li>
<li>Update package dependencies by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/2236">actions/checkout#2236</a></li>
</ul>
<h2>v4.2.2</h2>
<ul>
<li><code>url-helper.ts</code> now leverages well-known environment variables by <a href="https://github.com/jww3"><code>@​jww3</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/1941">actions/checkout#1941</a></li>
<li>Expand unit test coverage for <code>isGhes</code> by <a href="https://github.com/jww3"><code>@​jww3</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/1946">actions/checkout#1946</a></li>
</ul>
<h2>v4.2.1</h2>
<ul>
<li>Check out other refs/* by commit if provided, fall back to ref by <a href="https://github.com/orhantoy"><code>@​orhantoy</code></a> in <a href="https://redirect.github.com/actions/checkout/pull/1924">actions/checkout#1924</a></li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1"><code>3d3c42e</code></a> prep v7.0.1 release (<a href="https://redirect.github.com/actions/checkout/issues/2531">#2531</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/28802689a136bfcdb721715abd713740beecbe07"><code>2880268</code></a> escape values passed to --unset (<a href="https://redirect.github.com/actions/checkout/issues/2530">#2530</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/12cd2235efa0937479335606d7c3ac9f6c0973b1"><code>12cd223</code></a> trim only ascii whitespace for branch (<a href="https://redirect.github.com/actions/checkout/issues/2521">#2521</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/62661c4e71a304b2823ed026347b8d34c3eac541"><code>62661c4</code></a> skip running unsafe pr check if input is default (<a href="https://redirect.github.com/actions/checkout/issues/2518">#2518</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/e8d4307400f9427dba7cb98e488d6ab85f1cec5f"><code>e8d4307</code></a> Bump the minor-actions-dependencies group with 2 updates (<a href="https://redirect.github.com/actions/checkout/issues/2499">#2499</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/631c942040754b6e095e929c1677c07e10ed4f87"><code>631c942</code></a> eslint 9 (<a href="https://redirect.github.com/actions/checkout/issues/2474">#2474</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/4f1f4aec02e41874fa0262ea8ff5172d7978ad1e"><code>4f1f4ae</code></a> Bump actions/upload-artifact from 4 to 7 (<a href="https://redirect.github.com/actions/checkout/issues/2476">#2476</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/ba097532fb203f7e88c9c3c0b899b49469908a92"><code>ba09753</code></a> Bump actions/checkout from 6 to 7 (<a href="https://redirect.github.com/actions/checkout/issues/2488">#2488</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/b9e0990d219a03df7633c93f6f005a8fecbcab22"><code>b9e0990</code></a> Bump docker/login-action from 3.3.0 to 4.2.0 (<a href="https://redirect.github.com/actions/checkout/issues/2479">#2479</a>)</li>
<li><a href="https://github.com/actions/checkout/commit/e8cb398be4a550817e382abf69e4c12c76fce1f2"><code>e8cb398</code></a> Bump docker/build-push-action from 6.5.0 to 7.2.0 (<a href="https://redirect.github.com/actions/checkout/issues/2478">#2478</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/actions/checkout/compare/v4...v7">compare view</a></li>
</ul>
</details>
<br />

Updates `pnpm/action-setup` from 4 to 6
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/pnpm/action-setup/releases">pnpm/action-setup's releases</a>.</em></p>
<blockquote>
<h2>v6.0.0</h2>
<p>Added support for pnpm <a href="https://github.com/pnpm/pnpm/releases/tag/v11.0.0-rc.0">v11</a>.</p>
<h2>v5.0.0</h2>
<p>Updated the action to use Node.js 24.</p>
<h2>v4.4.0</h2>
<p>Updated the action to use Node.js 24.</p>
<h2>v4.3.0</h2>
<h2>What's Changed</h2>
<ul>
<li>docs: fix the run_install example in the Readme by <a href="https://github.com/dreyks"><code>@​dreyks</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/175">pnpm/action-setup#175</a></li>
<li>chore: remove unused <code>@types/node-fetch</code> dependency by <a href="https://github.com/silverwind"><code>@​silverwind</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/186">pnpm/action-setup#186</a></li>
<li>Clarify that package_json_file is relative to GITHUB_WORKSPACE by <a href="https://github.com/chris-martin"><code>@​chris-martin</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/184">pnpm/action-setup#184</a></li>
<li>feat: store caching by <a href="https://github.com/jrmajor"><code>@​jrmajor</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/188">pnpm/action-setup#188</a></li>
<li>refactor: remove star imports by <a href="https://github.com/KSXGitHub"><code>@​KSXGitHub</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/196">pnpm/action-setup#196</a></li>
<li>fix(ci): exclude macos by <a href="https://github.com/KSXGitHub"><code>@​KSXGitHub</code></a> in <a href="https://redirect.github.com/pnpm/action-setup/pull/197">pnpm/action-setup#197</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/dreyks"><code>@​dreyks</code></a> made their first contribution in <a href="https://redirect.github.com/pnpm/action-setup/pull/175">pnpm/action-setup#175</a></li>
<li><a href="https://github.com/silverwind"><code>@​silverwind</code></a> made their first contribution in <a href="https://redirect.github.com/pnpm/action-setup/pull/186">pnpm/action-setup#186</a></li>
<li><a href="https://github.com/chris-martin"><code>@​chris-martin</code></a> made their first contribution in <a href="https://redirect.github.com/pnpm/action-setup/pull/184">pnpm/action-setup#184</a></li>
<li><a href="https://github.com/jrmajor"><code>@​jrmajor</code></a> made their first contribution in <a href="https://redirect.github.com/pnpm/action-setup/pull/188">pnpm/action-setup#188</a></li>
<li><a href="https://github.com/Boosted-Bonobo"><code>@​Boosted-Bonobo</code></a> made their first contribution in <a href="https://redirect.github.com/pnpm/action-setup/pull/199">pnpm/action-setup#199</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/pnpm/action-setup/compare/v4.2.0...v4.3.0">https://github.com/pnpm/action-setup/compare/v4.2.0...v4.3.0</a></p>
<h2>v4.2.0</h2>
<p>When there's a <code>.npmrc</code> file at the root of the repository, pnpm will be fetched from the registry that is specified in that <code>.npmrc</code> file <a href="https://redirect.github.com/pnpm/action-setup/pull/179">#179</a></p>
<h2>v4.1.0</h2>
<p>Add support for <code>package.yaml</code> <a href="https://redirect.github.com/pnpm/action-setup/pull/156">#156</a>.</p>
</blockquote>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/pnpm/action-setup/commit/0977fd99725f1db4007ccb2928dbb4e90d06cc86"><code>0977fd9</code></a> docs: Update README to include devEngines.packageManager (<a href="https://redirect.github.com/pnpm/action-setup/issues/273">#273</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/48261aca053e825d84804e8ce05524d558249ac9"><code>48261ac</code></a> fix: update pnpm to v11.19.0 (<a href="https://redirect.github.com/pnpm/action-setup/issues/283">#283</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/75677f717d48404e86ae8ee4891543f40de175aa"><code>75677f7</code></a> ci: use pnpm 11 for <code>pr-check</code> (<a href="https://redirect.github.com/pnpm/action-setup/issues/284">#284</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/769ae71fb33e6e448a5dc92ad5da997c268eecec"><code>769ae71</code></a> refactor: introduce restore keys for cache (<a href="https://redirect.github.com/pnpm/action-setup/issues/280">#280</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/6fed91f804570c1144bfe1911c348642cb986bd4"><code>6fed91f</code></a> docs(README): point users to the successor pnpm/setup action (<a href="https://redirect.github.com/pnpm/action-setup/issues/282">#282</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/0ebf47130e4866e96fce0953f49152a61190b271"><code>0ebf471</code></a> fix: update pnpm to v11.7.0 (<a href="https://redirect.github.com/pnpm/action-setup/issues/267">#267</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/0e279bb959325dab635dd2c09392533439d90093"><code>0e279bb</code></a> fix: update pnpm to 11.1.1 (<a href="https://redirect.github.com/pnpm/action-setup/issues/248">#248</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/3e835812ef01165f4f8ae08ade56da44427ed4e0"><code>3e83581</code></a> fix: drop patchPnpmEnv so standalone+self-update works on Windows (<a href="https://redirect.github.com/pnpm/action-setup/issues/258">#258</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/551b42e879e37e74d986effdd2a1647d2b02d464"><code>551b42e</code></a> docs(README): fix <code>cache_dependency_path</code> type (<a href="https://redirect.github.com/pnpm/action-setup/issues/257">#257</a>)</li>
<li><a href="https://github.com/pnpm/action-setup/commit/739bfe42ca9233c5e6aca07c1a25a9d34aca49b0"><code>739bfe4</code></a> fix: self-update bootstrap to packageManager-pinned version (<a href="https://redirect.github.com/pnpm/action-setup/issues/233">#233</a>) (<a href="https://redirect.github.com/pnpm/action-setup/issues/256">#256</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/pnpm/action-setup/compare/v4...v6">compare view</a></li>
</ul>
</details>
<br />

Updates `actions/setup-node` from 4 to 7
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/actions/setup-node/releases">actions/setup-node's releases</a>.</em></p>
<blockquote>
<h2>v7.0.0</h2>
<h2>What's Changed</h2>
<h3>Enhancements:</h3>
<ul>
<li>Add cache-primary-key and cache-matched-key as outputs by <a href="https://github.com/gowridurgad"><code>@​gowridurgad</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1577">actions/setup-node#1577</a></li>
<li>Migrate to ESM and upgrade dependencies by <a href="https://github.com/gowridurgad"><code>@​gowridurgad</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1574">actions/setup-node#1574</a></li>
</ul>
<h3>Bug fixes:</h3>
<ul>
<li>Remove dummy NODE_AUTH_TOKEN export by <a href="https://github.com/gowridurgad"><code>@​gowridurgad</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1558">actions/setup-node#1558</a></li>
<li>Only use <code>mirrorToken</code> in <code>getManifest</code> if it's provided by <a href="https://github.com/deiga"><code>@​deiga</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1548">actions/setup-node#1548</a></li>
</ul>
<h3>Documentation updates:</h3>
<ul>
<li>Add documentation for publishing to npm with Trusted Publisher (OIDC) by <a href="https://github.com/chiranjib-swain"><code>@​chiranjib-swain</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1536">actions/setup-node#1536</a></li>
<li>docs: Update restore-only cache documentation by <a href="https://github.com/priya-kinthali"><code>@​priya-kinthali</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1550">actions/setup-node#1550</a></li>
<li>docs: Update caching recommendations to mitigate cache poisoning risks by <a href="https://github.com/chiranjib-swain"><code>@​chiranjib-swain</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1567">actions/setup-node#1567</a></li>
</ul>
<h3>Dependency update:</h3>
<ul>
<li>Upgrade <code>@​actions/cache</code> to 5.1.0, log cache write denied by <a href="https://github.com/jasongin"><code>@​jasongin</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1569">actions/setup-node#1569</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/chiranjib-swain"><code>@​chiranjib-swain</code></a> made their first contribution in <a href="https://redirect.github.com/actions/setup-node/pull/1536">actions/setup-node#1536</a></li>
<li><a href="https://github.com/deiga"><code>@​deiga</code></a> made their first contribution in <a href="https://redirect.github.com/actions/setup-node/pull/1548">actions/setup-node#1548</a></li>
<li><a href="https://github.com/jasongin"><code>@​jasongin</code></a> made their first contribution in <a href="https://redirect.github.com/actions/setup-node/pull/1569">actions/setup-node#1569</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/setup-node/compare/v6...v7.0.0">https://github.com/actions/setup-node/compare/v6...v7.0.0</a></p>
<h2>v6.5.0</h2>
<h2>What's Changed</h2>
<ul>
<li>Update <code>@​actions/cache</code> to 5.1.0 and add security overrides for undici and fast-xml-parser by <a href="https://github.com/HarithaVattikuti"><code>@​HarithaVattikuti</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1579">actions/setup-node#1579</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/setup-node/compare/v6.4.0...v6.5.0">https://github.com/actions/setup-node/compare/v6.4.0...v6.5.0</a></p>
<h2>v6.4.0</h2>
<h2>What's Changed</h2>
<h3>Dependency updates:</h3>
<ul>
<li>Upgrade <a href="https://github.com/actions"><code>@​actions</code></a> dependencies by <a href="https://github.com/Copilot"><code>@​Copilot</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1525">actions/setup-node#1525</a></li>
<li>Update Node.js versions in versions.yml and bump package to v6.4.0  by <a href="https://github.com/priya-kinthali"><code>@​priya-kinthali</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1533">actions/setup-node#1533</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/Copilot"><code>@​Copilot</code></a> made their first contribution in <a href="https://redirect.github.com/actions/setup-node/pull/1525">actions/setup-node#1525</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/setup-node/compare/v6...v6.4.0">https://github.com/actions/setup-node/compare/v6...v6.4.0</a></p>
<h2>v6.3.0</h2>
<h2>What's Changed</h2>
<h3>Enhancements:</h3>
<ul>
<li>Support parsing <code>devEngines</code> field by <a href="https://github.com/susnux"><code>@​susnux</code></a> in <a href="https://redirect.github.com/actions/setup-node/pull/1283">actions/setup-node#1283</a></li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/actions/setup-node/commit/820762786026740c76f36085b0efc47a31fe5020"><code>8207627</code></a> Migrate to ESM and upgrade dependencies (<a href="https://redirect.github.com/actions/setup-node/issues/1574">#1574</a>)</li>
<li><a href="https://github.com/actions/setup-node/commit/04be95cf3511ea51ebf9f224ddfb99cc7ab87cd4"><code>04be95c</code></a> Add cache-primary-key and cache-matched-key as outputs (<a href="https://redirect.github.com/actions/setup-node/issues/1577">#1577</a>)</li>
<li><a href="https://github.com/actions/setup-node/commit/7c2c68d20d402ed6a201ada70a81341941093140"><code>7c2c68d</code></a> docs: Update caching recommendations to mitigate cache poisoning risks (<a href="https://redirect.github.com/actions/setup-node/issues/1567">#1567</a>)</li>
<li><a href="https://github.com/actions/setup-node/commit/6a61c0375d66246de94630495909f12cf8dac84d"><code>6a61c03</code></a> Merge pull request <a href="https://redirect.github.com/actions/setup-node/issues/1569">#1569</a> from jasongin/update-actions-cache-5.1.0</li>
<li><a href="https://github.com/actions/setup-node/commit/30eb73b41ded577900c1ebf968ef95cdf8f7434f"><code>30eb73b</code></a> Resolve high-severity audit issues</li>
<li><a href="https://github.com/actions/setup-node/commit/4e1a87a501d0302f99e30e2748568adcb388d09f"><code>4e1a87a</code></a> Update dist</li>
<li><a href="https://github.com/actions/setup-node/commit/360237f0c01778d0c17291f75c56d6feae4f7574"><code>360237f</code></a> Strict equality</li>
<li><a href="https://github.com/actions/setup-node/commit/4f8aac5beb2f0854bc79651567a18c67eb0b9de3"><code>4f8aac5</code></a> Bump <code>@​actions/cache</code> to 5.1.0, log cache write denied</li>
<li><a href="https://github.com/actions/setup-node/commit/f4a67bbeca970f103397d3d2b9462cf787cd2980"><code>f4a67bb</code></a> Only use <code>mirrorToken</code> in <code>getManifest</code> if it's provided (<a href="https://redirect.github.com/actions/setup-node/issues/1548">#1548</a>)</li>
<li><a href="https://github.com/actions/setup-node/commit/0355742c943ddb13ca8a6b700f824231caa91e75"><code>0355742</code></a> Remove dummy NODE_AUTH_TOKEN export (<a href="https://redirect.github.com/actions/setup-node/issues/1558">#1558</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/actions/setup-node/compare/v4...v7">compare view</a></li>
</ul>
</details>
<br />

Updates `actions/upload-artifact` from 4 to 7
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/actions/upload-artifact/releases">actions/upload-artifact's releases</a>.</em></p>
<blockquote>
<h2>v7.0.0</h2>
<h2>v7 What's new</h2>
<h3>Direct Uploads</h3>
<p>Adds support for uploading single files directly (unzipped). Callers can set the new <code>archive</code> parameter to <code>false</code> to skip zipping the file during upload. Right now, we only support single files. The action will fail if the glob passed resolves to multiple files. The <code>name</code> parameter is also ignored with this setting. Instead, the name of the artifact will be the name of the uploaded file.</p>
<h3>ESM</h3>
<p>To support new versions of the <code>@actions/*</code> packages, we've upgraded the package to ESM.</p>
<h2>What's Changed</h2>
<ul>
<li>Add proxy integration test by <a href="https://github.com/Link"><code>@​Link</code></a>- in <a href="https://redirect.github.com/actions/upload-artifact/pull/754">actions/upload-artifact#754</a></li>
<li>Upgrade the module to ESM and bump dependencies by <a href="https://github.com/danwkennedy"><code>@​danwkennedy</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/762">actions/upload-artifact#762</a></li>
<li>Support direct file uploads by <a href="https://github.com/danwkennedy"><code>@​danwkennedy</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/764">actions/upload-artifact#764</a></li>
</ul>
<h2>New Contributors</h2>
<ul>
<li><a href="https://github.com/Link"><code>@​Link</code></a>- made their first contribution in <a href="https://redirect.github.com/actions/upload-artifact/pull/754">actions/upload-artifact#754</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/upload-artifact/compare/v6...v7.0.0">https://github.com/actions/upload-artifact/compare/v6...v7.0.0</a></p>
<h2>v6.0.0</h2>
<h2>v6 - What's new</h2>
<blockquote>
<p>[!IMPORTANT]
actions/upload-artifact@v6 now runs on Node.js 24 (<code>runs.using: node24</code>) and requires a minimum Actions Runner version of 2.327.1. If you are using self-hosted runners, ensure they are updated before upgrading.</p>
</blockquote>
<h3>Node.js 24</h3>
<p>This release updates the runtime to Node.js 24. v5 had preliminary support for Node.js 24, however this action was by default still running on Node.js 20. Now this action by default will run on Node.js 24.</p>
<h2>What's Changed</h2>
<ul>
<li>Upload Artifact Node 24 support by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/719">actions/upload-artifact#719</a></li>
<li>fix: update <code>@​actions/artifact</code> for Node.js 24 punycode deprecation by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/744">actions/upload-artifact#744</a></li>
<li>prepare release v6.0.0 for Node.js 24 support by <a href="https://github.com/salmanmkc"><code>@​salmanmkc</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/745">actions/upload-artifact#745</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/actions/upload-artifact/compare/v5.0.0...v6.0.0">https://github.com/actions/upload-artifact/compare/v5.0.0...v6.0.0</a></p>
<h2>v5.0.0</h2>
<h2>What's Changed</h2>
<p><strong>BREAKING CHANGE:</strong> this update supports Node <code>v24.x</code>. This is not a breaking change per-se but we're treating it as such.</p>
<ul>
<li>Update README.md by <a href="https://github.com/GhadimiR"><code>@​GhadimiR</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/681">actions/upload-artifact#681</a></li>
<li>Update README.md by <a href="https://github.com/nebuk89"><code>@​nebuk89</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/712">actions/upload-artifact#712</a></li>
<li>Readme: spell out the first use of GHES by <a href="https://github.com/danwkennedy"><code>@​danwkennedy</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/727">actions/upload-artifact#727</a></li>
<li>Update GHES guidance to include reference to Node 20 version by <a href="https://github.com/patrikpolyak"><code>@​patrikpolyak</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/725">actions/upload-artifact#725</a></li>
<li>Bump <code>@actions/artifact</code> to <code>v4.0.0</code></li>
<li>Prepare <code>v5.0.0</code> by <a href="https://github.com/danwkennedy"><code>@​danwkennedy</code></a> in <a href="https://redirect.github.com/actions/upload-artifact/pull/734">actions/upload-artifact#734</a></li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/actions/upload-artifact/commit/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a"><code>043fb46</code></a> Merge pull request <a href="https://redirect.github.com/actions/upload-artifact/issues/797">#797</a> from actions/yacaovsnc/update-dependency</li>
<li><a href="https://github.com/actions/upload-artifact/commit/634250c1388765ea7ed0f053e636f1f399000b94"><code>634250c</code></a> Include changes in typespec/ts-http-runtime 0.3.5</li>
<li><a href="https://github.com/actions/upload-artifact/commit/e454baaac2be505c9450e11b8f3215c6fc023ce8"><code>e454baa</code></a> Readme: bump all the example versions to v7 (<a href="https://redirect.github.com/actions/upload-artifact/issues/796">#796</a>)</li>
<li><a href="https://github.com/actions/upload-artifact/commit/74fad66b98a6d799dc004d3353ccd0e6f6b2530e"><code>74fad66</code></a> Update the readme with direct upload details (<a href="https://redirect.github.com/actions/upload-artifact/issues/795">#795</a>)</li>
<li><a href="https://github.com/actions/upload-artifact/commit/bbbca2ddaa5d8feaa63e36b76fdaad77386f024f"><code>bbbca2d</code></a> Support direct file uploads (<a href="https://redirect.github.com/actions/upload-artifact/issues/764">#764</a>)</li>
<li><a href="https://github.com/actions/upload-artifact/commit/589182c5a4cec8920b8c1bce3e2fab1c97a02296"><code>589182c</code></a> Upgrade the module to ESM and bump dependencies (<a href="https://redirect.github.com/actions/upload-artifact/issues/762">#762</a>)</li>
<li><a href="https://github.com/actions/upload-artifact/commit/47309c993abb98030a35d55ef7ff34b7fa1074b5"><code>47309c9</code></a> Merge pull request <a href="https://redirect.github.com/actions/upload-artifact/issues/754">#754</a> from actions/Link-/add-proxy-integration-tests</li>
<li><a href="https://github.com/actions/upload-artifact/commit/02a8460834e70dab0ce194c64360c59dc1475ef0"><code>02a8460</code></a> Add proxy integration test</li>
<li><a href="https://github.com/actions/upload-artifact/commit/b7c566a772e6b6bfb58ed0dc250532a479d7789f"><code>b7c566a</code></a> Merge pull request <a href="https://redirect.github.com/actions/upload-artifact/issues/745">#745</a> from actions/upload-artifact-v6-release</li>
<li><a href="https://github.com/actions/upload-artifact/commit/e516bc8500aaf3d07d591fcd4ae6ab5f9c391d5b"><code>e516bc8</code></a> docs: correct description of Node.js 24 support in README</li>
<li>Additional commits viewable in <a href="https://github.com/actions/upload-artifact/compare/v4...v7">compare view</a></li>
</ul>
</details>
<br />


Dependabot will resolve any conflicts with this PR as long as you don't alter it yourself. You can also trigger a rebase manually by commenting `@dependabot rebase`.

[//]: # (dependabot-automerge-start)
[//]: # (dependabot-automerge-end)

---

<details>
<summary>Dependabot commands and options</summary>
<br />

You can trigger Dependabot actions by commenting on this PR:
- `@dependabot rebase` will rebase this PR
- `@dependabot recreate` will recreate this PR, overwriting any edits that have been made to it
- `@dependabot show <dependency name> ignore conditions` will show all of the ignore conditions of the specified dependency
- `@dependabot ignore <dependency name> major version` will close this group update PR and stop Dependabot creating any more for the specific dependency's major version (unless you unignore this specific dependency's major version or upgrade to it yourself)
- `@dependabot ignore <dependency name> minor version` will close this group update PR and stop Dependabot creating any more for the specific dependency's minor version (unless you unignore this specific dependency's minor version or upgrade to it yourself)
- `@dependabot ignore <dependency name>` will close this group update PR and stop Dependabot creating any more for the specific dependency (unless you unignore this specific dependency or upgrade to it yourself)
- `@dependabot unignore <dependency name>` will remove all of the ignore conditions of the specified dependency
- `@dependabot unignore <dependency name> <ignore condition>` will remove the ignore condition of the specified dependency and ignore conditions


</details>

## #56 — Fix(deps): Bump the minor-and-patch group with 11 updates

`dependabot/npm_and_yarn/minor-and-patch-1628b18174` · closed

Bumps the minor-and-patch group with 11 updates:

| Package | From | To |
| --- | --- | --- |
| [@sanity/blueprints](https://github.com/sanity-io/blueprints-node) | `0.26.1` | `0.27.0` |
| [turbo](https://github.com/vercel/turborepo) | `2.10.12` | `2.11.2` |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node) | `24.13.4` | `24.13.6` |
| [vitest](https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest) | `5.0.0` | `5.0.1` |
| [ai](https://github.com/vercel/ai/tree/HEAD/packages/ai) | `7.0.106` | `7.0.108` |
| [cn](https://github.com/shadcn-ui/cn/tree/HEAD/packages/cn) | `0.3.0` | `0.3.2` |
| [react](https://github.com/react/react/tree/HEAD/packages/react) | `19.2.8` | `19.3.0` |
| [react-dom](https://github.com/react/react/tree/HEAD/packages/react-dom) | `19.2.8` | `19.3.0` |
| [zod](https://github.com/colinhacks/zod) | `4.6.4` | `4.6.5` |
| [@vitest/coverage-v8](https://github.com/vitest-dev/vitest/tree/HEAD/packages/coverage-v8) | `5.0.0` | `5.0.1` |
| [@sanity/ui](https://github.com/sanity-io/ui/tree/HEAD/packages/ui) | `4.2.1` | `4.2.3` |

Updates `@sanity/blueprints` from 0.26.1 to 0.27.0
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/sanity-io/blueprints-node/releases">@​sanity/blueprints's releases</a>.</em></p>
<blockquote>
<h2>v0.27.0</h2>
<h2><a href="https://github.com/sanity-io/blueprints-node/compare/v0.26.1...v0.27.0">0.27.0</a> (2026-09-21)</h2>
<h3>Features</h3>
<ul>
<li><strong>durables:</strong> parse duration for better dx for users (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/172">#172</a>) (<a href="https://github.com/sanity-io/blueprints-node/commit/dfc03a7472ed287847205af53dee3de65cff1c26">dfc03a7</a>)</li>
</ul>
<h3>Bug Fixes</h3>
<ul>
<li>add missing version prop to media library config (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/173">#173</a>) (<a href="https://github.com/sanity-io/blueprints-node/commit/e67f8c153b78d95dbc20dd7f7d75ae4a2b16eb0e">e67f8c1</a>)</li>
</ul>
</blockquote>
</details>
<details>
<summary>Changelog</summary>
<p><em>Sourced from <a href="https://github.com/sanity-io/blueprints-node/blob/main/CHANGELOG.md">@​sanity/blueprints's changelog</a>.</em></p>
<blockquote>
<h2><a href="https://github.com/sanity-io/blueprints-node/compare/v0.26.1...v0.27.0">0.27.0</a> (2026-09-21)</h2>
<h3>Features</h3>
<ul>
<li><strong>durables:</strong> parse duration for better dx for users (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/172">#172</a>) (<a href="https://github.com/sanity-io/blueprints-node/commit/dfc03a7472ed287847205af53dee3de65cff1c26">dfc03a7</a>)</li>
</ul>
<h3>Bug Fixes</h3>
<ul>
<li>add missing version prop to media library config (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/173">#173</a>) (<a href="https://github.com/sanity-io/blueprints-node/commit/e67f8c153b78d95dbc20dd7f7d75ae4a2b16eb0e">e67f8c1</a>)</li>
</ul>
</blockquote>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/sanity-io/blueprints-node/commit/921683eb27526a68968c39199df3674576fc7906"><code>921683e</code></a> chore(main): release 0.27.0 (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/174">#174</a>)</li>
<li><a href="https://github.com/sanity-io/blueprints-node/commit/dfc03a7472ed287847205af53dee3de65cff1c26"><code>dfc03a7</code></a> feat(durables): parse duration for better dx for users (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/172">#172</a>)</li>
<li><a href="https://github.com/sanity-io/blueprints-node/commit/e67f8c153b78d95dbc20dd7f7d75ae4a2b16eb0e"><code>e67f8c1</code></a> fix: add missing version prop to media library config (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/173">#173</a>)</li>
<li><a href="https://github.com/sanity-io/blueprints-node/commit/161c604cc861f51351f03fae845814254e2f209e"><code>161c604</code></a> Depends on array (<a href="https://redirect.github.com/sanity-io/blueprints-node/issues/171">#171</a>)</li>
<li>See full diff in <a href="https://github.com/sanity-io/blueprints-node/compare/v0.26.1...v0.27.0">compare view</a></li>
</ul>
</details>
<br />

Updates `turbo` from 2.10.12 to 2.11.2
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/vercel/turborepo/releases">turbo's releases</a>.</em></p>
<blockquote>
<h2>Turborepo v2.11.2</h2>
<!-- raw HTML omitted -->
<h2>What's Changed</h2>
<h3>Changelog</h3>
<ul>
<li>chore: Release Turborepo 2.11.1 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/14104">vercel/turborepo#14104</a></li>
<li>fix: Restore repeatable CLI flags by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/14106">vercel/turborepo#14106</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/vercel/turborepo/compare/v2.11.1...v2.11.2">https://github.com/vercel/turborepo/compare/v2.11.1...v2.11.2</a></p>
<h2>Turborepo v2.11.1</h2>
<!-- raw HTML omitted -->
<h2>What's Changed</h2>
<h3>Changelog</h3>
<ul>
<li>chore: Release Turborepo 2.11.0 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/14102">vercel/turborepo#14102</a></li>
<li>docs: Add Turborepo 2.11 release post by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13652">vercel/turborepo#13652</a></li>
<li>fix: Allow esbuild builds for pnpm generators by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/14103">vercel/turborepo#14103</a></li>
</ul>
<p><strong>Full Changelog</strong>: <a href="https://github.com/vercel/turborepo/compare/v2.11.0...v2.11.1">https://github.com/vercel/turborepo/compare/v2.11.0...v2.11.1</a></p>
<h2>Turborepo v2.11.0</h2>
<!-- raw HTML omitted -->
<h2>What's Changed</h2>
<h3>Changelog</h3>
<ul>
<li>release(turborepo): 2.10.0 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13131">vercel/turborepo#13131</a></li>
<li>docs: Add Turborepo 2.10 release post and update docs by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13096">vercel/turborepo#13096</a></li>
<li>perf: Avoid normalizing git index path joins by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/12944">vercel/turborepo#12944</a></li>
<li>chore: Remove tbx package by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13133">vercel/turborepo#13133</a></li>
<li>feat: Migrate TUI virtual terminals from vt100 to Ghostty by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13135">vercel/turborepo#13135</a></li>
<li>chore: Add examples maintenance agent by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13136">vercel/turborepo#13136</a></li>
<li>chore: Remove a few pre-push hooks by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13137">vercel/turborepo#13137</a></li>
<li>ci: Making sure Zig works in releases by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13138">vercel/turborepo#13138</a></li>
<li>release(turborepo): 2.10.1-canary.1 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13139">vercel/turborepo#13139</a></li>
<li>fix: Support Corepack packageManager integrity hashes by <a href="https://github.com/gwagjiug"><code>@​gwagjiug</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13123">vercel/turborepo#13123</a></li>
<li>fix(env): Add XDG_DATA_* to pass-through by <a href="https://github.com/vercel"><code>@​vercel</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13145">vercel/turborepo#13145</a></li>
<li>release(turborepo): 2.10.1-canary.2 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13147">vercel/turborepo#13147</a></li>
<li>feat: Support <code>devEngines.packageManager</code> by <a href="https://github.com/lachieh"><code>@​lachieh</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/12388">vercel/turborepo#12388</a></li>
<li>feat: Support devEngines packageManager in workspaces by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13150">vercel/turborepo#13150</a></li>
<li>release(turborepo): 2.10.1-canary.3 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13149">vercel/turborepo#13149</a></li>
<li>feat: Update add package manager codemod by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13151">vercel/turborepo#13151</a></li>
<li>feat: Update workspace package manager declarations by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13154">vercel/turborepo#13154</a></li>
<li>release(turborepo): 2.10.1 by <a href="https://github.com/github-actions"><code>@​github-actions</code></a>[bot] in <a href="https://redirect.github.com/vercel/turborepo/pull/13156">vercel/turborepo#13156</a></li>
<li>docs: Prefer devEngines packageManager by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13155">vercel/turborepo#13155</a></li>
<li>fix: Install Zig for LSP builds by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13158">vercel/turborepo#13158</a></li>
<li>ci: Pin macOS Rust builds to macOS 15 by <a href="https://github.com/anthonyshew"><code>@​anthonyshew</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13167">vercel/turborepo#13167</a></li>
<li>feat: Recognize nub as a package manager by <a href="https://github.com/colinhacks"><code>@​colinhacks</code></a> in <a href="https://redirect.github.com/vercel/turborepo/pull/13120">vercel/turborepo#13120</a></li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/vercel/turborepo/commit/dd3931d3dd7632a9288c2fe89210c2dc0212839b"><code>dd3931d</code></a> publish 2.11.2 to registry</li>
<li><a href="https://github.com/vercel/turborepo/commit/9d8df1916928de907229715b67ca2932bd4ddea3"><code>9d8df19</code></a> fix: Restore repeatable CLI flags (<a href="https://redirect.github.com/vercel/turborepo/issues/14106">#14106</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/417d6aaa288b52fde857601bff9d3fbd864e6167"><code>417d6aa</code></a> chore: Release Turborepo 2.11.1 (<a href="https://redirect.github.com/vercel/turborepo/issues/14104">#14104</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/eb2faaf3c5c64d1393de91fdfbd9e3025647c02e"><code>eb2faaf</code></a> fix: Allow esbuild builds for pnpm generators (<a href="https://redirect.github.com/vercel/turborepo/issues/14103">#14103</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/9dec1d21c8626cbb4e63565682a1b33d4fe69af9"><code>9dec1d2</code></a> docs: Add Turborepo 2.11 release post (<a href="https://redirect.github.com/vercel/turborepo/issues/13652">#13652</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/471f08538b2853455a32e4f4155538f0783a8800"><code>471f085</code></a> chore: Release Turborepo 2.11.0 (<a href="https://redirect.github.com/vercel/turborepo/issues/14102">#14102</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/f21d73fc8a5eb3ff2e4b59cd06198ecb6f1a74da"><code>f21d73f</code></a> chore: Update with-prisma example (<a href="https://redirect.github.com/vercel/turborepo/issues/14101">#14101</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/2c49c231c1721e6963333ff14caf58c0e1046c8a"><code>2c49c23</code></a> test: Fix Windows cache restore test (<a href="https://redirect.github.com/vercel/turborepo/issues/14099">#14099</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/613b3ba56b721200083cfe7b5b87555264e6e9c9"><code>613b3ba</code></a> chore: Release Turborepo 2.10.14-canary.5 (<a href="https://redirect.github.com/vercel/turborepo/issues/14098">#14098</a>)</li>
<li><a href="https://github.com/vercel/turborepo/commit/d804909549216c165a5160a38975c5dd8a7bf73f"><code>d804909</code></a> fix: Defer dependency output validation for lazy scopes (<a href="https://redirect.github.com/vercel/turborepo/issues/14097">#14097</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/vercel/turborepo/compare/v2.10.12...v2.11.2">compare view</a></li>
</ul>
</details>
<br />

Updates `@types/node` from 24.13.4 to 24.13.6
<details>
<summary>Commits</summary>
<ul>
<li>See full diff in <a href="https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node">compare view</a></li>
</ul>
</details>
<br />

Updates `vitest` from 5.0.0 to 5.0.1
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/vitest-dev/vitest/releases">vitest's releases</a>.</em></p>
<blockquote>
<h2>v5.0.1</h2>
<h3>   🚀 Features</h3>
<ul>
<li><strong>ui</strong>:
<ul>
<li>Move trace attempts selector to viewer header  -  by <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a>, <strong>Hiroshi Ogawa</strong> and <strong>Codex</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11189">vitest-dev/vitest#11189</a> <a href="https://github.com/vitest-dev/vitest/commit/5dc4b5c92"><!-- raw HTML omitted -->(5dc4b)<!-- raw HTML omitted --></a></li>
<li>Add focused trace view layout mode  -  by <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a>, <strong>Hiroshi Ogawa</strong>, <strong>OpenCode (gpt-5.6-sol)</strong> and <strong>Codex</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11190">vitest-dev/vitest#11190</a> <a href="https://github.com/vitest-dev/vitest/commit/376dc3bc1"><!-- raw HTML omitted -->(376dc)<!-- raw HTML omitted --></a></li>
</ul>
</li>
</ul>
<h3>   🐞 Bug Fixes</h3>
<ul>
<li>Exit 1 when vitest list fails collection  -  by <a href="https://github.com/hamed-bavar"><code>@​hamed-bavar</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11145">vitest-dev/vitest#11145</a> and <a href="https://redirect.github.com/vitest-dev/vitest/issues/11146">vitest-dev/vitest#11146</a> <a href="https://github.com/vitest-dev/vitest/commit/6108b8197"><!-- raw HTML omitted -->(6108b)<!-- raw HTML omitted --></a></li>
<li>Keep parse error details in static collection  -  by <a href="https://github.com/hamed-bavar"><code>@​hamed-bavar</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11150">vitest-dev/vitest#11150</a> and <a href="https://redirect.github.com/vitest-dev/vitest/issues/11151">vitest-dev/vitest#11151</a> <a href="https://github.com/vitest-dev/vitest/commit/7c818153a"><!-- raw HTML omitted -->(7c818)<!-- raw HTML omitted --></a></li>
<li>Avoid recursive prototype in automocking  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11195">vitest-dev/vitest#11195</a> <a href="https://github.com/vitest-dev/vitest/commit/99fc52591"><!-- raw HTML omitted -->(99fc5)<!-- raw HTML omitted --></a></li>
<li>Prevent false Vitest import resolution  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11196">vitest-dev/vitest#11196</a> <a href="https://github.com/vitest-dev/vitest/commit/b426c1976"><!-- raw HTML omitted -->(b426c)<!-- raw HTML omitted --></a></li>
<li>Keep metadata file when clearing the cache  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11199">vitest-dev/vitest#11199</a> <a href="https://github.com/vitest-dev/vitest/commit/73614654a"><!-- raw HTML omitted -->(73614)<!-- raw HTML omitted --></a></li>
<li>Correct typos in error message and comments  -  by <a href="https://github.com/shinji00222"><code>@​shinji00222</code></a> and <strong>Shinji</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11187">vitest-dev/vitest#11187</a> <a href="https://github.com/vitest-dev/vitest/commit/115c3f6d2"><!-- raw HTML omitted -->(115c3)<!-- raw HTML omitted --></a></li>
<li>Resolve ResolvedConfig exactOptionalPropertyTypes errors  -  by <a href="https://github.com/LukeAbby"><code>@​LukeAbby</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11175">vitest-dev/vitest#11175</a> <a href="https://github.com/vitest-dev/vitest/commit/498fbe922"><!-- raw HTML omitted -->(498fb)<!-- raw HTML omitted --></a></li>
<li>Share the server on self-referencing <code>extends</code>  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11034">vitest-dev/vitest#11034</a> <a href="https://github.com/vitest-dev/vitest/commit/23dda738c"><!-- raw HTML omitted -->(23dda)<!-- raw HTML omitted --></a></li>
<li>Warn when deprecated <code>deps.optimizer.web</code> is used  -  by <a href="https://github.com/im10furry"><code>@​im10furry</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11214">vitest-dev/vitest#11214</a> <a href="https://github.com/vitest-dev/vitest/commit/2ce29d5fa"><!-- raw HTML omitted -->(2ce29)<!-- raw HTML omitted --></a></li>
<li><strong>browser</strong>:
<ul>
<li>Avoid double quotes in <code>config.define</code>  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11198">vitest-dev/vitest#11198</a> <a href="https://github.com/vitest-dev/vitest/commit/972e24bab"><!-- raw HTML omitted -->(972e2)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>doctor</strong>:
<ul>
<li>Measure vm pools for custom environments  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11212">vitest-dev/vitest#11212</a> <a href="https://github.com/vitest-dev/vitest/commit/91ab1588c"><!-- raw HTML omitted -->(91ab1)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>expect</strong>:
<ul>
<li>Correct return value in <code>toMatchAriaSnapshot</code>  -  by <a href="https://github.com/sheremet-va"><code>@​sheremet-va</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11208">vitest-dev/vitest#11208</a> <a href="https://github.com/vitest-dev/vitest/commit/c119be016"><!-- raw HTML omitted -->(c119b)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>fakeTimers</strong>:
<ul>
<li>Force <code>queueMicrotask</code> and <code>nextTick</code> in <code>toNotFake</code>  -  by <a href="https://github.com/kingmakeruix"><code>@​kingmakeruix</code></a>, <strong>kingmakeruix</strong>, <strong>Hiroshi Ogawa</strong>, <strong>Codex</strong> and <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11261">vitest-dev/vitest#11261</a> <a href="https://github.com/vitest-dev/vitest/commit/a47d7908f"><!-- raw HTML omitted -->(a47d7)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>snapshot</strong>:
<ul>
<li>Report obsolete keys next to skipped tests  -  by <a href="https://github.com/hamed-bavar"><code>@​hamed-bavar</code></a>, <strong>Hiroshi Ogawa</strong> and <strong>OpenCode (gpt-5.6-sol)</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11157">vitest-dev/vitest#11157</a> and <a href="https://redirect.github.com/vitest-dev/vitest/issues/11158">vitest-dev/vitest#11158</a> <a href="https://github.com/vitest-dev/vitest/commit/17e2b22dd"><!-- raw HTML omitted -->(17e2b)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>types</strong>:
<ul>
<li>Make public declarations self-contained  -  by <a href="https://github.com/ZoeySigel"><code>@​ZoeySigel</code></a> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11141">vitest-dev/vitest#11141</a> <a href="https://github.com/vitest-dev/vitest/commit/455466c16"><!-- raw HTML omitted -->(45546)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>ui</strong>:
<ul>
<li>Fix collapse/expand suite with file name search  -  by <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a>, <strong>Hiroshi Ogawa</strong> and <strong>Codex</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11260">vitest-dev/vitest#11260</a> <a href="https://github.com/vitest-dev/vitest/commit/0a7122daa"><!-- raw HTML omitted -->(0a712)<!-- raw HTML omitted --></a></li>
<li>Fix explorer file summary count  -  by <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a>, <strong>Hiroshi Ogawa</strong>, <strong>OpenCode (gpt-5.6-sol)</strong> and <strong>Codex</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11125">vitest-dev/vitest#11125</a> <a href="https://github.com/vitest-dev/vitest/commit/05982297d"><!-- raw HTML omitted -->(05982)<!-- raw HTML omitted --></a></li>
</ul>
</li>
<li><strong>utils</strong>:
<ul>
<li>Fix <code>deepMerge</code> to handle prototype  -  by <a href="https://github.com/hi-ogawa"><code>@​hi-ogawa</code></a>, <strong>Hiroshi Ogawa</strong> and <strong>Codex</strong> in <a href="https://redirect.github.com/vitest-dev/vitest/issues/11215">vitest-dev/vitest#11215</a> <a href="https://github.com/vitest-dev/vitest/commit/4944cf498"><!-- raw HTML omitted -->(4944c)<!-- raw HTML omitted --></a></li>
</ul>
</li>
</ul>
<h5>    <a href="https://github.com/vitest-dev/vitest/compare/v5.0.0...v5.0.1">View changes on GitHub</a></h5>
</blockquote>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/vitest-dev/vitest/commit/03630a5995d10455fa136be53bfb2b2409381106"><code>03630a5</code></a> chore: release v5.0.1 (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11275">#11275</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/a47d7908f0635e9cba6cbe5e1a209bb6add5e0ab"><code>a47d790</code></a> fix(fakeTimers): force <code>queueMicrotask</code> and <code>nextTick</code> in <code>toNotFake</code> (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11261">#11261</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/2ce29d5fa758046e5453bd92b8ed6c9da9709bb5"><code>2ce29d5</code></a> fix: warn when deprecated <code>deps.optimizer.web</code> is used (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11214">#11214</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/ccd6d057b6e4ca29a5e6b753a2b8e16b0afd8cda"><code>ccd6d05</code></a> docs: fix typecheck exclude default in documentation (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11223">#11223</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/91ab1588c72c9c5f7c638368a541cd20e0e8a934"><code>91ab158</code></a> fix(doctor): measure vm pools for custom environments (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11212">#11212</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/23dda738ccacb11682426426cd7b876afd107621"><code>23dda73</code></a> fix: share the server on self-referencing <code>extends</code> (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11034">#11034</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/498fbe9222eb9aa3d8cf48481e200c16bb693bbd"><code>498fbe9</code></a> fix: resolve ResolvedConfig exactOptionalPropertyTypes errors (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11175">#11175</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/115c3f6d2bfa6a8672eeab8cc21bbecc6a4ef3d0"><code>115c3f6</code></a> fix: correct typos in error message and comments (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11187">#11187</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/73614654a46f617c357920eecda439654a561f92"><code>7361465</code></a> fix: keep metadata file when clearing the cache (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11199">#11199</a>)</li>
<li><a href="https://github.com/vitest-dev/vitest/commit/972e24bab5fb96843de72447eb65585628b8dbde"><code>972e24b</code></a> fix(browser): avoid double quotes in <code>config.define</code> (<a href="https://github.com/vitest-dev/vitest/tree/HEAD/packages/vitest/issues/11198">#11198</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/vitest-dev/vitest/commits/v5.0.1/packages/vitest">compare view</a></li>
</ul>
</details>
<br />

Updates `ai` from 7.0.106 to 7.0.108
<details>
<summary>Changelog</summary>
<p><em>Sourced from <a href="https://github.com/vercel/ai/blob/main/packages/ai/CHANGELOG.md">ai's changelog</a>.</em></p>
<blockquote>
<h2>7.0.108</h2>
<h3>Patch Changes</h3>
<ul>
<li>3f6852a: fix(ai): prevent direct execution of tools governed by tool callers</li>
<li>6317504: fix(ai): stop pending tool-call repairs when generation is cancelled</li>
<li>3cb2dcd: fix(ai): preserve file data when adapting v3 language models</li>
<li>ccf98e7: fix(ai): prevent <code>streamText</code> from executing tool calls that violate tool choice</li>
<li>Updated dependencies [20dd00a]</li>
<li>Updated dependencies [7cf7cee]</li>
<li>Updated dependencies [c42576a]</li>
<li>Updated dependencies [d85dcf5]</li>
<li>Updated dependencies [fd9b3f3]
<ul>
<li><code>@​ai-sdk/gateway</code><a href="https://github.com/4"><code>@​4</code></a>.0.88</li>
</ul>
</li>
</ul>
<h2>7.0.107</h2>
<h3>Patch Changes</h3>
<ul>
<li>79681c4: fix(ai): preserve provider file and skill upload APIs in wrapProvider</li>
<li>98c7275: fix(ai): preserve query parameters in chat reconnect URLs</li>
<li>a105059: fix(workflow): support deferred tool discovery in WorkflowAgent</li>
<li>31532f3: fix(ai): prevent preliminary tool outputs from completing chats</li>
<li>e61cbd8: fix(ai): preserve raw speech audio format metadata</li>
<li>8ade040: fix(ai): pass tool-specific context to input callbacks</li>
<li>970a01e: fix(ai): enforce polling timeouts for in-flight video status requests</li>
<li>85539c5: fix(ai): preserve multiple Set-Cookie headers in Node stream responses</li>
<li>611d301: fix(ai): prevent duplicate content types in chat transport requests</li>
<li>c415657: fix(ai): decode base64 text data URLs using their declared charset</li>
<li>Updated dependencies [2973485]</li>
<li>Updated dependencies [a4db5ea]</li>
<li>Updated dependencies [2937ea2]
<ul>
<li><code>@​ai-sdk/provider-utils</code><a href="https://github.com/5"><code>@​5</code></a>.0.45</li>
<li><code>@​ai-sdk/gateway</code><a href="https://github.com/4"><code>@​4</code></a>.0.87</li>
</ul>
</li>
</ul>
</blockquote>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/vercel/ai/commit/fe37eb0f67c1028c4bed0f4640ae17c57145a818"><code>fe37eb0</code></a> Version Packages (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/21170">#21170</a>)</li>
<li><a href="https://github.com/vercel/ai/commit/ccf98e73477af5a757cc1b4d01f0bea17fe6b28a"><code>ccf98e7</code></a> fix(ai): prevent <code>streamText</code> from executing tool calls that violate tool cho...</li>
<li><a href="https://github.com/vercel/ai/commit/3f6852aac46e86b84c6e3c2d65c91b6feea58f23"><code>3f6852a</code></a> fix: prevent generateText from directly executing caller-governed hidden tool...</li>
<li><a href="https://github.com/vercel/ai/commit/3cb2dcd2beacd1eb5f9614421d1a04b3d977a278"><code>3cb2dcd</code></a> fix: preserve file inputs and outputs when using v3 language models (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/21052">#21052</a>)</li>
<li><a href="https://github.com/vercel/ai/commit/63175049119a46295e0ebffbcf638ef67c31f551"><code>6317504</code></a> fix: prevent repaired tools from executing after cancellation (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/20942">#20942</a>)</li>
<li><a href="https://github.com/vercel/ai/commit/08ae5ad05bc12496dd1ffcf64e34419e0831300d"><code>08ae5ad</code></a> Version Packages (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/21089">#21089</a>)</li>
<li><a href="https://github.com/vercel/ai/commit/a10505961d0899a8649efc3e2122eae9f8cfee07"><code>a105059</code></a> fix: support deferred tool discovery and toolSearch execution in WorkflowAgen...</li>
<li><a href="https://github.com/vercel/ai/commit/8ade040883cf8e2a16818b141b90a7888aaf2103"><code>8ade040</code></a> fix: tool input callbacks receive runtime context instead of tool-specific co...</li>
<li><a href="https://github.com/vercel/ai/commit/e61cbd8c172151a5242854cde5dfe0a2578b0541"><code>e61cbd8</code></a> fix: preserve PCM metadata for headerless speech audio (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/21079">#21079</a>)</li>
<li><a href="https://github.com/vercel/ai/commit/98c7275767f5ce42b41b48c8248c6922c19ebffc"><code>98c7275</code></a> fix: Preserve query parameters when constructing chat reconnect URLs (<a href="https://github.com/vercel/ai/tree/HEAD/packages/ai/issues/21116">#21116</a>)</li>
<li>Additional commits viewable in <a href="https://github.com/vercel/ai/commits/ai@7.0.108/packages/ai">compare view</a></li>
</ul>
</details>
<br />

Updates `cn` from 0.3.0 to 0.3.2
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/shadcn-ui/cn/releases">cn's releases</a>.</em></p>
<blockquote>
<h2>cn@0.3.2</h2>
<h3>Patch Changes</h3>
<ul>
<li><a href="https://redirect.github.com/shadcn-ui/cn/pull/147">#147</a> <a href="https://github.com/shadcn-ui/cn/commit/e703bfef0548bcc64eb0badc5941a4f5d09e7339"><code>e703bfe</code></a> Thanks <a href="https://github.com/shadcn"><code>@​shadcn</code></a>! - Custom <code>animate-*</code> classes are no longer merged, matching tailwind-merge. Only the default theme animations (<code>spin</code>, <code>ping</code>, <code>pulse</code>, <code>bounce</code>), <code>animate-none</code>, and arbitrary values share the <code>animate</code> group, so plugin classes such as <code>animate-in</code>, <code>animate-once</code>, and <code>animate-duration-500</code> are never dropped.</li>
</ul>
<h2>cn@0.3.1</h2>
<h3>Patch Changes</h3>
<ul>
<li><a href="https://redirect.github.com/shadcn-ui/cn/pull/144">#144</a> <a href="https://github.com/shadcn-ui/cn/commit/19a9a66235b2897df012f75600c818fe5a56f5b1"><code>19a9a66</code></a> Thanks <a href="https://github.com/shadcn"><code>@​shadcn</code></a>! - Axis utilities now override the logical sides they cover, matching tailwind-merge 3.7.0. <code>px-2</code> replaces <code>ps-*</code> and <code>pe-*</code>, <code>py-2</code> replaces <code>pbs-*</code> and <code>pbe-*</code>, and the same applies to <code>mx</code>/<code>my</code>, <code>inset-x</code>/<code>inset-y</code>, <code>border-x</code>/<code>border-y</code> widths and colors, and <code>scroll-mx</code>/<code>scroll-my</code>/<code>scroll-px</code>/<code>scroll-py</code>.</li>
</ul>
</blockquote>
</details>
<details>
<summary>Changelog</summary>
<p><em>Sourced from <a href="https://github.com/shadcn-ui/cn/blob/main/packages/cn/CHANGELOG.md">cn's changelog</a>.</em></p>
<blockquote>
<h2>0.3.2</h2>
<h3>Patch Changes</h3>
<ul>
<li><a href="https://redirect.github.com/shadcn-ui/cn/pull/147">#147</a> <a href="https://github.com/shadcn-ui/cn/commit/e703bfef0548bcc64eb0badc5941a4f5d09e7339"><code>e703bfe</code></a> Thanks <a href="https://github.com/shadcn"><code>@​shadcn</code></a>! - Custom <code>animate-*</code> classes are no longer merged, matching tailwind-merge. Only the default theme animations (<code>spin</code>, <code>ping</code>, <code>pulse</code>, <code>bounce</code>), <code>animate-none</code>, and arbitrary values share the <code>animate</code> group, so plugin classes such as <code>animate-in</code>, <code>animate-once</code>, and <code>animate-duration-500</code> are never dropped.</li>
</ul>
<h2>0.3.1</h2>
<h3>Patch Changes</h3>
<ul>
<li><a href="https://redirect.github.com/shadcn-ui/cn/pull/144">#144</a> <a href="https://github.com/shadcn-ui/cn/commit/19a9a66235b2897df012f75600c818fe5a56f5b1"><code>19a9a66</code></a> Thanks <a href="https://github.com/shadcn"><code>@​shadcn</code></a>! - Axis utilities now override the logical sides they cover, matching tailwind-merge 3.7.0. <code>px-2</code> replaces <code>ps-*</code> and <code>pe-*</code>, <code>py-2</code> replaces <code>pbs-*</code> and <code>pbe-*</code>, and the same applies to <code>mx</code>/<code>my</code>, <code>inset-x</code>/<code>inset-y</code>, <code>border-x</code>/<code>border-y</code> widths and colors, and <code>scroll-mx</code>/<code>scroll-my</code>/<code>scroll-px</code>/<code>scroll-py</code>.</li>
</ul>
</blockquote>
</details>
<details>
<summary>Commits</summary>
<ul>
<li><a href="https://github.com/shadcn-ui/cn/commit/210353b13437e832a95d51f9540288d91c3b2e14"><code>210353b</code></a> chore(release): version packages (<a href="https://github.com/shadcn-ui/cn/tree/HEAD/packages/cn/issues/148">#148</a>)</li>
<li><a href="https://github.com/shadcn-ui/cn/commit/e703bfef0548bcc64eb0badc5941a4f5d09e7339"><code>e703bfe</code></a> fix(config): stop merging custom animate classes (<a href="https://github.com/shadcn-ui/cn/tree/HEAD/packages/cn/issues/147">#147</a>)</li>
<li><a href="https://github.com/shadcn-ui/cn/commit/8f12110fca353b87d16a26d59b453791d1f3965b"><code>8f12110</code></a> chore(release): version packages (<a href="https://github.com/shadcn-ui/cn/tree/HEAD/packages/cn/issues/145">#145</a>)</li>
<li><a href="https://github.com/shadcn-ui/cn/commit/19a9a66235b2897df012f75600c818fe5a56f5b1"><code>19a9a66</code></a> fix(config): override logical sides with axis utilities (<a href="https://github.com/shadcn-ui/cn/tree/HEAD/packages/cn/issues/144">#144</a>)</li>
<li>See full diff in <a href="https://github.com/shadcn-ui/cn/commits/cn@0.3.2/packages/cn">compare view</a></li>
</ul>
</details>
<br />

Updates `react` from 19.2.8 to 19.3.0
<details>
<summary>Release notes</summary>
<p><em>Sourced from <a href="https://github.com/react/react/releases">react's releases</a>.</em></p>
<blockquote>
<h2>19.3.0 (September 9, 2026)</h2>
<p>Below is a list of all new features, APIs, and bug fixes.</p>
<p>Read the <a href="https://react.dev/blog/2026/09/09/react-19-3">React 19.3 release post</a> for more information.</p>
<h2>New React Features</h2>
<ul>
<li><code>&lt;ViewTransition /&gt;</code>: Adds <code>&lt;ViewTransition /&gt;</code> and <code>addTransitionType</code> APIs to power View Transition animations in React (<a href="https://github.com/sebmarkbage"><code>@​sebmarkbage</code></a>, <a href="https://github.com/jackpope"><code>@​jackpope</code></a>, <a href="https://github.com/gaearon"><code>@​gaearon</code></a>: <a href="https://redirect.github.com/facebook/react/pull/31975">#31975</a>, <a href="https://redirect.github.com/facebook/react/pull/31987">#31987</a>, <a href="https://redirect.github.com/facebook/react/pull/31996">#31996</a>, <a href="https://redirect.github.com/facebook/react/pull/31999">#31999</a>, <a href="https://redirect.github.com/facebook/react/pull/32001">#32001</a>, <a href="https://redirect.github.com/facebook/react/pull/32002">#32002</a>, <a href="https://redirect.github.com/facebook/react/pull/32028">#32028</a>, <a href="https://redirect.github.com/facebook/react/pull/32029">#32029</a>, <a href="https://redirect.github.com/facebook/react/pull/32031">#32031</a>, <a href="https://redirect.github.com/facebook/react/pull/32034">#32034</a>, <a href="https://redirect.github.com/facebook/react/pull/32038">#32038</a>, <a href="https://redirect.github.com/facebook/react/pull/32041">#32041</a>, <a href="https://redirect.github.com/facebook/react/pull/32050">#32050</a>, <a href="https://redirect.github.com/facebook/react/pull/32090">#32090</a>, <a href="https://redirect.github.com/facebook/react/pull/32105">#32105</a>, <a href="https://redirect.github.com/facebook/react/pull/32254">#32254</a>, <a href="https://redirect.github.com/facebook/react/pull/32379">#32379</a>, <a href="https://redirect.github.com/facebook/react/pull/32422">#32422</a>, <a href="https://redirect.github.com/facebook/react/pull/32462">#32462</a>, <a href="https://redirect.github.com/facebook/react/pull/32540">#32540</a>, <a href="https://redirect.github.com/facebook/react/pull/32545">#32545</a>, <a href="https://redirect.github.com/facebook/react/pull/32585">#32585</a>, <a href="https://redirect.github.com/facebook/react/pull/32599">#32599</a>, <a href="https://redirect.github.com/facebook/react/pull/32611">#32611</a>, <a href="https://redirect.github.com/facebook/react/pull/32612">#32612</a>, <a href="https://redirect.github.com/facebook/react/pull/32617">#32617</a>, <a href="https://redirect.github.com/facebook/react/pull/32651">#32651</a>, <a href="https://redirect.github.com/facebook/react/pull/32653">#32653</a>, <a href="https://redirect.github.com/facebook/react/pull/32656">#32656</a>, <a href="https://redirect.github.com/facebook/react/pull/32664">#32664</a>, <a href="https://redirect.github.com/facebook/react/pull/32699">#32699</a>, <a href="https://redirect.github.com/facebook/react/pull/32723">#32723</a>, <a href="https://redirect.github.com/facebook/react/pull/32734">#32734</a>, <a href="https://redirect.github.com/facebook/react/pull/32751">#32751</a>, <a href="https://redirect.github.com/facebook/react/pull/32752">#32752</a>, <a href="https://redirect.github.com/facebook/react/pull/32760">#32760</a>, <a href="https://redirect.github.com/facebook/react/pull/32761">#32761</a>, <a href="https://redirect.github.com/facebook/react/pull/32764">#32764</a>, <a href="https://redirect.github.com/facebook/react/pull/32772">#32772</a>, <a href="https://redirect.github.com/facebook/react/pull/32790">#32790</a>, <a href="https://redirect.github.com/facebook/react/pull/32819">#32819</a>, <a href="https://redirect.github.com/facebook/react/pull/32820">#32820</a>, <a href="https://redirect.github.com/facebook/react/pull/32822">#32822</a>, <a href="https://redirect.github.com/facebook/react/pull/32833">#32833</a>, <a href="https://redirect.github.com/facebook/react/pull/32849">#32849</a>, <a href="https://redirect.github.com/facebook/react/pull/33094">#33094</a>, <a href="https://redirect.github.com/facebook/react/pull/33191">#33191</a>, <a href="https://redirect.github.com/facebook/react/pull/33200">#33200</a>, <a href="https://redirect.github.com/facebook/react/pull/33206">#33206</a>, <a href="https://redirect.github.com/facebook/react/pull/33293">#33293</a>, <a href="https://redirect.github.com/facebook/react/pull/33330">#33330</a>, <a href="https://redirect.github.com/facebook/react/pull/33331">#33331</a>, <a href="https://redirect.github.com/facebook/react/pull/33332">#33332</a>, <a href="https://redirect.github.com/facebook/react/pull/33357">#33357</a>, <a href="https://redirect.github.com/facebook/react/pull/33362">#33362</a>, <a href="https://redirect.github.com/facebook/react/pull/33433">#33433</a>, <a href="https://redirect.github.com/facebook/react/pull/33576">#33576</a>, <a href="https://redirect.github.com/facebook/react/pull/34374">#34374</a>, <a href="https://redirect.github.com/facebook/react/pull/34450">#34450</a>, <a href="https://redirect.github.com/facebook/react/pull/34481">#34481</a>, <a href="https://redirect.github.com/facebook/react/pull/34500">#34500</a>, <a href="https://redirect.github.com/facebook/react/pull/34502">#34502</a>, <a href="https://redirect.github.com/facebook/react/pull/34510">#34510</a>, <a href="https://redirect.github.com/facebook/react/pull/34511">#34511</a>, <a href="https://redirect.github.com/facebook/react/pull/34539">#34539</a>, <a href="https://redirect.github.com/facebook/react/pull/35567">#35567</a>, <a href="https://redirect.github.com/facebook/react/pull/35564">#35564</a>, <a href="https://redirect.github.com/facebook/react/pull/35485">#35485</a>, <a href="https://redirect.github.com/facebook/react/pull/35380">#35380</a>, <a href="https://redirect.github.com/facebook/react/pull/35063">#35063</a>, <a href="https://redirect.github.com/facebook/react/pull/35060">#35060</a>, <a href="https://redirect.github.com/facebook/react/pull/34676">#34676</a>, <a href="https://redirect.github.com/facebook/react/pull/36917">#36917</a>, <a href="https://redirect.github.com/facebook/react/pull/35337">#35337</a>, <a href="https://redirect.github.com/facebook/react/pull/35520">#35520</a>)</li>
<li>Fragment Refs: Add Refs to <code>&lt;Fragment /&gt;</code> to support composable platform behavior (<a href="https://github.com/jackpope"><code>@​jackpope</code></a>, <a href="https://github.com/sebmarkbage"><code>@​sebmarkbage</code></a>, <a href="https://github.com/eps1lon"><code>@​eps1lon</code></a>, <a href="https://github.com/Dhakshin2007"><code>@​Dhakshin2007</code></a>, <a href="https://github.com/chirokas"><code>@​chirokas</code></a>, <a href="https://github.com/teamleaderleo"><code>@​teamleaderleo</code></a>, <a href="https://github.com/fallintoplace"><code>@​fallintoplace</code></a>: <a href="https://redirect.github.com/facebook/react/pull/32465">#32465</a>, <a href="https://redirect.github.com/facebook/react/pull/32613">#32613</a>, <a href="https://redirect.github.com/facebook/react/pull/32619">#32619</a>, <a href="https://redirect.github.com/facebook/react/pull/32654">#32654</a>, <a href="https://redirect.github.com/facebook/react/pull/32660">#32660</a>, <a href="https://redirect.github.com/facebook/react/pull/32682">#32682</a>, <a href="https://redirect.github.com/facebook/react/pull/32722">#32722</a>, <a href="https://redirect.github.com/facebook/react/pull/32813">#32813</a>, <a href="https://redirect.github.com/facebook/react/pull/32814">#32814</a>, <a href="https://redirect.github.com/facebook/react/pull/33056">#33056</a>, <a href="https://redirect.github.com/facebook/react/pull/33058">#33058</a>, <a href="https://redirect.github.com/facebook/react/pull/33093">#33093</a>, <a href="https://redirect.github.com/facebook/react/pull/34069">#34069</a>, <a href="https://redirect.github.com/facebook/react/pull/34103">#34103</a>, <a href="https://redirect.github.com/facebook/react/pull/34544">#34544</a>, <a href="https://redirect.github.com/facebook/react/pull/34545">#34545</a>, <a href="https://redirect.github.com/facebook/react/pull/37062">#37062</a>, <a href="https://redirect.github.com/facebook/react/pull/37061">#37061</a>, <a href="https://redirect.github.com/facebook/react/pull/37060">#37060</a>, <a href="https://redirect.github.com/facebook/react/pull/36047">#36047</a>, <a href="https://redirect.github.com/facebook/react/pull/36010">#36010</a>, <a href="https://redirect.github.com/facebook/react/pull/35642">#35642</a>, <a href="https://redirect.github.com/facebook/react/pull/35641">#35641</a>, <a href="https://redirect.github.com/facebook/react/pull/35637">#35637</a>, <a href="https://redirect.github.com/facebook/react/pull/35630">#35630</a>, <a href="https://redirect.github.com/facebook/react/pull/34935">#34935</a>, <a href="https://redirect.github.com/facebook/react/pull/37457">#37457</a>, <a href="https://redirect.github.com/facebook/react/pull/37408">#37408</a>, <a href="https://redirect.github.com/facebook/react/pull/37326">#37326</a>, <a href="https://redirect.github.com/facebook/react/pull/37251">#37251</a>, <a href="https://redirect.github.com/facebook/react/pull/37171">#37171</a>, <a href="https://redirect.github.com/facebook/react/pull/37169">#37169</a>, <a href="https://redirect.github.com/facebook/react/pull/37168">#37168</a>, <a href="https://redirect.github.com/facebook/react/pull/37167">#37167</a>, <a href="https://redirect.github.com/facebook/react/pull/37166">#37166</a>, <a href="https://redirect.github.com/facebook/react/pull/37165">#37165</a>, <a href="https://redirect.github.com/facebook/react/pull/37164">#37164</a>, <a href="https://redirect.github.com/facebook/react/pull/37163">#37163</a>, <a href="https://redirect.github.com/facebook/react/pull/37162">#37162</a>, <a href="https://redirect.github.com/facebook/react/pull/37161">#37161</a>, <a href="https://redirect.github.com/facebook/react/pull/37160">#37160</a>, <a href="https://redirect.github.com/facebook/react/pull/37125">#37125</a>, <a href="https://redirect.github.com/facebook/react/pull/37063">#37063</a>)</li>
</ul>
<h2>New React DOM Features</h2>
<ul>
<li><code>browser()</code>: a new <code>react-dom</code> API that returns a usable which errors during server rendering and resolves in the browser. <code>use(browser())</code> inside a <code>&lt;Suspense&gt;</code> boundary marks a subtree as browser-only without reporting a recoverable error (<a href="https://github.com/gnoff"><code>@​gnoff</code></a>: <a href="https://redirect.github.com/facebook/react/pull/37143">#37143</a>, <a href="https://redirect.github.com/facebook/react/pull/37241">#37241</a>)
<ul>
<li>Added an <code>onBrowserBailout</code> option to the <code>react-dom/server</code> APIs to observe when a subtree defers to the browser (<a href="https://github.com/gnoff"><code>@​gnoff</code></a> <a href="https://redirect.github.com/facebook/react/pull/37193">#37193</a>)</li>
</ul>
</li>
</ul>
<h2>Notable changes</h2>
<ul>
<li>Enable Trusted Types API integration (<a href="https://github.com/rickhanlonii"><code>@​rickhanlonii</code></a> <a href="https://redirect.github.com/facebook/react/pull/35816">#35816</a>)</li>
<li>Transitions now render independently instead of being entangled into a single render, so a slow transition no longer holds up unrelated ones (<a href="https://github.com/acdlite"><code>@​acdlite</code></a> <a href="https://redirect.github.com/facebook/react/pull/37290">#37290</a>)</li>
<li>Added a DEV-only warning when a component appears to have been unblocked by calling <code>use()</code> conditionally (<a href="https://github.com/hoxyq"><code>@​hoxyq</code></a>, <a href="https://github.com/eps1lon"><code>@​eps1lon</code></a>: <a href="https://redirect.github.com/facebook/react/pull/37104">#37104</a>, <a href="https://redirect.github.com/facebook/react/pull/37203">#37203</a>, <a href="https://redirect.github.com/facebook/react/pull/37491">#37491</a>)</li>
</ul>
<h2>All Changes</h2>
<h3>React</h3>
<ul>
<li>Fast Refresh Fixes
<ul>
<li>Fix Fast Refresh to find and remount edits to components wrapped behind <code>lazy()</code> (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36965">#36965</a>)</li>
<li>Fix Fast Refresh so edits to a <code>memo()</code> comparison function take effect (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36964">#36964</a>)</li>
<li>Fix Fast Refresh crash when an edit changes the kind of a component's type (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36963">#36963</a>)</li>
<li>Unify hot reload type resolution for Fast Refresh (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36962">#36962</a>)</li>
<li>Fix Fast Refresh to remount correctly when an edit changes the component kind (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36950">#36950</a>)</li>
<li>Double invoke effects in StrictMode after Fast Refresh (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/35962">#35962</a>)</li>
</ul>
</li>
<li>Performance Track Fixes
<ul>
<li>Prevent crash when accessing <code>$$typeof</code> in Performance Tracks (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/35679">#35679</a>)</li>
<li>Handle non-string function names in Performance Tracks (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/35659">#35659</a>)</li>
<li>Use minus (<code>-</code>) instead of en dash for removed props in Performance Tracks (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/35649">#35649</a>)</li>
<li>Handle arrays with bigints in deep objects in Performance Tracks (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/35648">#35648</a>)</li>
<li>Don't enumerate typed array props in Performance Tracks in DEV (<a href="https://github.com/UditDewan"><code>@​UditDewan</code></a> <a href="https://redirect.github.com/facebook/react/pull/36913">#36913</a>)</li>
<li>Bail out of diffing wide objects and arrays in Performance Tracks (<a href="https://github.com/eps1lon"><code>@​eps1lon</code></a> <a href="https://redirect.github.com/facebook/react/pull/34742">#34742</a>)</li>
<li>Clear potentially large performance measures in DEV (<a href="https://github.com/hoxyq"><code>@​hoxyq</code></a> <a href="https://redirect.github.com/facebook/react/pull/34803">#34803</a>)</li>
<li>Fix missing else branch for renders with no props change in Performance Tracks (<a href="https://github.com/hoxyq"><code>@​hoxyq</code></a> <a href="https://redirect.github.com/facebook/react/pull/34837">#34837</a>)</li>
</ul>
</li>
<li>Activity Fixes
<ul>
<li>Fix <code>useSyncExternalStore</code> missing store mutations that happened while an Activity tree was hidden (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/pull/36947">#36947</a>)</li>
<li>Hide portal contents when an Activity is hidden (<a href="https://github.com/acdlite"><code>@​acdlite</code></a> <a href="https://redirect.github.com/facebook/react/pull/35091">#35091</a>)</li>
<li>Prevent metadata hoisting in hidden <code>&lt;Activity&gt;</code> trees (<a href="https://github.com/ronnakamoto"><code>@​ronnakamoto</code></a> <a href="https://redirect.github.com/facebook/react/pull/34983">#34983</a>)</li>
<li>Prevent errors thrown inside a hidden Activity from escaping to the visible UI (<a href="https://github.com/acdlite"><code>@​acdlite</code></a> <a href="https://redirect.github.com/facebook/react/pull/35074">#35074</a>)</li>
<li>Don't unhide a node if a direct parent Offscreen is still hidden (<a href="https://github.com/sebmarkbage"><code>@​sebmarkbage</code></a> <a href="https://redirect.github.com/facebook/react/pull/34821">#34821</a>)</li>
<li>Don't show internal <code>&lt;Offscreen&gt;</code> component in error messages (<a href="https://github.com/rickhanlonii"><code>@​rickhanlonii</code></a> <a href="https://redirect.github.com/facebook/react/pull/35763">#35763</a>)</li>
</ul>
</li>
<li>Warn in DEV when a component appears to have been unblocked by a conditional <code>use()</code> (<a href="https://github.com/hoxyq"><code>@​hoxyq</code></a>, <a href="https://github.com/eps1lon"><code>@​eps1lon</code></a>: <a href="https://redirect.github.com/facebook/react/pull/37104">#37104</a>, <a href="https://redirect.github.com/facebook/react/pull/37203">#37203</a>, <a href="https://redirect.github.com/facebook/react/pull/37491">#37491</a>)</li>
<li>Render transitions independently instead of entangling them into a single render (<a href="https://github.com/acdlite"><code>@​acdlite</code></a> <a href="https://redirect.github.com/facebook/react/pull/37290">#37290</a>)</li>
</ul>
<!-- raw HTML omitted -->
</blockquote>
<p>... (truncated)</p>
</details>
<details>
<summary>Changelog</summary>
<p><em>Sourced from <a href="https://github.com/react/react/blob/main/CHANGELOG.md">react's changelog</a>.</em></p>
<blockquote>
<h2>19.3.0 (September 9, 2026)</h2>
<h3>New React Features</h3>
<ul>
<li><code>&lt;ViewTransition /&gt;</code>: Adds <code>&lt;ViewTransition /&gt;</code> and <code>addTransitionType</code> APIs to power View Transition animations in React (<a href="https://github.com/sebmarkbage"><code>@​sebmarkbage</code></a>, <a href="https://github.com/jackpope"><code>@​jackpope</code></a>, <a href="https://github.com/gaearon"><code>@​gaearon</code></a>: <a href="https://redirect.github.com/facebook/react/pull/31975">#31975</a>, <a href="https://redirect.github.com/facebook/react/pull/31987">#31987</a>, <a href="https://redirect.github.com/facebook/react/pull/31996">#31996</a>, <a href="https://redirect.github.com/facebook/react/pull/31999">#31999</a>, <a href="https://redirect.github.com/facebook/react/pull/32001">#32001</a>, <a href="https://redirect.github.com/facebook/react/pull/32002">#32002</a>, <a href="https://redirect.github.com/facebook/react/pull/32028">#32028</a>, <a href="https://redirect.github.com/facebook/react/pull/32029">#32029</a>, <a href="https://redirect.github.com/facebook/react/pull/32031">#32031</a>, <a href="https://redirect.github.com/facebook/react/pull/32034">#32034</a>, <a href="https://redirect.github.com/facebook/react/pull/32038">#32038</a>, <a href="https://redirect.github.com/facebook/react/pull/32041">#32041</a>, <a href="https://redirect.github.com/facebook/react/pull/32050">#32050</a>, <a href="https://redirect.github.com/facebook/react/pull/32090">#32090</a>, <a href="https://redirect.github.com/facebook/react/pull/32105">#32105</a>, <a href="https://redirect.github.com/facebook/react/pull/32254">#32254</a>, <a href="https://redirect.github.com/facebook/react/pull/32379">#32379</a>, <a href="https://redirect.github.com/facebook/react/pull/32422">#32422</a>, <a href="https://redirect.github.com/facebook/react/pull/32462">#32462</a>, <a href="https://redirect.github.com/facebook/react/pull/32540">#32540</a>, <a href="https://redirect.github.com/facebook/react/pull/32545">#32545</a>, <a href="https://redirect.github.com/facebook/react/pull/32585">#32585</a>, <a href="https://redirect.github.com/facebook/react/pull/32599">#32599</a>, <a href="https://redirect.github.com/facebook/react/pull/32611">#32611</a>, <a href="https://redirect.github.com/facebook/react/pull/32612">#32612</a>, <a href="https://redirect.github.com/facebook/react/pull/32617">#32617</a>, <a href="https://redirect.github.com/facebook/react/pull/32651">#32651</a>, <a href="https://redirect.github.com/facebook/react/pull/32653">#32653</a>, <a href="https://redirect.github.com/facebook/react/pull/32656">#32656</a>, <a href="https://redirect.github.com/facebook/react/pull/32664">#32664</a>, <a href="https://redirect.github.com/facebook/react/pull/32699">#32699</a>, <a href="https://redirect.github.com/facebook/react/pull/32723">#32723</a>, <a href="https://redirect.github.com/facebook/react/pull/32734">#32734</a>, <a href="https://redirect.github.com/facebook/react/pull/32751">#32751</a>, <a href="https://redirect.github.com/facebook/react/pull/32752">#32752</a>, <a href="https://redirect.github.com/facebook/react/pull/32760">#32760</a>, <a href="https://redirect.github.com/facebook/react/pull/32761">#32761</a>, <a href="https://redirect.github.com/facebook/react/pull/32764">#32764</a>, <a href="https://redirect.github.com/facebook/react/pull/32772">#32772</a>, <a href="https://redirect.github.com/facebook/react/pull/32790">#32790</a>, <a href="https://redirect.github.com/facebook/react/pull/32819">#32819</a>, <a href="https://redirect.github.com/facebook/react/pull/32820">#32820</a>, <a href="https://redirect.github.com/facebook/react/pull/32822">#32822</a>, <a href="https://redirect.github.com/facebook/react/pull/32833">#32833</a>, <a href="https://redirect.github.com/facebook/react/pull/32849">#32849</a>, <a href="https://redirect.github.com/facebook/react/pull/33094">#33094</a>, <a href="https://redirect.github.com/facebook/react/pull/33191">#33191</a>, <a href="https://redirect.github.com/facebook/react/pull/33200">#33200</a>, <a href="https://redirect.github.com/facebook/react/pull/33206">#33206</a>, <a href="https://redirect.github.com/facebook/react/pull/33293">#33293</a>, <a href="https://redirect.github.com/facebook/react/pull/33330">#33330</a>, <a href="https://redirect.github.com/facebook/react/pull/33331">#33331</a>, <a href="https://redirect.github.com/facebook/react/pull/33332">#33332</a>, <a href="https://redirect.github.com/facebook/react/pull/33357">#33357</a>, <a href="https://redirect.github.com/facebook/react/pull/33362">#33362</a>, <a href="https://redirect.github.com/facebook/react/pull/33433">#33433</a>, <a href="https://redirect.github.com/facebook/react/pull/33576">#33576</a>, <a href="https://redirect.github.com/facebook/react/pull/34374">#34374</a>, <a href="https://redirect.github.com/facebook/react/pull/34450">#34450</a>, <a href="https://redirect.github.com/facebook/react/pull/34481">#34481</a>, <a href="https://redirect.github.com/facebook/react/pull/34500">#34500</a>, <a href="https://redirect.github.com/facebook/react/pull/34502">#34502</a>, <a href="https://redirect.github.com/facebook/react/pull/34510">#34510</a>, <a href="https://redirect.github.com/facebook/react/pull/34511">#34511</a>, <a href="https://redirect.github.com/facebook/react/pull/34539">#34539</a>, <a href="https://redirect.github.com/facebook/react/pull/35567">#35567</a>, <a href="https://redirect.github.com/facebook/react/pull/35564">#35564</a>, <a href="https://redirect.github.com/facebook/react/pull/35485">#35485</a>, <a href="https://redirect.github.com/facebook/react/pull/35380">#35380</a>, <a href="https://redirect.github.com/facebook/react/pull/35063">#35063</a>, <a href="https://redirect.github.com/facebook/react/pull/35060">#35060</a>, <a href="https://redirect.github.com/facebook/react/pull/34676">#34676</a>, <a href="https://redirect.github.com/facebook/react/pull/36917">#36917</a>, <a href="https://redirect.github.com/facebook/react/pull/35337">#35337</a>, <a href="https://redirect.github.com/facebook/react/pull/35520">#35520</a>)</li>
<li>Fragment Refs: Add Refs to <code>&lt;Fragment /&gt;</code> to support composable platform behavior (<a href="https://github.com/jackpope"><code>@​jackpope</code></a>, <a href="https://github.com/sebmarkbage"><code>@​sebmarkbage</code></a>, <a href="https://github.com/eps1lon"><code>@​eps1lon</code></a>, <a href="https://github.com/Dhakshin2007"><code>@​Dhakshin2007</code></a>, <a href="https://github.com/chirokas"><code>@​chirokas</code></a>, <a href="https://github.com/teamleaderleo"><code>@​teamleaderleo</code></a>, <a href="https://github.com/fallintoplace"><code>@​fallintoplace</code></a>: <a href="https://redirect.github.com/facebook/react/pull/32465">#32465</a>, <a href="https://redirect.github.com/facebook/react/pull/32613">#32613</a>, <a href="https://redirect.github.com/facebook/react/pull/32619">#32619</a>, <a href="https://redirect.github.com/facebook/react/pull/32654">#32654</a>, <a href="https://redirect.github.com/facebook/react/pull/32660">#32660</a>, <a href="https://redirect.github.com/facebook/react/pull/32682">#32682</a>, <a href="https://redirect.github.com/facebook/react/pull/32722">#32722</a>, <a href="https://redirect.github.com/facebook/react/pull/32813">#32813</a>, <a href="https://redirect.github.com/facebook/react/pull/32814">#32814</a>, <a href="https://redirect.github.com/facebook/react/pull/33056">#33056</a>, <a href="https://redirect.github.com/facebook/react/pull/33058">#33058</a>, <a href="https://redirect.github.com/facebook/react/pull/33093">#33093</a>, <a href="https://redirect.github.com/facebook/react/pull/34069">#34069</a>, <a href="https://redirect.github.com/facebook/react/pull/34103">#34103</a>, <a href="https://redirect.github.com/facebook/react/pull/34544">#34544</a>, <a href="https://redirect.github.com/facebook/react/pull/34545">#34545</a>, <a href="https://redirect.github.com/facebook/react/pull/37062">#37062</a>, <a href="https://redirect.github.com/facebook/react/pull/37061">#37061</a>, <a href="https://redirect.github.com/facebook/react/pull/37060">#37060</a>, <a href="https://redirect.github.com/facebook/react/pull/36047">#36047</a>, <a href="https://redirect.github.com/facebook/react/pull/36010">#36010</a>, <a href="https://redirect.github.com/facebook/react/pull/35642">#35642</a>, <a href="https://redirect.github.com/facebook/react/pull/35641">#35641</a>, <a href="https://redirect.github.com/facebook/react/pull/35637">#35637</a>, <a href="https://redirect.github.com/facebook/react/pull/35630">#35630</a>, <a href="https://redirect.github.com/facebook/react/pull/34935">#34935</a>, <a href="https://redirect.github.com/facebook/react/pull/37457">#37457</a>, <a href="https://redirect.github.com/facebook/react/pull/37408">#37408</a>, <a href="https://redirect.github.com/facebook/react/pull/37326">#37326</a>, <a href="https://redirect.github.com/facebook/react/pull/37251">#37251</a>, <a href="https://redirect.github.com/facebook/react/pull/37171">#37171</a>, <a href="https://redirect.github.com/facebook/react/pull/37169">#37169</a>, <a href="https://redirect.github.com/facebook/react/pull/37168">#37168</a>, <a href="https://redirect.github.com/facebook/react/pull/37167">#37167</a>, <a href="https://redirect.github.com/facebook/react/pull/37166">#37166</a>, <a href="https://redirect.github.com/facebook/react/pull/37165">#37165</a>, <a href="https://redirect.github.com/facebook/react/pull/37164">#37164</a>, <a href="https://redirect.github.com/facebook/react/pull/37163">#37163</a>, <a href="https://redirect.github.com/facebook/react/pull/37162">#37162</a>, <a href="https://redirect.github.com/facebook/react/pull/37161">#37161</a>, <a href="https://redirect.github.com/facebook/react/pull/37160">#37160</a>, <a href="https://redirect.github.com/facebook/react/pull/37125">#37125</a>, <a href="https://redirect.github.com/facebook/react/pull/37063">#37063</a>)</li>
</ul>
<h3>New React DOM Features</h3>
<ul>
<li><code>browser()</code>: a new <code>react-dom</code> API that returns a usable which errors during server rendering and resolves in the browser. <code>use(browser())</code> inside a <code>&lt;Suspense&gt;</code> boundary marks a subtree as browser-only without reporting a recoverable error (<a href="https://github.com/gnoff"><code>@​gnoff</code></a>: <a href="https://redirect.github.com/facebook/react/pull/37143">#37143</a>, <a href="https://redirect.github.com/facebook/react/pull/37241">#37241</a>)
<ul>
<li>Added an <code>onBrowserBailout</code> option to the <code>react-dom/server</code> APIs to observe when a subtree defers to the browser (<a href="https://github.com/gnoff"><code>@​gnoff</code></a> <a href="https://redirect.github.com/facebook/react/pull/37193">#37193</a>)</li>
</ul>
</li>
</ul>
<h3>Notable changes</h3>
<ul>
<li>Enable Trusted Types API integration (<a href="https://github.com/rickhanlonii"><code>@​rickhanlonii</code></a> <a href="https://redirect.github.com/facebook/react/pull/35816">#35816</a>)</li>
<li>Transitions now render independently instead of being entangled into a single render, so a slow transition no longer holds up unrelated ones (<a href="https://github.com/acdlite"><code>@​acdlite</code></a> <a href="https://redirect.github.com/facebook/react/pull/37290">#37290</a>)</li>
<li>Added a DEV-only warning when a component appears to have been unblocked by calling <code>use()</code> conditionally (<a href="https://github.com/hoxyq"><code>@​hoxyq</code></a>, <a href="https://github.com/eps1lon"><code>@​eps1lon</code></a>: <a href="https://redirect.github.com/facebook/react/pull/37104">#37104</a>, <a href="https://redirect.github.com/facebook/react/pull/37203">#37203</a>, <a href="https://redirect.github.com/facebook/react/pull/37491">#37491</a>)</li>
</ul>
<h3>All Changes</h3>
<h4>React</h4>
<ul>
<li>Fast Refresh Fixes
<ul>
<li>Fix Fast Refresh to find and remount edits to components wrapped behind <code>lazy()</code> (<a href="https://github.com/sophiebits"><code>@​sophiebits</code></a> <a href="https://redirect.github.com/facebook/react/p...

_Description has been truncated_

