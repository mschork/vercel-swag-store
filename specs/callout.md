# Callouts

Things worth saying out loud in the presentation or README because they are deliberate choices that could look like omissions.

- **The bypass token is sent but not currently required** (E02). The API reference says a request without `x-vercel-protection-bypass` returns `403 Forbidden`; the deployed API answers without it. The store sends the header on every request anyway, from the server only, so protection can be switched on without a deploy. The claim is re-probed rather than assumed.
- **One cache, not two** (E09 Q17). `useCdn: false` on the Sanity client. Sanity's CDN is a second cache with its own staleness; relying on Next's `"use cache"` plus tag revalidation from the publish webhook keeps a single, explainable freshness story.
- **Search gaps are analysed only after two searches** (E13). A single zero-result query is noise (typos, one-off curiosity). With the ten-minute dedupe, a count of two means two searches at least ten minutes apart. The threshold is a constant in `packages/demand`, and the Blueprint's trigger filter is built from the same constant.
- **The build fails if the API is unreachable** (E02 Q3). Product pages prerender at build time; a build that cannot reach the API stops rather than shipping an empty store. The failure is visible in the Vercel build log.
- **Search keeps the previous results while the next ones load** (E07 Q7). The results grid sits in a Suspense boundary that is not re-keyed per search. React keeps the old grid on screen and swaps in the new one when the cached `getProducts` call resolves; the form shows a pending cue from `useTransition`. Re-keying the boundary would flash a skeleton on every debounced keystroke, which reads as slower than a 50 ms API.
- **CI is meant to be two jobs, and is not wired yet** (E12 Q11). The intended shape is a GitHub Actions workflow on pull requests: a fast `verify` job (lint, typecheck, build, Vitest), required to merge, and a Playwright job (smoke plus visual regression) that runs on the same PR but is not required, so a flaky screenshot never blocks a merge while its failure stays visible. E12 has not shipped, so no workflow is committed and nothing runs on a PR today; `pnpm verify` is run locally before opening one.
- **`/health` has a typed function nobody renders** (E02 Q1). Every API endpoint, including `/health`, is wrapped in `lib/api` so the acceptance criterion "every endpoint has a typed function" is literally true. `getHealth()` is exercised by the opt-in integration test and doubles as the one-line smoke check for a new environment.
- **Cached functions are unit-tested as they ship** (E02 Q9). `getProducts` and friends carry `"use cache"` and call `cacheTag` and `cacheLife`, which only exist inside the Next runtime. Rather than splitting each into a tested inner function and an untested cached wrapper, a Vitest setup file stubs `next/cache` and aliases `server-only` to an empty module, so tests call the same function the app calls.
- **Search-gap dedupe lives in Sanity, not in memory** (E13). Each zero-result query maps to one `searchGap` document keyed by its normalised text. Before bumping `count`, the recorder reads `lastSeen` and skips if it is under ten minutes old. That is exact across serverless instances; an in-memory LRU would not be.
- **Search queries sit in a public dataset and nobody can read them** (E13). The dataset is public so the store needs no read token. `searchGap` and `productIdea` documents get ids with a dot, which Sanity treats as a private path: anonymous reads return nothing, editors and tokens see them. E08 avoids dotted ids for exactly this reason; E13 uses them for it. Only the normalised query is stored, and anything that looks like an email, a URL or a long number is never stored at all.
- **The debounce searches half-typed words, and the loop knows** (E13). Typing "umbrella" slowly also searches "umb" and "umbre", and each is a zero-result query. The analysis waits ten minutes before it claims gaps, then folds any gap that is a prefix of a longer, at least as frequent one into `ignored`. The alternative, marking debounced navigations in the URL, would put transport detail into the one piece of state the search page has.
- **Three runtimes, one job each** (E13). A Sanity Function notices the threshold because it sits where the data changes. A Vercel Workflow runs the analysis because that is where the catalogue client, the AI Gateway identity and retries live. Accept and Reject are Studio document actions because that is where editors work, with a second Function finishing the decision. Sanity Workflows was the first choice for that step and was dropped after reading its package: the README of the release evaluated calls the runtime it needs "experimental, and not ready for production use". The stable pieces give an editor the same two buttons with a third of the moving parts. The Function fires on every increment past the threshold rather than once, so a lost call heals on the next search; a lock in the workflow makes the repeats free. `docs/adr/0004-demand-loop-runtimes.md`.
- **Visitor text goes into a prompt, so the model gets nothing to do harm with** (E13). No tools, a schema-checked answer, every id and slug in the answer validated against what was sent, output shown only to editors as plain text, a human decision before anything counts.
- **No theme selector** (E03 Q14). Light and dark follow the operating-system preference through `prefers-color-scheme`. A selector needs a client component, a blocking inline script to set the class before first paint and a hydration exception on `<html>`; dropping it keeps the shell's client JavaScript to the cart count.
- **The footer survives a store-config failure** (E03 Q4). `app/error.tsx` only catches errors thrown by the page, not by the root layout. The footer therefore catches its own `getStoreConfig()` failure, logs it and renders without the social links, so a config outage never replaces the store with Next's bare error screen.
- **The promo skeleton is a slow-path safety net** (E04 Q7). The banner streams inside the same HTML response and the API answers in tens of milliseconds, so the promo markup usually arrives before first paint and the visitor never sees the skeleton. For the slow case, the skeleton and the banner share a box sized for the longest of the four current promos; no placeholder can reserve the right space without some knowledge of the content, and the alternatives (clamping the text, taking the banner out of flow) cost more than a rare small shift. The same box is rendered empty when there is no active promotion or the call fails: "render nothing" would move the grid up by the banner's height, which is the shift the box exists to prevent. That failure is a server-side condition, so it is verified by starting the server with an unreachable `API_BASE_URL`, not by Playwright.
- **Catch blocks rethrow Next's own errors first** (E04 review). When a prerender finishes while an uncached fetch is still pending, Next rejects that fetch with an internal error React expects to receive. `fetchApi`'s retry loop caught it, retried, and wrapped it as `NETWORK_ERROR`, and the promo banner logged a fake outage on every build. Every catch around an API call now calls `unstable_rethrow(error)` before handling; `lib/load-optional.ts` packages that with the log-and-return-null shape for data a component can render without.
- **The header nav sits in a Suspense boundary** (E04 review). `NavLink` reads `usePathname()` for the current-page marker. On static routes the pathname is known at prerender and the boundary resolves in the shell, so nothing changes. On the fallback shell of `/products/[slug]` (a slug not listed at build) the pathname is unknown, and Next refuses to prerender a client hook that needs request data outside `<Suspense>`; without the boundary the build fails. There, plain links are prerendered and the marker streams in.
- **The OG image reads its font inside the handler** (E04 review). E03 read the Geist TTF at module scope, which was harmless while every route was fully static. E04 made the home page resume at request time for the promo hole; that resume loads the OG image module through the root metadata, and the module-scope read ran inside the Vercel function, where the font was not bundled, so the first preview showed the error boundary. The read now happens inside the handler and `outputFileTracingIncludes` ships the font with the function.
- **Content in streamed holes needs JavaScript** (E06). The search form sits in the static shell and works without JavaScript. Stock with Add to Cart, the promo banner, the cart contents and the header badge stream inside Suspense boundaries, and React reveals a streamed boundary with a small inline script, so with JavaScript disabled those holes keep their skeletons. That is accepted because the alternative, resolving every live value before the first byte, makes every page dynamic and gives up the static shell this store is about. The cart forms are still native `<form action>` Server Actions, so a submit made while hydration is slow or has failed posts to the server instead of being lost.
- **A failed cart call is not an empty cart** (E06). When the API cannot return the cart, the header badge shows the cart icon without a count, the same as while it loads, and `/cart` says "Your cart could not be loaded" with a way to try again. A zero or "Your cart is empty" would state something false about a cart that may well hold products; only a 404 for the cart itself means there is nothing in it.
- **The cart API is ten times slower than the rest of the API, and the UI is built for it** (E06). Every endpoint outside the cart answers in about 0.15 s; every cart call takes 1.4 to 2.8 s, reads included. Only that namespace is slow, and consistently so, which reads as deliberate rather than incidental: a storefront that hides a slow cart behind optimistic UI looks very different from one that does not. The measurements are in the section below.
- **The badge count is the shell's first client state, and actions return it** (E16 step 5). E06 had every cart action answer with copy only and let `refresh()` re-render the badge from a fresh cart read. That read ran inside the action's response, so every add waited about 1.7 s longer than its write. Now a small provider in the root layout holds the count, the badge seeds it from its server read, and each action answers with the cart's `totalItems`, never its lines or token. Setting the cart cookie makes Next re-render the whole page in the action's response anyway, so the badge detects that render and skips its read. The shell stays prerendered; the badge hole simply hydrates into a client component. The trade-off is one more rule to explain: the header number is the last count the API reported, not a live read.
- **A quantity change is saved after a 400 ms pause** (E16 step 3). The cart rows keep taking clicks, show each value at once and send only the last one, so 3 to 7 is one slow request instead of four. Leaving for another page inside the pause saves at once. Closing the tab inside the pause loses that change; the row never claimed it was saved, and catching `pagehide` would need a second write path outside Server Actions.
- **The store is noindex on purpose** (E06 review). Root and per-page metadata, both Open Graph image routes, `sitemap.xml` and `robots.txt` are built exactly as the requirements ask, and then an `X-Robots-Tag: noindex` header on every response keeps the result out of search. A store of invented products under the Vercel name, on a public domain, should not compete with vercel.com for real searches. The header covers what a meta tag cannot, namely the sitemap and the Open Graph images, and `robots.txt` allows crawling on purpose: a URL a crawler may not fetch can still be indexed from a link, and its directive is never read. `/cart` and `/checkout` keep their own `robots: { index: false }` so the intent is visible in the page code too.
- **Markdown and structured data on a store that stays noindex** (E20). Every catalogue page has a Markdown version at the same address plus `.md`, an `llms.txt` lists them, and product pages carry `Product` and `Offer` JSON-LD. None of it asks to be found: the noindex header covers all of it, `robots.txt` asks the AI training crawlers by name to stay out, since they ignore that header, and `llms.txt` opens by saying the products are invented. It is there to show the technique under the store's own rules, and the interesting part is the constraint. The page, the Markdown and the JSON-LD are three renderings of one merged product, so they cannot disagree; stock and the promotion appear in none of them, because a file served to everyone cannot hold a number drawn for one visitor; and every one of the new routes is prerendered and refreshed by the same tags as the pages. The markup names a brand, because that is a fact about the product, and no organisation, because that would be a claim about who runs the site.
- **Search is dynamic, the product listing is not, and the difference is the data** (E18 Q3). Both pages narrow the catalogue by category. Search reads `searchParams` because free text has unbounded values, so its grid is a dynamic hole in a static shell. The listing takes its category from the path, because categories are a closed set the API lists: `generateStaticParams` builds one page each and nothing is rendered per request. The price sort re-orders cards already on the page in the browser, so it costs no request and no dynamic hole; the price is that a sorted view has no URL.
- **Two endpoints answer at random, so the store gives them a memory** (E05, E19). A product carries no stock field; stock exists only as a separate live endpoint, and that endpoint answers with a fresh draw from 0 to 29 on every request. `GET /promotions` does the same with four promotions. Neither has any memory, and `POST /cart` ignores stock outright: a cart accepted 530 units of a bottle whose stock never reads above 29. Shown as they come, these numbers say nothing. A stock line on a card would strike one product through on 13% of four-card renders and 61% of the full listing, and a reload would strike through a different one, which reads as a broken store rather than a sold-out product; the discount code under the header would change on every navigation. So the store asks each endpoint once per visitor and keeps the answer for a day in an httpOnly `visit` cookie. Every count and every promotion still comes from the API; what the store adds is the memory. That is what makes the last two stock requirements reachable at all, because a limit redrawn before the add lands was never a limit. It also costs nothing in shells: the cookie is read inside the Suspense boundaries the page already had, every route still builds as a partial prerender, and no page render calls the stock endpoint. The honest limit is that two visitors see different stock for the same product, which no real store would allow: this demonstrates inventory, it is not inventory. Past about 135 products the cookie runs out of room and it wants a server-side store. `docs/adr/0006-the-stable-visit.md` records the trade-off, including why `localStorage` cannot do it: the server could not read it, so the cart could not enforce it. The measurements are in the section below.

