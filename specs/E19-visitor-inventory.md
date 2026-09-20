# E19 Visitor inventory

Branch: `epic/E19-visitor-inventory`. Depends on: E05, E06, E16, E18. Blocks: nothing. One throwaway spike, then four slices, one PR each; each leaves `main` shippable.

## Goal

Give every visitor a stable stock count per product, so the store behaves like one with real inventory: a product that is out of stock stays out of stock, grids can say so, a cart cannot hold more than exists, buying reduces what is left, and cross-sell rows offer only what can be bought.

## Why

`specs/callout.md` holds the measurements. `GET /products/{id}/stock` answers with a fresh uniform draw from 0 to 29 on every request, the product payload carries no stock field, and `POST /cart` accepts any quantity of anything. Stock in this API is a number without memory.

The store so far reads that number once, on the product page, and nowhere else, because a number that changes on reload cannot be shown on a grid. That is defensible and it is also a store without stock management: nothing sells out, the cart accepts 530 of a product that reads 14, and the favourites row can recommend a product whose own page says "Out of stock".

The API cannot hold a stock count, so the store holds one per visitor. Every count still comes from the API: the store asks once per product and keeps the answer.

## The brief

`specs/assignment.md` asks for "real-time stock availability", a stock indicator "fetched from the provided API", a quantity selector "respecting stock limits" and an Add to Cart button "disabled when the product is out of stock". All four still hold, and the last two become true for the first time, because a limit that is redrawn before the add lands was never a limit:

- Every count is an answer from `GET /products/{id}/stock`. Nothing is invented or derived from a hash.
- What the visitor sees is live in the sense that matters to them: the count minus what their own cart holds, updated on every cart action.
- The product page keeps its Suspense hole. The static and dynamic split is unchanged.

## Vocabulary

These go into `CONTEXT.md`.

- **Stock draw**: one answer from the stock endpoint for one product. The store asks once per product per inventory.
- **Inventory**: a visitor's stock draws, held in the `inventory` cookie. One per visitor, 24 hours.
- **Remaining**: a product's draw minus the quantity of it in the visitor's cart. This is the number every surface shows and enforces.

## The inventory

### Shape

An httpOnly cookie named `inventory`, `sameSite: lax`, `secure` in production, `path: /`:

```json
{ "v": 1, "drawnAt": 1790000000, "stock": { "bottle_001": 14, "pin_001": 0 } }
```

- It expires 24 hours after `drawnAt` and does not slide. A new day is a restock. Rewrites keep the original `drawnAt` and set `maxAge` to the time left.
- It is parsed with zod on every read, because a cookie is input. Anything malformed counts as no inventory. Counts are whole numbers from 0 to `CART_MAX_QUANTITY`.
- It is not signed. A visitor who edits it changes only what their own browser is offered, against an API that accepts any quantity anyway. A signing secret would be one more server-only variable protecting nothing.
- A cookie holds about 4 KB. At about 27 URL-encoded bytes per product this design carries roughly 150 products; the catalogue's 28 take 745 bytes. The route handler logs and truncates nothing: past the limit it stores what fits, in catalogue order, and the rest render "Stock unavailable". A larger catalogue needs a server-side store, which is out of scope.

It lives in a cookie because the store has no database. Sanity is the only datastore the repo writes to, and visitor state does not belong in a content dataset.

### Opening it

Pages cannot set cookies, so the inventory is opened by `POST /api/inventory`, called once by the client when the visitor has none.

- The handler reads the cookie, lists the catalogue with the cached `getAllProducts()`, and draws stock with `getStock()` for every product id the inventory lacks, eight at a time. It writes the cookie and answers `{ stock }`.
- A draw that fails is left out and is drawn on the next call. A product missing from the inventory renders "Stock unavailable" with Add to Cart disabled, as a failed stock call does today.
- It takes no input and returns only the caller's own counts, so a cross-site POST achieves nothing.
- A route handler and not a Server Action: actions run one at a time per client and re-render the route when they set a cookie, so an Add to Cart clicked in the first second would queue behind the draws.
- The same call tops the inventory up when the catalogue gains a product.

### Reading it

- `lib/inventory/cookie.ts`, server-only: `getInventory()`, `setInventory()`. Same split as `lib/cart/cookie.ts`.
- `lib/inventory/remaining.ts`, pure and safe for client components: `remaining(draw, inCart)`, `availability(remaining)` returning the existing `StockStatus` shape from `lib/stock-status.ts`, which now takes a count instead of the API's `StockInfo`. The low-stock threshold is a named constant of 5, which is where the API's own `lowStock` flag turns over.
- `lib/inventory/open.ts`, client-safe: the typed `openInventory()` that posts to the handler. No `fetch` in a component.
- `lib/api/stock.ts` is unchanged: never cached, one call per product. Only its callers change.

