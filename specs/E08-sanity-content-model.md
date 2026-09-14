# E08 Sanity content model and Studio

Branch: `epic/E08-sanity-model`. Depends on: E01. Blocks: E09.

## Goal

A Sanity Studio that lets an editor manage marketing content and product enrichment without ever touching the fields the API owns. Everything here is stretch relative to the requirements; keep it clean rather than complete.

## Scope

### Schemas in `packages/sanity/src/schema/`

All product references are the API `id` string (e.g. `tshirt_001`), never a Sanity reference, since products are not Sanity documents.

- `siteSettings` (singleton): `storeName`, `seoTitle`, `seoDescription`, `ogImage` (image with alt), `socialLinks[]` `{ label, url }`, `footerText`.
- `homePage` (singleton): `hero { headline, description, ctaLabel, ctaHref, image (image with alt, hotspot) }`, `sections[]` of `collectionSection { collection ref, title }` and `lookbookSection { title, entries[] refs }` [stretch].
- `productEnrichment`: `apiId` (string, required, unique via validation against existing docs), `apiSlug` (string, denormalised for display), `title` (string, editor-facing only), `extendedDescription` (Portable Text with images), `gallery[]` (image with alt, hotspot), `badges[]` (string from a list: New, Limited, Staff pick), `care` (Portable Text, "How to use / care"), `collections[]` refs, `lookbook[]` refs, `guides[]` refs.
- `lookbookEntry`: `person`, `role`, `photo` (image, alt, hotspot, required), `quote`, `productIds[]` (strings via the API picker), `consent` (boolean, must be true to publish, enforced by validation), `publishedAt`.
- `collection`: `title`, `slug`, `description`, `cover` (image), `productIds[]` ordered.
- `guide`: `title`, `slug`, `body` (Portable Text with images and a `productEmbed` block holding an `apiId`), `productIds[]`.
- `searchGap` and `productIdea` are defined in E13.

Portable Text config: headings h2 and h3, bold, italic, links, images with alt. No custom marks.

### API product picker `packages/sanity/src/components/ProductPicker.tsx`

Custom input for string fields marked with `options.productPicker: true`. Fetches `/products?limit=100` from the API using `SANITY_STUDIO_API_BASE_URL` and `SANITY_STUDIO_API_BYPASS_TOKEN` (Studio is behind Sanity auth; the token is still exposed to editors in the bundle, acceptable for a demo and stated in the README [assumption]). Shows name, id, thumbnail; stores the `id`. For array fields, the same component in multi-select mode.

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

## Open questions

1. Sanity project: do you want to create it yourself (so it sits in your account) and give me the project id, or should the seed script assume placeholders until then? [assumption: you create it; specs use `<projectId>`]
2. Portable Text extended description: allow images inline, or keep images to the gallery only? [assumption: allow]
3. Lookbook consent: a checkbox is enough for a demo, or do you also want a "credit" field for public photos of others? [assumption: add `credit` string]
