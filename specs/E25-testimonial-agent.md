# E25 The testimonial agent

Branch: `epic/E25-testimonial-agent`. Depends on: E08, E09, E13, E24. Blocks: nothing. One PR per slice; each slice leaves `main` shippable, and the epic can stop after any of them.

## Goal

A visitor tells the store what they think of something they bought, with a photo of it, by talking to an agent instead of filling in a form. The agent looks at the photo, says whether it is usable, works out which product is in it and asks the visitor to confirm, helps them put their words into 240 characters, and checks their email address with a code. An editor then accepts or rejects the submission in the Studio. An accepted submission becomes an ordinary `testimonial`: it appears on the product's page, on the wall at `/testimonials`, and counts toward "People's favourites" on the home page. The visitor gets an email either way.

It is not a product finder and not a general chat. The agent has one job and declines everything else.

Decisions that are not in this spec are in `docs/adr/0008-testimonial-submissions.md`.

## Terms

`CONTEXT.md` defines them: testimonial, testimonial mention, submission, draft. A submission is never called a review (nobody rates anything) or a testimonial until an editor accepts it.

## Why it fits

| Piece | Job | Where |
|---|---|---|
| AI SDK 7, `useChat` from `@ai-sdk/react` | the chat UI, client-side tools that render the widgets | `components/testimonials/` |
| `WorkflowAgent` from `@ai-sdk/workflow` | the agent loop as durable steps; a dropped connection resumes the stream | `apps/store/workflows/testimonial.ts` |
| Vercel Workflow (`workflow` 5) | one run per submission: conversation, submit, wait for the editor, notify, clean up | `apps/store/workflows/testimonial.ts` |
| AI Gateway | a vision model on the free tier, one constant | `MODEL` in `@repo/testimonials` |
| Vercel Blob, private store | the photo from upload until the editor decides | `app/api/testimonials/upload/route.ts` |
| Vercel BotID (Basic) | refuses bots on every testimonial route | `instrumentation-client.ts`, the routes |
| Vercel Firewall rate limit | one rule, keyed on the session id | `checkRateLimit` in the routes |
| Resend (Vercel Marketplace), over `fetch` | the verification code and the outcome emails | `lib/email/send.ts` |
| Sanity: `testimonialSubmission` schema, Studio actions, photo preview input | the editor's decision | `packages/sanity`, `apps/studio` |
| Sanity Function `submission-decided` | wakes the waiting run when the editor decides | `apps/functions/submission-decided` |
| Sanity assets | the photo, once accepted | written by the workflow |
| Sanity Workflows (early access) | not here, for the reason in `docs/adr/0004-demand-loop-runtimes.md` | |

No new dependency beyond `@ai-sdk/workflow`, `@ai-sdk/react`, `@vercel/blob`, `botid` and `@vercel/firewall`. No email SDK, no image library, no UI kit.

## The flow

```
footer "Submit a testimonial" ──▶ /testimonials#share  (chat opens)
/testimonials ──▶ CTA "Submit a testimonial" ──▶ chat loads on demand, URL gains #share

first message ──▶ POST /api/testimonials/chat ──▶ start(testimonial)  run bound to the session id
   WorkflowAgent loop, each turn a hook resumed by the next message:
     photo widget ─▶ browser downsizes, re-encodes (EXIF gone) ─▶ private Blob
     analysePhoto ─▶ quality, safety, ranked products ─▶ confirm widget (Yes / pick another)
     name, quote (≤ 240, visitor approves the exact text), consent ─▶ checkText
     email ─▶ sendCode ─▶ code widget ─▶ verifyCode
     submit ─▶ testimonialSubmission.<id> written (private) ─▶ "Thanks, an editor will look at it"
   idle 30 min before submit ─▶ blob deleted, run ends

   await hook testimonial-review:<id>        (no time limit, sleep costs nothing)
        ▲
   Studio: Accept | Reject (reason) ─▶ status patched ─▶ Function submission-decided
        ─▶ POST /api/testimonials/decision (bearer) ─▶ resumeHook

   accepted: photo to Sanity assets ─▶ testimonial-<id> published (consent: true)
             ─▶ Sanity webhook revalidates sanity:testimonial ─▶ approval email
   rejected: rejection email with the reason
   both:     blob deleted, email removed from the submission
```

