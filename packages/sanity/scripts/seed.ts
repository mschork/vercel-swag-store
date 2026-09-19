import { createClient } from '@sanity/client'
import { required } from './env.ts'
import { syncCatalogue } from './sync.ts'

/**
 * Fills a fresh dataset: the catalogue mirror, the three pages that exist
 * once, and enough editorial content that every part of the model is visible
 * on the site. The copy is placeholder (specs/improvements.md).
 *
 * Idempotent: fixed ids, and `createIfNotExists` for everything an editor may
 * later change, so re-running never overwrites their words.
 *
 * Run with `pnpm --filter @repo/sanity seed`.
 */

const text = (...paragraphs: string[]) =>
  paragraphs.map((paragraph, index) => ({
    _type: 'block' as const,
    _key: `b${index}`,
    style: 'normal' as const,
    markDefs: [],
    children: [{ _type: 'span' as const, _key: `s${index}`, text: paragraph, marks: [] }],
  }))

const HOODIE = 'hoodie_001'
const BACKPACK = 'backpack_001'

async function seed() {
  const catalogue = await syncCatalogue()

  const client = createClient({
    projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
    token: required('SANITY_API_WRITE_TOKEN'),
    apiVersion: '2026-09-01',
    useCdn: false,
  })

  const pages = client.transaction()
  pages.createIfNotExists({
    _id: 'siteSettings',
    _type: 'siteSettings',
    storeName: 'Vercel Swag Store',
    seoTitle: 'Vercel Swag Store',
    seoDescription:
      'Official Vercel merchandise. Premium developer apparel, accessories, and gear.',
    footerText: 'Vercel Swag Store',
  })
  pages.createIfNotExists({
    _id: 'homePage',
    _type: 'homePage',
    hero: {
      headline: 'Ship in black.',
      description:
        'Official Vercel merchandise. Apparel, desk gear and accessories from the team behind Next.js, all in one colour.',
    },
  })
  pages.createIfNotExists({
    _id: 'checkoutPage',
    _type: 'checkoutPage',
    title: 'Thank you for your order!',
    body: text('This is a demo store, so nothing has been charged, shipped or sent.'),
    continueShoppingLabel: 'Continue shopping',
  })
  await pages.commit()

  // Questions: three by category, one attached to a single product.
  const faqs = client.transaction()
  const faq = (
    id: string,
    question: string,
    answer: string,
    order: number,
    categories: string[],
  ) =>
    faqs.createIfNotExists({
      _id: `faq-${id}`,
      _type: 'faq',
      question,
      answer: text(answer),
      order,
      categories: categories.map((slug) => ({
        _type: 'reference' as const,
        _key: slug,
        _ref: `category-${slug}`,
      })),
    })

  faq(
    'shipping',
    'When will my order arrive?',
    'Orders leave the warehouse within two working days. This is a demo store, so nothing actually ships.',
    10,
    ['hoodies', 't-shirts', 'bags', 'hats'],
  )
  faq(
    'sizing',
    'How does the sizing run?',
    'Apparel runs true to size, with a relaxed shoulder. If you are between sizes, take the smaller one.',
    20,
    ['hoodies', 't-shirts'],
  )
  faq(
    'washing',
    'Can I put this in the machine?',
    'Wash at 30 degrees, inside out, and dry flat. The print lasts longer that way.',
    30,
    ['hoodies', 't-shirts'],
  )
  faq(
    'laptop-fit',
    'Will a 16 inch laptop fit?',
    'Yes. The padded sleeve takes a 16 inch machine with a case on.',
    40,
    [],
  )
  await faqs.commit()

  const editorial = client.transaction()
  editorial.createIfNotExists({
    _id: `product-${HOODIE}`,
    _type: 'product',
    apiId: HOODIE,
    name: 'Hoodie',
  })
  editorial.patch(`product-${HOODIE}`, {
    setIfMissing: {
      extendedDescription: text(
        'Heavyweight cotton with a brushed inside, cut a little long in the body so it sits right over a t-shirt.',
        'The triangle is printed, not embroidered, so it stays soft against the chest.',
      ),
      care: text('Wash at 30 degrees inside out. Dry flat. Do not iron the print.'),
    },
  })
  editorial.createIfNotExists({
    _id: `product-${BACKPACK}`,
    _type: 'product',
    apiId: BACKPACK,
    name: 'Backpack',
  })
  editorial.patch(`product-${BACKPACK}`, {
    setIfMissing: {
      extendedDescription: text(
        'Twenty litres, a padded sleeve for a 16 inch laptop, and a pocket at the top for the things you reach for on a train.',
      ),
      care: text('Wipe clean with a damp cloth. Air dry.'),
      faqs: [{ _type: 'reference', _key: 'laptop-fit', _ref: 'faq-laptop-fit' }],
    },
  })
  await editorial.commit()

  console.log(
    `Seeded: ${catalogue.categories} categories, ${catalogue.products} products, ` +
      '3 pages, 4 questions, 2 enriched products. Testimonials need a photo, so add those in the Studio.',
  )
}

await seed()