## Cart latency measurements (E06)

Numbers for the presentation. Measured with `curl` against the live API on 15 and 16 Sep 2026, five runs per endpoint, three for the two calls that create or change a cart. The figure is `time_total`, the whole request.

| Endpoint | Runs (s) | Median (s) |
|---|---|---|
| `GET /health` | 0.16, 0.20, 0.17, 0.16, 0.16 | 0.16 |
| `GET /products?limit=12` | 0.15, 0.16, 0.18, 0.16, 0.15 | 0.16 |
| `GET /products/{id}` | 0.15, 0.15, 0.17, 0.16, 0.15 | 0.15 |
| `GET /products/{id}/stock` | 0.34, 0.35, 0.33, 0.46, 0.25 | 0.34 |
| `GET /categories` | 0.15, 0.15, 0.14, 0.29, 0.15 | 0.15 |
| `GET /promotions` | 0.17, 0.15, 0.14, 0.15, 0.16 | 0.15 |
| `GET /store/config` | 0.15, 0.15, 0.16, 0.14, 0.14 | 0.15 |
| `GET /cart` | 1.37, 1.70, 2.04, 1.43, 1.52 | 1.52 |
| `POST /cart/create` | 2.68, 2.54, 2.81 | 2.68 |
| `POST /cart (add a line)` | 2.95, 2.47, 3.05 | 2.95 |
| `PATCH /cart/{productId}` | 2.21, 2.79, 2.42, 2.82, 2.67 | 2.67 |

