import { createClient } from '@sanity/client'
import { required } from './env.ts'

/**
 * Drafts "How to use and care" copy for the products that have none.
 *
 * Drafts only: each is a copy of the published mirror with `care` filled in,
 * written to `drafts.<id>`, so the store shows nothing until an editor reads
 * it and presses Publish. A product that already has care copy, or already has
 * a draft, is left alone, which also makes re-running harmless.
 *
 * The copy is cautious on purpose. The API says what a product looks like, not
 * what it is made of, so nothing here promises a dishwasher, a temperature a
 * label might contradict, or a charging speed.
 *
 * Run with `pnpm --filter @repo/sanity draft-care`.
 */

const CARE: Record<string, string[]> = {
  carabiner_001: ['For keys, badges and light clips only. It is not climbing equipment and must never carry a person or a load.', 'Wipe with a dry cloth. A drop of oil on the gate keeps it snapping shut.'],
  pin_001: ['Push the post straight through the fabric and press the clutch on until it grips. Thick canvas and denim hold it best.', 'Take it off before washing the garment. Polish with a soft dry cloth.'],
  lanyard_001: ['Hand wash in cool water with a little mild soap, then hang to dry. Unclip your badge first.', 'Keep the printed end away from the iron.'],
  keychain_001: ['Wipe with a soft dry cloth. Keys will mark the finish over time; that is wear, not a fault.', 'Dry it if it gets wet, so the ring stays free of rust.'],
  tote_001: ['Spot clean with a damp cloth and mild soap. If it needs a full wash, do it by hand in cold water, inside out.', 'Reshape while damp and hang to dry. Canvas shrinks in a dryer and the print does not like an iron.'],
  drawstring_001: ['Hand wash cold, or wipe clean with a damp cloth. Hang to dry.', 'Pull both cords together to close it, and do not overload it: the cords are the straps.'],
  book_001: ['Keep it dry and out of direct sun, which fades the cover. Dust with a soft dry cloth.', 'Store it upright or flat, never leaning.'],
  bottle_001: ['Wash by hand with warm soapy water before first use and after each day. A bottle brush reaches the base.', 'Leave it open to dry. No bleach, no abrasive pads, no freezer and no microwave. Not for fizzy drinks under a closed lid.'],
  tumbler_001: ['Wash by hand with warm soapy water; take the lid apart from the cup so both dry fully.', 'No microwave, no freezer, no abrasive pads on the matte finish. Hot drinks stay hot: sip carefully.'],
  coldcup_001: ['Made for cold drinks only. Hot liquid can warp the cup and the straw.', 'Wash cup, lid and straw by hand in warm soapy water and let them dry apart. A straw brush helps.'],
  coasters_001: ['Wipe with a damp cloth and dry straight away. Do not soak them.', 'Stack them dry. A wet glass left overnight can leave a ring on any coaster.'],
  deskmat_001: ['Wipe with a damp cloth and a drop of mild soap, then let it dry flat before the keyboard goes back.', 'If it arrives with a curl from the roll, lay it flat under a few books overnight. Keep it away from direct heat.'],
  cap_001: ['Spot clean with a damp cloth, or hand wash in cool water. Do not put it in the washing machine: the brim loses its shape.', 'Dry it over a bowl or a rolled towel so the crown keeps its form.'],
  beanie_001: ['Hand wash in cool water with mild soap. Press the water out in a towel; do not wring.', 'Dry flat, away from heat. Knit stretches when it hangs.'],
  bucket_001: ['Hand wash cold with mild soap and reshape the brim while damp.', 'Dry flat or over a bowl. No dryer, and keep the iron off the mark on the front.'],
  travel_mug_001: ['Wash by hand in warm soapy water and open the flip lid fully so the seal gets clean.', 'Close the lid until it clicks before it goes in a bag. No microwave. Hot drinks stay hot: sip carefully.'],
  mug_001: ['Wash by hand to keep the gloss and the print sharp for longer.', 'Avoid sudden changes of temperature, such as boiling water into a mug straight from a cold shelf.'],
  socks_001: ['Wash at 30 degrees, inside out, with similar colours.', 'Dry on a line. No bleach and no iron.'],
  pen_001: ['Click to write, click again before it goes in a pocket.', 'If it skips after a long rest, scribble a few circles on scrap paper to get the ink moving.'],
  journal_001: ['Keep it dry. The elastic holds loose notes as well as the cover, but do not overfill it or the band slackens.', 'Let ink dry for a moment before closing the page.'],
  notebook_001: ['Keep it dry and wipe the cover with a soft dry cloth.', 'It opens flatter after the first few uses; do not force the spine back on day one.'],
  pencils_001: ['Sharpen with a sharp blade or a good sharpener; a blunt one breaks the lead inside the wood.', 'Try not to drop them, for the same reason.'],
  notebook_002: ['Made for a pocket, but not for the wash: check before laundry day.', 'Keep it dry and let ink settle before closing it.'],
  tshirt_001: ['Wash at 30 degrees, inside out, with dark colours.', 'Dry on a line. If you iron it, iron around the print, never over it.'],
  phonecase_001: ['Take the phone out once in a while and wipe the case inside and out with a damp cloth. Grit trapped inside is what scratches a phone.', 'Let it dry fully before the phone goes back. No solvents or alcohol on the matte finish.'],
  charger_001: ['Place the pad on a flat, hard surface and the phone in the middle of it. Thick or metal cases, cards and magnets get in the way.', 'Unplug before cleaning and wipe with a dry cloth. Keep it away from liquids. It gets slightly warm in use, which is normal.'],
}

const blocks = (paragraphs: string[]) =>
  paragraphs.map((paragraph, index) => ({
    _type: 'block' as const,
    _key: `care${index}`,
    style: 'normal' as const,
    markDefs: [],
    children: [{ _type: 'span' as const, _key: `care${index}s`, text: paragraph, marks: [] }],
  }))

async function draftCare() {
  const client = createClient({
    projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
    token: required('SANITY_API_WRITE_TOKEN'),
    apiVersion: '2026-09-01',
    useCdn: false,
    perspective: 'raw',
  })

  const ids = Object.keys(CARE).map((apiId) => `product-${apiId}`)
  const existing = await client.fetch<Array<Record<string, unknown> & { _id: string }>>(
    `*[_id in $ids || _id in $draftIds]`,
    { ids, draftIds: ids.map((id) => `drafts.${id}`) },
  )
  const byId = new Map(existing.map((doc) => [doc._id, doc]))

  const transaction = client.transaction()
  const drafted: string[] = []
  const skipped: string[] = []
  for (const [apiId, paragraphs] of Object.entries(CARE)) {
    const id = `product-${apiId}`
    const published = byId.get(id)
    if (!published || published.care || byId.has(`drafts.${id}`)) {
      skipped.push(apiId)
      continue
    }
    const { _rev, _updatedAt, _createdAt, ...fields } = published
    void _rev, void _updatedAt, void _createdAt
    transaction.create({ ...fields, _id: `drafts.${id}`, _type: 'product', care: blocks(paragraphs) })
    drafted.push(apiId)
  }
  if (drafted.length > 0) await transaction.commit()
  console.log(`Drafted care copy for ${drafted.length}: ${drafted.join(', ') || 'none'}`)
  console.log(`Left alone ${skipped.length}: ${skipped.join(', ') || 'none'}`)
}

draftCare().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
