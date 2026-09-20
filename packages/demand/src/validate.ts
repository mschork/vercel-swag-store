import type { Cluster, ModelOutput } from './model-schema.ts'

export interface ValidationContext {
  /** The gaps this run claimed; anything else the model names is dropped. */
  gapIds: readonly string[]
  products: readonly { name: string; slug: string }[]
  categories: readonly { slug: string }[]
}

export interface ValidatedClusters {
  clusters: Cluster[]
  /** Claimed gaps no surviving cluster mentions; they go back to `new`. */
  unmentioned: string[]
}

/**
 * Checks the model's output before anything is written: every gap id must
 * have been claimed, every slug must exist today, and no idea may repeat a
 * product. Anything else is dropped.
 */
export function validateClusters(output: ModelOutput, context: ValidationContext): ValidatedClusters {
  const claimed = new Set(context.gapIds)
  const productNames = new Set(context.products.map((p) => p.name.trim().toLowerCase()))
  const categorySlugs = new Set(context.categories.map((c) => c.slug))
  const matchable = new Set([...categorySlugs, ...context.products.map((p) => p.slug)])
  const used = new Set<string>()
  const clusters: Cluster[] = []

  for (const cluster of output.clusters) {
    if (cluster.kind === 'newProduct') {
      const title = cluster.title?.trim().toLowerCase()
      if (!title || productNames.has(title)) continue
    }
    const gapIds = cluster.gapIds.filter((id) => claimed.has(id) && !used.has(id))
    if (gapIds.length === 0) continue
    for (const id of gapIds) used.add(id)

    const clean: Cluster = {
      kind: cluster.kind,
      gapIds,
      rationale: cluster.rationale,
      title: null,
      suggestedCategory: null,
      match: null,
    }
    if (cluster.kind === 'newProduct') {
      clean.title = cluster.title?.trim() ?? null
      if (cluster.suggestedCategory && categorySlugs.has(cluster.suggestedCategory)) {
        clean.suggestedCategory = cluster.suggestedCategory
      }
    }
    if (cluster.kind === 'alreadySold') {
      if (cluster.match && matchable.has(cluster.match)) clean.match = cluster.match
      else clean.kind = 'noise'
    }
    clusters.push(clean)
  }

  return { clusters, unmentioned: context.gapIds.filter((id) => !used.has(id)) }
}
