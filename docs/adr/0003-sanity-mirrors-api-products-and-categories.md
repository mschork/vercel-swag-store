---
status: accepted
date: 2026-09-18
---

# Sanity holds a mirror document for every API product and category

The API owns products and categories; Sanity owns marketing copy and enrichment. Sanity nonetheless keeps one `product` document per API product and one `category` document per API category, written by a script, with their API-derived fields read only in the Studio.

Duplicating data that another system owns is the kind of thing this project otherwise refuses to do, so the reason needs recording.

## Why

Editors work with the catalogue constantly: they enrich a product, attach an FAQ to a category, name the products in a testimonial's photo. Every one of those is a link from editorial content to a catalogue item. Sanity can only validate, search and reverse-look-up links between its own documents. Without mirrors, each link is a bare string that has to be typed or picked through a custom input built against a foreign API, and nothing stops it from pointing at a product that never existed.

With mirrors, every link is an ordinary Sanity reference. The Studio gets search, previews, the "used by" panel and validation for free, the store answers "which testimonials show this product" with `references($id)`, and no custom picker component exists to maintain.

## Considered options

- **Bare API id strings plus a custom picker** (the original E08 plan): no duplicated data, but a bespoke input component, no referential integrity, no reverse lookups, and a second concept for editors to learn.
- **Sanity as the catalogue**: removes the duplication entirely by making Sanity the source of truth, which contradicts the requirements and the API's role.
- **Mirror documents, chosen**: the duplication is real but one-directional and machine-written.

## Consequences

- The API stays the source of truth at render time. The store reads catalogue fields from the API and never from the mirror; `mergeProduct` copies only editorial fields across, proven by `merge.test.ts`.
- Mirrored fields are `readOnly` in the schema, so an editor sees which product they are editing and cannot change a price in a place that has no effect.
- A category document has the product document's shape since E18: the mirrored fields stay read only, and beside them sits the one thing an editor writes, the intro for that category's product listing. The sync never touches it.
- A script keeps the mirrors current, run by hand in this epic. E15 replaces the trigger with a scheduled Sanity Function; the logic does not change.
- A product removed from the API leaves its document behind, flagged rather than deleted, so editorial work is never destroyed by an API answer.
- The dataset carries 28 product and 13 category documents that no editor created. The Studio's desk hides them behind their own lists, and the create menu offers only the editorial types.
