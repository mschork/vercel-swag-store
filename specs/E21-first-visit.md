# E21 The first visit renders on the server

Branches: `epic/E21-first-visit`, then `epic/E21-fade-and-noscript`. Depends on: E19. Blocks: nothing. Two PRs, each from `main`.

## Goal

A visitor without a visit gets the product page's stock line, quantity input and Add to Cart, and the promotion under the header, in the HTML stream: as fast as a visitor who has one. Before this epic they arrived after JavaScript had downloaded, hydrated and `POST /api/visit` had drawn the catalogue. The number a visitor reads never changes on the page they are looking at, and it is the number the visit then holds (`docs/adr/0006-the-stable-visit.md`).

## The opening draw

An opening draw (`CONTEXT.md`) is a stock draw or promotion read made while rendering for a visitor who has no visit yet.

- `StockAndCart`, the product page's dynamic hole: with a visit it reads the visit, as before. Without one it awaits `getStock(product.id)` inside the same `<Suspense>` and passes the count down as the draw. A call that fails, or takes longer than `OPENING_DRAW_DEADLINE_MS`, renders the hole as it rendered before this epic: the skeleton, filled when the visit opens.
- The promotion: without a visit, `VisitSeed` and `PromoBanner` share one request-memoized `getPromotion()`. The banner renders it and the seed carries it to the provider. A failed call leaves the reserved box empty until the visit opens.
- Grid badges are not drawn on the server: a listing would cost one live call per product on every render without a cookie. They wait for the visit.
- A render without a cookie therefore makes one promotion call on every route and one stock call on a product page, for crawlers and link previews as much as for people.

## Handing it back

A page cannot set a cookie, so the browser hands the opening draws to `POST /api/visit` and the route keeps them.

- The body is optional JSON: at most one product's draw and one promotion. The route reads a body only from a JSON request, which a cross-site form cannot send, so a cross-site POST still achieves nothing.
- The visit wins: a handed-back value is used only where the visit holds nothing for it.
- Every value is checked at the boundary: the draw is a whole number within `CART_MAX_QUANTITY`, the product id is in the catalogue, the promotion parses with `PromotionSchema`. A value that fails is dropped and drawn fresh; the request is not refused.
- A hand-back that fails leaves no visit, and the next load makes a new opening draw, which may differ.

## Getting the stock draw into the open call

The seed and the stock hole hydrate in separate boundaries and in no reliable order (the spike below).

- The stock area carries a `data-opening-draw` attribute on the Suspense fallback and on the resolved hole, so it is in the static HTML before hydration.
- A seed that finds no visit and sees the marker holds `openVisit()` until the stock component registers its draw with the provider, or `OPENING_DRAW_WAIT_MS` passes. `reset()` and the top-up of an incomplete visit do not wait.
- `OPENING_DRAW_DEADLINE_MS` is 2 s and `OPENING_DRAW_WAIT_MS` is 5 s, defined side by side, with a test that the server's is the smaller. The client's clock starts later, so a number in the HTML cannot arrive after the client stopped waiting.
- A draw that registers after the open call has left is discarded, and the component shows the skeleton until the visit lands. That happens on a client-side navigation to a product page while the visit is opening; nothing was painted yet, so no number is shown twice.

## Add to Cart without a visit

The form is in the HTML, so it can be submitted before the visit opens.

- With JavaScript, an add waits for an open call still in flight, so the action never opens a second visit beside it and the two cookies never race.
- A form posted before hydration reaches the action with no visit. The form carries the opening draw it showed, and `drawFor(productId, { shown })` opens a visit holding that one product with that number, since an action can set a cookie. The visit wins over `shown`, and a `shown` that fails validation is drawn fresh. A quantity change on the cart page opens no visit.

## Without JavaScript (second PR)

- One notice under the header, in a `<noscript>`: "Thank you for your visit. Unfortunately not all functionality can be served to your browser if Javascript is not enabled."
- The same `<noscript>` holds one style rule that hides every skeleton, so none spins forever. That includes the product page's buy panel: React reveals a streamed hole with an inline script, so a browser without JavaScript receives the panel in the HTML and never shows it.

## Badge fade (second PR)

A grid badge whose number arrives after first paint fades in: opacity, `BADGE_FADE_MS` of about 200 ms, no animation with reduced motion. A badge the server rendered from the visit does not animate. The box is reserved, so nothing moves.

## Spike

Done on 21 Sep 2026 in a throwaway worktree; nothing from it merges. Chromium against a local production build, five runs for each of eight conditions (fast and slow-4G with 4x CPU; the hole delayed by 0, 50, 300 and 2000 ms).

1. The seed's effect and the stock component's hydration have no fixed order. Throttled, the seed always came first, by about 25 ms.
2. Registering in render or in a layout effect, `queueMicrotask` (4 of 40), `setTimeout(0)` (5 of 40), `requestIdleCallback` (24 of 40) and the `load` event (25 of 40) do not get the draw into the call.
3. Holding the call while the static HTML carries the marker got it in on 40 of 40.
4. A client-side navigation while the visit is opening produces an opening draw that differs from the visit's.

Unverified by the spike: WebKit, Firefox, and streaming on Vercel.

## Out of scope

An inline head script that opens the visit before hydration; server draws for grid badges; a server-side store for visits; signing the hand-back; the cart page's double read.

## Acceptance

First PR, against a production build:

- [ ] With no cookie, a product page's response, read as text, holds the stock line, the quantity input and the Add to Cart button, and every route's response holds the promotion.
- [ ] With no cookie, the number in a product page's raw HTML, the number after the visit opens and the number after a reload are the same, in Chromium and Firefox. WebKit cannot run against a local build: it obeys `upgrade-insecure-requests` on localhost and refuses the `Secure` cookie, so Safari is part of the check by hand below.
- [ ] A client-side navigation to a product page while the visit is opening never shows two numbers.
- [ ] On the throttled mobile profile the first visit's buy panel appears within 0.3 s of a return visit's. A filmstrip of the home page and a product page, before and after, is recorded.
- [ ] The route ignores a handed-back value the visit already holds, drops one that fails validation, and reads no body from a request that is not JSON.
- [ ] An add with no visit opens one holding the number the form showed, and an add above it is refused.
- [ ] Build output marks every page as before.
- [ ] `pnpm verify` passes.
- [ ] On the Vercel preview, by hand in a private window, in Chrome and in Safari: the product page's number survives a reload.

Second PR:

- [ ] With JavaScript disabled, every page shows the notice and no skeleton.
- [ ] A badge that arrives after first paint fades in; with reduced motion, and on a return visit, it does not.
- [ ] `pnpm verify` passes.
