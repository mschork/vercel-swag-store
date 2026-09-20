# E18 Product listing

Branch: `epic/E18-product-listing`. Depends on: E02, E03, E07 (ProductGrid), E08, E09, E17. Blocks: nothing. The epic is cut into two slices, one PR each; each leaves `main` shippable.

## Goal

A place to browse the whole catalogue: `/products` for everything, one page per category, a price sort, and one sentence of editorial copy per category. Every listing page is fully prerendered. Search stays what it is: a finder capped at five results.

## Why paths and not params

Search is dynamic because free text has unbounded values. A category is one of a closed set the API lists, so each one can be a page built ahead of time. No listing page reads `searchParams`, `cookies()` or `headers()`. The build output marks them as partial prerenders like every other page, and the only dynamic hole is the one the root layout brings: the header's cart badge (see `callout.md`).

## URL contract

- `/products`: every product the API returns.
- `/products/category/<slug>`: the products of one category. `<slug>` is a category slug from `getCategories()`. The static `category` segment takes precedence over `/products/[slug]`.
- An unknown slug is a 404. No query parameter means anything on either route; the sort is not in the URL.

## Slice 1: the listing (API only)

### Data `lib/api/products.ts`

- `getProductsInCategory(slug)`: filters the cached `getAllProducts()` by `product.category`. One cache entry and one set of API calls serve every listing page; the category value is still the API's own (rule 1). No `"use cache"` of its own: it is a plain filter over a cached call.
- Order is the order the API returns. Nothing is counted or capped (rule 6).

### Routes

- `app/products/page.tsx` and `app/products/category/[slug]/page.tsx`, both rendering one shared `components/listing/product-listing.tsx` with `{ category: Category | null }`.
- `generateStaticParams` on the category route returns every slug from `getCategories()`. The page resolves its category with `findCategory(slug)` and calls `notFound()` for `null`.
- Layout, top to bottom: h1, the category chips, one row with the count on the left and the sort on the right, the grid. The count shares the sort's row so that row has its height before hydration and the select arriving shifts nothing.
- h1: "All products", or the category's name. Count: "N products" / "1 product", from the length of the list that is rendered.
- Links to a category page are built by `categoryPath(slug)` in `lib/listing.ts`. It holds the one `as Route` cast: with two dynamic routes under `/products`, typed routes cannot place a template string whose slug is a plain `string`.
- Metadata: title equal to the h1. Description "Browse every product in the store." or "Browse all {name} in the store." (slice 2 lets an editor replace the second). Indexable, unlike search results. No `opengraph-image.tsx`; the root image applies.

### Category chips `components/listing/category-chips.tsx`

A server component: a `<nav aria-label="Categories">` holding a list of `next/link` links, "All" first, then one per category in the API's order. The active chip carries `aria-current="page"` and the strong border. Links, not a select: moving between pages is what a link is for, they work without JavaScript, they are prefetched and a crawler can follow them. The chips share the height, border and type size of the search page's select so the two pages read as one system. Below md the row scrolls sideways instead of wrapping, so the grid starts within the first screen. The `<ul>` is a small client leaf, `chip-row.tsx`, whose one effect moves the row to the current chip on mount, without animation: a category far down the list would otherwise open with its own chip out of sight. Without JavaScript the row starts at "All" and the heading still names the category.

A category the API lists but that holds no products keeps its chip.

### Sort `components/listing/sortable-grid.tsx`

- The server renders the cards in API order. A small client leaf receives the rendered cards with each product's id and price in cents, and re-orders the list items in the DOM. No CSS `order`: reading order, tab order and visual order stay the same thing.
- Options, in a native select labelled "Sort": "Default", "Price: low to high", "Price: high to low". Ties keep the API's order (a stable sort). No sort by name or by newest: every product shares one `createdAt`.
- The select is rendered by the client leaf only after hydration. Without JavaScript the page shows the default order and no control that does nothing.
- Changing the sort is announced through a visually hidden `aria-live="polite"` line ("Sorted by price, low to high").
- The choice lives in component state: it is a view preference over products already on the page, not a different page. It resets on navigation to another listing page.
- The pure comparison lives in `lib/listing.ts` as `sortProducts(items, order)` so it is unit-tested without React.

### Grid

`ProductGrid` gains a `listing` variant: row cards below md, 3 columns from md, 4 from lg, with the matching `sizes`. `preloadCount` covers the first row, because on these pages the grid is the largest paint. The grid's list markup is split so `sortable-grid` can own the `<ul>` while `ProductGrid` keeps owning column classes and `sizes`.

### Empty category

A real category with no products renders the shared `components/empty-state.tsx` frame with "Nothing in {Category} right now" and a link to `/products`. The chips above it are the other way out. No sort control.

### Failure

`getAllProducts()` failing at build stops the build, as for product pages (`callout.md`). At revalidation time the last good page keeps being served.

### Navigation

