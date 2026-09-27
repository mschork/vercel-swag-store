import { generateText, Output, type LanguageModel } from 'ai'
import { MODEL } from './constants.ts'
import { TEXT_CHECK_INSTRUCTIONS, analysisInstructions, textCheckPrompt, type PromptProduct } from './prompt.ts'
import { PhotoAnalysisSchema, TextCheckSchema, type PhotoAnalysis, type TextCheck } from './schemas.ts'

/**
 * The agent's two model calls, each one structured answer. A plain model
 * string routes through AI Gateway. An answer that fails its schema throws,
 * and the calling step's retry asks again.
 */

export interface PhotoInput {
  image: Uint8Array
  mediaType: 'image/jpeg' | 'image/png'
  products: readonly PromptProduct[]
  model?: LanguageModel
}

/** The one vision call on a photo, against the whole catalogue. */
export async function analysePhoto({ image, mediaType, products, model = MODEL }: PhotoInput): Promise<PhotoAnalysis> {
  const { output } = await generateText({
    model,
    system: analysisInstructions(products),
    output: Output.object({ schema: PhotoAnalysisSchema }),
    messages: [{ role: 'user', content: [{ type: 'file', data: image, mediaType }] }],
    temperature: 0,
  })
  return output
}

/** Screens the name, the quote and the suggested alt text. */
export async function checkText(
  texts: { name: string; quote: string; altText: string },
  model: LanguageModel = MODEL,
): Promise<TextCheck> {
  const { output } = await generateText({
    model,
    system: TEXT_CHECK_INSTRUCTIONS,
    prompt: textCheckPrompt(texts),
    output: Output.object({ schema: TextCheckSchema }),
    temperature: 0,
  })
  return output
}
