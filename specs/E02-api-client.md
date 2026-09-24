# E02 API client and data layer

Branch: `epic/E02-api-client`. Depends on: E01. Blocks: E03 to E07.

## Goal

One typed, server-only access layer for the Vercel Swag Store API where every function carries an explicit cache policy, so pages never decide caching on their own.

## Reference

`specs/api-reference.md`. Base URL `https://vercel-swag-store-api.vercel.app/api`. Header `x-vercel-protection-bypass` on every request, whether or not the API is enforcing Deployment Protection at the time (it was not on 14 Sep 2026; the documented contract is that it is).

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
  store.ts         getStoreConfig, getHealth
  schemas.ts       zod schemas; types.ts infers from these
  cache.ts         tag constants and cacheLife profiles
apps/store/lib/format.ts   formatPrice(cents, currency)
apps/store/lib/api/*.test.ts
apps/store/vitest.config.mts  aliases server-only to an empty module; loads test/setup.ts
apps/store/test/setup.ts      stubs next/cache (cacheTag, cacheLife, updateTag, revalidateTag)
```

Mark every file in `lib/api` with `import 'server-only'` so a client import fails at build time.

### client.ts

- `fetchApi<T>(path, init?)`: builds the URL from `API_BASE_URL`, merges the bypass header, sets `accept: application/json`, parses JSON, and returns `data` (and `meta` when present) from the envelope. On `success: false` or non-2xx, throws `ApiError { status, code, message, details, path }`. The JSON body is parsed only when the `content-type` is JSON; otherwise (Vercel's HTML 401 for a bad bypass token, a gateway 502) the error is `code: 'HTTP_ERROR'`, `message` from `statusText`, `details: undefined`. Response bodies never appear in error messages.
- Build-time failures: `fetchApi` throws on network errors and non-2xx responses during prerender exactly as at runtime, and nothing catches it there, so `next build` fails if the API is unreachable or the bypass token is wrong (see `callout.md`). A deploy with an empty store is worse than a failed build. The wrong-token case cannot be demonstrated while the API is not enforcing protection; the PR says so.
- Never sets Next `fetch` cache options itself; caching is done with `"use cache"` at the function level so the policy is visible in one place. Pass `cache: 'no-store'` is not needed under Cache Components; leave fetch defaults.
- Accepts an optional `headers` map for `x-cart-token`.
- Timeout: `signal: AbortSignal.timeout(5000)` on every request. Retry once on network error or 5xx for GETs only (never for cart mutations), with a 250 ms backoff. Timeouts surface as `ApiError` code `TIMEOUT` and are not retried, so a request never takes longer than about 5.3 s. Every catch block around an API call, in `fetchApi` and in components, calls `unstable_rethrow(error)` before handling: when a prerender completes while an uncached fetch is pending, Next rejects that fetch with an internal error React expects to receive, and it must not be retried or wrapped as `NETWORK_ERROR`. `lib/load-optional.ts` holds the rethrow, log and return `null` shape for data a component can render without.
- Return raw `Response` headers to callers that need them (`createCart` reads `x-cart-token`).

### Validation with zod (boundary rule)

Add `zod` (v4). It is used at exactly three trust boundaries and nowhere else: environment variables, API responses, Server Action inputs (E06). Components never import zod.

- `lib/env.ts`: replace the E01 manual guard with a zod schema for the server env: `API_BASE_URL` (url), `API_BYPASS_TOKEN` (min length 1, required even while the API is not enforcing protection), `NEXT_PUBLIC_SITE_URL` (url, default `http://localhost:3000`). Sanity vars are added to this schema by E09, not here. Parse once at module load and export the typed object; `instrumentation.ts` keeps importing the module so a missing variable stops the server at startup. Keep `NEXT_PUBLIC_*` in a separate client-safe schema.
- `lib/api/schemas.ts`: zod schemas for `Product`, `StockInfo`, `Category`, `Promotion`, `Cart`, `CartItem`, `Pagination`, `StoreConfig`, the success envelope and the error envelope. Use `z.object()` (zod v4 strips unknown keys by default) so new API fields never break parsing; `z.looseObject()` is not used because its index signature makes every inferred type accept any key and collapses `Omit<Cart, 'token'>`. `CartSchema` omits `token` from its shape so parsing drops it and the `Cart` type has no token field (see `docs/adr/0002-cart-server-side-only.md`). `PromotionSchema` is wrapped as `data: PromotionSchema.nullable()`.
- `fetchApi` takes the schema as an argument and calls `schema.parse(json)`; a parse failure throws `ApiError` with code `INVALID_RESPONSE` and is logged with the path (never the body of a cart, which may contain the token).

### types.ts

Types are inferred from the zod schemas (`export type Product = z.infer<typeof ProductSchema>`), so there is one source of truth. Prices are `number` in cents; document that on the schema with `.describe()`. Add `ProductListResult = { products: Product[]; pagination: Pagination }`.

### cache.ts

```ts
export const TAGS = { products: 'products', categories: 'categories', store: 'store', cart: 'cart', sanity: 'sanity' } as const
```

Cache profiles: one custom `cacheLife` profile in `next.config.ts`: `catalog` (stale 300, revalidate 3600, expire 86400).

### products.ts

- `getProducts({ page?, limit?, category?, search?, featured? })` with `category: string` (not the OpenAPI enum; rule 6) and `featured: boolean`, serialised to the API's `'true' | 'false'` inside. Wrapped in `"use cache"` with `cacheTag(TAGS.products)` and `cacheLife('catalog')`. Arguments form the cache key automatically; keep the argument object serialisable and stable (sort keys, drop `undefined`).
- `getProduct(idOrSlug)` same policy; throws `ApiError` 404 which pages turn into `notFound()`.
- `getAllProductSlugs()` pages through `/products?limit=100` until `hasNextPage` is false, itself under `"use cache"` with the products tag so `generateStaticParams` (E05) and the sitemap share one entry.

### categories.ts, store.ts

`getCategories()` and `getStoreConfig()` use `"use cache"` with their tags and the `catalog` profile. `getHealth()` in `store.ts` is uncached and used only by the integration test (see `callout.md`).

### stock.ts, promotions.ts

Plain async functions, no `"use cache"`, and a comment stating why (values change per request). Callers must render them inside `<Suspense>`. `getPromotion()` returns `Promotion | null`: `null` when `data` is null or `active` is false.

### cart.ts

- Plain async functions taking `token` explicitly; no `cookies()` here so the module stays testable. Cookie handling lives in `app/cart/actions.ts` (E06).
- `createCart()` returns `{ cart, token }` where `token` is read from the `x-cart-token` response header, falling back to the raw body's `token` before the schema strips it. It is the only function that returns a token.
- `getCart(token)` maps API 404 to `null` (expired or unknown token) instead of throwing.
- `addCartItem(token, productId, quantity)`, `updateCartItem(token, productId, quantity)`, `removeCartItem(token, productId)` return the updated `Cart`. The API's `{itemId}` path segment is the product id, not a line-item id.

### format.ts

`formatPrice(cents, currency = 'USD', locale = 'en-US')` using `Intl.NumberFormat`; `$28.00` style. Unit tests for 0, 800, 6500, 123456.

## Tests (Vitest)

- Setup: `vitest.config.ts` aliases `server-only` to an empty module and `test/setup.ts` stubs `next/cache`, so cached functions are tested as they ship (see `callout.md`). Coverage via `@vitest/coverage-v8`.
- `client.test.ts`: envelope unwrap, error mapping (400, 404, 422, 500, and a non-JSON 401 to `HTTP_ERROR`), header merging, retry once on 5xx GET and never on POST or timeout, token never appears in thrown error messages. Mock `fetch` with `vi.stubGlobal`.
- `products.test.ts`: `getAllProductSlugs` pages correctly with a mocked two-page response.
- `cart.test.ts`: `createCart` prefers the header token; `getCart` returns `null` on 404; the returned `Cart` has no `token` field.
- `format.test.ts`.
- One opt-in integration test (`API_INTEGRATION=1`) that hits the live API for `/products?limit=1` and `/health`, skipped by default.

## Acceptance criteria

- [x] Every endpoint in `api-reference.md`, including `/health`, has a typed function.
- [x] `import 'server-only'` present in every `lib/api` module; a deliberate client import fails the build.
- [x] `pnpm test` passes; coverage on `lib/api` above 80 percent.
- [x] No `token` field on the `Cart` type; `grep -n token apps/store/lib/api/types.ts` returns nothing, and only `createCart` in `cart.ts` returns a token.
- [x] `grep -r NEXT_PUBLIC_API` returns nothing.
- [x] Cache policy table in `AGENTS.md` matches the code.

## Out of scope

Sanity fetches (E09), cookies and Server Actions (E06), UI.

## Note on E01

E01 shipped `lib/env.ts` as a manual guard on purpose; this epic replaces it with the zod schema. E01's spec records the no-zod choice as what was built at the time.
