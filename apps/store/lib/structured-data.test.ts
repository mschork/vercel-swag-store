import { describe, expect, it } from 'vitest'
import { product } from '@/test/helpers'
import type { Product } from './api/types'
import {
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
  productJsonLd,
  serializeJsonLd,
  webSiteJsonLd,
} from './structured-data'

const tee = product({ price: 3050 }) as Product

describe('productJsonLd', () => {
  const data = productJsonLd({
    product: tee,
    images: ['https://example.com/tee.png', 'https://cdn.sanity.io/extra.jpg'],
    categoryName: 'T Shirts',
    siteUrl: 'https://store.test',
  })

  it('describes the product and its offer', () => {
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Black Crewneck T-Shirt',
      description: 'Plain black tee.',
      image: ['https://example.com/tee.png', 'https://cdn.sanity.io/extra.jpg'],
      sku: 'tshirt_001',
      category: 'T Shirts',
      brand: { '@type': 'Brand', name: 'Vercel' },
      offers: {
        '@type': 'Offer',
        url: 'https://store.test/products/black-crewneck-t-shirt',
        price: '30.50',
        priceCurrency: 'USD',
      },
    })
  })

  it('never states availability or who sells it', () => {
    const json = JSON.stringify(data)
    expect(json).not.toMatch(/availability|InStock|OutOfStock|seller|Organization/)
  })
})

describe('faqJsonLd', () => {
  it('pairs each question with the plain text of its answer', () => {
    const answer = [
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Wash ' },
          { _type: 'span', text: 'cold', marks: ['strong'] },
          { _type: 'span', text: '.' },
        ],
      },
    ]
    expect(faqJsonLd([{ question: 'How do I wash it?', answer }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I wash it?',
          acceptedAnswer: { '@type': 'Answer', text: 'Wash cold.' },
        },
      ],
    })
  })
})

describe('itemListJsonLd', () => {
  it('numbers the products in the order given, with absolute URLs', () => {
    expect(
      itemListJsonLd({
        name: 'Bags',
        products: [
          { name: 'Tote', slug: 'tote' },
          { name: 'Backpack', slug: 'backpack' },
        ],
        siteUrl: 'https://store.test',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Bags',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Tote', url: 'https://store.test/products/tote' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Backpack',
          url: 'https://store.test/products/backpack',
        },
      ],
    })
  })
})

describe('webSiteJsonLd', () => {
  it('names the store and its address and nothing else', () => {
    expect(webSiteJsonLd({ name: 'Vercel Swag Store', siteUrl: 'https://store.test' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vercel Swag Store',
      url: 'https://store.test/',
    })
  })
})

describe('breadcrumbJsonLd', () => {
  it('numbers the steps and makes their links absolute', () => {
    expect(
      breadcrumbJsonLd(
        [
          { name: 'Home', href: '/' },
          { name: 'T Shirts', href: '/search?category=t-shirts' },
        ],
        'https://store.test',
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://store.test/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'T Shirts',
          item: 'https://store.test/search?category=t-shirts',
        },
      ],
    })
  })
})

describe('serializeJsonLd', () => {
  it('escapes < so a value cannot close the script element, and stays valid JSON', () => {
    const data = { name: 'Tee</script><script>alert(1)</script>' }
    const json = serializeJsonLd(data)
    expect(json).not.toContain('<')
    expect(JSON.parse(json)).toEqual(data)
  })
})
