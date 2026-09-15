# E06 Cart

Branch: `epic/E06-cart`. Depends on: E02, E03, E05. Blocks: E07 badge behaviour only indirectly.

## Goal

A session-persistent cart backed by the API, driven entirely by Server Actions, with a dedicated `/cart` page, a live badge in the header and a demo order that ends on a static `/checkout` page.

## Design

- The API cart token is a bearer credential; it lives in an httpOnly cookie named `cart_token`, `sameSite: 'lax'`, `secure` in production, `path: '/'`, `maxAge: 60 * 60 * 24`. The cookie is created lazily inside the first `addToCart` and set again with the same `maxAge` after every successful action, so its expiry slides with the API's 24 h idle expiry. Pages never set cookies.
- All API cart calls happen on the server (`docs/adr/0002-cart-server-side-only.md`). The browser never sees the token.
- Cart data is never cached with `"use cache"` and carries no cache tag. Actions call `refresh()` from `next/cache`, which re-renders the dynamic holes of the current route; `updateTag` would be a no-op. Components that read the cart live inside Suspense boundaries so the shells stay static.
- Every action validates its input with zod, because Server Action input is a trust boundary, and returns `{ ok: true } | { ok: false; error: string }` with user-facing copy in `error`. No cart travels in the result; `refresh()` supplies the data.
- A cart line holds at most 99, in the stepper and in the action input. Stock is enforced only at add time on the product page.

## API behaviour

Checked against the live API on 15 Sep 2026.

- Cart writes do not check stock: quantity 999 is accepted for a product with 5 in stock, and a second add of the same product merges into its line (999 + 2 = 1001).
- `PATCH /cart/{productId}` with quantity 0 removes the line. `POST /cart` with quantity 0 is a 422 `VALIDATION_ERROR`.
- Every 404 carries the code `NOT_FOUND`. Only the message separates an unknown cart (expired or bogus token), a missing line (`PATCH`, `DELETE`) and an unknown product (`POST`), and the store never matches on message text.

## Scope

### Cookie helpers `lib/cart/cookie.ts`

- `getCartToken(): Promise<string | undefined>` reading `await cookies()`.
- `setCartToken(token)` with the options above, and `clearCartToken()`, for Server Actions only (`cookies()` is writable there).

### Cart read `lib/cart/get-cart.ts`

- `getCartFromCookie()`: token → `getCart(token)`. Returns `null` when there is no token or the API says 404, and never clears the cookie. Any other failure throws, so callers can tell an empty cart from an unavailable one.

### Server Actions `app/cart/actions.ts`

`'use server'` file. Every action calls `refresh()` and sets the cookie again after a successful write.

- `addToCart(prevState, formData)`: keeps the E05 signature, the `AddToCartState` type and its error copy. Reads the token; if it is missing or `getCart` returns `null`, `createCart()` and set the cookie. Then `addCartItem`, set the cookie again and `refresh()`. The product page stays put and shows the inline "Added. View cart" line; the badge updates through the refresh.
- `updateQuantity(productId, quantity)`: plain arguments, called from the client inside `startTransition`. `productId` is a non-empty string and `quantity` an integer in `[0, 99]`; 0 removes the line.
- `removeItem(productId)`: plain argument, called the same way.
- `placeOrder()`: the form action behind the Checkout button. No token, an expired cart or an empty cart → `redirect('/cart')`. Otherwise it clears the cookie and redirects to `/checkout`. It drops the cookie only; the lines stay in the API cart until it expires.

A 404 on a write triggers one `getCart(token)`:

- `null`: the cart expired. Clear the cookie, `refresh()` so `/cart` re-renders to the empty state, and return `{ ok: false, error: 'Your cart expired…' }`.
- A cart: the line or the product is gone. Return an error saying so and `refresh()` so the true cart shows.

A 404 alone never clears the cookie.

### Header badge `components/cart/cart-badge.tsx`

- Async server component: `loadOptional` around `getCartFromCookie()`; renders `<CartIcon count={cart?.totalItems ?? 0} />` in a `Link` to `/cart`, and `count={null}`, the icon without a count, when the cart call fails. E03's Suspense wrapper stays. The count is hidden at 0; `aria-label="Cart, N items"`.
- Because it reads `cookies()`, the badge is the only dynamic hole in the shell.

### Cart page `app/cart/page.tsx`

- `export const metadata = { title: 'Cart', robots: { index: false } }`.
- Static shell; `<Suspense fallback={<CartSkeleton />}><CartContents /></Suspense>`.
- `CartContents` (server) loads the cart. No cart or no lines → empty state with a link to `/search`. An API failure other than 404 → "Your cart could not be loaded, try again", distinct from the empty state. Otherwise one client `CartView` receiving the lines.
- `CartView` (client) holds the lines in `useOptimistic` and derives the item count and subtotal from price × quantity, which equals the API's `lineTotal`. `CartSummary` is a presentational child: subtotal via `formatPrice`, item count and the Checkout form.
- Each row: `next/image` thumbnail, name linking to the product page, unit price, `QuantityStepper` with `min={1}`, `max={99}` and `defaultValue={quantity}`, line total, remove button. A minus or plus click fires `updateQuantity` at once; a typed value fires on blur or Enter; remove fires `removeItem`.
- Each row has its own `useTransition`. While it is pending the stepper and the remove button are disabled and the row has reduced opacity. On `{ ok: false }` the optimistic value reverts and the message shows in a `role="status"` line under the row, cleared by the next successful action.

### Checkout page `app/checkout/page.tsx`

- Fully static, no cookies: heading "Thank you for your order!", one paragraph saying this is a demo store and nothing is charged, shipped or sent, and one link "Continue shopping" to `/`. No link back to the cart.
- `metadata`: `robots: { index: false }`. Copy hard-coded here; E09 reads it from the Sanity `checkoutPage` singleton with this copy as fallback.

### Expiry handling

If a render finds a token but the API says 404, the page shows the empty state and the badge shows no count. The cookie stays until an action replaces or clears it: the next add creates a new cart, and a write on `/cart` clears it. The README (E12) documents this.

### Tests

- Vitest: input validation for all four actions; the 404 re-check (a missing line keeps the cookie, a missing cart clears it); the expired branch and the sliding cookie re-set, with `next/headers` `cookies` and `next/cache` `refresh` mocked; `placeOrder` redirects to `/cart` for a missing, expired or empty cart and to `/checkout` otherwise.
- Playwright `e2e/cart.spec.ts`, both flows on the first in-stock product from the featured grid (picked as `e2e/product.spec.ts` does), skipped when none is in stock:
  1. Add from the product page → badge shows 1 → `/cart` lists the line → increase to 2 → line total doubles → reload → still 2 → remove → empty state.
  2. Add → `/cart` → Checkout → "Thank you for your order!" → badge shows no count → `/cart` shows the empty state.

## Acceptance criteria

- [x] Add, update, remove and subtotal work against the live API.
- [x] Refresh and navigate-away-and-back keep the cart; a new private window has an empty cart.
- [x] Badge count matches `totalItems` after every action without a full reload.
- [x] No cart request originates from the browser (check the network tab; only Server Action POSTs to our own origin).
- [ ] `cart_token` cookie is httpOnly and secure on the deployed site.
- [x] Build output: `/cart` and `/checkout` shells static, cart contents dynamic; the badge is the only dynamic hole in the shell.
- [x] Ordering empties the cart and lands on `/checkout`.

## Out of scope

Payment, shipping and a real order, promo code application, multi-cart, merging carts across devices. Stock-aware cart quantities and emptying the API cart on order are in `specs/improvements.md`.
