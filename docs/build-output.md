# Build output

`pnpm --filter store build`, Next.js 16.3.5 with Turbopack and Cache Components, on 17 Sep 2026. Every page route is a partial prerender: its shell is HTML at build time and its live parts stream in per request. No page route is fully dynamic.

```
Route (app)                                               Revalidate  Expire
┌ ◐ /                                                             1h      1d
├ ◐ /_not-found                                                   1h      1d
├ ƒ /api/revalidate/catalog
├ ◐ /cart                                                         1h      1d
├ ◐ /checkout                                                     1h      1d
├ ○ /opengraph-image
├   /products/[slug]                                              1h      1d
│ ├ ◐ /products/[slug]                                            1h      1d
│ ├ ◐ /products/matte-black-stainless-steel-water-bottle          1h      1d
│ ├ ◐ /products/matte-black-insulated-tumbler                     1h      1d
│ └ ◐ [+26 more paths]
├ ƒ /products/[slug]/opengraph-image
├ ○ /robots.txt
├ ◐ /search                                                       1h      1d
└ ○ /sitemap.xml                                                  1h      1d

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
```

The revalidate and expire columns come from the `catalog` cache profile in `next.config.ts`: served stale for 5 minutes, refreshed in the background after an hour, dropped after a day.

## What each route prerenders, and what streams

| Route | In the prerendered shell | Streams per request | Why |
|---|---|---|---|
| `/` | Header, hero with its copy and photo, the featured grid with every product name, price and image, footer | Promo strip, cart badge | The catalogue is cached; the promotion and the cart are not |
| `/products/[slug]` | Breadcrumb, gallery, name, price, description, structured data | Stock line with Add to Cart, promo strip, cart badge | Stock changes on every request |
| `/search` | Heading, the search form with its category list, the results region | Search form's live state, results grid, promo strip, cart badge | Results depend on `searchParams`, which the page passes on unawaited |
| `/cart` | Heading and the skeleton's box | Cart contents, promo strip, cart badge | The cart is read from an httpOnly cookie |
| `/checkout` | The whole thank-you page | Promo strip, cart badge | Nothing on the page depends on the visitor |
| `/_not-found` | The whole page | Promo strip, cart badge | Same |

All 28 product slugs are prerendered at build. `/products/[slug]` also keeps a fallback shell, so a slug that did not exist at build still serves the static chrome and fills in the rest.

## Verifying the holes

Each pending boundary appears in the built HTML as `<!--$?-->` with its fallback beside it. Counted in `.next/server/app`:

| File | Pending boundaries | They are |
|---|---|---|
| `index.html` | 4 | Cart badge, promo strip, and two for Vercel Analytics, which reads search params |
| `products/<slug>.html` | 5 | The above plus stock with Add to Cart |
| `cart.html` | 5 | The above plus the cart contents |
| `checkout.html` | 4 | Badge, promo strip, analytics |
| `search.html` | 8 | Badge, promo strip, analytics, the search form, the results grid, and the streamed metadata, which awaits `searchParams` |

## The three routes that are not partial prerenders

- `/robots.txt` and `/sitemap.xml` are fully static.
- `/opengraph-image` is static; the per-product image route is dynamic, because it renders from the product in the URL.
- `/api/revalidate/catalog` is a POST route handler, so it has nothing to prerender.

## Client JavaScript

The home page loads 16 scripts, 205 KB transferred. The largest chunk, 72 KB, is React DOM with Next's router. A second 46 KB chunk is the rest of the framework. A `noModule` polyfill chunk is served but modern browsers skip it. Nothing in the bundle is application state management or a UI kit: the app's own client components are small leaves, listed in `docs/static-vs-dynamic.md`.
