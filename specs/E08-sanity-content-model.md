# E08 Sanity content model and Studio

Branch: `epic/E08-sanity`, shared with E09. Depends on: E01. Blocks: E09, which ships in the same pull request.

## Goal

A Studio where an editor manages marketing copy and product enrichment without touching a field the API owns, and where every link from editorial content to the catalogue is an ordinary Sanity reference.

## Model

Seven document types. Products and categories are mirrors of the API, written by a script and read only in the Studio (`docs/adr/0003-sanity-mirrors-api-products-and-categories.md`). The rest is editorial.

Ids contain no dots. A dot makes everything before it a document path, which changes who may read the document: `product.hoodie_001` is invisible to an anonymous client, `product-hoodie_001` is not.

### Mirrors

- `category`: `apiSlug` (string, `_id` is `category-<apiSlug>`), `name`, `syncedAt`, `missing` (boolean). All read only.
- `product`: mirrored and read only: `apiId` (string, `_id` is `product-<apiId>`), `slug`, `name`, `category` (reference to `category`), `price` (cents), `featured`, `image` (the API's first photo as a URL, for the document preview), `syncedAt`, `missing`. Editorial: `extendedDescription` (Portable Text), `care` (Portable Text), `gallery[]` (image with required alt, hotspot), `faqs[]` (references to `faq`).

### Editorial

- `siteSettings` (singleton): `storeName`, `seoTitle`, `seoDescription`, `ogImage` (image with alt), `socialLinks[]` `{ label, url }`, `footerText`, `productPage { aboutHeading, careHeading, lookbookHeading, faqHeading }` (the headings on a product page; each empty field falls back to the wording the store ships).
- `homePage` (singleton): `hero { headline, description, image (image with alt and hotspot) }`, `featured { heading, linkLabel }` (the copy over the featured grid; empty fields fall back to “Featured” and “View all”), `favourites { heading }` (the copy over the lookbook-ranked row; empty, it says “People’s favourites”).
- `checkoutPage` (singleton): `title`, `body` (Portable Text), `continueShoppingLabel`.
- `lookbookEntry`: `person`, `role`, `photo` (image with required alt and hotspot), `quote`, `products[]` (references to `product`), `consent` (boolean, must be true to publish, enforced by validation), `publishedAt`.
- `faq`: `question`, `answer` (Portable Text), `order` (number, lowest first), `categories[]` (references to `category`).

An FAQ with no categories appears only where a product attaches it; the field description says so. An FAQ that applies to everything names every category.

Portable Text everywhere: paragraphs, bold, italic and links. No headings, lists, images or custom marks. Images live in the fields built for them.

## Studio `apps/studio`

- Desk, in the order an editor works, each item with its own icon. Under the list's "Content" title: Products, FAQs, Lookbook. Under a "Website" heading: Home page, Checkout page, Site settings. Under "Taxonomies": Categories. Under "Demand signals" (E13): Search gaps, All gaps, and a Product ideas folder. The headings are titled dividers. Singletons open their document directly; the create menu offers only FAQ and Lookbook entry.
- Previews: product shows its photo, name and category; lookbook shows the photo and person; FAQ shows the question and its categories.
- Plugins: `structureTool`, `visionTool`, `sanity-plugin-media`.
- `sanity typegen`: `sanity schema extract` then `sanity typegen generate` into `packages/sanity/src/generated/sanity.types.ts`, committed, script `pnpm --filter @repo/sanity typegen`.

## Sync script `packages/sanity/scripts/sync.ts`

Reads the API through the store's own client, writes one `category` per API category and one `product` per API product, sets `syncedAt`, and flags anything the API no longer returns as `missing`. Idempotent through fixed `_id`s, never touches editorial fields, and runs with `SANITY_API_WRITE_TOKEN` from `working/` (local only, never in Vercel). E15 replaces the trigger with a scheduled Sanity Function.

## Seed `packages/sanity/scripts/seed.ts`

Runs the sync, then writes demonstration content: the three singletons with the store's current fallback copy, two enriched products (hoodie and backpack) with a description and care text, two lookbook entries, and four FAQs. Placeholder copy, listed in `specs/improvements.md`. Idempotent.

## Deployment

`apps/studio` on Vercel, plus `sanity deploy`. Sanity CORS allows `http://localhost:3333`, the Vercel studio URL and the store URLs.

## Acceptance criteria

- [ ] Studio runs locally and on both deployed URLs; an editor can create an FAQ and a lookbook entry and enrich a product.
- [x] Mirrored fields are visible and not editable; editorial fields are editable.
- [ ] `lookbookEntry` cannot be published without `consent`.
- [x] Typegen output committed and imported by the store.
- [x] Sync and seed populate a fresh dataset in one run and are safe to re-run.

## Out of scope

Store rendering (E09), visual editing, localisation, roles, collections and guides (`specs/improvements.md`).
