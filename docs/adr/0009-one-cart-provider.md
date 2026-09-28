---
status: accepted
date: 2026-09-29
---

# The browser holds the cart in one provider, with writes in flight as plain state

The badge, every stock count, the favourites row and the cart page show the same cart. The browser held it in four places: a count provider, the visit provider, a module store of adds in flight and one of cart-page changes. Each cart answer was copied into all four by hand, and the cart page kept its own copy of the lines, with rules for an answer that arrives while the page loads.

`CartProvider` in the root layout now holds the cart: the saved lines, seeded from the session on a full load and replaced by each answer, the writes in flight and a row's unsaved quantity. `shownLines()` in `lib/cart/lines.ts` combines them, and every surface reads the result. Writes still run one at a time (`lib/cart/in-order.ts`), and a row still saves after a pause (`lib/cart/coalesce.ts`).

## Considered options

- **`useOptimistic` over the saved lines.** The shortest version, and what a comparable storefront does. Rejected because `useOptimistic` needs a transition, and React holds a navigation until every pending transition ends: the cart link did nothing until an add answered, 1.4 to 2.8 s later.
- **One module store with `useSyncExternalStore`.** Keeps every rule of the four places and saves little.

## Consequences

- A product page kept hidden in `<Activity>` while the visitor changes the cart counts the change when the save answers, not when the page is shown again.
- The cart page shows the provider's lines once it has hydrated, and the server's render only until then. A change made in another tab, or the correction `reconcileCart` writes after a cart page view, shows after a full load.
- The cart page says only the last failed add, until the next write or until the page closes.
