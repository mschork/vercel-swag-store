# E19 The stable visit

Branch: `epic/E19-stable-visit`. Depends on: E05, E06, E16, E18. Blocks: nothing. The spike is done; then four slices, one PR each, each leaving `main` shippable.

## Goal

Give every visitor a store that holds still. Stock is the same number on every page and every reload, so a product that is out of stock stays out of stock, grids can say so, a cart cannot hold more than exists, buying reduces what is left, and cross-sell rows offer only what can be bought. The promotion in the banner is the same promotion all visit, so the strip under the header stops changing its words on every navigation.

## Why

`specs/callout.md` holds the measurements. Two of the API's endpoints answer at random rather than with a fact:

- `GET /products/{id}/stock` returns a fresh uniform draw from 0 to 29 on every request. The product payload carries no stock field, and `POST /cart` accepts any quantity of anything.
- `GET /promotions` returns one of four active promotions, picked uniformly per request. Over 120 samples all four came back, none inactive, none null.

The store so far reads stock once, on the product page, and nowhere else, because a number that changes on reload cannot be shown on a grid. The banner re-rolls its promotion on every single navigation, which a visitor sees as flicker. Both are defensible and both are a store that cannot keep a promise: nothing sells out, the cart accepts 530 of a product that reads 14, the favourites row recommends a product whose own page says "Out of stock", and the discount code you just read is gone by the time you reach the cart.

The API cannot hold either fact, so the store holds them per visitor. Everything still comes from the API: the store asks once and keeps the answer.

## The requirements

The requirements ask for "real-time stock availability", a stock indicator "fetched from the provided API", a quantity selector "respecting stock limits" and an Add to Cart button "disabled when the product is out of stock". All four still hold, and the last two become true for the first time, because a limit that is redrawn before the add lands was never a limit:

- Every count is an answer from `GET /products/{id}/stock`, and every promotion an answer from `GET /promotions`. Nothing is invented or derived from a hash.
- What the visitor sees is live in the sense that matters to them: the count minus what their own cart holds, updated on every cart action.
- The product page keeps its Suspense hole, and so does the banner. The static and dynamic split is unchanged.

## Vocabulary

These go into `CONTEXT.md`.

- **Visit**: what the store remembers about one visitor for 24 hours, held in the `visit` cookie. One per visitor.
- **Stock draw**: one answer from the stock endpoint for one product. The store asks once per product per visit.
- **Inventory**: the visit's stock draws, keyed by product id.
- **Remaining**: a product's draw minus the quantity of it in the visitor's cart. This is the number every surface shows and enforces.
- **Pinned promotion**: the one promotion the visit holds, chosen by the first call to the promotions endpoint in that visit.

## The visit cookie

### Shape

An httpOnly cookie named `visit`, `sameSite: lax`, `secure` in production, `path: /`:

```json
{
  "v": 1,
  "drawnAt": 1790000000,
  "stock": { "bottle_001": 14, "pin_001": 0 },
  "promotion": { "id": "promo_002", "title": "…", "description": "…", "discountPercent": 0, "code": "AUTO", "validFrom": "…", "validUntil": "…", "active": true }
}
```

- It expires 24 hours after `drawnAt` and does not slide. A new day is a restock and a new promotion. Rewrites keep the original `drawnAt` and set `maxAge` to the time left.
- It is parsed with zod on every read, because a cookie is input. Anything malformed counts as no visit. Counts are whole numbers from 0 to `CART_MAX_QUANTITY`, and the promotion is the existing `PromotionSchema`.
- It is not signed. A visitor who edits it changes only what their own browser is offered, against an API that accepts any quantity anyway. A signing secret would be one more server-only variable protecting nothing.
- A cookie holds about 4 KB. The promotion takes 404 URL-encoded bytes and each product about 27, so the catalogue's 28 products plus a promotion come to roughly 1.15 KB, and the design carries about 135 products. Past the limit the handler stores the promotion and what stock fits, in catalogue order, and the rest render "Stock unavailable". A larger catalogue needs a server-side store, which is out of scope.

The whole promotion is stored, not its id, because the API has no endpoint that returns a promotion by id: the only way back to one is to call the random endpoint until it reappears.

It lives in a cookie because the store has no database. Sanity is the only datastore the repo writes to, and visitor state does not belong in a content dataset.

### Opening it

