import { categoryId } from './sync.ts'

/**
 * Placeholder intros for the categories the API had when E18 was written,
 * keyed by slug (specs/E18-product-listing.md). Generated copy for an editor
 * to replace. A category missing from this list simply gets no intro, and the
 * listing renders without one.
 */
export const CATEGORY_INTROS: Readonly<Record<string, string>> = {
  bottles: 'Insulated steel for the desk, the gym and the long deploy. Cold stays cold, hot stays hot.',
  cups: 'Tumblers and cold cups for the commute, with lids that survive a laptop bag.',
  mugs: 'Ceramic for the first coffee and the last review of the day.',
  desk: 'Small things that make a desk yours: mats, coasters and whatever else keeps it tidy.',
  stationery: 'Notebooks and pens for the ideas that need paper before they need a branch.',
  accessories: 'Pins, stickers and keychains. The triangle, wherever you want it.',
  bags: 'Totes and backpacks with room for a laptop, a charger and a change of plans.',
  hats: 'Caps, beanies and a bucket hat. Black, so they go with everything you own.',
  't-shirts': 'Heavyweight cotton tees, cut to keep their shape after the hundredth wash.',
  hoodies: 'Warm, heavy and black: the unofficial uniform of shipping late.',
  socks: 'Comfortable socks with a small triangle, for conference floors and sofas.',
  tech: 'Cables, chargers and sleeves for the hardware that does the actual work.',
  books: 'Reading on the web, design and the craft of shipping software.',
}

type IntroTransaction = {
  patch(id: string, operations: { setIfMissing: { intro: string } }): unknown
}

/**
 * Queues one intro per given category slug that has copy here. `setIfMissing`
 * and nothing else: a re-run never replaces what an editor wrote, and an
 * editor who empties the field gets the placeholder back only by choice of
 * re-running the seed.
 */
export function queueCategoryIntros(transaction: IntroTransaction, slugs: readonly string[]) {
  let queued = 0
  for (const slug of slugs) {
    const intro = CATEGORY_INTROS[slug]
    if (!intro) continue
    transaction.patch(categoryId(slug), { setIfMissing: { intro } })
    queued += 1
  }
  return queued
}
