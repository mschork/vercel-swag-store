# E07 Search page

Branch: `epic/E07-search`. Depends on: E02, E03, E04 (ProductCard). Blocks: E13.

## Goal

`/search` with server-side filtering through the API, the URL as the single source of state, a static shell and a dynamic results grid.

## URL contract

- `q` free text, `category` slug. Both optional. Example: `/search?q=hat&category=hats`.
- Empty `q` and no `category`: default state.
- Any other params are ignored. `page` is not supported (results capped at 5 per the requirements).
- `q` is never sent to the API empty and `category` is never sent unvalidated: the API answers 422 for `search=` and for an unknown `category`.

## Scope

### Route `app/search/page.tsx`

- `searchParams` is a Promise; the page passes it unawaited into `<SearchResults />` so the shell (heading, form) stays static. The page component itself must not `await searchParams` at the top level, or the whole route becomes dynamic.
- Layout: h1 "Search", the form, then `<Suspense fallback={<ResultsSkeleton />}><SearchResults searchParams={searchParams} /></Suspense>`. The boundary is not re-keyed per search: the previous results stay visible while the next ones load and the form shows a pending cue from `useTransition` (see `callout.md`). The skeleton only shows on the route's first load.
- `generateMetadata` awaits `searchParams`: title `q ? \`Results for "${q}"\` : 'Search'`; `robots: { index: false }` when `q` is set. Metadata streams, so `/search` stays a partial prerender.
- No `opengraph-image.tsx` for search; the root image applies by Next's file convention.

### Search form `components/search/search-form.tsx`

`Form` from `next/form` with `action="/search"`, so without JavaScript Enter and the button submit a plain GET with `q` and `category`. Categories are fetched once on the server with `getCategories()` and passed in as props.

- Controls: a shadcn `Input` with `type="search"` (native clear button, "Search" key on mobile keyboards), a visually hidden label and the placeholder "Search products"; a native `<select>` styled with the tokens for the category, with an "All categories" option; a submit button "Search". No shadcn `Select`: a native select needs no client JavaScript and works without it.
- The client leaf intercepts `onSubmit` with `preventDefault` and navigates with `router.replace(\`/search?${params}\`, { scroll: false })` inside `startTransition`, so Enter, the button, the debounce and the select change share one `isPending`. `isPending` disables the button and sets `aria-busy` on the results region. `router.replace` everywhere, never `push`: a search is a refinement of the current view, not a new step in history.
- Triggers: submit always navigates; typing navigates after `value.trim().length >= 3` with a 300 ms debounce; clearing the input to empty (including the native × of `type="search"`) navigates to the default state; changing the select navigates immediately.
- 1 or 2 characters never navigate. The previous results stay visible under the shorter input.
- Initial values: the leaf reads `useSearchParams` and therefore sits inside `<Suspense>`, whose fallback is the same form markup rendered by the server, empty and uncontrolled. Identical layout, and it still submits without JavaScript. With Cache Components a client component reading `useSearchParams` on a prerendered route must sit inside a boundary or the build fails.
- Syncing with the URL: the select's value is derived from `useSearchParams` directly, with no local state. The text input keeps local state and adopts the URL's `q` in an effect whenever it differs from the last value the form itself navigated to, which covers the category chips, "Clear search", the product page's breadcrumb and browser Back. The leaf is never remounted with a `key`: that would drop focus and caret while typing.

### Results `components/search/search-results.tsx`

Async server component receiving the `searchParams` promise.

- Normalise: `q = (q ?? '').trim().slice(0, 64)`, `category` validated against the cached category slugs (unknown slug treated as none).
- Default state (no q, no category): `getFeaturedProducts({ limit: 10, min: 10 })` from E04, heading "Featured", no count.
- Category only: `getProducts({ category, limit: 5 })`.
- Query present, no explicit `category`: category-aware expansion. If `expandQuery` matches a category, run `getProducts({ search: q, limit: 5 })` and `getProducts({ category: matched.slug, limit: 5 })` with `Promise.all` and merge with `mergeResults`; otherwise one `getProducts({ search: q, limit: 5 })`.
- Query plus an explicit `category`: `getProducts({ search: q, category, limit: 5 })` only.
- Heading, plain path (one call): "N results" / "1 result" when `total <= 5`, otherwise "Showing 5 of {total} results". Expansion path (two merged calls): "N results" when nothing was cut, otherwise "Showing the first 5". The heading carries `aria-live="polite"`.
- Whenever results were capped, add the nudge "Pick a category to narrow it down".
- The hint "Includes everything in {Category}" appears only when the category call added at least one product the search did not return *and* none of the category's products were cut by the cap; otherwise it would promise something the grid does not show.
- Grid: `<ProductGrid variant="search" priorityCount={2} />`. The first 2 cards get `priority`, which is the first row on mobile.