Pages cannot set cookies, so the visit is opened by `POST /api/visit`, called once by the client when the visitor has none. What a render without a visit shows, and how the call keeps it, is `E21-first-visit.md`.

- The handler reads the cookie, lists the catalogue with the cached `getAllProducts()`, draws stock with `getStock()` for every product id the visit lacks, eight at a time, and calls `getPromotion()` when the visit has none. It writes the cookie and answers with the stock map and the promotion.
- A draw that fails is left out and is drawn on the next call. A product missing from the visit renders "Stock unavailable" with Add to Cart disabled, as a failed stock call does today. A promotion that fails to load leaves the banner's reserved box empty, as it does today.
- Its only input is the opening draws of `E21-first-visit.md`, read from a JSON request alone, and it returns only the caller's own visit, so a cross-site POST achieves nothing.
- A route handler and not a Server Action: actions run one at a time per client and re-render the route when they set a cookie, so an Add to Cart clicked in the first second would queue behind the draws.
- The same call tops the visit up when the catalogue gains a product.

### Clearing it

`DELETE /api/visit` drops the cookie and answers `{ ok: true }`. It exists for demonstrating the epic: without it, seeing a restock means waiting a day or opening a private window.

- `ResetVisit` is a small client button in the footer, labelled "Reset the demo", with one line beneath it saying it draws fresh stock and a fresh promotion. It calls the endpoint, clears the provider and calls `refresh()`, and the seed then opens a new visit.
- It is always present, for a visitor as much as for a reader. The store is a demonstration and the button says so; hiding it behind an environment variable would make the one thing a reader wants to try the one thing they cannot reach.
- It does not touch the cart. Clearing stock while lines survive is the interesting case, and slice 2 already handles a line that exceeds its draw.

### Reading it

- `lib/visit/cookie.ts`, server-only: `getVisit()`, `setVisit()`, `clearVisit()`. Same split as `lib/cart/cookie.ts`.
- `lib/stock-status.ts` keeps everything a stock line, Offer and button derive from a count: `stockStatus(draw, inCart)` replaces the version that took the API's `StockInfo`, and `LOW_STOCK_THRESHOLD` is 5, which is where the API's own `lowStock` flag turns over. It stays one module rather than gaining a second beside it.
- `lib/visit/limits.ts`, pure, with no zod and nothing server-only, so the cart page can say what the actions enforce: `exceedsDraw(quantity, draw)` and `tooMany(draw)`.
- `lib/visit/draw.ts`, server-only: `drawFor(productId)`, the count the actions check against. It draws and stores a product the visit does not cover yet, opens a visit holding that one product when the visitor has none (`E21-first-visit.md`), and answers `null` when the draw failed and there is nothing to enforce.
- `lib/visit/open.ts`, client-safe: the typed `openVisit()` and `resetVisit()` that call the handler. No `fetch` in a component.
- `lib/api/stock.ts` and `lib/api/promotions.ts` are unchanged: never cached, one call each. Only their callers change.

### Reaching the client

The pattern is `CartCountProvider` again.

- `VisitProvider` wraps the layout beside `CartCountProvider`. It holds `stock` and `inCart`, both keyed by product id, and the pinned promotion. It keeps no data of its own.
- `VisitSeed` is a server component in the root layout inside `<Suspense fallback={null}>`. It runs on a full load and on `refresh()`, not on a client-side navigation, because the root layout is preserved across those; the provider is therefore the client's source of truth and a seed that finds no cookie never resets it. It reads the visit cookie and the cart through the request-memoized `loadCart`, so it adds no API call to a request that renders the badge. Inside an action's response it skips the cart, as the badge does. It compares the visit against the cached catalogue and renders a client leaf that seeds the provider and, when the cookie is absent or the visit does not cover every product, calls `openVisit()` once. The guard that keeps that to one call is a ref, because the repo's `react-hooks/set-state-in-effect` rule rejects a `setState` in an effect body.
- Cart actions answer with the touched line as well as the count: `{ ok: true, totalItems, line: { productId, quantity } }`. The provider applies it, so remaining moves at once and without a read. The result still never carries the token or the other lines.
- `useProductStock(productId, serverDraw?)` returns the product's draw and how many of it the cart holds. The draw is `undefined` before the visit arrives and `null` when the visit has no count for it; `serverDraw` is what the server read in this render, from the visit or as an opening draw, so a page that knows the count paints it without waiting for hydration.

The shell stays prerendered. The layout already reads a cookie inside a boundary for the badge; this is a second read of the same kind.

