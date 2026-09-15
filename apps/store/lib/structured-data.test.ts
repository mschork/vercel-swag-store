import { describe, expect, it } from 'vitest'
import { product } from '@/test/helpers'
import type { Product } from './api/types'
import {
  breadcrumbJsonLd,
  productJsonLd,
  serializeJsonLd,
} from './structured-data'

const tee = product({ price: 3050 }) as Product

describe('productJsonLd', () => {
  it('describes the product and its offer', () => {
    expect(
      productJsonLd({
        product: tee,
        availability: 'https://schema.org/InStock',
        siteUrl: 'https://store.test',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Black Crewneck T-Shirt',
      description: 'Plain black tee.',
      image: ['https://example.com/tee.png'],
      sku: 'tshirt_001',
      brand: { '@type': 'Brand', name: 'Vercel Swag Store' },
      offers: {
        '@type': 'Offer',
        url: 'https://store.test/products/black-crewneck-t-shirt',
        price: '30.50',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    })
  })

  it('leaves availability out when stock is unknown', () => {
    const offers = productJsonLd({
      product: tee,
      availability: null,
      siteUrl: 'https://store.test',
    }).offers
    expect(offers).not.toHaveProperty('availability')
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
