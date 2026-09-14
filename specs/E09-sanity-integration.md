# E09 Sanity integration and revalidation

Branch: `epic/E09-sanity-integration`. Depends on: E04, E05, E08. Blocks: E13 (uses the same fetch layer).

## Goal

Sanity content rendered through the same `"use cache"` discipline as the API, with tag-based revalidation on publish, merged with API data under the rule "API wins for what it owns".

## Scope

### Fetch layer `apps/store/lib/sanity/`

```
client.ts     next-sanity client from @repo/sanity factory; useCdn false; token from SANITY_API_READ_TOKEN (dataset may stay public; token kept for future private datasets)
fetch.ts      sanityFetch<T>({ query, params, tags }) wrapped in "use cache", cacheTag('sanity', ...tags), cacheLife('catalog')
queries.ts    GROQ with defineQuery for: siteSettings, homePage, productEnrichmentByApiId, collectionBySlug, collectionsList, guideBySlug, guidesForProduct, lookbookForProduct
image.ts      urlFor() via @sanity/image-url, plus a helper returning next/image-friendly src and blurDataURL
merge.ts      mergeProduct(apiProduct, enrichment | null): MergedProduct
```

Tags: every query tags `sanity` and `sanity:<type>`; single-document queries also tag `sanity:<_id>`.

### Merge rules `merge.ts`

`MergedProduct` extends `Product` with optional `extendedDescription`, `gallery`, `badges`, `care`, `collections`, `lookbook`, `guides`. Rules, tested in `merge.test.ts`:

- `id, slug, name, price, currency, category, featured, images[0], tags, createdAt` always from the API.
- `gallery` = `[api.images[0], ...enrichment.gallery]` de-duplicated.
- Editorial fields copied only when non-empty.
- `enrichment === null` returns the API product unchanged.

### Webhook `app/api/revalidate/route.ts`

- POST handler validating the Sanity signature with `parseBody` from `next-sanity/webhook` and `SANITY_REVALIDATE_SECRET`.
- Body projection configured in Sanity: `{ _type, _id, "apiId": apiId, "slug": slug.current }`.
- Calls `revalidateTag('sanity:' + _type)` and `revalidateTag('sanity:' + _id)`; for `productEnrichment` also nothing API-related (the API cache is untouched by design).
- Returns 200 with the tags revalidated; 401 on bad signature; 400 on bad body.
- Register the webhook in Sanity Manage for the production dataset, on create, update, delete, pointing at the store's production URL.

### Site settings and metadata (E03 revisit)

- Root `generateMetadata` reads `siteSettings` via `sanityFetch` and falls back to the E03 constants when the document is missing. Because it is cached, the root stays static.
- Footer social links prefer `siteSettings.socialLinks`, then `/store/config`.

### Homepage (E04 revisit)

- Hero reads `homePage.hero` with fallback; hero image from Sanity via `urlFor` when present, else the product image.
- Optional sections: `collectionSection` renders the collection's products via cached `getProduct` calls in `Promise.all`; `lookbookSection` renders a horizontal strip of entries. Both only if present in the document; both stretch.

### PDP (E05 revisit)

Below the description, in order and only when present: badges on the gallery image, "About this item" (extendedDescription), "How to use and care" (care), "Seen on" (lookbook entries with photo, person, quote), "Part of" (collection links), "Guides" (guide links). Gallery thumbnails appear when `gallery.length > 1`.

### Optional routes (stretch)

- `app/collections/[slug]/page.tsx` and `app/guides/[slug]/page.tsx`, static via `generateStaticParams` from Sanity slugs, `"use cache"` throughout, `notFound()` on missing. Guides render Portable Text with `@portabletext/react` and a custom `productEmbed` component that renders a `ProductCard` from the cached API product.

### Tests

- Vitest for `merge.ts` and for the webhook handler (signature valid, invalid, wrong type).
- Playwright: edit the hero headline in Studio, publish, and see the change on the site within 10 s (manual step in the checklist rather than automated).

## Acceptance criteria

- [ ] Home and PDP render enrichment when present and identically to E04/E05 when absent.
- [ ] Publishing in Studio updates the site without a redeploy; API-derived fields never change from a Sanity publish.
- [ ] Build output unchanged in static/dynamic terms compared with E07 (Sanity adds no dynamic holes).
- [ ] `merge.test.ts` proves API precedence.
- [ ] Webhook rejects unsigned requests.

## Out of scope

Visual editing and Presentation, draft previews, Live Content API, localisation.