## Spike

Done on 20 Sep 2026 on a throwaway branch; nothing from it merges. The findings:

1. The cookie the route handler sets reaches the seed after `router.refresh()`, after a reload and in a second tab, but not after a client-side navigation, because the root layout is preserved across those. The provider holds the draws, so nothing on screen is wrong.
2. Build output marks every page ◐ with the seed in the layout, as before.
3. `lowStock` is true for 1 to 5 and false at 0 and 6 upwards, over 400 samples.
4. A full 28-product draw takes about 1.05 s at concurrency 8 and 0.59 s at 16, with no failures and no rate limiting.
5. The catalogue serialises to 745 URL-encoded bytes, and a promotion to 404.

One thing stayed unverified: the preview answers 302 and the project has no automation bypass, so the walk could not be driven on Vercel. It ran against the same production build locally.

## Slice 1: the visit exists

Visible result: a product's stock is the same on every reload, the quantity selector's limit is one the add respects, the banner keeps its promotion, and the footer can reset both.

- `lib/visit/*`, the route handler with both its methods, the provider, the seed and `ResetVisit`, as above.
- `StockAndCart` keeps its Suspense boundary on the product page. It reads the visit cookie instead of calling `getStock`, and hands the product's draw to a client leaf that subtracts `inCart` and renders the stock line and `AddToCartForm`. With no visit yet it hands over nothing, and the leaf shows the existing `StockSkeleton` boxes until the provider has the opened visit. Every count on screen therefore comes from the visit; the page never shows a draw that the visit then contradicts.
- Labels: "In stock", "Only N left", "This item is out of stock at the moment. Check back soon.", "Stock unavailable", all from remaining. When remaining is 0 because the visitor's cart holds the whole draw, the line reads "All N are in your cart".
- `PromoBanner` keeps its Suspense boundary and its reserved box, which is what stops the shell moving. It reads the pinned promotion from the visit instead of calling `getPromotion`, and renders nothing until the visit arrives. Only the route handler calls the promotions endpoint.
- JSON-LD: the Offer's availability comes from the draw the hole read, and is omitted when there is none. It can disagree with the page only when the visitor's own cart holds the whole draw. The store is `noindex`.
- `AddToCartForm` takes `max` and `disabled` from remaining. Its optimistic add reduces remaining through the provider and restores it when the add fails.

## Slice 2: the cart respects the inventory

Visible result: the cart cannot hold more than the draw, and an order reduces what is left.

- `addToCart` reads the visit. A product the visit lacks is drawn there and then and the cookie rewritten. A quantity above the draw is refused before any API call. The write stays first and read-free (E16 step 2): the API's answer carries the line's new quantity, and only when that exceeds the draw does the action set the line back to the draw with `updateCartItem` and answer "Only N available." The second slow call is paid on a violation only.
- `updateQuantity` refuses a quantity above the draw. `CART_MAX_QUANTITY` stays as the ceiling for the cookie's counts.
- `CartContents` passes each line its draw as the stepper's `max`. A line holding more than its draw, which happens when the visit was reset or redrawn while the cart lived on, says "Only N available", and Checkout stays disabled until the line is reduced or removed.
- `placeOrder` already reads the cart. It subtracts each line from the inventory, writes the cookie, then drops the cart cookie as before. It redirects to `/cart` when any line exceeds its draw.
- `specs/improvements.md` loses "Stock-aware cart quantities".

## Slice 3: grids say what is available

Visible result: an out-of-stock product is badged wherever it appears, and the cart page cross-sells only what can be bought.

- `CardStock`, a small client leaf inside `ProductCard`, over the photo like the price pill, so it shifts nothing. It renders "Out of stock" at remaining 0 and "Only N left" under the threshold, and nothing otherwise or before the visit arrives. The card stays one link; a badge is not interactive. The grids stay static: the leaf reads the provider, not the request.
- The favourites row on `/cart` is already inside the page's dynamic hole. `CartContents` adds every product with remaining 0 to `exclude`, and `FavouriteProducts` already fetches `exclude.length` deeper to refill the row. On the home page the row is static, so an unavailable favourite is badged, not removed.
- Search keeps its ranking and its cap of five. A result that is out of stock is badged.

## Slice 4: Add to Cart on the cart page's favourites

Visible result: adding from the row puts the product in the cart, and the refresh replaces its card with the next available favourite.

