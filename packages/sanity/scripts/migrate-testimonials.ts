import { createClient } from '@sanity/client'
import { required } from './env.ts'

/**
 * One-off: `lookbookEntry` documents become `testimonial` documents, and the
 * site settings' `lookbookHeading` becomes `testimonialsHeading`. A document's
 * `_type` cannot change in place, so each entry is copied under a new id.
 *
 * Two phases, so the live site never loses the block:
 *
 *   1. copy     before the new code is deployed. The old documents stay, and
 *               the old code keeps reading them.
 *   2. cleanup  after the new code is live. Deletes the old documents and
 *               unsets the old heading.
 *
 * Both are dry runs unless `--write` is passed, and both can be re-run.
 *
 *   pnpm --filter @repo/sanity migrate-testimonials copy [--write]
 *   pnpm --filter @repo/sanity migrate-testimonials cleanup [--write]
 */
const OLD_TYPE = 'lookbookEntry'
const NEW_TYPE = 'testimonial'

const [phase, ...flags] = process.argv.slice(2)
const write = flags.includes('--write')
if (phase !== 'copy' && phase !== 'cleanup') {
  throw new Error('Say which phase: "copy" or "cleanup". Add --write to apply it.')
}

const client = createClient({
  projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
  token: required('SANITY_API_WRITE_TOKEN'),
  apiVersion: '2026-09-01',
  useCdn: false,
  // Drafts too: an unpublished entry is an editor's work in progress.
  perspective: 'raw',
})

/** `abc` becomes `testimonial-abc`, `drafts.abc` becomes `drafts.testimonial-abc`. */
const newId = (id: string) =>
  id.startsWith('drafts.') ? `drafts.${NEW_TYPE}-${id.slice('drafts.'.length)}` : `${NEW_TYPE}-${id}`

const old = await client.fetch<Record<string, unknown>[]>(`*[_type == $type]`, { type: OLD_TYPE })
const settings = await client.fetch<{ _id: string; old?: string; new?: string }[]>(
  `*[_type == "siteSettings"]{ _id, "old": productPage.lookbookHeading, "new": productPage.testimonialsHeading }`,
)
const transaction = client.transaction()

if (phase === 'copy') {
  const pointingAtOld = await client.fetch<string[]>(`*[references(*[_type == $type]._id)]._id`, { type: OLD_TYPE })
  if (pointingAtOld.length > 0) {
    throw new Error(`These documents reference an entry and would need repointing first: ${pointingAtOld.join(', ')}`)
  }
  for (const doc of old) {
    const { _id, _rev, _createdAt, _updatedAt, ...fields } = doc
    void _rev, _createdAt, _updatedAt
    transaction.createIfNotExists({ ...fields, _id: newId(String(_id)), _type: NEW_TYPE })
    console.log(`copy  ${String(_id)}  ->  ${newId(String(_id))}  (${String(fields.person ?? '')})`)
  }
  for (const doc of settings) {
    if (doc.old && !doc.new) {
      transaction.patch(doc._id, (patch) => patch.set({ 'productPage.testimonialsHeading': doc.old }))
      console.log(`heading  ${doc._id}: "${doc.old}" copied to testimonialsHeading`)
    }
  }
} else {
  const copied = new Set(await client.fetch<string[]>(`*[_type == $type]._id`, { type: NEW_TYPE }))
  const missing = old.filter((doc) => !copied.has(newId(String(doc._id))))
  if (missing.length > 0) {
    throw new Error(`Run "copy --write" first: ${missing.length} entries have no testimonial yet.`)
  }
  for (const doc of old) {
    transaction.delete(String(doc._id))
    console.log(`delete  ${String(doc._id)}`)
  }
  for (const doc of settings) {
    if (doc.old !== undefined && doc.old !== null) {
      transaction.patch(doc._id, (patch) => patch.unset(['productPage.lookbookHeading']))
      console.log(`heading  ${doc._id}: lookbookHeading unset`)
    }
  }
}

if (write) {
  await transaction.commit()
  console.log(`Done: ${phase}, ${old.length} entries.`)
} else {
  console.log(`Dry run: ${phase}, ${old.length} entries. Nothing was written; add --write to apply.`)
}
