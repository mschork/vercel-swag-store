# E23 A cart change costs one cart call

Branch: `epic/E23-cart-page-one-call`. Depends on: E06, E16, E19. Blocks: nothing. One PR.

## Goal

A quantity change or a removal on the cart page takes 4.2 to 4.7 s to save, and makes two calls to the slow cart API: the write, and a read of the same cart (`callout.md`, "Cart latency after E16"). The read happens because the action sets the cart cookie again and calls `refresh()`, which re-renders the cart page inside the action's response, and the page reads the cart to render its lines. The write has already answered with that cart. This epic returns its lines and drops the re-render, so a change costs the write and nothing more.

## The actions

- `updateQuantity` and `removeItem`, on success: answer `{ ok: true, totalItems, line, lines }`, where `lines` is `toLines(cart)` of the cart the write returned. They neither set the cart cookie nor call `refresh()`, because either one re-renders the route. `lines` holds what a row shows and never the token.
- Every other path is unchanged and still refreshes: a 404 and its re-check, an expired cart, a line the API left above the visit's draw.
- `addToCart` is unchanged. The quick-add row under the cart relies on its re-render to drop the product just added.
- The cart cookie therefore slides only with an add, and no longer with a quantity change or a removal. Its one day counts from the visitor's last add. A visitor who changes quantities for a day without adding anything loses the cookie while the API still holds the cart; the next add opens a new one. That is the price of not re-rendering, and the cookie's value cannot say how old it is, so an action cannot slide it only when it is due.

## The cart page

- `CartView` holds the confirmed lines as state, seeded from the server's `lines` and replaced when a render brings new ones. `useOptimistic` sits on that state as it sat on the prop.
- A row applies `result.lines` in the transition that ends its save, with the count and the message, so the optimistic lines give way to the saved ones in one paint. Actions run one at a time, so the last answer is the newest cart; a change still in flight on another row stays applied on top of it.
- A row also confirms its `line` to the visit provider, so what remains of a product follows a change made on the cart page.
- The favourites row under the cart is rendered with the lines of the last full render. A product removed from the cart returns to that row on the next load, not at once.

## Out of scope

`addToCart` and the quick-add row; a count cookie for the header badge; removing the `next-action` header check from the badge and the seed, which `addToCart` still needs.

## Acceptance

Against a production build:

- [ ] A quantity change and a removal each make one cart call, counted on the server.
- [ ] One plus click saves in about the time of one cart write plus the pause, down from 4.2 to 4.7 s.
- [ ] The rows, the summary, the header badge and what remains of a product are right after a change, after a removal, after two rows changed in quick succession, and after a failed change.
- [ ] Removing the last line shows the empty cart without a reload.
- [ ] A reload after any of these shows the same cart.
- [ ] Build output marks every page as before, and `pnpm verify` passes.
- [ ] Before and after timings are recorded in `callout.md`.