## Experience

### The page

- `app/testimonials/page.tsx`, prerendered. A heading, one line of intro, a "Submit a testimonial" button, and the wall below.
- The wall is every published testimonial with consent, newest first, `"use cache"` and tagged `sanity:testimonial` through `sanityFetch`. It pages with a "Show more" link (`?page=`, inside `<Suspense>`), `WALL_PAGE_SIZE` a named constant.
- The chat is a client island loaded with `next/dynamic` only when it opens. The button opens it and sets `#share`; a small client component opens it on load when the URL already has `#share`. The server render is the same either way, and opening the chat starts no run.
- The footer gains one link, "Submit a testimonial", to `/testimonials#share`. The copy lives in `siteSettings` with a shipped fallback, like the footer text.
- Metadata, the sitemap and the Markdown route (`/md/testimonials`) include the page. `robots` follows E20.

### Layout

- Desktop: the chat on the left; the draft card on the right, sticky, filling in as each fact is confirmed: photo, product, quote, name, and a checklist of what is still missing.
- Mobile: the draft card is a one-line bar above the chat ("Your testimonial · 3 of 5") that expands on tap.
- The draft card is rendered from a `data-draft` part the run writes to the stream after every tool that changes the draft. The model never writes to it.

### The conversation

The agent leads. Every fact arrives through a widget, a client-side tool with no `execute`, answered with `addToolOutput`. The visitor can always type instead; the agent then answers with the widget again.

| Tool | Kind | What happens |
|---|---|---|
| `askPhoto` | client | an upload button; the browser downsizes to `MAX_PHOTO_EDGE` px and re-encodes as JPEG through a canvas, which drops EXIF including location, then uploads to private Blob and answers the pathname |
| `analysePhoto` | server | one vision call with structured output: quality (score, issues), safety (ok, reason), `markVisible` (the store's mark, see below), candidate products (slug, confidence), a suggested alt text. Runs against the catalogue from `getAllProducts` |
| `confirmProduct` | client | the top candidate's card with its API image: Yes, or "Pick another" showing the next two and a catalogue picker |
| `askName` | client | a text input; the name is published exactly as typed |
| `reviewQuote` | client | an editable text area holding the visitor's words, or the agent's shorter suggestion when they run over 240 characters; the visitor approves the exact text |
| `checkText` | server | one small structured call: is the name or the quote abusive, obscene or a slur. A hit sends the agent back to `askName` or `reviewQuote` |
| `askConsent` | client | a checkbox: "I took this photo and allow the store to publish it with my name and words" |
| `askEmail` | client | an email input, zod-validated |
| `sendCode` | server | a 6-digit code, emailed; only its hash is kept in the run |
| `askCode` | client | six inputs; "send again" after `CODE_RESEND_SECONDS` |
| `verifyCode` | server | compares hashes; `CODE_MAX_ATTEMPTS` tries, `CODE_TTL_MINUTES` |
| `submit` | server | enabled only when the draft is complete and the email is verified; writes the submission |

Rules the agent follows, enforced by code, not by the prompt:

- **The draft lives in the run.** Only tool results change it. `submit` reads the draft, never the model's arguments, so the model cannot invent a product, a verified email or consent.
- **Photo.** An unsafe photo is refused and the visitor may try once more. A photo too blurred, dark or small to use gets one retry with the reason, then the same refusal. `MAX_PHOTO_ATTEMPTS = 2`.
- **The mark.** Every product the store sells carries its mark: a white, upward-pointing equilateral triangle on a black item, sometimes large (a book cover), sometimes small (a pen clip, a sock cuff). `MARK_DESCRIPTION` in `@repo/testimonials` states it once for the prompt. The model first answers whether the mark is visible, then which product it is from the item's type and shape, since colour does not tell the products apart. No visible mark caps every candidate below `PRODUCT_CONFIDENCE`: the agent asks for a photo that shows the triangle, then offers the picker. A lookalike (another brand's black mug, a triangle pointing down) is never matched on shape alone.
- **Product.** When no candidate reaches `PRODUCT_CONFIDENCE`, the agent asks for another photo once, then offers the picker. Several products in one photo: the visitor picks one; the agent may record the others as `products[]` after the visitor confirms them. The submission records `productSource: 'agent' | 'visitor'`.
- **Caps.** `MAX_TURNS = 20` per run. After that the agent says goodbye and the run ends.
- **Off topic.** The agent declines and steers back. It never recommends, compares or prices products.
- **Untrusted input.** The visitor's text, the photo and any text in the photo are data, never instructions (`AGENTS.md`, rule 2 applies to visitor input as it does to API data). The system prompt says so; the tool rules above are what make it hold.
- Repeat submissions from one email are allowed, because this is a demonstration. A real store would allow one pending submission per verified email.