### Product grid `components/product-grid.tsx`

Shared by the home page and search, so the column count and the `sizes` string can never drift apart.

- `ProductGrid({ products, variant, priorityCount })` and `ProductGridSkeleton({ variant, count })`.
- `variant: 'home' | 'search'` owns the column classes and the matching `sizes` it passes to `ProductCard`: `home` is `grid grid-cols-2 gap-4 md:grid-cols-3`, `search` is `grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5`.
- `ProductCard` takes `sizes` as a prop instead of hard-coding it; the grid owns it from now on.

### Empty state `components/search/empty-state.tsx`

One component, three variants, all of them ending in category chips (links to `/search?category=<slug>`, name only).

- `q` only: `No products match "{q}"`, the chips and a "Clear search" link to `/search`. This branch is E13's hook point (record the miss); E07 marks it with a one-line comment and no code.
- `q` and category: `No products match "{q}" in {Category}`, a "Search all categories" link to `/search?q={q}`, then the chips.
- Category only: `Nothing in {Category} right now`, then the chips.

### Loading state

`ResultsSkeleton` is `ProductGridSkeleton({ variant: 'search', count: 5 })` under a skeleton heading, so the swap into real results causes no CLS. The default state's extra rows (10 cards) append below the 5-card skeleton, which grows the page rather than shifting it.

### Failure

A results-scoped client error boundary (`components/error-boundary.tsx`, a small class component, with `components/search/results-error.tsx` as the presenter) renders "Search is unavailable right now" and a Try again button that calls `router.refresh()` inside `startTransition` and resets the boundary. The form stays usable and `app/error.tsx` is never reached. Catch blocks around API calls call `unstable_rethrow` first, as everywhere else.

### Pure logic `lib/search.ts`

One file: the three functions are one concept and the repo groups `lib/*.ts` by topic.

- `normaliseQuery(raw)`: trim, slice to 64 characters.
- `expandQuery(q, categories)`: `norm = q.toLowerCase().replace(/s$/, '')`; returns the first category whose `slug` or lowercased `name` equals `norm` or `norm + 's'`, or contains either as a whole word. The plural case relies entirely on this: the API does not search category names, so `search=hats` returns 0 hits on its own.
- `mergeResults(searchHits, categoryItems, cap)`: search hits first, then category items not already present by `id`, capped; returns the merged list plus an `added` flag (the category contributed at least one product) and a `truncated` flag (the cap cut something).

## Tests

- Vitest `lib/search.test.ts`: `expandQuery` covering "hat" → hats, "Hats" → hats, "bag" → bags, "tee" → none, "cups" → cups, "shirt" → t-shirts; `mergeResults` covering search-first ordering, de-duplication by `id`, the cap, and the `added` / `truncated` flags; `normaliseQuery` covering trimming, the 64-character slice and whitespace-only → empty.
- Playwright `apps/store/e2e/search.spec.ts`: visit `/search?q=hat` directly, see three hats and the hint line, reload and see the same; type "bea" and see the Beanie without pressing Enter; select a category and see the URL and the grid update; combine text and category and see the narrowed result; search "umbrella" and see the empty state with chips; `/search` shows the "Featured" default with 10 cards. The category select and the grid are located by role and accessible name, never by class.

## Acceptance criteria

- [ ] Shell static, results dynamic (build output shows `/search` as a partial prerender; the RSC payload confirms the form is in the shell).
- [ ] Enter, button and 3+ character typing all trigger a search; fewer than 3 characters do not.
- [ ] Refresh and shared URLs reproduce results, and the form shows the URL's values after hydration.
- [ ] Category select filters; combined with text it narrows.
- [ ] Empty state (all three variants) and loading state visible; a results-level error renders without losing the form (verified by starting the server with an unreachable `API_BASE_URL`).
- [ ] Up to 5 results in the 2 / 3 / 5 grid; the default state shows 10.
- [ ] "hat" returns the three hats with the hint line; "hats" too; "black" shows "Showing 5 of 28 results" with the nudge.
- [ ] The home page renders its grid at 2 / 3 columns with no visual regression elsewhere.

## Out of scope

Pagination, sorting, price filters, search history, the search-gap capture (E13).
