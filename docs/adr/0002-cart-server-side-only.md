---
status: accepted, partly superseded by ADR-0007
date: 2026-09-14
---

# Cart calls go through the server even though the API allows browser calls

The Swag Store API's cart endpoints accept any `Origin`, allow `PATCH` and `DELETE`, and expose the `x-cart-token` header, so a client component could call them directly. We call them only from Server Actions and route handlers because the cart token is a bearer credential: anyone holding it can read and change that cart. Keeping it in an httpOnly cookie, and stripping `token` from the `Cart` object the data layer returns, means the token never appears in JavaScript, in a Server Action's return value, or in the RSC payload.

## Considered options

- Browser calls with the token in `localStorage` or a readable cookie: fewer server round trips, but the token is exposed to any script on the page.
- Server-only calls with an httpOnly cookie: chosen. Costs one server hop per cart action, which Server Actions already need for `useOptimistic` and revalidation.

## Consequences

- `lib/api/cart.ts` takes the token as an explicit argument and never reads `cookies()`, so it stays unit-testable; cookie handling lives in `lib/cart/cookie.ts`, which only the Server Actions in `app/cart/actions.ts` write through. Superseded: the token lives only in the session store, where the Server Actions save it, and no cookie carries it (`0007-the-session-store.md`).
- The `Cart` type has no `token` field. `createCart()` is the only function that returns the token, read from the response header.
- Earlier notes said CORS forced this. It did not; the reason above is the one that holds if the API's CORS policy changes again.
