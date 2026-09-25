# E07 Search page

Branch: `epic/E07-search`. Depends on: E02, E03, E04 (ProductCard). Blocks: E13.

## Goal

`/search` with the URL as the single source of state, a static shell that carries the whole catalogue, and a search that runs in the browser over it, with the same function on the server for a first render.

## URL contract

- `q` free text, `category` slug. Both optional. Example: `/search?q=hat&category=hats`.
- Empty `q` and no `category`: default state.
- Any other params are ignored. `page` is not supported (results capped at 5 per the requirements).
- `category` is validated against the cached category slugs; an unknown slug is treated as none.
- The API's `search` is a case-insensitive substring match over `name`, `description` and `tags`, with no normalisation: `t-shirt` hits, `tshirt` and `t shirt` do not, and `cold-cup` finds a product that says so only in its tags. `matchesQuery` reproduces it exactly, and `lib/search-parity.test.ts` holds it to the API's own answers; the store no longer calls the API's `search`.

## Scope

### Route `app/search/page.tsx`

- `searchParams` is a Promise; the page passes it unawaited into `<SearchResults />` so the shell (heading, form) stays static. The page component itself must not `await searchParams` at the top level, or the whole route becomes dynamic.
- Layout: h1 "Search", the form, then `<Suspense fallback={<ResultsSkeleton />}><SearchResults searchParams={searchParams} /></Suspense>`. `SearchResults` reads the URL for the first render only and hands it to `SearchResultsView`, a client component that searches the catalogue from then on. `SearchCatalogue` loads the catalogue, the featured products, the categories and one server-rendered card per product into the shell; every read is cached, so it is part of the prerender. The skeleton only shows on the route's first load.
- `generateMetadata` awaits `searchParams`: title `q ? \`Results for "${q}"\` : 'Search'`; `robots: { index: false }` when `q` is set. Metadata streams, so `/search` stays a partial prerender.
- No `opengraph-image.tsx` for search; the root image applies by Next's file convention.

### Search form `components/search/search-form.tsx`

`Form` from `next/form` with `action="/search"`, so without JavaScript Enter and the button submit a plain GET with `q` and `category`. Categories are fetched once on the server with `getCategories()` and passed in as props.

- Controls: a shadcn `Input` with `type="search"` (native clear button, "Search" key on mobile keyboards), a visually hidden label and the placeholder "Search products"; a native `<select>` styled with the tokens for the category, with an "All categories" option; a submit button "Search". No shadcn `Select`: a native select needs no client JavaScript and works without it.
- The client leaf intercepts `onSubmit` with `preventDefault` and applies the search at once: it hands the query and category to the results view through `SearchStateProvider` and replaces the URL with `history.replaceState`, which Next's `useSearchParams` follows. No navigation and no request, so there is no pending state; a submit shows the button pressed for 150 ms instead, so Enter is seen to do something. `replaceState`, never `pushState`: a search is a refinement of the current view, not a step to go back through.
- Triggers: submit always searches; typing searches once `value.trim().length >= 3`, with no debounce; clearing the input to empty (including the native × of `type="search"`) clears the query and keeps the category; changing the select searches immediately.
- 1 or 2 characters never search while typing. The previous results stay visible under the shorter input.
- Initial values: the leaf reads `useSearchParams` and therefore sits inside `<Suspense>`, whose fallback is the same form markup rendered by the server, empty and uncontrolled. Identical layout, and it still submits without JavaScript. With Cache Components a client component reading `useSearchParams` on a prerendered route must sit inside a boundary or the build fails.
- Syncing with the URL: the select's value is derived from `useSearchParams` directly, with no local state. The text input keeps local state and adopts the URL's `q` in an effect whenever it differs from the last value the form itself navigated to, which covers the category chips, "Clear search", the product page's breadcrumb and browser Back. The leaf is never remounted with a `key`: that would drop focus and caret while typing.

### Results `components/search/search-results-view.tsx`

A client component. `components/search/search-results.tsx` is the server half: it awaits `searchParams`, normalises them for the first render and records a search gap for a query that finds nothing.

- Normalise: `q = (q ?? '').trim().slice(0, 64)`, `category` validated against the category list (unknown slug treated as none).
- `searchCatalogue` in `lib/search.ts` decides what shows, over the catalogue in the catalogue's order, which is the order the API answers in.
- Category only: that category's products, capped at 5.
- Query present, no explicit `category`: category-aware expansion. If `expandQuery` matches a category, the first 5 hits and the first 5 products of that category are merged with `mergeResults`; otherwise the first 5 hits.
- Query plus an explicit `category`: the hits in that category, capped at 5.
- Heading, plain path: "N results" / "1 result" when there are at most 5, otherwise "Showing 5 of {total} results". Expansion path: "N results" when nothing was cut, otherwise "Showing the first 5". The heading carries `aria-live="polite"`.
- Whenever results were capped, add the nudge "Pick a category to narrow it down".
- The hint "Includes everything in {Category}" appears only when the category added at least one product the search did not find *and* none of the category's products were cut by the cap; otherwise it would promise something the grid does not show.
- The featured products stay on the page below the results in their own section, headed by `siteSettings.searchPage.featuredHeading` ("Explore our featured products" by default), set apart like the favourites row so they never read as results: 5 of `getFeaturedProducts({ limit: 5, min: 5 })`. A search opens the results above them and pushes them down; clearing it slides them back up. Five, not more: asking for more than the API flags as featured would fill the section with ordinary catalogue products.
- A query with no category that finds nothing, and stays on screen for 300 ms, is reported with the `reportSearchGap` Server Action, which runs the search again on the server before recording, so only a query that finds nothing is ever counted.

