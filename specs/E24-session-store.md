# E24 The session store

Branch: `epic/E24-session-store`. Depends on: E19, E21, E22, E23. Blocks: nothing. One PR, one commit per slice.

## Goal

Every load of the cart page and every full page load of the header badge waits on the cart API's read, which takes 1.6 to 2 s. A visitor who opens the cart while an add is saving is told the cart is empty. Both happen because the store remembers nothing between requests: it holds a cart token in one cookie and the visitor's stock draws in another, and has to ask the slow endpoint for everything else. The first visit needs a hand-back from the browser for the same reason, because a page render cannot write a cookie (`docs/adr/0006-the-stable-visit.md`).

This epic gives the store a memory. A proxy mints one session id cookie, and Upstash Redis holds, under that id, the visit, the cart token and a mirror of the cart as the API last answered. Reads come from Redis in milliseconds. Writes still go to the API, which stays the source of truth (`docs/adr/0007-the-session-store.md`). The hand-back machinery, the two cookie modules and the `next-action` checks are deleted.

Decisions that are not in this spec are in `docs/adr/0007-the-session-store.md`. The inventory of every file that touches the two cookies today is in `.scratch/session-store/inventory.md`.

## Terms

`CONTEXT.md` defines them: session, visit, stock draw, cart mirror, pending line. "Opening draw" no longer exists. The word "cache" is never used for the mirror; in this repo it means `"use cache"`.

## The session

- `apps/store/proxy.ts` runs on every request except `_next/static`, `_next/image`, `_vercel`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `llms.txt`, `/api/revalidate` and `/api/demand`. When the request carries no `sid` cookie, or one that is not a UUID, it sets one: `crypto.randomUUID()`, httpOnly, Secure, SameSite=Lax, path `/`, `maxAge` 30 days. It never reads Redis and does nothing else. A request that carries a valid `sid` passes through untouched, so the cookie is never renewed.
- `lib/session/cookie.ts` exports `SESSION_COOKIE = 'sid'`, `SESSION_MAX_AGE_SECONDS`, `isSessionId(value)` and `getSessionId()`, which reads `cookies()` and returns the id or `null`. The proxy and the cookie module share `isSessionId`.
- The id identifies a browser and nothing more. It is the only cookie the store sets. Non-negotiable 4 in `AGENTS.md` now reads: the cart token lives only on the server, in the session store, and no cookie ever carries it.
- Today's `visit` and `cart_token` cookies are ignored and left to expire. Nothing reads them and nothing deletes them.

## The store

`lib/session/store.ts` is the one module that talks to Redis. Everything else calls it.

```ts
type VisitRecord = { stock: Record<string, number>; promotion: Promotion | null; drawnAt: number }
type CartRecord = { token: string; currency: string; lines: Line[]; totalItems: number; savedAt: number }
type Session = { visit: VisitRecord | null; cart: CartRecord | null }

readSession(sid): Promise<Session | 'unavailable'>   // one pipelined call, wrapped in React cache()
claimStock(sid, draws: Record<string, number>): Promise<Record<string, number>>  // HSETNX per product; answers the values that won
claimPromotion(sid, promotion: Promotion): Promise<Promotion>                     // HSETNX; answers the one that won
setStock(sid, draws: Record<string, number>): Promise<void>                       // overwrite, used after an order
clearVisit(sid): Promise<void>
setCart(sid, record: CartRecord): Promise<void>                                   // SET with a one-day expiry, renewed on every call
clearCart(sid): Promise<void>
```

- Keys: `sess:<sid>:visit`, a hash with fields `stock:<productId>`, `promotion` and `drawnAt`, expiry one day set with `EXPIRE NX` so it counts from the first draw; `sess:<sid>:cart`, a JSON string with a one-day expiry renewed by every `setCart`. Redis makes the first write win, so a seed hole and a stock hole rendering in parallel always agree.
- Two adapters behind one interface. `lib/session/upstash.ts` posts pipelines to `KV_REST_API_URL` with `KV_REST_API_TOKEN` as a bearer, using plain `fetch` with `AbortSignal.timeout(REDIS_TIMEOUT_MS)`, `REDIS_TIMEOUT_MS = 300`. `lib/session/memory.ts` is a `Map` with expiries, used when the variables are unset: a reader's clone, CI and the unit tests. `lib/env.ts` adds both variables as optional, with the comment pattern the file already uses. No new dependency.
- Values read from Redis cross a trust boundary and are parsed with zod in `lib/session/records.ts`. A record that fails to parse counts as absent.
- When Redis errors or times out, `readSession` answers `'unavailable'` and the error is logged once per request, never with the token. The claim and set functions swallow the same errors. Surfaces then degrade: stock is drawn straight from the API and shown without being kept, the banner shows whatever the API answers, the cart page and the badge render a "cart unavailable" state that never says the cart is empty, and an add answers `{ ok: false, error }` with a message that says to try again. Because the token lives only in Redis, a cart cannot be reached while Redis is down; that is the cost of holding one cookie, and `docs/adr/0007-the-session-store.md` records it.