### What the visitor receives

- Approval: "Your testimonial is live", with a link to the product page.
- Rejection: one friendly sentence naming the reason, and an invitation to try again.
- Both from `testimonials@<EMAIL_DOMAIN>`. Plain HTML and a text part, built in `lib/email/templates.ts`, no React Email.

## Moderation

### `testimonialSubmission`

`packages/sanity/src/schemas/testimonial-submission.ts`. Dotted id `testimonialSubmission.<runId>`, so anonymous clients cannot read it (`docs/adr/0004-demand-loop-runtimes.md`). Written by the run; every field read only except `status`, `rejectionReason` and `photoAlt`. Not in the create menu.

- `person`, `quote`, `products[]` (references to the product mirrors), `productSource`
- `email`, removed when the outcome email is sent
- `photoUrl`: a signed URL to `/api/testimonials/photo/<runId>?sig=…`, HMAC over the run id with `TESTIMONIAL_PHOTO_SECRET`. Valid until the blob is deleted. Unset after the decision.
- `photoAlt`, suggested by the vision call, editable
- `findings`: quality score and issues, product confidences, the text check, the model id
- `consentGiven: true`, `submittedAt`, `runId`
- `status` (`pending`, `accepted`, `rejected`), `rejectionReason` (`photo`, `product`, `content`, `other`), `decidedAt`

### Studio

- A "Submissions" folder beside Testimonials, with Pending (oldest first), Accepted and Rejected lists.
- A photo preview input that shows `photoUrl` in an `<img>`. The Studio's own CSP, if any, allows the store's origin.
- `AcceptSubmission` and `RejectSubmission` document actions, built like `idea-decision.tsx`. They patch `status` on the published document. Reject opens a dialog with the four reasons; `suggestReason(findings)` from `@repo/testimonials` preselects one when the findings point at it (low quality score: `photo`; a product the visitor picked with low confidence: `product`), and nothing otherwise. Editors never type text that goes into an email.
- The guard rails in `actions/guard-rails.ts` keep delete and duplicate off submissions.

### Decision

- `defineDocumentFunction` `submission-decided` in `sanity.blueprint.ts`: `on: ['update']`, filter `_type == 'testimonialSubmission' && status in ['accepted', 'rejected'] && delta::changedAny(status)`, projection `{_id, runId, status, rejectionReason, photoAlt}`. It POSTs that to `/api/testimonials/decision` with `TESTIMONIAL_DECISION_SECRET` and writes nothing.
- The route checks the bearer with `authorised()` from `lib/bearer.ts`, parses the body with zod and calls `resumeHook('testimonial-review:<runId>', decision)`. An unknown hook answers 404; the Function logs it.
- The run then:
  - accepted: reads the blob, uploads it with `client.assets.upload`, creates `testimonial-<runId>` with `person`, `photo` (with `photoAlt`), `quote`, `products`, `consent: true`, `publishedAt`, `submission` (a weak reference). The existing webhook revalidates `sanity:testimonial`, which covers the product page, the wall and the favourites.
  - rejected: nothing in Sanity beyond the next step.
  - both: sends the email, deletes the blob, unsets `email` and `photoUrl`, stamps `decidedAt`.
- An editor who later wants a testimonial gone unpublishes it like any other.

## Data and privacy