Catalogue, config and health sit between 0.14 and 0.20 s. Stock, the other live call, sits at 0.25 to 0.46 s. Everything under `/cart` is an order of magnitude slower, and `GET /cart` is slow too, so it is not write contention.

What that costs in the browser, measured with Playwright against `next start` on the same build:

| Flow | Time |
|---|---|
| First Add to Cart (create a cart, write, badge re-read) | 6.3 s to the confirmation |
| Second Add to Cart (read the cart, write, badge re-read) | 8.3 s to the confirmation |
| Quantity change on `/cart`, including the page load | 6.5 s to the confirmed badge |

One add is three cart calls: read the cart (or create one), write the line, then the header badge's own read when `refresh()` re-renders the route. The end-to-end tests allow 30 s per cart assertion for the same reason, and a slow add is not a defect.

What the store does about it. The cart page's shell is prerendered, so the slow part never blocks first paint. Its rows change through `useOptimistic`, so a quantity change or a removal is instant and the round trip happens behind the visitor. The badge streams in its own boundary and never holds up a page. A cart the API cannot return degrades to "Your cart could not be loaded" instead of a wrong empty cart. What stayed visible after E06 was Add to Cart on the product page, which waited for the round trip. E16 removed and hid that wait; the section below has the numbers.

## Cart latency after E16

