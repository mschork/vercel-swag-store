import type { ProductQueryResult } from '@repo/sanity/generated'

/**
 * The questions shown on one product: those its category answers, plus those
 * the product attaches itself (CONTEXT.md). Pure, so the rule is testable
 * without a dataset.
 *
 * An entry reached both ways appears once. Order is the editor's number,
 * lowest first, then the question alphabetically so the list never shuffles
 * between renders when two share a number.
 */
export type ProductFaq = {
  _id: string
  question: string
  answer: unknown
  order: number
}

export function faqsForProduct(
  product: Pick<NonNullable<ProductQueryResult>, 'categoryFaqs' | 'attachedFaqs'> | null,
): ProductFaq[] {
  const byId = new Map<string, ProductFaq>()
  for (const faq of [...(product?.categoryFaqs ?? []), ...(product?.attachedFaqs ?? [])]) {
    if (faq && !byId.has(faq._id)) byId.set(faq._id, faq)
  }
  return [...byId.values()].sort(
    (a, b) => a.order - b.order || a.question.localeCompare(b.question),
  )
}
