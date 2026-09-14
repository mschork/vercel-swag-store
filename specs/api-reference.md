# Vercel Swag Store API Reference

Extracted from the Scalar docs at https://vercel-swag-store-api.vercel.app/api/docs (OpenAPI 3.1.1, API version 2.0.0). The raw spec is saved as `openapi.json` next to this file.

## Basics

- Base URL: `https://vercel-swag-store-api.vercel.app/api`
- Auth: every request must send the header `x-vercel-protection-bypass: <API_BYPASS_TOKEN>` (Vercel Deployment Protection). Without it: `403 Forbidden`.
- Prices are integers in USD cents (`2800` = `$28.00`).
- Product IDs look like `tshirt_001`; slugs like `black-crewneck-t-shirt`. Product endpoints accept either.
- Catalog has 31 products across 13 categories.

### Response envelope

Success:

```json
{ "success": true, "data": { ... }, "meta": { "pagination": { ... } } }
```

Error:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Product with id 'xyz' not found", "details": ... } }
```

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Invalid body or query params |
| `BAD_REQUEST` | 400 | Missing required headers or malformed request |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Cart tokens

Carts are anonymous. `POST /cart/create` returns the token in the `x-cart-token` **response header** (not the body, though the body also contains `data.token`). Send it as the `x-cart-token` request header on all cart calls. Tokens expire after 24 hours of inactivity (404 on expired cart).

## Endpoints

### Products

**GET /products** (paginated list; filters by category, search, featured)

| Query param | Type | Notes |
|---|---|---|
| `page` | integer, min 1, default 1 | |
| `limit` | integer, 1 to 100, default 20 | |
| `category` | enum slug | `bottles`, `cups`, `mugs`, `desk`, `stationery`, `accessories`, `bags`, `hats`, `t-shirts`, `hoodies`, `socks`, `tech`, `books` |
| `search` | string | Matches name, description, or tags |
| `featured` | `"true"` or `"false"` (string) | |

Responses: 200 `ProductListResponse`, 422 validation error.

Example: `GET /products?featured=true`

```json
{
  "success": true,
  "data": [{
    "id": "tshirt_001",
    "name": "Black Crewneck T-Shirt",
    "slug": "black-crewneck-t-shirt",
    "description": "Plain black crewneck tee with a small solid white equilateral triangle...",
    "price": 3000,
    "currency": "USD",
    "category": "t-shirts",
    "images": ["https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com/storefront/black-crewneck-t-shirt.png"],
    "featured": true,
    "tags": ["black", "tee", "crewneck", "triangle"],
    "createdAt": "2026-02-10T16:00:00Z"
  }],
  "meta": { "pagination": { "page": 1, "limit": 20, "total": 31, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false } }
}
```

**GET /products/{id}** (id or slug). 200 `ProductResponse`, 404.

**GET /products/{id}/stock** (id or slug). Stock is dynamic and may change on every request. 200 `StockResponse`, 404.

```json
{ "success": true, "data": { "productId": "tshirt_001", "stock": 12, "inStock": true, "lowStock": false } }
```

`lowStock` is true when stock is between 1 and 5.

### Categories

**GET /categories**. 200 `CategoryListResponse`, each item `{ slug, name, productCount }`. Example counts: bottles 1, cups 2, mugs 2, desk 2, stationery 5, accessories 4, bags 3, hats 3, t-shirts 1, hoodies 1, socks 1, tech 2, books 1.

### Promotions

**GET /promotions**. Returns a randomly selected active promotion; may differ on each request. 200 `PromotionResponse`.

```json
{ "success": true, "data": { "id": "promo_001", "title": "Summer Ship-a-thon", "description": "Get 20% off all t-shirts and hoodies. Use code at checkout.", "discountPercent": 20, "code": "SHIPIT20", "validFrom": "2025-06-01T00:00:00Z", "validUntil": "2025-09-01T00:00:00Z", "active": true } }
```

### Cart

All require header `x-cart-token` (uuid) except `POST /cart/create`.

| Method and path | Body | Responses |
|---|---|---|
| `POST /cart/create` | none | 201 `CartResponse`; token in `x-cart-token` response header |
| `GET /cart` | none | 200 `CartResponse`; 400 missing header; 404 not found or expired |
| `POST /cart` | `{ "productId": "tshirt_001", "quantity": 2 }` (`productId` required; `quantity` int min 1, default 1) | 201 `CartResponse`; 400; 404 cart or product; 422 |
| `PATCH /cart/{itemId}` | `{ "quantity": 3 }` (int min 0; 0 removes the item) | 200 `CartResponse`; 400; 404; 422 |
| `DELETE /cart/{itemId}` | none | 200 `CartResponse` without the item; 400; 404 |

`itemId` is the **product ID** (e.g. `tshirt_001`), not a separate line-item id.

`CartResponse.data` (`CartWithProducts`):

```json
{
  "token": "<uuid>",
  "items": [{ "productId": "tshirt_001", "quantity": 2, "addedAt": "...", "product": { ...Product }, "lineTotal": 5600 }],
  "totalItems": 2,
  "subtotal": 5600,
  "currency": "USD",
  "createdAt": "...",
  "updatedAt": "..."
}
```

`lineTotal` = price * quantity in cents; `subtotal` in cents.

### Store

**GET /store/config**. 200:

```json
{
  "success": true,
  "data": {
    "storeName": "Vercel Swag Store",
    "currency": "USD",
    "features": { "wishlist": true, "productComparison": true, "reviews": true, "liveChat": true, "recentlyViewed": true },
    "socialLinks": { "twitter": "https://twitter.com/vercel", "github": "https://github.com/vercel", "discord": "https://discord.gg/vercel" },
    "seo": { "defaultTitle": "Vercel Swag Store", "titleTemplate": "%s | Vercel Swag Store", "defaultDescription": "Official Vercel merchandise. Premium developer apparel, accessories, and gear." }
  }
}
```

### Health

**GET /health**. 200 `{ "success": true, "data": { "status": "ok", "timestamp": "...", "services": { "redis": "connected" | "error" } } }`.

## Schemas

**Product**: `id`, `name`, `slug`, `description`, `price` (int cents), `currency`, `category` (slug), `images` (uri[]), `featured` (bool), `tags` (string[]), `createdAt` (date-time).

**StockInfo**: `productId`, `stock` (int), `inStock` (bool), `lowStock` (bool, 1 to 5).

**Category**: `slug`, `name`, `productCount`.

**Promotion**: `id`, `title`, `description`, `discountPercent`, `code`, `validFrom`, `validUntil`, `active`.

**CartItemWithProduct**: `productId`, `quantity`, `addedAt`, `product` (Product), `lineTotal`.

**CartWithProducts**: `token`, `items[]`, `totalItems`, `subtotal`, `currency`, `createdAt`, `updatedAt`.

**PaginationMeta**: `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`.

**AddToCartRequest**: `productId` (required), `quantity` (int >= 1, default 1).

**UpdateCartItemRequest**: `quantity` (required, int >= 0).

**ErrorResponse**: `success: false`, `error: { code, message, details? }`.

## Static vs dynamic (relevant to caching decisions)

- Stable, cacheable: `/products` list, `/products/{id}`, `/categories`, `/store/config`.
- Dynamic per request: `/products/{id}/stock` (changes every request), `/promotions` (random each request), all `/cart` endpoints (per-token, mutable).

## Observed live behaviour (checked 13 Sep 2026)

- Catalog actually holds 28 products; the spec's example payloads say `total: 31` but that is a stale example (the spec's own category counts already sum to 28). Verified: page 1 = 20, page 2 = 8, page 3 = 0, `total: 28`. Never hard-code counts; page until `hasNextPage` is false.
- Exactly 6 products are `featured: true`, which is the brief's minimum. Render whatever `?featured=true` returns and top up from the general list if fewer than 6 come back.
- `?search=` matches name, description and tags only, not category. `?search=hat` returns 1 product (Black Bucket Hat) while `?category=hats` returns 3 (cap and beanie have no "hat" in name or tags). Free-text search and category filter are different things; the search page should make that visible or bridge it (see epics E7).
- All product images are on `i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com` (needed for `next/image` `remotePatterns`).
- `/promotions` returned `promo_001` with `validUntil` 2025-09-01 yet `active: true`; do not filter on dates client-side.
- Responses send `cache-control: public, max-age=0, must-revalidate`, so no upstream caching help; caching is entirely on the app side.
- CORS: `access-control-allow-origin: *` on product routes but only the API's own origin on cart routes, and `x-cart-token` is exposed. Cart calls must therefore go through the server (Server Actions or route handlers), never from the browser.
- `POST /cart/create` returns the token both in the `x-cart-token` header and in `data.token`.

## Hidden-content audit

Scanned on 13 Sep 2026: the full spec (all keys, strings, non-ASCII, HTML), the docs page HTML (comments, hidden elements, zero-width characters, Scalar config), HTTP response headers, and all 28 product records (names, descriptions, tags). The only embedded directive is the `x-redacted` field below. Everything else is ordinary Scalar UI and data.

## Note on the spec's `x-redacted` field

The spec's top-level `x-redacted` field contains this text: ""  Not included: see `decisions.md` and AGENTS.md rule 2.