- `ProductGrid` gains an optional `slot(product)` rendered in the list item after the card, outside the link, so the card stays one link and no button sits inside it. `FavouriteProducts` forwards it and only `CartContents` passes one.
- `QuickAddForm`: a native `<form action>` posting `addToCart` with the product id and a quantity of 1, whose submit button is the whole card: a white tile with the photo, the name and the price, two across below md and four from md, with an "Add to cart" strip that turns to the accent colour on hover or focus, and is in it from the start on a touch screen; the accessible name "Add {name} to cart", and no link to the product page. An error line under it. No stepper. The row's heading is its own, `siteSettings.cartPage.favouritesHeading`, with the fallback "Add one of our favourites". It needs no stock read of its own, because the row holds only products with remaining above 0 and the action enforces the draw. It shares `AddingCount` with the product page's form, so both count the badge up and the stock down the same way.
- The added card leaves the row when `refresh()` lands, and the next available favourite takes its place. The swap is not animated; React's view transitions are still experimental in Next 16.

## Documents

These land on `main`, each with the slice that makes it true, so no document describes behaviour that has not shipped.

- With slice 1: `docs/adr/0006-the-stable-visit.md` (the trade-off: the store holds state the API should hold; cookie over database and over `localStorage`; unsigned). `specs/decisions.md` and `AGENTS.md`: the API stays the source of every stock count and every promotion, and the store holds a visitor's draws for 24 hours; the cache policy rows for stock and promotion become "read once per visitor into the `visit` cookie by `POST /api/visit`; never in `"use cache"`; read inside `<Suspense>`". `CONTEXT.md`: the five terms. `specs/callout.md`: the stock callout is rewritten from "cannot be handled properly" to what the store does about it, the promotion joins it, and the measurements section stays as the evidence. `specs/E05-product-detail.md`: the stock sentences.
- With slice 2: `specs/improvements.md`.

## Tests

- Vitest, pure logic only: cookie parse and serialize, including malformed, expired and oversized input, and a cookie with stock but no promotion; `remaining` and `availability` across the threshold and at 0; top-up of missing ids; the order subtraction, never below 0; the add path (refused above the draw, set back after an over-long line, one draw for an unknown product). The route handler with `getStock` and `getPromotion` mocked: partial failure leaves ids out, a second call fills them, a failed promotion leaves the rest of the visit intact, and `DELETE` drops the cookie.
- Playwright: every test sets the `visit` cookie through `context.addCookies`, so stock and the promotion are known. The three `test.skip` calls for "no featured product is in stock" go, and the visual suite stops masking the stock line and can stop masking the banner. New flows: the count survives a reload; the banner keeps its code across three navigations; a product at 0 is badged on the listing and disabled on its page; adding the whole draw turns the page to "All N are in your cart"; an order reduces the next visit's count; on `/cart` a quick add replaces the card; the footer reset draws a new visit.
- One integration test, opt-in like the others: `POST /api/visit` against the live API fills every catalogue id and pins a promotion.

## Acceptance criteria

- [x] A product's stock is the same on every reload and on every surface for 24 hours, then is drawn again.
- [x] The banner shows the same promotion for the whole visit.
- [x] Every count in the visit is an answer from `GET /products/{id}/stock` and the promotion an answer from `GET /promotions`; nothing is generated by the store.
- [x] A new visitor costs one stock call per product and one promotion call, once. No page render calls either endpoint.
- [x] Build output marks every page as a partial prerender, as before.
- [x] No cart request and no stock request originates from the browser; the browser calls only `/api/visit`.
- [x] A cart line never exceeds its draw, whatever is posted to the actions.
- [x] An add within the draw makes the same number of cart calls as before this epic.
- [x] An order reduces the visitor's inventory by its lines.
- [x] An out-of-stock product is badged on the home, listing, search and favourites grids, and the favourites row on `/cart` never shows one.
- [x] Remaining follows every cart action without a cart read, including a failed add.
- [x] The footer's reset draws a fresh visit without a reload of its own.
- [x] With the `visit` cookie set, the e2e suite has no stock-dependent skip and no masked stock line.

## Out of scope

A server-side visit store, and with it stock shared between visitors: two visitors each see their own draws, which a real store would never allow and a cookie cannot fix. A "hide unavailable" filter or a stock sort on the listing. Back-in-stock notices. Stock on Sanity-driven surfaces. Signing the cookie. Reserving stock while a product sits in a cart across devices. Pinning anything else the API rotates.
