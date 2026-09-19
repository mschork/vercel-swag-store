import { z } from 'zod'

/**
 * The shape the model must answer in. A trust boundary: the model's text is
 * parsed here and checked again by `validateClusters` before anything is written.
 */
export const ClusterSchema = z
  .object({
    kind: z.enum(['newProduct', 'alreadySold', 'noise']),
    gapIds: z.array(z.string()).min(1),
    // Nullable, never optional: some providers' structured output requires
    // every property to be present, and null is accepted by all of them.
    title: z.string().max(60).nullable(),
    rationale: z.string().max(400),
    suggestedCategory: z.string().nullable(),
    match: z.string().nullable(),
  })
  .refine((c) => c.kind !== 'newProduct' || Boolean(c.title?.trim()), {
    path: ['title'],
    message: 'a newProduct cluster needs a title',
  })
  .refine((c) => c.kind !== 'alreadySold' || Boolean(c.match?.trim()), {
    path: ['match'],
    message: 'an alreadySold cluster needs a match',
  })

export const ModelOutputSchema = z.object({ clusters: z.array(ClusterSchema) })

export type Cluster = z.infer<typeof ClusterSchema>
export type ModelOutput = z.infer<typeof ModelOutputSchema>
