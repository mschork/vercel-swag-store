# E06 Cart

Branch: `epic/E06-cart`. Depends on: E02, E03, E05. Blocks: E07 badge behaviour only indirectly.

## Goal

A session-persistent cart backed by the API, driven entirely by Server Actions, with a dedicated `/cart` page and a live badge in the header.

## Design

- The API cart token is a bearer credential; it lives in an httpOnly cookie named `cart_token`, `sameSite: 'lax'`, `secure` in production, `path: '/'`, `maxAge: 60 * 60 * 24` (matches the API's 24 h idle expiry).
- The cookie is created lazily inside the first `addToCart` action. Pages never set cookies.
- All API cart calls happen on the server. The browser never sees the token.
- Cart data is never cached with `"use cache"`; components that read it live inside Suspense boundaries so the shells stay static.

## Scope

### Cookie helpers `lib/cart/cookie.ts`

- `getCartToken(): Promise<string | undefined>` reading `await cookies()`.
- `setCartToken(token)` and `clearCartToken()` for use inside Server Actions only (`cookies()` is writable there).

### Cart read `lib/cart/get-cart.ts`

- `getCartFromCookie()`: token → `getCart(token)`; returns `null` when there is no token or the API says 404. Does not clear the cookie (cannot outside an action); the next action will.

### Server Actions `app/cart/actions.ts`

`'use server'` file. All actions validate input with plain checks (positive integer quantity, non-empty productId) and return `{ ok: true, cart } | { ok: false, error }` rather than throwing, so the client can show a message.

- `addToCart(prevState, formData)`: read token; if missing or `getCart` returns null, `createCart()` and `setCartToken`. Then `addCartItem`. Call `updateTag(TAGS.cart)` [Next.js 16 API for read-your-own-writes in actions; fall back to `revalidateTag` if unavailable in the installed version]. Return the cart.
- `updateQuantity(productId, quantity)`: `updateCartItem`; quantity 0 removes. Same tagging.
- `removeItem(productId)`: `removeCartItem`.
- On `ApiError` 404 for the cart in any action: clear cookie, return `{ ok: false, error: 'expired' }`.

### Header badge `components/cart/cart-badge.tsx`

- Async server component: `const cart = await getCartFromCookie()`; renders `<CartIcon count={cart?.totalItems ?? 0} />` with a `Link` to `/cart`. Wrapped in Suspense by E03. Badge hidden when count is 0; `aria-label="Cart, N items"`.
- Because it reads `cookies()`, the badge is the dynamic hole in every page; that is intended and must be the only one in the shell.

### Cart page `app/cart/page.tsx`

- `export const metadata = { title: 'Cart', robots: { index: false } }`.
- Page shell static; `<Suspense fallback={<CartSkeleton />}><CartContents /></Suspense>`.
- `CartContents` (server): `getCartFromCookie()`; empty state with a link to `/search` when null or no items; otherwise `<CartList items />` and `<CartSummary subtotal currency />`.
- `CartList` (client): renders rows with `next/image` thumbnail, name linking to the PDP, unit price, `<QuantityStepper />` bound to `updateQuantity`, line total, remove button bound to `removeItem`. Uses `useOptimistic` over the items array so quantity and removal feel instant; on `{ ok: false }` it reverts and shows the error inline. `useTransition` for pending state on each row.
- `CartSummary`: subtotal via `formatPrice`, item count, and an enabled "Checkout" button that links to `/checkout`.

### Thank-you page `app/checkout/page.tsx`

- Static page (no cookies, no params): heading "Thank you", one paragraph explaining that checkout is outside this demo and what it would involve (payment, shipping, order confirmation), a link back to `/cart` and one to `/`. Copy hard-coded here; E09 reads it from the Sanity `checkoutPage` singleton with this copy as fallback.
- `metadata`: `robots: { index: false }`.

### Add to Cart wiring

Replace the E05 stub with the real `addToCart`. After success, keep the user on the PDP with the inline "Added, view cart" message; the header badge updates because the action revalidated the cart tag and the router refreshes the dynamic hole.

### Expiry handling

If a page render finds a token but the API returns 404, the page shows the empty state; the next action clears the cookie. Document this in the README.

### Tests

- Vitest: action input validation; expired-token branch clears the cookie (mock `cookies`).
- Playwright: add from PDP → badge shows 1 → `/cart` lists the item → increase to 2 → line total doubles → reload → still 2 → remove → empty state.

## Acceptance criteria

- [ ] Add, update, remove and subtotal work against the live API.
- [ ] Refresh and navigate-away-and-back keep the cart; a new private window has an empty cart.
- [ ] Badge count matches `totalItems` after every action without a full reload.
- [ ] No cart request originates from the browser (check the network tab; only Server Action POSTs to our own origin).
- [ ] `cart_token` cookie is httpOnly and secure on the deployed site.
- [ ] Build output: `/cart` shell static, contents dynamic.

## Out of scope

Checkout, promo code application, multi-cart, merging carts across devices.