### Reaching the client

The pattern is `CartCountProvider` again.

- `InventoryProvider` wraps the layout beside `CartCountProvider`. It holds `stock` and `inCart`, both keyed by product id, and keeps no data of its own.
- `InventorySeed` is a server component in the root layout inside `<Suspense fallback={null}>`. It runs on a full load and on `refresh()`, not on a client-side navigation, because the root layout is preserved across those; the provider is therefore the client's source of truth and a seed that finds no cookie never resets it. It reads the inventory cookie and the cart through the request-memoized `loadCart`, so it adds no API call to a request that renders the badge. Inside an action's response it skips the cart, as the badge does. It renders a client leaf that seeds the provider and, when the cookie is absent or lacks a catalogue id, calls `openInventory()` once.
- Cart actions answer with the touched line as well as the count: `{ ok: true, totalItems, line: { productId, quantity } }`. The provider applies it, so remaining moves at once and without a read. The result still never carries the token or the other lines.
- `useRemaining(productId)` returns `number | undefined`; `undefined` means the inventory has not arrived.

The shell stays prerendered. The layout already reads a cookie inside a boundary for the badge; this is a second read of the same kind.

## Spike

Done on 20 Sep 2026 on a throwaway branch; nothing from it merges and the findings go into the slice 1 PR.

1. The cookie the route handler sets reaches the seed after `router.refresh()`, after a reload and in a second tab, but not after a client-side navigation, because the root layout is preserved across those. The provider holds the draws, so nothing on screen is wrong.
2. Build output marks every page ◐ with the seed in the layout, as before.
3. `lowStock` is true for 1 to 5 and false at 0 and 6 upwards, over 400 samples.
4. A full 28-product draw takes about 1.05 s at concurrency 8 and 0.59 s at 16, with no failures and no rate limiting.
5. The catalogue serialises to 745 URL-encoded bytes.

One thing stayed unverified: the preview answers 302 and the project has no automation bypass, so the walk could not be driven on Vercel. It ran against the same production build locally.

## Slice 1: a stable count on the product page

Visible result: a product's stock is the same on every reload, and the quantity selector's limit is one the add respects.

- `lib/inventory/*`, the route handler, the provider and the seed, as above.
- `StockAndCart` keeps its Suspense boundary on the product page. It reads the inventory cookie instead of calling `getStock`, and hands the product's draw to a client leaf that subtracts `inCart` and renders the stock line and `AddToCartForm`. With no inventory yet it hands over nothing, and the leaf shows the existing `StockSkeleton` boxes until the provider has the opened inventory. Every count on screen therefore comes from the inventory; the page never shows a draw that the inventory then contradicts.
- Labels: "In stock", "Only N left", "Out of stock", "Stock unavailable" as today, all from remaining. When remaining is 0 because the visitor's cart holds the whole draw, the line reads "All N are in your cart".
- JSON-LD: the Offer's availability comes from the draw the hole read, and is omitted when there is none. It can disagree with the page only when the visitor's own cart holds the whole draw. The store is `noindex`.
- `AddToCartForm` takes `max` and `disabled` from remaining. Its optimistic add reduces remaining through the provider and restores it when the add fails.

## Slice 2: the cart respects the inventory

Visible result: the cart cannot hold more than the draw, and an order reduces what is left.

- `addToCart` reads the inventory. A product the inventory lacks is drawn there and then and the cookie rewritten. A quantity above the draw is refused before any API call. The write stays first and read-free (E16 step 2): the API's answer carries the line's new quantity, and only when that exceeds the draw does the action set the line back to the draw with `updateCartItem` and answer "Only N available." The second slow call is paid on a violation only.
- `updateQuantity` refuses a quantity above the draw. `CART_MAX_QUANTITY` stays as the ceiling for the cookie's counts.
- `CartContents` passes each line its draw as the stepper's `max`. A line holding more than its draw, which happens when the inventory was redrawn while the cart lived on, says "Only N available", and Checkout stays disabled until the line is reduced or removed.
- `placeOrder` already reads the cart. It subtracts each line from the inventory, writes the cookie, then drops the cart cookie as before. It redirects to `/cart` when any line exceeds its draw.
- `specs/improvements.md` loses "Stock-aware cart quantities".