- The email address is never published, never logged and never sent to the model. It leaves the submission when the outcome email goes out.
- The photo is private until an editor accepts it. Sanity serves every asset of a public dataset to anyone with its URL, so nothing unmoderated is uploaded to Sanity.
- No EXIF reaches the store: the browser re-encodes before upload.
- The run's event log holds the conversation. Its retention is Vercel's (1 day on Hobby, 7 on Pro after the run completes).
- `SANITY_API_WRITE_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` and the two secrets are server only.

## Abuse

- BotID Basic: `initBotId` protects `/api/testimonials/chat`, `/upload` and the stream route; each calls `checkBotId()` and answers 403 to a bot.
- One Firewall rate-limit rule, `testimonials`, called with `checkRateLimit('testimonials', { request, rateLimitKey: sid })` in the chat and upload routes.
- Every route requires the `sid` cookie, and the chat and stream routes answer only for the run bound to that session.
- The upload route authorises the token in `onBeforeGenerateToken`: same session, a live run, JPEG only, `MAX_UPLOAD_BYTES`, at most `MAX_PHOTO_ATTEMPTS` per run.
- The run's caps above bound model spend per visitor.

## Configuration

Store, server only: `BLOB_READ_WRITE_TOKEN` (provisioned by the Blob store), `RESEND_API_KEY` (provisioned by the Marketplace integration), `EMAIL_DOMAIN`, `TESTIMONIAL_PHOTO_SECRET` and `TESTIMONIAL_DECISION_SECRET` (min 32 each). `SANITY_API_WRITE_TOKEN` already exists. All optional in `lib/env.ts`: without Blob or a write token the CTA is hidden; without `RESEND_API_KEY` the email adapter logs the code and the message instead of sending, so the flow runs end to end locally.

Sanity Function `submission-decided`: `STORE_URL`, `TESTIMONIAL_DECISION_SECRET`, set with `sanity functions env add`.

Manual setup, done once by a person:

