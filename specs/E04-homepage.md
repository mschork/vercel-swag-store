# E04 Homepage

Branch: `epic/E04-home`. Depends on: E02, E03. Blocks: nothing (E09 revisits for Sanity content).

## Goal

`/` as a marketing page: static hero and featured grid served from the prerender, with the promotional banner streaming in as the only dynamic part.

## Scope

### Route `app/page.tsx`

Server component. Structure, top to bottom:

1. `<Hero />` static.
2. `<Suspense fallback={<PromoBannerSkeleton />}><PromoBanner /></Suspense>`.
3. `<FeaturedProducts />` cached.

`export const metadata = { title: 'Vercel Swag Store', description: ..., openGraph: {...} }` overriding the template so the title is not "Vercel Swag Store | Vercel Swag Store". Use `title: { absolute: 'Vercel Swag Store' }`.

### Hero `components/home/hero.tsx`

- Headline, supporting paragraph, primary CTA button linking to `/search` ("Shop the collection"), secondary text link to a featured product [assumption on copy; E09 makes it editable].
- Visual: the black desk mat or backpack product image via `next/image` with `priority` and explicit `sizes`, on the right at md and up, below the copy on mobile. [assumption: use a product image rather than an illustration; it is on-brand and already optimised.]
- Content comes from a `HERO_FALLBACK` constant in `lib/content/fallbacks.ts` so E09 can swap in Sanity data without touching the component.

### Promo banner `components/home/promo-banner.tsx`

- Async server component calling `getPromotion()` (never cached).
- Renders title, description, discount percent and the code in a copyable `<code>` element. A small client `CopyCode` button using `navigator.clipboard` [assumption: nice-to-have; drop if time is short].
- Handles `active: false` by rendering nothing; handles fetch failure by rendering nothing and logging server-side, so a promo outage never breaks the page.
- Skeleton: one line of the same height to avoid layout shift.

### Featured products `components/home/featured-products.tsx`

- Async server component with `"use cache"` at the component level calling `getProducts({ featured: true, limit: 12 })`.
- If fewer than 6 come back, top up with `getProducts({ limit: 12 })` excluding duplicates until 6.
- Grid: 2 columns on mobile, 3 at md, 4 at lg [assumption]. Each `<ProductCard />`.

### Product card `components/product-card.tsx`

Shared with E07. Props: `product`, `priority?`. Renders `next/image` with the product's first image and `sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"`, name, `formatPrice(price)`, wrapped in a `Link` to `/products/[slug]`. Whole card is the link; name and price sit in a pill in the bottom-left [assumption, echoing the reference design in the requirements]. Prefetch default.

### Section headings

Featured section heading "Featured" with a text link "View all" to `/search`.

## Acceptance criteria

- [ ] `/` is listed as static in the build output; the promo banner is the only dynamic segment (visible as a Suspense boundary in the RSC payload).
- [ ] At least 6 products with image, name, price, linking to their PDP.
- [ ] Promo banner shows live API data; disabling network to the API leaves the page rendering without the banner.
- [ ] Hero image is LCP and loads with `priority`; no CLS from the banner.
- [ ] Lighthouse mobile performance 90+ (record numbers in E11).
- [ ] Layout holds at 375, 768, 1280.

## Out of scope

Sanity-driven hero (E09), lookbook or collection sections (E08/E09 stretch), design token polish (E10).

## Open questions

1. Hero copy: any headline you want? [assumption: "Ship it. Wear it." plus a one-liner]
2. Is a copy-to-clipboard button on the promo code welcome, or keep the banner purely static text?
