---
status: accepted
date: 2026-09-26
---

# A testimonial submission is one durable run, and its photo stays in private Blob until an editor accepts it

The testimonial agent (specs/E25-testimonial-agent.md) spans minutes of conversation and then days of waiting for an editor. Two choices shape everything else: where that process lives, and where the visitor's photo lives while nobody has looked at it.

## One run per submission

The conversation, the submit, the wait for the editor, the email and the clean-up are one Vercel Workflow run. The agent is a `WorkflowAgent` from `@ai-sdk/workflow`, so each model call and tool call is a step: a reload resumes the stream, and a failed model call retries without losing the conversation. After submit, the run waits on the hook `testimonial-review:<runId>`. A wait costs nothing and has no time limit, so a submission an editor opens two weeks later still finishes. The Studio's Accept and Reject patch `status`; a Sanity Function turns that into a call that resumes the hook, as `gap-threshold` does for the demand loop (`docs/adr/0004-demand-loop-runtimes.md`). The run holds the credentials, so the Function carries only a shared secret.

The draft lives in the run and only tool results change it. `submit` reads the draft, never the model's arguments, so the model cannot publish a product, a verified email or consent the visitor never gave.

One run also means one trace per submission in the Vercel dashboard, from first message to email.

## The photo

Sanity serves every asset in a public dataset to anyone who has its URL, whatever document refers to it. A photo uploaded to Sanity at submit would be on a public CDN before an editor saw it. The photo therefore goes to a private Vercel Blob store at upload, and the Studio shows it through a store route with a signed URL written onto the private submission. Only when an editor accepts does the run copy it into Sanity assets, where every other editorial photo lives. After any decision, or an abandoned conversation, the blob is deleted.

The browser downsizes and re-encodes the photo before upload, which removes EXIF data, including location.

## Considered options

- A `streamText` route for the chat, with the draft in the session store, and a workflow started at submit. Fewer moving parts and no dependency on Workflow 5, but a dropped connection loses the turn in flight, and the conversation has no durable record. This is the fallback if the Workflow 5 upgrade fails its spike.
- The agent loop written by hand on stable Workflow 4: a step per model call, a hook per widget answer. The same durability in about a hundred lines and no beta; `WorkflowAgent` was chosen because this store demonstrates the platform's current affordances.
- Two runs, one for the conversation and one for the review. Nothing is gained: the second run would start from data the first already holds.
- The photo in Sanity from the start. Where the other photos are, but public before moderation.
- Writing visitor submissions as `testimonial` documents with a status. Every public query would have to filter on status forever, and the email address would sit in a type the store reads anonymously.

## Consequences

- `@ai-sdk/workflow` requires Workflow 5, which is in beta while 4.x is the stable line. The store pins both packages to exact versions and upgrades them deliberately; the demand loop moves to Workflow 5 too. Pinning freezes the SDK, not Vercel's hosted workflow backend, which a beta SDK depends on; the `streamText` fallback above is the way out if that changes under us.
- Resend is a new vendor for the verification code and the outcome emails. Vercel has no email product; it is installed from the Vercel Marketplace and called over `fetch`, with an adapter that logs instead of sending when no key is set.
- The email address is removed from the submission once the outcome email is sent.
