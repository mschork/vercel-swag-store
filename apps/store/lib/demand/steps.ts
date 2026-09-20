import 'server-only'
import { generateText, Output, type LanguageModel } from 'ai'
import {
  MODEL,
  ModelOutputSchema,
  buildPrompt,
  claimGaps,
  purgeStale,
  releaseGaps,
  writeOutcome,
  type Cluster,
  type Gap,
  type ModelOutput,
  type OutcomeCounts,
  type PromptCategory,
  type PromptProduct,
} from '@repo/demand'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import { getWriteClient } from '@/lib/sanity/write-client'

/**
 * The bodies of the analysis workflow's steps (workflows/analyse-demand.ts),
 * as plain functions so they can be tested without a workflow runtime. Each is
 * thin: it builds its client and calls `@repo/demand`, which owns the prompt,
 * the schema, the model id and every query. Never cached, and never reachable
 * from a page's request path.
 */

function writeClient() {
  const client = getWriteClient()
  if (!client) throw new Error('SANITY_API_WRITE_TOKEN is not set, so the analysis cannot run.')
  return client
}

export type ClaimedGap = Pick<Gap, '_id' | 'query' | 'count'>

export async function claim(runId: string): Promise<ClaimedGap[]> {
  const client = writeClient()
  await purgeStale(client)
  const { claimed } = await claimGaps(client, runId)
  return claimed.map(({ _id, query, count }) => ({ _id, query, count }))
}

export interface Catalogue {
  products: PromptProduct[]
  categories: PromptCategory[]
}

/** The whole catalogue through the cached readers, which page with `hasNextPage`. */
export async function catalogue(): Promise<Catalogue> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()])
  return {
    products: products.map(({ name, slug, category }) => ({ name, slug, category })),
    categories: categories.map(({ slug, name }) => ({ slug, name })),
  }
}

/**
 * The loop's one model call: structured output, no tools, no chat. A plain
 * model string routes through AI Gateway. An answer that fails the schema
 * throws, and the step's retry asks again.
 */
export async function propose(
  input: Catalogue & { gaps: readonly ClaimedGap[] },
  model: LanguageModel = MODEL,
): Promise<ModelOutput> {
  const { system, prompt } = buildPrompt(input)
  const { output } = await generateText({
    model,
    output: Output.object({ schema: ModelOutputSchema }),
    system,
    prompt,
    temperature: 0,
  })
  return output
}

export function write(outcome: {
  runId: string
  gaps: readonly ClaimedGap[]
  clusters: readonly Cluster[]
  unmentioned: readonly string[]
}): Promise<OutcomeCounts> {
  return writeOutcome(writeClient(), { ...outcome, model: MODEL })
}

export function release(runId: string): Promise<number> {
  return releaseGaps(writeClient(), runId)
}
