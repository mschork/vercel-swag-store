# Release checklist

One line per requirement, with the route or file that satisfies it. Paths are relative to
`apps/store`.

## Shell and metadata

| Requirement | Where |
|---|---|
| Header on every route | `components/header.tsx`, rendered by `app/layout.tsx` |
| Footer on every route | `components/footer.tsx`, which survives a store-config failure on its own |
| Page layout | `app/layout.tsx`; content in a `max-w-6xl` column, header sticky |
| Responsive | Mobile-first at 375, 768 and 1280, held by the screenshots in `e2e/visual.spec.ts` |
| Root metadata | `generateMetadata()` in `app/layout.tsx`, mapped from the API's `/store/config` |
| Per-page metadata | `app/page.tsx`, `app/products/[slug]/page.tsx`, `app/search/page.tsx`, `app/cart/page.tsx`, each exporting its own |
| Open Graph images | `app/opengraph-image.tsx` and `app/products/[slug]/opengraph-image.tsx`, both via `next/og` |
| Cache Components enabled | `cacheComponents: true` in `next.config.ts`; every page route prerenders, asserted by `scripts/check-build.mjs` |

## Home

| Requirement | Where |
|---|---|
| Hero | `components/home/hero.tsx`; headline, description and CTA authored in Sanity |
| Promotion | `components/promo-strip.tsx`, streamed in its own Suspense boundary |
| Featured grid | `components/home/featured-products.tsx`, topped up by `getFeaturedProducts` in `lib/api/products.ts` |

## Product page

| Requirement | Where |
|---|---|
| Product image | `components/product/gallery.tsx`, with thumbnails as a client leaf |
| Product information | `app/products/[slug]/page.tsx` for the API's fields, `components/product/enrichment.tsx` for the Sanity ones |
| Stock indicator | `components/product/stock-indicator.tsx`, read inside `components/product/stock-and-cart.tsx` |
| Quantity selector | `components/quantity-stepper.tsx`, clamped to the visitor's own draw |
| Add to Cart | `components/product/add-to-cart-form.tsx`, disabled at zero stock |

## Cart

| Requirement | Where |
|---|---|
| Adding to the cart | `addToCart` in `app/cart/actions.ts` |
| Header badge | `components/cart/cart-badge.tsx` with the count in `components/cart/cart-count.tsx` |
| Cart page | `app/cart/page.tsx` |
| Line display | `components/cart/cart-line.tsx` |
| Quantity change | `updateQuantity` in `app/cart/actions.ts`, saved after a pause |
| Removal | `removeItem` in `app/cart/actions.ts` |
| Subtotal | `components/cart/cart-summary.tsx` |
| Persistence across reloads | The cart token and a mirror of the cart in the session store, `lib/session/store.ts` |

## Search

| Requirement | Where |
|---|---|
| Search input | `components/search/search-form.tsx`, in the static shell and working without JavaScript |
| Triggers | Debounce, Enter and the button, all one `router.replace` in `components/search/search-form-client.tsx` |
| Default state | `components/search/search-results.tsx` when no query is set |
| Results | `components/search/search-results.tsx` |
| Category filter | `?category=`, with category-aware expansion of the query in `lib/search.ts` |
| Empty state | `components/search/empty-state.tsx` |
| Loading state | `ResultsSkeleton` in `components/search/search-results.tsx` |
| State in the URL | `/search?q=&category=`, so a search is a link and a reload reproduces it |

## Release

| Item | State |
|---|---|
| `pnpm verify` green locally | Yes, including `scripts/check-build.mjs` and `scripts/check-metadata.mjs` |
| CI green on `main` | Yes: `verify`, `e2e` and the Studio deploy |
| Store and Studio reachable without credentials | Yes, both listed in the README |
| Repository public | Yes |
| `X-Robots-Tag: noindex` on every route | Yes, checked against production |
