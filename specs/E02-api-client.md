# E02 API client and data layer

Branch: `epic/E02-api-client`. Depends on: E01. Blocks: E03 to E07.

## Goal

One typed, server-only access layer for the Vercel Swag Store API where every function carries an explicit cache policy, so pages never decide caching on their own.

## Reference

`specs/api-reference.md` and `specs/openapi.json`. Base URL `https://vercel-swag-store-api.vercel.app/api`. Header `x-vercel-protection-bypass` on every request.

## Scope

### Files

```
apps/store/lib/api/
  client.ts        fetchApi<T>() core, ApiError, envelope unwrapping
  types.ts         Product, StockInfo, Category, Promotion, Cart, CartItem, Pagination, StoreConfig
  products.ts      getProducts, getProduct, getAllProductSlugs
  categories.ts    getCategories
  stock.ts         getStock
  promotions.ts    getPromotion
  cart.ts          createCart, getCart, addCartItem, updateCartItem, removeCartItem
  store.ts         getStoreConfig
  cache.ts         tag constants and cacheLife profiles
apps/store/lib/format.ts   formatPrice(cents, currency)
apps/store/lib/api/*.test.ts
```

Mark every file in `lib/api` with `import 'server-only'` so a client import fails at build time.

### client.ts

- `fetchApi<T>(path, init?)`: builds the URL from `API_BASE_URL`, merges the bypass header, sets `accept: application/json`, parses JSON, and returns `data` (and `meta` when present) from the envelope. On `success: false` or non-2xx, throws `ApiError { status, code, message, details }`.
- Never sets Next `fetch` cache options itself; caching is done with `"use cache"` at the function level so the policy is visible in one place. Pass `cache: 'no-store'` is not needed under Cache Components; leave fetch defaults.
- Accepts an optional `headers` map for `x-cart-token`.
- Return raw `Response` headers to callers that need them (`createCart` reads `x-cart-token`).

### types.ts

Hand-written from the spec (not generated, to keep the dependency list short and the types readable). Prices are `number` in cents; document that on the type. Add `ProductListResult = { products: Product[]; pagination: Pagination }`.

### cache.ts

```ts
export const TAGS = { products: 'products', categories: 'categories', store: 'store', cart: 'cart', sanity: 'sanity' } as const
```

Cache profiles: define custom `cacheLife` profiles in `next.config.ts` under `cacheLife`: `catalog` (stale 300, revalidate 3600, expire 86400) [assumption: numbers can be tuned in E11]. Use the built-in `'hours'` if custom profiles complicate the build.

### products.ts

- `getProducts({ page, limit, category, search, featured })` wrapped in `"use cache"` with `cacheTag(TAGS.products)` and `cacheLife('catalog')`. Arguments form the cache key automatically; keep the argument object serialisable and stable (sort keys, drop `undefined`).
- `getProduct(idOrSlug)` same policy; throws `ApiError` 404 which pages turn into `notFound()`.
- `getAllProductSlugs()` pages through `/products?limit=100` until `hasNextPage` is false; used by `generateStaticParams` in E05.

### categories.ts, store.ts

`"use cache"` with their tags and the `catalog` profile.

### stock.ts, promotions.ts

Plain async functions, no `"use cache"`, and a comment stating why (values change per request). Callers must render them inside `<Suspense>`.

### cart.ts

- Plain async functions taking `token` explicitly; no `cookies()` here so the module stays testable. Cookie handling lives in `app/cart/actions.ts` (E06).
- `createCart()` returns `{ cart, token }` where `token` is read from the `x-cart-token` response header, falling back to `cart.token`.
- `getCart(token)` maps API 404 to `null` (expired or unknown token) instead of throwing.
- `addCartItem(token, productId, quantity)`, `updateCartItem(token, productId, quantity)`, `removeCartItem(token, productId)` return the updated `Cart`.

### format.ts

`formatPrice(cents, currency = 'USD', locale = 'en-US')` using `Intl.NumberFormat`; `$28.00` style. Unit tests for 0, 800, 6500, 123456.

## Tests (Vitest)

- `client.test.ts`: envelope unwrap, error mapping (400, 404, 422, 500), header merging, token never appears in thrown error messages. Mock `fetch` with `vi.stubGlobal`.
- `products.test.ts`: `getAllProductSlugs` pages correctly with a mocked two-page response.
- `cart.test.ts`: `createCart` prefers the header token; `getCart` returns `null` on 404.
- `format.test.ts`.
- One opt-in integration test (`API_INTEGRATION=1`) that hits the live API for `/products?limit=1` and `/health`, skipped by default.

## Acceptance criteria

- [ ] Every endpoint in `api-reference.md` has a typed function.
- [ ] `import 'server-only'` present in every `lib/api` module; a deliberate client import fails the build.
- [ ] `pnpm test` passes; coverage on `lib/api` above 80 percent [assumption on threshold].
- [ ] `grep -r NEXT_PUBLIC_API` returns nothing.
- [ ] Cache policy table in `AGENTS.md` matches the code.

## Out of scope

Sanity fetches (E09), cookies and Server Actions (E06), UI.

## Open questions

1. Generate types with `openapi-typescript` instead of hand-writing? [assumption: hand-write; 12 endpoints is small and the generated names are ugly]
2. Cache durations for catalogue data: minutes or hours? [assumption: 1 h revalidate, 24 h expire; product data has been static since February]
