import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { serverEnv } from '@/lib/env'

/**
 * Sanity's publish webhook. Editors change content in the Studio and the site
 * follows without a deploy (specs/E09-sanity-integration.md).
 *
 * Sanity signs every delivery, so this verifies the signature rather than
 * trusting a bearer token: the URL is public and the payload decides what gets
 * expired. Without a configured secret the route refuses every call.
 *
 * Register it in Sanity Manage for the production dataset on create, update and
 * delete, with the projection `{ _type, _id }`.
 */
interface Payload {
  _type?: string
  _id?: string
}

export async function POST(request: NextRequest): Promise<Response> {
  const secret = serverEnv.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return Response.json({ error: 'Not configured' }, { status: 401 })
  }

  const { isValidSignature, body } = await parseBody<Payload>(request, secret)
  if (!isValidSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  if (!body?._type || !body._id) {
    return Response.json({ error: 'Expected _type and _id' }, { status: 400 })
  }

  // A document id and its type: enough to expire the queries that read it,
  // whether it is a singleton, one product or one question.
  const tags = [`sanity:${body._type}`, `sanity:${body._id}`]
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return Response.json({ revalidated: tags, at: new Date().toISOString() })
}
