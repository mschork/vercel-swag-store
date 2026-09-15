# E07 Search page

Branch: `epic/E07-search`. Depends on: E02, E03, E04 (ProductCard). Blocks: E13.

## Goal

`/search` with server-side filtering through the API, the URL as the single source of state, a static shell and a dynamic results grid.

## URL contract

- `q` free text, `category` slug. Both optional. Example: `/search?q=hat&category=hats`.
- Empty `q` and no `category`: default state.
- Any other params are ignored. `page` is not supported (results capped at 5 per the brief).

## Scope

### Route `app/search/page.tsx`

- `searchParams` is a Promise; the page reads it inside `<SearchResults />` so the shell (heading, form) stays static. The page component itself must not `await searchParams` at the top level, or the whole route becomes dynamic.
- Layout: h1 "Search", `<SearchForm />` (client), then `<Suspense fallback={<ResultsSkeleton />}><SearchResults searchParams /></Suspense>`. The boundary is not re-keyed per search: the previous results stay visible while the next ones load and the form shows a pending cue via `useFormStatus` (see `callout.md`). The skeleton only shows on the first load of the route.
- `generateMetadata`: title `q ? \`Results for "${q}"\` : 'Search'`; `robots: { index: false }` when `q` is set.

### Search form `components/search/search-form.tsx`

Built on `Form` from `next/form` with `action="/search"` so it works without JavaScript: Enter and the button submit a GET with `q` and `category`, and Next prefetches the results route. A small client component wraps the input to add the debounced auto-search and the pending state; it reads initial values from `useSearchParams`.

- Text input with label (visually hidden) and placeholder "Search products"; a submit button "Search"; a native `<select>` for category with an "All categories" option; categories passed in as props from the server (`getCategories()`, cached).
- Triggers: submit (Enter or button) always navigates; typing triggers after `value.trim().length >= 3` with a 300 ms debounce; clearing the input to empty navigates to the default state; changing the select navigates immediately.
- Navigation via `router.replace(\`/search?${params}\`, { scroll: false })` wrapped in `startTransition`; `useTransition`'s `isPending` disables the button and sets `aria-busy` on the results region.
- Do not navigate for 1 or 2 characters unless the user submits.

### Results `components/search/search-results.tsx`

Async server component receiving `searchParams`.

- Normalise: `q = (q ?? '').trim().slice(0, 64)`, `category` validated against the cached category slugs (unknown slug treated as none).
- Default state (no q, no category): `getFeaturedProducts({ limit: 8, min: 8 })` from E04, heading "Featured".
- Category only: `getProducts({ category, limit: 5 })`.
- Query present: category-aware expansion. `norm = q.toLowerCase().replace(/s$/, '')`; find a category whose `slug` or lowercased `name` equals `norm` or `norm + 's'` or contains `norm` as a whole word. If found and no explicit `category` param, run `getProducts({ search: q, limit: 5 })` and `getProducts({ category: matched.slug, limit: 5 })` with `Promise.all`; merge search hits first, then category items not already present; cap at 5; show hint "Includes everything in {Category}". If a `category` param is present, run `getProducts({ search: q, category, limit: 5 })` only.
- Empty state: "No products match "{q}"" with category chips (links to `/search?category=<slug>`) and a "Clear search" link. Also the hook point for E13 (record the miss).
- Results heading shows count: "5 results" or "1 result".
- Grid reuses `<ProductCard />`, 2 / 3 / 4 columns as everywhere else.

### Loading state

`ResultsSkeleton` renders 5 card-shaped placeholders in the same grid to avoid CLS.

### Tests

- Vitest: `expandQuery(q, categories)` pure function covering "hat" → hats, "Hats" → hats, "bag" → bags, "tee" → none, "cups" → cups.
- Playwright: visit `/search?q=hat` directly and see the same results after reload; type "bea" and see results without pressing Enter; select a category and see the URL update; search "umbrella" and see the empty state.

## Acceptance criteria

- [ ] Shell static, results dynamic (build output and RSC payload).
- [ ] Enter, button and 3+ character typing all trigger a search; fewer than 3 characters do not.
- [ ] Refresh and shared URLs reproduce results.
- [ ] Category select filters; combined with text it narrows.
- [ ] Empty state and loading state visible.
- [ ] Up to 5 results in a responsive grid.
- [ ] "hat" returns the three hats with the hint line; "hats" too.

## Out of scope

Pagination, sorting, price filters, search history, the search-gap capture (E13).
