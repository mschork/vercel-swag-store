---
status: accepted
date: 2026-09-20
---

# The store gains a Sanity read token, used only in draft mode

The store reads Sanity without a token: the dataset is public, so a missing secret can never break a build (specs/decisions.md). Live editing (specs/E17-presentation.md) needs two things an anonymous client cannot do: read unpublished drafts, and verify the short-lived secret the Studio mints before switching draft mode on. Both need a token. So the store gets `SANITY_API_READ_TOKEN`, and the earlier decision is narrowed rather than reversed: **visitors are still served by the anonymous client, and the token is read only on a request that is already in draft mode.**

- It is a Viewer token. A write with it is refused with a 403, which was checked before it was adopted.
- It is server-only, like `API_BYPASS_TOKEN` (AGENTS.md rule 3). Only `lib/sanity/draft-client.ts` reads it, and that module is `server-only`.
- It is optional. Without it `/api/draft-mode/enable` answers 404, draft mode cannot be entered, and the store builds and runs exactly as before. Previews, CI and forks need nothing.
- A Viewer token can read the private demand documents of E13, which an anonymous client cannot. No query in the store asks for them, in or out of draft mode, and every query lives in one file (`lib/sanity/queries.ts`), so that stays checkable.

## The draft branch sits outside the cached function

`sanityFetch` checks `draftMode().isEnabled` first and calls the token client, uncached, when it is on; otherwise it calls the same `"use cache"` function visitors have always had. The spec put the check inside the cached function, because Next's draft-mode guide says draft mode skips every cache layer and that `isEnabled` may be read in a cached scope. That held for a full page load. It did not hold for `router.refresh()`, which is how an edit reaches the page: with the check inside, the refresh in draft mode was answered with cached, published content (Next 16.3.5). With the check outside it returns the draft. Reading `isEnabled` outside a cached scope does not make a route dynamic; the build's route table is the same either way.

## `defineLive` was not adopted

`next-sanity` ships `defineLive`, which fetches, caches, tags and revalidates in one piece, and streams published changes to visitors. It would replace the cache tags and the publish webhook E09 built, and with them the point of this exercise: an explicit cache policy per data function (AGENTS.md). The store uses only `defineEnableDraftMode` and the `VisualEditing` overlay. The overlay leaves a mutation to the app, so a small client component answers it with `router.refresh()`.

## Previews are not framed

Presentation loads the store in an iframe. A Vercel preview deployment answers with a login redirect (Deployment Protection) and cannot be framed, and a protection bypass in the Studio's bundle would be a secret shipped to browsers. The Studio frames the production store, or `localhost:3000`.

Framing is opened with `frame-ancestors 'self'` plus the exact origins in `PRESENTATION_STUDIO_ORIGINS`. A wildcard is refused in code: `https://*.vercel.app` would let any Vercel site frame the store. Sanity's dashboard origin is on the list because the dashboard frames the Studio and a browser checks every ancestor. Nothing else in the policy moved: the overlay talks to the Studio by `postMessage`, so neither `connect-src` nor a Sanity CORS origin for the store is needed.

## Stega

In draft mode every string carries invisible characters that point at its field; that is what makes a click open the right input. They are kept out of what machines read: root metadata is fetched with `stega: false`, and JSON-LD, the Open Graph images and the sitemap use no Sanity text. They are kept in image `alt` text on purpose: the overlay uses it to make a photo clickable, axe passes with it, and a visitor never receives stega at all.

## Considered options

- A second, private dataset for drafts: no token on the store, but drafts live beside their published documents by design.
- The check inside the cached function, as first specified: one function instead of two, but edits do not show until a full reload.
- `data-sanity` attributes on images instead of stega in `alt`: clean `alt` for the editor too, but every image component would have to know about draft mode, and the attribute must never reach a visitor.

## Consequences

- A visitor's HTML, JavaScript and headers are unchanged, apart from `frame-ancestors` where the env is set. A Playwright test asserts no zero-width characters and no overlay outside draft mode.
- `PRESENTATION_STUDIO_ORIGINS` is read at build time, because `next.config.ts` builds the headers; changing it needs a redeploy.
- Slice 1 must be live in production before Presentation works outside a developer's machine.