Measured on 17 Sep 2026 with the same live API, before the first E16 commit and after the last. A Playwright script drove `next start` on a production build, three runs per flow, each in a fresh browser context. A fetch hook preloaded into the server logged every cart call, so the call counts are the server's own. First the endpoints themselves, re-measured with `curl` before starting, to confirm the epic was still worth doing:

| Endpoint | Runs (s) |
|---|---|
| `GET /products?limit=1` | 0.22, 0.18, 0.15 |
| `POST /cart/create` | 3.05, 2.65, 3.10 |
| `GET /cart` | 2.10, 1.60, 1.63 |
| `POST /cart` (add a line) | 2.53, 2.46, 2.99 |
| `PATCH /cart/{productId}` | 2.86, 2.39, 2.30 |
| `DELETE /cart/{productId}` | 2.47 |

Then the flows. "Acknowledged" is the first visible response to the click. "Saved" is when the action's response has arrived, which is also when "View cart" becomes a link.

| Flow | Before: acknowledged | Before: saved | Before: cart calls | After: acknowledged | After: saved | After: cart calls |
|---|---|---|---|---|---|---|
| First Add to Cart | 6.9 to 7.4 s | 6.9 to 7.4 s | 3 | 0.02 to 0.03 s | 5.4 to 6.1 s | 2 |
| Second Add to Cart | 6.3 to 7.3 s | 6.3 to 7.3 s | 3 | 0.02 to 0.03 s | 2.8 to 3.3 s | 1 |
| One plus click on `/cart` | 0.03 to 0.05 s | 4.8 s | 3 | 0.03 to 0.04 s | 4.2 to 4.7 s | 2 |
| Four plus clicks on `/cart`, 3 to 7 | 13.7 to 15.7 s to show 7 | 19.0 to 21.0 s | 12 | 0.26 to 0.27 s to show 7 | 4.7 to 5.3 s | 2 |
| Loading `/cart` | | | 2 reads | | | 1 read |

