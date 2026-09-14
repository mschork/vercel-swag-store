# E08 Sanity content model and Studio

Branch: `epic/E08-sanity-model`. Depends on: E01. Blocks: E09.

## Goal

A Sanity Studio that lets an editor manage marketing content and product enrichment without ever touching the fields the API owns. Everything here is stretch relative to the brief; keep it clean rather than complete.

## Scope

### Schemas in `packages/sanity/src/schema/`

All product references are the API `id` string (e.g. `tshirt_001`), never a Sanity reference, since products are not Sanity documents.

- `siteSettings` (singleton): `storeName`, `seoTitle`, `seoDescription`, `ogImage` (image with alt), `socialLinks[]` `{ label, url }`, `footerText`.
- `catalogProduct`: read-only mirror of one API product for picking and referencing: `apiId` (string, `_id` is `catalogProduct.<apiId>`), `slug`, `name`, `category`, `featured`, `price` (cents), `syncedAt`. Written by the seed script; E15 replaces the seed with a scheduled Sanity Function. Hidden from the desk's create menu.
- `checkoutPage` (singleton): `title`, `body` (Portable Text, no images), `backToCartLabel`, `continueShoppingLabel`.
- `homePage` (singleton): `hero { headline, description, ctaLabel, ctaHref, image (image with alt, hotspot) }`, `sections[]` of `collectionSection { collection ref, title }` and `lookbookSection { title, entries[] refs }` [stretch].
- `productEnrichment`: `apiId` (string, required, unique via validation against existing docs), `apiSlug` (string, denormalised for display), `title` (string, editor-facing only), `extendedDescription` (Portable Text with images), `gallery[]` (image with alt, hotspot), `badges[]` (string from a list: New, Limited, Staff pick), `care` (Portable Text, "How to use / care"), `collections[]` refs, `lookbook[]` refs, `guides[]` refs.
- `lookbookEntry`: `person`, `role`, `photo` (image, alt, hotspot, required), `quote`, `productIds[]` (strings via the API picker), `consent` (boolean, must be true to publish, enforced by validation), `publishedAt`.
- `collection`: `title`, `slug`, `description`, `cover` (image), `productIds[]` ordered.
- `guide`: `title`, `slug`, `body` (Portable Text with images and a `productEmbed` block holding an `apiId`), `productIds[]`.
- `searchGap` and `productIdea` are defined in E13.

Portable Text config: headings h2 and h3, bold, italic, links. No custom marks. Images (with alt) only in `guide.body`; `productEnrichment.extendedDescription` is text only, product imagery lives in the gallery.

### API product picker `packages/sanity/src/components/ProductPicker.tsx`

Custom input for string fields marked with `options.productPicker: true`. Reads `catalogProduct` documents from the dataset (GROQ, no network call outside Sanity) and offers a searchable list of name, category and slug; stores the API `id`. The Studio never talks to the Swag Store API, so it holds no API secret: remove `SANITY_STUDIO_API_BASE_URL` and `SANITY_STUDIO_API_BYPASS_TOKEN` from `apps/studio/.env.example` and from the Vercel studio project in this epic.

### Studio `apps/studio`

- Desk structure: Site settings (singleton), Home page (singleton), Products (enrichment list ordered by `apiSlug`), Lookbook, Collections, Guides, then a divider and "Demand signals" (E13).
- Document actions: default. Enable `@sanity/vision`.
- Preview config for each type (title, subtitle, media).
- `sanity typegen`: `sanity.types.ts` generated into `packages/sanity/src/generated/` and committed; script `pnpm --filter @repo/sanity typegen` runs `sanity schema extract` and `sanity typegen generate`.

### Seed `packages/sanity/scripts/seed.ts`

Creates `siteSettings` and `homePage` with the E03/E04 fallback values, one `collection` ("Conference kit": tote, lanyard, notebook, pen, cap), and two `productEnrichment` docs (hoodie, backpack) with placeholder care text. Idempotent via fixed `_id`s. Uses a write token from `SANITY_API_WRITE_TOKEN` (local only, never in Vercel).

### Deployment

- `apps/studio` on Vercel (E01 project). Also `sanity deploy` to `<name>.sanity.studio`.
- Sanity project CORS: add `http://localhost:3333`, the Vercel studio URL, and the store URLs (for E09 preview if ever used).

## Acceptance criteria

- [ ] Studio runs locally and on both deployed URLs; an editor can create every document type.
- [ ] Product picker lists live API products and stores ids; a typo id is impossible through the UI.
- [ ] `lookbookEntry` cannot be published without `consent`.
- [ ] Typegen output committed and imported by the store (E09).
- [ ] Seed script populates a fresh dataset in one run and is safe to re-run.

## Out of scope

Store-side rendering (E09), visual editing, localisation, roles beyond the default.
