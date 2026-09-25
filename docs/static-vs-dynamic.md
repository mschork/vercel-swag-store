# Static versus dynamic

One table for the whole store: what is cached, what is live, and what makes cached data change. This is the core of the caching model; `docs/build-output.md` shows the build output that proves it.

## By route

| Route | Static shell | Dynamic holes | Cache tags behind the shell | What refreshes it |
|---|---|---|---|---|
| `/` | Hero, featured grid, favourites row, chrome | Promo strip, cart badge | `products`, `categories`, `store`, `sanity` | Hourly revalidate, `POST /api/revalidate/catalog`, or a Sanity publish |
| `/products` | Heading, every card, the category chips | Promo strip, cart badge | `products`, `categories` | Same |
| `/products/category/[slug]` | Heading, the Sanity intro, the category's cards | Promo strip, cart badge | `products`, `categories`, `sanity` | Same |
| `/products/[slug]` | Gallery, name, price, descriptions, testimonials, questions, breadcrumb, JSON-LD | Stock with Add to Cart, promo strip, cart badge | `products`, `categories`, `store`, `sanity` | Same |
| `/search` | Heading, search form, the whole catalogue as cards, the featured section | A query's first render, form state, promo strip, cart badge | `products`, `categories`, `sanity` | Same. The browser searches the catalogue in the shell, so a search after the first render makes no request |
| `/search?category=<slug>` (no query) | Whole page, results included: rewritten to `/search/category/[slug]`, one page per category | Promo strip, cart badge | `products`, `categories` | Same as `/products/category/<slug>` |
| `/cart` | Heading, skeleton box, favourites row, chrome | Cart contents, promo strip, cart badge | `products`, `categories`, `store`, `sanity` | Cart data is never cached; it is read from the cart mirror. The browser hides favourites already in the cart or drawn at zero |
| `/checkout` | Whole page | Promo strip, cart badge | `store`, `sanity` | Hourly revalidate or a Sanity publish |
| `/md/**`, `/llms.txt` | Whole file | none | `products`, `categories`, `sanity` | Same as the pages they mirror; never live data |
| `/robots.txt`, `/sitemap.xml` | Whole file | none | `products` for the sitemap's product URLs | Same |

## By data source

| Data | Function | Policy | Tag | Lifetime |
|---|---|---|---|---|
| Product list, product by slug, featured grid | `lib/api/products.ts` | `"use cache"` | `products` | `catalog`: stale 5 min, revalidate 1 h, expire 1 d |
| Categories | `lib/api/categories.ts` | `"use cache"` | `categories` | Same |
| Store config | `lib/api/store.ts` | `"use cache"` | `store` | Same |
| Session store | `lib/session/store.ts` | never cached | none | Upstash Redis, read once per render; the visit lasts a day from its first draw, the cart mirror a day from its last save |
| Stock | `lib/api/stock.ts` | never cached | none | Drawn once per product per visit and kept in the session store |
| Promotion | `lib/api/promotions.ts` | never cached | none | Pinned once per visit and kept in the session store |
| Cart | `lib/api/cart.ts`, `app/cart/actions.ts`, `lib/cart/get-cart.ts` | never cached | none | Rendered from the cart mirror; each action writes the API and saves its answer as the mirror, and only the order calls `refresh()`; the cart page re-reads the API in `after()` for the next render |
| Health | `lib/api/store.ts` | never cached | none | Only used by the integration test |

Every call states its policy: `fetchApi` takes `cache: 'cached' | 'live'`, which also lands on the call's trace span, so a mismatch between the policy and the code is visible in the traces.

## Refreshing the catalogue without a deploy

The Swag Store API sends no webhooks, so an operator expires all three catalogue tags at once:

```sh
curl -X POST https://vercel-swag-store-ms.vercel.app/api/revalidate/catalog \
  -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET"
# {"revalidated":["products","categories","store"],"at":"…"}
```

Demonstrated on 17 Sep 2026 against a production build, with every API call logged by a fetch hook in the server:

| Step | API calls the server made |
|---|---|
| Load a product page | stock, promotions |
| Wrong secret | none, the route answers 401 |
| Right secret | none, the route only expires tags |
| Next load of the same page | product, categories, store config, stock, promotions |
| The load after that | stock, promotions |

Without the call, the same tags refresh on their own within the hour.

## Client components

Twenty-eight files carry `"use client"`, all interactive leaves. No page and no layout is one. The search form's fields are a server component, rendered as the fallback while the client form hydrates, so the form works without JavaScript.

| File | Why it is client-side |
|---|---|
| `cart/cart-count`, `cart/cart-view`, `cart/cart-line`, `cart/cart-summary` | Hold the badge count, the optimistic lines and the pending state |
| `cart/quick-add-form`, `cart/use-cart-add`, `cart/in-cart-hidden` | The quick-add row, and the adds the browser holds while they save |
| `product/add-to-cart-form`, `product/stock-and-cart-client` | Optimistic confirmation, the pending button, the visitor's own draw |
| `card-stock` | Fades a grid badge in from the visit once it is known |
| `quantity-stepper` | Clamps the value, disables at bounds, announces changes |
| `product/gallery-thumbnails` | Selected image is local state |
| `search/search-form-client`, `search/search-state`, `search/search-results-view`, `search/results-error` | The live form, the search it applies, the search over the catalogue in the browser, retry |
| `listing/chip-row`, `listing/sortable-grid` | The category chips' scroll state and the price sort, which re-orders cards already on the page |
| `nav-link`, `pending-scope` | Read the current path and the pending navigation |
| `sticky-header` | `IntersectionObserver` for the scrolled hairline |
| `promo-strip`, `promo-marquee` | Read the pinned promotion and measure the text to set the scroll duration |
| `visit/visit-provider`, `visit/reset-visit` | Hold the visitor's draws for the grids, and the control that clears them |
| `draft-mode-bar`, `draft-visual-editing` | Draft mode only; neither ships to a visitor |
| `error-boundary` | React has no hook equivalent |
| `app/error.tsx` | Next requires it |

## Rules that keep the shell static

- Anything reading `cookies()`, `headers()` or `searchParams` renders inside a Suspense boundary. The session id is a cookie, so the visit seed, the promo strip, the stock hole, the cart badge and the cart contents are such cases, and so are the search results.
- `proxy.ts` mints the session cookie with no I/O, and its matcher skips every request that already carries a valid id, so those are served from the CDN without invoking it.
- `/search` passes the `searchParams` promise down without awaiting it; awaiting it in the page would make the whole route dynamic.
- A `"use cache"` read inside a Suspense boundary is free only when the route's prerender made the same read: the resumed render reuses the prerender's entries, and on Vercel the in-memory cache behind `"use cache"` is usually empty. So the layout reads the catalogue outside the visit seed's boundary, and the cart's favourites row sits in the shell. Search reads nothing at request time after its first render: the catalogue is in the shell, and the browser searches it.
- Every fetch of API data lives in `apps/store/lib/` behind a typed function with an explicit policy. No component fetches directly.
- Cart calls are server-only, and the cart token lives only in the session store, so it never reaches the browser (`docs/adr/0002-cart-server-side-only.md`, `docs/adr/0007-the-session-store.md`).
