# E05 Product detail page

Branch: `epic/E05-pdp`. Depends on: E02, E03. Blocks: E06 (needs the Add to Cart form).

## Goal

`/products/[slug]` prerendered from cached product data, with the visitor's stock streamed into a Suspense hole and an Add to Cart form whose enabled state follows what is left of it. The count comes from the `visit` cookie, drawn from the API once per visitor (E19), so it is the same on every reload.

## Scope

### Route `app/products/[slug]/page.tsx`

- `generateStaticParams` returns slugs from `getAllProductSlugs()`. `dynamicParams` stays true so an unknown slug still resolves at request time (then 404s).
- `params` is a Promise in Next.js 16; `await params` before use.
- `generateMetadata`: title `product.name`, description from product description (truncated to 160 chars), `openGraph.images` pointing at `/products/[slug]/opengraph-image`.
- `app/products/[slug]/opengraph-image.tsx` via `next/og`: product image on black with name and price. Fetches the product through the cached `getProduct`.
- Page body (server component, cached data):
  1. Breadcrumb: Home / Category name / Product name (category name from `getCategories()`).
  2. Two-column layout at md and up: `<ProductGallery />` left, details right; stacked on mobile.
  3. Details: name (h1), `formatPrice`, description paragraph, then `<Suspense fallback={<StockSkeleton />}><StockAndCart productId slug /></Suspense>`.
- Unknown slug: `getProduct` throws `ApiError` 404, page calls `notFound()`; `app/products/[slug]/not-found.tsx` offers a link to search.

### Structured data and crawl files

- PDP renders a `<script type="application/ld+json">` with `Product` (name, image, description, sku = id, brand "Vercel Swag Store") and `Offer` (price in major units, `priceCurrency`, `availability` from the visitor's draw and omitted when there is none, rendered inside the same Suspense boundary) and a `BreadcrumbList`. Availability follows the draw alone, never the cart, so it describes the product rather than the visitor.
- `app/sitemap.ts`: home, search, and every product slug from `getAllProductSlugs()`; `lastModified` from `createdAt`. Cached like the catalogue.
- `app/robots.ts`: allow all, disallow `/api/`, point at the sitemap. Crawling is allowed everywhere else so the site-wide `noindex` header is read.

### Gallery `components/product/gallery.tsx`

- Large `next/image` with `priority`, `sizes="(min-width: 768px) 50vw, 100vw"`, aspect square, on the surface-secondary token.
- Thumbnails only when more than one image exists (API products have one; Sanity enrichment in E09 may add more). Client component for thumbnail selection, otherwise server.

### Stock and cart `components/product/stock-and-cart.tsx`

- Async server component: reads the visit cookie (never cached) and passes the product's draw to a client leaf, which subtracts what the visitor's cart holds. With no visit yet it passes nothing and the leaf keeps the skeleton until one opens.
- Renders `<StockIndicator>`: "In stock", "Only N left" at 5 or fewer, "This item is out of stock at the moment. Check back soon." at a draw of 0, "All N are in your cart" when the cart holds the whole draw, "Stock unavailable" when the visit has no count for the product. Colour plus text plus icon-free; never colour alone.
- Renders `<AddToCartForm>` with `max` and `unavailable` taken from what remains.

### Add to Cart form `components/product/add-to-cart-form.tsx`

- Client component. `<form action={addToCart}>` where `addToCart` is the Server Action from E06 (in this epic, a stub action that logs and returns `{ ok: true }` so the epic ships independently; E06 replaces the body).
- Hidden `productId`, `<QuantityStepper name="quantity" min={1} max={max} />` (client, native number input plus minus and plus buttons, clamped, `aria-live` on the value).
- Submit button text exactly "Add to Cart". When nothing is left it is disabled and reads "Currently unavailable" (out of stock, or no count) or "All in your cart", and the stepper stays in place, disabled at 0 and faded to 30% opacity.
- After a successful action, show an inline "Added" confirmation with a link to `/cart`.

### Tests

- Vitest: `QuantityStepper` clamps to `[min, max]` and disables plus at max.
- Playwright (E12 runs it; write the test here): with the visit cookie seeded, the PDP renders name, price and a known stock line, and the button state matches it.

## Acceptance criteria

- [x] All product slugs prerendered at build; build output shows `/products/[slug]` as static with one dynamic Suspense boundary.
- [x] Stock line reflects the visitor's draw, which the API supplied and which stays the same on every reload for a day.
- [x] Button text "Add to Cart", disabled when nothing is left, quantity cannot exceed what remains.
- [x] Unknown slug returns a 404 page with the shell intact.
- [x] OG image for a product renders in a social debugger.

## Out of scope

Cart persistence (E06), Sanity enrichment sections (E09), testimonials strip (stretch).
