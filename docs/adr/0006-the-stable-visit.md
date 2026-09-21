---
status: accepted
date: 2026-09-20
---

# The store holds each visitor's stock and promotion, because the API cannot

Two of the Swag Store API's endpoints answer at random rather than with a fact. `GET /products/{id}/stock` returns a fresh uniform draw from 0 to 29 on every request, and the product payload carries no stock field. `GET /promotions` returns one of four active promotions, picked per request. Neither has any memory, and `POST /cart` accepts any quantity of anything, so a cart could hold 530 of a product whose page had just said 14.

A storefront cannot be built on that. Nothing ever sells out, a grid cannot show a number that changes on reload, and the discount code a visitor reads under the header is gone by the time they reach the cart. The store therefore asks the API once per visitor and keeps the answer for a day, in the `visit` cookie. Every count and every promotion still comes from the API; what the store adds is the memory.

## Considered options

- **Call the stock endpoint on every render, as before.** Honest about the API and needs no state, but it makes the last two of the brief's four stock requirements unreachable: a limit redrawn before the add lands was never a limit. It also confines stock to the product page, because no grid can show a number that changes on reload.
- **Derive a count from a hash of the product id.** Stable and free, and rejected: `specs/assignment.md` asks for stock "fetched from the provided API", and a hash is not fetched from anything.
- **Hold the draws server-side, keyed by a session id.** What a real store does, and what this one would need past a hundred or so products. It wants a datastore the repo does not have; Sanity is the only one it writes to, and visitor state does not belong in a content dataset.
- **Hold them in `localStorage`.** Rejected on the point that decides it: the server cannot read it. The stock line, the grid badges and the banner are all server-rendered inside Suspense holes, and `addToCart` has to refuse a quantity above the draw. With `localStorage` the browser would have to post its own limit to the action, which is the client telling the server what it may buy, and the limit becomes a suggestion again. Grid badges would also pop in after hydration instead of arriving with the HTML.
- **Open the visit from an inline script in the head, before hydration.** It overlaps the draws with the JavaScript download and saves about a second of three on a slow phone, but the number still cannot appear before hydration. Only HTML that carries the number is as fast as a return visit, so the first render draws it (`specs/E21-first-visit.md`).
- **Draw the grid badges on the server too.** One live call per product on every listing rendered without a cookie. The badges wait for the visit.
- **An httpOnly cookie.** Chosen. The server reads it during render and in actions, so every surface agrees and the cart is enforced where it has to be.

## Consequences

- The cookie costs about 27 URL-encoded bytes per product plus 404 for the promotion, uploaded on every request to the origin. The catalogue's 28 products come to roughly 1.1 KB, and the 4 KB limit caps the design at about 135 products. Past that the route handler keeps the promotion and the products that fit; the rest render "Stock unavailable".
- Two visitors see different stock for the same product, which no real store would allow. This is a demonstration of inventory, not an inventory.
- Pages cannot set cookies, so the visit is opened by `POST /api/visit`, called once by the browser. A Server Action would have done it too, but actions run one at a time per client, so an Add to Cart clicked during the draws would queue behind them.
- A visitor without a visit is still shown a number. The product page's stock hole and the banner each make an opening draw while rendering, and the browser hands both to `POST /api/visit`, which keeps them where the visit holds nothing. This is the browser telling the server a number, which is what ruled out `localStorage`; it is acceptable here for the reason the cookie is unsigned. The visitor can already edit their visit, so the hand-back gives them nothing new, and the route checks every value and reads it from a JSON request only, which a cross-site form cannot send.
- The seed and the stock hole hydrate in no fixed order, so the open call is held until the hole has reported its draw. The server stops waiting for the API before the browser stops waiting for the hole, so a number in the HTML is always in the call. A shown number never changes on the page; after a hand-back that failed, the next load draws again.
- A render without a cookie costs one promotion call on every route and one stock call on a product page, for crawlers and link previews too.
- The cookie is not signed. A visitor who edits it changes only what their own browser is offered, against an API that accepts any quantity anyway, so a signing secret would protect nothing.
- A first-time visitor's Product JSON-LD omits the Offer's availability, because the visit does not exist yet when the page renders. The store is `noindex`, so nothing reads it that this matters to.
- The footer carries a "Reset the demo" control, because otherwise seeing a restock means waiting a day or opening a private window.
