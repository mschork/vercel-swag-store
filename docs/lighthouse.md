# Lighthouse

## Production, 17 Sep 2026

`https://vercel-swag-store-ms.vercel.app/`, Lighthouse 13 in Chrome DevTools, mobile. Three runs over the evening scored 96, 97 and 98 for performance; the table records the lowest.

| Category | Score |
|---|---|
| Performance | 96 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 66 |

The SEO score is capped by choice. Every response carries `X-Robots-Tag: noindex`, because a store of invented products under the Vercel name should not compete with vercel.com in search (`specs/callout.md`). Every other SEO audit passes; with the header off the category scores 100, measured below. A build sets `ALLOW_INDEXING=true` to leave the header out, and production never does.

## Local, 17 Sep 2026

`next start` on a production build, Lighthouse 13, mobile, median of five runs per variant. Local runs have no network latency, so the largest paint is optimistic and any saving that depends on bandwidth does not show. They are useful for comparing two builds of the same app, not for judging the deployed site.

| Variant | Performance | Largest paint | Fonts | Page total |
|---|---|---|---|---|
| Full variable fonts | 95 | 2945 ms | 139 KB | 445 KB |
| Latin subset fonts | 96 | 2718 ms | 53 KB | 361 KB |

The subset variant is what ships. The `geist` package serves the complete variable files, about 70 KB each; `next/font/google` with `subsets: ['latin']` serves the same two typefaces at 53 KB together. The package stays as a dependency because the Open Graph image routes read a TTF from it.

A single run of the shipped build, with indexing allowed so SEO can be scored:

| Category | Score |
|---|---|
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 96 |
| SEO | 100 |

Best practices caps at 96 locally: the only failing audit is console errors from `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, which exist only on a Vercel deployment. Production scores 100.

Key metrics from that run: first paint 0.8 s, largest paint 3.0 s, total blocking time 20 ms, cumulative layout shift 0.

## What was measured and rejected

- **Hero image compression.** The hero is already AVIF, which is about 30 % smaller than WebP at the same quality (11 KB against 16 KB at 750 px, 44 KB against 61 KB at 1920 px). Dropping quality from 75 to 50 halves it again and is visually indistinguishable, but it moved neither the score nor the largest paint in five runs, because the phone-sized image is only 11 KB to begin with. Not adopted; the trade-off is available if bandwidth ever matters more than fidelity.
- **Font preloading.** With the stylesheet inlined, Next emits no font preload links at all, so there was nothing for the hero image to compete with. The whole gain came from smaller files.
- **Unused and legacy JavaScript.** Lighthouse flags 26 KB of unused JavaScript and 14 KB of legacy polyfills. Both are inside React DOM and Next's own polyfill bundle. No application change removes them.

## Layout shift

Zero on `/`, a product page, `/search`, `/search?q=hat`, `/cart` with two lines, an empty cart and `/checkout`, at 375, 768 and 1280 px, three runs each, measured with a `PerformanceObserver` in Playwright. Two shifts found during E11 were fixed: the cart rows now reserve two lines for a product name below the large breakpoint, matching their skeleton, and the search results region is at least one viewport tall, so the footer never moves in view while results load.