- Header: "Products" between "Home" and "Search". `NavLink` marks it current on `/products` and on every `/products/category/*` page, not on a product page.
- The header's "Search" link gets a magnifying-glass glyph before its label: an inline SVG in the cart icon's stroke style, `aria-hidden`, no icon dependency. The label stays the accessible name. With three links the row is 2px too wide at 320px, so below sm the label is visually hidden and the glyph stands alone.
- The home page's "View all" points at `/products`.
- The product page's breadcrumb category points at `/products/category/<slug>` instead of `/search?category=<slug>`: the category's own page is the better parent. The search page's empty-state chips keep pointing at search, where the visitor already is.

### Sitemap

`app/sitemap.ts` adds `/products` and one entry per category from `getCategories()`.

## Slice 2: the category intro (Sanity)

### Schema `packages/sanity/src/schemas/category.ts`

- One new field: `intro`, `text` with 2 rows, optional, `max(200)`, in a new group "Listing page" that is the default group. Description: "One or two sentences under the heading of this category's page. Also used as the page's description for search engines."
- The mirrored fields stay `readOnly` in "From the catalogue". The document now has the product document's shape: machine-written mirror, human-written copy (`docs/adr/0003`).
- The sync creates a category with its mirrored fields or patches only those, as it does for products. It used `createOrReplace` for categories while they had nothing of an editor's to lose; `queueCatalogue` in `scripts/sync.ts` holds the writes so a test can prove no editorial field is ever set and nothing is replaced.
- Types regenerated with TypeGen.

### Read `lib/sanity/content.ts`

- `getCategoryDocument(apiSlug)` through `sanityFetch`, tags `sanity:category` and `sanity:category-<slug>`, wrapped in `loadOptional`: a missing document, an empty intro or a Sanity outage all mean "no paragraph", and the listing renders exactly as in slice 1.
- `getCategoryDocumentForMetadata(apiSlug)` with `stega: false` for the description.
- The publish webhook's tag mapping covers `category` documents.
- `/products` has no intro: it has no document behind it, and a singleton for one sentence is not worth a schema.

### Render

The intro is a paragraph under the h1, above the count, in the secondary text colour, `max-w-prose`. The meta description is the intro when there is one, the slice 1 sentence otherwise.

### Draft mode and Presentation

- The listing reads the intro through the draft-aware fetch, so in draft mode it carries stega and is click-to-edit with no new mechanism. Reading `draftMode()` does not make the route dynamic (E17).
- `apps/studio/presentation/resolve.ts` gains `category`: its location is its listing page, and `/products/category/:slug` names the category document as the page's main document. The comment that lists `category` as mirror-only is corrected.

### Seed

The seed script writes one intro per category the API returns, keyed by slug, with `setIfMissing` so an editor's text is never replaced. A category the seed has no copy for gets none. The copy lives in `scripts/category-intros.ts`, is generated, and is flagged as such in the PR. The API has no category description to mirror or fall back to: a category is a slug, a name and a product count.

## Tests

- Vitest `lib/listing.test.ts`: `sortProducts` for both directions, stability on equal prices, "Default" returning the input order, and no mutation of its input.
- Vitest `lib/api/products.test.ts`: `getProductsInCategory` returns only that category, keeps API order, returns an empty list for a category with no products.
- Vitest `app/sitemap.test.ts`: `/products` and one URL per category.
- Vitest, slice 2, in `packages/sanity` (which gains a `test` script): the sync never replacing a document and never writing an editorial field; the seed using `setIfMissing`, skipping a category it has no copy for, and keeping every intro within 200 characters. The location resolver has no unit test, like the other resolvers in the Studio, which has no test runner.
- Playwright `apps/store/e2e/listing.spec.ts`: `/products` shows as many cards as the API's total; a chip navigates to its category page, shows only that category's cards and is marked current; an unknown slug is a 404; "Price: low to high" puts the prices in ascending order and "Default" restores the first order; with JavaScript disabled the chips navigate and no sort control exists; the header's "Products" and the home page's "View all" arrive at `/products`. Located by role and accessible name, never by class.

## Acceptance criteria

Slice 1

- [ ] Build output lists `/products` and every `/products/category/<slug>` as prerendered paths; the header's cart badge is their only dynamic hole.
- [ ] `/products` renders every product the API returns; a category page only its own; counts match.
- [ ] Chips navigate without JavaScript; the active chip is marked and in view; the row scrolls on a phone without the page scrolling sideways.
- [ ] The sort re-orders the DOM, is announced, and is absent without JavaScript.
- [ ] Unknown category 404s; an empty category shows the empty state.
- [ ] Header shows Home, Products, Search with the glyph, and fits at 320px; "View all" and the breadcrumb point at the listing.
- [ ] Sitemap lists `/products` and every category page.
- [ ] No regression in the home, search or favourites grids.

Slice 2

- [ ] An editor's intro shows under the category heading and as the meta description; publishing updates the page through the webhook.
- [ ] No intro, no document or no Sanity: the page equals slice 1.
- [ ] In draft mode the intro is click-to-edit, and the category document shows its location in the Studio.
- [ ] A sync run leaves `intro` untouched; the seed never overwrites one.

## Out of scope

A price-range filter (`improvements.md`), pagination, a sort in the URL, sort by name or date, category images, an intro on `/products`, any change to the search page.
