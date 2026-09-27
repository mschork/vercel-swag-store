---
status: accepted, partly superseded by ADR-0007
date: 2026-09-20, rewritten 2026-09-27
---

# The store holds each visitor's stock, because the API cannot; the promotion is shared

Two of the Swag Store API's endpoints answer at random rather than with a fact. `GET /products/{id}/stock` returns a fresh uniform draw from 0 to 29 on every request, and the product payload carries no stock field. `GET /promotions` returns one of four active promotions, picked per request. Neither has any memory, and `POST /cart` accepts any quantity of anything, so a cart could hold 530 of a product whose page had just said 14.

A storefront cannot be built on that for stock. Nothing ever sells out, and a grid cannot show a number that changes on reload. The store therefore asks the stock endpoint once per visitor and keeps the answer for a day, in the `visit` cookie. Every count still comes from the API; what the store adds is the memory.

The promotion is different. It is display-only: nothing in the cart or checkout reads it or its code. The store reads one promotion, caches it with the catalogue for an hour, and shows it to every visitor as part of each page's static shell. The banner then paints with the header, where a per-visitor promotion streamed in after a Redis read and a `GET /promotions` call that took 1.7 to 3.1 s on production (2.2 to 5.0 s after first paint on a first visit).

## Considered options

- **Call the stock endpoint on every render, as before.** Honest about the API and needs no state, but it makes the last two of the four stock requirements unreachable: a limit redrawn before the add lands was never a limit. It also confines stock to the product page, because no grid can show a number that changes on reload.
- **Derive a count from a hash of the product id.** Stable and free, and rejected: The requirements ask for stock "fetched from the provided API", and a hash is not fetched from anything.
- **Hold the draws server-side, keyed by a session id.** What a real store does, and what this one would need past a hundred or so products. It wants a datastore the repo does not have; Sanity is the only one it writes to, and visitor state does not belong in a content dataset.
- **Hold them in `localStorage`.** Rejected on the point that decides it: the server cannot read it. The stock line and the grid badges are server-rendered inside Suspense holes, and `addToCart` has to refuse a quantity above the draw. With `localStorage` the browser would have to post its own limit to the action, which is the client telling the server what it may buy, and the limit becomes a suggestion again. Grid badges would also pop in after hydration instead of arriving with the HTML.
- **Open the visit from an inline script in the head, before hydration.** It overlaps the draws with the JavaScript download and saves about a second of three on a slow phone, but the number still cannot appear before hydration. Only HTML that carries the number is as fast as a return visit, so the first render draws it (`specs/E21-first-visit.md`).
- **Draw the grid badges on the server too.** One live call per product on every listing rendered without a cookie. The badges wait for the visit.
- **Pin the promotion per visitor too, beside the stock.** What the store first did, so the code a visitor read stayed the same all visit. It put the banner in a streamed hole on every route, behind the session read and, on a first visit, the promotion call, and the visitor gained nothing from the pin because no later step uses the code.
- **An httpOnly cookie.** Chosen. The server reads it during render and in actions, so every surface agrees and the cart is enforced where it has to be.

## Consequences

- The cookie costs about 27 URL-encoded bytes per product, uploaded on every request to the origin. The catalogue's 28 products come to roughly 1.1 KB, and the 4 KB limit caps the design at about 135 products. Past that the route handler keeps the products that fit; the rest render "Stock unavailable". Superseded: the visit lives in the session store, which has no such cap (`0007-the-session-store.md`).
- Two visitors see different stock for the same product, which no real store would allow. This is a demonstration of inventory, not an inventory.
- Pages cannot set cookies, so the visit is opened by `POST /api/visit`, called once by the browser. A Server Action would have done it too, but actions run one at a time per client, so an Add to Cart clicked during the draws would queue behind them. Superseded: the server draws the visit and claims it in the session store, and `POST /api/visit` is gone (`0007-the-session-store.md`).
- A visitor without a visit is still shown a number. The product page's stock hole makes an opening draw while rendering, and the browser hands it to `POST /api/visit`, which keeps them where the visit holds nothing. This is the browser telling the server a number, which is what ruled out `localStorage`; it is acceptable here for the reason the cookie is unsigned. The visitor can already edit their visit, so the hand-back gives them nothing new, and the route checks every value and reads it from a JSON request only, which a cross-site form cannot send. Superseded: each hole claims its own draw in the session store, and no browser hands a number back (`0007-the-session-store.md`).
- The seed and the stock hole hydrate in no fixed order, so the open call is held until the hole has reported its draw. The server stops waiting for the API before the browser stops waiting for the hole, so a number in the HTML is always in the call. A shown number never changes on the page; after a hand-back that failed, the next load draws again. Superseded: the session store keeps the first write, so the seed and the hole agree without waiting on each other (`0007-the-session-store.md`).
- A render without a cookie costs one stock call on a product page, for crawlers and link previews too. Superseded: such a render draws the whole catalogue in the layout's seed hole (`0007-the-session-store.md`).
- The cookie is not signed. A visitor who edits it changes only what their own browser is offered, against an API that accepts any quantity anyway, so a signing secret would protect nothing. Superseded: the visit lives on the server, where a visitor cannot edit it, and the session id is not signed either (`0007-the-session-store.md`).
- A first-time visitor's Product JSON-LD omits the Offer's availability, because the visit does not exist yet when the page renders. The store is `noindex`, so nothing reads it that this matters to.
- The footer carries a "Reset the demo" control, because otherwise seeing a restock means waiting a day or opening a private window. It redraws stock only.
- The promotion changes at most hourly, or when `POST /api/revalidate/catalog` expires its `promotion` tag. Pages prerendered or revalidated separately can carry different promotions, because the API picks one at random on each call; a client-side navigation keeps the root layout, so the banner does not change within one.
- A failed promotion read renders no banner and is cached for minutes, so the next revalidation asks again and the build never fails on it.