## Slice 3: grids say what is available

Visible result: an out-of-stock product is badged wherever it appears, and the cart page cross-sells only what can be bought.

- `CardStock`, a small client leaf inside `ProductCard`, over the photo like the price pill, so it shifts nothing. It renders "Out of stock" at remaining 0 and "Only N left" under the threshold, and nothing otherwise or before the inventory arrives. The card stays one link; a badge is not interactive. The grids stay static: the leaf reads the provider, not the request.
- The favourites row on `/cart` is already inside the page's dynamic hole. `CartContents` adds every product with remaining 0 to `exclude`, and `FavouriteProducts` already fetches `exclude.length` deeper to refill the row. On the home page the row is static, so an unavailable favourite is badged, not removed.
- Search keeps its ranking and its cap of five. A result that is out of stock is badged.

## Slice 4: Add to Cart on the cart page's favourites

Visible result: adding from the row puts the product in the cart, and the refresh replaces its card with the next available favourite.

- `ProductGrid` gains an optional per-card slot rendered in the list item after the card, outside the link. Only `CartContents` uses it.
- `QuickAddForm`: a native `<form action>` posting `addToCart` with the product id and a quantity of 1, a small button, the E16 spinner, and an error line. No stepper. It needs no stock read of its own, because the row holds only products with remaining above 0 and the action enforces the draw.
- The added card leaves the row when `refresh()` lands, and the next available favourite takes its place. The swap is not animated; React's view transitions are still experimental in Next 16.

## Documents

These land on `main`, each with the slice that makes it true, so no document describes behaviour that has not shipped.

- With slice 1: `docs/adr/0006-visitor-inventory.md` (the trade-off: the store holds state the API should hold; cookie over database; unsigned). `specs/decisions.md` and `AGENTS.md`: the API stays the source of every stock count, and the store holds a visitor's draws for 24 hours; the cache policy row for stock becomes "drawn once per visitor into the `inventory` cookie by `POST /api/inventory`; never in `"use cache"`; read inside `<Suspense>`". `CONTEXT.md`: the three terms. `specs/callout.md`: the stock callout is rewritten from "cannot be handled properly" to what the store does about it; the measurements section stays as the evidence. `specs/E05-product-detail.md`: the stock sentences.
- With slice 2: `specs/improvements.md`.

## Tests

- Vitest, pure logic only: cookie parse and serialize, including malformed, expired and oversized input; `remaining` and `availability` across the threshold and at 0; top-up of missing ids; the order subtraction, never below 0; the add path (refused above the draw, set back after an over-long line, one draw for an unknown product). The route handler with `getStock` mocked: partial failure leaves ids out, a second call fills them.
- Playwright: every test sets the `inventory` cookie through `context.addCookies`, so stock is known. The three `test.skip` calls for "no featured product is in stock" go, and the visual suite stops masking the stock line. New flows: the count survives a reload; a product at 0 is badged on the listing and disabled on its page; adding the whole draw turns the page to "All N are in your cart"; an order reduces the next visit's count; on `/cart` a quick add replaces the card.
- One integration test, opt-in like the others: `POST /api/inventory` against the live API fills every catalogue id.

## Acceptance criteria

- [ ] A product's stock is the same on every reload and on every surface for 24 hours, then is drawn again.
- [ ] Every count in the inventory is an answer from `GET /products/{id}/stock`; nothing is generated by the store.
- [ ] A new visitor costs one stock call per product, once. No page render calls the stock endpoint.
- [ ] Build output marks every page as a partial prerender, as before.
- [ ] No cart request and no stock request originates from the browser; the browser calls only `POST /api/inventory`.
- [ ] A cart line never exceeds its draw, whatever is posted to the actions.
- [ ] An add within the draw makes the same number of cart calls as before this epic.
- [ ] An order reduces the visitor's inventory by its lines.
- [ ] An out-of-stock product is badged on the home, listing, search and favourites grids, and the favourites row on `/cart` never shows one.
- [ ] Remaining follows every cart action without a cart read, including a failed add.
- [ ] With the `inventory` cookie set, the e2e suite has no stock-dependent skip and no masked stock line.

## Out of scope

A server-side inventory store, and with it stock shared between visitors: two visitors each see their own draws, which a real store would never allow and a cookie cannot fix. A "hide unavailable" filter or a stock sort on the listing. Back-in-stock notices. Stock on Sanity-driven surfaces. Signing the cookie. Reserving stock while a product sits in a cart across devices.
