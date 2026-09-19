# E09 Sanity integration and revalidation

Branch: `epic/E08-sanity`, shared with E08. Depends on: E04, E05, E08. Blocks: E13, which reuses the fetch layer.

## Goal

Sanity content rendered through the same `"use cache"` discipline as the API, revalidated when an editor publishes, and merged under one rule: the API wins for everything it owns.

## Fetch layer `apps/store/lib/sanity/`

```
client.ts    next-sanity client from the @repo/sanity factory; useCdn false; no token, the dataset is public
fetch.ts     sanityFetch<T>({ query, params, tags }) wrapped in "use cache", cacheTag('sanity', ...tags), cacheLife('content')
queries.ts   GROQ with defineQuery: siteSettings, homePage, checkoutPage, productByApiId, faqsForProduct, testimonialsForProduct, favouriteProducts
image.ts     urlFor() via @sanity/image-url, plus a helper returning a next/image source and the blurred placeholder from Sanity's metadata
merge.ts     mergeProduct(apiProduct, document | null): MergedProduct
```

Every query tags `sanity` and `sanity:<type>`; single-document queries also tag `sanity:<_id>`. The `content` cache profile is new in `next.config.ts`: stale 5 minutes, revalidate 1 day, expire 7 days. The webhook does the real work; the timer is the safety net.

## Merge rules `merge.ts`

`MergedProduct` extends `Product` with optional `extendedDescription`, `care` and `gallery`. Proven in `merge.test.ts`:

- `id, slug, name, price, currency, category, featured, images, tags, createdAt` always from the API, whatever the document says.
- `gallery` is the API's first image followed by the document's gallery, deduplicated.
- Editorial fields are copied only when non-empty.
- A missing document returns the API product unchanged.

## FAQs on a product

The union of the FAQs whose categories include the product's category and the FAQs the product attaches directly, deduplicated by `_id`, ordered by `order` then question. An FAQ with no categories reaches a product only through that product's own list. One GROQ query, tested for the union, the ordering and the empty case.

## Webhook `app/api/revalidate/sanity/route.ts`

- POST, signature verified with `parseBody` from `next-sanity/webhook` against `SANITY_REVALIDATE_SECRET`.
- Projection configured in Sanity: `{ _type, _id }`.
- Expires `sanity:<_type>` and `sanity:<_id>`. The API's own caches are untouched by design.
- 200 with the tags expired, 401 on a bad signature, 400 on a body it cannot read.
- Registered in Sanity Manage for the production dataset on create, update and delete, pointing at production.

## What each page reads

- **Root metadata and footer** (E03 revisit): `siteSettings` for the title, description, Open Graph image and social links, falling back to the API's `/store/config`. Both cached, so the shell stays static.
- **Home** (E04 revisit): `homePage.hero` for the headline, description and photo, falling back to the copy and file that ship today. The Sanity photo uses hotspot and its blurred placeholder. Under the featured grid, a row of up to four "People's favourites": the products the most published testimonials name, ordered by that count, then by the newest entry, then by id. The API supplies every fact on the card, so a product it no longer returns is dropped; no testimonials means no section.
- **Product page** (E05 revisit), each block rendered only when it has content, in this order under the buy row: "What people say about it" (testimonials naming this product, heading renamable), "About this item", "How to use and care", "Common questions" (the FAQ union). People come first because the buy panel already carries the short description; the longer text is reference. Thumbnails appear when the merged gallery holds more than one photo. The blocks share one readable column so no paragraph is narrower than the rule above it. The testimonials render under a heading that spans the section: the newest entry as a feature, the quote ranged right at the foot of a photo that fills the right column, and up to four others, newest first, in a second row shaped by their number so it always spans the page: one mirrors the feature (photo left, words right), two take half the page each with the photo beside the words at the card's size, three or four are cards with the words underneath. Five entries at most; older ones wait their turn.
- **Cart** (E06 revisit): the same favourites row, under the cart. Empty, it follows the home page rule; with lines in it, the products already in the cart are excluded and the ranking is read one deeper per line so the row still fills. Only the exclusion is dynamic.
- **Checkout** (E06 revisit): the `checkoutPage` singleton, falling back to today's copy, body rendered as Portable Text.

Every fallback stays. An empty dataset renders exactly what ships today, and a failed Sanity call renders the fallback rather than a gap.

## Tests

- Vitest: merge precedence, the FAQ union and ordering, the Portable Text serializer's allowed marks, and the webhook's three answers.
- Playwright: a product with no document renders as it does today; the visual snapshots from E11 are regenerated only if enrichment changes a page that has it.
- Manual, in the release checklist: edit the hero headline in the Studio, publish, and see the site change without a deploy.

## Acceptance criteria

- [x] Home, product page and checkout render Sanity content when present and exactly as before when absent.
- [x] Publishing in the Studio updates the site without a redeploy; API-owned fields never change from a Sanity publish.
- [x] Build output unchanged in static and dynamic terms: Sanity adds no dynamic hole.
- [x] `merge.test.ts` proves API precedence; the FAQ query proves the union.
- [x] The webhook rejects an unsigned request.

## Out of scope

Visual editing and Presentation, draft previews, the Live Content API, localisation, collections and guides (`specs/improvements.md`).
