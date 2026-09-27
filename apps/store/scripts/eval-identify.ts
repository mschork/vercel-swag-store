/**
 * Runs the photo analysis over a labelled image set and writes each answer
 * with its label as JSON, for scoring by hand. The same call as the agent's
 * `analysePhoto` step. Run by hand, never in CI:
 *
 *   node --env-file=.env.local scripts/eval-identify.ts <labels.json> <out.json> [model] [limit]
 *
 * `labels.json` maps an image path, relative to itself, to
 * `{ group, products }`, the API ids the image shows. Needs Node 24 for type
 * stripping, `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY`, and `API_BASE_URL`
 * with `API_BYPASS_TOKEN` for the catalogue. AI Gateway's free tier limits
 * requests per minute, so `CONCURRENCY` defaults to one.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { analysePhoto } from '@repo/testimonials/analyse'
import { MODEL } from '@repo/testimonials/constants'
import { countingCandidates, photoVerdict } from '@repo/testimonials/draft'
import type { PromptProduct } from '@repo/testimonials/prompt'

type Label = { group: string; products: string[] }

/** Every product, paged with `hasNextPage` as the store's reader does. */
async function catalogue(): Promise<PromptProduct[]> {
  const products: PromptProduct[] = []
  for (let page = 1; ; page++) {
    const response = await fetch(`${process.env.API_BASE_URL}/products?page=${page}&limit=100`, {
      headers: { 'x-vercel-protection-bypass': process.env.API_BYPASS_TOKEN ?? '' },
    })
    const body = (await response.json()) as {
      data: PromptProduct[]
      meta: { pagination: { hasNextPage: boolean } }
    }
    products.push(...body.data.map(({ id, name, category, description }) => ({ id, name, category, description })))
    if (!body.meta.pagination.hasNextPage) return products
  }
}

async function main() {
  const [labelsPath, outPath, model = MODEL, limit] = process.argv.slice(2)
  if (!labelsPath || !outPath) throw new Error('usage: eval-identify <labels.json> <out.json> [model] [limit]')
  const labels = JSON.parse(await readFile(labelsPath, 'utf8')) as Record<string, Label>
  const entries = Object.entries(labels).slice(0, limit ? Number(limit) : undefined)
  const products = await catalogue()
  const results: unknown[] = []
  let next = 0

  async function worker() {
    while (next < entries.length) {
      const [file, label] = entries[next++] as [string, Label]
      const started = Date.now()
      try {
        const image = new Uint8Array(await readFile(resolve(dirname(labelsPath as string), file)))
        const mediaType = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
        const analysis = await analysePhoto({ image, mediaType, products, model })
        const top = countingCandidates(analysis)[0]?.id ?? null
        results.push({
          file,
          ...label,
          verdict: photoVerdict(analysis),
          top,
          correct: label.products.length === 0 ? top === null : top !== null && label.products.includes(top),
          analysis,
          ms: Date.now() - started,
        })
      } catch (error) {
        results.push({ file, ...label, error: String(error).slice(0, 400), ms: Date.now() - started })
      }
      process.stdout.write('.')
    }
  }

  await Promise.all(Array.from({ length: Number(process.env.CONCURRENCY ?? 1) }, worker))
  await writeFile(outPath, JSON.stringify({ model, results }, null, 1))
  console.log(`\n${results.length} results written to ${outPath}`)
}

await main()
