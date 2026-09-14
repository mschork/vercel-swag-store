# E11 Performance and caching verification

Branch: `epic/E11-performance`. Depends on: E04 to E07, E10. Blocks: E12.

## Goal

Evidence, not claims: prove which parts of each route are static, that the dynamic holes are the intended ones, that nothing secret reaches the client, and that Core Web Vitals are strong on the deployed site.

## Scope

### Build output audit

- Run `pnpm --filter store build` and capture the route table. Expected: `/`, `/products/[slug]` (with all slugs), `/search`, `/cart` prerendered as static shells, each with Suspense boundaries for promo, stock, search results, cart contents and the header badge. Any route reported as fully dynamic is a defect.
- Save the table to `docs/build-output.md` with a short note per route explaining each dynamic boundary.

### Cache behaviour checks

- Product data: hit a PDP twice, confirm the second render comes from the cache (log a timestamp inside the cached function during dev; remove afterwards, or use `next build && next start` and observe response times).
- Stock: reload a PDP and see the stock number change between requests while name and price stay identical.
- Promo: same on the homepage.
- Cart: add an item, confirm badge and cart page update without a redeploy and without a full reload.
- Sanity: publish a change, confirm the tag revalidation updates the page.

### Client bundle audit

- `grep -r "OykROcuULI6Y" .next/static` returns nothing (token never in the client bundle).
- `pnpm dlx @next/bundle-analyzer` or `next build --profile` to check that client components are leaves: search form, quantity stepper, cart list, theme select, nav link. Anything else marked `"use client"` needs a reason in the PR.

### Images

- Hero and PDP main image use `priority` and explicit `sizes`; cards use `sizes` matching the grid; no image without dimensions or `fill` with a sized parent.
- Blob host and `cdn.sanity.io` in `remotePatterns`; formats default (AVIF, WebP).

### Web Vitals on the deployed site

- Lighthouse mobile and desktop on `/`, a PDP, `/search?q=hat`, `/cart` with an item. Target: performance 90+ mobile, 95+ desktop; accessibility 100; best practices 100; SEO 95+.
- Speed Insights enabled in the Vercel project; record the first week's LCP, CLS, INP once data exists (or note "insufficient data" honestly).
- Web Analytics enabled.

### Static versus dynamic map

Write `docs/static-vs-dynamic.md`: one table with route, static parts, dynamic parts, cache tags, revalidation trigger. This table is reused in the README and is the core of the interview explanation.

## Acceptance criteria

- [ ] `docs/build-output.md` and `docs/static-vs-dynamic.md` committed and accurate.
- [ ] Lighthouse scores recorded in `docs/lighthouse.md` with dates and URLs.
- [ ] Token grep clean; client component list justified.
- [ ] No CLS from any dynamic hole (skeleton dimensions match content).

## Out of scope

Load testing, CDN tuning, image CDN alternatives.

## Open questions

1. Is Lighthouse CI in GitHub Actions wanted, or manual runs recorded in docs enough? [assumption: manual, recorded]
