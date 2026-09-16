# E04 Homepage

Branch: `epic/E04-home`. Depends on: E02, E03. Blocks: E07 (ProductCard, `getFeaturedProducts`); E09 revisits for Sanity content.

## Goal

`/` as a marketing page: static hero and featured grid served from the prerender, with the promotional banner streaming in as the only dynamic part.

## Scope

### Route `app/page.tsx`

Server component. Structure, top to bottom:

1. `<Hero />` static, full bleed (E10).
2. `<Suspense fallback={<PromoBannerSkeleton />}><PromoBanner /></Suspense>`.
3. `<FeaturedProducts />` cached.

The banner sits above the hero, in the root layout on every route (E10); its box reserves its height so it never pushes the LCP image when it streams in.

`export async function generateMetadata()` awaits the cached `getStoreConfig()` and returns `title: { absolute: seo.defaultTitle }`, with a comment that the home title is the store name without the template. Next never applies `title.template` to the root's own default, so the override changes nothing; it exists because the brief asks every page to export its own metadata, and it keeps the value API-sourced. Description and Open Graph inherit from the root.

### Hero `components/home/hero.tsx`

- Headline, supporting paragraph, primary CTA button linking to `/search`. No secondary text link: the brief asks for a headline, a description, a CTA and a visual element, and the visual element links to the product itself.
- Visual (E10): a full-bleed lifestyle photo from `public/hero.jpg` via `next/image` with `priority`, `fill` and `sizes="100vw"`, the only LCP candidate. Copy over the photo at md and up, under it on phones. No link, no button.
- Content comes from a `HERO_FALLBACK` constant in `lib/content/fallbacks.ts` so E09 can swap in Sanity data without touching the component. Field names match E08's `homePage.hero`: `{ headline, description }`. Values: headline "Ship in black.", description "Official Vercel merchandise. Apparel, desk gear and accessories from the team behind Next.js, all in one colour.". The copy is placeholder marketing text (`improvements.md`).

### Promo banner `components/home/promo-banner.tsx`

- Async server component calling `getPromotion()` (never cached).
- Renders every field the API returns: title, description, discount percent and the code in a `<code>` element. No display rules: one of the four promos has `discountPercent: 0` and `code: "AUTO"` and renders as such (`improvements.md`). Static text only, no copy button (`improvements.md`).
- Handles `active: false` and a failed call the same way: renders the reserved box empty (see below) and, for a failure, logs server-side through `loadOptional`, so a promo outage never breaks the page and nothing below the banner moves.
- Layout shift: the skeleton and the banner share one wrapper with the same `min-height` per breakpoint, sized for the longest of the four current promos (119 characters: three lines at 375, two at md, one at lg). The skeleton renders that many lines. A future promo longer than that causes a small shift, not a break. Streaming makes the skeleton a slow-path safety net (`callout.md`).

### Featured products `components/home/featured-products.tsx`

- Async server component with `"use cache"` at the component level (the UI-level form of the directive; the data underneath is cached too) calling `getFeaturedProducts({ limit: 12, min: 6 })`.
- Grid: `<ProductGrid variant="home" />` (E07), row cards on mobile and 3 columns from md; it maxes out at 3 (E10). Each `<ProductCard />`, none with `priority`: the hero image is the LCP element and the cards start below the fold.

### Top-up `lib/api/products.ts`

`getFeaturedProducts({ limit, min }): Promise<Product[]>`, `"use cache"` like its siblings, tagged `products`. Fetches `getProducts({ featured: true, limit })`; if fewer than `min` come back, fetches `getProducts({ limit })` and appends products not already present, in API order, until `min`. Featured products always come first; a top-up product is never labelled as featured (`CONTEXT.md`). `min: 6` is the brief's minimum, not a count read off the API. E07's default state calls the same function with `{ limit: 5, min: 5 }`, which the API answers without a top-up.

### Product card `components/product-card.tsx`

Shared with E07. Props: `product`, `priority?`, `sizes`. Renders `next/image` with the product's first image, `fill` inside an `aspect-square` frame and the `sizes` its grid passes in (E07's `ProductGrid` owns the column count and the matching `sizes`), name, `formatPrice(price, currency)`, wrapped in a `Link` to `/products/[slug]`. Whole card is the link; the price is a pill on the photo and the name sits under it (E10 owns the card's two shapes). Prefetch default. Image frame on `bg-secondary` with a 1px `border` and radius.

### PDP stub `app/products/[slug]/page.tsx`

`typedRoutes` rejects a `Link` to `/products/${slug}` until the route exists. E04 adds a stub that renders a heading and never reads `params`, so it is one static shell for every slug, exactly as E03 stubbed `/search` and `/cart`. E05 replaces the body.

### shadcn `components/ui/`

E04 runs `shadcn init -b base` (Base UI primitives, per `decisions.md`) and installs `button` and `skeleton` only; E10 adds the rest. The init's class-based `dark` custom variant is removed: the theme follows `prefers-color-scheme` (`callout.md`). shadcn's semantic colour variables (`--color-background`, `--color-primary`, `--color-muted`, …) are kept but defined from our tokens in one alias block in `globals.css`, so generated components work unedited and later ones drop in without re-theming. `cn()` lives in `lib/utils.ts`. The CTA is `<Button render={<Link href="/search" />}>`, Base UI's replacement for Radix's `asChild`.

### Section headings

Featured section heading "Featured" with a text link "View all" to `/search`.

### Tests

- Vitest: `getFeaturedProducts` with a mocked `fetchApi`: featured first, de-duplicated by id, stops at `min`, copes with a catalogue smaller than `min`, makes no second call when `min` is met.
- Playwright (E12 runs it; write the test here): home renders at least 6 cards with image, name, price and a PDP link. The outage case (page renders without the banner when the API is unreachable) is a server-side condition Playwright cannot create; it is verified by starting `next start` with an unreachable `API_BASE_URL`.

## Acceptance criteria

- [x] `/` is listed as static in the build output; the promo banner is the only dynamic segment (visible as a Suspense boundary in the RSC payload).
- [x] At least 6 products with image, name, price, linking to their PDP.
- [x] Promo banner shows live API data; disabling network to the API leaves the page rendering without the banner.
- [x] Hero image is LCP and loads with `priority`; no CLS from the banner for any of the four current promos.
- [x] Lighthouse mobile performance 90+ (record numbers in E11).
- [x] Layout holds at 375, 768, 1280.
- [x] Only `button` and `skeleton` exist under `components/ui`; no `.dark` variant in `globals.css`.

## Out of scope

Sanity-driven hero (E09), lookbook or collection sections (E08/E09 stretch), design token polish and the remaining shadcn components (E10).
