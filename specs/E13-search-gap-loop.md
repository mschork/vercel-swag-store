# E13 Search-gap loop (stretch)

Branch: `epic/E13-search-gaps`. Depends on: E07, E09. Blocks: nothing. Ship only after E12 is otherwise ready; it must never delay the submission.

## Goal

Turn failed searches into editorial demand signals: record zero-result queries after the response is sent, aggregate them in Sanity, and let the Vercel AI SDK draft product ideas from them for a human to accept or reject in Studio.

## Why it fits

Uses `after()` (work after the response), keeps the request path fast, writes only from the server, uses the AI SDK for analysis rather than chat, and closes a loop between storefront and content operations. All within the brief's rules: the API stays the catalogue; Sanity holds editorial data.

## Scope

### Capture `lib/search/record-gap.ts`

- Called from `SearchResults` (E07) only when a query was present and the merged result count is 0.
- Wrapped in `after(async () => { ... })` from `next/server` so it runs after streaming completes.
- Normalise: lowercase, trim, collapse whitespace, strip punctuation, max 64 chars; drop queries containing `@` or that look like URLs; drop queries under 3 chars.
- Dedupe: before writing, read the `searchGap` document's `lastSeen`; if it is under 10 minutes old, skip the count increment (still refresh `samples[]`). Exact across serverless instances; no in-memory state (see `callout.md`).
- Write: Sanity mutation with a write token (`SANITY_API_WRITE_TOKEN`, server only) using `createIfNotExists` on `_id: 'searchGap.' + hash(normalised)` then `patch().inc({ count: 1 }).set({ lastSeen })`. Also append `{ category, at }` to a capped `samples[]` (keep last 20) for context.
- Fail silently with a server log; never throw into the page.

### Schemas (added to E08's package)

- `searchGap`: `query`, `normalised`, `count`, `firstSeen`, `lastSeen`, `samples[]`, `status` (new, reviewed, ignored, promoted).
- `productIdea`: `title`, `rationale` (text), `suggestedCategory` (from the API category list), `sourceGaps[]` (refs), `estimatedDemand` (number), `status` (draft, accepted, rejected), `generatedBy` (string: model id), `generatedAt`.

Desk: "Demand signals" group with Search gaps (ordered by count desc, filtered to status new) and Product ideas.

### Analysis `app/api/demand/analyse/route.ts`

- POST, protected by `DEMAND_ANALYSE_SECRET` header; invoked manually or by a Vercel Cron (`vercel.json` `crons`, daily).
- Loads `searchGap` docs with `status == 'new'` and `count >= 2`.
- Calls the AI SDK `generateObject` with the Vercel AI Gateway (`AI_GATEWAY_API_KEY`) or a provider key, a Zod schema for `{ ideas: [{ title, rationale, suggestedCategory, gapIds, estimatedDemand }] }`, a system prompt that lists the existing catalogue names and categories (from the cached API client) so it does not propose items that exist, and the gaps as input. Model: `claude-haiku-4-5-20251001` via the gateway.
- Writes `productIdea` docs as drafts, marks the source gaps `reviewed`, returns a summary.
- Never called from the request path of a user page.

### Studio actions

- On `productIdea`: document actions "Accept" (sets status accepted) and "Reject". Accepting does nothing else; creating real products is outside the API's remit, which is stated in the doc description.

### UI touch

- Search empty state gains one line: "We keep track of what people look for and don't find." No form, no input; transparency only.

### Tests

- Vitest: normalisation and filter rules (email-like, URL-like, short, punctuation); id hashing stable.
- Vitest: analyse route rejects a missing secret; with a mocked model returns ideas and writes docs (mock the Sanity client).
- Manual: search "umbrella" three times, see one `searchGap` with count 3, run the analysis, see a `productIdea`.

## Acceptance criteria

- [ ] Zero-result searches produce or increment a `searchGap` within seconds, with no measurable change to search response time.
- [ ] Nothing personal is stored; the filter tests prove it for the covered cases.
- [ ] The analysis endpoint creates sensible `productIdea` drafts and never proposes an existing product.
- [ ] Removing E13 leaves E07 unchanged (the hook is one guarded call).
- [ ] README gains a short "Search-gap loop" paragraph under Sanity.

## Out of scope

Real-time dashboards, per-user attribution, auto-creating products, using the loop to change search ranking.