## The visit

- A first visit is drawn by the server. The layout's seed hole (`components/visit/visit-seed.tsx`) reads the session; when it holds no visit, it draws stock for every product in the catalogue, eight at a time as `POST /api/visit` does today, reads one promotion, and claims both. It hands what won to the client provider. The product page's stock hole (`components/product/stock-and-cart.tsx`) does the same for its one product, so the buy panel never waits for the full draw. The banner claims the promotion the same way.
- Deleted: `lib/visit/opening.ts`, `opening-limits.ts`, `hand-back.ts`, the `POST` handler and the hand-back in `app/api/visit/route.ts`, `openVisit` in `lib/visit/open.ts`, the `data-opening-draw` marker in `stock-and-cart.tsx` and `stock-skeleton.tsx`, the `shown` field in `add-to-cart-form.tsx`, `stock-and-cart-client.tsx` and `actions.ts`, `drawFor`'s one-product open, and in `visit-provider.tsx` the `open`, `pending`, `release`, `kept`, `pendingOpen` and `reportOpeningDraw` logic. `lib/visit/visit.ts` loses the cookie encoding and the 4 KB cap; `lib/visit/cookie.ts` is deleted. `lib/visit/limits.ts` stays.
- `DELETE /api/visit` stays for the footer's reset control and calls `clearVisit`. It leaves the cart alone.
- Placing an order lowers the visit's draws by what was bought with `setStock`, as `afterOrder` does today.
- The provider keeps `draw`, `confirmLine` and the badge count logic. It no longer holds anything; the server seed is complete on every render.

## The cart

- `lib/cart/get-cart.ts` becomes the read of the mirror: `loadCart()` answers the session's `CartRecord`, or `null`, or `'unavailable'`. It never calls the API. `lib/cart/cookie.ts` is deleted.
- Every cart action in `app/cart/actions.ts` reads the token from the mirror, calls the API, and on success writes the API's answer back with `setCart`. `prepareCart` creates the cart and stores its token. A 404 for the cart clears the mirror and starts a new cart on the next add. No action sets a cookie and none calls `refresh()`. `addToCart` answers `{ ok, totalItems, line, lines }` like `updateQuantity` and `removeItem`. `placeOrder` clears the mirror and keeps its redirect.
- `components/cart/cart-badge.tsx`, `components/visit/visit-seed.tsx` and `components/cart/cart-contents.tsx` read the mirror and drop their `next-action` checks.
- `cart-contents.tsx` schedules one read of the API in `after()`, `getCart(token)`, and writes the answer with `setCart`, or clears the mirror on a 404. The page already on screen never changes; the next render sees the corrected mirror.
- The favourites row under the cart no longer gets a re-render when a product is added from it. It hides a product whose id is in the lines the cart view holds, through a small client wrapper; move the row under `CartView` if that is the shortest way.

## Pending lines

- `lib/cart/adds-in-flight.ts` holds, per product, the quantity in flight and what a row shows: `name`, `slug`, `image`, `price`. The Add to Cart form records them at the click, from props the product page passes down. Redis never holds a pending line.
- `CartView` merges the in-flight products over the lines it holds: a product already in the lines gets its quantity raised; a new one gets a row at the end. Such a row shows "Saving…" in its status line, its stepper and Remove are disabled, and `CartSummary` keeps Checkout disabled while any line is pending. When the add's answer arrives its `lines` replace the held lines and the in-flight entry is released, so the row settles in one paint. When the add fails the row disappears and the page says why, keyed by product as today's errors are.
- A full reload while a save is in flight shows the cart without that line until the save lands. This is accepted.

## Tests

