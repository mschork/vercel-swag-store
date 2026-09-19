import { defineQuery } from 'next-sanity'

/**
 * Every GROQ query the store runs, in one file so `sanity typegen` can find
 * them and give each one a result type.
 *
 * Images ask for `metadata.lqip`, the tiny blurred version Sanity stores with
 * every asset, which `next/image` uses as its placeholder.
 */

const IMAGE = `{ ..., "lqip": asset->metadata.lqip, "aspectRatio": asset->metadata.dimensions.aspectRatio }`

export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    storeName, seoTitle, seoDescription, footerText, lookbookHeading,
    "ogImage": ogImage${IMAGE},
    socialLinks[]{ label, url }
  }
`)

export const homePageQuery = defineQuery(`
  *[_type == "homePage"][0]{
    hero{ headline, description, "image": image${IMAGE} }
  }
`)

export const checkoutPageQuery = defineQuery(`
  *[_type == "checkoutPage"][0]{ title, body, continueShoppingLabel }
`)

/**
 * One product's enrichment, plus the two lists the page needs beside it: the
 * questions its category answers and the questions it attaches itself. They
 * come back separately and are merged in TypeScript, where the rule is
 * testable (`lib/sanity/faqs.ts`).
 */
export const productQuery = defineQuery(`
  *[_type == "product" && apiId == $apiId][0]{
    extendedDescription, care,
    "gallery": gallery[]${IMAGE},
    "categoryFaqs": *[_type == "faq" && references(^.category._ref)]{ _id, question, answer, order },
    "attachedFaqs": faqs[]->{ _id, question, answer, order }
  }
`)

/** Lookbook entries naming this product, newest first. */
export const lookbookForProductQuery = defineQuery(`
  *[_type == "lookbookEntry" && consent == true && references($productDocId)]
    | order(publishedAt desc){
      _id, person, role, quote,
      "photo": photo${IMAGE}
    }
`)
