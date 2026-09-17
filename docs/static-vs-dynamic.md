# Static versus dynamic

One table for the whole store: what is cached, what is live, and what makes cached data change. This is the core of the caching model; `docs/build-output.md` shows the build output that proves it.

## By route

| Route | Static shell | Dynamic holes | Cache tags behind the shell | What refreshes it |
|---|---|---|---|---|
| `/` | Hero, featured grid, chrome | Promo strip, cart badge | `products`, `categories`, `store` | Hourly revalidate, or `POST /api/revalidate/catalog` |
| `/products/[slug]` | Gallery, name, price, description, breadcrumb, JSON-LD | Stock with Add to Cart, promo strip, cart badge | `products`, `categories`, `store` | Same |
| `/search` | Heading, search form, results region | Results grid, form state, promo strip, cart badge | `products`, `categories` | Same. Results themselves vary by `searchParams`, and each argument set is cached on its own |
| `/cart` | Heading, skeleton box, chrome | Cart contents, promo strip, cart badge | `store` (chrome only) | Cart data is never cached |
| `/checkout` | Whole page | Promo strip, cart badge | `store` | Same |
| `/robots.txt`, `/sitemap.xml` | Whole file | none | `products` for the sitemap's product URLs | Same |

## By data source

| Data | Function | Policy | Tag | Lifetime |
|---|---|---|---|---|
| Product list, product by slug, featured grid | `lib/api/products.ts` | `"use cache"` | `products` | `catalog`: stale 5 min, revalidate 1 h, expire 1 d |
| Categories | `lib/api/categories.ts` | `"use cache"` | `categories` | Same |
| Store config | `lib/api/store.ts` | `"use cache"` | `store` | Same |
| Stock | `lib/api/stock.ts` | never cached | none | Read per request |
| Promotion | `lib/api/promotions.ts` | never cached | none | Read per request |
| Cart | `lib/api/cart.ts`, `app/cart/actions.ts` | never cached | none | Read per request from the cookie; Server Actions call `refresh()` |
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

Seventeen, all interactive leaves. No page or layout is a client component. The search form's fields are a server component, rendered as the fallback while the client form hydrates, so the form works without JavaScript.

| Component | Why it is client-side |
|---|---|
| `cart/cart-count`, `cart/cart-view`, `cart/cart-line`, `cart/cart-summary` | Hold the badge count, optimistic lines and pending state |
| `product/add-to-cart-form` | Optimistic confirmation and the pending button |
| `quantity-stepper` | Clamps the value, disables at bounds, announces changes |
| `product/gallery-thumbnails` | Selected image is local state |
| `search/search-form-client`, `search/search-transition`, `search/results-error` | Debounced search, shared pending state, retry |
| `nav-link`, `pending-scope` | Read the current path and the pending navigation |
| `sticky-header` | `IntersectionObserver` for the scrolled hairline |
| `promo-marquee` | Measures the text to set the scroll duration |
| `error-boundary` | React has no hook equivalent |
| `app/error.tsx` | Next requires it |
| `ui/separator` | The shadcn wrapper around Base UI |

## Rules that keep the shell static

- Anything reading `cookies()`, `headers()` or `searchParams` renders inside a Suspense boundary. The cart badge, the cart contents and the search results are the three cases.
- `/search` passes the `searchParams` promise down without awaiting it; awaiting it in the page would make the whole route dynamic.
- Every fetch of API data lives in `apps/store/lib/` behind a typed function with an explicit policy. No component fetches directly.
- Cart calls are server-only, so the cart token never reaches the browser (`docs/adr/0002-cart-server-side-only.md`).
