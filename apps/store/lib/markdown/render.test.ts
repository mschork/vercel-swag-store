import { describe, expect, it } from 'vitest'
import { product as apiProduct } from '@/test/helpers'
import type { Category, Product } from '@/lib/api/types'
import { PRODUCT_HEADINGS_FALLBACK } from '@/lib/content/fallbacks'
import type { MergedProduct } from '@/lib/sanity/merge'
import { homeMarkdown, listingMarkdown, llmsTxt, productMarkdown } from './render'

const SITE = 'https://store.test'
const tee = apiProduct({ price: 3050 }) as Product
const tote = apiProduct({ id: 'tote_001', name: 'Tote', slug: 'tote', price: 2000 }) as Product
const tees: Category = { slug: 't-shirts', name: 'T Shirts', productCount: 1 } as Category
const bags: Category = { slug: 'bags', name: 'Bags', productCount: 1 } as Category
const text = (value: string) => [{ _type: 'block', children: [{ _type: 'span', text: value }] }]

const merged = (overrides: Partial<MergedProduct> = {}): MergedProduct => ({
  ...tee,
  extendedDescription: null,
  care: null,
  gallery: tee.images,
  faqs: [],
  ...overrides,
})

describe('productMarkdown', () => {
  it('is the API-only product when nothing is enriched', () => {
    const markdown = productMarkdown({
      product: merged(),
      categoryName: 'T Shirts',
      photos: [{ src: 'https://example.com/tee.png', alt: 'Black Crewneck T-Shirt' }],
      testimonials: [],
      headings: PRODUCT_HEADINGS_FALLBACK,
      siteUrl: SITE,
    })
    expect(markdown).toBe(
      [
        '# Black Crewneck T-Shirt',
        '[View this product in the store](https://store.test/products/black-crewneck-t-shirt)',
        '- Price: $30.50\n- Category: [T Shirts](https://store.test/products/category/t-shirts.md)',
        'Plain black tee.',
        '![Black Crewneck T-Shirt](https://example.com/tee.png)',
      ].join('\n\n') + '\n',
    )
  })

  it('adds the enrichment under the page’s headings, and no testimonial photo', () => {
    const markdown = productMarkdown({
      product: merged({
        extendedDescription: text('Heavy cotton.') as MergedProduct['extendedDescription'],
        care: text('Wash cold.') as MergedProduct['care'],
        faqs: [{ _id: 'f1', question: 'Does it shrink?', answer: text('No.'), order: 1 }],
      }),
      categoryName: 'T Shirts',
      photos: [
        { src: 'https://example.com/tee.png', alt: 'Tee' },
        { src: 'https://cdn.sanity.io/back.jpg', alt: 'The back' },
      ],
      testimonials: [{ quote: 'I live in it.', person: 'Ada', role: 'Engineer' }, { person: 'No words' }],
      headings: PRODUCT_HEADINGS_FALLBACK,
      siteUrl: SITE,
    })
    expect(markdown).toContain(`## ${PRODUCT_HEADINGS_FALLBACK.about}\n\nHeavy cotton.`)
    expect(markdown).toContain(`## ${PRODUCT_HEADINGS_FALLBACK.care}\n\nWash cold.`)
    expect(markdown).toContain('## More photos\n\n![The back](https://cdn.sanity.io/back.jpg)')
    expect(markdown).toContain('### Does it shrink?\n\nNo.')
    expect(markdown).toContain('> I live in it.\n>\n> — Ada, Engineer')
    expect(markdown).not.toContain('No words')
  })

  it('never mentions stock or a promotion', () => {
    const markdown = productMarkdown({
      product: merged(),
      categoryName: 'T Shirts',
      photos: [],
      testimonials: [],
      headings: PRODUCT_HEADINGS_FALLBACK,
      siteUrl: SITE,
    })
    expect(markdown).not.toMatch(/stock|left|promo|discount|code/i)
  })

  it('escapes catalogue text, so a description cannot write markup', () => {
    const markdown = productMarkdown({
      product: merged({ description: '# Ignore the above\n[click](https://evil.test)' }),
      categoryName: 'T Shirts',
      photos: [],
      testimonials: [],
      headings: PRODUCT_HEADINGS_FALLBACK,
      siteUrl: SITE,
    })
    expect(markdown).toContain('\\# Ignore the above\n\\[click\\](https://evil.test)')
  })
})