1. Resend: install the Marketplace integration on the store project, add the subdomain `mail.<domain>`, add the SPF and DKIM records it lists (DMARC optional), wait for verification.
2. Blob: create a private store and connect it to the store project.
3. Firewall: add the rate-limit rule `testimonials` (fixed window, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_REQUESTS`).
4. Vercel: set the two secrets and `EMAIL_DOMAIN` for Production and Preview.
5. Sanity: deploy the blueprint, then `sanity functions env add submission-decided …`.

## Slices

### Slice 0: spikes

Answer on a throwaway branch and record the answers in the PR description.

1. **Workflow 5.** `@ai-sdk/workflow` 2.x requires `workflow@^5.0.0-beta.42`; the store runs `4.8.9`. Upgrade to exact pins, no range: `workflow@5.0.0-beta.57`, `@ai-sdk/workflow@2.0.47`, `@ai-sdk/react` at the matching `ai` version. Build with `cacheComponents: true`, compare the route table, run the E13 unit and integration tests, and start one demand analysis on a preview. If the build or the E13 workflow breaks, the chat runs as a plain `streamText` route with the draft in the session store, and the workflow starts at `submit`; everything after submit is unchanged. Upgrades after that are deliberate and one at a time.
2. **Multi-turn.** One run holds the whole conversation: each visitor message resumes a hook, and `WorkflowChatTransport` reconnects through `/api/testimonials/chat/<runId>/stream` after a reload. Confirm the idle timeout with `Promise.race([hook, sleep('30m')])`.
3. **Client-side tools under `WorkflowAgent`.** A tool with no `execute` pauses the run until `addToolOutput` arrives. Record whether the installed version uses `toolApproval` or `needsApproval`; this spec uses neither.
4. **Vision model.** `scripts/eval-identify.ts` in `apps/store`, run by hand, never in CI. The set:
   - the published testimonials with a photo, labelled by their `products[]` (22 on 26 Sep 2026, three with several products); the main measure
   - every product's API image, cropped, rotated, shrunk and recompressed with macOS `sips`, for products no testimonial shows
   - under `working/testimonial-eval/`, never committed, sources in its `SOURCES.md`: `unrelated/` (photos with no product in them), `near-miss/` (generic or other brands' mugs, bottles, hoodies, t-shirts, caps, totes, and catalogue images flipped so the triangle points down: the model must not claim them as ours) and `unusable/` (blurred, tiny, too dark)
   Run the set through `analysePhoto` with the two or three best vision models the Gateway free tier serves. Pick the model, set `PRODUCT_CONFIDENCE` from the results and record top-1 and top-3 accuracy per group in the PR. If top-1 on the testimonial photos is under 80 %, add a second pass that compares the photo with the images of the top five candidates. The testimonial photos are generated images and cleaner than a phone photo; the real hit rate comes from live submissions, which record the confidence and whether the visitor corrected the product.
5. **Blob client upload and CSP.** Record the origin the browser uploads to and add exactly that to `connect-src`. Check whether `handleUploadPresigned` works with OIDC, which would remove `BLOB_READ_WRITE_TOKEN`.
6. **BotID and CSP.** Record any script or connect origin BotID needs.

### Slice 1: package, schemas, Studio

- `packages/testimonials` (`@repo/testimonials`): `constants.ts` (every number named in this spec, `MODEL`), `schemas.ts` (zod for tool inputs, the photo analysis, the text check, the decision body), `prompt.ts` (the system prompt), `draft.ts` (the draft type and `applyToolResult`, pure), `reason.ts` (`suggestReason`), `store.ts` (GROQ and writes over a client passed in). No Next imports.
- `testimonialSubmission` schema; `testimonial` gains `submission` (weak reference, read only, hidden when empty). Typegen re-run.
- Studio: the Submissions folder, the photo preview input, the two actions.

### Slice 2: page and wall

- `/testimonials` with the wall, "Show more", metadata, sitemap and Markdown route.
- The footer link and its `siteSettings` field.
- The CTA and the `#share` opener with a placeholder panel. No agent yet.

### Slice 3: the conversation

- `workflows/testimonial.ts` up to `submit`, with the idle timeout.
- The routes: chat, stream, upload, photo.
- The chat island, the widgets and the draft card.
- BotID and the rate limit.
- `lib/email/send.ts` with the logging adapter; `sendCode` and `verifyCode` work locally without Resend.

### Slice 4: the decision

- The rest of the workflow: the hook, accept, reject, email, clean-up.
- `/api/testimonials/decision`, the `submission-decided` Function, the blueprint entry.
- Resend over `fetch` behind the same adapter.

### Slice 5: polish and proof

- Empty, error and offline states in the chat; keyboard and screen-reader pass (axe through Playwright).
- A Playwright run through the whole flow with the model mocked at the step boundary and the email adapter logging.
- Lighthouse on `/testimonials` with the chat closed: the same budget as the other static pages (`specs/E11-performance-verification.md`).

## Acceptance criteria

- [ ] `/testimonials` is prerendered; the build output shows it static, and the chat's JavaScript is not in its first load.
- [ ] `/testimonials#share` from the footer opens the chat; opening it starts no run.
- [ ] A visitor can go from photo to submitted in one conversation, and a reload in the middle resumes it.
- [ ] A photo of a catalogue product with its mark visible is identified and confirmed; a black item without the mark, or with the triangle pointing down, is not matched; a photo of something else leads to one retry, then the picker; the submission records which.
- [ ] An unsafe or unusable photo never reaches Sanity or an editor.
- [ ] A name or quote with abusive words is refused with a request to rephrase.
- [ ] The published quote is exactly the text the visitor approved.
- [ ] The email is verified by code before submit, never published, and gone from the submission after the decision.
- [ ] Anonymous GROQ returns nothing for `testimonialSubmission`.
- [ ] Accept publishes a testimonial with the photo in Sanity; it appears on the product page, the wall and in the favourites ranking without a redeploy.
- [ ] Reject sends the email with the reason; the blob is deleted after either decision and after an abandoned conversation.
- [ ] Off-topic requests are declined.
- [ ] No secret is prefixed `NEXT_PUBLIC_`, sent to the browser or logged.
- [ ] `pnpm verify` passes.

## Deferred

- One pending submission per email.
- Editing an accepted testimonial's text in the Studio with the submitter's consent.
- Several photos per submission.
- Languages other than English.
