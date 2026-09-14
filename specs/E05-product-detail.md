# E05 Product detail page

Branch: `epic/E05-pdp`. Depends on: E02, E03. Blocks: E06 (needs the Add to Cart form).

## Goal

`/products/[slug]` prerendered from cached product data, with real-time stock streamed into a Suspense hole and an Add to Cart form whose enabled state follows stock.

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

- PDP renders a `<script type="application/ld+json">` with `Product` (name, image, description, sku = id, brand "Vercel Swag Store") and `Offer` (price in major units, `priceCurrency`, `availability` from the stock result, rendered inside the same Suspense boundary so it reflects live stock) and a `BreadcrumbList`.
- `app/sitemap.ts`: home, search, and every product slug from `getAllProductSlugs()`; `lastModified` from `createdAt`. Cached like the catalogue.
- `app/robots.ts`: allow all, disallow `/cart` and `/api/`, point at the sitemap.

### Gallery `components/product/gallery.tsx`

- Large `next/image` with `priority`, `sizes="(min-width: 768px) 50vw, 100vw"`, aspect square, on the surface-secondary token.
- Thumbnails only when more than one image exists (API products have one; Sanity enrichment in E09 may add more). Client component for thumbnail selection, otherwise server.

### Stock and cart `components/product/stock-and-cart.tsx`

- Async server component: `const stock = await getStock(productId)` (never cached). Passes `stock` to the client form.
- Renders `<StockIndicator stock />`: "In stock", "Only N left" when `lowStock`, "Out of stock" when `!inStock`. Colour plus text plus icon-free; never colour alone.
- Renders `<AddToCartForm productId max={stock.stock} disabled={!stock.inStock} />`.

### Add to Cart form `components/product/add-to-cart-form.tsx`

- Client component. `<form action={addToCart}>` where `addToCart` is the Server Action from E06 (in this epic, a stub action that logs and returns `{ ok: true }` so the epic ships independently; E06 replaces the body).
- Hidden `productId`, `<QuantityStepper name="quantity" min={1} max={max} />` (client, native number input plus minus and plus buttons, clamped, `aria-live` on the value).
- Submit button text exactly "Add to Cart"; `disabled` when `disabled` prop is true or while `useFormStatus().pending`.
- After a successful action, show an inline "Added" confirmation with a link to `/cart` [assumption: inline message rather than a toast].

### Tests

- Vitest: `QuantityStepper` clamps to `[min, max]` and disables plus at max.
- Playwright (E12 runs it; write the test here): PDP renders name, price, stock text, and the button state matches stock.

## Acceptance criteria

- [ ] All product slugs prerendered at build; build output shows `/products/[slug]` as static with one dynamic Suspense boundary.
- [ ] Stock line reflects the live API on every request (verify by reloading twice and seeing values change).
- [ ] Button text "Add to Cart", disabled when out of stock, quantity cannot exceed stock.
- [ ] Unknown slug returns a 404 page with the shell intact.
- [ ] OG image for a product renders in a social debugger.

## Out of scope

Cart persistence (E06), Sanity enrichment sections (E09), lookbook strip (stretch).

## Open questions

1. When stock is 0, hide the quantity stepper or show it disabled? [assumption: show disabled, so the layout does not shift]
2. Breadcrumb category link: to `/search?category=<slug>` [assumption: yes]