### Product grid `components/product-grid.tsx`

Shared by the home page and search, so the column count and the `sizes` string can never drift apart.

- `ProductGrid({ products, variant, priorityCount })` and `ProductGridSkeleton({ variant, count })`.
- `variant: 'home' | 'search'` owns the column classes and the matching `sizes` it passes to `ProductCard`: `home` is one column of row cards below md and 3 grid cards from md; `search` is the same with 5 columns from lg (E10).
- `ProductCard` takes `sizes` as a prop instead of hard-coding it; the grid owns it from now on.

### Empty state `components/search/empty-state.tsx`

One component, three variants, all of them ending in category chips (links to `/search?category=<slug>`, name only).

- `q` only: `No products match "{q}"`, the chips and a "Clear search" link to `/search`. This branch is E13's hook point (record the miss); E07 marks it with a one-line comment and no code.
- `q` and category: `No products match "{q}" in {Category}`, a "Search all categories" link to `/search?q={q}`, then the chips.
- Category only: `Nothing in {Category} right now`, then the chips.

### Loading state

`ResultsSkeleton` is `ProductGridSkeleton({ variant: 'search', count: 5 })` under a skeleton heading, so the swap into real results causes no CLS. Every state the page can reach fills the same five slots, the default state included, so nothing is ever appended below the skeleton either.

### Failure

A results-scoped client error boundary (`components/error-boundary.tsx`, a small class component, with `components/search/results-error.tsx` as the presenter) renders "Search is unavailable right now" and a Try again button that calls `router.refresh()` inside `startTransition` and resets the boundary. The form stays usable and `app/error.tsx` is never reached. Catch blocks around API calls call `unstable_rethrow` first, as everywhere else.

### Pure logic `lib/search.ts`

One file: the functions are one concept and the repo groups `lib/*.ts` by topic.

- `normaliseQuery(raw)`: trim, slice to 64 characters.
- `matchesQuery(product, q)`: the API's `search`, a case-insensitive substring of the name, the description or a tag.
- `searchCatalogue({ query, category, catalogue, categories, featuredIds })`: the whole results decision above, returning the ids, the heading, the hint and whether the cap cut anything. The browser and the server run the same function.
- `expandQuery(q, categories)`: `norm = q.toLowerCase().replace(/s$/, '')`; returns the first category whose `slug` or lowercased `name` equals `norm` or `norm + 's'` once every non-alphanumeric character is removed from both sides, or contains either as a whole word in its raw form. Separators are dropped for the equality test so `tshirt` and `t shirt` reach `t-shirts`, which the API's literal substring match never does; they are kept for the whole-word test, because the hyphen is the boundary that finds `shirt` inside `t-shirts`. The expansion carries the whole plural case: the API does not search category names, so `search=hats` returns 0 hits on its own.
- `mergeResults(searchHits, categoryItems, categorySlug, cap)`: three groups in order, the search hits that are in the matched category, then the category's other products (not already present by `id`), then the remaining search hits; capped. Returns the merged list plus an `added` flag (the category contributed at least one product that survived the cap) and a `truncated` flag (the cap cut something). The category, not the API's own order, decides the ranking: the API matches substrings in prose, so `bag` hits an enamel pin whose description ends "an accent for bags and jackets" and a keychain "easy to spot in a bag", and in API order both outrank the tote. Once the query is taken to name a category, that category is the better signal than a substring. The cost is that five search hits can lose one to a category product.

## Tests

- Vitest `lib/search-parity.test.ts`, opt-in with `API_INTEGRATION=1`: `matchesQuery` over the live catalogue finds what the API's `search` finds, in its order, for 19 queries.
- Vitest `lib/search.test.ts`: `expandQuery` covering "hat" → hats, "Hats" → hats, "bag" → bags, "tee" → none, "cups" → cups, "shirt" → t-shirts, "tshirt" and "t shirt" → t-shirts; `mergeResults` covering the three-group ordering, de-duplication by `id`, the cap, and the `added` / `truncated` flags; `normaliseQuery` covering trimming, the 64-character slice and whitespace-only → empty.
- Playwright `apps/store/e2e/search.spec.ts`: visit `/search?q=hat` directly, see three hats and the hint line, reload and see the same; type "bea" and see the Beanie without pressing Enter; select a category and see the URL and the grid update; combine text and category and see the narrowed result; search "umbrella" and see the empty state with chips; search "bag" and see the three bags ahead of the pin and the keychain; `/search` shows the featured section with five cards and no results; clearing the query keeps the category. The category select and the grid are located by role and accessible name, never by class.

## Acceptance criteria

- [x] Shell static, with the form and the catalogue in it; only the first render's results are dynamic (build output shows `/search` as a partial prerender).
- [x] Enter, button and 3+ character typing all trigger a search; fewer than 3 characters do not.
- [x] Refresh and shared URLs reproduce results, and the form shows the URL's values after hydration.
- [x] Category select filters; combined with text it narrows.
- [x] Empty state (all three variants) and loading state visible; a results-level error renders without losing the form (verified by starting the server with an unreachable `API_BASE_URL`).
- [x] Up to 5 results in the rows / 3 / 5 grid; the featured section shows 5, all of them featured.
- [x] "hat" returns the three hats with the hint line; "hats" too; "black" shows "Showing 5 of 28 results" with the nudge.
- [x] The home page renders its grid at rows / 3 columns with no visual regression elsewhere.

## Out of scope

Pagination, sorting, price filters, search history, the search-gap capture (E13).
