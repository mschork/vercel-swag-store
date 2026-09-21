# E20 Content for AI crawlers

Branch: `epic/E20-ai-crawlers`. Depends on: E05, E09, E18. Blocks: nothing. One PR.

## Goal

A client that runs no scripts and reads Markdown better than HTML gets every catalogue fact the store shows a person: as structured data in the page, as a Markdown version of the page, and through an `llms.txt` index. The brief (`assignment.md`) does not ask for this. The store stays noindex (`callout.md`, "The store is noindex on purpose"), so nothing here asks to be found or cited: it demonstrates the technique, and it is measured by checks anyone can run.

## Structured data `lib/structured-data.ts`

| Page | Types |
|---|---|
| Product | `Product` with one `Offer`; `BreadcrumbList`; `FAQPage` when the page shows FAQs |
| All products, category | `ItemList` of product URLs; `BreadcrumbList` on a category |
| Home | `WebSite` with the store's name and URL |
| Search, cart, checkout | none |

- `Product`: name, description, image, category, `brand` with the name "Vercel", which is what the catalogue says the products are. `Offer`: `price` as a decimal string, `priceCurrency` from the API, `url`. No `availability`: stock is a per-visitor draw (`docs/adr/0006-the-stable-visit.md`).
- No `Organization`, `seller` or `publisher` anywhere. Those are claims about who runs the site, and the site is a demonstration.
- No `Review`: a testimonial carries no rating, and a site's own reviews of its own products are not reviews.
- `FAQPage` answers are the plain text of the rich text answer.
- Each builder is a pure function with unit tests; the pages render the result in one `<script type="application/ld+json">` per type.

## Markdown versions

### URL contract

- `/index.md`, `/products.md`, `/products/category/<slug>.md`, `/products/<slug>.md`: the Markdown version of the page at the same address without the suffix (`/index.md` for `/`).
- Search, cart and checkout have none. An unknown slug, and a product the API no longer lists, is a 404.
- Rewrites in `next.config.ts` map the four shapes to route handlers under `app/md/`, outside `/api/`, so `robots.ts`, the product slug route and the typed-route helper in `lib/listing.ts` are untouched. There is no content negotiation on `Accept`.

### Responses

- `Content-Type: text/markdown; charset=utf-8`, and `Link: <the HTML page>; rel="canonical"`.
- `X-Robots-Tag: noindex`, from the header every response already carries.
- The sitemap does not list them. `llms.txt` is their index.
- Prerendered at build for every product and category (`generateStaticParams`), refreshed by the `products`, `categories` and `sanity` tags. A handler awaits cached work only: pending work outside a cache makes a prerendered route dynamic under load.
- Published content only, read without stega. Draft mode does not apply.

### Content `lib/markdown/`

The rule is what the page shows, minus anything per visitor: no stock, no promotion, no cart.

- Every file opens with its h1 and a link to its HTML page. Every other internal link goes to a `.md` address, so a reader can walk the store without parsing HTML.
- Product: name, price, category, the API's description, the photo, then the enrichment, facts before voices: "About this item", care, the extra photos, FAQs, and last the testimonials, each a quote with the person's name and role. The page opens with the testimonials; a reader after facts gets those first. No testimonial photos.
- All products and category: the heading, the category intro when an editor wrote one, then each product as a list item with name, price and link. No count typed by hand, no sort.
- Home: the store's name, the hero's headline and description, the featured products, the favourites when there are any, and a link to each category.
- Prices go through `formatPrice()`.
- The product renderer takes the merged product from `mergeProduct` and nothing else, and the structured-data builder takes the same object, so a fact cannot be in one rendering and missing from another. The API wins over Sanity for commerce facts, as on the page.
- `portable-text.ts` turns the store's rich text (paragraphs, bold, italic, links) into Markdown and into plain text. No dependency is added.
- Text from the API and the CMS passes through verbatim, escaped for Markdown. The store does not try to detect instructions embedded in it; one that is noticed is reported in the PR.

## `llms.txt`

`app/llms.txt/route.ts`: the store's name as the h1, a first paragraph that says the products are invented and the site is a demonstration that asks not to be indexed, then a link to `/index.md`, one per category and one per product, each to its Markdown version. Built from `getCategories()` and `getAllProducts()`, so it pages with `hasNextPage` and refreshes with the same tags. There is no `llms-full.txt`.

## Discovery

Each page that has a Markdown version carries `<link rel="alternate" type="text/markdown">` in its head, through `alternates.types` in its metadata. There is no visible control.

## Crawlers `app/robots.ts`

Two signals, because two kinds of crawler obey different ones. Search engines, and the AI answers built on their indexes, obey `X-Robots-Tag: noindex`, and only if they may fetch the page to read it: the `*` group keeps allowing everything but `/api/`. AI training crawlers ignore that header and obey `robots.txt`: a second group names them (`AI_CRAWLERS` in `lib/crawlers.ts`) and disallows `/`. The list is a constant with a test, since new crawlers appear and it is the one place to add them.

The Markdown and `llms.txt` stay fetchable by anyone who asks: a reviewer, or an agent acting for a user. `robots.txt` is a request, not a gate, so the acceptance check below still gets a 200 with a crawler's user agent.

## Out of scope

A theme switcher; a visible link or button for the Markdown; `llms-full.txt`; content negotiation; blocking crawlers by user agent on the server; `Review`, `Organization` and `availability` markup; Markdown for search, cart and checkout.

## Acceptance

Before merge, against a production build:

- [x] The build lists every page as before, and every new route as static, on five runs of the full pipeline in a row.
- [x] A client that runs no scripts, with the user agents of common AI crawlers, gets 200 and `text/markdown` for each Markdown URL and `text/plain` for `llms.txt`; an unknown slug gets 404.
- [x] For three products, every fact in the Markdown matches the rendered page: name, price, category, description, enrichment, FAQs.
- [x] No Markdown file, no `llms.txt` and no JSON-LD block holds stock or a promotion.
- [x] Every link in `llms.txt` and in the Markdown files resolves.
- [x] The rendered JSON-LD passes the schema.org validator and the Rich Results test's code input without errors.
- [x] Revalidating the `products` tag refreshes a Markdown file and `llms.txt`.
- [x] `robots.txt` allows `*` everything but `/api/`, disallows `/` for every name in `AI_CRAWLERS`, and every response of a production build carries `X-Robots-Tag: noindex`.
- [x] `pnpm verify` passes.

After merge:

- [x] The Rich Results test reads `Product` and `Offer` from a production product URL.
- [x] Production carries `X-Robots-Tag: noindex` on a page, the sitemap, an image route, a Markdown file and `llms.txt`. `ALLOW_INDEXING` is not set in the Production environment.
