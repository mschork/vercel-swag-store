# instant-nav rig: store

How the `instant()` tests in `e2e/instant.spec.ts` run. Read by the
`next-cache-components-optimizer` skill before each route.

- BUILD: `EXPOSE_TESTING_API=1 pnpm --filter store build`, then `next start`
  on port 3000, started by Playwright's `webServer` (`playwright.config.ts`).
- EXPOSE: `EXPOSE_TESTING_API=1` at build and at start. `next start` evaluates
  `next.config.ts` again, so a server started without it ignores the lock
  cookie on a document request and the first-load test passes without testing
  anything. CI sets it on the build step; the Playwright web server sets it on
  start.
- RUN: `pnpm --filter store exec playwright test e2e/instant.spec.ts --project chromium`;
  `baseURL` comes from `playwright.config.ts`.
- TEST USER: public; no authentication. A first request gets its `sid` from
  `proxy.ts`; the tests visit the home page first.
- DRIFT: the API draws stock per visit, so a product can be out of stock and
  its button reads "Currently unavailable"; assert the quantity field, not the
  button. After a client navigation the previous page stays mounted but
  hidden, so match visible elements only.
- CONTRACTS: `/products/[slug]`, first load and a click from the home page's
  featured grid; shell marker the `h1` and the Quantity field; deferred marker
  the stock line.
- CONTRACTS: `/`, first load and a click on the header's Home link from
  `/products`; shell marker the `h1` and the first featured card; deferred
  marker the cards' "Out of stock" badges on a first load, with every product
  seeded at 0. A click reuses the visit the layout already holds, so the
  badges show at once and are not a deferred marker there.
- CONTRACTS: `/products` and `/products/category/[slug]`, first load and a
  click on a category chip; shell marker the `h1`, the Categories nav and the
  first grid item; deferred marker the "Out of stock" badges on a first load,
  as on the home page.
- CONTRACTS: `/search`, a first load of `/search?q=mug` (shell marker the `h1`
  and the search box; deferred marker the results' count heading), a query
  typed under the lock (the browser searches the shell's catalogue, so the
  results answer at once), and a click on the header's Search link.
- CONTRACTS: `/cart`, first load and a click on the header's cart link, with
  one line seeded; shell marker the `h1`; deferred marker the cart's rows.
- CONTRACTS: the promotion banner in the root layout, a first load of `/`;
  shell marker the text in `Current promotion`; deferred marker the "Out of
  stock" badges, as on the home page.
- LOOP: local build, then run; stop anything on port 3000 first
  (`kill $(lsof -tiTCP:3000 -sTCP:LISTEN)`): `next start` forks a
  `next-server` child, and Playwright reuses a server it finds there.
- LIVENESS: n/a; local build and start.
- WALLS: a build can fail on an API timeout while prerendering; rerun it.
  `git push` runs the pre-push hook's `turbo typecheck`, which builds the
  store without the variable over the test build; rebuild after a push.