The header badge follows the click in 0.04 to 0.07 s after E16, on both pages; before, it moved only when the action's response arrived. A saved quantity change still includes one cart read, because the cart page re-renders its lines from the server; the 400 ms pause is part of its saved time. "Four plus clicks" before E16 means four saves in a row, because a row ignored clicks while one was saving.

What changed, in order: a spinner on the busy button; the add writes first and reads only after a 404; quantity clicks wait for a pause and send the last value; the badge and the cart page share one read per request; actions return the item count and the badge holds it on the client; the product page confirms at submit time. What is left is the API's own time for one write, which no storefront change removes.

## Stock measurements (E05)

Measured against the live API on 20 Sep 2026. `GET /products/{id}/stock` called 300 times
per product, concurrently, with the bypass header.

| Product | Samples | Range | Read 0 |
|---|---|---|---|
| `bottle_001` | 300 | 0 to 29 | 12 |
| `backpack_001` | 300 | 0 to 29 | 15 |
| `hoodie_001` | 300 | 0 to 29 | 10 |

Every value from 0 to 29 appeared for every product, in numbers consistent with a uniform
draw. A single pass over all 28 products returned no zero at all, which is what one in
thirty looks like in a sample of 28.

What a stock line on a card would have cost, at one in thirty per card, had it been
drawn per render:

| Grid | Cards | Renders showing a false "out of stock" |
|---|---|---|
| Favourites row | 4 | 13% |
| Home featured grid | 6 | 18% |
| Full listing | 28 | 61% |

This is the table the visit cookie answers. A count drawn once and kept is wrong on no
render rather than most of them, which is why every grid can badge a card now and none
could before.

The cart does not check stock. On a throwaway cart, `POST /cart` accepted a quantity of 30
and then a further 500 for `bottle_001`, leaving a line of 530, and 40 consecutive
single-unit adds were all accepted. Before E19 the disabled Add to Cart button was a
front-end courtesy: it stopped a click, not a write, and the reading behind it had been
replaced by a fresh draw before the add landed. The store now enforces the visitor's own
draw in the Server Action, which is the only place it can be enforced.

The API's `lowStock` flag turns over cleanly: true for 1 to 5, false at 0 and 6 upwards,
over 400 samples with no overlap at any value. The store's own threshold is that same 5.

`GET /promotions` returned all four of its active promotions over 120 samples, none
inactive and none null, in numbers consistent with a uniform pick per request.

A full draw of the 28-product catalogue takes about 1.05 s at a concurrency of 8 and
0.59 s at 16, with no failures and no rate limiting. The resulting cookie is 1,125 bytes:
about 27 URL-encoded bytes per product and 404 for the promotion, which is what caps the
design at roughly 135 products.
