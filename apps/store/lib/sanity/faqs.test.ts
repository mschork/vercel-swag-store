import { describe, expect, it } from 'vitest'
import { faqsForProduct } from './faqs'

const faq = (id: string, question: string, order: number) => ({
  _id: id,
  question,
  answer: [],
  order,
})

describe('faqsForProduct', () => {
  it('shows the questions the category answers', () => {
    const list = faqsForProduct({
      categoryFaqs: [faq('a', 'Shipping?', 10), faq('b', 'Sizing?', 20)],
      attachedFaqs: null,
    })
    expect(list.map((f) => f._id)).toEqual(['a', 'b'])
  })

  it('adds the questions the product attaches', () => {
    const list = faqsForProduct({
      categoryFaqs: [faq('a', 'Shipping?', 10)],
      attachedFaqs: [faq('c', 'Laptop fit?', 5)],
    })
    expect(list.map((f) => f._id)).toEqual(['c', 'a'])
  })

  it('shows a question reached both ways only once', () => {
    const list = faqsForProduct({
      categoryFaqs: [faq('a', 'Shipping?', 10)],
      attachedFaqs: [faq('a', 'Shipping?', 10)],
    })
    expect(list).toHaveLength(1)
  })

  it('orders by the editor’s number, then alphabetically', () => {
    const list = faqsForProduct({
      categoryFaqs: [faq('b', 'Washing?', 10), faq('a', 'Sizing?', 10)],
      attachedFaqs: [faq('c', 'Shipping?', 5)],
    })
    expect(list.map((f) => f.question)).toEqual(['Shipping?', 'Sizing?', 'Washing?'])
  })

  it('answers with nothing when the product has no document', () => {
    expect(faqsForProduct(null)).toEqual([])
  })
})
