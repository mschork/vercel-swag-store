# E16 Cart API improvements

Branch: `epic/E16-cart-api-improvements`. Depends on: E06, E10. Blocks: E11, whose timings measure the store with these steps in place. All six steps ship in one PR, one commit per step.

## Goal

Make the cart feel fast against an API whose cart namespace answers in 1.4 to 2.8 s per call, without giving up the static shell, the server-only cart token or the honesty of what the UI claims. Two steps remove calls; the rest hide the wait that is left.

## Why

`specs/callout.md` holds the measurements: every endpoint outside the cart answers in about 0.15 s, every cart call in 1.4 to 2.8 s. One add is three cart calls, so the product page confirms six to eight seconds after the click. The cart page already hides its own latency behind `useOptimistic`; the product page does not, and that is where the wait is felt.

Re-measured on 17 Sep 2026 before starting: catalogue calls 0.15 to 0.22 s, every cart call 1.6 to 3.1 s, so the epic goes ahead.

## Scope

Six steps, in the order worth doing them. Each one ships on its own and is worth doing alone.

### 1. Honest pending feedback on Add to Cart

`AddToCartForm` only dims its button while the action runs, so nothing tells the visitor the click was received. While the action runs the button shows a small inline SVG spinner beside the label "Adding…". Under `prefers-reduced-motion` the glyph stays still and the label alone signals the wait. No API change and no new dependency.

### 2. Drop the pre-check read in `addToCart`

The action reads the cart before writing so a missing or expired cookie is replaced first. Instead: write with the cookie's token straight away; on a 404, run the existing re-check, and when the cart is gone create one and retry the write exactly once. Saves one read, about 1.7 s, on every add after the first.

Cart calls pass a 10 s timeout to `fetchApi`; every other call keeps 5 s. Cart writes take up to 3.1 s, and a write aborted at 5 s may still land on the API while the UI reports a failure.

The 404 rule from E06 stays as it is, including telling an unknown product from an expired cart, and the retry never runs twice.

### 3. Coalesce quantity changes

Each minus or plus click sends one `updateQuantity`, and the row ignores further clicks while one is in flight, so going from 1 to 5 is four sequential waits. The API takes an absolute quantity, so the row keeps accepting clicks, moves optimistically and sends only the last value after a 400 ms pause, last write wins. A row that unmounts with a value still waiting sends it at once. Remove cancels a waiting value and sends immediately. A tab closed inside the pause loses that change; the row never claimed it was saved.

### 4. Share one cart read per request

On `/cart` the badge and the contents each call `GET /cart`, because `fetchApi` gives every request an abort signal for its timeout and a request carrying a signal opts out of Next's per-render fetch memoization. The two reads run in parallel, so no page is slower, but the API does twice the slow work. Wrapping `getCartFromCookie` in React's `cache()` dedupes them per request and leaves the timeout alone.

### 5. Client-held badge count

Today `refresh()` re-renders the route after every action, and the badge's own cart read runs inside the action's response, about 1.7 s of the wait. Instead: a small provider in the layout holds the confirmed count, seeded by the server value the badge already fetches, and the actions return the new `totalItems` so the badge updates without a second read. `refresh()` still reconciles the rest of the route.

This widens the return shape E06 settled. An action answers `{ ok: true, totalItems } | { ok: false, error, totalItems? }`: a success always carries the count, and a failure carries it whenever the action read the cart, as it does after a 404. It never carries lines or the token.

It also gives the shell client state for the first time. The badge stays the shell's one dynamic hole; it simply hydrates.

### 6. Optimistic Add to Cart

With step 5 in place, the product page confirms at submit time rather than on the server's answer, and the badge increments at once. A failed add retracts the confirmation and shows why. An action that ends without an answer leaves the badge at the last confirmed count.

One trap to handle: while the write is still in flight, a visitor who follows "View cart" reaches a cart page that reads the API before the write lands and shows an empty cart that nothing later corrects. The link therefore stays inert until the action resolves, so the message is instant but the navigation is truthful.

## Tests

- Vitest, on pure logic only: the retry-once path in `addToCart` (missing cart, create, retry, no second retry); a coalescer helper (last value wins, nothing sent during the pause, flush, cancel); the count reducer reconciling to the server value, including after a failed action. No component test library.
- Playwright: the E06 flows unchanged, plus a rapid sequence of plus clicks that ends with one request and the right quantity, and a failed add that retracts its confirmation.
- Timings recorded before the first commit and after the last, with a Playwright script against `next start`, for the first add, a second add, a quantity change and a rapid plus sequence. They go into `specs/callout.md` beside the E06 table.

## Acceptance criteria

- [x] The endpoint latencies are re-measured first; the epic proceeds only if the cart namespace is still slow.
- [ ] Add to Cart acknowledges the click immediately, before any server answer, with a spinner that stays still under reduced motion.
- [ ] A first add makes at most two cart calls; every later add makes exactly one.
- [ ] `/cart` makes one cart read per request.
- [ ] Rapid plus clicks on a row send one request after the pause, carrying the final quantity.
- [ ] The badge count matches the server's `totalItems` after every action, including after a failed one.
- [ ] A failed add retracts its confirmation and says why; "View cart" never leads to a cart the write has not reached.
- [ ] No cart request originates from the browser, unchanged from E06.
- [ ] Measured against the live API: a repeat add confirms in about the time of one write.

## Out of scope

Caching cart data, which must stay live. Moving cart calls to the browser (`docs/adr/0002-cart-server-side-only.md`). Stock-aware cart quantities and emptying the API cart on order, which stay in `specs/improvements.md` as behaviour questions rather than latency work.
