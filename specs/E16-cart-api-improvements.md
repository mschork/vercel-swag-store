# E16 Cart API improvements (stretch)

Branch: `epic/E16-cart-api-improvements`. Depends on: E06. Blocks: nothing. Attempt only after E12 is release-ready; it must never delay the release.

## Goal

Make the cart feel fast against an API whose cart namespace answers in 1.4 to 2.8 s per call, without giving up the static shell, the server-only cart token or the honesty of what the UI claims. Two steps remove calls; the rest hide the wait that is left.

## Why

`specs/callout.md` holds the measurements: every endpoint outside the cart answers in about 0.15 s, every cart call in 1.4 to 2.8 s. One add is three cart calls, so the product page confirms six to eight seconds after the click. The cart page already hides its own latency behind `useOptimistic`; the product page does not, and that is where the wait is felt.

Re-measure before starting. If the API's cart endpoints have become fast, this epic is dropped rather than built.

## Scope

Six steps, in the order worth doing them. Each one ships on its own and is worth doing alone.

### 1. Honest pending feedback on Add to Cart

`AddToCartForm` only dims its button while the action runs, so nothing tells the visitor the click was received. The button takes a pending label and the status line says the add is in progress. No API change, no optimism, and it removes most of the "is this broken" feeling for the price of a few lines.

### 2. Drop the pre-check read in `addToCart`

The action reads the cart before writing so a missing or expired cookie is replaced first. Instead: write with the cookie's token straight away; on a 404, run the existing re-check, and when the cart is gone create one and retry the write exactly once. Saves one read, about 1.7 s, on every add after the first.

The 404 rule from E06 stays as it is, including telling an unknown product from an expired cart, and the retry never runs twice.

### 3. Coalesce quantity changes

Each minus or plus click sends one `updateQuantity`, and the row ignores further clicks while one is in flight, so going from 1 to 5 is four sequential waits. The API takes an absolute quantity, so the row keeps accepting clicks, moves optimistically and sends only the last value after a short pause, last write wins. Needs a timer per row and a rule for a page left before it fires.

### 4. Share one cart read per request

On `/cart` the badge and the contents each call `GET /cart`, because `fetchApi` gives every request an abort signal for its timeout and a request carrying a signal opts out of Next's per-render fetch memoization. The two reads run in parallel, so no page is slower, but the API does twice the slow work. Wrapping `getCartFromCookie` in React's `cache()` dedupes them per request and leaves the timeout alone.

### 5. Client-held badge count

Today `refresh()` re-renders the route after every action, and the badge's own cart read runs inside the action's response, about 1.7 s of the wait. Instead: a small provider in the layout holds the count, seeded by the server value the badge already fetches, and the actions return the new `totalItems` so the badge updates without a second read. `refresh()` still reconciles the rest of the route.

This widens the return shape E06 settled, where an action answers `{ ok: true } | { ok: false, error }` and never carries cart data. Returning a count is a deliberate revision, to be agreed rather than assumed, and it is the smallest carve-out that works.

It also gives the shell client state for the first time. The badge stays the shell's one dynamic hole; it simply hydrates.

### 6. Optimistic Add to Cart

With step 5 in place, the product page confirms at submit time rather than on the server's answer, and the badge increments at once. A failed add retracts the confirmation and shows why.

One trap to handle: while the write is still in flight, a visitor who follows "View cart" reaches a cart page that reads the API before the write lands and shows an empty cart that nothing later corrects. The link therefore stays inert until the action resolves, so the message is instant but the navigation is truthful.

## Tests

- Vitest: the retry-once path in `addToCart` (missing cart, create, retry, no second retry); the coalescing rule (last value wins, nothing sent during the pause); the badge count reconciling to the server value, including after a failed action.
- Playwright: the E06 flows unchanged, plus a rapid sequence of plus clicks that ends with one request and the right quantity, and a failed add that retracts its confirmation.
- Timings recorded before and after, the same way `specs/callout.md` records them now.

## Acceptance criteria

- [ ] The endpoint latencies are re-measured first; the epic proceeds only if the cart namespace is still slow.
- [ ] Add to Cart acknowledges the click immediately, before any server answer.
- [ ] A first add makes at most two cart calls; every later add makes exactly one.
- [ ] `/cart` makes one cart read per request.
- [ ] Rapid plus clicks on a row send one request after the pause, carrying the final quantity.
- [ ] The badge count matches the server's `totalItems` after every action, including after a failed one.
- [ ] A failed add retracts its confirmation and says why; "View cart" never leads to a cart the write has not reached.
- [ ] No cart request originates from the browser, unchanged from E06.
- [ ] Measured against the live API: a repeat add confirms in about the time of one write.

## Out of scope

Caching cart data, which must stay live. Moving cart calls to the browser (`docs/adr/0002-cart-server-side-only.md`). Stock-aware cart quantities and emptying the API cart on order, which stay in `specs/improvements.md` as behaviour questions rather than latency work.
