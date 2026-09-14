# E14 Eve agent (stretch)

Branch: `epic/E14-eve-agent`. Depends on: E13. Blocks: nothing. Attempt only after E13 is merged and E12 is release-ready; it must never delay the release.

## Goal

Re-express the E13 demand-analysis step as an agent built with Eve (https://vercel.com/eve), Vercel's agent framework: Markdown instructions, TypeScript tools, deployed on Vercel, using AI Gateway underneath. The route handler from E13 remains the shipped path; the Eve agent is an alternative implementation that shows how the loop maps onto the platform's agent primitives.

## Scope

### Agent

- `apps/demand-agent/` created with `npx eve@latest init`, checked in as a third workspace app. Not part of `pnpm verify` until it builds cleanly.
- `instructions.md`: the same system prompt as E13's analysis (existing catalogue names and categories; propose only what does not exist; one idea per cluster of gaps).
- `agent.ts`: model `claude-haiku-4-5-20251001` via AI Gateway, matching E13.
- Tools in `tools/`, each a `defineTool` with a zod input schema:
  - `listSearchGaps`: reads `searchGap` docs with `status == 'new'` and `count >= 2` from Sanity (read token).
  - `createProductIdea`: writes a `productIdea` draft and marks the source gaps `reviewed` (write token). Idempotent on `sourceGaps`.
  - `listCatalogue`: calls the cached API client for product names and categories.
- Human-in-the-loop: ideas remain drafts; Accept and Reject stay in Studio as in E13.

### Trigger

- The E13 daily cron keeps calling the route handler. The Eve agent is invoked manually from its Vercel deployment for the demo.

### Docs

- README section "Eve agent" with the mapping: E13 route handler step by step against the agent's tools, and what Eve adds (durable execution via Workflows, sandboxed tool runs, multi-channel) that a route handler does not.

## Acceptance criteria

- [ ] `npx eve` scaffold builds and deploys to a third Vercel project `vercel-swag-demand-agent`.
- [ ] Running the agent once against seeded gaps produces `productIdea` drafts equivalent to E13's output.
- [ ] Source gaps are marked `reviewed` exactly once across repeated runs.
- [ ] README section written; E13 remains the shipped path and its acceptance criteria are untouched.

## Out of scope

Slack or Discord channels, replacing the E13 cron, any change to store pages.