- Unit tests run against `lib/session/memory.ts`. `app/cart/actions.test.ts` replaces its fake cookie jar with the memory adapter and a fixed session id. `lib/session/upstash.test.ts` mocks `fetch` and asserts the pipeline body, the bearer header, the timeout and that a failure answers `'unavailable'`. `lib/session/cookie.test.ts` and a proxy test cover `isSessionId` and the minting rules. `app/api/test/session/route.test.ts` asserts a 404 without `E2E_SEED`.
- `POST /api/test/session` exists only when `E2E_SEED=1`; otherwise it answers 404 before reading anything. It mints a session cookie when the caller has none, and takes `{ stock?, promotion?, cart? }` to seed the visit and the mirror. `E2E_SEED` is set by `playwright.config.ts` for its web server and is never set on Vercel.
- `e2e/visit.ts` seeds through that route instead of writing the `visit` cookie. Specs that assert `cart_token` attributes assert instead that the only cookie is `sid` with the attributes above. `first-visit.spec.ts` keeps its rule: a number in the HTML equals the number the visit holds afterwards, now read through the seed the provider receives.

## Slices

Each slice is one commit, in this order. A file belongs to one slice; a slice never edits another slice's file. Slices 2 and 3 can run in parallel once slice 1 has landed, because they share no file: the contracts above are what they agree on. Slice 4 waits for both. Slices 5 and 6 can run in parallel after slice 4.

0. **CDN spike.** Add `proxy.ts` and a throwaway `app/spike/page.tsx` whose hole renders the id from `cookies()`. Push the branch, let Vercel build the preview, and with `curl` and no cookies assert on the preview: `Set-Cookie: sid=` on `/`, on a product page and on `/spike`; the id rendered in `/spike`'s hole equals the one in the header of the same response; a second request that sends the cookie gets no `Set-Cookie` and renders the same id; the build log still marks every route as before. Stop rule: any assertion failing ends the run with a report. The spike page is deleted in slice 1.
   Files: `apps/store/proxy.ts`, `apps/store/app/spike/page.tsx`.
1. **The store.** Files: `lib/session/*` and their tests, `lib/env.ts`, `lib/env.test.ts`, `.env.example`, `proxy.ts` finished, `proxy.test.ts`, delete `app/spike/`.
2. **The visit on the session.** Files: `lib/visit/*` and tests, `app/api/visit/*`, `components/visit/visit-seed.tsx`, `components/promo-banner.tsx`, `components/product/stock-and-cart.tsx`, `components/product/stock-skeleton.tsx`.
3. **The cart on the session.** Files: `lib/cart/get-cart.ts` and test, delete `lib/cart/cookie.ts` and test, `app/cart/actions.ts` and test, `app/cart/page.tsx`, `components/cart/cart-badge.tsx`, `components/cart/cart-contents.tsx`, the favourites row wrapper.
4. **The client.** Files: `components/visit/visit-provider.tsx`, `components/product/stock-and-cart-client.tsx`, `components/product/add-to-cart-form.tsx`, `lib/cart/adds-in-flight.ts` and test, `components/cart/cart-view.tsx`, `cart-line.tsx`, `cart-summary.tsx`.
5. **Browser tests.** Files: `app/api/test/session/*`, `playwright.config.ts`, everything under `e2e/`.
6. **Docs.** Files: `CONTEXT.md` (already updated; verify), `AGENTS.md` cache policy rows (already updated; verify), `docs/static-vs-dynamic.md`, `README.md` env section, `specs/callout.md` entry "The session store" with the measurements, `specs/decisions.md` lines 15 to 17, and the ticks below.

## Out of scope

Signing the session id; a cross-device cart; holding pending lines in Redis; adopting today's cookies; any change to the catalogue caching.

## Acceptance

Against a preview deploy, then production after the merge:

- [x] The only cookie the store sets is `sid`, httpOnly, Secure, SameSite=Lax, 30 days, set once.
- [x] A first visit renders a stock number on the product page in the HTML, and every later render of any surface shows the same number until the visit is reset or an order lowers it.
- [ ] The cart page renders its lines without a cart API call; measured on production, its hole arrives in under 0.5 s where it took 1.6 to 2 s.
- [x] The header badge on a full page load makes no cart API call.
- [x] Opening the cart within a second of Add to Cart shows the product as a saving row, never an empty cart, and the row settles without a reload when the save lands.
- [x] Two quick adds of different products both show as saving rows.
- [x] An add, a quantity change and a removal each make one cart API call, and every action's response is under 1 KB.
- [x] With `KV_REST_API_URL` unset, `pnpm verify` and the Playwright suite pass on the memory adapter.
- [x] With Redis unreachable, a page render still completes, shows the API's stock, and the cart says it is unavailable rather than empty.
- [x] `POST /api/test/session` answers 404 on the preview.
- [x] Build output marks every page as before, and `pnpm verify` passes.
- [ ] Before and after timings are recorded in `callout.md`, measured on production.
