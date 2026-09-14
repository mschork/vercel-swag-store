# Open questions across all specs

Each item carries the assumption the spec currently uses. Answer only where you disagree; silence means the assumption stands.


## E01-monorepo-foundation

1. GitHub repo name and visibility timing: create public from the start or flip to public at submission? [assumption: private until E12, then public]
2. Vercel team: personal account or a dedicated team? [assumption: personal]
3. Prettier settings: semicolons or not? [assumption: none, single quotes]


## E02-api-client

1. Generate types with `openapi-typescript` instead of hand-writing? [assumption: hand-write; 12 endpoints is small and the generated names are ugly]
2. Cache durations for catalogue data: minutes or hours? [assumption: 1 h revalidate, 24 h expire; product data has been static since February]


## E03-shell-layout-metadata

1. Should "Search" in the nav be a link or an inline search box in the header like vercel.store? [assumption: link; the brief wants a search page]
2. Show the store name text next to the glyph, or glyph only? [assumption: both, text hidden on small screens]


## E04-homepage

1. Hero copy: any headline you want? [assumption: "Ship it. Wear it." plus a one-liner]
2. Is a copy-to-clipboard button on the promo code welcome, or keep the banner purely static text?


## E05-product-detail

1. When stock is 0, hide the quantity stepper or show it disabled? [assumption: show disabled, so the layout does not shift]
2. Breadcrumb category link: to `/search?category=<slug>` [assumption: yes]


## E06-cart

1. Optimistic UI on the PDP button too (increment the badge before the action returns)? [assumption: no; keep the PDP simple and let the badge update on completion]
2. Show a "Cart expired" notice when the token was rejected, or silently show empty? [assumption: one-line notice]


## E07-search

1. Default set: featured products or the first 8 by API order? [assumption: featured]
2. Debounce 300 ms acceptable, or wait for a pause of 500 ms?
3. Should the category select appear before or after the input on mobile? [assumption: input first, select below]


## E08-sanity-content-model

1. Sanity project: do you want to create it yourself (so it sits in your account) and give me the project id, or should the seed script assume placeholders until then? [assumption: you create it; specs use `<projectId>`]
2. Portable Text extended description: allow images inline, or keep images to the gallery only? [assumption: allow]
3. Lookbook consent: a checkbox is enough for a demo, or do you also want a "credit" field for public photos of others? [assumption: add `credit` string]


## E09-sanity-integration

1. Keep `useCdn: false` and rely on Next's cache, or enable the Sanity CDN too? [assumption: false; one cache is easier to reason about and explain]
2. Are the collection and guide routes wanted for the first submission, or only if time remains? [assumption: only if time remains]


## E10-design-system

1. Accent: Vercel blue or a neutral accent (white on black buttons only)? [assumption: blue, used sparingly]
2. Card pill style from the reference design, or plain text under the image? [assumption: pill]


## E11-performance-verification

1. Is Lighthouse CI in GitHub Actions wanted, or manual runs recorded in docs enough? [assumption: manual, recorded]


## E12-delivery

1. Licence: MIT or none? [assumption: MIT]
2. Do you want the studio URL in the email, or keep the submission to the two required links and mention Sanity in the README only? [assumption: include, labelled optional]


## E13-search-gap-loop

1. Threshold for analysis: count >= 2, or every new gap? [assumption: 2]
2. Cron daily or manual trigger from Studio only? [assumption: cron daily plus manual]
3. Which model via the AI Gateway? [assumption: gateway default small model; you may prefer a Claude model]
4. Earlier you mentioned "Eve"; if that refers to a specific product or tool, tell me and I will fold it in.