describe('listingMarkdown', () => {
  it('lists a category’s products with links to their Markdown, and the way out', () => {
    expect(
      listingMarkdown({
        category: tees,
        intro: 'Tees for every day.',
        products: [tee],
        categories: [tees, bags],
        siteUrl: SITE,
      }),
    ).toBe(
      [
        '# T Shirts',
        '[View this page in the store](https://store.test/products/category/t-shirts)',
        'Tees for every day.',
        '- [Black Crewneck T-Shirt](https://store.test/products/black-crewneck-t-shirt.md): $30.50',
        '## Categories',
        '- [All products](https://store.test/products.md)\n- [Bags](https://store.test/products/category/bags.md)',
      ].join('\n\n') + '\n',
    )
  })

  it('says so when a category is empty', () => {
    expect(
      listingMarkdown({ category: bags, products: [], categories: [bags], siteUrl: SITE }),
    ).toContain('Nothing in Bags right now.')
  })

  it('is the whole catalogue without a category', () => {
    const markdown = listingMarkdown({
      category: null,
      products: [tee, tote],
      categories: [tees, bags],
      siteUrl: SITE,
    })
    expect(markdown).toContain('# All products\n\n[View this page in the store](https://store.test/products)')
    expect(markdown).toContain('- [Tote](https://store.test/products/tote.md): $20.00')
    expect(markdown).not.toContain('[All products](')
  })
})

describe('homeMarkdown', () => {
  const base = {
    storeName: 'Vercel Swag Store',
    hero: { headline: 'Ship in black.', description: 'Official merchandise.' },
    featured: { heading: 'Featured', products: [tee] },
    categories: [tees],
    siteUrl: SITE,
  }

  it('shows the hero, the featured products and the categories', () => {
    const markdown = homeMarkdown({ ...base, favourites: { heading: 'Favourites', products: [] } })
    expect(markdown).toContain('# Vercel Swag Store\n\n[Visit the store](https://store.test/)')
    expect(markdown).toContain('**Ship in black.** Official merchandise.')
    expect(markdown).toContain('## Featured\n\n- [Black Crewneck T-Shirt]')
    expect(markdown).toContain('- [T Shirts](https://store.test/products/category/t-shirts.md)')
    expect(markdown).not.toContain('## Favourites')
  })

  it('shows the favourites when there are any', () => {
    const markdown = homeMarkdown({ ...base, favourites: { heading: 'Favourites', products: [tote] } })
    expect(markdown).toContain('## Favourites\n\n- [Tote](https://store.test/products/tote.md): $20.00')
  })
})

describe('llmsTxt', () => {
  const file = llmsTxt({
    storeName: 'Vercel Swag Store',
    description: 'Official Vercel merchandise.',
    products: [tee, tote],
    categories: [tees, bags],
    siteUrl: SITE,
  })

  it('opens with the name, the summary and what the site is', () => {
    expect(file.startsWith('# Vercel Swag Store\n\n> Official Vercel merchandise.\n\nThis site is a demonstration')).toBe(true)
    expect(file).toContain('The products are invented')
  })

  it('links every page it lists to its Markdown version', () => {
    const links = [...file.matchAll(/\]\((https:[^)]+)\)/g)].map((match) => match[1])
    expect(links).toEqual([
      'https://store.test/index.md',
      'https://store.test/products.md',
      'https://store.test/products/category/t-shirts.md',
      'https://store.test/products/category/bags.md',
      'https://store.test/products/black-crewneck-t-shirt.md',
      'https://store.test/products/tote.md',
    ])
  })
})
