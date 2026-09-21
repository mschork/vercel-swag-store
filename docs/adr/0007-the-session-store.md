---
status: accepted
date: 2026-09-22
---

# The store keeps each visitor's state in Redis under a session id

The store had one memory per visitor and it lived in the browser: a `visit` cookie with the stock draws and the pinned promotion (`0006-the-stable-visit.md`) and a `cart_token` cookie with the API's credential for the cart (`0002-cart-server-side-only.md`). Every page then had to ask the cart API for the cart, at 1.6 to 2 s a read, and a page render could not write a cookie, so a first visit needed the browser to hand the numbers it had been shown back to a route handler.

The store now sets one cookie, a random session id, and keeps the visitor's state on the server in Upstash Redis under that id: the visit, the cart token and a mirror of the cart as the API last answered it. The API stays the source of truth for every number; the store adds the memory and reads from it. This supersedes the "Consequences" of 0006 that describe the cookie's size, the hand-back and the held open call, and the cookie in 0002.

## Considered options

- **Keep the cookies and mirror only the cart.** Fewer changes, but two cookies to explain, and an add still had to set one, which re-renders the route inside the action's response.
- **Vercel's Global Config (Edge Config).** Reads are fast but writes propagate over seconds and are rate limited; a cart mirror is written on every add.
- **Postgres or a Sanity dataset.** Both hold visitor state a long way from what they are for, and both need a client dependency. Redis expiries do the lifetime work for free.
- **The official Redis integration over TCP.** Needs a client package and connection handling inside serverless functions. Upstash speaks HTTP, so plain `fetch` does.
- **Pending lines in Redis.** An add would write its line before calling the API. Rejected because Next runs one Server Action at a time per browser: a second quick add reaches the server only when the first has finished, so its line would be missing from the store for the whole save. Pending lines live in the browser instead.
- **Streaming the API's cart over the mirror.** Brings back the two-second wait and a number that changes after it was shown.

## Consequences

- The mirror is trusted until it expires. Only the store's own server holds the token, so nothing else can change the cart; the mirror can only drift if the API expires the cart or a write half-fails. Each cart page view re-reads the API in `after()` and corrects the mirror for the next render, so drift lasts one view and never changes a page on screen.
- Because the token lives only in Redis, a Redis outage makes the cart unreachable. The store degrades rather than fails: stock is drawn from the API and shown without being kept, and the cart says it is unavailable, never that it is empty. Redis calls time out after 300 ms so a render never waits on them.
- The store needs `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without them an in-memory adapter serves one process, which is what a reviewer's clone, CI and the unit tests get. State then lasts as long as the process.
- The session cookie is functional, not tracking: it holds a random id, is httpOnly, and identifies a browser and nothing more. It lasts 30 days and is set only when missing.
- Actions never set a cookie and never call `refresh()`, so every action's response carries only what it saved. The header badge and the cart view take their state from those answers.
- The proxy runs on every page request and on prefetches. It mints an id with no I/O and never reads Redis, in line with Next's guidance for the proxy. The build's route table and time to first byte are unchanged locally; the Vercel CDN path is verified by the epic's first slice.
- A first visit is drawn on the server: the layout's seed hole draws every product and the product page's hole draws its own, and Redis makes the first write win, so the two always agree and no browser ever tells the server a number.
- Two visitors still see different stock for the same product. This remains a demonstration of inventory.
- The cart is never cached with `"use cache"`. The mirror is the store's own write-through copy, updated by the actions that change the cart, which is how a real shop holds a cart.
