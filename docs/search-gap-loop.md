# The search-gap loop

A search that finds nothing is a demand signal. This is the one part of the store
that is not a storefront, and it never touches the catalogue, a page's render path
or the static shell.

A search that finds nothing is a demand signal. The store counts it after the response has been sent, a model groups the misses into product ideas, and a person accepts or rejects each idea in the Studio. Nothing in the loop touches the catalogue, a page's render path or the static shell. `specs/E13-diagram.html` draws it step by step.

```
/search?q=umbrella  --0 results-->  after(): recordGap  -->  searchGap.<hash>  (count, lastSeen)
                                                                  | count reaches 2
                                            Sanity Function gap-threshold
                                                                  | POST /api/demand/analyse (bearer secret)
                                            Vercel Workflow analyseDemand
                     lock > settle 10 min > claim gaps > read catalogue > one model call > validate > write
                                                                  |
                          productIdea.<hash> (proposed)      gaps: reviewed | matched | ignored
                                                                  |
                                            an editor clicks Accept or Reject in the Studio
                                                                  | status changes
                                            Sanity Function idea-decided
                          idea: decidedAt stamped        gaps: promoted (accepted) | reviewed (rejected)
```

| Piece | Job | Where |
|---|---|---|
| `after()` from `next/server` | record the miss once the response has streamed | `apps/store/lib/search/record-gap.ts` |
| Sanity Function | notice a gap reaching the threshold and wake the analysis | `apps/functions/gap-threshold` |
| Vercel Workflow | the analysis as durable steps, with a lock so bursts collapse into one run | `apps/store/workflows/analyse-demand.ts` |
| Vercel AI SDK through AI Gateway | one structured-output call, no chat, no tools | `apps/store/lib/demand/steps.ts` |
| Studio document actions | Accept and Reject on a product idea, Reject with a reason | `apps/studio/actions/idea-decision.tsx` |
| Sanity Function | finish the decision: stamp the date, promote the gaps | `apps/functions/idea-decided` |
| Sanity Blueprint | both Functions, declared in code | `sanity.blueprint.ts` |
| `@repo/demand` | filters, ids, prompt, schema, validation and every Sanity query of the loop | `packages/demand` |

Privacy, in five lines:

- Only the tidied-up query is stored: no raw input, no IP, no user agent, no cart token.
- Queries with an `@`, a URL or domain, six or more digits, under 3 characters or over 6 words are dropped before anything is written. Bots are not counted.
- Gaps and ideas have ids with a dot, which Sanity keeps private: an anonymous reader of this public dataset gets nothing back for either type.
- A gap that never reached two searches is deleted 30 days after it was last seen.
- Queries reach the model as data, never as instructions; it has no tools, and everything it returns is checked against the claimed gaps and the live catalogue before it is written.

Running it locally:

```sh
pnpm --filter @repo/sanity seed-demand          # six gaps: three that cluster, a typo, a fragment, gibberish
(cd apps/store && vercel env pull .env.vercel)  # git-ignored; copy its VERCEL_OIDC_TOKEN line into .env.local
# with SANITY_API_WRITE_TOKEN, DEMAND_ANALYSE_SECRET and VERCEL_OIDC_TOKEN in apps/store/.env.local:
pnpm --filter store build && pnpm --filter store start
curl -X POST http://localhost:3000/api/demand/analyse \
  -H "Authorization: Bearer $DEMAND_ANALYSE_SECRET" \
  -H "Content-Type: application/json" -d '{"settle":false}'
```

The lock that collapses a burst of calls into one run has its own test against the real workflow runtime. It is hermetic (no Sanity, no model) and is not part of `pnpm verify`:

```sh
pnpm --filter store test:integration
```

`{"settle":false}` skips the ten-minute wait. Local run data is under `apps/store/.next/workflow-data`.

Where to look: Vercel's Observability, Workflows view for the runs; `pnpm exec sanity functions logs gap-threshold` for the trigger; the Studio's "Demand signals" for the gaps and the ideas.
