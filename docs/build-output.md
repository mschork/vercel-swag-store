# Build output

`pnpm --filter store build`, Next.js 16.3.5 with Turbopack and Cache Components, on 25 Sep 2026. Every page route is a partial prerender or fully static: its shell is HTML at build time and its live parts stream in per request. No page route is fully dynamic. `scripts/check-build.mjs` asserts this after every build, so the table below cannot drift without `pnpm verify` failing.

```
Route (app)                                                 Revalidate  Expire
┌ ◐ /                                                               1h      1d
├ ◐ /_not-found                                                     1h      1d
├ ƒ /.well-known/workflow/v1/flow
├ ƒ /.well-known/workflow/v1/step
├ ƒ /.well-known/workflow/v1/webhook/[token]
├ ƒ /api/demand/analyse
├ ƒ /api/draft-mode/disable
├ ○ /api/draft-mode/enable
├ ƒ /api/revalidate/catalog
├ ƒ /api/revalidate/sanity
├ ƒ /api/test/session
├ ƒ /api/visit
├ ◐ /cart                                                           1h      1d
├ ◐ /checkout                                                       1h      1d
├ ○ /llms.txt                                                       1h      1d
├   /md/category/[slug]
│ ├ ● /md/category/bottles                                          1h      1d
│ ├ ● /md/category/cups                                             1h      1d
│ ├ ● /md/category/mugs                                             1h      1d
│ └ ● [+10 more paths]
├ ○ /md/home                                                        1h      1d
├   /md/product/[slug]
│ ├ ● /md/product/matte-black-stainless-steel-water-bottle          1h      1d
│ ├ ● /md/product/matte-black-insulated-tumbler                     1h      1d
│ ├ ● /md/product/matte-black-reusable-cold-cup-straw               1h      1d
│ └ ● [+25 more paths]
├ ○ /md/products                                                    1h      1d
├ ○ /opengraph-image                                                1h      1d
├ ◐ /products                                                       1h      1d
├   /products/[slug]                                                1h      1d
│ ├ ◐ /products/[slug]                                              1h      1d
│ ├ ◐ /products/matte-black-stainless-steel-water-bottle            1h      1d
│ ├ ◐ /products/matte-black-insulated-tumbler                       1h      1d
│ └ ◐ [+26 more paths]
├ ƒ /products/[slug]/opengraph-image
├   /products/category/[slug]                                       1h      1d
│ ├ ◐ /products/category/[slug]                                     1h      1d
│ ├ ◐ /products/category/bottles                                    1h      1d
│ ├ ◐ /products/category/cups                                       1h      1d
│ └ ◐ [+11 more paths]
├ ○ /robots.txt
├ ◐ /search                                                         1h      1d
└ ○ /sitemap.xml                                                    1h      1d

ƒ Proxy (Middleware)

○  (Static)             prerendered as static content
●  (SSG)                prerendered as static HTML (uses generateStaticParams)
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
```

The revalidate and expire columns come from the `catalog` cache profile in `next.config.ts`: served stale for 5 minutes, refreshed in the background after an hour, dropped after a day.

The proxy is listed because one exists, not because it runs often. It mints the session id with no I/O, and its matcher carries a `missing` condition on a valid `sid` cookie, so a browser invokes it once and every later request is served from the CDN without it (`docs/adr/0007-the-session-store.md`).

## What each route prerenders, and what streams

| Route | In the prerendered shell | Streams per request | Why |
|---|---|---|---|
| `/` | Header, hero with its copy and photo, the featured grid and the favourites row with every product name, price and image, footer | Promo strip, cart badge | The catalogue is cached; the promotion and the cart are not |
| `/products` | Heading, every product card, the category chips | Promo strip, cart badge | Same |
| `/products/category/[slug]` | Heading, the category's intro from Sanity, its cards | Promo strip, cart badge | Categories are a closed set the API lists, so each page is built |
| `/products/[slug]` | Breadcrumb, gallery, name, price, descriptions, testimonials, questions, structured data | Stock line with Add to Cart, promo strip, cart badge | Stock is drawn per visitor |
| `/search` | Heading, the search form with its category list, the results region | Search form's live state, results grid, promo strip, cart badge | Results depend on `searchParams`, which the page passes on unawaited |
| `/cart` | Heading and the skeleton's box | Cart contents, the favourites row, promo strip, cart badge | The cart is read from the session store |
| `/checkout` | The whole thank-you page | Promo strip, cart badge | Nothing on the page depends on the visitor |
| `/md/**`, `/llms.txt` | The whole file | nothing | Built from the same merged product as the page, and never live data |
| `/_not-found` | The whole page | Promo strip, cart badge | Same as `/checkout` |

Every product slug is prerendered at build. `/products/[slug]` and `/products/category/[slug]` also keep a fallback shell, so a slug that did not exist at build still serves the static chrome and fills in the rest.

## Verifying the holes

Each pending boundary appears in the built HTML as `<!--$?-->` with its fallback beside it. Counted in `.next/server/app` on the same build:

| File | Pending boundaries |
|---|---|
| `index.html` | 6 |
| `products.html` | 6 |
| `products/category/bottles.html` | 6 |
| `products/<slug>.html` | 7 |
| `cart.html` | 6 |
| `checkout.html` | 5 |
| `search.html` | 9 |

The shared five are the cart badge, the promo strip and its marquee, and two for Vercel Analytics, which reads search params. A product page adds the stock line with Add to Cart; `/search` adds the form's live state and the results grid.

## The route handlers

The routes marked `ƒ` are route handlers, not pages: the revalidation endpoints, the draft-mode switches, the visit and test-seed endpoints, the demand analysis, the Workflow runtime's own paths, and the per-product Open Graph image, which draws a product the CDN cannot know at build time. `scripts/check-build.mjs` allows exactly this set and fails on any page route that joins it.
