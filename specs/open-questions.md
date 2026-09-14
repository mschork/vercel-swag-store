# Open questions across all specs

Each item carries the assumption the spec currently uses. Answer only where you disagree; silence means the assumption stands.


## E01-monorepo-foundation

1. GitHub repo name and visibility timing: create public from the start or flip to public later? [assumption: private until E12, then public]
   Settled 2026-09-14: `mschork/mschork-swag`, private until E12.
2. Vercel team: personal account or a dedicated team? [assumption: personal]
   Settled 2026-09-14: personal (`markusschorks-projects`).
3. Prettier settings: semicolons or not? [assumption: none, single quotes]
   Settled 2026-09-14: none, single quotes.


## E02-api-client

0. (added) API unreachable during `next build`: fail the build or fall back to dynamic? Settled 2026-09-14: fail the build (see `callout.md`).

1. Generate types with `openapi-typescript` instead of hand-writing? [assumption: hand-write; 12 endpoints is small and the generated names are ugly]
   Settled 2026-09-14: hand-write zod schemas.
2. Cache durations for catalogue data: minutes or hours? [assumption: 1 h revalidate, 24 h expire; product data has been static since February]
   Settled 2026-09-14: custom `catalog` cacheLife profile, stale 5 min, revalidate 1 h, expire 24 h.


## E03-shell-layout-metadata

0. (added) CSP with `'unsafe-inline'` for scripts versus a nonce-based CSP. Settled 2026-09-14: `'unsafe-inline'` with hardening, no nonces; hash-based CSP is infeasible because the RSC payload is inlined per page. See `docs/adr/0001-csp-unsafe-inline-scripts.md`.

1. Should "Search" in the nav be a link or an inline search box in the header like vercel.store? [assumption: link; a search page is wanted]
   Settled 2026-09-14: link. Inline header search recorded in `improvements.md`.
2. Show the store name text next to the glyph, or glyph only? [assumption: both, text hidden on small screens]
   Settled 2026-09-14: both, text hidden on small screens.


## E04-homepage

1. Hero copy: any headline you want? [assumption: "Ship it. Wear it." plus a one-liner]
   Settled 2026-09-14: keep the assumed copy.
2. Is a copy-to-clipboard button on the promo code welcome, or keep the banner purely static text?
   Settled 2026-09-14: static text. Copy button recorded in `improvements.md`.


## E05-product-detail

1. When stock is 0, hide the quantity stepper or show it disabled? [assumption: show disabled, so the layout does not shift]
   Settled 2026-09-14: show disabled.
2. Breadcrumb category link: to `/search?category=<slug>` [assumption: yes]
   Settled 2026-09-14: yes. Dedicated category route recorded in `improvements.md`.


## E06-cart

1. Optimistic UI on the PDP button too (increment the badge before the action returns)? [assumption: no; keep the PDP simple and let the badge update on completion]
   Settled 2026-09-14: no. Pending state on the button; badge updates on completion.
2. Show a "Cart expired" notice when the token was rejected, or silently show empty? [assumption: one-line notice]
   Settled 2026-09-14: one-line notice, and clear the cookie.


## E07-search

1. Default set: featured products or the first 8 by API order? [assumption: featured]
   Settled 2026-09-14: featured.
2. Debounce 300 ms acceptable, or wait for a pause of 500 ms?
   Settled 2026-09-14: 300 ms; Enter and the button submit immediately via `next/form`.
3. Should the category select appear before or after the input on mobile? [assumption: input first, select below]
   Settled 2026-09-14: input first, select below.


## E08-sanity-content-model

0. (added) *Category* (API taxonomy) and *collection* (Sanity editorial grouping) are two concepts. Settled 2026-09-14, see `CONTEXT.md`.

1. Sanity project: do you want to create it yourself (so it sits in your account) and give me the project id, or should the seed script assume placeholders until then? [assumption: you create it; specs use `<projectId>`]
   Settled 2026-09-14: created by you; id in local env files and Vercel.
2. Portable Text extended description: allow images inline, or keep images to the gallery only? [assumption: allow]
   Settled 2026-09-14: gallery only, no inline images.
3. Lookbook consent: a checkbox is enough for a demo, or do you also want a "credit" field for public photos of others? [assumption: add `credit` string]
   Settled 2026-09-14: add `credit`.


## E09-sanity-integration

1. Keep `useCdn: false` and rely on Next's cache, or enable the Sanity CDN too? [assumption: false; one cache is easier to reason about and explain]
   Settled 2026-09-14: false. Recorded in `callout.md`.
2. Are the collection and guide routes wanted for the first release, or only if time remains? [assumption: only if time remains]
   Settled 2026-09-14: only if time remains.


## E10-design-system

1. Accent: Vercel blue or a neutral accent (white on black buttons only)? [assumption: blue, used sparingly]
   Settled 2026-09-14: blue, used sparingly.
2. Card pill style from the reference design, or plain text under the image? [assumption: pill]
   Settled 2026-09-14: pill.


## E11-performance-verification

1. Is Lighthouse CI in GitHub Actions wanted, or manual runs recorded in docs enough? [assumption: manual, recorded]
   Settled 2026-09-14: manual, recorded.


## E12-delivery

1. Licence: MIT or none? [assumption: MIT]
   Settled 2026-09-14: none; README states the code is not licensed for reuse.
2. Do you want the studio URL in the email, or keep the release to the two required links and mention Sanity in the README only? [assumption: include, labelled optional]
   Settled 2026-09-14: include it, labelled optional.


## E13-search-gap-loop

0. (added) Vocabulary: a *search gap* is a recorded zero-result query; a *product idea* is generated from gaps. Settled 2026-09-14, see `CONTEXT.md`.

1. Threshold for analysis: count >= 2, or every new gap? [assumption: 2]
   Settled 2026-09-14: count >= 2. Recorded in `callout.md`.
2. Cron daily or manual trigger from Studio only? [assumption: cron daily plus manual]
   Settled 2026-09-14: cron daily plus manual.
3. Which model via the AI Gateway? [assumption: gateway default small model; you may prefer a Claude model]
   Settled 2026-09-14: `claude-haiku-4-5-20251001` via the gateway.
4. Earlier you mentioned "Eve"; if that refers to a specific product or tool, tell me and I will fold it in.
   Settled 2026-09-14: Eve is Vercel's agent framework (vercel.com/eve). Folded in as its own stretch epic, `E14-eve-agent.md`, after E13.


## E14-eve-agent

1. Which channel for the human-in-the-loop approval: Studio actions only (as E13), or also Slack via Eve's multi-channel support? [assumption: Studio only; Slack is a demo distraction]
